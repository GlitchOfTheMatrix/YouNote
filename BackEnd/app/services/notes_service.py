# Calls the LLM to turn a transcript into markdown notes. No HTTP logic here.

import logging
from typing import Literal

from app.prompts import NOTES_SYSTEM_PROMPT, NOTES_USER_PROMPT_FULL, NOTES_USER_PROMPT_SUMMARY
from app.services.gemini import generate

logger = logging.getLogger(__name__)


def _build_user_prompt(transcript: str, mode: Literal["full", "summary"]) -> str:
    """Pick the prompt template that matches the requested note depth."""
    template = NOTES_USER_PROMPT_SUMMARY if mode == "summary" else NOTES_USER_PROMPT_FULL
    return template.format(transcript=transcript)


def generate_notes(transcript: str, mode: Literal["full", "summary"]) -> str:
    """Send the transcript to the LLM and return markdown notes."""
    logger.info("LLM notes request started (mode=%s)", mode)
    
    content = generate(
        user_prompt=_build_user_prompt(transcript, mode),
        system_instruction=NOTES_SYSTEM_PROMPT,
        temperature=0.3,
    )
    
    logger.info("LLM notes request finished (mode=%s)", mode)
    return content
