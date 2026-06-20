from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.config import settings
from app.deps import AdminAuth, Session
from app.models import Message, MessageStudentLink, RegisterCode, Student, StudentRemark, Teacher
from app.schemas import (
    BanStudentOrTeacher,
    GenerateRegisterCodes,
    GenerateStudent,
    GenerateTeacher,
    LoginAdmin,
    ModifyConnection,
    ModifyStudent,
    ModifyTeacherName,
    ResetTeacherPassword,
)
from app.security import hash_password, sign_admin_jwt
from app.state import state
from app.utils import generate_random_string, parse_iso
from app.routers.teacher import modify_teacher_name
from app.ws.service import socket_send

router = APIRouter(prefix="/admin", tags=["admin"])
SUCCESS = {"success": True}


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(body: LoginAdmin):
    if body.password == settings.ADMIN_PASSWORD:
        return sign_admin_jwt()
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Password Incorrect")


@router.get("/init")
async def init(_: AdminAuth):
    return SUCCESS


@router.post("/teacher/register-codes")
async def generate_register_codes(body: GenerateRegisterCodes, _: AdminAuth, session: Session):
    for _i in range(body.count):
        session.add(RegisterCode(code=generate_random_string(32)))
    await session.commit()
    return SUCCESS


@router.get("/teacher/register-codes")
async def find_register_codes(_: AdminAuth, session: Session, skip: int, take: int):
    data = (
        await session.exec(
            select(RegisterCode).order_by(RegisterCode.id.desc()).offset(skip).limit(take)
        )
    ).all()
    total = (await session.exec(select(func.count()).select_from(RegisterCode))).one()
    return {"data": data, "total": total}


@router.delete("/teacher/register-code", status_code=status.HTTP_204_NO_CONTENT)
async def delete_register_code(id: int, _: AdminAuth, session: Session):
    code = await session.get(RegisterCode, id)
    if code is not None:
        await session.delete(code)
        await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/teacher")
async def create_teacher(body: GenerateTeacher, _: AdminAuth, session: Session):
    exists = (
        await session.exec(select(Teacher).where(Teacher.username == body.username))
    ).first()
    if exists is not None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Username Repeated")
    password = generate_random_string(8)
    session.add(
        Teacher(username=body.username, password=hash_password(password), name=body.name)
    )
    await session.commit()
    return {"password": password}


@router.get("/teachers")
async def find_teachers(
    _: AdminAuth,
    session: Session,
    skip: int,
    take: int,
    id: str | None = None,
    username: str | None = None,
    name: str | None = None,
):
    query = select(Teacher)
    if id is not None:
        query = query.where(Teacher.id == id)
    if username is not None:
        query = query.where(Teacher.username.contains(username))
    if name is not None:
        query = query.where(Teacher.name.contains(name))

    teachers = (
        await session.exec(query.order_by(Teacher.createdAt.desc()).offset(skip).limit(take))
    ).all()
    total = (
        await session.exec(select(func.count()).select_from(query.subquery()))
    ).one()

    online_ids = {t.id for t in state.online_teachers}
    data = []
    for t in teachers:
        student_rows = (
            await session.exec(
                select(Student.id, Student.defaultRemark)
                .join(StudentRemark, StudentRemark.studentId == Student.id)
                .where(StudentRemark.teacherId == t.id)
            )
        ).all()
        data.append(
            {
                "id": t.id,
                "username": t.username,
                "name": t.name,
                "students": [{"id": sid, "defaultRemark": dr} for sid, dr in student_rows],
                "ban": t.ban,
                "online": t.id in online_ids,
            }
        )
    return {"data": data, "total": total}


@router.patch("/teacher/name")
async def modify_teacher_name_route(body: ModifyTeacherName, _: AdminAuth, session: Session):
    await modify_teacher_name(session, body.id, body.newName)
    return SUCCESS


@router.patch("/teacher/password")
async def reset_teacher_password(body: ResetTeacherPassword, _: AdminAuth, session: Session):
    teacher = await session.get(Teacher, body.id)
    new_password = generate_random_string(8)
    teacher.password = hash_password(new_password)
    session.add(teacher)
    await session.commit()
    return {"username": teacher.username, "newPassword": new_password}


@router.post("/student")
async def create_student(body: GenerateStudent, _: AdminAuth, session: Session):
    key = body.key if body.key is not None else generate_random_string(16)
    exists = (await session.exec(select(Student).where(Student.key == key))).first()
    if exists is not None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Key Repeated")
    session.add(Student(key=key, defaultRemark=body.defaultRemark))
    await session.commit()
    return {"key": key, "defaultRemark": body.defaultRemark}


