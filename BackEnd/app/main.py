# FastAPI application entry point — wires routes, CORS, logging, and error handling.

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.notes import router as notes_router
from app.api.transcript import router as transcript_router
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="YouNote API",
    description="Convert YouTube videos into AI-generated notes.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"^chrome-extension://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(notes_router)
app.include_router(chat_router)
app.include_router(transcript_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Return a clean 422 when Pydantic rejects the request body."""
    errors = exc.errors()
    if errors:
        first = errors[0]
        message = first.get("msg", "Invalid request")
        if message.startswith("Value error, "):
            message = message.removeprefix("Value error, ")
    else:
        message = "Invalid request"

    logger.warning("Validation error: %s", message)
    return JSONResponse(status_code=422, content={"detail": message})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, _exc: Exception) -> JSONResponse:
    """Catch unexpected failures and return a generic message without stack traces."""
    logger.exception("Unhandled server error")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )
