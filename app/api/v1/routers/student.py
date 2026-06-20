from fastapi import APIRouter, status

from app.api.v1.deps import Session, StudentId
from app.core.errors import not_found
from app.core.pagination import Page, Pagination
from app.schemas.responses import (
    AcceptedConnect,
    ConnectCode,
    StudentMe,
    StudentMessageOut,
    TeacherBrief,
)
from app.services import message as message_svc
from app.services import student as svc

router = APIRouter(prefix="/student", tags=["student"])


@router.get("/me", response_model=StudentMe)
async def get_me(student_id: StudentId, session: Session):
    return await svc.get_me(session, student_id)


@router.get("/connect-code", response_model=ConnectCode)
async def connect_code(student_id: StudentId):
    return svc.get_connect_code(student_id)


@router.post("/connect-requests/{id}/accept", response_model=AcceptedConnect)
async def accept_request(id: str, student_id: StudentId, session: Session):
    return await svc.accept_request(session, student_id, id)


@router.post("/connect-requests/{id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_request(id: str, student_id: StudentId):
    await svc.reject_request(student_id, id)


@router.get("/teachers", response_model=Page[TeacherBrief])
async def teachers(student_id: StudentId, session: Session, page: Pagination):
    return await svc.teachers(session, student_id, page)


@router.get("/messages", response_model=Page[StudentMessageOut])
async def list_messages(student_id: StudentId, session: Session, page: Pagination):
    return await svc.messages(session, student_id, page)


@router.post("/messages/{id}/close", status_code=status.HTTP_204_NO_CONTENT)
async def close_message(id: int, student_id: StudentId):
    if not svc.can_close_message(student_id, id):
        raise not_found("MESSAGE_NOT_FOUND", "Message not found")
    await message_svc.student_close_message(student_id, id)
