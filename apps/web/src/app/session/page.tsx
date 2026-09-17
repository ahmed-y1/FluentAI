"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionAnalysisController } from "../../hooks/useSessionAnalysisController";
import { useAudioAnalysis } from "../../hooks/useAudioAnalysis";
import LiveMetrics from "../../components/session/LiveMetrics";
import SessionControls from "../../components/session/SessionControls";
import { useSessionStore } from "../../store/sessionStore";
import { saveSession } from "../../lib/sessionStorage";

type SpeechRecognitionEventLike = Event & { results: { [index: number]: { [index: number]: { transcript: string } }; length: number } };
type SpeechRecognitionLike = {
    lang: string; interimResults: boolean; continuous: boolean;
    start: () => void; stop: () => void;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: Event) => void) | null; onend: (() => void) | null;
};

export default function SessionPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [recording, setRecording] = useState(false);
    const [mediaReady, setMediaReady] = useState(false);
    const [startupError, setStartupError] = useState<string | null>(null);
    const [speechAvailable, setSpeechAvailable] = useState(true);
    const [liveTranscript, setLiveTranscript] = useState("");

    const { start, stop, isReady: analysisReady, initializing, error: analysisError } = useSessionAnalysisController(videoRef);
    const { startRecording, stopAndAnalyze } = useAudioAnalysis();
    const { setMetric, setFeedback, setPhase, setTranscript, setMode, setLanguage, diagnostics, phase, mode, language, transcript, interimTranscript } = useSessionStore();
    const speechRef = useRef<SpeechRecognitionLike | null>(null);

    useEffect(() => {
        document.title = "Fluent AI - Session";
    }, []);

    useEffect(() => {
        const SpeechRecognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
            || (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
        if (!SpeechRecognition) { setSpeechAvailable(false); return; }
        const recognition = new SpeechRecognition();
        recognition.continuous = true; recognition.interimResults = true;
        recognition.onresult = (event) => {
            let finalText = ""; let interimText = "";
            for (let index = 0; index < event.results.length; index += 1) {
                const text = event.results[index][0]?.transcript ?? "";
                if (index === event.results.length - 1) interimText += text; else finalText += text;
            }
            const existing = useSessionStore.getState().transcript;
            const next = finalText.trim() ? `${existing} ${finalText}`.trim() : existing;
            setTranscript(next, interimText); setLiveTranscript(next);
        };
        recognition.onerror = () => setSpeechAvailable(false);
        speechRef.current = recognition;
        return () => { recognition.stop(); speechRef.current = null; };
    }, [setTranscript]);

    useEffect(() => { if (speechRef.current) speechRef.current.lang = language === "ar" ? "ar-SA" : language === "en" ? "en-US" : "en-US"; }, [language]);

    useEffect(() => {
        let cancelled = false;

        navigator.mediaDevices
            .getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
            .then((stream) => {
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(console.error);
                }
                streamRef.current = stream;
                setMediaReady(true);
            })
            .catch((error) => {
                console.warn("Failed to start camera or microphone:", error);
                setStartupError("Camera and microphone access is required to start a session.");
            });

        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    const handleStop = async () => {
        setRecording(false);
        stop();
        setPhase("processing");

        speechRef.current?.stop();
        const audio = await stopAndAnalyze(language);
        if (!audio) {
            setStartupError("The session could not be finalized. Please try again.");
            return;
        }

        setMetric("wordsPerMinute", typeof audio.words_per_minute === "number" ? audio.words_per_minute : null);
        setMetric("fillerCount", typeof audio.filler_count === "number" ? audio.filler_count : null);
        setMetric("voiceConfidence", typeof audio.voice_confidence === "number" ? audio.voice_confidence : null);
        setMetric("transcript", typeof audio.transcript === "string" ? audio.transcript : "");
        setTranscript(typeof audio.transcript === "string" ? audio.transcript : transcript, "");

        const state = useSessionStore.getState();
        const durationSeconds = typeof audio.duration_seconds === "number" ? audio.duration_seconds : 0;
        const wordsPerMinute = typeof audio.words_per_minute === "number" ? audio.words_per_minute : null;
        const localSession = {
            id: Date.now(),
            created_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
            overall_score: null,
            posture_score: state.postureScore,
            eye_contact_percent: state.eyeContactPercent,
            mode: state.mode,
            language: state.language,
            words_per_minute: wordsPerMinute,
            presence_score: state.presenceScore,
            gesture_activity: state.gestureActivity,
            filler_count: typeof audio.filler_count === "number" ? audio.filler_count : null,
            voice_projection: typeof audio.voice_confidence === "number" ? audio.voice_confidence : null,
            audio_available: audio.audio_available === true,
            model_availability: Object.fromEntries(Object.entries(state.diagnostics).map(([name, diagnostic]) => [name, diagnostic.status])),
            coaching_feedback: null,
            transcript: typeof audio.transcript === "string" ? audio.transcript : null,
            word_count: typeof audio.word_count === "number" ? audio.word_count : null,
            filler_rate: typeof audio.filler_rate === "number" ? audio.filler_rate : null,
            filler_frequency: audio.filler_frequency as Record<string, number> | undefined,
            pause_count: typeof audio.pause_count === "number" ? audio.pause_count : null,
            average_pause_seconds: typeof audio.average_pause_seconds === "number" ? audio.average_pause_seconds : null,
            longest_pause_seconds: typeof audio.longest_pause_seconds === "number" ? audio.longest_pause_seconds : null,
            lexical_diversity: typeof audio.lexical_diversity === "number" ? audio.lexical_diversity : null,
            transcription_available: audio.transcription_available === true,
            metrics: audio,
            score_breakdown: undefined as Record<string, unknown> | undefined,
        };

        let coachingFeedback = "AI Coaching unavailable. Connect the FluentAI backend to receive evidence-based feedback.";
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://fluent-ai-backend.onrender.com";
            const backendPayload = {
                user_id: "demo-user",
                posture_score: state.postureScore,
                eye_contact_percent: state.eyeContactPercent,
                engagement_score: state.presenceScore,
                gesture_activity: state.gestureActivity,
                words_per_minute: wordsPerMinute,
                filler_count: typeof audio.filler_count === "number" ? audio.filler_count : null,
                transcript: typeof audio.transcript === "string" ? audio.transcript : "",
                voice_confidence: typeof audio.voice_confidence === "number" ? audio.voice_confidence : null,
                is_monotone: state.isMonotone,
                duration_seconds: durationSeconds,
                mode: state.mode,
                language: state.language,
                metrics: audio,
            };
            const res = await fetch(
                `${baseUrl}/api/coaching/complete`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(backendPayload)
                }
            );
            const response = await res.json();
            const { feedback } = response;
            coachingFeedback = feedback || coachingFeedback;
            localSession.overall_score = typeof response.overall_score === "number" ? response.overall_score : null;
            localSession.score_breakdown = response.score_breakdown;
        } catch (err) {
            console.warn("AI coaching backend unavailable.", err);
        }

        setFeedback(coachingFeedback);
        saveSession({ ...localSession, coaching_feedback: coachingFeedback });
        setPhase("complete");
        router.push(`/session/review?id=${localSession.id}`);
    };

    return (
        <div className="presentation-session">
            <div className="flex-1 relative">
                <video ref={videoRef} autoPlay muted playsInline
                    className="w-full h-full object-cover" />
            </div>
            <aside className="w-96 bg-gray-900 p-6 flex flex-col gap-4">
                <div className="space-y-2">
                    <label className="text-xs text-gray-400" htmlFor="practice-mode">Practice mode</label>
                    <select id="practice-mode" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} disabled={recording} className="w-full bg-gray-800 text-white p-2 rounded">
                        <option value="general">General Speaking</option><option value="presentation">Presentation</option><option value="interview">Interview</option><option value="green">GREEN - Climate Change</option>
                    </select>
                    <label className="text-xs text-gray-400" htmlFor="session-language">Session language</label>
                    <select id="session-language" value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} disabled={recording} className="w-full bg-gray-800 text-white p-2 rounded">
                        <option value="en">English</option><option value="ar">العربية</option><option value="auto">Auto</option>
                    </select>
                </div>
                <LiveMetrics />
                <section aria-live="polite" className={`border border-gray-700 p-3 rounded ${language === "ar" ? "text-right" : "text-left"}`} dir={language === "ar" ? "rtl" : "ltr"}>
                    <h2 className="text-sm text-white">Live transcript</h2>
                    <p className="text-gray-200 text-sm mt-2 min-h-12">{liveTranscript || transcript || "Waiting for speech..."}</p>
                    {interimTranscript && <p className="text-teal-300 text-sm italic">{interimTranscript}</p>}
                    {!speechAvailable && <p className="text-amber-300 text-xs mt-2">Live browser transcription unavailable. Final transcription will be attempted by the backend.</p>}
                </section>
                <SessionControls
                    isRecording={recording}
                    error={startupError || analysisError}
                    disabled={!mediaReady || initializing || !analysisReady}
                    onStart={async () => {
                        setStartupError(null);
                        if (!streamRef.current) {
                            setStartupError("Camera and microphone are still starting. Try again in a moment.");
                            return;
                        }

                        const didStartAudio = await startRecording(streamRef.current);
                        if (!didStartAudio) {
                            setStartupError("Microphone recording could not start. Check browser mic permissions and try again.");
                            return;
                        }

                        setRecording(true);
                        speechRef.current?.start();
                        start();
                    }}
                    onStop={handleStop}
                />
                <div className="mt-2 border-t border-gray-800 pt-4">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>AI diagnostics</span>
                        <span className="text-teal-300">{phase}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {Object.entries(diagnostics).map(([name, diagnostic]) => (
                            <div key={name} className="flex items-center justify-between text-xs">
                                <span className="capitalize text-gray-500">{name} model</span>
                                <span className={diagnostic.status === "unavailable" ? "text-red-300" : "text-emerald-300"}>
                                    {diagnostic.status}{diagnostic.lastInferenceMs ? ` ${Math.round(diagnostic.lastInferenceMs)}ms` : ""}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}

function paceScore(wordsPerMinute: number) {
    return Math.max(0, 100 - Math.abs(wordsPerMinute - 140) * 0.8);
}
