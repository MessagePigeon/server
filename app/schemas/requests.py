import uuid
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field, field_validator


def _is_uuid(v: str) -> str:
    uuid.UUID(str(v))
    return str(v)


UUIDStr = Annotated[str, AfterValidator(_is_uuid)]
NonEmptyStr = Annotated[str, Field(min_length=1)]


# ---------- auth ----------
class AdminLogin(BaseModel):
    password: NonEmptyStr


class TeacherLogin(BaseModel):
    username: NonEmptyStr
    password: NonEmptyStr


class TeacherRegister(BaseModel):
    username: NonEmptyStr
    password: NonEmptyStr
    name: NonEmptyStr
    registerCode: str = Field(min_length=32, max_length=32)


class StudentLogin(BaseModel):
    key: NonEmptyStr


# ---------- admin ----------
class CreateRegisterCodes(BaseModel):
    count: int = Field(ge=1, le=100)


class CreateTeacher(BaseModel):
    username: NonEmptyStr
    name: NonEmptyStr


class UpdateTeacher(BaseModel):
    name: NonEmptyStr


class SetBan(BaseModel):
    ban: bool


class CreateStudent(BaseModel):
    key: str | None = Field(default=None, min_length=1)
    defaultRemark: NonEmptyStr


class UpdateStudent(BaseModel):
    key: NonEmptyStr | None = None
    defaultRemark: NonEmptyStr | None = None


class CreateConnection(BaseModel):
    teacherId: UUIDStr
    studentId: UUIDStr


# ---------- teacher ----------
class UpdateMe(BaseModel):
    name: NonEmptyStr


class ChangePassword(BaseModel):
    oldPassword: NonEmptyStr
    newPassword: NonEmptyStr


class CreateConnectRequest(BaseModel):
    connectCode: NonEmptyStr
    remark: NonEmptyStr


class UpdateRemark(BaseModel):
    remark: NonEmptyStr


class SendMessage(BaseModel):
    studentIds: list[UUIDStr] = Field(min_length=1, max_length=500)
    message: NonEmptyStr
    tts: int = Field(ge=0, le=100)
    closeDelay: int = Field(ge=0, le=86400)

    @field_validator("studentIds")
    @classmethod
    def _unique(cls, v: list[str]) -> list[str]:
        if len(set(v)) != len(v):
            raise ValueError("studentIds must be unique")
        return v


class CloseMessageForStudent(BaseModel):
    studentId: UUIDStr
