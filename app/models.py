import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(UTC)


_TZ = {"sa_type": DateTime(timezone=True)}


class RegisterCode(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)


class Teacher(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    createdAt: datetime = Field(default_factory=_now, **_TZ)
    username: str = Field(unique=True, index=True)
    name: str
    password: str
    ban: bool = Field(default=False)
    tokenVersion: int = Field(default=0)


class Student(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    createdAt: datetime = Field(default_factory=_now, **_TZ)
    key: str = Field(unique=True, index=True)
    defaultRemark: str
    ban: bool = Field(default=False)
    tokenVersion: int = Field(default=0)


class StudentRemark(SQLModel, table=True):
    """Single source of truth for a teacher<->student connection (existence = connected)."""

    __table_args__ = (UniqueConstraint("teacherId", "studentId"),)

    id: int | None = Field(default=None, primary_key=True)
    createdAt: datetime = Field(default_factory=_now, **_TZ)
    remark: str
    teacherId: str = Field(foreign_key="teacher.id", index=True)
    studentId: str = Field(foreign_key="student.id", index=True)


class MessageStudentLink(SQLModel, table=True):
    messageId: int = Field(foreign_key="message.id", primary_key=True)
    studentId: str = Field(foreign_key="student.id", primary_key=True)


class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    createdAt: datetime = Field(default_factory=_now, **_TZ)
    message: str
    teacherId: str = Field(foreign_key="teacher.id", index=True)

    students: list[Student] = Relationship(link_model=MessageStudentLink)
