import { useCallback, useEffect, useRef, useState } from "react";
import {
    EyeContactTracker,
    GestureMonitor,
    PoseAnalyzer,
} from "@fluent-ai/analysis-engine";
import { useSessionStore } from "../store/sessionStore";

const POSE_INTERVAL_MS = 66;
const FACE_INTERVAL_MS = 80;
const HAND_INTERVAL_MS = 100;

export interface AnalysisControllerStatus {
    isReady: boolean;
    initializing: boolean;
    error: string | null;
}

export function useSessionAnalysisController(videoRef: React.RefObject<HTMLVideoElement | null>): AnalysisControllerStatus & {
    start: () => void;
    stop: () => void;
} {
    const poseRef = useRef<PoseAnalyzer | null>(null);
    const eyeRef = useRef<EyeContactTracker | null>(null);
    const gestureRef = useRef<GestureMonitor | null>(null);
    const frameRef = useRef<number | null>(null);
    const runningRef = useRef(false);
    const lastFrameRef = useRef({ pose: 0, face: 0, hands: 0, started: 0 });
    const [status, setStatus] = useState<AnalysisControllerStatus>({ isReady: false, initializing: true, error: null });
    const setPhase = useSessionStore((state) => state.setPhase);
    const setMetric = useSessionStore((state) => state.setMetric);
    const setDiagnostic = useSessionStore((state) => state.setDiagnostic);
    const reset = useSessionStore((state) => state.reset);

    useEffect(() => {
        let cancelled = false;
        setPhase("initializing");

        const initialize = async () => {
            const nextPose = new PoseAnalyzer();
            const nextEye = new EyeContactTracker();
            const nextGesture = new GestureMonitor();
            const models = [
                { name: "pose", model: nextPose, init: () => nextPose.init() },
                { name: "face", model: nextEye, init: () => nextEye.init() },
                { name: "hands", model: nextGesture, init: () => nextGesture.init() },
            ];

            const results = await Promise.all(models.map(async ({ name, init }) => {
                setDiagnostic(name, { status: "loading", framesProcessed: 0 });
                try {
                    await init();
                    setDiagnostic(name, { status: "ready", framesProcessed: 0 });
                    return true;
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Model initialization failed";
                    setDiagnostic(name, { status: "unavailable", error: message, framesProcessed: 0 });
                    return false;
                }
            }));

            if (cancelled) return;
            if (results.every(Boolean)) {
                poseRef.current = nextPose;
                eyeRef.current = nextEye;
                gestureRef.current = nextGesture;
                setStatus({ isReady: true, initializing: false, error: null });
                setPhase("ready");
            } else {
                setStatus({ isReady: false, initializing: false, error: "One or more vision models could not be loaded." });
                setPhase("error");
            }
        };

        initialize().catch((error) => {
            if (cancelled) return;
            const message = error instanceof Error ? error.message : "Vision analysis failed to initialize.";
            setStatus({ isReady: false, initializing: false, error: message });
            setPhase("error");
        });

        return () => {
            cancelled = true;
            runningRef.current = false;
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [setDiagnostic, setPhase]);

    const analyzeFrame = useCallback((timestamp: number) => {
        if (!runningRef.current) return;
        const video = videoRef.current;
        if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
            frameRef.current = requestAnimationFrame(analyzeFrame);
            return;
        }

        const last = lastFrameRef.current;
        const runModel = (name: string, callback: () => void) => {
            const started = performance.now();
            try {
                callback();
                const current = useSessionStore.getState().diagnostics[name];
                setDiagnostic(name, {
                    status: "running",
                    framesProcessed: (current?.framesProcessed ?? 0) + 1,
                    lastInferenceMs: performance.now() - started,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Inference failed";
                setDiagnostic(name, {
                    status: "unavailable",
                    error: message,
                    framesProcessed: useSessionStore.getState().diagnostics[name]?.framesProcessed ?? 0,
                });
            }
        };

        if (timestamp - last.pose >= POSE_INTERVAL_MS && poseRef.current) {
            last.pose = timestamp;
            runModel("pose", () => {
                const result = poseRef.current!.analyze(video, timestamp);
                if (result.overall !== null) setMetric("postureScore", result.overall);
            });
        }
        if (timestamp - last.face >= FACE_INTERVAL_MS && eyeRef.current) {
            last.face = timestamp;
            runModel("face", () => {
                const result = eyeRef.current!.analyze(video, timestamp);
                setMetric("eyeContactPercent", result.eyeContactPercent);
                setMetric("presenceScore", result.faceDetected && result.gazeScore !== null ? result.gazeScore : null);
            });
        }
        if (timestamp - last.hands >= HAND_INTERVAL_MS && gestureRef.current) {
            last.hands = timestamp;
            runModel("hands", () => {
                const result = gestureRef.current!.analyze(video, timestamp);
                setMetric("gestureActivity", result.gestureActivity);
                setMetric("fidgetScore", result.fidgetScore);
            });
        }

        if (last.started && timestamp - last.started > 2000 && useSessionStore.getState().phase === "calibrating") {
            setPhase("recording");
        }
        frameRef.current = requestAnimationFrame(analyzeFrame);
    }, [setDiagnostic, setMetric, setPhase, videoRef]);

    const start = useCallback(() => {
        if (!status.isReady || runningRef.current) return;
        poseRef.current?.reset();
        eyeRef.current?.reset();
        gestureRef.current?.reset();
        reset();
        setPhase("calibrating");
        runningRef.current = true;
        lastFrameRef.current = { pose: 0, face: 0, hands: 0, started: performance.now() };
        frameRef.current = requestAnimationFrame(analyzeFrame);
    }, [analyzeFrame, reset, setPhase, status.isReady]);

    const stop = useCallback(() => {
        runningRef.current = false;
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
    }, []);

    return { ...status, start, stop };
}
