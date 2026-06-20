# Message Pigeon Server

> The backend of Message Pigeon — Python / FastAPI

## Production (Docker)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# copy env and start (first run builds the image)
cp .env.template .env
docker compose up --build
```

Subsequent starts:

```bash
docker compose up
```

The app runs at `http://localhost:3000`. PostgreSQL is persisted in a named Docker
volume, and the schema is created automatically on startup. `docker-compose.yml`
overrides `DATABASE_URL` to point at the `postgres` service, so `.env` can keep its
local-dev value.

To stop:

```bash
docker compose down
```

> The app runs as a **single process** — its WebSocket state is held in memory and
> must not be split across workers.

## Local development (uv, no Docker)

Requires [uv](https://docs.astral.sh/uv/) and a PostgreSQL instance.

```bash
# 1. install dependencies (creates .venv)
uv sync

# 2. set up env (defaults point at localhost:5433)
cp .env.template .env

# 3. start just the database (exposed on host port 5433)
docker compose up -d postgres

# 4. run the app with autoreload
uv run uvicorn app.main:app --reload --port 3000
```

Tables are created on startup; no migration step is needed.

## Usage

### HTTP API

Open `/api-docs` in the browser for the Swagger UI (OpenAPI JSON at `/openapi.json`).

### WebSocket API

See [WebSocket API Docs](WEBSOCKET.md). Connect to `ws://localhost:3000/`.
