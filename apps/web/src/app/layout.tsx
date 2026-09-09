import * as tf from '@tensorflow/tfjs';
// Import the cpu backend specifically
import '@tensorflow/tfjs-backend-cpu';

// Perform the setBackend call outside the component render cycle
tf.setBackend('cpu');

import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import AppHeader from "../components/AppHeader";
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
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
