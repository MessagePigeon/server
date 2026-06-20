from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.security import decode_token
from app.db import async_session
from app.models import Student, Teacher
from app.ws import service

router = APIRouter()


async def _authenticate(token: str | None) -> tuple[str, str] | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
    except Exception:
        return None
    role, user_id, ver = payload.get("role"), payload.get("id"), payload.get("ver")
    if role not in ("teacher", "student") or not user_id:
        return None
    async with async_session() as session:
        obj = await session.get(Teacher if role == "teacher" else Student, user_id)
    if obj is None or obj.ban or obj.tokenVersion != ver:
        return None
    return role, user_id


@router.websocket("/v1/ws")
async def ws_endpoint(websocket: WebSocket, token: str | None = None) -> None:
    await websocket.accept()
    auth = await _authenticate(token)
    if auth is None:
        await websocket.close(code=1008)  # policy violation
        return
    role, user_id = auth

    service.client_online(role, user_id, websocket)
    if role == "student":
        await service.student_online(user_id, websocket)
    else:
        service.teacher_online(user_id, websocket)

    # Connection stays open; the server only pushes events. No client->server messages.
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await service.client_offline(websocket)
    except Exception:
        await service.client_offline(websocket)
