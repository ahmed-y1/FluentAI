from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import session, audio, coaching
from database import create_db_and_tables
from database import engine
from services.llm_service import get_llm_status
from services.whisper_service import get_whisper_status
from sqlalchemy import text
import os
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fluent AI Backend", version="1.0.0")

cors_origins = [origin.strip() for origin in os.getenv(
    "FLUENTAI_CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    logger.info("Application started with CORS enabled for %s", cors_origins)

app.include_router(session.router,  prefix="/api/sessions", tags=["Sessions"])
app.include_router(audio.router,    prefix="/api/audio",    tags=["Audio"])
app.include_router(coaching.router, prefix="/api/coaching", tags=["Coaching"])

@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database = "healthy"
    except Exception:
        database = "unavailable"

    whisper = get_whisper_status()
    llm = get_llm_status()
    dependencies = {"api": "healthy", "database": database, "whisper": whisper, "llm": llm}
    healthy = database == "healthy" and whisper == "ready"
    return {"status": "healthy" if healthy else "degraded", "dependencies": dependencies}
