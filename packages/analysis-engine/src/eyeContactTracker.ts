import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface EyeContactResult {
  isLookingAtCamera: boolean;
  gazeScore: number;        // 0–100
  eyeContactPercent: number; // rolling % over session
}

export class EyeContactTracker {
  private landmarker: FaceLandmarker | null = null;
  private history: boolean[] = [];

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
    this.landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    });
  }

  analyze(video: HTMLVideoElement, timestamp: number): EyeContactResult {
    if (!this.landmarker) throw new Error("EyeContactTracker not initialized");
    const result = this.landmarker.detectForVideo(video, timestamp);
    if (!result.faceLandmarks?.length) {
      return { isLookingAtCamera: false, gazeScore: 0, eyeContactPercent: this.rolling() };
    }
    const bs = result.faceBlendshapes?.[0]?.categories ?? [];
    const get = (name: string) => bs.find(b => b.categoryName === name)?.score ?? 0;
    const deviation = (get("eyeLookOutLeft") + get("eyeLookOutRight")
                     + get("eyeLookUpLeft") + get("eyeLookDownLeft")) / 4;
    const gazeScore = Math.max(0, 100 - deviation * 300);
    const looking = gazeScore > 55;
    this.history.push(looking);
    if (this.history.length > 300) this.history.shift();
    return { isLookingAtCamera: looking, gazeScore, eyeContactPercent: this.rolling() };
  }

  private rolling() {
    if (!this.history.length) return 0;
    return (this.history.filter(Boolean).length / this.history.length) * 100;
  }

  reset() { this.history = []; }
}