#! /bin/sh

uvicorn main:app --host 0.0.0.0 --port 8001 --reload --reload-dir /usr/ai_service_app