from fastapi import APIRouter

from app.core.config import settings
from app.schemas.responses import Config

router = APIRouter(tags=["config"])


@router.get("/config", response_model=Config)
async def get_config():
    return {"teacherUrl": settings.TEACHER_URL}
