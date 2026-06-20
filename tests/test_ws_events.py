"""Guard against drift between emitted WebSocket events and the documented union."""

import re
from pathlib import Path
from typing import get_args

from app.ws import events as ev

_APP_DIR = Path(__file__).resolve().parent.parent / "app"
# socket_send("teacher"|"student", <id>, "<event>", ...)
_EMIT = re.compile(r'socket_send\(\s*"(?:teacher|student)"\s*,\s*[^,]+?,\s*"([^"]+)"')


def _documented_events() -> set[str]:
    names: set[str] = set()
    for union in (ev.WsStudentEvent, ev.WsTeacherEvent):
        variants = get_args(get_args(union)[0])  # unwrap Annotated -> Union -> members
        for variant in variants:
            names |= set(get_args(variant.model_fields["event"].annotation))
    return names


def _emitted_events() -> set[str]:
    names: set[str] = set()
    for path in _APP_DIR.rglob("*.py"):
        names |= set(_EMIT.findall(path.read_text()))
    return names


def test_emitted_events_match_documented_union():
    emitted = _emitted_events()
    documented = _documented_events()
    assert emitted, "no socket_send(...) emissions found — check the regex"
    assert emitted == documented, (
        f"WS event drift — emitted-only={emitted - documented}, "
        f"documented-only={documented - emitted}"
    )