@router.get("/students")
async def find_students(
    _: AdminAuth,
    session: Session,
    skip: int,
    take: int,
    id: str | None = None,
    defaultRemark: str | None = None,
):
    query = select(Student)
    if id is not None:
        query = query.where(Student.id == id)
    if defaultRemark is not None:
        query = query.where(Student.defaultRemark.contains(defaultRemark))

    students = (
        await session.exec(query.order_by(Student.createdAt.desc()).offset(skip).limit(take))
    ).all()
    total = (
        await session.exec(select(func.count()).select_from(query.subquery()))
    ).one()

    online_ids = {s.id for s in state.online_students}
    data = []
    for s in students:
        teacher_rows = (
            await session.exec(
                select(Teacher.id, Teacher.name)
                .join(StudentRemark, StudentRemark.teacherId == Teacher.id)
                .where(StudentRemark.studentId == s.id)
            )
        ).all()
        data.append(
            {
                "id": s.id,
                "key": s.key,
                "defaultRemark": s.defaultRemark,
                "teachers": [{"id": tid, "name": n} for tid, n in teacher_rows],
                "ban": s.ban,
                "online": s.id in online_ids,
            }
        )
    return {"data": data, "total": total}


@router.patch("/student")
async def modify_student(body: ModifyStudent, _: AdminAuth, session: Session):
    student = await session.get(Student, body.id)
    if body.key is not None:
        student.key = body.key
    if body.defaultRemark is not None:
        student.defaultRemark = body.defaultRemark
    session.add(student)
    await session.commit()
    return SUCCESS


async def _is_connected(session: Session, student_id: str, teacher_id: str) -> bool:
    row = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == teacher_id,
                StudentRemark.studentId == student_id,
            )
        )
    ).first()
    return row is not None


@router.post("/connection")
async def make_connection(body: ModifyConnection, _: AdminAuth, session: Session):
    teacher = await session.get(Teacher, body.teacherId)
    if teacher is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher Id Not Found")
    student = await session.get(Student, body.studentId)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student Id Not Found")
    if await _is_connected(session, body.studentId, body.teacherId):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Already Connected")

    remark = student.defaultRemark
    session.add(
        StudentRemark(remark=remark, teacherId=body.teacherId, studentId=body.studentId)
    )
    await session.commit()
    await socket_send(
        "student", body.studentId, "teacher-connect-by-admin",
        {"teacherId": body.teacherId, "teacherName": teacher.name},
    )
    online = body.studentId in {s.id for s in state.online_students}
    await socket_send(
        "teacher", body.teacherId, "student-connect-by-admin",
        {"studentId": body.studentId, "remark": remark, "online": online},
    )
    return SUCCESS


@router.post("/disconnection", status_code=status.HTTP_204_NO_CONTENT)
async def make_disconnection(body: ModifyConnection, _: AdminAuth, session: Session):
    teacher = await session.get(Teacher, body.teacherId)
    if teacher is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher Id Not Found")
    student = await session.get(Student, body.studentId)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student Id Not Found")
    row = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == body.teacherId,
                StudentRemark.studentId == body.studentId,
            )
        )
    ).first()
    if row is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not Connected Yet")
    await session.delete(row)
    await session.commit()
    await socket_send(
        "student", body.studentId, "teacher-disconnect", {"teacherId": body.teacherId}
    )
    await socket_send(
        "teacher", body.teacherId, "student-disconnect-by-admin", {"studentId": body.studentId}
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/messages")
async def find_messages(
    _: AdminAuth,
    session: Session,
    skip: int,
    take: int,
    teacherId: str | None = None,
    studentId: str | None = None,
    startTime: str | None = None,
    endTime: str | None = None,
    message: str | None = None,
):
    query = select(Message)
    if teacherId is not None:
        query = query.where(Message.teacherId == teacherId)
    if studentId is not None:
        query = query.where(
            Message.id.in_(
                select(MessageStudentLink.messageId).where(
                    MessageStudentLink.studentId == studentId
                )
            )
        )
    if startTime is not None:
        query = query.where(Message.createdAt >= parse_iso(startTime))
    if endTime is not None:
        query = query.where(Message.createdAt <= parse_iso(endTime))
    if message is not None:
        query = query.where(Message.message.contains(message))

    total = (await session.exec(select(func.count()).select_from(query.subquery()))).one()
    msgs = (
        await session.exec(
            query.options(selectinload(Message.students))
            .order_by(Message.createdAt.desc())
            .offset(skip)
            .limit(take)
        )
    ).all()
    data = []
    for m in msgs:
        teacher = await session.get(Teacher, m.teacherId)
        data.append(
            {
                "id": m.id,
                "createdAt": m.createdAt,
                "message": m.message,
                "teacher": {"id": teacher.id, "name": teacher.name},
                "students": [
                    {"id": s.id, "defaultRemark": s.defaultRemark} for s in m.students
                ],
            }
        )
    return {"data": data, "total": total}


@router.patch("/teacher/ban")
async def ban_teacher(body: BanStudentOrTeacher, _: AdminAuth, session: Session):
    if body.ban:
        await socket_send("teacher", body.id, "logout")
    teacher = await session.get(Teacher, body.id)
    teacher.ban = body.ban
    session.add(teacher)
    await session.commit()
    return SUCCESS


@router.patch("/student/ban")
async def ban_student(body: BanStudentOrTeacher, _: AdminAuth, session: Session):
    if body.ban:
        await socket_send("student", body.id, "logout")
    student = await session.get(Student, body.id)
    student.ban = body.ban
    session.add(student)
    await session.commit()
    return SUCCESS
