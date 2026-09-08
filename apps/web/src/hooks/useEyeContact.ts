import { useEffect, useRef, useState } from "react";
import { EyeContactTracker, EyeContactResult } from "@fluent-ai/analysis-engine";
import { useSessionStore } from "../store/sessionStore";

export function useEyeContact(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const tracker = useRef<EyeContactTracker | null>(null);
  const frame = useRef<number>(0);
  const isAnalyzing = useRef(false);
  const [lookingAtScreen, setLookingAtScreen] = useState(true);
  const [result, setResult] = useState<EyeContactResult | null>(null);
  const setMetric = useSessionStore((s: any) => s.setMetric);

  // Initialize tracker
  useEffect(() => {
    (async () => {
      try {
        console.log("[EyeContact] Initializing tracker...");
        tracker.current = new EyeContactTracker();
        await tracker.current.init();
        console.log("[EyeContact] Tracker initialized successfully");
      } catch (error) {
        tracker.current = null;
        console.error("[EyeContact] Failed to initialize:", error);
      }
    })();
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  // Analysis loop
  useEffect(() => {
    const loop = () => {
      frame.current = requestAnimationFrame(loop);
      if (!tracker.current) return;
      if (!videoRef.current || isAnalyzing.current) return;

      isAnalyzing.current = true;
      try {
        const timestamp = performance.now();
        const analysisResult = tracker.current.analyze(videoRef.current, timestamp);
        setResult(analysisResult);
        setLookingAtScreen(analysisResult.isLookingAtCamera);
        setMetric("eyeContactPercent", analysisResult.eyeContactPercent);
      } catch (error) {
        console.error("[EyeContact] Analysis error:", error);
      } finally {
        isAnalyzing.current = false;
      }
    };

    frame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame.current);
  }, [videoRef, setMetric]);

  return { lookingAtScreen, result };
}
