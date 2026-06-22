# Pydantic response models returned by API endpoints.

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Simple liveness payload for GET /health."""

    status: str


class NotesResponse(BaseModel):
    """Generated markdown notes for a single YouTube video."""

    title: str
    videoId: str
    notes: str


class ChatResponse(BaseModel):
    """Answer to a follow-up question grounded in the notes."""

    answer: str


class TranscriptResponse(BaseModel):
    """Raw transcript text for a single YouTube video."""

    title: str
    videoId: str
    transcript: str
