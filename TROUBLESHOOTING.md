# Troubleshooting Guide

## Common Issues and Solutions

### Issue: Audio Analysis Returns 500 Error / CORS Error

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/api/audio/analyze' from origin 'http://localhost:3000' has been blocked by CORS policy
POST http://localhost:8000/api/audio/analyze net::ERR_FAILED 500 (Internal Server Error)
```

**Causes & Solutions:**

#### 1. FFmpeg Not Installed ✅ **FIXED**
The backend requires FFmpeg to convert WebM audio to WAV format.

**Solution:** Install FFmpeg
- **Windows (using Chocolatey):**
  ```powershell
  choco install ffmpeg
  ```
- **Windows (manual):**
  Download from https://ffmpeg.org/download.html and add to PATH
- **macOS:**
  ```bash
  brew install ffmpeg
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt-get install ffmpeg
  ```

#### 2. Backend Not Running
**Solution:** Start the backend server
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

#### 3. CORS Configuration ✅ **VERIFIED**
CORS is properly configured in `backend/main.py` to allow requests from `http://localhost:3000`

---

### Issue: TensorFlow.js Warnings

**Symptoms:**
```
Platform browser has already been set. Overwriting the platform with [object Object].
cpu backend was already registered. Reusing existing backend factory.
webgl backend was already registered. Reusing existing backend factory.
```

**Cause:** Multiple imports of TensorFlow.js libraries causing redundant registrations.

**Solution:** These are warnings and can be suppressed by:
1. Checking imports in `packages/analysis-engine/src/` to ensure TensorFlow.js modules are only imported once
2. These warnings don't affect functionality but indicate potential optimization opportunities

---

## Verification Steps

### 1. Check Backend Health
```bash
curl http://localhost:8000/health
```
Expected response: `{"status":"ok"}`

### 2. Check CORS Headers
```bash
curl -i -X OPTIONS http://localhost:8000/api/audio/analyze \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```
Should include `Access-Control-Allow-Origin: http://localhost:3000`

### 3. Test Audio Analysis Endpoint
```bash
# Generate a test audio file or use an existing one
curl -X POST -F "audio=@test.webm" http://localhost:8000/api/audio/analyze
```

---

## Logs Location

### Backend Logs
When backend starts, you'll see:
- `Application started with CORS enabled for localhost:3000`
- Audio analysis logs with file size and processing time

### Frontend Console
Check browser DevTools > Console for:
- Upload errors
- Network errors
- TensorFlow.js initialization logs

---

## Next Steps If Issues Persist

1. **Verify all dependencies are installed:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Check Python version:** Python 3.8+ required
   ```bash
   python --version
   ```

3. **Enable detailed logging:** Check backend console output for specific error messages

4. **Test with curl first:** Before testing from frontend, verify backend endpoint works in isolation

## Analysis and scoring architecture

FluentAI separates three layers:

- **AI/ML:** Whisper speech recognition, browser speech recognition for low-latency interim text, MediaPipe/Face API vision models, and optional Ollama coaching.
- **Deterministic analysis:** tokenized word count, language-aware filler frequency and rate, timestamp-based speech duration/WPM, pauses, repeated words and phrases, and lexical diversity (type-token ratio).
- **Application scoring:** `backend/services/session_aggregator.py` normalizes available signals, applies documented mode weights, excludes missing signals from the denominator, and returns scores, contributions, confidence, and evidence.

The selected language (`en`, `ar`, or `auto`) is sent to Whisper. Arabic transcript review uses RTL. Browser recognition is explicitly optional: when unsupported or interrupted, the session remains usable and the backend result is authoritative when available.

Completed sessions are stored locally with their mode, language, transcript, raw metrics, score breakdown, model availability, and nullable values. Older records receive safe defaults for mode/language; missing measurements remain `Unavailable`, never zero. The static deployment uses `/session/review?id=<session-id>` because arbitrary dynamic routes cannot be generated from localStorage during export.

Limitations: Ollama and Whisper require the backend/model setup described above. GREEN mode currently selects climate-focused practice and preserves the selected mode for weighting, but external factual verification and full semantic topic analysis require a configured AI service and are not fabricated when unavailable. Existing TensorFlow duplicate-kernel warnings are non-fatal.
