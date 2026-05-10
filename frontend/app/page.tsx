"use client";

import { useState } from "react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import StepIndicator from "@/components/StepIndicator";
import PitchForm from "@/components/PitchForm";
import DirectSubmitForm from "@/components/DirectSubmitForm";

type Mode = "analyze" | "direct" | "done";

export default function HomePage() {
  const [mode, setMode]       = useState<Mode>("analyze");
  const [reference, setRef]   = useState("");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        {mode !== "done" && <StepIndicator current={0} />}

        {/* Done state */}
        {mode === "done" && (
          <div className="text-center space-y-6 py-16">
            <div className="w-20 h-20 rounded-full bg-[rgba(0,204,136,0.12)] border border-[#00cc88]/30 flex items-center justify-center mx-auto text-4xl">✓</div>
            <div>
              <h2 className="text-2xl font-black text-[#fafafa] mb-2">Pitch submitted!</h2>
              <p className="text-[#888888] mb-4">The Starknet Foundation team will be in touch.</p>
              <div className="inline-flex items-center gap-2 bg-[#141414] border border-[#262626] rounded-lg px-5 py-3">
                <span className="text-[#888888] text-sm">Reference:</span>
                <span className="text-[#fa4300] font-mono font-bold">{reference}</span>
              </div>
            </div>
            <button onClick={() => { setMode("analyze"); setRef(""); }} className="text-[#888888] text-sm hover:text-[#fafafa] underline transition-colors">
              Submit another pitch
            </button>
          </div>
        )}

        {mode !== "done" && (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-[#fafafa] mb-3 tracking-tight">
                Get your idea <span className="text-[#fa4300]">analysed</span> or submit to us directly
              </h1>
              <p className="text-[#888888] text-lg max-w-xl mx-auto leading-relaxed">
                4 AI agents evaluate your pitch on business model, technical feasibility,
                market size, and more — grounded in STRK20 and Starknet documentation.
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-6 bg-[#141414] border border-[#262626] rounded-xl p-1">
              <button
                onClick={() => setMode("analyze")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === "analyze"
                    ? "bg-[#fa4300] text-[#0d0d0d]"
                    : "text-[#888888] hover:text-[#fafafa]"
                }`}
              >
                🤖 Analyze my pitch
              </button>
              <button
                onClick={() => setMode("direct")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === "direct"
                    ? "bg-[#fa4300] text-[#0d0d0d]"
                    : "text-[#888888] hover:text-[#fafafa]"
                }`}
              >
                ✈️ Submit directly
              </button>
            </div>

            {mode === "analyze" && (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                <PitchForm />
              </div>
            )}

            {mode === "direct" && (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                <p className="text-[#888888] text-sm mb-5 leading-relaxed">
                  Skip the AI analysis and send your idea straight to the Starknet Foundation team.
                  We read every submission.
                </p>
                <DirectSubmitForm onDone={(ref) => { setRef(ref); setMode("done"); }} />
              </div>
            )}

            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { icon: "🤖", label: "4 AI agents",     sub: "Business · Technical · Market · Jessie" },
                { icon: "📚", label: "RAG-grounded",    sub: "STRK20 whitepaper + Starknet docs" },
                { icon: "⚡", label: "~2 min analysis", sub: "Live status updates while you wait" },
              ].map(f => (
                <div key={f.label} className="bg-[#141414] border border-[#262626] rounded-xl p-4">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="text-[#fafafa] text-xs font-semibold">{f.label}</p>
                  <p className="text-[#616161] text-xs mt-1">{f.sub}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
