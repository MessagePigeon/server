from fastapi import Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    """Domain error carrying an HTTP status, a machine code, and a human message."""

    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


# Convenience constructors for the common cases ----------------------------------
def unauthorized(code: str = "UNAUTHORIZED", message: str = "Unauthorized") -> AppError:
    return AppError(401, code, message)


def forbidden(code: str, message: str) -> AppError:
    return AppError(403, code, message)


def not_found(code: str, message: str) -> AppError:
    return AppError(404, code, message)


def conflict(code: str, message: str) -> AppError:
    return AppError(409, code, message)


def _payload(code: str, message: str, **extra) -> dict:
    return {"code": code, "message": message, **extra}


def register_error_handlers(app) -> None:
    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=_payload(exc.code, exc.message),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=jsonable_encoder(
                _payload("VALIDATION_ERROR", "Request validation failed", details=exc.errors())
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException):
        # Normalise any raw HTTPException into the same envelope.
        return JSONResponse(
            status_code=exc.status_code,
            content=_payload("HTTP_ERROR", str(exc.detail)),
        )
