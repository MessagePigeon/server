from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db import init_db
from app.routers import admin, student, teacher
from app.tasks import start_scheduler
from app.ws import gateway


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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Match NestJS ValidationPipe: 400 Bad Request (FastAPI defaults to 422).
    return JSONResponse(
        status_code=400,
        content=jsonable_encoder(
            {"statusCode": 400, "message": exc.errors(), "error": "Bad Request"}
        ),
    )


app.include_router(admin.router)
app.include_router(teacher.router)
app.include_router(student.router)
app.include_router(gateway.router)
