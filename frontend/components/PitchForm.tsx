"use client";

import { useState, useRef, useCallback } from "react";
import { submitPitch } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function PitchForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    if (!allowed.includes(f.type)) { setError("Only PDF or PPTX files are supported."); return; }
    setFile(f); setError("");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const toBase64 = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const handleSubmit = async () => {
    if (!text.trim() && !file) { setError("Enter a pitch description or upload a file."); return; }
    setLoading(true); setError("");
    try {
      let payload: Parameters<typeof submitPitch>[0] = {};
      if (file) {
        payload = {
          file_base64: await toBase64(file),
          file_type: file.type.includes("pdf") ? "pdf" : "pptx",
        };
      } else {
        payload = { pitch_text: text.trim() };
      }
      const { pitch_id } = await submitPitch(payload);
      router.push(`/analyze/${pitch_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Text input */}
      <div>
        <label className="block text-sm text-[#888888] mb-2">Pitch description</label>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); if (file) setFile(null); }}
          placeholder="Describe your project idea, business model, target market, and technical approach..."
          rows={8}
          className="w-full bg-[#141414] border border-[#262626] rounded-xl p-4 text-[#fafafa] placeholder-[#616161] focus:outline-none focus:border-[#fa4300]/40 resize-none transition-colors text-sm leading-relaxed"
        />
      </div>

      {/* File drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging ? "border-[#fa4300] bg-[rgba(200,255,0,0.06)]" :
          file      ? "border-[#fa4300]/40 bg-[rgba(200,255,0,0.04)]" :
                      "border-[#262626] hover:border-[#333333]"
        }`}
      >
        <input ref={inputRef} type="file" accept=".pdf,.pptx" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <span className="text-[#fa4300] text-lg">📎</span>
            <div className="text-left">
              <p className="text-[#fafafa] text-sm font-medium">{file.name}</p>
              <p className="text-[#888888] text-xs">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setFile(null); }}
              className="ml-auto text-[#616161] hover:text-[#ff4444] text-lg transition-colors"
            >×</button>
          </div>
        ) : (
          <div>
            <p className="text-[#888888] text-sm">Drop PDF or PPTX here, or <span className="text-[#fa4300]">browse</span></p>
            <p className="text-[#616161] text-xs mt-1">Pitch deck or document — max 20 MB</p>
          </div>
        )}
      </div>

      {error && <p className="text-[#ff4444] text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#fa4300] text-[#0d0d0d] font-bold py-4 rounded-xl hover:bg-[#fb5a17] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
      >
        {loading ? "Submitting…" : "Analyze Pitch →"}
      </button>
    </div>
  );
}
