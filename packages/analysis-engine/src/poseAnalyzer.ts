import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

export interface PostureScore {
  overall: number | null;
  shoulderBalance: number | null;
  headTilt: number | null;
  spineAlignment: number | null;
  forwardHead: number | null;
  confidence: number;
  available: boolean;
  feedback: string[];
}

export class PoseAnalyzer {
  private landmarker: PoseLandmarker | null = null;
  private history: number[] = [];
  private calibrationSamples = 0;

  reset() {
    this.history = [];
    this.calibrationSamples = 0;
  }

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.3,
      minPosePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });
  }

  analyze(videoElement: HTMLVideoElement, timestamp: number): PostureScore {
    if (!this.landmarker) throw new Error("PoseAnalyzer not initialized");
    
    const result = this.landmarker.detectForVideo(videoElement, timestamp);

    if (!result.landmarks?.length) {
      return { overall: null, shoulderBalance: null, headTilt: null, spineAlignment: null, forwardHead: null, confidence: 0, available: false, feedback: ["Pose unavailable"] };
    }
    const lm = result.landmarks[0];
    const [nose, lEar, rEar, lS, rS, lH, rH] = [lm[0], lm[7], lm[8], lm[11], lm[12], lm[23], lm[24]];
    const points = [nose, lS, rS, lH, rH];
    const confidence = points.reduce((sum, point) => sum + (point?.visibility ?? 0), 0) / points.length;
    if (confidence < 0.35 || points.some((point) => !point || (point.visibility ?? 0) < 0.2)) {
      return { overall: null, shoulderBalance: null, headTilt: null, spineAlignment: null, forwardHead: null, confidence, available: false, feedback: ["Pose confidence is too low"] };
    }

    const shoulderWidth = Math.max(Math.abs(lS.x - rS.x), 0.01);
    const shoulderAngle = Math.abs(Math.atan2(rS.y - lS.y, rS.x - lS.x) * 180 / Math.PI);
    const shoulderBalance = clamp(100 - shoulderAngle * 4);
    const headTilt = lEar && rEar && (lEar.visibility ?? 0) > 0.2 && (rEar.visibility ?? 0) > 0.2
      ? clamp(100 - Math.abs(Math.atan2(rEar.y - lEar.y, rEar.x - lEar.x) * 180 / Math.PI) * 4)
      : null;
    const midShoulderX = (lS.x + rS.x) / 2;
    const midHipX = (lH.x + rH.x) / 2;
    const spineAlignment = clamp(100 - Math.abs(midShoulderX - midHipX) / shoulderWidth * 100);
    const forwardHead = clamp(100 - Math.abs(nose.x - midShoulderX) / shoulderWidth * 85);
    const rawScores = [shoulderBalance, headTilt, spineAlignment, forwardHead].filter((score): score is number => score !== null);
    const rawOverall = rawScores.reduce((sum, score) => sum + score, 0) / rawScores.length;

    if (this.calibrationSamples < 30) {
      this.calibrationSamples += 1;
      return { overall: null, shoulderBalance: null, headTilt: null, spineAlignment: null, forwardHead: null, confidence, available: true, feedback: ["Calibrating posture"] };
    }

    this.history.push(rawOverall);
    if (this.history.length > 8) this.history.shift();
    const overall = this.history.reduce((sum, score) => sum + score, 0) / this.history.length;

    const feedback: string[] = [];
    if (shoulderBalance < 70) feedback.push("Shoulders appear uneven — try to level them.");
    if (headTilt !== null && headTilt < 70) feedback.push("Head is tilting — keep it centred.");
    if (spineAlignment < 70) feedback.push("You may be leaning — sit or stand straight.");
    if (overall > 85) feedback.push("Great posture! Keep it up.");
    return { overall, shoulderBalance, headTilt, spineAlignment, forwardHead, confidence, available: true, feedback };
  }
}

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }