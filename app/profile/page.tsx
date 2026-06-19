"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 pt-10 pb-24">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center mb-8">
        {user?.imageUrl && (
          <Image
            src={user.imageUrl}
            alt="Profile"
            width={80}
            height={80}
            className="rounded-full mb-4 border-2 border-[#F5C518]"
          />
        )}
        <h1 className="text-xl font-bold">{user?.fullName || "Student"}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {user?.primaryEmailAddress?.emailAddress}
        </p>
      </div>

      {/* Info Cards */}
      <div className="space-y-3 mb-8">
        <div className="bg-[#1a1a1a] rounded-xl px-4 py-4 flex justify-between items-center">
          <span className="text-gray-400 text-sm">Account</span>
          <span className="text-white text-sm font-medium">
            {user?.fullName || "—"}
          </span>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl px-4 py-4 flex justify-between items-center">
          <span className="text-gray-400 text-sm">Email</span>
          <span className="text-white text-sm font-medium">
            {user?.primaryEmailAddress?.emailAddress || "—"}
          </span>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl px-4 py-4 flex justify-between items-center">
          <span className="text-gray-400 text-sm">Plan</span>
          <span className="text-[#F5C518] text-sm font-medium">Free</span>
        </div>
      </div>

      {/* Feedback */}
      <div className="space-y-3 mb-8">
        <a
          href="mailto:feedback@trycramai.me"
          className="block bg-[#1a1a1a] rounded-xl px-4 py-4 text-center text-sm text-gray-400 hover:text-white transition"
        >
          <span>📩 Send Feedback</span>
        </a>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition"
      >
        Sign Out
      </button>
    </main>
  );
}