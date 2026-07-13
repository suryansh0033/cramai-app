"use client";

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import SearchDropdown from "../../components/SearchDropdown";
import { COLLEGES } from "../../../lib/colleges";
import { BRANCHES } from "../../../lib/branches";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function UploadPYQPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");

    if (!isSignedIn) {
      setError("Please sign in to upload a PYQ.");
      return;
    }

    if (!file || !college || !branch || !subject || !semester || !year) {
      setError("Please fill in all fields and select a file.");
      return;
    }

    setUploading(true);

    try {
      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("upload_preset", UPLOAD_PRESET!);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: "POST", body: cloudForm }
      );

      if (!cloudRes.ok) {
        throw new Error("Upload to Cloudinary failed.");
      }

      const cloudData = await cloudRes.json();
      const fileUrl = cloudData.secure_url;
      const fileType = file.type === "application/pdf" ? "pdf" : "image";

      const saveRes = await fetch("/api/pyq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college,
          branch,
          subject,
          semester: Number(semester),
          year: Number(year),
          fileUrl,
          fileType,
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save PYQ details.");
      }

      setSuccess(true);
      setTimeout(() => router.push("/pyq"), 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white px-4 py-10">
      <div className="max-w-xl mx-auto bg-[#1a1a1a] rounded-2xl p-6 shadow-xl border border-white/10">
        <h1 className="text-xl font-bold mb-1">Upload PYQ</h1>
        <p className="text-gray-400 text-sm mb-6">
          Your upload will be reviewed before it goes public.
        </p>

        {!isSignedIn && (
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3 mb-6">
            <p className="text-amber-400 text-sm font-medium">
              You'll need to sign in before submitting your upload.
            </p>
          </div>
        )}

        <label className="block text-sm font-semibold text-gray-300 mb-2">College</label>
        <div className="mb-4">
          <SearchDropdown
            options={COLLEGES}
            value={college}
            onChange={setCollege}
            placeholder="Start typing your college..."
          />
        </div>

        <label className="block text-sm font-semibold text-gray-300 mb-2">Branch</label>
        <div className="mb-4">
          <SearchDropdown
            options={BRANCHES}
            value={branch}
            onChange={setBranch}
            placeholder="e.g. ECE"
          />
        </div>

        <label className="block text-sm font-semibold text-gray-300 mb-2">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Digital Electronics"
          className="w-full bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-600 transition"
        />

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Semester</label>
            <input
              type="number"
              min={1}
              max={8}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Year</label>
            <input
              type="number"
              min={2015}
              max={2030}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
            />
          </div>
        </div>

        <label className="block text-sm font-semibold text-gray-300 mb-2">File</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-gray-400 mb-6 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-amber-400 file:text-black file:font-bold file:text-sm"
        />

        <button
          onClick={handleSubmit}
          disabled={uploading || !isSignedIn}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/30 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl text-base transition-all duration-200 active:scale-95"
        >
          {!isSignedIn ? "Sign in to Submit" : uploading ? "Uploading…" : "Submit for Review"}
        </button>

        {error && <p className="mt-4 text-sm text-center font-medium text-red-400">{error}</p>}
        {success && (
          <p className="mt-4 text-sm text-center font-medium text-amber-400">
            ✅ Uploaded! Redirecting…
          </p>
        )}
      </div>
    </main>
  );
}