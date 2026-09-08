import { useSessionStore } from "../../store/sessionStore";

export default function LiveMetrics() {
    const posture = useSessionStore((s: any) => s.postureScore);
    const eye = useSessionStore((s: any) => s.eyeContactPercent);
    const engage = useSessionStore((s: any) => s.engagementScore);
    const fidget = useSessionStore((s: any) => s.fidgetScore);

    return (
        <div className="space-y-4">
            <Bar label="Posture" value={posture} color="#2dd4bf" />
            <Bar label="Eye Contact" value={eye} color="#34d399" />
            <Bar label="Engagement" value={engage} color="#7F77DD" />
            <Bar label="Calm Hands" value={100 - fidget} color="#fb923c" />
        </div>
    );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{label}</span>
                <span style={{ color }}>{Math.round(value)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full">
                <div className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: value + "%", background: color }} />
            </div>
        </div>
    );
}