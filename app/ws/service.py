"""WebSocket connection lifecycle: online/offline bookkeeping over the in-memory state."""

from fastapi import WebSocket

from app.services.message import connected_teacher_ids, student_close_message
from app.state import (
    OnlineClient,
    OnlineStudent,
    OnlineTeacher,
    Role,
    delete_by_id,
    find_by_id,
    state,
)
from app.utils import generate_random_string
from app.ws.send import CLOSE_REPLACED, _safe_close, socket_send


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
    for msg in [m for m in state.showing_messages if student_id in m.studentIds]:
        if student_id not in msg.closedStudentIds:
            await student_close_message(student_id, msg.id)
    for teacher_id in await connected_teacher_ids(student_id):
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
    if existing:
        # One active connection per student: drop the previous one explicitly,
        # then close its socket so the old client knows it was replaced.
        old_client = existing.client
        await _student_offline(student_id)
        old_index = next(
            (i for i, c in enumerate(state.online_clients) if c.client is old_client),
            None,
        )
        if old_index is not None:
            del state.online_clients[old_index]
        await _safe_close(old_client, CLOSE_REPLACED)

    state.online_students.append(
        OnlineStudent(id=student_id, client=client, connectCode=generate_random_string(6))
    )
    for teacher_id in await connected_teacher_ids(student_id):
        await socket_send("teacher", teacher_id, "student-online", {"studentId": student_id})


def teacher_online(id: str, client: WebSocket) -> None:
    teacher = find_by_id(state.online_teachers, id)
    if teacher:
        teacher.clients.add(client)
    else:
        state.online_teachers.append(OnlineTeacher(id=id, clients={client}))
