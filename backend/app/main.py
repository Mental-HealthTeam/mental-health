from fastapi import FastAPI

from routes.psychologists import router as psychologists_router

app = FastAPI()

app.include_router(
    psychologists_router,
    prefix="/api",
)


@app.get("/health")
def health():
    return {"status": "ok"}
