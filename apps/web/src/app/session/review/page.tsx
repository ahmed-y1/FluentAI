"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSavedSessions, SavedSession } from "../../../lib/sessionStorage";

const labels: Record<string, string> = { posture: "Posture", eye_contact: "Eye contact", engagement: "Presence", pace: "Speaking pace", filler: "Filler words", vocabulary: "Vocabulary", voice: "Voice delivery", gestures: "Gesture activity" };

export default function SessionReviewPage() {
  const [session, setSession] = useState<SavedSession | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    setSession(getSavedSessions().find((item) => String(item.id) === id) ?? null);
  }, []);
  if (!session) return <main className="p-8 text-white"><h1>Session unavailable</h1><Link href="/dashboard">Back to dashboard</Link></main>;
  const breakdown = session.score_breakdown as { scores?: Record<string, number | null>; contributions?: Record<string, number>; confidence?: number } | undefined;
  const metrics = session.metrics ?? {};
  const metric = (key: string) => typeof metrics[key] === "number" ? String(metrics[key]) : "Unavailable";
  return <main className="dashboard-page presentation-page"><div className="dashboard-shell">
    <Link href="/dashboard" className="text-teal-300">&lt;- Dashboard</Link>
    <section className="dashboard-hero"><div><p className="eyebrow">{session.mode} - {session.language}</p><h1>Session review</h1><p>{new Date(session.created_at).toLocaleString()}</p></div><div className="text-right"><span className="text-gray-400">Overall</span><strong className="block text-5xl text-teal-300">{session.overall_score === null ? "Unavailable" : Math.round(session.overall_score)}</strong></div></section>
    <section className="dashboard-panel-grid"><article className="bg-gray-900 rounded-2xl p-6"><h2 className="text-white font-semibold">Why this score?</h2><p className="text-gray-400 text-sm mt-2">{breakdown?.confidence ?? 0}% of weighted categories had data. Missing metrics are excluded, not treated as zero.</p><div className="mt-5 space-y-4">{Object.entries(breakdown?.scores ?? {}).map(([key, score]) => <div key={key} className="flex justify-between text-sm"><span className="text-gray-300">{labels[key] ?? key}</span><span className="text-teal-300">{score === null || score === undefined ? "Unavailable" : `${Math.round(score)}/100`} {breakdown?.contributions?.[key] !== undefined ? `(${breakdown.contributions[key]} pts)` : ""}</span></div>)}</div></article>
      <article className="bg-gray-900 rounded-2xl p-6"><h2 className="text-white font-semibold">Measured evidence</h2><div className="mt-4 grid grid-cols-2 gap-4 text-sm">{[["Words", session.word_count], ["WPM", session.words_per_minute], ["Filler rate", session.filler_rate === null || session.filler_rate === undefined ? null : `${session.filler_rate}/100 words`], ["Pauses", session.pause_count], ["Longest pause", session.longest_pause_seconds === null || session.longest_pause_seconds === undefined ? null : `${session.longest_pause_seconds}s`], ["Lexical diversity", session.lexical_diversity]].map(([label, value]) => <div key={String(label)}><span className="text-gray-500 block">{label}</span><span className="text-white">{value ?? "Unavailable"}</span></div>)}</div></article></section>
    <section className="bg-gray-900 rounded-2xl p-6 mt-6" dir={session.language === "ar" ? "rtl" : "ltr"}><h2 className="text-white font-semibold">Final transcript</h2><p className="text-gray-200 whitespace-pre-wrap mt-4">{session.transcript || "Transcript unavailable."}</p></section>
    <section className="bg-gray-900 rounded-2xl p-6 mt-6"><h2 className="text-white font-semibold">Session evidence</h2><p className="text-gray-400 text-sm mt-3">Word count: {metric("word_count")} - Filler occurrences: {metric("filler_count")} - Pause count: {metric("pause_count")}</p>{session.coaching_feedback && <p className="text-gray-200 whitespace-pre-wrap mt-4">{session.coaching_feedback}</p>}</section>
  </div></main>;
}