# Message Pigeon Server

> The backend of Message Pigeon — teachers push real-time messages to students.

FastAPI (Python 3.12) · SQLModel + async SQLAlchemy on PostgreSQL · native
WebSocket · APScheduler. Dependencies and the virtualenv are managed with **uv**.

---

## Quick start

**Production (Docker)** — full stack, app baked into the image, single process:

```bash
cp .env.template .env        # edit secrets for production
docker compose up --build    # subsequent runs: docker compose up
```

**Local development (uv)** — app runs natively, only the DB in Docker:

```bash
uv sync                          # install deps (pinned Python 3.12 via .python-version)
cp .env.template .env            # defaults point at localhost:5433
docker compose up -d postgres    # database, published on host port 5433
uv run uvicorn app.main:app --reload --port 3000
```

The app serves on <http://localhost:3000>. Tables are created on startup — no
migration step.

> The app runs as a **single process**: WebSocket/online state lives in memory and
> must not be split across workers or replicas.

For the full dev + deploy guide, see the sections below.

---

## API conventions

- **Versioned**: all routes are under `/v1`. Swagger UI at `/api-docs`, OpenAPI
  JSON at `/openapi.json`. Health probe at `/health`.
- **Auth**: `Authorization: Bearer <token>` from `/v1/{admin,teacher,student}/login`.
  The JWT carries the role; banning a user revokes their existing tokens.
- **Errors**: a consistent envelope `{ "code": "MACHINE_CODE", "message": "..." }`
  with honest status codes (`401` auth, `403` forbidden, `404` missing,
  `409` conflict, `422` validation).
- **Lists**: `{ "data": [...], "total": n, "skip": n, "take": n }`. `skip` defaults
  to 0, `take` defaults to 20 (max 100).
- **Mutations**: return `204 No Content` (creates return `201` with the new resource).
- **WebSocket**: `ws://localhost:3000/v1/ws?token=<jwt>` — see [WEBSOCKET.md](WEBSOCKET.md).

## API spec & frontend codegen

`openapi.json` (OpenAPI 3.1) is committed at the repo root as the API contract.
Regenerate it after changing any route or WebSocket event:

```bash
uv run python -m app.export_openapi   # writes openapi.json (no server/DB needed)
```

CI fails if the committed `openapi.json` is stale. WebSocket events are part of the
same spec as the schemas **`WsStudentEvent`** and **`WsTeacherEvent`**
(discriminated by `event`), so a single generator covers REST *and* WS payloads.

Generate TypeScript types in your frontend from that file, e.g.:

```bash
npx openapi-typescript openapi.json -o src/api/schema.d.ts
# WS payloads: components["schemas"]["WsStudentEvent"] / ["WsTeacherEvent"]
```

## Project layout

```
app/
  main.py                FastAPI assembly: CORS, lifespan, routers, error handlers
  core/                  config, security (JWT/argon2), errors, pagination
  db.py  state.py        async engine/session; in-memory runtime state
  models.py              SQLModel tables
  schemas/               requests.py (validation) + responses.py (typed output)
  services/              business logic (auth, admin, teacher, student, connection, message)
  api/v1/                deps.py + routers/ (thin HTTP layer)
  ws/                    send.py (I/O) · service.py (lifecycle) · gateway.py (endpoint)
  tasks.py               APScheduler cleanup job
tests/                   pytest (httpx) suite
```

The HTTP layer (`api/v1/routers`) is thin; all logic lives in `services/`, which
are plain async functions and unit-testable without HTTP.

## Environment variables

| Variable | Example | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the app listens on |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:password@localhost:5433/pigeon` | Async Postgres URL (`postgresql+asyncpg://` scheme) |
| `JWT_SECRET` | `secret` | JWT signing secret — set a strong value in production |
| `JWT_EXPIRES_IN` | `1 weeks` | Token lifetime, [ms](https://github.com/vercel/ms) format |
| `ADMIN_PASSWORD` | `password` | Admin login password — set a strong value in production |
| `ADMIN_TOKEN_VERSION` | `1` | Bump to revoke all existing admin tokens |
| `TEACHER_URL` | `https://example.mpigeon.xyz` | Teacher web URL exposed via `/v1/config` |

In Docker, `docker-compose.yml` overrides `DATABASE_URL` to reach the `postgres`
service, so `.env` can keep its localhost value for local dev.

## Development workflow

```bash
uv sync                 # install / update dependencies (incl. dev tools)
uv run pytest -q        # run the test suite (uses an in-memory SQLite DB)
uv run ruff check .     # lint
uv run ruff format .    # format
```

The dev database is published on **5433** (not 5432) to avoid clashing with a
Postgres you may already run on the default port.

## Deployment (Docker)

```bash
cp .env.template .env        # set strong JWT_SECRET / ADMIN_PASSWORD, real TEACHER_URL
docker compose up --build -d
docker compose logs -f app
docker compose down          # stop (keeps data); add -v to delete the DB volume
```

Deploy a new version:

```bash
git pull && docker compose up --build -d
```

Production checklist:

- Strong `JWT_SECRET` and `ADMIN_PASSWORD`; correct `TEACHER_URL`.
- TLS-terminating reverse proxy in front that forwards **WebSocket upgrade headers**
  for `/v1/ws`.
- Keep it a **single replica** (in-memory WebSocket state).
- Back up the `pgdata` volume if the data matters.

| Service | In container | Published on host |
|---------|--------------|-------------------|
| app | 3000 | 3000 |
| postgres | 5432 | 5433 |

## Database

SQLModel (async SQLAlchemy + asyncpg). Tables are auto-created on startup; there
are no migrations — edit `app/models.py` and restart, or recreate the DB
(`docker compose down -v`) for destructive changes. Models: `RegisterCode`,
`Teacher`, `Student`, `StudentRemark` (the teacher↔student connection + remark),
`Message`, and the `Message`↔`Student` link table.

## Troubleshooting

- **Port 5433 in use** — change the host port in `docker-compose.yml` and update
  `DATABASE_URL`.
- **`role "postgres" does not exist` locally** — `DATABASE_URL` is hitting a
  different Postgres; confirm the dev DB is up (`docker compose ps`) and the port matches.
- **`greenlet` / Python version errors** — ensure uv uses Python 3.12 (pinned by
  `.python-version`); recreate with `rm -rf .venv && uv sync`.
- **WebSocket disconnects behind a proxy** — forward `Upgrade`/`Connection` headers.
- **Reset everything** — `docker compose down -v`.
