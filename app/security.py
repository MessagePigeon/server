import re
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.config import settings

_ph = PasswordHasher()
_ALGO = "HS256"

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
    """Parse an ms-style duration like '1 weeks', '7d', '3h' into a timedelta."""
    match = re.fullmatch(r"\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s*", value)
    if not match:
        raise ValueError(f"Invalid duration: {value!r}")
    amount, unit = match.group(1), match.group(2).lower()
    if unit not in _UNITS:
        raise ValueError(f"Unknown duration unit: {unit!r}")
    return timedelta(seconds=float(amount) * _UNITS[unit])


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(hashed: str, password: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


def _encode(payload: dict) -> str:
    exp = datetime.now(timezone.utc) + parse_duration(settings.JWT_EXPIRES_IN)
    return jwt.encode({**payload, "exp": exp}, settings.JWT_SECRET, algorithm=_ALGO)


def sign_jwt_with_id(user_id: str) -> dict:
    return {"token": _encode({"id": user_id})}


def sign_admin_jwt() -> dict:
    return {"token": _encode({"message": "pigeon"})}


def verify_jwt(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[_ALGO])
