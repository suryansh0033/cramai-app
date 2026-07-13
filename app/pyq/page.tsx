"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchDropdown from "../components/SearchDropdown";
import { COLLEGES } from "../../lib/colleges";
import { BRANCHES } from "../../lib/branches";

type PYQ = {
  _id: string;
  college: string;
  branch: string;
  subject: string;
  semester: number;
  year: number;
  fileUrl: string;
  fileType: string;
};

export default function BrowsePYQPage() {
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (college) params.set("college", college);
    if (branch) params.set("branch", branch);
    if (subject) params.set("subject", subject);

    fetch(`/api/pyq?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setPyqs(data.results || []))
      .catch((e) => console.error("PYQ fetch failed:", e))
      .finally(() => setLoading(false));
  }, [college, branch, subject]);

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold">Previous Year Questions</h1>
          <Link
            href="/pyq/upload"
            className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
          >
            Upload PYQ
          </Link>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 mb-8">
          <SearchDropdown
            options={COLLEGES}
            value={college}
            onChange={setCollege}
            placeholder="College"
          />
          <SearchDropdown
            options={BRANCHES}
            value={branch}
            onChange={setBranch}
            placeholder="Branch (CSE, ECE, Civil...)"
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full bg-[#1a1a1a] text-white border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-600 transition"
          />
        </div>

        {/* ── Results ── */}
        {loading ? (
          <p className="text-center text-gray-500 text-sm mt-10">Loading…</p>
        ) : pyqs.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-10">
            No PYQs found. Try adjusting your filters.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {pyqs.map((item) => (
              <div
                key={item._id}
                className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 shadow-md"
              >
                <h3 className="text-white font-semibold text-sm mb-1">{item.subject}</h3>
                <p className="text-gray-500 text-xs mb-4">
                  {item.branch} · Sem {item.semester} · {item.year}
                </p>
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2.5 rounded-xl font-bold text-sm border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 transition-all duration-200 active:scale-95"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}