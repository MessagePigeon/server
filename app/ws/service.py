import json

from fastapi import WebSocket
from sqlmodel import select

from app.db import async_session
from app.models import StudentRemark
from app.state import (
    OnlineClient,
    OnlineStudent,
    OnlineTeacher,
    Role,
    delete_by_id,
    find_by_id,
    state,
)
from app.utils import generate_random_string, sets_equal


async def _safe_send(ws: WebSocket, payload: str) -> None:
    try:
        await ws.send_text(payload)
    except Exception:
        pass


async def socket_send(role: Role, id: str, event: str, data: dict | None = None) -> None:
    online_ids = [c.id for c in state.online_clients]
    if id not in online_ids:
        return
    payload = json.dumps({"event": event, "data": data})
    if role == "teacher":
        teacher = find_by_id(state.online_teachers, id)
        if teacher:
            for client in list(teacher.clients):
                await _safe_send(client, payload)
    else:
        student = find_by_id(state.online_students, id)
        if student:
            await _safe_send(student.client, payload)


async def _connected_teacher_ids(student_id: str) -> list[str]:
    async with async_session() as session:
        result = await session.exec(
            select(StudentRemark.teacherId).where(StudentRemark.studentId == student_id)
        )
        return list(result.all())


# ---- message close (shared by student router, teacher router, and ws offline) ----
async def student_close_message(student_id: str, message_id: int) -> None:
    """Student closes a message -> notify the teacher."""
    msg = find_by_id(state.showing_messages, message_id)
    if not msg:
        return
    msg.closedStudentIds.add(student_id)
    if sets_equal(msg.studentIds, msg.closedStudentIds):
        delete_by_id(state.showing_messages, message_id)
    await socket_send(
        "teacher", msg.teacherId, "message-close",
        {"messageId": message_id, "studentId": student_id},
    )


async def teacher_close_message(message_id: int, student_id: str) -> None:
    """Teacher force-closes a message -> notify the student."""
    msg = find_by_id(state.showing_messages, message_id)
    if not msg:
        return
    msg.closedStudentIds.add(student_id)
    if sets_equal(msg.studentIds, msg.closedStudentIds):
        delete_by_id(state.showing_messages, message_id)
    await socket_send("student", student_id, "close-message", {"messageId": message_id})


# ---- online / offline lifecycle ----
def client_online(role: Role, id: str, client: WebSocket) -> None:
    state.online_clients.append(OnlineClient(id=id, role=role, client=client))


async def client_offline(client: WebSocket) -> None:
    client_data = next((c for c in state.online_clients if c.client is client), None)
    if client_data is None:
        return
    if client_data.role == "student":
        await _student_offline(client_data.id)
    else:
        _teacher_offline(client_data.id, client)
    index = next(
        (i for i, c in enumerate(state.online_clients) if c.client is client), None
    )
    if index is not None:
        del state.online_clients[index]


async def _student_offline(student_id: str) -> None:
    delete_by_id(state.online_students, student_id)
    # Close all received messages
    for msg in [m for m in state.showing_messages if student_id in m.studentIds]:
        if student_id not in msg.closedStudentIds:
            await student_close_message(student_id, msg.id)
    # Notify connected teachers that this student is offline
    for teacher_id in await _connected_teacher_ids(student_id):
        await socket_send("teacher", teacher_id, "student-offline", {"studentId": student_id})


def _teacher_offline(id: str, client: WebSocket) -> None:
    teacher = find_by_id(state.online_teachers, id)
    if not teacher:
        return
    if len(teacher.clients) == 1:
        delete_by_id(state.online_teachers, id)
    else:
        teacher.clients.discard(client)


async def student_online(student_id: str, client: WebSocket) -> None:
    existing = find_by_id(state.online_students, student_id)
    connect_code = generate_random_string(6)
    if existing:
        await socket_send("student", student_id, "logout")
        await client_offline(existing.client)
    state.online_students.append(
        OnlineStudent(id=student_id, client=client, connectCode=connect_code)
    )
    for teacher_id in await _connected_teacher_ids(student_id):
        await socket_send("teacher", teacher_id, "student-online", {"studentId": student_id})


def teacher_online(id: str, client: WebSocket) -> None:
    teacher = find_by_id(state.online_teachers, id)
    if teacher:
        teacher.clients.add(client)
    else:
        state.online_teachers.append(OnlineTeacher(id=id, clients={client}))
