from fastapi.testclient import TestClient
from pathlib import Path
from unittest.mock import patch
from main import app
import pytest

client = TestClient(app)
WAV = Path(__file__).parent / "fixtures" / "sample.wav"

PAYLOAD = dict(
    posture_score=70, eye_contact_percent=65, engagement_score=60,
    fidget_score=20, words_per_minute=145, filler_count=3,
    transcript="Hello world", voice_confidence=70, is_monotone=False, duration_seconds=90,
    user_id="demo-user"
)

def test_health():
    # If your setup hits root index directly, verify against root path "/" instead
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

@pytest.mark.skipif(not WAV.exists(), reason="Fixture missing")
def test_audio_analyze():
    with open(WAV, "rb") as f:
        r = client.post("/api/audio/analyze", files={"audio": ("s.wav", f, "audio/wav")})
    assert r.status_code == 200
    assert "transcript" in r.json()
    assert "words_per_minute" in r.json()

def test_coaching_with_mock_llm():
    # Targets the exact LLM feedback processing function import pointer path used in your routing script
    with patch("routers.coaching.generate_coaching_feedback", return_value="Great job! Here is your feedback."):
        r = client.post("/api/coaching/complete", json=PAYLOAD)
    
    assert r.status_code == 200
    data = r.json()
    assert "feedback" in data
    assert "overall_score" in data
    assert "session_id" in data