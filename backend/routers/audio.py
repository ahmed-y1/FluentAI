from fastapi import APIRouter, UploadFile, File, HTTPException, Form
import logging
from services.whisper_service import analyze_audio
from services.speech_service import analyze_voice_tone

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/analyze")
async def analyze(audio: UploadFile = File(...), language: str = Form("auto")):
    """Analyze audio: transcription and voice characteristics"""
    try:
        # Validate file size (max 50MB)
        audio_bytes = await audio.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        if len(audio_bytes) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Audio file too large (max 50MB)")
        
        logger.info(f"Analyzing audio: {audio.filename} ({len(audio_bytes)} bytes)")
        
        # Process audio
        if language not in {"en", "ar", "auto"}:
            raise HTTPException(status_code=400, detail="Language must be en, ar, or auto")
        whisper_result = analyze_audio(audio_bytes, language)
        tone_result = analyze_voice_tone(audio_bytes)
        
        result = {**whisper_result, **tone_result}
        logger.info(f"Audio analysis complete: {audio.filename}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio analysis error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Audio analysis failed: {str(e)}")