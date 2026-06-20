from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.deps import Session, TeacherId
from app.models import Message, RegisterCode, Student, StudentRemark, Teacher
from app.schemas import (
    ConnectStudent,
    LoginTeacher,
    ModifyName,
    ModifyPassword,
    ModifyStudentRemark,
    RegisterTeacher,
    SendMessage,
    CloseMessageByTeacher,
)
from app.security import hash_password, sign_jwt_with_id, verify_password
from app.state import ConnectRequest, ShowingMessage, find_by_id, state
from app.utils import nanoid
from app.ws.service import socket_send, teacher_close_message
from app.models import _now

router = APIRouter(prefix="/teacher", tags=["teacher"])
SUCCESS = {"success": True}


async def modify_teacher_name(session: Session, teacher_id: str, new_name: str) -> None:
    """Shared by teacher self-edit and admin edit: notify connected students, then update."""
    student_ids = (
        await session.exec(
            select(StudentRemark.studentId).where(StudentRemark.teacherId == teacher_id)
        )
    ).all()
    for sid in student_ids:
        await socket_send(
            "student", sid, "teacher-name-changed",
            {"teacherId": teacher_id, "newName": new_name},
        )
    teacher = await session.get(Teacher, teacher_id)
    teacher.name = new_name
    session.add(teacher)
    await session.commit()


@router.post("/register")
async def register(body: RegisterTeacher, session: Session):
    code = (
        await session.exec(select(RegisterCode).where(RegisterCode.code == body.registerCode))
    ).first()
    if code is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Register Code Invalid")
    exists = (
        await session.exec(select(Teacher).where(Teacher.username == body.username))
    ).first()
    if exists is not None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Username Repeated")
    await session.delete(code)
    session.add(
        Teacher(username=body.username, password=hash_password(body.password), name=body.name)
    )
    await session.commit()
    return SUCCESS


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(body: LoginTeacher, session: Session):
    teacher = (
        await session.exec(select(Teacher).where(Teacher.username == body.username))
    ).first()
    if teacher is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Username Not Found")
    if teacher.ban:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Teacher Banned")
    if not verify_password(teacher.password, body.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Password Incorrect")
    return sign_jwt_with_id(teacher.id)


@router.get("/init")
async def init(user_id: TeacherId, session: Session):
    teacher = await session.get(Teacher, user_id)
    return {"name": teacher.name}


@router.patch("/name")
async def modify_name(body: ModifyName, user_id: TeacherId, session: Session):
    await modify_teacher_name(session, user_id, body.newName)
    return SUCCESS


@router.patch("/password")
async def modify_password(body: ModifyPassword, user_id: TeacherId, session: Session):
    teacher = await session.get(Teacher, user_id)
    if not verify_password(teacher.password, body.oldPassword):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Old Password Incorrect")
    teacher.password = hash_password(body.newPassword)
    session.add(teacher)
    await session.commit()
    return SUCCESS


@router.post("/connect-request")
async def send_connect_request(body: ConnectStudent, user_id: TeacherId, session: Session):
    online_student = next(
        (s for s in state.online_students if s.connectCode == body.connectCode), None
    )
    if online_student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Connect Code Not Found")
    already = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == user_id,
                StudentRemark.studentId == online_student.id,
            )
        )
    ).first()
    if already is not None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Student Already Connected")

    request_id = nanoid()
    state.connect_requests.append(
        ConnectRequest(
            id=request_id,
            teacherId=user_id,
            studentId=online_student.id,
            remark=body.remark,
            createdAt=_now(),
        )
    )
    teacher = await session.get(Teacher, user_id)
    await socket_send(
        "student", online_student.id, "connect-request",
        {"requestId": request_id, "teacherName": teacher.name},
    )
    return {"requestId": request_id, "studentId": online_student.id, "remark": body.remark}


@router.get("/students")
async def find_students(user_id: TeacherId, session: Session):
    rows = (
        await session.exec(
            select(StudentRemark.studentId, StudentRemark.remark)
            .where(StudentRemark.teacherId == user_id)
            .order_by(StudentRemark.createdAt.desc())
        )
    ).all()
    online_ids = {s.id for s in state.online_students}
    return [
        {"online": sid in online_ids, "id": sid, "remark": remark}
        for sid, remark in rows
    ]


@router.post("/message")
async def send_message(body: SendMessage, user_id: TeacherId, session: Session):
    students = (
        await session.exec(select(Student).where(Student.id.in_(body.studentIds)))
    ).all()
    msg = Message(message=body.message, teacherId=user_id)
    msg.students = list(students)
    session.add(msg)
    await session.commit()
    await session.refresh(msg)

    teacher = await session.get(Teacher, user_id)
    state.showing_messages.append(
        ShowingMessage(
            id=msg.id,
            teacherId=user_id,
            studentIds=set(body.studentIds),
            closedStudentIds=set(),
            createdAt=msg.createdAt,
        )
    )
    for sid in body.studentIds:
        await socket_send(
            "student", sid, "message",
            {
                "messageId": msg.id,
                "createdAt": msg.createdAt.isoformat(),
                "message": body.message,
                "teacherName": teacher.name,
                "tts": body.tts,
                "closeDelay": body.closeDelay,
            },
        )
    return {
        "messageId": msg.id,
        "createdAt": msg.createdAt,
        "message": body.message,
        "studentIds": body.studentIds,
    }


@router.patch("/student/remark")
async def modify_student_remark(body: ModifyStudentRemark, user_id: TeacherId, session: Session):
    remark = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == user_id,
                StudentRemark.studentId == body.studentId,
            )
        )
    ).first()
    if remark is not None:
        remark.remark = body.newRemark
        session.add(remark)
        await session.commit()
    return SUCCESS


@router.delete("/student", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(studentId: str, user_id: TeacherId, session: Session):
    remark = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == user_id,
                StudentRemark.studentId == studentId,
            )
        )
    ).first()
    if remark is not None:
        await session.delete(remark)
        await session.commit()
    await socket_send("student", studentId, "teacher-disconnect", {"teacherId": user_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/messages")
async def find_messages(user_id: TeacherId, session: Session, skip: int, take: int):
    total = (
        await session.exec(
            select(func.count()).select_from(Message).where(Message.teacherId == user_id)
        )
    ).one()
    msgs = (
        await session.exec(
            select(Message)
            .options(selectinload(Message.students))
            .where(Message.teacherId == user_id)
            .order_by(Message.createdAt.desc())
            .offset(skip)
            .limit(take)
        )
    ).all()
    data = []
    for m in msgs:
        showing_ids: list[str] = []
        ms = find_by_id(state.showing_messages, m.id)
        if ms:
            showing_ids = [s for s in ms.studentIds if s not in ms.closedStudentIds]
        data.append(
            {
                "id": m.id,
                "createdAt": m.createdAt,
                "message": m.message,
                "studentIds": [s.id for s in m.students],
                "showingIds": showing_ids,
            }
        )
    return {"data": data, "total": total}


@router.post("/message-close")
async def close_message(body: CloseMessageByTeacher, user_id: TeacherId):
    await teacher_close_message(body.messageId, body.studentId)
    return SUCCESS
