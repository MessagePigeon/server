from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers import admin, auth, config, student, teacher
from app.core.errors import register_error_handlers
from app.db import init_db
from app.tasks import start_scheduler
from app.ws import gateway

V1 = "/v1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_scheduler()
    yield


app = FastAPI(title="Message Pigeon", docs_url="/api-docs", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)


@app.get("/health", tags=["ops"])
async def health():
    return {"status": "ok"}


for r in (auth.router, admin.router, teacher.router, student.router, config.router):
    app.include_router(r, prefix=V1)

# WebSocket route already carries its own /v1/ws path.
app.include_router(gateway.router)
