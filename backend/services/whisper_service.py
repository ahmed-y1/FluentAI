import os
import re
import tempfile
import time

model = None
model_error = None

def get_model():
    global model, model_error
    if model is not None:
        return model
    if model_error is not None:
        raise RuntimeError(model_error)
    try:
        import whisper
        model = whisper.load_model(os.getenv("FLUENTAI_WHISPER_MODEL", "base"))
        return model
    except Exception as error:
        model_error = str(error)
        raise

def get_whisper_status() -> str:
    if model is not None:
        return "ready"
    if model_error is not None:
        return "unavailable"
    return "not_initialized"

FILLER_WORDS = {"um","uh","like","you know","basically","literally","actually","honestly","right"}

def analyze_audio(audio_bytes: bytes, language: str = "en") -> dict:
    t0 = time.time()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes); tmp_path = tmp.name
    try:
        result = get_model().transcribe(tmp_path, language=language, word_timestamps=True)
        
        elapsed = time.time() - t0
        print(f"Whisper transcription computation took: {elapsed:.2f}s")

        transcript = result["text"].strip()
        words = [word for segment in result.get("segments", []) for word in segment.get("words", [])]
        duration = max((segment.get("end", 0) for segment in result.get("segments", [])), default=0)
        speech_duration = sum(max(0, word.get("end", 0) - word.get("start", 0)) for word in words)
        wpm = (len(words) / (speech_duration / 60)) if speech_duration > 0 else 0
        normalized = re.findall(r"[a-z']+", transcript.lower())
        filler_count = sum(normalized.count(word) for word in FILLER_WORDS if " " not in word)
        filler_count += len(re.findall(r"\byou\s+know\b", transcript.lower()))
        filler_instances = [{"word": fw, "count": normalized.count(fw)} for fw in FILLER_WORDS if " " not in fw and normalized.count(fw) > 0]
        if "you know" in transcript.lower():
            filler_instances.append({"word": "you know", "count": transcript.lower().count("you know")})
        long_pauses = sum(1 for i in range(1,len(words)) if words[i]["start"]-words[i-1]["end"]>1.5)
        return {"transcript":transcript,"words_per_minute":round(wpm,1),
                "filler_count":filler_count,"filler_instances":filler_instances,
            "long_pauses":long_pauses,"word_count":len(words),"duration_seconds":round(duration,2),
            "speech_duration_seconds":round(speech_duration,2)}
    finally:
        os.unlink(tmp_path)