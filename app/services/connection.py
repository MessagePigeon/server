from sqlmodel import select

from app.core.errors import conflict, not_found
from app.models import Student, StudentRemark, Teacher
from app.state import state
from app.ws.send import socket_send


async def is_connected(session, teacher_id: str, student_id: str) -> bool:
    row = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == teacher_id,
                StudentRemark.studentId == student_id,
            )
        )
    ).first()
    return row is not None


async def make_connection(session, teacher_id: str, student_id: str) -> None:
    teacher = await session.get(Teacher, teacher_id)
    if teacher is None:
        raise not_found("TEACHER_NOT_FOUND", "Teacher not found")
    student = await session.get(Student, student_id)
    if student is None:
        raise not_found("STUDENT_NOT_FOUND", "Student not found")
    if await is_connected(session, teacher_id, student_id):
        raise conflict("ALREADY_CONNECTED", "Already connected")

    remark = student.defaultRemark
    session.add(StudentRemark(remark=remark, teacherId=teacher_id, studentId=student_id))
    await session.commit()

    await socket_send(
        "student", student_id, "teacher-connected",
        {"teacherId": teacher_id, "teacherName": teacher.name},
    )
    online = student_id in {s.id for s in state.online_students}
    await socket_send(
        "teacher", teacher_id, "student-connected",
        {"studentId": student_id, "remark": remark, "online": online},
    )


async def break_connection(session, teacher_id: str, student_id: str) -> None:
    if await session.get(Teacher, teacher_id) is None:
        raise not_found("TEACHER_NOT_FOUND", "Teacher not found")
    if await session.get(Student, student_id) is None:
        raise not_found("STUDENT_NOT_FOUND", "Student not found")
    row = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == teacher_id,
                StudentRemark.studentId == student_id,
            )
        )
    ).first()
    if row is None:
        raise conflict("NOT_CONNECTED", "Not connected")
    await session.delete(row)
    await session.commit()

    await socket_send("student", student_id, "teacher-disconnected", {"teacherId": teacher_id})
    await socket_send("teacher", teacher_id, "student-disconnected", {"studentId": student_id})
