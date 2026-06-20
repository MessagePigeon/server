from typing import Annotated

from fastapi import Depends, Header
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.errors import unauthorized
from app.core.security import decode_token
from app.db import get_session
from app.models import Student, Teacher

Session = Annotated[AsyncSession, Depends(get_session)]

_UNAUTH = unauthorized()


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise _UNAUTH
    return authorization[7:]


def _claims(authorization: str | None) -> dict:
    try:
        return decode_token(_bearer(authorization))
    except Exception:
        raise _UNAUTH from None


async def require_admin(authorization: Annotated[str | None, Header()] = None) -> None:
    claims = _claims(authorization)
    if claims.get("role") != "admin" or claims.get("ver") != settings.ADMIN_TOKEN_VERSION:
        raise _UNAUTH


async def require_teacher(
    session: Session, authorization: Annotated[str | None, Header()] = None
) -> str:
    claims = _claims(authorization)
    if claims.get("role") != "teacher":
        raise _UNAUTH
    teacher = await session.get(Teacher, claims.get("id"))
    if teacher is None or teacher.ban or teacher.tokenVersion != claims.get("ver"):
        raise _UNAUTH
    return teacher.id


async def require_student(
    session: Session, authorization: Annotated[str | None, Header()] = None
) -> str:
    claims = _claims(authorization)
    if claims.get("role") != "student":
        raise _UNAUTH
    student = await session.get(Student, claims.get("id"))
    if student is None or student.ban or student.tokenVersion != claims.get("ver"):
        raise _UNAUTH
    return student.id


AdminAuth = Annotated[None, Depends(require_admin)]
TeacherId = Annotated[str, Depends(require_teacher)]
StudentId = Annotated[str, Depends(require_student)]
