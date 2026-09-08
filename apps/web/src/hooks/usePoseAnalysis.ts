import { useCallback, useEffect, useRef, useState } from "react";
import { PoseAnalyzer, PostureScore } from "@fluent-ai/analysis-engine";
import { useSessionStore } from "../store/sessionStore";

export function usePoseAnalysis(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const analyzer = useRef<PoseAnalyzer | null>(null);
  const frame    = useRef<number>(0);
  const [score, setScore] = useState<PostureScore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const setMetric = useSessionStore((s: any) => s.setMetric);

useEffect(() => {
    (async () => {
      try {
        analyzer.current = new PoseAnalyzer();
        await analyzer.current.init();
        setIsReady(true);
      } catch (error) {
        analyzer.current = null;
        setIsReady(false);
        console.warn("Pose analysis failed to initialize:", error);
      }
    })();
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const start = useCallback(() => {
    if (!isReady) {
      console.warn("Pose analysis is not ready yet.");
      return;
    }

    const loop = (ts: number) => {
      const video = videoRef.current;
      if (
        video &&
        analyzer.current &&
        isReady &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        try {
          const r = analyzer.current.analyze(video, ts);
          setScore(r);
          setMetric("postureScore", r.overall);
        } catch (error) {
          console.warn("Pose analysis failed:", error);
          cancelAnimationFrame(frame.current);
          return;
        }
      }
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  }, [videoRef, isReady, setMetric]);

  const stop = useCallback(() => cancelAnimationFrame(frame.current), []);
  return { score, isReady, start, stop };
}
