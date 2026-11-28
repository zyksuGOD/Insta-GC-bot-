import logging
from apscheduler.schedulers.background import BackgroundScheduler
from config import TIMEZONE, POLL_INTERVAL_SECONDS, MEMBER_SYNC_INTERVAL_MINUTES
from scheduler_jobs import (
    job_good_morning,
    job_good_night,
    job_eleven,
    job_member_sync,
)
from poller import poll_direct_messages

log = logging.getLogger("eren_bot")


def start_scheduler() -> BackgroundScheduler:
    sched = BackgroundScheduler(timezone=TIMEZONE)
    sched.add_job(job_good_morning, "cron", hour=7, minute=0)
    sched.add_job(job_good_night, "cron", hour=23, minute=59)
    sched.add_job(job_eleven, "cron", hour=11, minute=11)
    sched.add_job(job_eleven, "cron", hour=23, minute=11)
    sched.add_job(poll_direct_messages, "interval", seconds=POLL_INTERVAL_SECONDS)
    sched.add_job(job_member_sync, "interval", minutes=MEMBER_SYNC_INTERVAL_MINUTES)
    sched.start()
    log.info("Scheduler running.")
    return sched