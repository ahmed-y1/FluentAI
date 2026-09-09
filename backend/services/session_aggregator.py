from dataclasses import dataclass
from typing import Optional

@dataclass
class SessionSummary:
    posture_score: Optional[float] = None; eye_contact_percent: Optional[float] = None
    engagement_score: Optional[float] = None; fidget_score: Optional[float] = None
    words_per_minute: Optional[float] = None; filler_count: Optional[int] = None
    transcript: str = ""; voice_confidence: Optional[float] = None
    is_monotone: Optional[bool] = None; duration_seconds: float = 0

    def compute_overall_score(self) -> float:
        weights = {
            "posture":     0.15, "eye_contact": 0.20,
            "engagement":  0.15, "calm_hands":  0.10,
            "wpm":         0.15, "filler":      0.15, "voice": 0.10,
        }
        scores = {
            "posture": self.posture_score,
            "eye_contact": self.eye_contact_percent,
            "engagement": self.engagement_score,
            "calm_hands": None if self.fidget_score is None else 100 - self.fidget_score,
            "wpm": None if self.words_per_minute is None else (100 if 120 <= self.words_per_minute <= 160 else max(0, 100 - abs(self.words_per_minute - 140) * 0.8)),
            "filler": None if self.filler_count is None else max(0, 100 - self.filler_count * 5),
            "voice": self.voice_confidence,
        }
        active = {key: value for key, value in scores.items() if value is not None}
        active_weight = sum(weights[key] for key in active)
        return round(sum(active[key] * weights[key] for key in active) / active_weight, 1) if active_weight else 0.0