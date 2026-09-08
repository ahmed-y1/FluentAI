import httpx

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"

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
- Posture: {session.get("posture_score",0):.0f}/100
- Eye Contact: {session.get("eye_contact_percent",0):.0f}%
- Engagement: {session.get("engagement_score",0):.0f}/100
- Words/min: {session.get("words_per_minute",0):.0f} (ideal: 120-160)
- Filler words: {session.get("filler_count",0)} times
- Voice confidence: {session.get("voice_confidence",0):.0f}/100
- Monotone: {"Yes" if session.get("is_monotone") else "No"}

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