from fastapi import APIRouter, status

from app.api.v1.deps import Session, TeacherId
from app.core.pagination import Page, Pagination
from app.schemas.requests import (
    ChangePassword,
    CloseMessageForStudent,
    CreateConnectRequest,
    SendMessage,
    UpdateMe,
    UpdateRemark,
)
from app.schemas.responses import (
    ConnectRequestCreated,
    Me,
    RosterStudent,
    SentMessage,
    TeacherMessageOut,
)
from app.services import message as message_svc
from app.services import teacher as svc

router = APIRouter(prefix="/teacher", tags=["teacher"])


@router.get("/me", response_model=Me)
async def get_me(teacher_id: TeacherId, session: Session):
    return await svc.get_me(session, teacher_id)


@router.patch("/me", status_code=status.HTTP_204_NO_CONTENT)
async def update_me(body: UpdateMe, teacher_id: TeacherId, session: Session):
    await svc.update_name(session, teacher_id, body.name)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(body: ChangePassword, teacher_id: TeacherId, session: Session):
    await svc.change_password(session, teacher_id, body.oldPassword, body.newPassword)


@router.get("/students", response_model=Page[RosterStudent])
async def roster(teacher_id: TeacherId, session: Session, page: Pagination):
    return await svc.roster(session, teacher_id, page)


@router.patch("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_remark(
    student_id: str, body: UpdateRemark, teacher_id: TeacherId, session: Session
):
    await svc.update_remark(session, teacher_id, student_id, body.remark)


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_student(student_id: str, teacher_id: TeacherId, session: Session):
    await svc.disconnect_student(session, teacher_id, student_id)


@router.post(
    "/connect-requests", status_code=status.HTTP_201_CREATED, response_model=ConnectRequestCreated
)
async def create_connect_request(
    body: CreateConnectRequest, teacher_id: TeacherId, session: Session
):
    return await svc.create_connect_request(session, teacher_id, body.connectCode, body.remark)


@router.post("/messages", status_code=status.HTTP_201_CREATED, response_model=SentMessage)
async def send_message(body: SendMessage, teacher_id: TeacherId, session: Session):
    return await svc.send_message(
        session, teacher_id, body.studentIds, body.message, body.tts, body.closeDelay
    )


@router.get("/messages", response_model=Page[TeacherMessageOut])
async def list_messages(teacher_id: TeacherId, session: Session, page: Pagination):
    return await svc.messages(session, teacher_id, page)


@router.post("/messages/{id}/close", status_code=status.HTTP_204_NO_CONTENT)
async def close_message(id: int, body: CloseMessageForStudent, teacher_id: TeacherId):
    await message_svc.teacher_close_message(teacher_id, id, body.studentId)
