import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fluent AI - Home",
};

export default function Home() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> Private practice, made visible</p>
          <h1>Speak with more <em>presence.</em></h1>
          <p className="hero-description">
            FluentAI watches the details you cannot feel in the moment, then turns them into one clear next step.
          </p>
          <div className="hero-actions">
            <Link href="/session" className="primary-button">Start a live session <span aria-hidden="true">-&gt;</span></Link>
            <Link href="/dashboard" className="text-link">View your progress <span aria-hidden="true">&#8594;</span></Link>
          </div>
          <div className="trust-row">
            <span>Camera-based feedback</span>
            <span className="trust-separator" />
            <span>Sessions saved privately</span>
          </div>
        </div>

        <div className="preview-wrap" aria-label="Example session insights">
          <div className="preview-card">
            <div className="preview-topline"><span>SESSION 04</span><span className="preview-status">ANALYSIS READY</span></div>
            <div className="preview-score-row">
              <div><p className="preview-label">Presence score</p><p className="preview-score">82<span>/100</span></p></div>
              <div className="score-ring"><span>82</span></div>
            </div>
            <div className="signal-list">
              <div className="signal-row"><span>Eye contact</span><div className="signal-track"><i style={{ width: "86%" }} /></div><strong>86%</strong></div>
              <div className="signal-row"><span>Posture</span><div className="signal-track"><i style={{ width: "74%" }} /></div><strong>74%</strong></div>
              <div className="signal-row"><span>Voice energy</span><div className="signal-track"><i style={{ width: "91%" }} /></div><strong>91%</strong></div>
            </div>
            <div className="coach-note"><span className="note-mark">+</span><div><p>Coach&apos;s note</p><strong>Let your strongest ideas land.</strong></div></div>
          </div>
          <div className="preview-caption"><span className="caption-line" /> Your practice, reflected back</div>
        </div>
      </section>

      <section className="steps-section">
        <div className="section-intro"><p className="eyebrow">A better feedback loop</p><h2>Small signals. Real progress.</h2></div>
        <div className="step-grid">
          <article className="step-item"><span className="step-number">01</span><h3>Show up</h3><p>Start a session and speak naturally. No script, no performance for the tool.</p></article>
          <article className="step-item"><span className="step-number">02</span><h3>Get the signal</h3><p>See the patterns behind your delivery: posture, eye contact, voice and pace.</p></article>
          <article className="step-item"><span className="step-number">03</span><h3>Try again</h3><p>Keep the useful feedback, leave the noise, and watch your confidence compound.</p></article>
        </div>
      </section>
    </div>
  );
}
