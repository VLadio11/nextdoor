"""APScheduler setup.

The scheduler runs as part of the FastAPI process (AsyncIOScheduler).
It starts during app lifespan and stops on shutdown.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.logging_config import get_logger

logger = get_logger(__name__)

scheduler = AsyncIOScheduler()
_last_run_result: dict | None = None
_last_run_error: str | None = None


def get_last_run_result() -> dict | None:
    return _last_run_result


def get_last_run_error() -> str | None:
    return _last_run_error


async def _poll_job() -> None:
    global _last_run_result, _last_run_error
    from app.services.poller import PollOrchestrator

    logger.info("scheduled_poll_start")
    try:
        orchestrator = PollOrchestrator()
        _last_run_result = await orchestrator.run()
        _last_run_error = None
    except Exception as exc:
        _last_run_error = str(exc)
        logger.exception("scheduled_poll_error", error=str(exc))


def start_scheduler() -> None:
    scheduler.add_job(
        _poll_job,
        trigger=IntervalTrigger(seconds=settings.poll_interval_seconds),
        id="nextdoor_poll",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info(
        "scheduler_started",
        interval_seconds=settings.poll_interval_seconds,
        sim_mode=settings.sim_mode,
    )


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
    logger.info("scheduler_stopped")
