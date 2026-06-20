from sqlmodel import select

from app.core.config import settings
from app.core.errors import conflict, forbidden, unauthorized
from app.core.security import (
    constant_time_equals,
    hash_password,
    sign_admin_token,
    sign_user_token,
    verify_password,
)
from app.models import RegisterCode, Student, Teacher

_INVALID = unauthorized("INVALID_CREDENTIALS", "Invalid credentials")


def admin_login(password: str) -> str:
    if constant_time_equals(password, settings.ADMIN_PASSWORD):
        return sign_admin_token()
    raise _INVALID


async def teacher_login(session, username: str, password: str) -> str:
    teacher = (
        await session.exec(select(Teacher).where(Teacher.username == username))
    ).first()
    if teacher is None or not verify_password(teacher.password, password):
        raise _INVALID
    if teacher.ban:
        raise forbidden("ACCOUNT_BANNED", "Account banned")
    return sign_user_token("teacher", teacher.id, teacher.tokenVersion)


async def student_login(session, key: str) -> str:
    student = (await session.exec(select(Student).where(Student.key == key))).first()
    if student is None:
        raise _INVALID
    if student.ban:
        raise forbidden("ACCOUNT_BANNED", "Account banned")
    return sign_user_token("student", student.id, student.tokenVersion)


async def teacher_register(
    session, username: str, password: str, name: str, register_code: str
) -> None:
    code = (
        await session.exec(select(RegisterCode).where(RegisterCode.code == register_code))
    ).first()
    if code is None:
        raise forbidden("INVALID_REGISTER_CODE", "Invalid register code")
    exists = (await session.exec(select(Teacher).where(Teacher.username == username))).first()
    if exists is not None:
        raise conflict("USERNAME_TAKEN", "Username already taken")
    await session.delete(code)
    session.add(Teacher(username=username, password=hash_password(password), name=name))
    await session.commit()
