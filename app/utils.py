from datetime import datetime, timezone

from nanoid import generate

_ALPHABET = "abcdefghijklmnopqrstuvwxyz1234567890"


def parse_iso(value: str) -> datetime:
    """Parse an ISO8601 string (accepts trailing 'Z') into an aware UTC datetime."""
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def generate_random_string(length: int) -> str:
    """Lowercase alphanumeric id (mirrors nanoid customAlphabet in the TS version)."""
    return generate(_ALPHABET, length)


def nanoid() -> str:
    """Default nanoid (21-char URL-safe) for connect-request ids."""
    return generate()


def sets_equal(a: set, b: set) -> bool:
    return a == b
