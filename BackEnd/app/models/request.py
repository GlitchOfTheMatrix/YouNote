# Pydantic request models for API input validation.

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.utils.youtube import is_valid_youtube_url


class _YouTubeUrlBase(BaseModel):
    """Shared URL field + validator for endpoints that accept a YouTube link."""

    url: str = Field(..., min_length=1)

    @field_validator("url")
    @classmethod
    def validate_youtube_url(cls, value: str) -> str:
        """Reject URLs that are not recognizable YouTube video links."""
        trimmed = value.strip()
        if not is_valid_youtube_url(trimmed):
            raise ValueError("Invalid YouTube URL")
        return trimmed


class NotesRequest(_YouTubeUrlBase):
    """Body for POST /notes — a YouTube URL and generation mode."""

    mode: Literal["full", "summary"] = "full"


class TranscriptRequest(_YouTubeUrlBase):
    """Body for POST /transcript — just a YouTube URL, no generation mode."""
    pass


class ChatRequest(BaseModel):
    """Body for POST /chat — generated notes plus a follow-up question."""

    notes: str = Field(..., min_length=1)
    question: str = Field(
        ...,
        min_length=1,
        max_length=settings.max_question_length,
    )

    @field_validator("notes", "question")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        """Normalize user text and reject blank strings after trimming."""
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Field cannot be empty")
        return trimmed
