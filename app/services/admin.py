from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.errors import conflict, not_found
from app.core.pagination import PageParams, make_page
from app.core.security import hash_password
from app.models import (
    Message,
    MessageStudentLink,
    RegisterCode,
    Student,
    StudentRemark,
    Teacher,
)
from app.services import teacher as teacher_service
from app.state import state
from app.utils import generate_random_string, parse_iso
from app.ws.send import CLOSE_REVOKED, close_user


# ---- register codes ----
async def create_register_codes(session, count: int) -> None:
    for _ in range(count):
        session.add(RegisterCode(code=generate_random_string(32)))
    await session.commit()


async def list_register_codes(session, page: PageParams) -> dict:
    rows = (
        await session.exec(
            select(RegisterCode).order_by(RegisterCode.id.desc()).offset(page.skip).limit(page.take)
        )
    ).all()
    total = (await session.exec(select(func.count()).select_from(RegisterCode))).one()
    return make_page(rows, total, page)


async def delete_register_code(session, id: int) -> None:
    code = await session.get(RegisterCode, id)
    if code is None:
        raise not_found("REGISTER_CODE_NOT_FOUND", "Register code not found")
    await session.delete(code)
    await session.commit()


# ---- teachers ----
async def create_teacher(session, username: str, name: str) -> dict:
    if (await session.exec(select(Teacher).where(Teacher.username == username))).first():
        raise conflict("USERNAME_TAKEN", "Username already taken")
    password = generate_random_string(8)
    teacher = Teacher(username=username, password=hash_password(password), name=name)
    session.add(teacher)
    await session.commit()
    await session.refresh(teacher)
    return {"id": teacher.id, "password": password}


async def list_teachers(
    session, page: PageParams, id: str | None, username: str | None, name: str | None
) -> dict:
    query = select(Teacher)
    if id is not None:
        query = query.where(Teacher.id == id)
    if username is not None:
        query = query.where(Teacher.username.contains(username))
    if name is not None:
        query = query.where(Teacher.name.contains(name))

    total = (await session.exec(select(func.count()).select_from(query.subquery()))).one()
    teachers = (
        await session.exec(
            query.order_by(Teacher.createdAt.desc()).offset(page.skip).limit(page.take)
        )
    ).all()
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
    return make_page(data, total, page)


async def update_teacher_name(session, teacher_id: str, name: str) -> None:
    if await session.get(Teacher, teacher_id) is None:
        raise not_found("TEACHER_NOT_FOUND", "Teacher not found")
    await teacher_service.update_name(session, teacher_id, name)


async def reset_teacher_password(session, teacher_id: str) -> dict:
    teacher = await session.get(Teacher, teacher_id)
    if teacher is None:
        raise not_found("TEACHER_NOT_FOUND", "Teacher not found")
    new_password = generate_random_string(8)
    teacher.password = hash_password(new_password)
    teacher.tokenVersion += 1
    session.add(teacher)
    await session.commit()
    return {"username": teacher.username, "newPassword": new_password}


async def set_teacher_ban(session, teacher_id: str, ban: bool) -> None:
    teacher = await session.get(Teacher, teacher_id)
    if teacher is None:
        raise not_found("TEACHER_NOT_FOUND", "Teacher not found")
    teacher.ban = ban
    if ban:
        teacher.tokenVersion += 1
    session.add(teacher)
    await session.commit()
    if ban:
        await close_user("teacher", teacher_id, CLOSE_REVOKED)


# ---- students ----
async def create_student(session, key: str | None, default_remark: str) -> dict:
    key = key if key is not None else generate_random_string(16)
    if (await session.exec(select(Student).where(Student.key == key))).first():
        raise conflict("KEY_TAKEN", "Key already taken")
    student = Student(key=key, defaultRemark=default_remark)
    session.add(student)
    await session.commit()
    await session.refresh(student)
    return {"id": student.id, "key": key, "defaultRemark": default_remark}


async def list_students(
    session, page: PageParams, id: str | None, default_remark: str | None
) -> dict:
    query = select(Student)
    if id is not None:
        query = query.where(Student.id == id)
    if default_remark is not None:
        query = query.where(Student.defaultRemark.contains(default_remark))

    total = (await session.exec(select(func.count()).select_from(query.subquery()))).one()
    students = (
        await session.exec(
            query.order_by(Student.createdAt.desc()).offset(page.skip).limit(page.take)
        )
    ).all()
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
    return make_page(data, total, page)


async def update_student(
    session, student_id: str, key: str | None, default_remark: str | None
) -> None:
    student = await session.get(Student, student_id)
    if student is None:
        raise not_found("STUDENT_NOT_FOUND", "Student not found")
    if key is not None:
        student.key = key
    if default_remark is not None:
        student.defaultRemark = default_remark
    session.add(student)
    await session.commit()


async def set_student_ban(session, student_id: str, ban: bool) -> None:
    student = await session.get(Student, student_id)
    if student is None:
        raise not_found("STUDENT_NOT_FOUND", "Student not found")
    student.ban = ban
    if ban:
        student.tokenVersion += 1
    session.add(student)
    await session.commit()
    if ban:
        await close_user("student", student_id, CLOSE_REVOKED)


# ---- messages ----
async def list_messages(
    session,
    page: PageParams,
    teacher_id: str | None,
    student_id: str | None,
    start_time: str | None,
    end_time: str | None,
    message: str | None,
) -> dict:
    query = select(Message)
    if teacher_id is not None:
        query = query.where(Message.teacherId == teacher_id)
    if student_id is not None:
        query = query.where(
            Message.id.in_(
                select(MessageStudentLink.messageId).where(
                    MessageStudentLink.studentId == student_id
                )
            )
        )
    if start_time is not None:
        query = query.where(Message.createdAt >= parse_iso(start_time))
    if end_time is not None:
        query = query.where(Message.createdAt <= parse_iso(end_time))
    if message is not None:
        query = query.where(Message.message.contains(message))

    total = (await session.exec(select(func.count()).select_from(query.subquery()))).one()
    msgs = (
        await session.exec(
            query.options(selectinload(Message.students))
            .order_by(Message.createdAt.desc())
            .offset(page.skip)
            .limit(page.take)
        )
    ).all()
    data = []
    for m in msgs:
        t = await session.get(Teacher, m.teacherId)
        data.append(
            {
                "id": m.id,
                "createdAt": m.createdAt,
                "message": m.message,
                "teacher": {"id": t.id, "name": t.name},
                "students": [
                    {"id": s.id, "defaultRemark": s.defaultRemark} for s in m.students
                ],
            }
        )
    return make_page(data, total, page)
