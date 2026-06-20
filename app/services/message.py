from sqlmodel import select

from app.core.errors import not_found
from app.db import async_session
from app.models import StudentRemark
from app.state import delete_by_id, find_by_id, state
from app.utils import sets_equal
from app.ws.send import socket_send


async def connected_teacher_ids(student_id: str) -> list[str]:
    async with async_session() as session:
        result = await session.exec(
            select(StudentRemark.teacherId).where(StudentRemark.studentId == student_id)
        )
        return list(result.all())


async def student_close_message(student_id: str, message_id: int) -> None:
    """A student closes a message -> notify the teacher."""
    msg = find_by_id(state.showing_messages, message_id)
    if not msg:
        return
    msg.closedStudentIds.add(student_id)
    if sets_equal(msg.studentIds, msg.closedStudentIds):
        delete_by_id(state.showing_messages, message_id)
    await socket_send(
        "teacher", msg.teacherId, "message-closed",
        {"messageId": message_id, "studentId": student_id},
    )


async def teacher_close_message(teacher_id: str, message_id: int, student_id: str) -> None:
    """A teacher force-closes a message for a student -> notify the student.

    Ownership-checked: the message must belong to this teacher and target a real recipient.
    """
    msg = find_by_id(state.showing_messages, message_id)
    if not msg or msg.teacherId != teacher_id or student_id not in msg.studentIds:
        raise not_found("MESSAGE_NOT_FOUND", "Message not found")
    msg.closedStudentIds.add(student_id)
    if sets_equal(msg.studentIds, msg.closedStudentIds):
        delete_by_id(state.showing_messages, message_id)
    await socket_send("student", student_id, "message-closed", {"messageId": message_id})
