import type { PitchResultResponse } from "./types";

const PARAM_LABELS: Record<string, string> = {
  business_model:        "Business Model",
  technical_feasibility: "Technical Feasibility",
  revenue_profit:        "Revenue & Profit",
  market_size:           "Market Size",
  team_execution:        "Team & Execution",
  innovation:            "Innovation",
};

const AGENT_LABELS: Record<string, string> = {
  colleague: "Jessie",
  business:  "Business",
  technical: "Technical",
  market:    "Market",
};

function scoreColor(s: number): string {
  if (s >= 7.5) return "#00cc88";
  if (s >= 5)   return "#e85d00";
  if (s >= 3)   return "#b8940a";
  return "#cc2222";
}

export function downloadResultsAsPDF(result: PitchResultResponse): void {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const paramRows = Object.entries(result.parameters)
    .map(([key, param]) => {
      const color = scoreColor(param.score);
      const pct = param.score * 10;
      const label = PARAM_LABELS[key] ?? key;
      return `
        <div class="param-row">
          <div class="param-header">
            <span class="param-label">${label}</span>
            <span class="param-score" style="color:${color}">${param.score.toFixed(1)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          ${param.feedback ? `<p class="param-feedback">${param.feedback}</p>` : ""}
        </div>`;
    })
    .join("");

  const agentCards = Object.entries(result.agent_scores)
    .map(([id, a]) => `
      <div class="agent-card">
        <div class="agent-name">${AGENT_LABELS[id] ?? id}</div>
        <div class="agent-score">${a.overall.toFixed(1)}</div>
        <div class="agent-conf">${Math.round(a.confidence * 100)}% conf.</div>
      </div>`)
    .join("");

  const conflictSection = result.conflicts.length > 0
    ? `<div class="section conflict-section">
        <h2 class="section-title" style="color:#b8940a">Agent Conflicts</h2>
        ${result.conflicts.map(c => `
          <div class="conflict-item">
            <div class="conflict-header">
              <span>${PARAM_LABELS[c.parameter] ?? c.parameter}</span>
              <span class="conflict-spread">${c.spread.toFixed(1)} pt spread</span>
            </div>
            <p class="conflict-note">${c.note}</p>
          </div>`).join("")}
      </div>`
    : "";

  const overall = result.overall_score;
  const overallColor = scoreColor(overall);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Pitch Analysis — strk20</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #fff;
    color: #111;
    padding: 40px 48px;
    font-size: 13px;
    line-height: 1.5;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #111;
    padding-bottom: 16px;
    margin-bottom: 28px;
  }
  .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
  .brand span { color: #e85d00; }
  .meta { text-align: right; color: #555; font-size: 11px; line-height: 1.8; }
  .overall-row {
    display: flex;
    align-items: center;
    gap: 32px;
    background: #f7f7f7;
    border-radius: 12px;
    padding: 24px 28px;
    margin-bottom: 28px;
  }
  .score-circle {
    width: 100px; height: 100px;
    border-radius: 50%;
    border: 8px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .score-number { font-size: 30px; font-weight: 900; }
  .score-label { font-size: 10px; color: #777; margin-top: 2px; }
  .overall-right h1 { font-size: 17px; font-weight: 800; margin-bottom: 6px; }
  .overall-right p { color: #555; font-size: 12px; margin-bottom: 14px; }
  .agents { display: flex; gap: 10px; flex-wrap: wrap; }
  .agent-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 8px 14px;
    text-align: center;
    min-width: 68px;
  }
  .agent-name { font-size: 10px; color: #777; }
  .agent-score { font-size: 16px; font-weight: 800; color: #111; }
  .agent-conf { font-size: 9px; color: #aaa; }
  .section {
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 20px 22px;
    margin-bottom: 20px;
  }
  .section-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 16px;
    color: #333;
  }
  .param-row { margin-bottom: 14px; }
  .param-row:last-child { margin-bottom: 0; }
  .param-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .param-label { font-size: 12px; color: #222; }
  .param-score { font-size: 12px; font-weight: 700; }
  .bar-track { height: 7px; background: #e5e5e5; border-radius: 4px; overflow: hidden; margin-bottom: 5px; }
  .bar-fill { height: 100%; border-radius: 4px; }
  .param-feedback { font-size: 11px; color: #555; line-height: 1.5; margin-top: 4px; }
  .conflict-item {
    background: #fafafa;
    border: 1px solid #e5e5e5;
    border-radius: 7px;
    padding: 10px 14px;
    margin-bottom: 8px;
  }
  .conflict-item:last-child { margin-bottom: 0; }
  .conflict-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
  .conflict-spread { color: #b8940a; font-size: 11px; }
  .conflict-note { font-size: 11px; color: #666; }
  .conflict-section { border-color: #e6d680; }
  .footer {
    margin-top: 28px;
    padding-top: 14px;
    border-top: 1px solid #e0e0e0;
    text-align: center;
    font-size: 10px;
    color: #aaa;
  }
  @media print {
    body { padding: 20px 28px; }
    @page { margin: 12mm 14mm; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="brand">strk<span>20</span> <span style="font-weight:300;color:#888;font-size:14px">/ pitch analysis</span></div>
  <div class="meta">
    <div>Pitch ID: ${result.pitch_id}</div>
    <div>Generated: ${date}</div>
    <div>strk20.starknet.io</div>
  </div>
</div>

<div class="overall-row">
  <div class="score-circle" style="border-color:${overallColor}">
    <div class="score-number" style="color:${overallColor}">${overall.toFixed(1)}</div>
    <div class="score-label">out of 10</div>
  </div>
  <div class="overall-right">
    <h1>Analysis Complete</h1>
    <p>4 AI agents evaluated your pitch across 6 parameters.${result.conflicts.length > 0 ? ` ${result.conflicts.length} conflict${result.conflicts.length > 1 ? "s" : ""} detected.` : ""}</p>
    <div class="agents">${agentCards}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Parameter Breakdown &amp; Feedback</div>
  ${paramRows}
</div>

${conflictSection}

<div class="footer">
  Generated by strk20 Pitch Analyzer &middot; Starknet Foundation &middot; strk20.starknet.io
</div>

<script>
  window.onload = function() { window.print(); };
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
