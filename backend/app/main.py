import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.dependencies import get_settings
from routes import (
    psychologists_router,
    matching_psychologists_router,
    payments_router,
    auth_router,
    bookings_router,
    symptom_codes_router,
    sessions_router,
    users_router,
)


app = FastAPI()

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type"]
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)

BASE_PREFIX = "/api"

app.include_router(
    psychologists_router,
    prefix=f"{BASE_PREFIX}/psychologists",
    tags=["Psychologists"]
)
app.include_router(
    matching_psychologists_router,
    prefix=f"{BASE_PREFIX}",
    tags=["Matching Psychologists wit AI"]
)
app.include_router(
    payments_router,
    prefix=f"{BASE_PREFIX}/payments",
    tags=["Payments"],
)
app.include_router(
    auth_router,
    prefix=f"{BASE_PREFIX}/auth",
    tags=["Authentication"],
)
app.include_router(
    bookings_router,
    prefix=f"{BASE_PREFIX}/bookings",
    tags=["Bookings"],
)
app.include_router(
    sessions_router,
    prefix=BASE_PREFIX,
    tags=["Sessions"],
)
app.include_router(
    symptom_codes_router,
    prefix=BASE_PREFIX,
    tags=["Symptom Codes"],
)
app.include_router(
    users_router,
    prefix=f"{BASE_PREFIX}/users",
    tags=["Users"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
