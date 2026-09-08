import whisper, tempfile, os, time

model = whisper.load_model("base")

FILLER_WORDS = {"um","uh","like","you know","basically","literally","actually","honestly","right"}

def analyze_audio(audio_bytes: bytes, language: str = "en") -> dict:
    t0 = time.time()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes); tmp_path = tmp.name
    try:
        result = model.transcribe(tmp_path, language=language, word_timestamps=True)
        
        elapsed = time.time() - t0
        print(f"Whisper transcription computation took: {elapsed:.2f}s")

        transcript = result["text"].strip()
        words = result.get("words", [])
        duration = words[-1]["end"] if words else 1
        wpm = (len(words) / duration) * 60 if duration > 0 else 0
        filler_count = sum(transcript.lower().count(fw) for fw in FILLER_WORDS)
        filler_instances = [{"word":fw,"count":transcript.lower().count(fw)} for fw in FILLER_WORDS if transcript.lower().count(fw)>0]
        long_pauses = sum(1 for i in range(1,len(words)) if words[i]["start"]-words[i-1]["end"]>1.5)
        return {"transcript":transcript,"words_per_minute":round(wpm,1),
                "filler_count":filler_count,"filler_instances":filler_instances,
                "long_pauses":long_pauses,"word_count":len(words),"duration_seconds":round(duration,2)}
    finally:
        os.unlink(tmp_path)