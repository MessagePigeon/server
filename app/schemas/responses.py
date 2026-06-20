from datetime import datetime

from pydantic import BaseModel


class Token(BaseModel):
    token: str


class CreatedTeacher(BaseModel):
    id: str
    password: str


class NewPassword(BaseModel):
    username: str
    newPassword: str


class CreatedStudent(BaseModel):
    id: str
    key: str
    defaultRemark: str


class RegisterCodeOut(BaseModel):
    id: int
    code: str


class StudentBrief(BaseModel):
    id: str
    defaultRemark: str


class TeacherBrief(BaseModel):
    id: str
    name: str


class TeacherOut(BaseModel):
    id: str
    username: str
    name: str
    students: list[StudentBrief]
    ban: bool
    online: bool


class StudentOut(BaseModel):
    id: str
    key: str
    defaultRemark: str
    teachers: list[TeacherBrief]
    ban: bool
    online: bool


class AdminMessageOut(BaseModel):
    id: int
    createdAt: datetime
    message: str
    teacher: TeacherBrief
    students: list[StudentBrief]


class TeacherMessageOut(BaseModel):
    id: int
    createdAt: datetime
    message: str
    studentIds: list[str]
    showingIds: list[str]


class StudentMessageOut(BaseModel):
    id: int
    createdAt: datetime
    message: str
    teacherName: str


class RosterStudent(BaseModel):
    id: str
    remark: str
    online: bool


class Me(BaseModel):
    name: str


class StudentMe(BaseModel):
    defaultRemark: str


class ConnectCode(BaseModel):
    connectCode: str


class ConnectRequestCreated(BaseModel):
    requestId: str
    studentId: str
    remark: str


class AcceptedConnect(BaseModel):
    teacherId: str
    teacherName: str


class SentMessage(BaseModel):
    id: int
    createdAt: datetime
    message: str
    studentIds: list[str]


class Config(BaseModel):
    teacherUrl: str
