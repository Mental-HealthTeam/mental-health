import logging

from fastapi import FastAPI

from routes import psychologists_router
from routes import matching_psychologists_router
from routes import payments_router

app = FastAPI()

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


@app.get("/health")
def health():
    return {"status": "ok"}
