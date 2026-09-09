export interface SavedSession {
    id: number;
    created_at: string;
    duration_seconds: number;
    overall_score: number;
    posture_score: number;
    eye_contact_percent: number;
    words_per_minute: number | null;
    coaching_feedback: string | null;
    presence_score?: number | null;
    gesture_activity?: number | null;
    fidget_score?: number | null;
    filler_count?: number | null;
    voice_projection?: number | null;
    audio_available?: boolean;
    model_availability?: Record<string, string>;
}

const STORAGE_KEY = "fluent-ai-sessions";
const MAX_SESSIONS = 20;

export function getSavedSessions(): SavedSession[] {
    try {
        if (typeof window === "undefined") return [];
        const value = window.localStorage.getItem(STORAGE_KEY);
        return value ? JSON.parse(value) : [];
    } catch {
        return [];
    }
}

export function saveSession(session: SavedSession) {
    const sessions = [session, ...getSavedSessions()].slice(0, MAX_SESSIONS);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}