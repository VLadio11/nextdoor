from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/system", tags=["system"])


class SchedulerStatus(BaseModel):
    running: bool
    sim_mode: bool
    poll_interval_seconds: int
    next_run_time: datetime | None
    last_run_result: dict | None
    last_run_error: str | None


@router.get("/status", response_model=SchedulerStatus)
async def get_status():
    return SchedulerStatus(
        running=False,
        sim_mode=settings.sim_mode,
        poll_interval_seconds=settings.poll_interval_seconds,
        next_run_time=None,
        last_run_result={"posts_found": 8, "alerts_triggered": 5, "mode": "mock"},
        last_run_error=None,
    )


@router.post("/poll-now", status_code=202)
async def trigger_poll():
    return {"message": "Mock mode — no live polling", "timestamp": datetime.now(timezone.utc)}
