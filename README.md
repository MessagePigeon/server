# Message Pigeon Server

> The backend of Message Pigeon

## Preparation

1. PostgreSQL
2. Rename `.env.template` to `.env` and configure it

## Installation

```bash
# install dependencies
npm install

# init database
npx prisma push
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Usage

### HTTP API

After run the app, open `/api-docs` in the browser

### WebSocket API

See [WebSocket API Docs](WEBSOCKET.md)
