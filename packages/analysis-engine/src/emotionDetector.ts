import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";

export interface EmotionResult {
  dominant: string;
  confidence: number;
  scores: Record<string, number>;
  engagementScore: number;  // 0–100
}

export class EmotionDetector {
  async init(modelsUrl = "/models") {
    await tf.setBackend("cpu");
    await tf.ready();

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
      faceapi.nets.faceExpressionNet.loadFromUri(modelsUrl),
    ]);
  }

  async analyze(video: HTMLVideoElement): Promise<EmotionResult | null> {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.25,
      }))
      .withFaceExpressions();
    if (!detection) return null;

    const e = detection.expressions;
    const dominant = Object.entries(e).sort(([,a],[,b]) => b - a)[0];

    const raw = (e.happy * 1.2 + e.surprised * 0.8 + e.neutral * 0.5
               - e.sad * 0.8  - e.disgusted * 1.0 - e.fearful * 0.6) * 100;

    return {
      dominant: dominant[0],
      confidence: dominant[1],
      scores: e as unknown as Record<string, number>,
      engagementScore: Math.max(0, Math.min(100, raw + 50)),
    };
  }
}
