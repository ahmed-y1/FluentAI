interface S {
    id: number;
    created_at: string;
    overall_score: number;
    duration_seconds: number;
}

export default function SessionHistory({ sessions }: { sessions: S[] }) {
    if (!sessions.length) {
        return (
            <div className="bg-gray-900 rounded-2xl p-6 text-center">
                <p className="text-gray-400">No sessions yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Session History</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                        <div>
                            <p className="text-white text-sm font-medium">
                                {new Date(s.created_at).toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })}
                            </p>
                            <p className="text-gray-400 text-xs">{Math.ceil(s.duration_seconds / 60)} min session</p>
                        </div>
                        <p className="text-2xl font-semibold" style={{ color: s.overall_score >= 75 ? "#34d399" : s.overall_score >= 50 ? "#fb923c" : "#f87171" }}>
                            {Math.round(s.overall_score)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}