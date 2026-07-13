"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { key: "home", label: "Dashboard", href: "/" },
  { key: "questions", label: "Questions", href: "/?mode=important" },
  { key: "paper", label: "Paper", href: "/?mode=paper" },
  { key: "pyq", label: "PYQs", href: "/pyq" },
  { key: "notifications", label: "Alerts", href: "/notifications" },
  { key: "profile", label: "Profile", href: "/profile" },
];

function Icon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "#F5C518" : "#9ca3af";
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "home")
    return (
      <svg {...props}>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    );
  if (name === "questions")
    return (
      <svg {...props}>
        <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />
      </svg>
    );
  if (name === "paper")
    return (
      <svg {...props}>
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </svg>
    );
  if (name === "pyq")
    return (
      <svg {...props}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  if (name === "notifications")
    return (
      <svg {...props}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  if (name === "profile")
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    );
  return null;
}

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  function isActive(key: string) {
    if (key === "notifications") return pathname === "/notifications";
    if (key === "profile") return pathname === "/profile";
    if (key === "pyq") return pathname.startsWith("/pyq");
    if (pathname !== "/") return false;
    if (key === "questions") return mode === "important";
    if (key === "paper") return mode === "paper";
    if (key === "home") return mode !== "important" && mode !== "paper";
    return false;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-t border-white/10">
      <div className="max-w-xl mx-auto px-1 h-16 flex items-center justify-between">
        {TABS.map((tab) => {
          const active = isActive(tab.key);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
            >
              <Icon name={tab.key} active={active} />
              <span className={`text-[10px] font-semibold ${active ? "text-[#F5C518]" : "text-gray-500"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}