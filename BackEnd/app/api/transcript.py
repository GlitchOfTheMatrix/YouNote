# POST /transcript — validate URL, fetch transcript, return raw text (no LLM).
# POST /transcript-from-extension — accept pre-fetched transcript from extension.

import logging

from fastapi import APIRouter, HTTPException

from app.models.request import TranscriptRequest, ExtensionTranscriptRequest
from app.models.response import TranscriptResponse
from app.api.helpers import fetch_transcript_or_raise
from app.utils.youtube import extract_video_id, fetch_video_title
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["transcript"])


@router.post("/transcript", response_model=TranscriptResponse)
def get_transcript(body: TranscriptRequest) -> TranscriptResponse:
    """Return the raw YouTube transcript without any AI processing (server-side fetch)."""
    logger.info("Transcript request received (server-side)")

    video_id = extract_video_id(body.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    transcript = fetch_transcript_or_raise(video_id)

    title = fetch_video_title(video_id)
    return TranscriptResponse(title=title, videoId=video_id, transcript=transcript)


@router.post("/transcript-from-extension", response_model=TranscriptResponse)
def get_transcript_from_extension(body: ExtensionTranscriptRequest) -> TranscriptResponse:
    """Return the transcript provided by the browser extension (no server-side fetch needed)."""
    logger.info("Transcript request received (from extension, videoId=%s)", body.videoId)

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

    title = fetch_video_title(body.videoId)
    return TranscriptResponse(title=title, videoId=body.videoId, transcript=transcript)
