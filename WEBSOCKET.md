# WebSocket API

## Convention

According to [nestjs](https://docs.nestjs.com/websockets/gateways), we obey **event-data** format and transfer by json

```json
{
  "event": "EVENT NAME",
  "data": { "SOME": "DATA" }
}
```

## Initialization

After login, send this to server

```json
{
  "event": "online",
  "data": {
    "token": "jwt token",
    "role": "teacher (or student)"
  }
}
```

## Events

> All events are sent by server

### Student

| Event              | Description                          | Data                                                   |
| ------------------ | ------------------------------------ | ------------------------------------------------------ |
| logout             | caused by duplicate login            | /                                                      |
| connect-request    | teacher want to connect this student | `{ requestId, teacherName }`                           |
| message            | message sent by teacher              | `{ messageId, message, teacherName, tts, closeDelay }` |
| teacher-disconnect | /                                    | `{ teacherId }`                                        |

### Teacher

| Event                  | Description            | Data            |
| ---------------------- | ---------------------- | --------------- |
| reject-connect-request | student reject connect | `{ studentId }` |
| accept-connect-request | student accept connect | `{ studentId }` |
| student-online         | /                      | `{ studentId }` |
| student-offline        | /                      | `{ studentId }` |
| message-close          | close the message      | `{ studentId }` |
