"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionAnalysisController } from "../../hooks/useSessionAnalysisController";
import { useAudioAnalysis } from "../../hooks/useAudioAnalysis";
import LiveMetrics from "../../components/session/LiveMetrics";
import SessionControls from "../../components/session/SessionControls";
import { useSessionStore } from "../../store/sessionStore";
import { saveSession } from "../../lib/sessionStorage";

export default function SessionPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [recording, setRecording] = useState(false);
    const [mediaReady, setMediaReady] = useState(false);
    const [startupError, setStartupError] = useState<string | null>(null);

    const { start, stop, isReady: analysisReady, initializing, error: analysisError } = useSessionAnalysisController(videoRef);
    const { startRecording, stopAndAnalyze } = useAudioAnalysis();
    const { setMetric, setFeedback, setPhase, diagnostics, phase } = useSessionStore();

    useEffect(() => {
        document.title = "Fluent AI - Session";
    }, []);

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

        const audio = await stopAndAnalyze();
        if (!audio) {
            setStartupError("The session could not be finalized. Please try again.");
            return;
        }

        setMetric("wordsPerMinute", typeof audio.words_per_minute === "number" ? audio.words_per_minute : null);
        setMetric("fillerCount", typeof audio.filler_count === "number" ? audio.filler_count : null);
        setMetric("voiceConfidence", typeof audio.voice_confidence === "number" ? audio.voice_confidence : null);
        setMetric("transcript", typeof audio.transcript === "string" ? audio.transcript : "");

        const state = useSessionStore.getState();
        const durationSeconds = typeof audio.duration_seconds === "number" ? audio.duration_seconds : 0;
        const wordsPerMinute = typeof audio.words_per_minute === "number" ? audio.words_per_minute : null;
        const scores = [state.postureScore, state.eyeContactPercent, state.presenceScore,
            state.fidgetScore === null ? null : 100 - state.fidgetScore,
            wordsPerMinute === null ? null : paceScore(wordsPerMinute)]
            .filter((score): score is number => score !== null);
        const overallScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
        const localSession = {
            id: Date.now(),
            created_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
            overall_score: overallScore ?? 0,
            posture_score: state.postureScore ?? 0,
            eye_contact_percent: state.eyeContactPercent ?? 0,
            words_per_minute: wordsPerMinute,
            presence_score: state.presenceScore,
            gesture_activity: state.gestureActivity,
            fidget_score: state.fidgetScore,
            filler_count: typeof audio.filler_count === "number" ? audio.filler_count : null,
            voice_projection: typeof audio.voice_confidence === "number" ? audio.voice_confidence : null,
            audio_available: audio.audio_available === true,
            model_availability: Object.fromEntries(Object.entries(state.diagnostics).map(([name, diagnostic]) => [name, diagnostic.status])),
            coaching_feedback: null,
        };

        let coachingFeedback = "AI Coaching unavailable. Connect the FluentAI backend to receive evidence-based feedback.";
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const backendPayload = {
                user_id: "demo-user",
                posture_score: state.postureScore,
                eye_contact_percent: state.eyeContactPercent,
                engagement_score: state.presenceScore,
                fidget_score: state.fidgetScore,
                words_per_minute: wordsPerMinute,
                filler_count: typeof audio.filler_count === "number" ? audio.filler_count : null,
                transcript: typeof audio.transcript === "string" ? audio.transcript : "",
                voice_confidence: typeof audio.voice_confidence === "number" ? audio.voice_confidence : null,
                is_monotone: state.isMonotone,
                duration_seconds: durationSeconds,
            };
            const res = await fetch(
                `${baseUrl}/api/coaching/complete`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(backendPayload)
                }
            );
            const { feedback } = await res.json();
            coachingFeedback = feedback || coachingFeedback;
        } catch (err) {
            console.warn("AI coaching backend unavailable.", err);
        }

        setFeedback(coachingFeedback);
        saveSession({ ...localSession, coaching_feedback: coachingFeedback });
        setPhase("complete");
        router.push("/dashboard");
    };

    return (
        <div className="flex h-screen bg-gray-950">
            <div className="flex-1 relative">
                <video ref={videoRef} autoPlay muted playsInline
                    className="w-full h-full object-cover" />
            </div>
            <aside className="w-96 bg-gray-900 p-6 flex flex-col gap-4">
                <LiveMetrics />
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
