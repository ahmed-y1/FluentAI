import { create } from "zustand";

export type SessionPhase = "idle" | "initializing" | "ready" | "calibrating" | "recording" | "processing" | "complete" | "error";
export type DiagnosticStatus = "loading" | "ready" | "running" | "unavailable";
export type MetricValue = number | null;

export interface AnalysisDiagnostic {
  status: DiagnosticStatus;
  error?: string;
  lastInferenceMs?: number;
  framesProcessed: number;
}

export interface SessionState {
  phase: SessionPhase;
  isRecording: boolean;
  postureScore: MetricValue;
  eyeContactPercent: MetricValue;
  presenceScore: MetricValue;
  engagementScore: MetricValue;
  gestureActivity: MetricValue;
  fidgetScore: MetricValue;
  wordsPerMinute: MetricValue;
  fillerCount: MetricValue;
  voiceConfidence: MetricValue;
  isMonotone: boolean | null;
  transcript: string;
  coachingFeedback: string | null;
  overallScore: MetricValue;
  diagnostics: Record<string, AnalysisDiagnostic>;
  setMetric: <K extends MetricKey>(key: K, value: SessionState[K]) => void;
  setPhase: (phase: SessionPhase) => void;
  setDiagnostic: (name: string, diagnostic: AnalysisDiagnostic) => void;
  setRecording: (value: boolean) => void;
  setFeedback: (text: string) => void;
  reset: () => void;
}

export type MetricKey =
  | "postureScore" | "eyeContactPercent" | "presenceScore" | "engagementScore"
  | "gestureActivity" | "fidgetScore" | "wordsPerMinute" | "fillerCount"
  | "voiceConfidence" | "isMonotone" | "transcript" | "overallScore";

const defaults: Omit<SessionState, "setMetric" | "setPhase" | "setDiagnostic" | "setRecording" | "setFeedback" | "reset"> = {
  phase: "idle",
  isRecording: false,
  postureScore: null,
  eyeContactPercent: null,
  presenceScore: null,
  engagementScore: null,
  gestureActivity: null,
  fidgetScore: null,
  wordsPerMinute: null,
  fillerCount: null,
  voiceConfidence: null,
  isMonotone: null,
  transcript: "",
  coachingFeedback: null,
  overallScore: null,
  diagnostics: {},
};

export const useSessionStore = create<SessionState>((set) => ({
  ...defaults,
  setMetric: (key, value) => set({ [key]: value } as Partial<SessionState>),
  setPhase: (phase) => set({ phase, isRecording: phase === "recording" }),
  setDiagnostic: (name, diagnostic) => set((state) => ({ diagnostics: { ...state.diagnostics, [name]: diagnostic } })),
  setRecording: (value) => set({ isRecording: value, phase: value ? "recording" : "idle" }),
  setFeedback: (text) => set({ coachingFeedback: text }),
  reset: () => set((state) => ({ ...defaults, diagnostics: state.diagnostics })),
}));