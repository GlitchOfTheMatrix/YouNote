# Shared Gemini client and unified error handling.

import logging

from google import genai
from google.genai import errors, types

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiError(Exception):
    """Raised when an LLM call fails, with a user-safe message."""

    def __init__(self, message: str, *, status_code: int = 502) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _get_client() -> genai.Client:
    """Create a Gemini client; fail fast if the API key is missing."""
    if not settings.gemini_api_key:
        raise GeminiError(
            "The AI service is not configured.",
            status_code=500,
        )
    return genai.Client(api_key=settings.gemini_api_key)


def generate(
    user_prompt: str,
    system_instruction: str,
    temperature: float = 0.3,
) -> str:
    """Send a prompt to the LLM and return the text response with unified error handling."""
    client = _get_client()

    try:
        response = client.models.generate_content(
            model=settings.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
            ),
        )
    except errors.APIError as exc:
        if exc.code == 429:
            logger.error("Gemini rate limit hit: %s", exc)
            raise GeminiError(
                "The AI service is busy. Please try again in a moment.",
                status_code=429,
            ) from exc
        else:
            logger.error("Gemini API error (%s): %s", exc.code, exc)
            raise GeminiError(
                "The AI service returned an error. Please try again.",
                status_code=502,
            ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during Gemini generation")
        raise GeminiError(
            "Failed to contact the AI service. Please try again.",
            status_code=500,
        ) from exc

    content = response.text
    if not content or not content.strip():
        raise GeminiError(
            "The AI service returned an empty response.",
            status_code=502,
        )

    return content.strip()
