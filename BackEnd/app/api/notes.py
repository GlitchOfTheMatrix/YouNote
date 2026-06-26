# POST /notes — validate URL, fetch transcript, generate markdown notes.
# POST /notes-from-extension — accept pre-fetched transcript, generate notes.

import logging

from fastapi import APIRouter, HTTPException

from app.models.request import NotesRequest, ExtensionNotesRequest
from app.models.response import NotesResponse
from app.services.gemini import GeminiError
from app.services.notes_service import generate_notes
from app.api.helpers import fetch_transcript_or_raise
from app.utils.youtube import extract_video_id, fetch_video_title
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["notes"])


@router.post("/notes", response_model=NotesResponse)
def create_notes(body: NotesRequest) -> NotesResponse:
    """Generate AI notes for a YouTube video URL (server-side transcript fetch)."""
    logger.info("Notes request received (mode=%s, server-side)", body.mode)

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


@router.post("/notes-from-extension", response_model=NotesResponse)
def create_notes_from_extension(body: ExtensionNotesRequest) -> NotesResponse:
    """Generate AI notes using a transcript provided by the browser extension."""
    logger.info("Notes request received (mode=%s, from extension, videoId=%s)", body.mode, body.videoId)

    transcript = body.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript is empty")

    # Enforce the same length limit as server-side fetching
    if len(transcript) > settings.max_transcript_chars:
        logger.warning(
            "Extension transcript for %s exceeds limit (%d chars); truncating",
            body.videoId,
            settings.max_transcript_chars,
        )
        transcript = transcript[: settings.max_transcript_chars]

    try:
        notes = generate_notes(transcript, body.mode)
    except GeminiError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    title = fetch_video_title(body.videoId)
    return NotesResponse(title=title, videoId=body.videoId, notes=notes)
