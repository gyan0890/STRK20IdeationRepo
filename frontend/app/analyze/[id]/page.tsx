"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import StepIndicator from "@/components/StepIndicator";
import AgentProgress from "@/components/AgentProgress";
import ScoreDashboard from "@/components/ScoreDashboard";
import DirectSubmitForm from "@/components/DirectSubmitForm";
import { getPitchStatus, getPitchResult } from "@/lib/api";
import type { PitchStatusResponse, PitchResultResponse, AgentId, AgentStatusItem } from "@/lib/types";

type Step = "analyzing" | "results" | "submit" | "done";

const DEFAULT_AGENTS: Record<AgentId, AgentStatusItem> = {
  colleague: { status: "pending", score: null },
  business:  { status: "pending", score: null },
  technical: { status: "pending", score: null },
  market:    { status: "pending", score: null },
};

export default function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [step, setStep] = useState<Step>("analyzing");
  const [agents, setAgents] = useState<Record<AgentId, AgentStatusItem>>(DEFAULT_AGENTS);
  const [result, setResult] = useState<PitchResultResponse | null>(null);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const poll = useCallback(async () => {
    try {
      const status: PitchStatusResponse = await getPitchStatus(id);
      setAgents(status.agents);

      if (status.status === "completed") {
        const r = await getPitchResult(id);
        setResult(r);
        setStep("results");
      } else if (status.status === "failed") {
        setError("Analysis failed. Please try again.");
      }
    } catch {
      setError("Could not reach the analysis server.");
    }
  }, [id]);

  useEffect(() => {
    if (step !== "analyzing") return;
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [poll, step]);

  const stepIndex = step === "analyzing" ? 1 : step === "results" ? 2 : step === "submit" ? 3 : 3;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <StepIndicator current={stepIndex} />

        {step === "analyzing" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#fafafa] mb-2">Analyzing your pitch</h2>
              <p className="text-[#888888]">4 AI agents are evaluating your submission in real time</p>
              <p className="text-[#616161] text-xs mt-2 font-mono">{id}</p>
            </div>
            <AgentProgress agents={agents} />
            {error && (
              <div className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-xl p-4 text-[#ff4444] text-sm text-center">
                {error}
                <button onClick={() => router.push("/")} className="block mx-auto mt-2 text-xs underline">
                  Start over
                </button>
              </div>
            )}
          </div>
        )}

        {step === "results" && result && (
          <div className="space-y-6">
            <ScoreDashboard result={result} />
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center space-y-3">
              <p className="text-[#888888] text-sm">Like what you see? Send your pitch directly to the Starknet Foundation team.</p>
              <button
                onClick={() => setStep("submit")}
                className="bg-[#fa4300] text-[#0d0d0d] font-bold px-10 py-4 rounded-xl hover:bg-[#fb5a17] active:scale-[0.98] transition-all text-sm w-full sm:w-auto"
              >
                Submit to Starknet Foundation →
              </button>
              <p className="text-[#616161] text-xs">
                We read every submission. Highly-scored pitches get a follow-up.
              </p>
            </div>
          </div>
        )}

        {step === "submit" && result && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-black text-[#fafafa] mb-2">Send your pitch</h2>
              <p className="text-[#888888]">Your pitch scored <strong className="text-[#fa4300]">{result.overall_score}/10</strong>. Share your deck or description with the team.</p>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <DirectSubmitForm onDone={(ref) => { setReference(ref); setStep("done"); }} />
            </div>
            <div className="text-center">
              <button onClick={() => setStep("results")} className="text-[#616161] text-sm hover:text-[#888888] underline transition-colors">
                ← Back to results
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-6 py-12">
            <div className="w-20 h-20 rounded-full bg-[rgba(0,204,136,0.12)] border border-[#00cc88]/30 flex items-center justify-center mx-auto text-4xl">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#fafafa] mb-2">Pitch submitted!</h2>
              <p className="text-[#888888] mb-4">We'll reach out via your preferred contact. Reference this ID when you hear from us.</p>
              <div className="inline-flex items-center gap-2 bg-[#141414] border border-[#262626] rounded-lg px-5 py-3">
                <span className="text-[#888888] text-sm">Reference:</span>
                <span className="text-[#fa4300] font-mono font-bold">{reference}</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-[#888888] text-sm hover:text-[#fafafa] underline transition-colors"
            >
              Submit another pitch
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
