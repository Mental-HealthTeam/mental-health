#! /bin/sh

gunicorn main:app \
    --workers 3 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8001 \
    --log-level info \
    --access-logfile - \
    --error-logfile -