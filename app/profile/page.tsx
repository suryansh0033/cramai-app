"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

function Icon({ name }: { name: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#F5C518",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "mail")
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    );
  if (name === "plan")
    return (
      <svg {...props}>
        <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
      </svg>
    );
  if (name === "feedback")
    return (
      <svg {...props}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  return null;
}

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const initial = user?.firstName?.[0] || user?.fullName?.[0] || "S";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex flex-col items-center mb-10">
        {user?.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt="Profile"
            width={72}
            height={72}
            className="rounded-full mb-4 ring-2 ring-[#F5C518] ring-offset-4 ring-offset-[#0a0a0a]"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full mb-4 bg-[#1a1a1a] ring-2 ring-[#F5C518] ring-offset-4 ring-offset-[#0a0a0a] flex items-center justify-center text-2xl font-bold text-[#F5C518]">
            {initial}
          </div>
        )}
        <h1 className="text-lg font-bold">{user?.fullName || "Student"}</h1>
        <span className="mt-2 text-[11px] font-bold uppercase tracking-wider bg-[#F5C518]/10 text-[#F5C518] px-2.5 py-1 rounded-full">
          Free Plan
        </span>
      </div>

      {/* Account details card */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden mb-4">
        <div className="flex items-center gap-3 px-4 py-4">
          <Icon name="mail" />
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Email</p>
            <p className="text-sm text-white truncate">
              {user?.primaryEmailAddress?.emailAddress || "—"}
            </p>
          </div>
        </div>
        <div className="border-t border-white/5" />
        <div className="flex items-center gap-3 px-4 py-4">
          <Icon name="plan" />
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Plan</p>
            <p className="text-sm text-white">Free</p>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <a
        href="mailto:feedback@trycramai.me"
        className="flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-4 mb-8 hover:border-[#F5C518]/40 transition"
      >
        <Icon name="feedback" />
        <span className="text-sm text-gray-300">Send Feedback</span>
      </a>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-95"
      >
        Sign Out
      </button>
    </main>
  );
}