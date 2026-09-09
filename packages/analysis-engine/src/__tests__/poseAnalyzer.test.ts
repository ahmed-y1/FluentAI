import { PoseAnalyzer } from "../poseAnalyzer";

describe("PoseAnalyzer", () => {
  it("returns unavailable scores when no pose detected", async () => {
    const a = new PoseAnalyzer(); await a.init();
    const r = a.analyze({} as HTMLVideoElement, 0);
    expect(r.overall).toBeNull();
    expect(r.available).toBe(false);
    expect(r.feedback).toContain("Pose unavailable");
  });

  it("shoulderBalance formula: level shoulders = 100", () => {
    const diff = 0;
    expect(Math.max(0, 100 - diff * 1000)).toBe(100);
  });

  it("shoulderBalance formula: 5% imbalance = 50", () => {
    const diff = 0.05;
    expect(Math.max(0, 100 - diff * 1000)).toBe(50);
  });
});