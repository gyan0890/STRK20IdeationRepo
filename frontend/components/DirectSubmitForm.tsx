"use client";

import { useRef, useState } from "react";
import { submitDirect } from "@/lib/api";
import type { ContactType } from "@/lib/types";

const CONTACT_OPTIONS: { value: ContactType; label: string; placeholder: string }[] = [
  { value: "email",    label: "📧 Email",    placeholder: "you@example.com" },
  { value: "telegram", label: "✈️ Telegram", placeholder: "@yourhandle" },
  { value: "other",    label: "💬 Other",    placeholder: "LinkedIn, phone, etc." },
];

const ACCEPTED = ".pdf,.ppt,.pptx";

export default function DirectSubmitForm({ onDone }: { onDone: (ref: string) => void }) {
  const [name,        setName]        = useState("");
  const [pitchText,   setPitchText]   = useState("");
  const [file,        setFile]        = useState<File | null>(null);
  const [contactType, setContactType] = useState<ContactType>("email");
  const [contactVal,  setContactVal]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const placeholder = CONTACT_OPTIONS.find(o => o.value === contactType)?.placeholder ?? "";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const clearFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!pitchText.trim() && !file) { setError("Please add a pitch description or upload a file."); return; }
    if (!contactVal.trim()) { setError("Please enter a contact method."); return; }

    setLoading(true);
    setError("");
    try {
      const res = await submitDirect({
        name: name.trim(),
        pitch_text: pitchText.trim(),
        contact_type: contactType,
        contact_value: contactVal.trim(),
        file,
      });
      onDone(res.reference);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-[#888888] mb-1.5">Your name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name"
          className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-4 py-3 text-[#fafafa] placeholder-[#616161] focus:outline-none focus:border-[#fa4300]/40 text-sm transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs text-[#888888] mb-1.5">Your idea or pitch</label>
        <textarea
          value={pitchText}
          onChange={e => setPitchText(e.target.value)}
          placeholder="Describe your project — what it does, who it's for, why Starknet…"
          rows={5}
          className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-4 py-3 text-[#fafafa] placeholder-[#616161] focus:outline-none focus:border-[#fa4300]/40 text-sm transition-colors resize-none"
        />
      </div>

      {/* File upload */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-[#262626]" />
          <span className="text-[#616161] text-xs">or upload a deck</span>
          <div className="flex-1 h-px bg-[#262626]" />
        </div>

        {file ? (
          <div className="flex items-center gap-3 bg-[#0d0d0d] border border-[#fa4300]/30 rounded-lg px-4 py-3">
            <span className="text-sm">📎</span>
            <span className="text-[#fafafa] text-sm truncate flex-1">{file.name}</span>
            <button
              onClick={clearFile}
              className="text-[#616161] hover:text-[#ff4444] text-xs transition-colors ml-auto"
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 bg-[#0d0d0d] border border-[#262626] border-dashed rounded-lg px-4 py-4 cursor-pointer hover:border-[#fa4300]/40 transition-colors group">
            <span className="text-xl">📄</span>
            <div>
              <p className="text-[#888888] text-sm group-hover:text-[#fafafa] transition-colors">
                Click to upload PDF, PPT, or PPTX
              </p>
              <p className="text-[#616161] text-xs mt-0.5">Max 20 MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFile}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div>
        <label className="block text-xs text-[#888888] mb-1.5">Best way to contact you</label>
        <div className="flex gap-2 mb-3">
          {CONTACT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setContactType(opt.value); setContactVal(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                contactType === opt.value
                  ? "bg-[rgba(200,255,0,0.12)] border border-[#fa4300]/50 text-[#fa4300]"
                  : "bg-[#0d0d0d] border border-[#262626] text-[#888888] hover:border-[#333333]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          value={contactVal}
          onChange={e => setContactVal(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-4 py-3 text-[#fafafa] placeholder-[#616161] focus:outline-none focus:border-[#fa4300]/40 text-sm transition-colors font-mono"
        />
      </div>

      {error && <p className="text-[#ff4444] text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#fa4300] text-[#0d0d0d] font-bold py-4 rounded-xl hover:bg-[#fb5a17] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? "Sending…" : "Send to Starknet Foundation →"}
      </button>
    </div>
  );
}
