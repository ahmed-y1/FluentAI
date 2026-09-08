from fastapi import APIRouter, Depends
from sqlmodel import Session as DB, select
from database import get_session
from models.db_models import Session
from services.session_aggregator import SessionSummary
from typing import List

router = APIRouter()

@router.post("/", response_model=Session)
def create(data: dict, db: DB = Depends(get_session)):
    summary = SessionSummary(**{k:v for k,v in data.items()
                                if k in SessionSummary.__dataclass_fields__})
    overall = summary.compute_overall_score()
    
    s = Session(**data, overall_score=overall)
    db.add(s); db.commit(); db.refresh(s)
    return s

@router.get("/{user_id}", response_model=List[Session])
def get_all(user_id: str, db: DB = Depends(get_session)):
    return db.exec(
        select(Session)
        .where(Session.user_id == user_id)
        .order_by(Session.created_at.desc())
    ).all()