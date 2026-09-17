from services.session_aggregator import SessionSummary

DEFAULTS = dict(
    posture_score=80, eye_contact_percent=70, engagement_score=75,
    gesture_activity=70, words_per_minute=140, filler_count=0,
    transcript="test", voice_confidence=80, is_monotone=False, duration_seconds=60
)

def mk(**kw): 
    return SessionSummary(**{**DEFAULTS, **kw})

def test_perfect_scores_100():
    s = mk(posture_score=100, eye_contact_percent=100, engagement_score=100,
           fidget_score=0, words_per_minute=140, filler_count=0, voice_confidence=100)
    assert s.compute_overall_score() == 100.0

def test_filler_penalty_reduces_score():
    assert mk(filler_count=0).compute_overall_score() > mk(filler_count=20).compute_overall_score()

def test_ideal_wpm_range_no_penalty():
    score_120 = mk(words_per_minute=120).compute_overall_score()
    score_160 = mk(words_per_minute=160).compute_overall_score()
    score_100 = mk(words_per_minute=100).compute_overall_score()
    assert score_120 == score_160  # both ideal
    assert score_100 < score_120   # 100 wpm penalised

def test_gesture_activity_is_scored_when_available():
    assert mk(gesture_activity=100).compute_overall_score() > mk(gesture_activity=20).compute_overall_score()

def test_missing_metrics_are_not_zero():
    result = mk(posture_score=None, eye_contact_percent=None).score_breakdown()
    assert result["overall_score"] is not None
    assert "posture" not in result["available_categories"]