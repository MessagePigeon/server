"""Low-level WebSocket I/O. Imports only state, so other modules can depend on it freely."""

import json

from fastapi import WebSocket

from app.state import Role, find_by_id, state

# Application close codes (4000-4999 are app-defined)
CLOSE_REPLACED = 4001  # logged in elsewhere
CLOSE_REVOKED = 4003   # banned / forced logout by admin


async def _safe_send(ws: WebSocket, payload: str) -> None:
    try:
        await ws.send_text(payload)
    except Exception:
        pass


async def _safe_close(ws: WebSocket, code: int) -> None:
    try:
        await ws.close(code=code)
    except Exception:
        pass


async def socket_send(role: Role, id: str, event: str, data: dict | None = None) -> None:
    online_ids = [c.id for c in state.online_clients]
    if id not in online_ids:
        return
    payload = json.dumps({"event": event, "data": data})
    if role == "teacher":
        teacher = find_by_id(state.online_teachers, id)
        if teacher:
            for client in list(teacher.clients):
                await _safe_send(client, payload)
    else:
        student = find_by_id(state.online_students, id)
        if student:
            await _safe_send(student.client, payload)


async def close_user(role: Role, id: str, code: int) -> None:
    """Server-initiated disconnect (logout/ban). Gateway will then clean up state."""
    if role == "teacher":
        teacher = find_by_id(state.online_teachers, id)
        if teacher:
            for client in list(teacher.clients):
                await _safe_close(client, code)
    else:
        student = find_by_id(state.online_students, id)
        if student:
            await _safe_close(student.client, code)
