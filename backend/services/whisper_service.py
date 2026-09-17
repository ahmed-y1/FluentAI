import os
import tempfile
import time
from services.session_aggregator import transcript_metrics

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

FILLER_WORDS = {"um", "uh", "like", "basically", "literally", "actually", "honestly"}

def analyze_audio(audio_bytes: bytes, language: str = "auto") -> dict:
    t0 = time.time()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes); tmp_path = tmp.name
    try:
        options = {"word_timestamps": True}
        if language in {"en", "ar"}:
            options["language"] = language
        result = get_model().transcribe(tmp_path, **options)
        
        elapsed = time.time() - t0
        print(f"Whisper transcription computation took: {elapsed:.2f}s")

        transcript = result["text"].strip()
        words = [word for segment in result.get("segments", []) for word in segment.get("words", [])]
        duration = max((segment.get("end", 0) for segment in result.get("segments", [])), default=0)
        metrics = transcript_metrics(transcript, result.get("language", language), duration, words)
        return {"transcript": transcript, "language": result.get("language", language),
            "duration_seconds": round(duration, 2), "transcription_available": True,
            **metrics}
    finally:
        os.unlink(tmp_path)