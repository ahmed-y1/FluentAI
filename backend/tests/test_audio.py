import pytest
from pathlib import Path
from services.whisper_service import analyze_audio

WAV = Path(__file__).parent / "fixtures" / "sample.wav"

@pytest.mark.skipif(not WAV.exists(), reason="Fixture missing")
def test_whisper_returns_transcript():
    r = analyze_audio(WAV.read_bytes())
    assert isinstance(r["transcript"], str) and len(r["transcript"]) > 0

@pytest.mark.skipif(not WAV.exists(), reason="Fixture missing")
def test_wpm_in_human_range():
    r = analyze_audio(WAV.read_bytes())
    assert 40 <= r["words_per_minute"] <= 400

@pytest.mark.skipif(not WAV.exists(), reason="Fixture missing")
def test_response_shape():
    r = analyze_audio(WAV.read_bytes())
    for key in ["transcript", "words_per_minute", "filler_count", "duration_seconds"]:
        assert key in r