"use client";

import { useState } from "react";
import { submitContact } from "@/lib/api";
import type { ContactType } from "@/lib/types";

const CONTACT_OPTIONS: { value: ContactType; label: string; placeholder: string }[] = [
  { value: "email",    label: "📧 Email",    placeholder: "you@example.com" },
  { value: "telegram", label: "✈️ Telegram", placeholder: "@yourhandle" },
  { value: "other",    label: "💬 Other",    placeholder: "LinkedIn, phone, etc." },
];

export default function SubmitForm({ pitchId, onDone }: { pitchId: string; onDone: (ref: string) => void }) {
  const [name,        setName]        = useState("");
  const [contactType, setContactType] = useState<ContactType>("email");
  const [contactVal,  setContactVal]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const placeholder = CONTACT_OPTIONS.find(o => o.value === contactType)?.placeholder ?? "";

  const handleSubmit = async () => {
    if (!name.trim() || !contactVal.trim()) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      const res = await submitContact(pitchId, { name: name.trim(), contact_type: contactType, contact_value: contactVal.trim() });
      onDone(res.reference);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-5 max-w-lg mx-auto">
      <h3 className="text-[#fafafa] font-semibold text-lg">Submit your pitch</h3>
      <p className="text-[#888888] text-sm">Share your contact so the Starknet Foundation team can follow up.</p>

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
        <label className="block text-xs text-[#888888] mb-1.5">Best way to contact you</label>
        <div className="flex gap-2 mb-3">
          {CONTACT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setContactType(opt.value); setContactVal(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
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
        {loading ? "Submitting…" : "Submit Pitch →"}
      </button>
    </div>
  );
}
