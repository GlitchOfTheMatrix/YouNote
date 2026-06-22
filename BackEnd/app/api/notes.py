# POST /notes — validate URL, fetch transcript, generate markdown notes.

import logging

from fastapi import APIRouter, HTTPException

from app.models.request import NotesRequest
from app.models.response import NotesResponse
from app.services.gemini import GeminiError
from app.services.notes_service import generate_notes
from app.api.helpers import fetch_transcript_or_raise
from app.utils.youtube import extract_video_id, fetch_video_title

logger = logging.getLogger(__name__)

router = APIRouter(tags=["notes"])


@router.post("/notes", response_model=NotesResponse)
def create_notes(body: NotesRequest) -> NotesResponse:
    """Generate AI notes for a YouTube video URL."""
    logger.info("Notes request received (mode=%s)", body.mode)

    video_id = extract_video_id(body.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    try:
        transcript = fetch_transcript_or_raise(video_id)
        notes = generate_notes(transcript, body.mode)
    except GeminiError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    title = fetch_video_title(video_id)
    return NotesResponse(title=title, videoId=video_id, notes=notes)
