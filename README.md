# Message Pigeon Server

> The backend of Message Pigeon

## Docker (recommended)

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

The app runs at `http://localhost:3000`. The database is persisted in a named Docker volume and the schema is synced automatically on each start.

To stop:

```bash
docker compose down
```

## Manual setup

### Preparation

1. PostgreSQL
2. Rename `.env.template` to `.env` and configure it

### Installation

```bash
# install dependencies
pnpm install

# init database
pnpm run db:push
```

### Running the app

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Usage

### HTTP API

After run the app, open `/api-docs` in the browser

### WebSocket API

See [WebSocket API Docs](WEBSOCKET.md)
