from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session as DB
from database import get_session
from services.llm_service import generate_coaching_feedback
from services.session_aggregator import SessionSummary
from models.db_models import Session

router = APIRouter()

class FullSession(BaseModel):
    user_id: str = "demo-user"
    posture_score: float; eye_contact_percent: float
    engagement_score: float; fidget_score: float
    words_per_minute: float; filler_count: int
    transcript: str; voice_confidence: float
    is_monotone: bool; duration_seconds: float

@router.post("/complete")
async def complete(data: FullSession, db: DB = Depends(get_session)):
    try:
        feedback = await generate_coaching_feedback(data.dict())
        fields   = {k:v for k,v in data.dict().items() if k != "user_id"}
        summary  = SessionSummary(**fields)
        overall  = summary.compute_overall_score()
        record   = Session(**data.dict(), coaching_feedback=feedback, overall_score=overall)
        db.add(record); db.commit(); db.refresh(record)
        return {"session_id":record.id,"feedback":feedback,"overall_score":overall}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))