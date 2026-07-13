"use client";

import { useState, useEffect } from "react";

type PYQ = {
  _id: string;
  college: string;
  branch: string;
  subject: string;
  semester: number;
  year: number;
  fileUrl: string;
  fileType: string;
  uploaderName?: string;
};

export default function AdminPYQPage() {
  const [pending, setPending] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  function loadPending() {
    setLoading(true);
    setError("");
    fetch("/api/pyq/admin")
      .then((res) => {
        if (res.status === 401) throw new Error("Unauthorized — admin access only.");
        return res.json();
      })
      .then((data) => setPending(data.pending || []))
      .catch((e) => setError(e.message || "Failed to load pending uploads."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleReview(id: string, status: "approved" | "rejected") {
    setActioningId(id);
    try {
      const res = await fetch(`/api/pyq/admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Action failed.");

      setPending((prev) => prev.filter((item) => item._id !== id));
    } catch (e) {
      setError("Failed to update status. Please try again.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white px-4 py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold mb-1">PYQ Moderation</h1>
        <p className="text-gray-400 text-sm mb-8">
          {loading ? "Loading…" : `${pending.length} pending review`}
        </p>

        {error && (
          <p className="text-sm text-center font-medium text-red-400 mb-6">{error}</p>
        )}

        {!loading && pending.length === 0 && !error && (
          <p className="text-center text-gray-500 text-sm mt-10">Nothing pending — all clear.</p>
        )}

        <div className="flex flex-col gap-4">
          {pending.map((item) => (
            <div
              key={item._id}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold text-sm">{item.subject}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {item.college} · {item.branch} · Sem {item.semester} · {item.year}
                  </p>
                </div>
              </div>
                <a
              
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-amber-400 hover:text-amber-300 mb-4 transition"
              >
                View file →
              </a>

              <div className="flex gap-3">
                <button
                  onClick={() => handleReview(item._id, "approved")}
                  disabled={actioningId === item._id}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/30 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-95"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReview(item._id, "rejected")}
                  disabled={actioningId === item._id}
                  className="flex-1 border border-white/10 hover:border-red-400/50 text-gray-400 hover:text-red-400 font-bold py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-95"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}