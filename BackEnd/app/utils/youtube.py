# YouTube URL parsing and video metadata helpers used across services.

import logging
import re
from urllib.parse import parse_qs, urlparse

import httpx

logger = logging.getLogger(__name__)

VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


def _is_valid_video_id(video_id: str) -> bool:
    """Return True when the id matches YouTube's 11-character format."""
    return bool(VIDEO_ID_PATTERN.match(video_id))


def extract_video_id(url: str) -> str | None:
    """Pull an 11-character video id from common YouTube URL shapes."""
    trimmed = url.strip()
    if not trimmed:
        return None

    try:
        parsed = urlparse(trimmed)
    except ValueError:
        return None

    host = parsed.netloc.lower().removeprefix("www.").removeprefix("m.")

    if host == "youtu.be":
        candidate = parsed.path.lstrip("/").split("/")[0]
        return candidate if _is_valid_video_id(candidate) else None

    if host in {"youtube.com", "youtube-nocookie.com"}:
        if parsed.path == "/watch":
            video_ids = parse_qs(parsed.query).get("v", [])
            if video_ids and _is_valid_video_id(video_ids[0]):
                return video_ids[0]
            return None

        path_parts = [part for part in parsed.path.split("/") if part]
        if len(path_parts) >= 2 and path_parts[0] in {"shorts", "embed", "live"}:
            candidate = path_parts[1]
            return candidate if _is_valid_video_id(candidate) else None

    return None


def is_valid_youtube_url(url: str) -> bool:
    """Return True when the string contains a recognizable YouTube video link."""
    return extract_video_id(url) is not None


def fetch_video_title(video_id: str) -> str:
    """Fetch the public video title via YouTube oEmbed; fall back to the id on failure."""
    watch_url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                "https://www.youtube.com/oembed",
                params={"url": watch_url, "format": "json"},
            )
            if response.status_code == 200:
                title = response.json().get("title")
                if isinstance(title, str) and title.strip():
                    return title.strip()
    except httpx.HTTPError as exc:
        logger.warning("Could not fetch title for %s: %s", video_id, exc)

    return video_id
