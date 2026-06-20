import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db import async_session
from app.models import Student, Teacher
from app.security import verify_jwt
from app.ws import service

router = APIRouter()


async def _authenticate(token: str | None, role: str | None) -> str | None:
    if not token or role not in ("student", "teacher"):
        return None
    try:
        user_id = verify_jwt(token)["id"]
    except Exception:
        return None
    async with async_session() as session:
        obj = await session.get(Student if role == "student" else Teacher, user_id)
    return user_id if obj is not None else None


@router.websocket("/")
async def ws_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            data = msg.get("data") or {}
            if msg.get("event") == "online":
                role = data.get("role")
                user_id = await _authenticate(data.get("token"), role)
                if user_id is None:
                    continue  # guard fails -> silently ignore
                service.client_online(role, user_id, websocket)
                if role == "student":
                    await service.student_online(user_id, websocket)
                else:
                    service.teacher_online(user_id, websocket)
    except WebSocketDisconnect:
        await service.client_offline(websocket)
    except Exception:
        await service.client_offline(websocket)
