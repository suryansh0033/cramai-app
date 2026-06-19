"use client";

type Question = {
  question: string;
  section?: string;
  type?: string;
  marks?: number;
  importance?: string;
};

type Section = {
  id: number;
  type: string;
  count: number;
  marks: number;
};

import { useState, useEffect, useRef, Suspense } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const LOADING_MESSAGES = [
  "Analyzing your syllabus...",
  "Identifying important topics...",
  "Generating questions...",
  "Almost ready...",
];

const MARKS_OPTIONS: Record<string, number[]> = {
  "MCQ": [0.5, 1, 2],
  "Short Answer": [2, 3, 5],
  "Long Answer": [5, 10, 20],
  "Numerical": [2, 5, 10],
  "Coding": [5, 10, 20],
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardView({ firstName }: { firstName?: string | null }) {
  const greeting = getGreeting();
  return (
    <div className="max-w-xl mx-auto">
      {/* ── Greeting ── */}
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-bold text-white">
          {greeting}{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">Ready to ace your next exam?</p>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-xl font-bold text-amber-400">0</p>
          <p className="text-[11px] text-gray-500 mt-1">Questions Generated</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-xl font-bold text-amber-400">0</p>
          <p className="text-[11px] text-gray-500 mt-1">Papers Created</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-sm font-bold text-amber-400">Today</p>
          <p className="text-[11px] text-gray-500 mt-1">Last Used</p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <p className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</p>
      <div className="flex flex-col gap-3">
        <Link
          href="/?mode=important"
          className="flex items-center justify-between bg-[#1a1a1a] border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-white font-semibold text-sm">Predict Questions</p>
              <p className="text-gray-500 text-xs mt-0.5">Get the most likely exam questions</p>
            </div>
          </div>
          <span className="text-amber-400 text-lg">→</span>
        </Link>

        <Link
          href="/?mode=paper"
          className="flex items-center justify-between bg-[#1a1a1a] border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-white font-semibold text-sm">Generate Paper</p>
              <p className="text-gray-500 text-xs mt-0.5">Build a custom question paper</p>
            </div>
          </div>
          <span className="text-amber-400 text-lg">→</span>
        </Link>
      </div>

      <p className="text-center text-gray-600 text-xs mt-10">
        Stats are placeholders for now — real tracking comes with the database update.
      </p>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get("mode");
  const isLocked = urlMode === "important" || urlMode === "paper";
  const { user } = useUser();
  const [syllabus, setSyllabus] = useState("");
  const [pyqText, setPyqText] = useState("");
  const [hours, setHours] = useState("2");
  const [examType, setExamType] = useState("Mixed");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paperText, setPaperText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [mode, setMode] = useState<"important" | "paper">(
    searchParams.get("mode") === "paper" ? "paper" : "important"
  );
  const [sections, setSections] = useState<Section[]>([
    { id: 1, type: "MCQ", count: 10, marks: 1 },
  ]);
  const [nextId, setNextId] = useState(2);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [doneCards, setDoneCards] = useState<Set<number>>(new Set());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const completionCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) {
      setLoadingMsgIndex(0);
      intervalRef.current = setInterval(() => {
        setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  useEffect(() => {
    if (urlMode === "important" || urlMode === "paper") {
      setMode(urlMode);
      setQuestions([]);
      setPaperText("");
      setError("");
    }
  }, [urlMode]);

  function stopWithError(msg: string) {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setLoading(false);
    setError(msg);
  }

  const totalMarks = sections.reduce((sum, sec) => sum + sec.count * sec.marks, 0);

  function addSection() {
    setSections((prev) => [...prev, { id: nextId, type: "MCQ", count: 5, marks: 1 }]);
    setNextId((n) => n + 1);
  }

  function removeSection(id: number) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSection(id: number, field: keyof Section, value: string | number) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (field === "type") {
          const newMarks = MARKS_OPTIONS[value as string][0];
          return { ...s, type: value as string, marks: newMarks };
        }
        return { ...s, [field]: Number(value) };
      })
    );
  }

  function fillSample() {
    setSyllabus("Transistors and Biasing Circuits: BJT: Principle and operation of NPN transistor, configuration and characteristics (CB, CE, and CC), types of biasing circuit. Hybrid Parameters Introduction. Two port networks, hybrid model for CE, CC, CB configuration and their analysis using h-parameters, Miller theorem. FET: Principle of Operation and characteristics of JFET, biasing of FET, MOSFET and CMOS.");
    setHours("1");
    setExamType("Mixed");
    setError("");
  }

  function downloadPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CramAI — Predicted Exam Questions", margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Generated by trycramai.me", margin, y);
    y += 6;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    doc.setTextColor(0, 0, 0);

    if (mode === "paper") {
      const grouped: Record<string, Question[]> = {};
      questions.forEach((q) => {
        const sec = q.section || "A";
        if (!grouped[sec]) grouped[sec] = [];
        grouped[sec].push(q);
      });
      Object.entries(grouped).forEach(([sec, qs]) => {
        const sectionLabel = `Section ${sec} — ${qs[0]?.type} (${qs[0]?.marks} mark${qs[0]?.marks !== 1 ? "s" : ""} each)`;
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 120, 0);
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(sectionLabel, margin, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
        qs.forEach((item, index) => {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`Q${index + 1}.`, margin, y);
          doc.setFont("helvetica", "normal");
          const cleaned = item.question.replace(/\\n/g, "\n");
          const lines = doc.splitTextToSize(cleaned, maxWidth - 10);
          lines.forEach((line: string) => {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.text(line, margin + 8, y);
            y += 6;
          });
          y += 4;
        });
        y += 6;
      });
    } else {
      questions.forEach((item, index) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`Q${index + 1}.`, margin, y);
        doc.setFont("helvetica", "normal");
        const cleaned = item.question.replace(/\\n/g, "\n");
        const lines = doc.splitTextToSize(cleaned, maxWidth - 10);
        lines.forEach((line: string) => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(line, margin + 8, y);
          y += 6;
        });
        y += 4;
      });
    }

    doc.save("CramAI-Questions.pdf");
  }

  async function shareCompletion() {
    if (!completionCardRef.current) return;
    try {
      const canvas = await html2canvas(completionCardRef.current, {
        backgroundColor: "#1a1a1a",
        scale: 2,
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "CramAI-done.png";
      link.href = image;
      link.click();
    } catch (e) {
      console.error("Share failed:", e);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setQuestions([]);
    setPaperText("");
    setStudyMode(false);
    setCurrentCard(0);
    setDoneCards(new Set());

    if (syllabus.length > 3000) { setLoading(false); return; }

    if (mode === "paper" && sections.length === 0) {
      stopWithError("Please add at least one section before generating.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    timeoutRef.current = setTimeout(() => {
      stopWithError("⚠️ Taking too long — servers are busy. Please try again!");
    }, 25000);

    try {
      const body =
        mode === "paper"
          ? { syllabus, mode: "paper", sections }
          : { syllabus, pyqText, hours, examType, mode: "important" };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }

      const data = await response.json();

      if (JSON.stringify(data).includes("INVALID_SYLLABUS")) {
        stopWithError("⚠️ Please enter a valid syllabus with real topics. We couldn't detect any recognizable subject matter.");
        return;
      }

      if (!response.ok) {
        stopWithError(
          response.status === 429
            ? "⚡ Too many requests right now — try again in a few minutes!"
            : data.error || "Something went wrong. Please try again."
        );
        return;
      }

      setLoading(false);
      if (mode === "paper") {
        setPaperText(data.paperText || "");
        setQuestions(data.questions || []);
      } else {
        setQuestions(data.questions);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        stopWithError("Network error. Please check your connection and try again.");
      }
    }
  }

  const questionCount = hours === "1" ? 10 : 20;

  const groupedPaperQuestions = questions.reduce((acc, q) => {
    const sec = q.section || "A";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white px-4 py-10 font-sans">

      {!isLocked ? (
        <DashboardView firstName={user?.firstName} />
      ) : (
        <>
          {/* ── Tagline ── */}
          <div className="text-center mb-8 pt-2">
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Built for college students — Paste your syllabus, get the most important exam questions instantly.
            </p>
            <p className="text-gray-500 mt-3 text-sm">
              
            </p>
          </div>

          {/* ── Input Card ── */}
          <div className="max-w-xl mx-auto bg-[#1a1a1a] rounded-2xl p-6 shadow-xl border border-white/10">

            <label className="block text-sm font-semibold text-gray-300 mb-2">Your Syllabus</label>
            <textarea
              className="w-full bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-600 transition"
              rows={8}
              placeholder="Paste your syllabus here… e.g. Unit 1: Thermodynamics, Unit 2: Fluid Mechanics…"
              value={syllabus}
              onChange={(e) => { setSyllabus(e.target.value); setError(""); }}
            />

            <div className="flex justify-between items-center mt-1">
              <button
                onClick={fillSample}
                className="text-xs text-amber-400/60 hover:text-amber-400 transition-colors duration-200"
              >
                Try a sample syllabus →
              </button>
              <p className={`text-xs ${syllabus.length > 3000 ? "text-red-400" : "text-gray-500"}`}>
                {syllabus.length} / 3000 characters
              </p>
            </div>

            {/* ── QUESTION PAPER BUILDER ── */}
            {mode === "paper" && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-300 mb-4">Build Your Question Paper</p>
                <div className="flex flex-col gap-3">
                  {sections.map((sec) => (
                    <div key={sec.id} className="flex gap-2 items-center">
                      <select
                        value={sec.type}
                        onChange={(e) => updateSection(sec.id, "type", e.target.value)}
                        className="flex-1 bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                      >
                        {Object.keys(MARKS_OPTIONS).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={sec.count}
                        onChange={(e) => updateSection(sec.id, "count", e.target.value)}
                        className="w-16 bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-2.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                      />
                      <span className="text-gray-600 text-xs">Qs</span>
                      <select
                        value={sec.marks}
                        onChange={(e) => updateSection(sec.id, "marks", e.target.value)}
                        className="w-20 bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                      >
                        {MARKS_OPTIONS[sec.type].map((m) => (
                          <option key={m} value={m}>{m} mk</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeSection(sec.id)}
                        className="text-gray-600 hover:text-red-400 text-lg leading-none transition-colors duration-200 px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={addSection}
                    className="text-xs text-amber-400/70 hover:text-amber-400 border border-amber-400/30 hover:border-amber-400 rounded-lg px-3 py-1.5 transition-all duration-200"
                  >
                    + Add Section
                  </button>
                  <p className="text-xs text-gray-400">
                    Total Marks: <span className="text-amber-400 font-bold">{totalMarks}</span>
                  </p>
                </div>
              </div>
            )}

            {/* ── IMPORTANT QUESTIONS OPTIONS ── */}
            {mode === "important" && (
              <>
                <label className="block text-sm font-semibold text-gray-300 mt-5 mb-2">Hours Left Before Exam</label>
                <select
                  className="w-full bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                >
                  <option value="1">1 Hour — Focus on only the most likely questions</option>
                  <option value="2">2 Hours — Key topics covered</option>
                  <option value="4">4 Hours — Broad coverage</option>
                  <option value="6">6 Hours — Detailed preparation</option>
                </select>

                <label className="block text-sm font-semibold text-gray-300 mt-5 mb-2">Exam Type</label>
                <select
                  className="w-full bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                >
                  <option value="Mixed">Mixed — variety of question types</option>
                  <option value="Coding questions only">Coding questions only — problem + expected output</option>
                  <option value="Short answer">Short answer — 2 to 3 lines</option>
                  <option value="Subjective">Subjective — detailed answers</option>
                  <option value="Numericals only">Numericals only — step by step calculations</option>
                </select>
              </>
            )}

            {/* ── Generate Button ── */}
            <button
              onClick={handleGenerate}
              disabled={loading || syllabus.trim() === "" || syllabus.length > 3000}
              className="mt-6 w-full bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/30 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl text-base transition-all duration-200 active:scale-95"
            >
              {loading ? "Generating…" : "Generate Exam Questions"}
            </button>

            {/* ── Error message ── */}
            {error && (
              <p className={`mt-4 text-sm text-center font-medium ${
                error.startsWith("⚡") ? "text-amber-400" : "text-red-400"
              }`}>
                {error}
              </p>
            )}
          </div>

          {/* ── Loading State ── */}
          {loading && (
            <div className="max-w-xl mx-auto mt-10">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl px-6 py-8 flex flex-col items-center gap-5">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
                </div>
                <div className="text-center">
                  <p key={loadingMsgIndex} className="text-white font-semibold text-sm animate-pulse">
                    {LOADING_MESSAGES[loadingMsgIndex]}
                  </p>
                  <p className="text-gray-600 text-xs mt-2">This usually takes 5–10 seconds</p>
                </div>
                <div className="flex gap-2">
                  {LOADING_MESSAGES.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-500 ${
                        i === loadingMsgIndex
                          ? "bg-amber-400 scale-125"
                          : i < loadingMsgIndex
                          ? "bg-amber-400/40"
                          : "bg-white/15"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── QUESTIONS OUTPUT (both modes) ── */}
          {questions.length > 0 && (
            <div className="max-w-xl mx-auto mt-10">
              <h2 className="text-xl font-bold text-amber-400 mb-5">
                {mode === "paper" ? "📄 Your Question Paper" : `📋 ${questionCount} Predicted Exam Questions`}
              </h2>

              {mode === "paper" ? (
                Object.entries(groupedPaperQuestions).map(([sec, qs]) => (
                  <div key={sec} className="mb-8">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                      Section {sec} · {qs[0]?.type} · {qs[0]?.marks} mark{qs[0]?.marks !== 1 ? "s" : ""} each
                    </p>
                    <div className="flex flex-col gap-4">
                      {qs.map((item, index) => (
                        <div key={index} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 shadow-md">
                          <p className="text-sm font-bold text-amber-400 mb-1">Q{index + 1}.</p>
                          <p className="text-white text-sm font-medium leading-relaxed whitespace-pre-line">
                            {item.question.replace(/\\n/g, "\n")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-4">
                  {questions.map((item, index) => (
                    <div key={index} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 shadow-md">
                      <p className="text-sm font-bold text-amber-400 mb-1">Q{index + 1}.</p>
                      <p className="text-white text-sm font-medium leading-relaxed whitespace-pre-line">
                        {item.question.replace(/\\n/g, "\n")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={downloadPDF}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 transition-all duration-200 active:scale-95"
                >
                  ⬇ Download as PDF
                </button>
                <button
                  onClick={() => { setStudyMode(true); setCurrentCard(0); setDoneCards(new Set()); }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-amber-400/10 border border-amber-400/40 text-amber-400 hover:bg-amber-400/20 transition-all duration-200 active:scale-95"
                >
                  📚 Study Mode
                </button>
              </div>

              <p className="text-center text-gray-600 text-xs mt-8 mb-4">
                Generated by CramAI · Good luck on your exam! 🍀
              </p>
            </div>
          )}

          {/* ── STUDY MODE ── */}
          {studyMode && questions.length > 0 && (
            <div className="max-w-xl mx-auto mt-10">
              <button
                onClick={() => setStudyMode(false)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4"
              >
                ← Back to Questions
              </button>

              {currentCard < questions.length ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(doneCards.size / questions.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {doneCards.size} / {questions.length} done
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-2 text-center">
                    Question {currentCard + 1} of {questions.length}
                  </p>

                  <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-xl min-h-[200px] flex flex-col justify-between">
                    <div>
                      {questions[currentCard]?.importance && (
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 ${
                          questions[currentCard].importance === "High"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : questions[currentCard].importance === "Medium"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}>
                          {questions[currentCard].importance === "High" ? "🔴 High Priority" :
                           questions[currentCard].importance === "Medium" ? "🟡 Medium Priority" :
                           "⚪ Low Priority"}
                        </span>
                      )}
                      <p className="text-white text-sm font-medium leading-relaxed whitespace-pre-line mt-2">
                        {questions[currentCard]?.question?.replace(/\\n/g, "\n")}
                      </p>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setCurrentCard((c) => Math.max(0, c - 1))}
                        disabled={currentCard === 0}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-gray-400 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => {
                          setDoneCards((prev) => new Set(prev).add(currentCard));
                          if (currentCard < questions.length - 1) {
                            setCurrentCard((c) => c + 1);
                          } else {
                            setCurrentCard(questions.length);
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-amber-400 hover:bg-amber-300 text-black transition-all active:scale-95"
                      >
                        {doneCards.has(currentCard) ? "Next →" : "✓ Mark Done"}
                      </button>
                      <button
                        onClick={() => setCurrentCard((c) => Math.min(questions.length - 1, c + 1))}
                        disabled={currentCard === questions.length - 1}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-gray-400 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
                    {questions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentCard(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          i === currentCard
                            ? "bg-amber-400 scale-125"
                            : doneCards.has(i)
                            ? "bg-amber-400/40"
                            : "bg-white/15"
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div
                    ref={completionCardRef}
                    className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 text-center"
                  >
                    <p className="text-4xl mb-4">🎉</p>
                    <h3 className="text-xl font-bold text-amber-400 mb-2">You're done!</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      You reviewed all {questions.length} questions.
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-gray-500 mb-4">
                      <span>✅ {doneCards.size} marked done</span>
                      <span>📚 Powered by CramAI</span>
                      <span>🌐 trycramai.me</span>
                    </div>
                    <p className="text-amber-400 font-bold text-sm">Good luck on your exam! 🍀</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setCurrentCard(0); setDoneCards(new Set()); }}
                      className="flex-1 py-3 rounded-xl font-bold text-sm border border-white/10 text-gray-400 hover:border-white/30 transition-all active:scale-95"
                    >
                      🔄 Start Over
                    </button>
                    <button
                      onClick={shareCompletion}
                      className="flex-1 py-3 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-black transition-all active:scale-95"
                    >
                      📸 Save Card
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Feedback Button ── */}
          <div className="text-center mt-10 mb-6">
            <a
              href="mailto:exams.cramai@gmail.com?subject=CramAI Feedback"
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors duration-200"
            >
              💬 Send Feedback
            </a>
          </div>
        </>
      )}

    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <HomeContent />
    </Suspense>
  );
}