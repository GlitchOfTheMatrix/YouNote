# POST /transcript — validate URL, fetch transcript, return raw text (no LLM).

import logging

from fastapi import APIRouter, HTTPException

from app.models.request import TranscriptRequest
from app.models.response import TranscriptResponse
from app.api.helpers import fetch_transcript_or_raise
from app.utils.youtube import extract_video_id, fetch_video_title

logger = logging.getLogger(__name__)

router = APIRouter(tags=["transcript"])


@router.post("/transcript", response_model=TranscriptResponse)
def get_transcript(body: TranscriptRequest) -> TranscriptResponse:
    """Return the raw YouTube transcript without any AI processing."""
    logger.info("Transcript request received")

    video_id = extract_video_id(body.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    transcript = fetch_transcript_or_raise(video_id)

    title = fetch_video_title(video_id)
    return TranscriptResponse(title=title, videoId=video_id, transcript=transcript)
