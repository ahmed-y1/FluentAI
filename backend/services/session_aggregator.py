from dataclasses import dataclass

@dataclass
class SessionSummary:
    posture_score: float; eye_contact_percent: float
    engagement_score: float; fidget_score: float
    words_per_minute: float; filler_count: int
    transcript: str; voice_confidence: float
    is_monotone: bool; duration_seconds: float

    def compute_overall_score(self) -> float:
        weights = {
            "posture":     0.15, "eye_contact": 0.20,
            "engagement":  0.15, "calm_hands":  0.10,
            "wpm":         0.15, "filler":      0.15, "voice": 0.10,
        }
        wpm = self.words_per_minute
        wpm_score    = 100 if 120<=wpm<=160 else max(0, 100-abs(wpm-140)*0.8)
        filler_score = max(0, 100 - self.filler_count * 5)
        scores = {
            "posture":     self.posture_score,
            "eye_contact": self.eye_contact_percent,
            "engagement":  self.engagement_score,
            "calm_hands":  100 - self.fidget_score,
            "wpm":         wpm_score,
            "filler":      filler_score,
            "voice":       self.voice_confidence,
        }
        return round(sum(scores[k] * weights[k] for k in weights), 1)