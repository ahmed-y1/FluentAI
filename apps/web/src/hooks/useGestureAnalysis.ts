import { useEffect, useRef, useState } from "react";
import { GestureMonitor, GestureResult } from "@fluent-ai/analysis-engine";
import { useSessionStore } from "../store/sessionStore";

export function useGestureAnalysis(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const monitor = useRef<GestureMonitor | null>(null);
  const frame = useRef<number>(0);
  const isAnalyzing = useRef(false);
  const [result, setResult] = useState<GestureResult | null>(null);
  const setMetric = useSessionStore((state) => state.setMetric);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const nextMonitor = new GestureMonitor();
        await nextMonitor.init();
        if (!cancelled) monitor.current = nextMonitor;
      } catch (error) {
        console.warn("[Hands] Failed to initialize:", error);
      }
    })();

    return () => {
      cancelled = true;
      monitor.current = null;
      cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    const loop = (timestamp: number) => {
      frame.current = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (
        !monitor.current ||
        !video ||
        isAnalyzing.current ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return;
      }

      isAnalyzing.current = true;
      try {
        const nextResult = monitor.current.analyze(video, timestamp);
        setResult(nextResult);
        setMetric("fidgetScore", nextResult.fidgetScore);
      } catch (error) {
        console.warn("[Hands] Analysis error:", error);
      } finally {
        isAnalyzing.current = false;
      }
    };

    frame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame.current);
  }, [videoRef, setMetric]);

  return { result };
}
