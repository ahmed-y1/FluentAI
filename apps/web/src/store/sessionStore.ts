import { create } from "zustand";

interface SessionState {
  isRecording: boolean;
  postureScore: number; eyeContactPercent: number;
  engagementScore: number; fidgetScore: number;
  wordsPerMinute: number; fillerCount: number;
  voiceConfidence: number; isMonotone: boolean;
  transcript: string; coachingFeedback: string | null;
  overallScore: number;
  setMetric: (key: string, value: number | boolean | string) => void;
  setRecording: (v: boolean) => void;
  setFeedback: (text: string) => void;
  reset: () => void;
}

const defaults = {
  isRecording:false, postureScore:0, eyeContactPercent:0,
  engagementScore:0, fidgetScore:0, wordsPerMinute:0,
  fillerCount:0, voiceConfidence:0, isMonotone:false,
  transcript:"", coachingFeedback:null, overallScore:0,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...defaults,
  setMetric: (k, v) => set((s) => ({ ...s, [k]: v })),
  setRecording: (v) => set({ isRecording: v }),
  setFeedback: (t) => set({ coachingFeedback: t }),
  reset: () => set(defaults),
}));