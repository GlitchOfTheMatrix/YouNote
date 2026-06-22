from fastapi import HTTPException
from app.services.transcript_service import (
    TranscriptDisabledError,
    TranscriptError,
    TranscriptUnavailableError,
    VideoUnavailableError,
    fetch_transcript,
)

def fetch_transcript_or_raise(video_id: str) -> str:
    """Wraps fetch_transcript with HTTP error mapping."""
    try:
        return fetch_transcript(video_id)
    except VideoUnavailableError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    except (TranscriptDisabledError, TranscriptUnavailableError, TranscriptError) as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc
