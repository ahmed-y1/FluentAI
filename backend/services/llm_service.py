import os
import httpx

OLLAMA_URL = os.getenv("FLUENTAI_LLM_URL", "http://localhost:11434/api/generate")
MODEL = os.getenv("FLUENTAI_LLM_MODEL", "llama3.2:3b")

def get_llm_status() -> str:
    return "configured" if os.getenv("FLUENTAI_LLM_URL") else "development-only"

def display_metric(value, suffix=""):
    return f"{value:.0f}{suffix}" if isinstance(value, (int, float)) else "unavailable"

SYSTEM = """
You are Fluent AI, an expert communication coach. Give feedback in this exact format:
1. Overall Assessment (2 sentences max)
2. 3 Strengths (bullet points, specific)
3. 3 Areas to Improve (bullet points, actionable)
4. One Practice Tip for next session
Be warm, encouraging, specific. Under 250 words total.
"""

async def generate_coaching_feedback(session: dict) -> str:
    prompt = f"""
Session metrics:
- Posture: {display_metric(session.get("posture_score"))}/100
- Eye Contact: {display_metric(session.get("eye_contact_percent"))}%
- Presence: {display_metric(session.get("presence_score", session.get("engagement_score")))}/100
- Words/min: {display_metric(session.get("words_per_minute"))} (ideal: 120-160)
- Filler words: {session.get("filler_count",0)} times
- Voice projection: {display_metric(session.get("voice_projection", session.get("voice_confidence")))}/100
- Monotone: {"Yes" if session.get("is_monotone") else "No" if session.get("is_monotone") is not None else "unavailable"}

Transcript: \"{session.get("transcript","")[:400]}\"

Please give personalised coaching feedback.
"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(OLLAMA_URL, json={
            "model":MODEL,"prompt":prompt,"system":SYSTEM,
            "stream":False,"options":{"temperature":0.7,"num_predict":400}
        })
        r.raise_for_status()
        return r.json()["response"]