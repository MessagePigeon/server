from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db import get_session
from app.models import Student, Teacher
from app.security import verify_jwt

Session = Annotated[AsyncSession, Depends(get_session)]


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)
    return authorization[7:]


async def require_admin(authorization: Annotated[str | None, Header()] = None) -> None:
    try:
        payload = verify_jwt(_bearer(authorization))
        if payload.get("message") == "pigeon":
            return
    except HTTPException:
        raise
    except Exception:
        pass
    raise HTTPException(status.HTTP_401_UNAUTHORIZED)


async def require_teacher(
    session: Session,
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    try:
        payload = verify_jwt(_bearer(authorization))
        user_id = payload["id"]
        teacher = await session.get(Teacher, user_id)
        if teacher is not None and not teacher.ban:
            return user_id
    except HTTPException:
        raise
    except Exception:
        pass
    raise HTTPException(status.HTTP_401_UNAUTHORIZED)


async def require_student(
    session: Session,
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    try:
        payload = verify_jwt(_bearer(authorization))
        user_id = payload["id"]
        student = await session.get(Student, user_id)
        if student is not None and not student.ban:
            return user_id
    except HTTPException:
        raise
    except Exception:
        pass
    raise HTTPException(status.HTTP_401_UNAUTHORIZED)


AdminAuth = Annotated[None, Depends(require_admin)]
TeacherId = Annotated[str, Depends(require_teacher)]
StudentId = Annotated[str, Depends(require_student)]


# re-export so routers import select/Student/Teacher conveniently
__all__ = [
    "Session", "AdminAuth", "TeacherId", "StudentId",
    "require_admin", "require_teacher", "require_student", "select",
]
