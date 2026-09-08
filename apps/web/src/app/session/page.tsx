"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePoseAnalysis } from "../../hooks/usePoseAnalysis";
import { useEyeContact } from "../../hooks/useEyeContact";
import { useEmotionDetection } from "../../hooks/useEmotionDetection";
import { useAudioAnalysis } from "../../hooks/useAudioAnalysis";
import LiveMetrics from "../../components/session/LiveMetrics";
import SessionControls from "../../components/session/SessionControls";
import { useSessionStore } from "../../store/sessionStore";

export default function SessionPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [recording, setRecording] = useState(false);
    const [mediaReady, setMediaReady] = useState(false);
    const [startupError, setStartupError] = useState<string | null>(null);

    const { start, stop } = usePoseAnalysis(videoRef);
    const { emotion } = useEmotionDetection(videoRef);
    const { lookingAtScreen } = useEyeContact(videoRef);
    const { startRecording, stopAndAnalyze } = useAudioAnalysis();
    const { setMetric, setFeedback } = useSessionStore();

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

        const audio = await stopAndAnalyze();
        if (!audio) return;

        setMetric("wordsPerMinute", audio.words_per_minute);
        setMetric("fillerCount", audio.filler_count);
        setMetric("voiceConfidence", audio.voice_confidence);
        setMetric("transcript", audio.transcript);

        const state = useSessionStore.getState();
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(
                `${baseUrl}/api/coaching/complete`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...state, ...audio })
                }
            );
            const { feedback } = await res.json();
            setFeedback(feedback);
            router.push("/dashboard");
        } catch (err) {
            console.error("Failed to request AI feedback:", err);
        }
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
                    error={startupError}
                    disabled={!mediaReady}
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
            </aside>
        </div>
    );
}
