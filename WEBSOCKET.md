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

| Event                    | Description                          | Data                                                                                           |
| ------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| logout                   | caused by duplicate login            | /                                                                                              |
| connect-request          | teacher want to connect this student | `{ requestId: string, teacherName: string }`                                                   |
| message                  | message sent by teacher              | `{ messageId: number, message: string, teacherName: string, tts: number, closeDelay: number }` |
| teacher-disconnect       | disconnect by teacher (or admin)     | `{ teacherId: string }`                                                                        |
| teacher-connect-by-admin | connect teacher by admin forcibly    | `{ teacherId: string, teacherName: string }`                                                   |

### Teacher

| Event                       | Description                          | Data                                                    |
| --------------------------- | ------------------------------------ | ------------------------------------------------------- |
| reject-connect-request      | student reject connect               | `{ requestId: string }`                                 |
| accept-connect-request      | student accept connect               | `{ requestId: string }`                                 |
| student-online              | /                                    | `{ studentId: string }`                                 |
| student-offline             | /                                    | `{ studentId: string }`                                 |
| message-close               | close the message                    | `{ messageId: number, studentId: string }`              |
| student-connect-by-admin    | connect student by admin forcibly    | `{ studentId: string, remark: string, online:boolean }` |
| student-disconnect-by-admin | disconnect student by admin forcibly | `{ studentId: string }`                                 |
