import torch
import torchaudio
import tempfile
import os
import subprocess
import logging

logger = logging.getLogger(__name__)

def to_wav(webm_bytes: bytes) -> bytes:
    """Convert WebM audio to WAV format using ffmpeg"""
    try:
        proc = subprocess.run(
            ['ffmpeg', '-i', 'pipe:0', '-ar', '16000', '-ac', '1', '-f', 'wav', 'pipe:1'],
            input=webm_bytes, capture_output=True, timeout=30
        )
        if proc.returncode != 0:
            error_msg = proc.stderr.decode('utf-8', errors='ignore')
            logger.error(f"FFmpeg conversion failed: {error_msg}")
            raise RuntimeError(f"Audio conversion failed: {error_msg[:200]}")
        if not proc.stdout:
            raise RuntimeError("FFmpeg produced no output")
        return proc.stdout
    except FileNotFoundError:
        logger.error("FFmpeg not found. Please install ffmpeg.")
        raise RuntimeError("Audio processing unavailable: ffmpeg not installed")
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg conversion timed out")
        raise RuntimeError("Audio conversion timeout")
    except Exception as e:
        logger.error(f"Unexpected error in audio conversion: {str(e)}")
        raise

def analyze_voice_tone(audio_bytes: bytes) -> dict:
    """Analyze voice characteristics from audio bytes"""
    try:
        # Convert input webm audio data to compatible wav format
        audio_bytes = to_wav(audio_bytes)
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            waveform, sr = torchaudio.load(tmp_path)
            waveform = waveform.squeeze(0)
            if sr != 16000:
                waveform = torchaudio.transforms.Resample(sr, 16000)(waveform)
            rms = waveform.pow(2).mean().sqrt().item()
            energy_score = min(100, rms * 500)
            zcr = (waveform[:-1] * waveform[1:] < 0).float().mean().item()
            pitch_variation = min(100, zcr * 300)
            is_monotone = pitch_variation < 15
            confidence = energy_score * 0.5 + pitch_variation * 0.5
            return {"energy_score":round(energy_score,1),"pitch_variation":round(pitch_variation,1),
                    "is_monotone":is_monotone,"voice_confidence":round(confidence,1),
                    "voice_feedback":_fb(energy_score, pitch_variation, is_monotone)}
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        logger.error(f"Voice analysis failed: {str(e)}")
        # Return safe defaults on error
        return {"energy_score":0.0,"pitch_variation":0.0,
                "is_monotone":True,"voice_confidence":0.0,
                "voice_feedback":"Voice analysis unavailable. Please check your audio."}

def _fb(e, pv, mt):
    if mt and e<30: return "Voice is quiet and flat — vary pitch and speak up."
    if mt: return "Voice lacks variation — emphasise key words with pitch changes."
    if e<30: return "A bit quiet — project your voice more confidently."
    return "Voice sounds expressive and confident!"