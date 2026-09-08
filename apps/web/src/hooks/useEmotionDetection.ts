import { useEffect, useRef, useState } from "react";
import { EmotionDetector, EmotionResult } from "@fluent-ai/analysis-engine";
import { useSessionStore } from "../store/sessionStore";

export function useEmotionDetection(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const detector    = useRef<EmotionDetector | null>(null);
  const isAnalyzing = useRef(false);
  const frame       = useRef<number>(0);
  const [emotion, setEmotion] = useState<EmotionResult | null>(null);
  const setMetric = useSessionStore((s: any) => s.setMetric);

useEffect(() => {
    (async () => {
      try {
        console.log("[Emotion] Initializing detector...");
        detector.current = new EmotionDetector();
        await detector.current.init("/models");
        console.log("[Emotion] Detector initialized successfully");
      } catch (error) {
        detector.current = null;
        console.error("[Emotion] Failed to initialize:", error);
      }
    })();
    return () => cancelAnimationFrame(frame.current);
  }, []);

  useEffect(() => {
    const loop = () => {
      frame.current = requestAnimationFrame(loop);
      if (!detector.current) return;
      if (!videoRef.current || isAnalyzing.current) return;
      isAnalyzing.current = true;
      detector.current
        .analyze(videoRef.current)
        .then((r: EmotionResult | null) => {
          if (r) { 
            setEmotion(r); 
            setMetric("engagementScore", r.engagementScore);
          }
        })
        .catch((error) => {
          console.error("[Emotion] Analysis error:", error);
        })
        .finally(() => {
          isAnalyzing.current = false;
        });
    };
    frame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame.current);
  }, [videoRef, setMetric]);

  return { emotion };
}
