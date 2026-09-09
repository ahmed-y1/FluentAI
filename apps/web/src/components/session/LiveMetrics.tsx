import { useSessionStore } from "../../store/sessionStore";

export default function LiveMetrics() {
    const posture = useSessionStore((s) => s.postureScore);
    const eye = useSessionStore((s) => s.eyeContactPercent);
    const presence = useSessionStore((s) => s.presenceScore);
    const activity = useSessionStore((s) => s.gestureActivity);
    const fidget = useSessionStore((s) => s.fidgetScore);

    return (
        <div className="space-y-4">
            <Bar label="Posture" value={posture} color="#6366F1" />
            <Bar label="Eye Contact" value={eye} color="#818CF8" />
            <Bar label="Presence" value={presence} color="#6366F1" />
            <Bar label="Gesture Activity" value={activity} color="#818CF8" />
            <Bar label="Fidgeting" value={fidget} color="#0F172A" />
        </div>
    );
}

function Bar({ label, value, color }: { label: string; value: number | null; color: string }) {
    const available = value !== null;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{label}</span>
                <span style={{ color: available ? color : "#6b7280" }}>{available ? `${Math.round(value)}%` : "Unavailable"}</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full">
                <div className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: available ? `${value}%` : "0%", background: color }} />
            </div>
        </div>
    );
}