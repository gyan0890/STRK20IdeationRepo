"use client";

import type { AgentId, AgentStatusItem } from "@/lib/types";

const AGENT_META: Record<AgentId, { label: string; color: string; icon: string; focus: string }> = {
  colleague: { label: "Jessie",              color: "#14b8a6", icon: "🤝", focus: "External evaluation" },
  business:  { label: "Business Analyst",   color: "#f97316", icon: "📊", focus: "Business model · Revenue · Innovation" },
  technical: { label: "Technical Evaluator",color: "#8b5cf6", icon: "⚙️", focus: "Starknet feasibility · Architecture" },
  market:    { label: "Market Analyst",     color: "#3b82f6", icon: "📈", focus: "Market size · Go-to-market · Team" },
};

const ORDER: AgentId[] = ["colleague", "business", "technical", "market"];

function StatusDot({ status, color }: { status: string; color: string }) {
  if (status === "analyzing") return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: color }} />
    </span>
  );
  if (status === "done")  return <span className="inline-flex h-3 w-3 rounded-full bg-[#00cc88]" />;
  if (status === "error") return <span className="inline-flex h-3 w-3 rounded-full bg-[#ff4444]" />;
  return <span className="inline-flex h-3 w-3 rounded-full bg-[#333333]" />;
}

export default function AgentProgress({ agents }: { agents: Record<AgentId, AgentStatusItem> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {ORDER.map(id => {
        const meta   = AGENT_META[id];
        const agent  = agents[id] ?? { status: "pending", score: null };
        const isDone = agent.status === "done";

        return (
          <div
            key={id}
            className="bg-[#141414] border border-[#262626] rounded-xl p-4 transition-all"
            style={isDone ? { borderColor: meta.color + "40" } : {}}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{meta.icon}</span>
                <div>
                  <p className="text-[#fafafa] text-sm font-semibold">{meta.label}</p>
                  <p className="text-[#888888] text-xs">{meta.focus}</p>
                </div>
              </div>
              <StatusDot status={agent.status} color={meta.color} />
            </div>

            <div className="flex items-center justify-between">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                style={{
                  backgroundColor: agent.status === "done"      ? meta.color + "20" :
                                   agent.status === "analyzing"  ? meta.color + "15" :
                                   agent.status === "error"      ? "#ff444420"        : "#262626",
                  color: agent.status === "error" ? "#ff4444" :
                         agent.status === "pending" ? "#616161" : meta.color,
                }}
              >
                {agent.status}
              </span>
              {isDone && agent.score !== null && (
                <span className="text-xl font-black" style={{ color: meta.color }}>
                  {agent.score.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
