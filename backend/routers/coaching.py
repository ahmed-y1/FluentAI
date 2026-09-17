from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session as DB
from database import get_session
from services.llm_service import generate_coaching_feedback
from services.session_aggregator import SessionSummary
from models.db_models import Session
from typing import Optional, Any
import json

router = APIRouter()

class FullSession(BaseModel):
    user_id: str = "demo-user"
    posture_score: Optional[float] = None
    eye_contact_percent: Optional[float] = None
    engagement_score: Optional[float] = None
    gesture_activity: Optional[float] = None
    words_per_minute: Optional[float] = None
    filler_count: Optional[int] = None
    transcript: str = ""
    voice_confidence: Optional[float] = None
    is_monotone: Optional[bool] = None
    duration_seconds: float = 0
    mode: str = "general"
    language: str = "auto"
    metrics: dict[str, Any] = {}

@router.post("/complete")
async def complete(data: FullSession, db: DB = Depends(get_session)):
    try:
        values = data.dict()
        try:
            feedback = await generate_coaching_feedback(values)
        except Exception:
            feedback = "AI coaching unavailable. Deterministic session measurements are still available for review."
        fields   = {k:v for k,v in values.items() if k != "user_id"}
        summary_fields = {key: value for key, value in fields.items() if key in SessionSummary.__dataclass_fields__}
        summary  = SessionSummary(**summary_fields)
        breakdown = summary.score_breakdown()
        overall = breakdown["overall_score"]
        record_values = {key: value for key, value in fields.items() if key in Session.model_fields}
        record_values["analysis_json"] = json.dumps({"metrics": data.metrics, "score": breakdown}, ensure_ascii=False)
        record   = Session(**record_values, user_id=data.user_id, coaching_feedback=feedback, overall_score=overall)
        db.add(record); db.commit(); db.refresh(record)
        return {"session_id": record.id, "feedback": feedback, "overall_score": overall,
            "score_breakdown": breakdown, "metrics": data.metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))