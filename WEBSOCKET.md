# WebSocket API

## Connecting

Authenticate during the handshake by passing the JWT from `/v1/teacher/login` or
`/v1/student/login` as a query parameter:

```
ws://localhost:3000/v1/ws?token=<jwt>
```

The role (teacher or student) is derived from the token — there is no `online`
message to send. If the token is missing, invalid, expired, the account is
banned, or the token has been revoked, the server **closes the connection with
code `1008`**.

There are no client → server messages; the server only pushes events.

## Message format

Every server message is JSON:

```json
{ "event": "EVENT_NAME", "data": { "SOME": "DATA" } }
```

> These events are also part of `openapi.json` as the discriminated-union schemas
> **`WsStudentEvent`** and **`WsTeacherEvent`** (source of truth:
> `app/ws/events.py`), so frontend type generation covers them. The tables below
> are the human-readable reference.

## Close codes

| Code | Meaning |
| ---- | ------- |
| `1008` | Authentication failed (bad/expired/revoked token). |
| `4001` | Replaced — the same account connected elsewhere (one connection per student). |
| `4003` | Revoked — banned or force-logged-out by an admin. |

## Events

> All events are sent by the server.

### Student

| Event | Description | Data |
| ----- | ----------- | ---- |
| `connect-requested` | A teacher wants to connect to this student | `{ requestId: string, teacherName: string }` |
| `message` | Message from a teacher | `{ messageId: number, createdAt: string, message: string, teacherName: string, tts: number, closeDelay: number }` |
| `message-closed` | A message was closed (by the teacher) | `{ messageId: number }` |
| `teacher-connected` | An admin connected a teacher to this student | `{ teacherId: string, teacherName: string }` |
| `teacher-disconnected` | A teacher (or admin) disconnected | `{ teacherId: string }` |
| `teacher-name-changed` | A connected teacher renamed | `{ teacherId: string, name: string }` |

### Teacher

| Event | Description | Data |
| ----- | ----------- | ---- |
| `connect-request-accepted` | Student accepted a connect request | `{ requestId: string }` |
| `connect-request-rejected` | Student rejected a connect request | `{ requestId: string }` |
| `student-online` | A connected student came online | `{ studentId: string }` |
| `student-offline` | A connected student went offline | `{ studentId: string }` |
| `message-closed` | A student closed a message | `{ messageId: number, studentId: string }` |
| `student-connected` | An admin connected a student to this teacher | `{ studentId: string, remark: string, online: boolean }` |
| `student-disconnected` | An admin disconnected a student | `{ studentId: string }` |
