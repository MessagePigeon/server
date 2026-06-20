from fastapi import APIRouter, status

from app.api.v1.deps import AdminAuth, Session
from app.core.pagination import Page, Pagination
from app.schemas.requests import (
    CreateConnection,
    CreateRegisterCodes,
    CreateStudent,
    CreateTeacher,
    SetBan,
    UpdateStudent,
    UpdateTeacher,
)
from app.schemas.responses import (
    AdminMessageOut,
    CreatedStudent,
    CreatedTeacher,
    NewPassword,
    RegisterCodeOut,
    StudentOut,
    TeacherOut,
)
from app.services import admin as svc
from app.services import connection as conn_svc

router = APIRouter(prefix="/admin", tags=["admin"])


# ---- register codes ----
@router.post("/register-codes", status_code=status.HTTP_201_CREATED)
async def create_register_codes(body: CreateRegisterCodes, _: AdminAuth, session: Session):
    await svc.create_register_codes(session, body.count)


@router.get("/register-codes", response_model=Page[RegisterCodeOut])
async def list_register_codes(_: AdminAuth, session: Session, page: Pagination):
    return await svc.list_register_codes(session, page)


@router.delete("/register-codes/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_register_code(id: int, _: AdminAuth, session: Session):
    await svc.delete_register_code(session, id)


# ---- teachers ----
@router.post("/teachers", status_code=status.HTTP_201_CREATED, response_model=CreatedTeacher)
async def create_teacher(body: CreateTeacher, _: AdminAuth, session: Session):
    return await svc.create_teacher(session, body.username, body.name)


@router.get("/teachers", response_model=Page[TeacherOut])
async def list_teachers(
    _: AdminAuth,
    session: Session,
    page: Pagination,
    id: str | None = None,
    username: str | None = None,
    name: str | None = None,
):
    return await svc.list_teachers(session, page, id, username, name)


@router.patch("/teachers/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_teacher(id: str, body: UpdateTeacher, _: AdminAuth, session: Session):
    await svc.update_teacher_name(session, id, body.name)


@router.post("/teachers/{id}/password-reset", response_model=NewPassword)
async def reset_teacher_password(id: str, _: AdminAuth, session: Session):
    return await svc.reset_teacher_password(session, id)


@router.put("/teachers/{id}/ban", status_code=status.HTTP_204_NO_CONTENT)
async def ban_teacher(id: str, body: SetBan, _: AdminAuth, session: Session):
    await svc.set_teacher_ban(session, id, body.ban)


# ---- students ----
@router.post("/students", status_code=status.HTTP_201_CREATED, response_model=CreatedStudent)
async def create_student(body: CreateStudent, _: AdminAuth, session: Session):
    return await svc.create_student(session, body.key, body.defaultRemark)


@router.get("/students", response_model=Page[StudentOut])
async def list_students(
    _: AdminAuth,
    session: Session,
    page: Pagination,
    id: str | None = None,
    defaultRemark: str | None = None,
):
    return await svc.list_students(session, page, id, defaultRemark)


@router.patch("/students/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_student(id: str, body: UpdateStudent, _: AdminAuth, session: Session):
    await svc.update_student(session, id, body.key, body.defaultRemark)


@router.put("/students/{id}/ban", status_code=status.HTTP_204_NO_CONTENT)
async def ban_student(id: str, body: SetBan, _: AdminAuth, session: Session):
    await svc.set_student_ban(session, id, body.ban)


# ---- connections ----
@router.post("/connections", status_code=status.HTTP_201_CREATED)
async def create_connection(body: CreateConnection, _: AdminAuth, session: Session):
    await conn_svc.make_connection(session, body.teacherId, body.studentId)


@router.delete(
    "/connections/{teacher_id}/{student_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_connection(teacher_id: str, student_id: str, _: AdminAuth, session: Session):
    await conn_svc.break_connection(session, teacher_id, student_id)


# ---- messages ----
@router.get("/messages", response_model=Page[AdminMessageOut])
async def list_messages(
    _: AdminAuth,
    session: Session,
    page: Pagination,
    teacherId: str | None = None,
    studentId: str | None = None,
    startTime: str | None = None,
    endTime: str | None = None,
    message: str | None = None,
):
    return await svc.list_messages(
        session, page, teacherId, studentId, startTime, endTime, message
    )
