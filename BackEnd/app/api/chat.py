# POST /chat — answer follow-up questions grounded in generated notes.

import logging

from fastapi import APIRouter, HTTPException

from app.models.request import ChatRequest
from app.models.response import ChatResponse
from app.services.gemini import GeminiError
from app.services.chat_service import answer_question

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest) -> ChatResponse:
    """Answer a user question using the provided notes as sole context."""
    logger.info("Chat request received")

    try:
        answer = answer_question(body.notes, body.question)
    except GeminiError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return ChatResponse(answer=answer)
