"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchDropdown({ options, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(opt: string) {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-[#0f0f0f] text-white border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-600 transition"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl">
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-amber-400 transition"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}