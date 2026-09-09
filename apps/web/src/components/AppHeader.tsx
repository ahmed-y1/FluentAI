"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
    const pathname = usePathname();
    if (pathname === "/" || pathname === "") return null;

    return (
        <header className="presentation-header app-header">
            <Link href="/" className="presentation-brand">Fluent AI</Link>
            <nav className="presentation-nav" aria-label="Main navigation">
                <Link href="/">Home</Link>
                <Link href="/session">Live session</Link>
                <Link href="/dashboard">Progress</Link>
            </nav>
            <Link href="/session" className="app-header-cta">Start a session <span aria-hidden="true">↗</span></Link>
        </header>
    );
}
