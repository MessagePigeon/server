from datetime import timedelta

from sqlalchemy import func
from sqlmodel import select

from app.core.errors import not_found
from app.core.pagination import PageParams, make_page
from app.models import Message, MessageStudentLink, Student, StudentRemark, Teacher, _now
from app.state import delete_by_id, find_by_id, state
from app.ws.send import socket_send

_REQUEST_TTL = timedelta(hours=3)


async def get_me(session, student_id: str) -> dict:
    student = await session.get(Student, student_id)
    return {"defaultRemark": student.defaultRemark}


def get_connect_code(student_id: str) -> dict:
    online = find_by_id(state.online_students, student_id)
    if online is None:
        raise not_found("NOT_ONLINE", "Student is not online")
    return {"connectCode": online.connectCode}


def _take_valid_request(student_id: str, request_id: str):
    cr = find_by_id(state.connect_requests, request_id)
    if cr is None or cr.studentId != student_id:
        raise not_found("REQUEST_NOT_FOUND", "Connect request not found")
    if _now() - cr.createdAt >= _REQUEST_TTL:
        delete_by_id(state.connect_requests, request_id)
        raise not_found("REQUEST_NOT_FOUND", "Connect request not found")
    return cr


async def accept_request(session, student_id: str, request_id: str) -> dict:
    cr = _take_valid_request(student_id, request_id)
    session.add(
        StudentRemark(remark=cr.remark, teacherId=cr.teacherId, studentId=cr.studentId)
    )
    await session.commit()
    teacher = await session.get(Teacher, cr.teacherId)
    delete_by_id(state.connect_requests, request_id)
    await socket_send(
        "teacher", cr.teacherId, "connect-request-accepted", {"requestId": request_id}
    )
    return {"teacherId": cr.teacherId, "teacherName": teacher.name}


async def reject_request(student_id: str, request_id: str) -> None:
    cr = _take_valid_request(student_id, request_id)
    delete_by_id(state.connect_requests, request_id)
    await socket_send(
        "teacher", cr.teacherId, "connect-request-rejected", {"requestId": request_id}
    )


async def teachers(session, student_id: str, page: PageParams) -> dict:
    base = (
        select(Teacher.id, Teacher.name)
        .join(StudentRemark, StudentRemark.teacherId == Teacher.id)
        .where(StudentRemark.studentId == student_id)
    )
    total = (await session.exec(select(func.count()).select_from(base.subquery()))).one()
    rows = (await session.exec(base.offset(page.skip).limit(page.take))).all()
    data = [{"id": tid, "name": name} for tid, name in rows]
    return make_page(data, total, page)


async def messages(session, student_id: str, page: PageParams) -> dict:
    base = (
        select(Message)
        .join(MessageStudentLink, MessageStudentLink.messageId == Message.id)
        .where(MessageStudentLink.studentId == student_id)
    )
    total = (await session.exec(select(func.count()).select_from(base.subquery()))).one()
    msgs = (
        await session.exec(
            base.order_by(Message.createdAt.desc()).offset(page.skip).limit(page.take)
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
    return make_page(data, total, page)


def can_close_message(student_id: str, message_id: int) -> bool:
    msg = find_by_id(state.showing_messages, message_id)
    return (
        msg is not None
        and student_id in msg.studentIds
        and student_id not in msg.closedStudentIds
    )
