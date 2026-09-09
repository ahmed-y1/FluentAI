import * as tf from '@tensorflow/tfjs';
// Import the cpu backend specifically
import '@tensorflow/tfjs-backend-cpu';

// Perform the setBackend call outside the component render cycle
tf.setBackend('cpu');

import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FluentAI | Practice with presence",
  description: "A private AI speaking coach for clearer, calmer practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="site-header">
          <Link href="/" className="brand-mark" aria-label="FluentAI home">
            <span className="brand-dot" aria-hidden="true" />
            FluentAI
          </Link>
          <nav className="tab-nav" aria-label="Main navigation">
            <Link href="/" className="nav-tab">Home</Link>
            <Link href="/session" className="nav-tab">Live session</Link>
            <Link href="/dashboard" className="nav-tab">Progress</Link>
          </nav>
          <Link href="/session" className="header-action">Start practicing <span aria-hidden="true">-&gt;</span></Link>
        </header>
        {children}
      </body>
    </html>
  );
}
