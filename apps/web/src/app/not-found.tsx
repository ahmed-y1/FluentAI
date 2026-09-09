import Link from "next/link";

export default function NotFound() {
    return (
        <main className="not-found-page">
            <div className="not-found-mark"><span className="brand-dot" /> FluentAI</div>
            <div className="not-found-content">
                <p className="eyebrow"><span className="live-dot" /> Signal lost</p>
                <h1>This page missed<br /><em>the cue.</em></h1>
                <p>The page you were looking for is not part of this session. Let&apos;s get you back somewhere useful.</p>
                <div className="not-found-actions">
                    <Link href="/" className="primary-button">Back home <span aria-hidden="true">-&gt;</span></Link>
                    <Link href="/session" className="text-link">Start a session <span aria-hidden="true">&#8594;</span></Link>
                </div>
            </div>
            <span className="not-found-code">404 / FLUENTAI</span>
        </main>
    );
}