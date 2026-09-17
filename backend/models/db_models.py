from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Session(SQLModel, table=True):
    id:                 Optional[int] = Field(default=None, primary_key=True)
    user_id:            str           = Field(index=True)
    created_at:         datetime      = Field(default_factory=datetime.utcnow)
    duration_seconds:   float         = 0.0
    mode:               str           = "general"
    language:           str           = "auto"
    posture_score:      Optional[float] = None
    eye_contact_percent:Optional[float] = None
    engagement_score:   Optional[float] = None
    gesture_activity:   Optional[float] = None
    words_per_minute:   Optional[float] = None
    filler_count:       Optional[int] = None
    voice_confidence:   Optional[float] = None
    is_monotone:        Optional[bool] = None
    transcript:         Optional[str] = None
    coaching_feedback:  Optional[str] = None
    analysis_json:      Optional[str] = None
    overall_score:      Optional[float] = None