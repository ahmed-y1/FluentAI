import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export interface GestureResult {
  handsDetected: number;
  movementIntensity: number;  // 0–100
  fidgetScore: number;        // 0–100 (higher = more distracting)
  feedback: string;
}

export class GestureMonitor {
  private landmarker: HandLandmarker | null = null;
  private prevPos: {x:number, y:number}[] = [];
  private history: number[] = [];

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.3,
      minHandPresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });
  }

  analyze(video: HTMLVideoElement, timestamp: number): GestureResult {
    if (!this.landmarker) throw new Error("GestureMonitor not initialized");
    const result = this.landmarker.detectForVideo(video, timestamp);
    const handsDetected = result.landmarks?.length ?? 0;
    if (!handsDetected) {
      this.prevPos = [];
      return { handsDetected:0, movementIntensity:0, fidgetScore:0, feedback:"No hands detected." };
    }
    const curr = result.landmarks
      .map(h => ({ x: h[0].x, y: h[0].y }))
      .sort((a, b) => a.x - b.x);
    let totalMove = 0;
    if (this.prevPos.length === curr.length) {
      for (let i = 0; i < curr.length; i++) {
        const dx = curr[i].x - (this.prevPos[i]?.x ?? 0);
        const dy = curr[i].y - (this.prevPos[i]?.y ?? 0);
        totalMove += Math.sqrt(dx*dx + dy*dy);
      }
    }
    this.prevPos = curr;
    this.history.push(totalMove);
    if (this.history.length > 90) this.history.shift();
    const avg = this.history.reduce((a,b) => a+b, 0) / this.history.length;
    const movementIntensity = Math.min(100, avg * 2000);
    const fidgetScore = movementIntensity > 60 ? movementIntensity : 0;
    let feedback = "Hand gestures look natural.";
    if (fidgetScore > 70) feedback = "Hands moving too much — try to keep them calmer.";
    else if (movementIntensity < 5) feedback = "Consider adding gestures to emphasise key points.";
    return { handsDetected, movementIntensity, fidgetScore, feedback };
  }
}