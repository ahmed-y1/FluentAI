export interface SavedSession {
    id: number;
    created_at: string;
    duration_seconds: number;
    overall_score: number;
    posture_score: number;
    eye_contact_percent: number;
    words_per_minute: number;
    coaching_feedback: string | null;
}

const COOKIE_NAME = "fluent-ai-sessions";
const MAX_SESSIONS = 10;
const MAX_COOKIE_BYTES = 3800;

function readCookie(): string | null {
    if (typeof document === "undefined") return null;

    const cookie = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
    return cookie ? decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)) : null;
}

function writeCookie(sessions: SavedSession[]) {
    const value = encodeURIComponent(JSON.stringify(sessions));
    if (value.length > MAX_COOKIE_BYTES) {
        throw new Error("Saved session history is too large for a browser cookie.");
    }

    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

export function getSavedSessions(): SavedSession[] {
    try {
        const value = readCookie();
        return value ? JSON.parse(value) : [];
    } catch {
        return [];
    }
}

export function saveSession(session: SavedSession) {
    const sessions = [session, ...getSavedSessions()].slice(0, MAX_SESSIONS);

    for (let count = sessions.length; count > 0; count -= 1) {
        try {
            writeCookie(sessions.slice(0, count));
            return;
        } catch {
        }
    }
}