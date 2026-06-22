# Health check route for uptime monitoring and load balancers.

from fastapi import APIRouter

from app.models.response import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Confirm the API process is running."""
    return HealthResponse(status="ok")
