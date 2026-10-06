import logging

from fastapi import FastAPI

from routes import psychologists_router
from routes import matching_psychologists_router

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


@app.get("/health")
def health():
    return {"status": "ok"}
