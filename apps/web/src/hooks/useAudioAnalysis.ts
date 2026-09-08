import { useRef, useState } from "react";

export function useAudioAnalysis() {
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [result, setResult] = useState<any>(null);

  const startRecording = (stream: MediaStream): Promise<boolean> => {
    if (recRef.current && recRef.current.state !== "inactive") {
      return Promise.resolve(true);
    }

    stream.getTracks().forEach((track) => {
      track.enabled = true;
      if (track.readyState === "ended") {
        console.warn("Hardware track ended; forcing a browser refresh is required.");
      }
    });

    if (!stream.active) {
      console.warn("Stream is inactive.");
      return Promise.resolve(false);
    }

    const audioTracks = stream.getAudioTracks().filter((track) => track.readyState === "live");
    if (!audioTracks.length) {
      console.warn("No active microphone track is available.");
      return Promise.resolve(false);
    }

    chunks.current = [];

    return new Promise((resolve) => {
      try {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
        const audioStream = new MediaStream(audioTracks);
        const rec = mimeType
          ? new MediaRecorder(audioStream, { mimeType })
          : new MediaRecorder(audioStream);

        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.current.push(e.data);
        };

        rec.onerror = (event) => {
          console.warn("Recording error:", event.error);
          resolve(false);
        };

        rec.start(1000);
        recRef.current = rec;
        console.log("Recording started successfully");
        resolve(true);
      } catch (e) {
        console.warn("Recording start failed:", e);
        if (recRef.current?.state !== "inactive") {
          recRef.current?.stop();
        }
        recRef.current = null;
        resolve(false);
      }
    });
  };

  const stopAndAnalyze = (): Promise<any> =>
    new Promise((resolve) => {
      // If recorder was never started, return immediately
      if (!recRef.current || recRef.current.state === "inactive") {
        return resolve(null);
      }

      recRef.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "session.webm");
        
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const res = await fetch(`${baseUrl}/api/audio/analyze`, {
            method: "POST",
            body: form,
          });
          
          if (!res.ok) throw new Error("Backend upload failed");
          
          const data = await res.json();
          setResult(data);
          resolve(data);
        } catch (e) {
          console.error("Upload error:", e);
          resolve(null);
        } finally {
          recRef.current = null;
        }
      };

      recRef.current.stop();

      recRef.current.stream.getTracks().forEach((track) => track.stop());
    });

  return { startRecording, stopAndAnalyze, result };
}
