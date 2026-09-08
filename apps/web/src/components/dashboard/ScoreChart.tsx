"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
    sessions: { date: string; overall: number; posture: number; eyeContact: number }[];
}

export default function ScoreChart({ sessions }: Props) {
    // Empty State Guard
    if (sessions.length === 0) {
        return (
            <div className="bg-gray-900 rounded-2xl p-6 text-center py-12">
                <p className="text-gray-400">Complete your first session to see your progress chart.</p>
            </div>
        );
    }

    // Single Session Guard
    if (sessions.length === 1) {
        return (
            <div className="bg-gray-900 rounded-2xl p-6 text-center py-8">
                <p className="text-gray-300 text-2xl font-semibold">{sessions[0].overall}/100</p>
                <p className="text-gray-400 mt-1">First session score — complete more to see your trend.</p>
            </div>
        );
    }

    // Multi-Session Trend Chart Render
    return (
        <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Progress Over Time</h2>
            <ResponsiveContainer width="100%" height={240}>
                <LineChart data={sessions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a3a40" />
                    <XAxis dataKey="date" tick={{ fill: "#99f6e4", fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#99f6e4", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "#072327", border: "1px solid #114a52", borderRadius: 8, color: "#ccfbf1" }} />
                    <Legend wrapperStyle={{ color: "#99f6e4", fontSize: 12 }} />
                    <Line type="monotone" dataKey="overall" stroke="#2dd4bf" strokeWidth={2} dot={false} name="Overall" />
                    <Line type="monotone" dataKey="posture" stroke="#34d399" strokeWidth={2} dot={false} name="Posture" />
                    <Line type="monotone" dataKey="eyeContact" stroke="#378ADD" strokeWidth={2} dot={false} name="Eye Contact" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}