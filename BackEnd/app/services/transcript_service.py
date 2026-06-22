# Fetches and joins YouTube transcripts. No LLM or HTTP route logic here.

import logging

from youtube_transcript_api import (
    AgeRestricted,
    InvalidVideoId,
    IpBlocked,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
    YouTubeTranscriptApi,
)

from app.config import settings

logger = logging.getLogger(__name__)


class TranscriptError(Exception):
    """Base error for transcript fetch failures with a user-safe message."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class TranscriptUnavailableError(TranscriptError):
    """Raised when no usable transcript exists for the video."""


class TranscriptDisabledError(TranscriptError):
    """Raised when captions are disabled on the video."""


class VideoUnavailableError(TranscriptError):
    """Raised when the video cannot be accessed."""


def _join_fetched_transcript(fetched) -> str:
    """Combine fetched transcript snippets into one plain string."""
    return " ".join(snippet.text.strip() for snippet in fetched if snippet.text.strip())


def fetch_transcript(video_id: str) -> str:
    """Download the best available transcript and return it as plain text."""
    logger.info("Fetching transcript for video %s", video_id)
    api = YouTubeTranscriptApi()

    try:
        fetched = api.fetch(video_id)
    except TranscriptsDisabled as exc:
        raise TranscriptDisabledError(
            "Transcripts are disabled for this video."
        ) from exc
    except NoTranscriptFound as exc:
        raise TranscriptUnavailableError(
            "No transcript is available for this video."
        ) from exc
    except (VideoUnavailable, InvalidVideoId) as exc:
        raise VideoUnavailableError(
            "This video is unavailable or does not exist."
        ) from exc
    except AgeRestricted as exc:
        raise TranscriptUnavailableError(
            "This video is age-restricted and has no accessible transcript."
        ) from exc
    except (RequestBlocked, IpBlocked) as exc:
        logger.error("YouTube blocked transcript request for %s: %s", video_id, exc)
        raise TranscriptUnavailableError(
            "Could not fetch a transcript right now. Please try again later."
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected transcript error for %s", video_id)
        raise TranscriptUnavailableError(
            "Could not fetch a transcript for this video."
        ) from exc

    text = _join_fetched_transcript(fetched).strip()
    if not text:
        raise TranscriptUnavailableError(
            "The transcript for this video is empty."
        )

    if len(text) > settings.max_transcript_chars:
        logger.warning(
            "Transcript for %s exceeds limit (%d chars); truncating",
            video_id,
            settings.max_transcript_chars,
        )
        text = text[: settings.max_transcript_chars]

    logger.info("Transcript downloaded for video %s (%d chars)", video_id, len(text))
    return text
