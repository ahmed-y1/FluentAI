from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session as DB
from database import get_session
from services.llm_service import generate_coaching_feedback
from services.session_aggregator import SessionSummary
from models.db_models import Session
from typing import Optional

router = APIRouter()

class FullSession(BaseModel):
    user_id: str = "demo-user"
    posture_score: Optional[float] = None
    eye_contact_percent: Optional[float] = None
    engagement_score: Optional[float] = None
    fidget_score: Optional[float] = None
    words_per_minute: Optional[float] = None
    filler_count: Optional[int] = None
    transcript: str = ""
    voice_confidence: Optional[float] = None
    is_monotone: Optional[bool] = None
    duration_seconds: float = 0

@router.post("/complete")
async def complete(data: FullSession, db: DB = Depends(get_session)):
    try:
        values = data.dict()
        feedback = await generate_coaching_feedback(values)
        fields   = {k:v for k,v in values.items() if k != "user_id"}
        summary  = SessionSummary(**fields)
        overall  = summary.compute_overall_score()
        record_values = {key: (0 if value is None else value) for key, value in fields.items()}
        record   = Session(**record_values, user_id=data.user_id, coaching_feedback=feedback, overall_score=overall)
        db.add(record); db.commit(); db.refresh(record)
        return {"session_id":record.id,"feedback":feedback,"overall_score":overall}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))