"""In-memory runtime state (single process / single event loop -> no locks needed)."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

from fastapi import WebSocket

Role = Literal["student", "teacher"]


@dataclass
class OnlineClient:
    id: str
    role: Role
    client: WebSocket


@dataclass
class OnlineTeacher:
    id: str
    clients: set[WebSocket]


@dataclass
class OnlineStudent:
    id: str
    client: WebSocket
    connectCode: str


@dataclass
class ConnectRequest:
    id: str
    teacherId: str
    studentId: str
    remark: str
    createdAt: datetime


@dataclass
class ShowingMessage:
    id: int
    teacherId: str
    studentIds: set[str]
    closedStudentIds: set[str]
    createdAt: datetime


@dataclass
class State:
    online_clients: list[OnlineClient] = field(default_factory=list)
    online_teachers: list[OnlineTeacher] = field(default_factory=list)
    online_students: list[OnlineStudent] = field(default_factory=list)
    connect_requests: list[ConnectRequest] = field(default_factory=list)
    showing_messages: list[ShowingMessage] = field(default_factory=list)


state = State()


def find_by_id(items: list, id_) -> object | None:
    for item in items:
        if item.id == id_:
            return item
    return None


def delete_by_id(items: list, id_) -> bool:
    for i, item in enumerate(items):
        if item.id == id_:
            del items[i]
            return True
    return False
