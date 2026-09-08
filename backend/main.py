from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import session, audio, coaching
from database import create_db_and_tables
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    logger.info("Application started with CORS enabled for localhost:3000")

app.include_router(session.router,  prefix="/api/sessions", tags=["Sessions"])
app.include_router(audio.router,    prefix="/api/audio",    tags=["Audio"])
app.include_router(coaching.router, prefix="/api/coaching", tags=["Coaching"])

@app.get("/health")
def health():
    return {"status": "ok"}
