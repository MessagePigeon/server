import logging
from datetime import UTC, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.state import state

logger = logging.getLogger("mpigeon.tasks")
scheduler = AsyncIOScheduler()


def _age_gte(created_at: datetime, delta: timedelta) -> bool:
    return datetime.now(UTC) - created_at >= delta


def cleanup_states() -> None:
    # Cleanup connect requests older than 3 hours
    for cr in list(state.connect_requests):
        if _age_gte(cr.createdAt, timedelta(hours=3)):
            state.connect_requests.remove(cr)
            logger.warning("Cleanup connect request %s", cr.id)
    # Cleanup message states older than 12 hours
    for msg in list(state.showing_messages):
        if _age_gte(msg.createdAt, timedelta(hours=12)):
            state.showing_messages.remove(msg)
            logger.warning("Cleanup message state id:%s", msg.id)


def start_scheduler() -> None:
    # Run hourly so expired connect-requests/messages don't linger far past their TTL.
    scheduler.add_job(cleanup_states, "cron", minute=0, id="cleanup-states")
    scheduler.start()
    logger.info("Scheduler started: hourly state cleanup")
