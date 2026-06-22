# Loads environment variables and exposes typed settings for the whole app.

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    """Central configuration read once at import time from .env."""

    port: int
    gemini_api_key: str
    model: str
    allowed_origins: list[str]
    max_transcript_chars: int
    max_question_length: int
    max_notes_context_chars: int


def _parse_origins(raw: str) -> list[str]:
    """Split comma-separated CORS origins and drop empty entries."""
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def get_settings() -> Settings:
    """Build settings from environment variables with sensible MVP defaults."""
    return Settings(
        port=int(os.getenv("PORT", "8000")),
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        model=os.getenv("MODEL", "gemini-2.5-flash"),
        allowed_origins=_parse_origins(
            os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
        ),
        max_transcript_chars=int(os.getenv("MAX_TRANSCRIPT_CHARS", "120000")),
        max_question_length=int(os.getenv("MAX_QUESTION_LENGTH", "1000")),
        max_notes_context_chars=int(os.getenv("MAX_NOTES_CONTEXT_CHARS", "200000")),
    )


settings = get_settings()
