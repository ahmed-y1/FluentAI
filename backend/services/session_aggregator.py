from dataclasses import dataclass, field
from collections import Counter
import re
from typing import Any, Optional

FILLERS = {
    "en": {"um", "uh", "like", "basically", "literally", "actually", "honestly"},
    "ar": {"يعني", "اممم", "اه", "بصراحة", "حسنا", "مثل"},
}
STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "is", "are", "was", "it", "that",
    "و", "في", "من", "على", "أن", "هذا", "هذه", "هو", "هي",
}

def transcript_metrics(transcript: str, language: str = "auto", duration_seconds: float = 0,
                       word_timestamps: Optional[list[dict[str, Any]]] = None) -> dict[str, Any]:
    tokens = re.findall(r"[\w']+", transcript.lower(), flags=re.UNICODE)
    fillers = FILLERS["ar" if language == "ar" else "en"]
    filler_counts = Counter(token for token in tokens if token in fillers)
    meaningful = [token for token in tokens if token not in STOP_WORDS and token not in fillers]
    repeated_words = {word: count for word, count in Counter(meaningful).items() if count > 1}
    phrases = [" ".join(tokens[index:index + 2]) for index in range(len(tokens) - 1)]
    repeated_phrases = {phrase: count for phrase, count in Counter(phrases).items() if count > 1 and phrase.split()[0] not in STOP_WORDS}
    unique = len(set(meaningful))
    ttr = round(unique / len(meaningful), 3) if meaningful else None

    pauses = []
    speech_duration = 0.0
    if word_timestamps:
        valid = [word for word in word_timestamps if isinstance(word.get("start"), (int, float)) and isinstance(word.get("end"), (int, float))]
        speech_duration = sum(max(0.0, word["end"] - word["start"]) for word in valid)
        pauses = [round(valid[index]["start"] - valid[index - 1]["end"], 2) for index in range(1, len(valid))
                  if valid[index]["start"] - valid[index - 1]["end"] >= 1.0]
    elif duration_seconds > 0 and tokens:
        speech_duration = duration_seconds
    wpm = round(len(tokens) / (speech_duration / 60), 1) if speech_duration > 0 else None
    return {
        "word_count": len(tokens), "filler_count": sum(filler_counts.values()),
        "filler_rate": round(sum(filler_counts.values()) * 100 / len(tokens), 2) if tokens else None,
        "filler_frequency": dict(filler_counts), "repeated_words": repeated_words,
        "repeated_phrases": repeated_phrases, "lexical_diversity": ttr,
        "speech_duration_seconds": round(speech_duration, 2) if speech_duration else None,
        "words_per_minute": wpm, "pause_count": len(pauses),
        "average_pause_seconds": round(sum(pauses) / len(pauses), 2) if pauses else None,
        "longest_pause_seconds": max(pauses) if pauses else None,
    }

@dataclass
class SessionSummary:
    posture_score: Optional[float] = None; eye_contact_percent: Optional[float] = None
    engagement_score: Optional[float] = None; gesture_activity: Optional[float] = None
    words_per_minute: Optional[float] = None; filler_count: Optional[int] = None
    transcript: str = ""; voice_confidence: Optional[float] = None
    is_monotone: Optional[bool] = None; duration_seconds: float = 0
    eye_contact_percent: Optional[float] = None; mode: str = "general"
    metrics: dict[str, Any] = field(default_factory=dict)

    def score_breakdown(self) -> dict[str, Any]:
        weights = {
            "posture": 0.18, "eye_contact": 0.16, "engagement": 0.10,
            "pace": 0.14, "filler": 0.14, "vocabulary": 0.10,
            "voice": 0.08, "gestures": 0.10,
        }
        if self.mode == "interview":
            weights.update({"filler": 0.18, "engagement": 0.08, "vocabulary": 0.14})
        elif self.mode == "presentation":
            weights.update({"posture": 0.22, "eye_contact": 0.20, "pace": 0.16, "gestures": 0.08})
        elif self.mode == "green":
            weights.update({"vocabulary": 0.16, "engagement": 0.08})
        scores = {
            "posture": self.posture_score,
            "eye_contact": self.eye_contact_percent,
            "engagement": self.engagement_score,
            "pace": None if self.words_per_minute is None else max(0, 100 - abs(self.words_per_minute - 140) * 0.8),
            "filler": None if self.filler_count is None else max(0, 100 - self.filler_count * 5),
            "vocabulary": self.metrics.get("vocabulary_score", self.metrics.get("lexical_diversity")),
            "voice": self.voice_confidence,
            "gestures": self.gesture_activity,
        }
        active = {key: value for key, value in scores.items() if value is not None}
        active_weight = sum(weights[key] for key in active)
        overall = round(sum(active[key] * weights[key] for key in active) / active_weight, 1) if active else None
        return {"overall_score": overall, "weights": weights, "scores": scores,
                "contributions": {key: round(scores[key] * weights[key] / active_weight, 1) for key in active},
                "available_categories": list(active), "confidence": round(len(active) / len(weights) * 100)}

    def compute_overall_score(self) -> Optional[float]:
        return self.score_breakdown()["overall_score"]