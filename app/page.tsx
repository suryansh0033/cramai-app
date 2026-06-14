"use client";

type Question = {
  question: string;
  section?: string;
  type?: string;
  marks?: number;
};

type Section = {
  id: number;
  type: string;
  count: number;
  marks: number;
};

import { useState, useEffect, useRef } from "react";

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

export default function Home() {
  const [syllabus, setSyllabus] = useState("");
  const [pyqText, setPyqText] = useState("");
  const [hours, setHours] = useState("2");
  const [examType, setExamType] = useState("Mixed");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paperText, setPaperText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const [mode, setMode] = useState<"important" | "paper">("important");

  const [sections, setSections] = useState<Section[]>([
    { id: 1, type: "MCQ", count: 10, marks: 1 },
  ]);
  const [nextId, setNextId] = useState(2);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setQuestions([]);
    setPaperText("");

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

      {/* ── Header ── */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black tracking-tight text-amber-400">CramAI</h1>
        <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto">
          Built for college students — Paste your syllabus, get the most important exam questions instantly.
        </p>
        <p className="text-gray-500 mt-3 text-sm text-center">
           Free to use • No login needed
        </p>
      </div>

      {/* ── Mode Toggle ── */}
      <div className="max-w-xl mx-auto mb-6 flex gap-3">
        <button
          onClick={() => { setMode("important"); setQuestions([]); setPaperText(""); setError(""); }}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 border ${
            mode === "important"
              ? "bg-amber-400 text-black border-amber-400"
              : "bg-transparent text-gray-400 border-white/10 hover:border-amber-400/50 hover:text-white"
          }`}
        >
          ⭐ Important Questions
        </button>
        <div className="flex-1 relative">
  <button
    onClick={() => { setMode("paper"); setQuestions([]); setPaperText(""); setError(""); }}
    className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 border ${
      mode === "paper"
        ? "bg-amber-400 text-black border-amber-400"
        : "bg-transparent text-gray-400 border-white/10 hover:border-amber-400/50 hover:text-white"
    }`}
  >
    📄 Question Paper
  </button>
</div>
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

          {/* Type */}
          <select
            value={sec.type}
            onChange={(e) => updateSection(sec.id, "type", e.target.value)}
            className="flex-1 bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          >
            {Object.keys(MARKS_OPTIONS).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Count */}
          <input
            type="number"
            min={1}
            max={30}
            value={sec.count}
            onChange={(e) => updateSection(sec.id, "count", e.target.value)}
            className="w-16 bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-2.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          />
          <span className="text-gray-600 text-xs">Qs</span>

          {/* Marks */}
          <select
            value={sec.marks}
            onChange={(e) => updateSection(sec.id, "marks", e.target.value)}
            className="w-20 bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          >
            {MARKS_OPTIONS[sec.type].map((m) => (
              <option key={m} value={m}>{m} mk</option>
            ))}
          </select>

          {/* Remove */}
          <button
            onClick={() => removeSection(sec.id)}
            className="text-gray-600 hover:text-red-400 text-lg leading-none transition-colors duration-200 px-1"
          >
            ×
          </button>
        </div>
      ))}
    </div>

    {/* Add Section + Total Marks */}
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
          <>
            <label className="block text-sm font-semibold text-gray-300 mt-5 mb-2">
              Previous Year Question Paper{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-600 transition"
              rows={4}
              placeholder="Paste last year's question paper here… CramAI will use it to predict more accurate questions."
              value={pyqText}
              onChange={(e) => setPyqText(e.target.value)}
            />
          </>
        )

        {/* ── QUESTIONS OUTPUT (both modes) ── */}
{questions.length > 0 && (
  <div className="max-w-xl mx-auto mt-10">
    <h2 className="text-xl font-bold text-amber-400 mb-5">
      {mode === "paper" ? "📄 Your Question Paper" : `📋 ${questionCount} Predicted Exam Questions`}
    </h2>

    {mode === "paper" ? (
      // Group by section label
      (() => {
        const grouped: Record<string, typeof questions> = {};
        questions.forEach((q) => {
          const sec = q.section || "A";
          if (!grouped[sec]) grouped[sec] = [];
          grouped[sec].push(q);
        });
        return Object.entries(grouped).map(([sec, qs]) => (
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
        ));
      })()
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

    <p className="text-center text-gray-600 text-xs mt-8 mb-4">
      Generated by CramAI · Good luck on your exam! 🍀
    </p>
  </div>
)}
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
        )

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
              <p
                key={loadingMsgIndex}
                className="text-white font-semibold text-sm animate-pulse"
              >
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

      {/* ── IMPORTANT QUESTIONS OUTPUT ── */}
      {questions.length > 0 && mode === "important" && (
        <div className="max-w-xl mx-auto mt-10">
          <h2 className="text-xl font-bold text-amber-400 mb-5">
            📋 {questionCount} Predicted Exam Question
          </h2>
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
          <p className="text-center text-gray-600 text-xs mt-8 mb-4">
            Generated by CramAI · Good luck on your exam! 🍀
          </p>
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

    </main>
  );
}