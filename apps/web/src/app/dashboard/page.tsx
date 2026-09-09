"use client";

import { useEffect, useState } from "react";
import ScoreChart from "../../components/dashboard/ScoreChart";
import SessionHistory from "../../components/dashboard/SessionHistory";
import CoachingCard from "../../components/dashboard/CoachingCard";
import { getSavedSessions } from "../../lib/sessionStorage";

function MetricCard({ label, value, unit = "%" }: { label: string; value: number; unit?: string }) {
    const color = value >= 75 ? "#34d399" : value >= 50 ? "#fb923c" : "#f87171";
    return (
        <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-semibold" style={{ color }}>{Math.round(value)}{unit}</p>
        </div>
    );
}

export default function DashboardPage() {
    const [sessions, setSessions] = useState<any[]>([]);

    useEffect(() => {
        setSessions(getSavedSessions());
    }, []);

    const chartData = [...sessions].reverse().map((s: any) => ({
        date: new Date(s.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        overall: Math.round(s.overall_score),
        posture: Math.round(s.posture_score),
        eyeContact: Math.round(s.eye_contact_percent),
    }));

    return (
        <div className="min-h-screen bg-gray-950 p-8 space-y-6">
            <h1 className="text-2xl font-semibold text-white">Your Progress</h1>

            <div className="grid grid-cols-4 gap-4">
                <MetricCard label="Overall" value={sessions[0]?.overall_score ?? 0} />
                <MetricCard label="Eye Contact" value={sessions[0]?.eye_contact_percent ?? 0} />
                <MetricCard label="Posture" value={sessions[0]?.posture_score ?? 0} />
                <MetricCard label="WPM" value={sessions[0]?.words_per_minute ?? 0} unit="" />
            </div>

            <ScoreChart sessions={chartData} />
            {sessions[0] && <CoachingCard feedback={sessions[0].coaching_feedback} score={sessions[0].overall_score} />}
            <SessionHistory sessions={sessions} />
        </div>
    );
}
