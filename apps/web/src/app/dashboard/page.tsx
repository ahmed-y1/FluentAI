"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScoreChart from "../../components/dashboard/ScoreChart";
import SessionHistory from "../../components/dashboard/SessionHistory";
import CoachingCard from "../../components/dashboard/CoachingCard";
import { getSavedSessions, SavedSession } from "../../lib/sessionStorage";

function MetricCard({ label, value, unit = "%" }: { label: string; value: number; unit?: string }) {
    const color = value >= 75 ? "#34d399" : value >= 50 ? "#fb923c" : "#f87171";
    return (
        <div className="dashboard-metric">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-semibold" style={{ color }}>{Math.round(value)}{unit}</p>
        </div>
    );
}

export default function DashboardPage() {
    const [sessions, setSessions] = useState<SavedSession[]>([]);

    useEffect(() => {
        setSessions(getSavedSessions());
    }, []);

    const chartData = [...sessions].reverse().map((s) => ({
        date: new Date(s.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        overall: Math.round(s.overall_score),
        posture: Math.round(s.posture_score),
        eyeContact: Math.round(s.eye_contact_percent),
    }));

    return (
        <main className="dashboard-page">
            <div className="dashboard-shell">
                <section className="dashboard-hero">
                    <div>
                        <p className="eyebrow"><span className="live-dot" /> Your private practice log</p>
                        <h1>Your progress, <em>in focus.</em></h1>
                        <p>Review the moments that are getting clearer, calmer, and more confident.</p>
                    </div>
                    <Link href="/session" className="dashboard-action">New session <span aria-hidden="true">-&gt;</span></Link>
                </section>

                <div className="dashboard-metrics">
                    <MetricCard label="Overall" value={sessions[0]?.overall_score ?? 0} />
                    <MetricCard label="Eye Contact" value={sessions[0]?.eye_contact_percent ?? 0} />
                    <MetricCard label="Posture" value={sessions[0]?.posture_score ?? 0} />
                    <MetricCard label="Words / min" value={sessions[0]?.words_per_minute ?? 0} unit="" />
                </div>

                <div className="dashboard-panel-grid">
                    <ScoreChart sessions={chartData} />
                    {sessions[0] && <CoachingCard feedback={sessions[0].coaching_feedback} score={sessions[0].overall_score} />}
                </div>
                <SessionHistory sessions={sessions} />
            </div>
        </main>
    );
}
