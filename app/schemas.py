import uuid
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field, field_validator


def _is_uuid(v: str) -> str:
    uuid.UUID(str(v))
    return str(v)


UUIDStr = Annotated[str, AfterValidator(_is_uuid)]
NonEmptyStr = Annotated[str, Field(min_length=1)]


# ---------- admin ----------
class LoginAdmin(BaseModel):
    password: NonEmptyStr


class GenerateRegisterCodes(BaseModel):
    count: int


class GenerateTeacher(BaseModel):
    username: NonEmptyStr
    name: NonEmptyStr


class ResetTeacherPassword(BaseModel):
    id: UUIDStr


class ModifyTeacherName(BaseModel):
    id: UUIDStr
    newName: NonEmptyStr


class BanStudentOrTeacher(BaseModel):
    id: UUIDStr
    ban: bool


class GenerateStudent(BaseModel):
    key: str | None = None
    defaultRemark: NonEmptyStr


class ModifyStudent(BaseModel):
    id: UUIDStr
    key: str | None = None
    defaultRemark: str | None = None


class ModifyConnection(BaseModel):
    studentId: UUIDStr
    teacherId: UUIDStr


# ---------- teacher ----------
class LoginTeacher(BaseModel):
    username: NonEmptyStr
    password: NonEmptyStr


class RegisterTeacher(BaseModel):
    username: NonEmptyStr
    password: NonEmptyStr
    name: NonEmptyStr
    registerCode: str = Field(min_length=32, max_length=32)


class ModifyName(BaseModel):
    newName: NonEmptyStr


class ModifyPassword(BaseModel):
    oldPassword: NonEmptyStr
    newPassword: NonEmptyStr


class ConnectStudent(BaseModel):
    connectCode: NonEmptyStr
    remark: NonEmptyStr


class ModifyStudentRemark(BaseModel):
    studentId: UUIDStr
    newRemark: NonEmptyStr


class SendMessage(BaseModel):
    studentIds: list[UUIDStr]
    message: NonEmptyStr
    tts: int
    closeDelay: int

    @field_validator("studentIds")
    @classmethod
    def _non_empty_unique(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("studentIds must not be empty")
        if len(set(v)) != len(v):
            raise ValueError("studentIds must be unique")
        return v


class CloseMessageByTeacher(BaseModel):
    messageId: int
    studentId: UUIDStr


# ---------- student ----------
class StudentLogin(BaseModel):
    key: NonEmptyStr


class AnswerConnectRequest(BaseModel):
    requestId: NonEmptyStr


class CloseMessage(BaseModel):
    messageId: int
