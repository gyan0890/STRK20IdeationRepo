from crewai.tools import BaseTool
import httpx
import json

COLLEAGUE_API_URL = "https://nkbdznprhqzenynjdoih.supabase.co/functions/v1/analyze-pitch"

# Keywords to route each critical_gap to the right parameter
_TECH_KW  = ("technical", "architect", "smart contract", "protocol", "security",
              "audit", "cairo", "starknet", "product spec", "amm", "mvp", "code")
_MKT_KW   = ("market siz", "market analys", "tam", "sam", "som", "market demand",
              "addressable", "market share", "market research", "target market")
_BIZ_KW   = ("business model", "revenue", "pricing", "unit econom", "monetiz",
              "b2b", "saas", "subscription", "fee structure")

def _route_gaps(gaps: list) -> dict:
    """Route each critical_gap to the single most relevant parameter."""
    out = {k: [] for k in ("technical_feasibility", "market_size", "business_model", "team_execution")}
    for gap in gaps:
        gl = gap.lower()
        if any(k in gl for k in _TECH_KW):
            out["technical_feasibility"].append(gap)
        elif any(k in gl for k in _MKT_KW):
            out["market_size"].append(gap)
        elif any(k in gl for k in _BIZ_KW):
            out["business_model"].append(gap)
        else:
            out["team_execution"].append(gap)
    return out


def _parse_colleague_response(data: dict) -> dict:
    a  = data.get("analysis", {})
    ds = a.get("deck_scores", {})

    def s(key: str) -> float:
        return float(ds.get(key, 0))

    def avg(*keys) -> float:
        vals = [s(k) for k in keys]
        return sum(vals) / len(vals)

    summary  = a.get("company_summary", {})
    strengths = a.get("top_strengths", [])
    risks     = a.get("top_risks", [])
    routed    = _route_gaps(a.get("critical_gaps", []))

    def _join(items): return " ".join(items) if items else ""

    biz_fb  = " ".join(filter(None, [summary.get("business_model", ""), _join(strengths[:1]), _join(routed["business_model"])]))
    tech_fb = " ".join(filter(None, ["Technical credibility score.", _join(risks[:2]), _join(routed["technical_feasibility"])]))
    rev_fb  = summary.get("business_model", "")
    mkt_fb  = " ".join(filter(None, [f"Market: {summary.get('target_market', '')}", _join(routed["market_size"])]))
    team_fb = " ".join(filter(None, [f"Stage: {summary.get('stage', '')}", _join(routed["team_execution"])]))
    inno_fb = " ".join(filter(None, [summary.get("one_liner", ""), _join(strengths)]))

    raw_overall = float(a.get("overall_score", 0)) / 10.0
    viability   = float(a.get("go_no_go", {}).get("viability_rating", raw_overall))
    overall     = (raw_overall + viability) / 2.0

    vc_fundable = a.get("vc_fundable", "no").lower()
    confidence  = 0.85 if vc_fundable == "yes" else 0.65

    return {
        "scores": {
            "business_model":        {"score": s("Business model clarity"),                            "feedback": biz_fb},
            "technical_feasibility": {"score": s("Technical credibility"),                             "feedback": tech_fb},
            "revenue_profit":        {"score": avg("Business model clarity", "Market sizing realism"), "feedback": rev_fb},
            "market_size":           {"score": s("Market sizing realism"),                             "feedback": mkt_fb},
            "team_execution":        {"score": avg("Team credibility", "GTM and distribution"),        "feedback": team_fb},
            "innovation":            {"score": avg("Solution clarity", "Competitive differentiation"), "feedback": inno_fb},
        },
        "overall":    round(overall, 2),
        "confidence": confidence,
        "telegram_message":    a.get("telegram_message", ""),
        "go_no_go_rationale":  a.get("go_no_go", {}).get("rationale", ""),
    }


class ColleagueAgentTool(BaseTool):
    name: str = "colleague_pitch_evaluator"
    description: str = "Sends the pitch to Jessie's external evaluation API and returns structured scores across 6 parameters."

    def _run(self, pitch_text: str) -> str:
        response = httpx.post(
            COLLEAGUE_API_URL,
            json={"pitch": pitch_text},
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            raise RuntimeError(f"Colleague API returned success=false: {data}")

        return json.dumps(_parse_colleague_response(data))
