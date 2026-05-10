"use client";

import { useEffect, useState } from "react";
import type { PitchResultResponse } from "@/lib/types";

const PARAM_LABELS: Record<string, string> = {
  business_model:       "Business Model",
  technical_feasibility:"Technical Feasibility",
  revenue_profit:       "Revenue & Profit",
  market_size:          "Market Size",
  team_execution:       "Team & Execution",
  innovation:           "Innovation",
};

const AGENT_LABELS: Record<string, string> = {
  colleague: "Jessie",
  business:  "Business",
  technical: "Technical",
  market:    "Market",
};

function scoreColor(s: number) {
  if (s >= 7.5) return "#00cc88";
  if (s >= 5)   return "#fa4300";
  if (s >= 3)   return "#fee252";
  return "#ff4444";
}

function ScoreRing({ score }: { score: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const [offset, setOffset] = useState(C);

  useEffect(() => {
    const t = setTimeout(() => setOffset(C - (score / 10) * C), 100);
    return () => clearTimeout(t);
  }, [score, C]);

  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#262626" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={R}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s ease-in-out", transformOrigin: "70px 70px", transform: "rotate(-90deg)" }}
        />
        <text x="70" y="62" textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>{score.toFixed(1)}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="12" fill="#888888">out of 10</text>
      </svg>
      <p className="text-[#888888] text-sm font-medium">Overall Score</p>
    </div>
  );
}

function ParameterBar({ label, score }: { label: string; score: number }) {
  const [width, setWidth] = useState(0);
  const color = scoreColor(score);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score * 10), 150);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[#fafafa] text-sm">{label}</span>
        <span className="font-bold text-sm" style={{ color }}>{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ScoreDashboard({ result }: { result: PitchResultResponse }) {
  return (
    <div className="space-y-8">
      {/* Overall */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <ScoreRing score={result.overall_score} />
        <div className="flex-1 space-y-3">
          <h2 className="text-[#fafafa] font-bold text-lg">Analysis Complete</h2>
          <p className="text-[#888888] text-sm leading-relaxed">
            4 AI agents evaluated your pitch across 6 parameters.
            {result.conflicts.length > 0 && ` ${result.conflicts.length} conflict${result.conflicts.length > 1 ? "s" : ""} detected — review below.`}
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(result.agent_scores).map(([id, a]) => (
              <div key={id} className="bg-[#0d0d0d] border border-[#262626] rounded-lg px-3 py-2 text-center">
                <p className="text-[#888888] text-xs">{AGENT_LABELS[id] ?? id}</p>
                <p className="text-[#fafafa] font-bold">{a.overall.toFixed(1)}</p>
                <p className="text-[#616161] text-xs">{Math.round(a.confidence * 100)}% conf.</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parameter bars */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-4">
        <h3 className="text-[#fafafa] font-semibold mb-5">Parameter Breakdown</h3>
        {Object.entries(result.parameters).map(([key, param]) => (
          <ParameterBar key={key} label={PARAM_LABELS[key] ?? key} score={param.score} />
        ))}
      </div>

      {/* Feedback */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-4">
        <h3 className="text-[#fafafa] font-semibold mb-4">Agent Feedback</h3>
        {Object.entries(result.parameters).map(([key, param]) => (
          param.feedback ? (
            <div key={key} className="border-b border-[#262626] last:border-0 pb-4 last:pb-0">
              <p className="text-[#fa4300] text-xs font-semibold uppercase tracking-wider mb-1">{PARAM_LABELS[key] ?? key}</p>
              <p className="text-[#888888] text-sm leading-relaxed">{param.feedback}</p>
            </div>
          ) : null
        ))}
      </div>

      {/* Conflicts */}
      {result.conflicts.length > 0 && (
        <div className="bg-[#141414] border border-[#fee252]/30 rounded-2xl p-6">
          <h3 className="text-[#fee252] font-semibold mb-4 flex items-center gap-2">
            ⚠ Agent Conflicts
          </h3>
          <div className="space-y-3">
            {result.conflicts.map((c, i) => (
              <div key={i} className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#fafafa] text-sm font-medium">{PARAM_LABELS[c.parameter] ?? c.parameter}</span>
                  <span className="text-[#fee252] text-xs font-mono">{c.spread.toFixed(1)} pt spread</span>
                </div>
                <p className="text-[#888888] text-xs">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
