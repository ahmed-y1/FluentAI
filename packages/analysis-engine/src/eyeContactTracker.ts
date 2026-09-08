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
      minFaceDetectionConfidence: 0.3,
      minFacePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });
  }

  analyze(video: HTMLVideoElement, timestamp: number): EyeContactResult {
    if (!this.landmarker) throw new Error("EyeContactTracker not initialized");
    const result = this.landmarker.detectForVideo(video, timestamp);
    if (!result.faceLandmarks?.length) {
      return { isLookingAtCamera: false, gazeScore: 0, eyeContactPercent: this.rolling() };
    }
    const landmarks = result.faceLandmarks[0];
    const point = (index: number) => landmarks[index];
    const leftIris = point(468);
    const rightIris = point(473);
    const leftOuter = point(33);
    const leftInner = point(133);
    const rightInner = point(362);
    const rightOuter = point(263);
    const nose = point(1);

    let gazeScore = 0;
    if (leftIris && rightIris && leftOuter && leftInner && rightInner && rightOuter && nose) {
      const leftWidth = Math.max(Math.abs(leftInner.x - leftOuter.x), 0.001);
      const rightWidth = Math.max(Math.abs(rightOuter.x - rightInner.x), 0.001);
      const leftRatio = Math.abs((leftIris.x - leftOuter.x) / (leftInner.x - leftOuter.x));
      const rightRatio = Math.abs((rightIris.x - rightInner.x) / (rightOuter.x - rightInner.x));
      const irisDeviation = (Math.abs(leftRatio - 0.5) + Math.abs(rightRatio - 0.5)) / 2;
      const eyeCenterX = (leftOuter.x + leftInner.x + rightInner.x + rightOuter.x) / 4;
      const eyeWidth = Math.max((leftWidth + rightWidth) / 2, 0.001);
      const headDeviation = Math.min(1, Math.abs(nose.x - eyeCenterX) / eyeWidth);
      gazeScore = Math.max(0, 100 - irisDeviation * 180 - headDeviation * 45);
    }

    const bs = result.faceBlendshapes?.[0]?.categories ?? [];
    const get = (name: string) => bs.find(b => b.categoryName === name)?.score ?? 0;
    const blendshapeDeviation = (get("eyeLookOutLeft") + get("eyeLookOutRight")
      + get("eyeLookUpLeft") + get("eyeLookDownLeft")) / 4;
    const blendshapeScore = Math.max(0, 100 - blendshapeDeviation * 300);
    if (gazeScore === 0) gazeScore = blendshapeScore;
    else gazeScore = gazeScore * 0.7 + blendshapeScore * 0.3;
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