from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Session(SQLModel, table=True):
    id:                 Optional[int] = Field(default=None, primary_key=True)
    user_id:            str           = Field(index=True)
    created_at:         datetime      = Field(default_factory=datetime.utcnow)
    duration_seconds:   float         = 0.0
    posture_score:      float         = 0.0
    eye_contact_percent:float         = 0.0
    engagement_score:   float         = 0.0
    fidget_score:       float         = 0.0
    words_per_minute:   float         = 0.0
    filler_count:       int           = 0
    voice_confidence:   float         = 0.0
    is_monotone:        bool          = False
    transcript:         Optional[str] = None
    coaching_feedback:  Optional[str] = None
    overall_score:      float         = 0.0