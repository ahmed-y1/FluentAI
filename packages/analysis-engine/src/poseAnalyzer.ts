import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

export interface PostureScore {
  overall: number;        // 0–100
  shoulderBalance: number;
  headTilt: number;
  spineAlignment: number;
  feedback: string[];
}

export class PoseAnalyzer {
  private landmarker: PoseLandmarker | null = null;

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
    
    const t0 = performance.now();
    const result = this.landmarker.detectForVideo(videoElement, timestamp);
    console.log('Pose frame processing time:', (performance.now() - t0).toFixed(1) + 'ms');

    if (!result.landmarks?.length) {
      return { overall:0, shoulderBalance:0, headTilt:0, spineAlignment:0, feedback:["No pose detected"] };
    }
    const lm = result.landmarks[0];
    const [nose, lS, rS, lH, rH] = [lm[0], lm[11], lm[12], lm[23], lm[24]];

    const shoulderBalance = Math.max(0, 100 - Math.abs(lS.y - rS.y) * 1000);
    const midShoulderX = (lS.x + rS.x) / 2;
    const headTilt = Math.max(0, 100 - Math.abs(nose.x - midShoulderX) * 500);
    const spineAlignment = Math.max(0, 100 - Math.abs(midShoulderX - (lH.x + rH.x) / 2) * 400);
    const overall = (shoulderBalance + headTilt + spineAlignment) / 3;

    const feedback: string[] = [];
    if (shoulderBalance < 70) feedback.push("Shoulders appear uneven — try to level them.");
    if (headTilt < 70) feedback.push("Head is tilting — keep it centred.");
    if (spineAlignment < 70) feedback.push("You may be leaning — sit or stand straight.");
    if (overall > 85) feedback.push("Great posture! Keep it up.");
    return { overall, shoulderBalance, headTilt, spineAlignment, feedback };
  }
}