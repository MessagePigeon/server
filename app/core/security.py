import re
import secrets
from datetime import UTC, datetime, timedelta
from typing import Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings

_ph = PasswordHasher()
_ALGO = "HS256"

Role = Literal["admin", "teacher", "student"]

# vercel/ms-style units -> seconds
_UNITS = {
    "ms": 0.001,
    "s": 1, "sec": 1, "secs": 1, "second": 1, "seconds": 1,
    "m": 60, "min": 60, "mins": 60, "minute": 60, "minutes": 60,
    "h": 3600, "hr": 3600, "hrs": 3600, "hour": 3600, "hours": 3600,
    "d": 86400, "day": 86400, "days": 86400,
    "w": 604800, "week": 604800, "weeks": 604800,
    "y": 31557600, "year": 31557600, "years": 31557600,
}


def parse_duration(value: str) -> timedelta:
    match = re.fullmatch(r"\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s*", value)
    if not match:
        raise ValueError(f"Invalid duration: {value!r}")
    amount, unit = match.group(1), match.group(2).lower()
    if unit not in _UNITS:
        raise ValueError(f"Unknown duration unit: {unit!r}")
    return timedelta(seconds=float(amount) * _UNITS[unit])


# ---- passwords ----
def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(hashed: str, password: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except (VerifyMismatchError, Exception):
        return False


def constant_time_equals(a: str, b: str) -> bool:
    return secrets.compare_digest(a, b)


# ---- jwt ----
def _encode(payload: dict) -> str:
    exp = datetime.now(UTC) + parse_duration(settings.JWT_EXPIRES_IN)
    return jwt.encode({**payload, "exp": exp}, settings.JWT_SECRET, algorithm=_ALGO)


def sign_user_token(role: Role, user_id: str, token_version: int) -> str:
    return _encode({"role": role, "id": user_id, "ver": token_version})


def sign_admin_token() -> str:
    return _encode({"role": "admin", "ver": settings.ADMIN_TOKEN_VERSION})


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[_ALGO])
