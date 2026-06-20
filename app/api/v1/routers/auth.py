from fastapi import APIRouter, status

from app.api.v1.deps import Session
from app.schemas.requests import AdminLogin, StudentLogin, TeacherLogin, TeacherRegister
from app.schemas.responses import Token
from app.services import auth as svc

router = APIRouter(tags=["auth"])


@router.post("/admin/login", response_model=Token)
async def admin_login(body: AdminLogin):
    return {"token": svc.admin_login(body.password)}


@router.post("/teacher/login", response_model=Token)
async def teacher_login(body: TeacherLogin, session: Session):
    return {"token": await svc.teacher_login(session, body.username, body.password)}


@router.post("/teacher/register", status_code=status.HTTP_201_CREATED)
async def teacher_register(body: TeacherRegister, session: Session):
    await svc.teacher_register(
        session, body.username, body.password, body.name, body.registerCode
    )


@router.post("/student/login", response_model=Token)
async def student_login(body: StudentLogin, session: Session):
    return {"token": await svc.student_login(session, body.key)}
