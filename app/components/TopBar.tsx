"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function TopBar() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-black tracking-tight text-[#F5C518]">
          CramAI
        </Link>

        <div className="flex items-center gap-3">
          {isLoaded && isSignedIn ? (
            <>
              <button
                aria-label="Notifications"
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-[#F5C518] hover:bg-white/5 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>

              <Link href="/profile" aria-label="Profile">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.firstName || "Profile"}
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#F5C518] text-black text-xs font-bold flex items-center justify-center">
                    {(user?.firstName?.[0] || "U").toUpperCase()}
                  </div>
                )}
              </Link>
            </>
          ) : isLoaded ? (
            <Link
              href="/sign-in"
              className="text-xs font-semibold text-black bg-[#F5C518] hover:bg-[#F5C518]/90 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}