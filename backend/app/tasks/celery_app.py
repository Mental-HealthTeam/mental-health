from datetime import timedelta

from celery import Celery
from celery.schedules import crontab

from config.settings import Settings

settings = Settings()

app = Celery(
    "mental_health",
    broker=settings.CELERY_BROKER_URL,
    include=["tasks.celery_tasks"]
)


app.conf.update(
    timezone=settings.CELERY_TIMEZONE,
    task_ignore_result=True,
    beat_schedule={
        "expire-pending-bookings-task": {
            "task": "tasks.celery_tasks.expire_pending_bookings_task",
            "schedule": timedelta(minutes=1),
        },
        "complete-session-with-psychologist-task": {
            "task": "tasks.celery_tasks.complete_session_with_psychologist_task",
            "schedule": timedelta(minutes=5)
        },
        "payout-monthly-salary-task": {
            "task": "tasks.celery_tasks.payout_monthly_salary_task",
            "schedule": crontab(minute=0, hour=5, day_of_month=2),
        }
    },
)
