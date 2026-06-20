"""Typed contract for server -> client WebSocket events.

These models document the WebSocket protocol and are surfaced in `openapi.json`
(as `WsStudentEvent` / `WsTeacherEvent`) for frontend type generation. They are
documentation/contract models; the drift test in `tests/test_ws_events.py` keeps
them in sync with the event names actually emitted by `socket_send`.
"""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field


# ---- payloads ----
class ConnectRequestedPayload(BaseModel):
    requestId: str
    teacherName: str


class MessagePayload(BaseModel):
    messageId: int
    createdAt: datetime
    message: str
    teacherName: str
    tts: int
    closeDelay: int


class MessageClosedToStudentPayload(BaseModel):
    messageId: int


class TeacherConnectedPayload(BaseModel):
    teacherId: str
    teacherName: str


class TeacherDisconnectedPayload(BaseModel):
    teacherId: str


class TeacherNameChangedPayload(BaseModel):
    teacherId: str
    name: str


class RequestIdPayload(BaseModel):
    requestId: str


class StudentIdPayload(BaseModel):
    studentId: str


class MessageClosedToTeacherPayload(BaseModel):
    messageId: int
    studentId: str


class StudentConnectedPayload(BaseModel):
    studentId: str
    remark: str
    online: bool


# ---- student envelopes ----
class ConnectRequested(BaseModel):
    event: Literal["connect-requested"]
    data: ConnectRequestedPayload


class Message(BaseModel):
    event: Literal["message"]
    data: MessagePayload


class MessageClosedToStudent(BaseModel):
    event: Literal["message-closed"]
    data: MessageClosedToStudentPayload


class TeacherConnected(BaseModel):
    event: Literal["teacher-connected"]
    data: TeacherConnectedPayload


class TeacherDisconnected(BaseModel):
    event: Literal["teacher-disconnected"]
    data: TeacherDisconnectedPayload


class TeacherNameChanged(BaseModel):
    event: Literal["teacher-name-changed"]
    data: TeacherNameChangedPayload


# ---- teacher envelopes ----
class ConnectRequestAccepted(BaseModel):
    event: Literal["connect-request-accepted"]
    data: RequestIdPayload


class ConnectRequestRejected(BaseModel):
    event: Literal["connect-request-rejected"]
    data: RequestIdPayload


class StudentOnline(BaseModel):
    event: Literal["student-online"]
    data: StudentIdPayload


class StudentOffline(BaseModel):
    event: Literal["student-offline"]
    data: StudentIdPayload


class MessageClosedToTeacher(BaseModel):
    event: Literal["message-closed"]
    data: MessageClosedToTeacherPayload


class StudentConnected(BaseModel):
    event: Literal["student-connected"]
    data: StudentConnectedPayload


class StudentDisconnected(BaseModel):
    event: Literal["student-disconnected"]
    data: StudentIdPayload


# ---- unions (discriminated by `event`) ----
WsStudentEvent = Annotated[
    ConnectRequested
    | Message
    | MessageClosedToStudent
    | TeacherConnected
    | TeacherDisconnected
    | TeacherNameChanged,
    Field(discriminator="event"),
]

WsTeacherEvent = Annotated[
    ConnectRequestAccepted
    | ConnectRequestRejected
    | StudentOnline
    | StudentOffline
    | MessageClosedToTeacher
    | StudentConnected
    | StudentDisconnected,
    Field(discriminator="event"),
]
