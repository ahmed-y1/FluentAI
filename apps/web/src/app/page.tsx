"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Language = "en" | "ar";

const copy = {
  en: {
    lang: "EN",
    direction: "ltr" as const,
    eyebrow: "Real-time intelligence for speakers",
    title: "Fluent AI",
    subtitle: "Transforming how speakers grow with objective, real-time intelligence that replaces guesswork with data-driven coaching.",
    explore: "Explore the system",
    engineLabel: "Core intelligence",
    engineTitle: "Two engines, one intelligence",
    engineIntro: "Computer vision reads the body. The language engine reads the voice. Together they replace subjective impressions with precise, data-driven coaching.",
    feedbackLabel: "Live feedback",
    feedbackTitle: "Live feedback & correction tools",
    feedbackIntro: "Real-time monitoring enables speakers to self-correct in the moment, not just after the presentation ends.",
    audioLabel: "Audio intelligence",
    audioTitle: "Speech-to-text & intelligent insights",
    audioIntro: "Every word is captured, transcribed, and evaluated, turning raw speech into a structured coaching signal.",
    behaviorLabel: "Behavioral tracking",
    behaviorTitle: "Camera-based behavioral tracking",
    behaviorIntro: "The system watches what words cannot capture: your physical presence, gaze, and expression.",
    analyticsLabel: "Post-presentation",
    analyticsTitle: "Post-presentation analytics",
    analyticsIntro: "Every session concludes with a clear, actionable scorecard built from objective performance pillars.",
    architectureLabel: "Under the hood",
    architectureTitle: "System architecture",
    architectureIntro: "A three-layer pipeline transforms raw sensor input into precise, actionable coaching in real time.",
    closeTitle: "From viewer to speaker.",
    closeText: "Turn every presentation into measurable growth. Put data-driven coaching behind your next talk.",
    tryNow: "Try a live session",
    home: "Home",
    progress: "Progress",
    session: "Live session",
  },
  ar: {
    lang: "العربية",
    direction: "rtl" as const,
    eyebrow: "ذكاء لحظي للمتحدثين",
    title: "Fluent AI",
    subtitle: "نغيّر طريقة تطور المتحدثين بذكاء لحظي وموضوعي يحوّل التخمين إلى تدريب قائم على البيانات.",
    explore: "اكتشف النظام",
    engineLabel: "الذكاء الأساسي",
    engineTitle: "محركان، وذكاء واحد",
    engineIntro: "تقرأ الرؤية الحاسوبية الجسد، ويقرأ محرك اللغة الصوت. معاً يقدمان تدريباً دقيقاً قائماً على البيانات.",
    feedbackLabel: "ملاحظات مباشرة",
    feedbackTitle: "أدوات الملاحظات والتصحيح المباشر",
    feedbackIntro: "تساعد المراقبة اللحظية المتحدثين على تصحيح أدائهم أثناء الحديث، لا بعد انتهائه فقط.",
    audioLabel: "ذكاء الصوت",
    audioTitle: "تحويل الكلام إلى نص ورؤى ذكية",
    audioIntro: "تُلتقط كل كلمة وتُفرّغ وتُقيّم لتحويل الكلام إلى إشارة تدريب واضحة.",
    behaviorLabel: "تتبع السلوك",
    behaviorTitle: "تتبع السلوك عبر الكاميرا",
    behaviorIntro: "يراقب النظام ما لا تستطيع الكلمات التقاطه: حضورك الجسدي، ونظرك، وتعبيرك.",
    analyticsLabel: "بعد العرض",
    analyticsTitle: "تحليلات ما بعد العرض",
    analyticsIntro: "تنتهي كل جلسة ببطاقة نتائج واضحة وقابلة للتنفيذ مبنية على مؤشرات موضوعية.",
    architectureLabel: "خلف الكواليس",
    architectureTitle: "بنية النظام",
    architectureIntro: "يحوّل خط أنابيب من ثلاث طبقات بيانات المستشعرات إلى تدريب دقيق وقابل للتنفيذ في الوقت الفعلي.",
    closeTitle: "من مشاهد إلى متحدث.",
    closeText: "حوّل كل عرض إلى نمو قابل للقياس، وضع التدريب القائم على البيانات خلف حديثك القادم.",
    tryNow: "ابدأ جلسة مباشرة",
    home: "الرئيسية",
    progress: "التقدم",
    session: "جلسة مباشرة",
  },
};

type Copy = typeof copy.en | typeof copy.ar;

