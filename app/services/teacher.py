from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.errors import conflict, forbidden, not_found
from app.core.pagination import PageParams, make_page
from app.core.security import hash_password, verify_password
from app.models import Message, Student, StudentRemark, Teacher, _now
from app.state import ConnectRequest, ShowingMessage, find_by_id, state
from app.utils import nanoid
from app.ws.send import socket_send


async def get_me(session, teacher_id: str) -> dict:
    teacher = await session.get(Teacher, teacher_id)
    return {"name": teacher.name}


async def update_name(session, teacher_id: str, name: str) -> None:
    student_ids = (
        await session.exec(
            select(StudentRemark.studentId).where(StudentRemark.teacherId == teacher_id)
        )
    ).all()
    for sid in student_ids:
        await socket_send(
            "student", sid, "teacher-name-changed", {"teacherId": teacher_id, "name": name}
        )
    teacher = await session.get(Teacher, teacher_id)
    teacher.name = name
    session.add(teacher)
    await session.commit()


async def change_password(session, teacher_id: str, old: str, new: str) -> None:
    teacher = await session.get(Teacher, teacher_id)
    if not verify_password(teacher.password, old):
        raise forbidden("WRONG_PASSWORD", "Old password incorrect")
    teacher.password = hash_password(new)
    teacher.tokenVersion += 1  # invalidate other sessions
    session.add(teacher)
    await session.commit()


async def roster(session, teacher_id: str, page: PageParams) -> dict:
    base = select(StudentRemark).where(StudentRemark.teacherId == teacher_id)
    total = (await session.exec(select(func.count()).select_from(base.subquery()))).one()
    rows = (
        await session.exec(
            base.order_by(StudentRemark.createdAt.desc()).offset(page.skip).limit(page.take)
        )
    ).all()
    online_ids = {s.id for s in state.online_students}
    data = [
        {"id": r.studentId, "remark": r.remark, "online": r.studentId in online_ids}
        for r in rows
    ]
    return make_page(data, total, page)


async def create_connect_request(
    session, teacher_id: str, connect_code: str, remark: str
) -> dict:
    online_student = next(
        (s for s in state.online_students if s.connectCode == connect_code), None
    )
    if online_student is None:
        raise not_found("CONNECT_CODE_NOT_FOUND", "Connect code not found")
    already = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == teacher_id,
                StudentRemark.studentId == online_student.id,
            )
        )
    ).first()
    if already is not None:
        raise conflict("ALREADY_CONNECTED", "Already connected")

    request_id = nanoid()
    state.connect_requests.append(
        ConnectRequest(
            id=request_id,
            teacherId=teacher_id,
            studentId=online_student.id,
            remark=remark,
            createdAt=_now(),
        )
    )
    teacher = await session.get(Teacher, teacher_id)
    await socket_send(
        "student", online_student.id, "connect-requested",
        {"requestId": request_id, "teacherName": teacher.name},
    )
    return {"requestId": request_id, "studentId": online_student.id, "remark": remark}


async def send_message(
    session, teacher_id: str, student_ids: list[str], message: str, tts: int, close_delay: int
) -> dict:
    # Authorization: the teacher must be connected to every target student.
    connected = set(
        (
            await session.exec(
                select(StudentRemark.studentId).where(
                    StudentRemark.teacherId == teacher_id,
                    StudentRemark.studentId.in_(student_ids),
                )
            )
        ).all()
    )
    if set(student_ids) - connected:
        raise forbidden("NOT_CONNECTED", "Not connected to one or more students")

    students = (await session.exec(select(Student).where(Student.id.in_(student_ids)))).all()
    msg = Message(message=message, teacherId=teacher_id)
    msg.students = list(students)
    session.add(msg)
    await session.commit()
    await session.refresh(msg)

    teacher = await session.get(Teacher, teacher_id)
    state.showing_messages.append(
        ShowingMessage(
            id=msg.id,
            teacherId=teacher_id,
            studentIds=set(student_ids),
            closedStudentIds=set(),
            createdAt=msg.createdAt,
        )
    )
    for sid in student_ids:
        await socket_send(
            "student", sid, "message",
            {
                "messageId": msg.id,
                "createdAt": msg.createdAt.isoformat(),
                "message": message,
                "teacherName": teacher.name,
                "tts": tts,
                "closeDelay": close_delay,
            },
        )
    return {
        "id": msg.id,
        "createdAt": msg.createdAt,
        "message": message,
        "studentIds": student_ids,
    }


async def update_remark(session, teacher_id: str, student_id: str, remark: str) -> None:
    row = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == teacher_id,
                StudentRemark.studentId == student_id,
            )
        )
    ).first()
    if row is None:
        raise not_found("NOT_CONNECTED", "Not connected to this student")
    row.remark = remark
    session.add(row)
    await session.commit()


async def disconnect_student(session, teacher_id: str, student_id: str) -> None:
    row = (
        await session.exec(
            select(StudentRemark).where(
                StudentRemark.teacherId == teacher_id,
                StudentRemark.studentId == student_id,
            )
        )
    ).first()
    if row is None:
        raise not_found("NOT_CONNECTED", "Not connected to this student")
    await session.delete(row)
    await session.commit()
    await socket_send("student", student_id, "teacher-disconnected", {"teacherId": teacher_id})


async def messages(session, teacher_id: str, page: PageParams) -> dict:
    total = (
        await session.exec(
            select(func.count()).select_from(Message).where(Message.teacherId == teacher_id)
        )
    ).one()
    msgs = (
        await session.exec(
            select(Message)
            .options(selectinload(Message.students))
            .where(Message.teacherId == teacher_id)
            .order_by(Message.createdAt.desc())
            .offset(page.skip)
            .limit(page.take)
        )
    ).all()
    data = []
    for m in msgs:
        ms = find_by_id(state.showing_messages, m.id)
        showing = [s for s in ms.studentIds if s not in ms.closedStudentIds] if ms else []
        data.append(
            {
                "id": m.id,
                "createdAt": m.createdAt,
                "message": m.message,
                "studentIds": [s.id for s in m.students],
                "showingIds": showing,
            }
        )
    return make_page(data, total, page)
