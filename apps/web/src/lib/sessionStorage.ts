export interface SavedSession {
    id: number;
    created_at: string;
    duration_seconds: number;
    overall_score: number | null;
    posture_score: number | null;
    eye_contact_percent: number | null;
    mode: "presentation" | "interview" | "general" | "green";
    language: "en" | "ar" | "auto";
    words_per_minute: number | null;
    coaching_feedback: string | null;
    presence_score?: number | null;
    gesture_activity?: number | null;
    filler_count?: number | null;
    voice_projection?: number | null;
    audio_available?: boolean;
    model_availability?: Record<string, string>;
    metrics?: Record<string, unknown>;
    score_breakdown?: Record<string, unknown>;
    transcript?: string | null;
    word_count?: number | null;
    filler_rate?: number | null;
    filler_frequency?: Record<string, number>;
    pause_count?: number | null;
    average_pause_seconds?: number | null;
    longest_pause_seconds?: number | null;
    lexical_diversity?: number | null;
    transcription_available?: boolean;
}

const STORAGE_KEY = "fluent-ai-sessions";
const MAX_SESSIONS = 20;

export function getSavedSessions(): SavedSession[] {
    try {
        if (typeof window === "undefined") return [];
        const value = window.localStorage.getItem(STORAGE_KEY);
        return value ? (JSON.parse(value) as SavedSession[]).map((session) => ({
            ...session,
            mode: session.mode ?? "general",
            language: session.language ?? "auto",
            overall_score: session.overall_score ?? null,
        })) : [];
    } catch {
        return [];
    }
}

export function saveSession(session: SavedSession) {
    const sessions = [session, ...getSavedSessions()].slice(0, MAX_SESSIONS);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}