const sections = [
  { key: "engines", label: "engineLabel", title: "engineTitle", intro: "engineIntro", cards: [["Computer Vision", "Non-verbal", "Delivers automated, real-time analysis of physical presence, posture, and eye contact."], ["NLP Engine", "Verbal", "Analyzes verbal delivery: fluency, vocabulary usage, and overall expression."]] },
  { key: "feedback", label: "feedbackLabel", title: "feedbackTitle", intro: "feedbackIntro", cards: [["Dynamic Timer", "Schedule", "Tracks pacing throughout the speech and surfaces visual alerts as time approaches."], ["Pacing Monitor", "WPM", "Measures words per minute and flags when delivery is too fast or too slow."], ["Fluency Detection", "Filler", "Identifies filler words so the speaker can pause, reset, and land the idea."], ["Vocal Variety", "Tone", "Detects monotone patterns and encourages a more expressive delivery."]] },
  { key: "audio", label: "audioLabel", title: "audioTitle", intro: "audioIntro", cards: [["Live Transcription", "Real-time", "Instant speech-to-text conversion evaluates clarity and professional vocabulary."], ["Smart Feedback", "Synonyms", "Suggests more impactful language and flags repetitive phrasing."], ["Sentiment Analysis", "Tone", "Detects emotional tone to align delivery with the presentation's intent."]] },
  { key: "behavior", label: "behaviorLabel", title: "behaviorTitle", intro: "behaviorIntro", cards: [["Pose Estimation", "Posture", "Monitors posture, gestures, and movement to support an authoritative presence."], ["Eye Contact Monitoring", "Gaze", "Tracks when the speaker looks toward or away from the camera."], ["Facial Expression", "Expression", "Measures expression stability as context, never as a simplistic engagement score."]] },
  { key: "analytics", label: "analyticsLabel", title: "analyticsTitle", intro: "analyticsIntro", cards: [["Visual Score · 50%", "50%", "Evaluates body language and eye contact quality."], ["Audio Score · 75%", "75%", "Assesses pacing, tone, and volume consistency."], ["Content Score · 33%", "33%", "Measures vocabulary strength and filler word reduction."], ["What to Change Report", "Top 3", "A focused summary of the priority improvements that matter most."], ["Progress Tracking", "Growth", "Compare performance across historical sessions to visualize growth over time."]] },
  { key: "architecture", label: "architectureLabel", title: "architectureTitle", intro: "architectureIntro", cards: [["Input Layer", "Capture", "Captures camera and microphone streams as the foundational source of sensory input."], ["Processing Layer", "Extract", "Extracts relevant behavioral signals using browser and backend analysis."], ["Output Layer", "Coach", "Turns validated metrics into personalized, actionable coaching advice."]] },
] as const;

function NarrativeSection({ section, t }: { section: typeof sections[number]; t: Copy }) {
  return (
    <section id={section.key} className="narrative-section">
      <div className="narrative-heading reveal-on-load">
        <span className="presentation-label">{t[section.label as keyof typeof t]}</span>
        <h2>{t[section.title as keyof typeof t]}</h2>
        <p>{t[section.intro as keyof typeof t]}</p>
      </div>
      <div className="narrative-cards">
        {section.cards.map(([title, stat, description], index) => (
          <article key={title} className={`narrative-card ${index % 2 ? "narrative-card-right" : ""}`}>
            <div className="card-accent" />
            <div className="narrative-card-top"><h3>{title}</h3><span>{stat}</span></div>
            <p>{description}</p>
            <small>● &nbsp; {stat} signal available</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Language>("en");
  const [pointer, setPointer] = useState({ x: 50, y: 40 });
  const t = copy[lang];

  useEffect(() => {
    document.documentElement.lang = t.lang === "العربية" ? "ar" : "en";
    document.documentElement.dir = t.direction;
    const onMove = (event: MouseEvent) => setPointer({ x: (event.clientX / window.innerWidth) * 100, y: (event.clientY / window.innerHeight) * 100 });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [t]);

  return (
    <main className="presentation-page" style={{ background: `radial-gradient(700px circle at ${pointer.x}% ${pointer.y}%, rgba(99,102,241,.16), transparent 60%), radial-gradient(650px circle at ${100 - pointer.x}% ${100 - pointer.y}%, rgba(129,140,248,.09), transparent 60%), #0B1124` }}>
      <header className="presentation-header">
        <Link href="/" className="presentation-brand">Fluent AI</Link>
        <nav className="presentation-nav" aria-label="Main navigation">
          <a href="#engines">{t.home}</a><Link href="/session">{t.session}</Link><Link href="/dashboard">{t.progress}</Link>
        </nav>
        <div className="presentation-actions"><button type="button" onClick={() => setLang(lang === "en" ? "ar" : "en")} aria-label="Toggle language">{t.lang}</button><span className="menu-glyph" aria-hidden="true">=</span></div>
      </header>

      <section className="presentation-hero">
        <div className="hero-orbit" aria-hidden="true">{Array.from({ length: 32 }).map((_, i) => <i key={i} style={{ transform: `rotate(${i * 11.25}deg)` }} />)}</div>
        <div className="presentation-hero-content">
          <span className="presentation-pill">✦ &nbsp; {t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
          <button type="button" className="presentation-cta" onClick={() => document.getElementById("engines")?.scrollIntoView({ behavior: "smooth" })}>{t.explore}<span>↓</span></button>
        </div>
        <span className="scroll-cue">↓</span>
      </section>

      <div className="narrative-content">{sections.map((section) => <NarrativeSection key={section.key} section={section} t={t} />)}</div>

      <section className="presentation-close">
        <span className="presentation-label">FLUENT AI</span><h2>{t.closeTitle}</h2><p>{t.closeText}</p>
        <Link href="/session" className="presentation-cta">{t.tryNow}<span>↗</span></Link>
      </section>
      <footer className="presentation-footer"><strong>Fluent AI</strong><span>Objective practice for better speaking.</span><Link href="/dashboard">{t.progress}</Link></footer>
    </main>
  );
}
