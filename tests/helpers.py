"""Shared helpers for the API tests."""

ADMIN_PW = "admin-pw"


async def admin_token(client) -> str:
    r = await client.post("/v1/admin/login", json={"password": ADMIN_PW})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def make_teacher(client, atok, username="t1", name="Teacher", password="pw") -> str:
    """Create a teacher via admin + a register code flow; return the teacher's login token."""
    await client.post("/v1/admin/register-codes", json={"count": 1}, headers=auth(atok))
    codes = await client.get("/v1/admin/register-codes?skip=0&take=10", headers=auth(atok))
    code = codes.json()["data"][0]["code"]
    r = await client.post(
        "/v1/teacher/register",
        json={"username": username, "password": password, "name": name, "registerCode": code},
    )
    assert r.status_code == 201, r.text
    login = await client.post(
        "/v1/teacher/login", json={"username": username, "password": password}
    )
    return login.json()["token"]


async def teacher_id_by_username(client, atok, username) -> str:
    r = await client.get("/v1/admin/teachers?skip=0&take=50", headers=auth(atok))
    return next(t["id"] for t in r.json()["data"] if t["username"] == username)


async def make_student(client, atok, remark="Kid") -> tuple[str, str]:
    """Create a student; return (student_id, login_token)."""
    r = await client.post(
        "/v1/admin/students", json={"defaultRemark": remark}, headers=auth(atok)
    )
    body = r.json()
    login = await client.post("/v1/student/login", json={"key": body["key"]})
    return body["id"], login.json()["token"]
