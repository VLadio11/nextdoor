from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from app.config import settings
from app.logging_config import get_logger
from app.scheduler import get_last_run_error, get_last_run_result, scheduler

logger = get_logger(__name__)
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
    job = scheduler.get_job("nextdoor_poll")
    next_run = job.next_run_time if job else None

    return SchedulerStatus(
        running=scheduler.running,
        sim_mode=settings.sim_mode,
        poll_interval_seconds=settings.poll_interval_seconds,
        next_run_time=next_run,
        last_run_result=get_last_run_result(),
        last_run_error=get_last_run_error(),
    )


@router.post("/poll-now", status_code=202)
async def trigger_poll(background_tasks: BackgroundTasks):
    """Trigger an immediate poll cycle asynchronously."""
    from app.services.poller import PollOrchestrator

    async def _run():
        try:
            result = await PollOrchestrator().run()
            logger.info("manual_poll_complete", **result)
        except Exception as exc:
            logger.exception("manual_poll_error", error=str(exc))

    background_tasks.add_task(_run)
    return {"message": "Poll triggered", "timestamp": datetime.now(timezone.utc)}
