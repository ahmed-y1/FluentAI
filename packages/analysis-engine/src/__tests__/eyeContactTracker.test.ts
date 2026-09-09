import { EyeContactTracker } from "../eyeContactTracker";

class T extends EyeContactTracker {
  setHistory(v: boolean[]) { (this as any).history = v; }
  pct() { return (this as any).rolling(); }
}

describe("EyeContactTracker rolling %", () => {
  it("returns unknown for empty history",        () => { const t=new T(); expect(t.pct()).toBeNull(); });
  it("returns 100 when always looking",          () => { const t=new T(); t.setHistory(Array(100).fill(true));  expect(t.pct()).toBe(100); });
  it("returns 50 for half-and-half",             () => { const t=new T(); t.setHistory([...Array(50).fill(true),...Array(50).fill(false)]); expect(t.pct()).toBe(50); });
  it("resets to unknown after reset()",          () => { const t=new T(); t.setHistory(Array(100).fill(true)); t.reset(); expect(t.pct()).toBeNull(); });
});