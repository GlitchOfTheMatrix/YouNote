# Answers follow-up questions using generated notes as the only context.

import logging

from app.config import settings
from app.prompts import CHAT_SYSTEM_PROMPT, CHAT_USER_PROMPT
from app.services.gemini import generate

logger = logging.getLogger(__name__)


def _trim_notes(notes: str) -> str:
    """Limit notes size before sending them to the LLM as context."""
    if len(notes) <= settings.max_notes_context_chars:
        return notes
    return notes[: settings.max_notes_context_chars]


def answer_question(notes: str, question: str) -> str:
    """Ask the LLM to answer a question using only the provided notes."""
    logger.info("LLM chat request started")
    trimmed_notes = _trim_notes(notes)
    
    content = generate(
        user_prompt=CHAT_USER_PROMPT.format(
            notes=trimmed_notes,
            question=question,
        ),
        system_instruction=CHAT_SYSTEM_PROMPT,
        temperature=0.2,
    )
    
    logger.info("LLM chat request finished")
    return content
