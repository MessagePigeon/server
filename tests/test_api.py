from tests.helpers import (
    admin_token,
    auth,
    make_student,
    make_teacher,
    teacher_id_by_username,
)


async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


async def test_admin_login_and_protected_route(client):
    atok = await admin_token(client)
    ok = await client.get("/v1/admin/teachers?skip=0&take=10", headers=auth(atok))
    assert ok.status_code == 200
    # no token -> 401 with the error envelope
    no = await client.get("/v1/admin/teachers?skip=0&take=10")
    assert no.status_code == 401
    assert set(no.json()) >= {"code", "message"}


async def test_invalid_credentials_are_generic(client):
    r = await client.post("/v1/teacher/login", json={"username": "nope", "password": "x"})
    assert r.status_code == 401
    assert r.json()["code"] == "INVALID_CREDENTIALS"


async def test_validation_error_shape(client):
    r = await client.post("/v1/teacher/login", json={"username": "t1"})  # missing password
    assert r.status_code == 422
    assert r.json()["code"] == "VALIDATION_ERROR"


async def test_pagination_upper_bound(client):
    atok = await admin_token(client)
    r = await client.get("/v1/admin/teachers?skip=0&take=999", headers=auth(atok))
    assert r.status_code == 422


async def test_duplicate_teacher_is_conflict(client):
    atok = await admin_token(client)
    r1 = await client.post(
        "/v1/admin/teachers", json={"username": "dup", "name": "A"}, headers=auth(atok)
    )
    assert r1.status_code == 201
    r2 = await client.post(
        "/v1/admin/teachers", json={"username": "dup", "name": "B"}, headers=auth(atok)
    )
    assert r2.status_code == 409
    assert r2.json()["code"] == "USERNAME_TAKEN"


async def test_teacher_register_and_me(client):
    atok = await admin_token(client)
    ttok = await make_teacher(client, atok, username="alice", name="Alice")
    me = await client.get("/v1/teacher/me", headers=auth(ttok))
    assert me.status_code == 200
    assert me.json() == {"name": "Alice"}


async def test_send_message_requires_connection(client):
    """Authz fix #2: a teacher cannot message a student they're not connected to."""
    atok = await admin_token(client)
    ttok = await make_teacher(client, atok, username="t1")
    sid, _ = await make_student(client, atok)
    r = await client.post(
        "/v1/teacher/messages",
        json={"studentIds": [sid], "message": "hi", "tts": 0, "closeDelay": 0},
        headers=auth(ttok),
    )
    assert r.status_code == 403
    assert r.json()["code"] == "NOT_CONNECTED"


async def test_message_close_ownership(client):
    """Authz fix #1: a teacher cannot close another teacher's message."""
    atok = await admin_token(client)
    t1 = await make_teacher(client, atok, username="owner")
    t2 = await make_teacher(client, atok, username="intruder")
    t1_id = await teacher_id_by_username(client, atok, "owner")
    sid, _ = await make_student(client, atok)

    # connect student to t1, then t1 sends a message (populates showing state)
    await client.post(
        "/v1/admin/connections",
        json={"teacherId": t1_id, "studentId": sid},
        headers=auth(atok),
    )
    sent = await client.post(
        "/v1/teacher/messages",
        json={"studentIds": [sid], "message": "hi", "tts": 0, "closeDelay": 0},
        headers=auth(t1),
    )
    assert sent.status_code == 201
    mid = sent.json()["id"]

    # intruder cannot close it
    bad = await client.post(
        f"/v1/teacher/messages/{mid}/close", json={"studentId": sid}, headers=auth(t2)
    )
    assert bad.status_code == 404
    assert bad.json()["code"] == "MESSAGE_NOT_FOUND"

    # owner can
    ok = await client.post(
        f"/v1/teacher/messages/{mid}/close", json={"studentId": sid}, headers=auth(t1)
    )
    assert ok.status_code == 204


async def test_connection_conflict_and_message_flow(client):
    atok = await admin_token(client)
    ttok = await make_teacher(client, atok, username="t1")
    tid = await teacher_id_by_username(client, atok, "t1")
    sid, _ = await make_student(client, atok)

    c1 = await client.post(
        "/v1/admin/connections", json={"teacherId": tid, "studentId": sid}, headers=auth(atok)
    )
    assert c1.status_code == 201
    c2 = await client.post(
        "/v1/admin/connections", json={"teacherId": tid, "studentId": sid}, headers=auth(atok)
    )
    assert c2.status_code == 409 and c2.json()["code"] == "ALREADY_CONNECTED"

    # now messaging works
    sent = await client.post(
        "/v1/teacher/messages",
        json={"studentIds": [sid], "message": "hi", "tts": 1, "closeDelay": 5},
        headers=auth(ttok),
    )
    assert sent.status_code == 201

    # disconnect
    d = await client.delete(f"/v1/admin/connections/{tid}/{sid}", headers=auth(atok))
    assert d.status_code == 204


async def test_ban_revokes_existing_token(client):
    atok = await admin_token(client)
    ttok = await make_teacher(client, atok, username="t1")
    tid = await teacher_id_by_username(client, atok, "t1")

    before = await client.get("/v1/teacher/me", headers=auth(ttok))
    assert before.status_code == 200

    ban = await client.put(f"/v1/admin/teachers/{tid}/ban", json={"ban": True}, headers=auth(atok))
    assert ban.status_code == 204

    after = await client.get("/v1/teacher/me", headers=auth(ttok))
    assert after.status_code == 401
