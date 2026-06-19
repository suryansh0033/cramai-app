import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import { ClerkProvider } from '@clerk/nextjs';
import { Suspense } from 'react';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CramAI — AI Exam Prep for College Students",
  description: "Paste your syllabus and get predicted exam questions instantly. Built for college students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#0a0a0a]">
          <TopBar />
          <div className="flex-1 pb-20">{children}</div>
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}