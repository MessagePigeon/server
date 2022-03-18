# Message Pigeon Server

> The backend of Message Pigeon

## Preparation

1. PostgreSQL
2. Rename `.env.template` to `.env` and configure it

## Installation

```bash
# install dependencies
pnpm install

# init database
pnpm run db:push
```

## Running the app

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
