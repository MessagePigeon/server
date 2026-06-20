from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func
from sqlmodel import select

from app.config import settings
from app.deps import Session, StudentId
from app.models import Message, MessageStudentLink, Student, StudentRemark, Teacher
from app.schemas import AnswerConnectRequest, CloseMessage, StudentLogin
from app.security import sign_jwt_with_id
from app.state import delete_by_id, find_by_id, state
from app.ws.service import socket_send, student_close_message

router = APIRouter(prefix="/student", tags=["student"])
SUCCESS = {"success": True}


def _request_permitted(student_id: str, request_id: str) -> bool:
    cr = find_by_id(state.connect_requests, request_id)
    return cr is not None and cr.studentId == student_id


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(body: StudentLogin, session: Session):
    student = (
        await session.exec(select(Student).where(Student.key == body.key))
    ).first()
    if student is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Key Not Found")
    if student.ban:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Student Banned")
    return sign_jwt_with_id(student.id)


@router.get("/init")
async def init(user_id: StudentId, session: Session):
    student = await session.get(Student, user_id)
    return {"defaultRemark": student.defaultRemark}


@router.get("/connect-code")
async def find_connect_code(user_id: StudentId):
    online = find_by_id(state.online_students, user_id)
    if online is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Connect Code Not Found")
    return {"connectCode": online.connectCode}


@router.post("/connect-request-rejection")
async def reject_connect_request(body: AnswerConnectRequest, user_id: StudentId):
    if not _request_permitted(user_id, body.requestId):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request Not Found")
    cr = find_by_id(state.connect_requests, body.requestId)
    delete_by_id(state.connect_requests, body.requestId)
    await socket_send(
        "teacher", cr.teacherId, "reject-connect-request", {"requestId": body.requestId}
    )
    return SUCCESS


@router.post("/connect-request-acceptance")
async def accept_connect_request(body: AnswerConnectRequest, user_id: StudentId, session: Session):
    if not _request_permitted(user_id, body.requestId):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request Not Found")
    cr = find_by_id(state.connect_requests, body.requestId)
    session.add(
        StudentRemark(remark=cr.remark, teacherId=cr.teacherId, studentId=cr.studentId)
    )
    await session.commit()
    teacher = await session.get(Teacher, cr.teacherId)
    delete_by_id(state.connect_requests, body.requestId)
    await socket_send(
        "teacher", cr.teacherId, "accept-connect-request", {"requestId": body.requestId}
    )
    return {"teacherId": cr.teacherId, "teacherName": teacher.name}


@router.get("/teachers")
async def find_teachers(user_id: StudentId, session: Session):
    rows = (
        await session.exec(
            select(Teacher.id, Teacher.name)
            .join(StudentRemark, StudentRemark.teacherId == Teacher.id)
            .where(StudentRemark.studentId == user_id)
        )
    ).all()
    return [{"id": tid, "name": name} for tid, name in rows]


@router.post("/message-close")
async def close_message(body: CloseMessage, user_id: StudentId):
    msg = find_by_id(state.showing_messages, body.messageId)
    permitted = (
        msg is not None
        and user_id in msg.studentIds
        and user_id not in msg.closedStudentIds
    )
    if not permitted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message Id Not Found")
    await student_close_message(user_id, body.messageId)
    return SUCCESS


@router.get("/messages")
async def find_messages(user_id: StudentId, session: Session, skip: int, take: int):
    total = (
        await session.exec(
            select(func.count())
            .select_from(Message)
            .join(MessageStudentLink, MessageStudentLink.messageId == Message.id)
            .where(MessageStudentLink.studentId == user_id)
        )
    ).one()
    msgs = (
        await session.exec(
            select(Message)
            .join(MessageStudentLink, MessageStudentLink.messageId == Message.id)
            .where(MessageStudentLink.studentId == user_id)
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
                "teacherName": teacher.name,
            }
        )
    return {"data": data, "total": total}


@router.get("/teacher-url")
async def get_teacher_url(user_id: StudentId):
    return {"url": settings.TEACHER_URL}
