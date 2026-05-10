AGENT_WEIGHTS = {
    "business_model":        {"colleague": 0.2, "business": 0.5, "technical": 0.0, "market": 0.3},
    "technical_feasibility": {"colleague": 0.2, "business": 0.0, "technical": 0.6, "market": 0.2},
    "revenue_profit":        {"colleague": 0.2, "business": 0.4, "technical": 0.0, "market": 0.4},
    "market_size":           {"colleague": 0.2, "business": 0.2, "technical": 0.0, "market": 0.6},
    "team_execution":        {"colleague": 0.3, "business": 0.2, "technical": 0.2, "market": 0.3},
    "innovation":            {"colleague": 0.2, "business": 0.3, "technical": 0.3, "market": 0.2},
}

CONFLICT_THRESHOLD = 3.0

def aggregate_scores(agent_results: dict) -> dict:
    parameters = {}
    conflicts = []

    for param, weights in AGENT_WEIGHTS.items():
        weighted_sum = 0.0
        total_weight = 0.0
        agent_scores_for_param = []
        # Track (effective_weight, feedback) so we can pick the best one
        weighted_feedbacks: list[tuple[float, str]] = []

        for agent_id, weight in weights.items():
            if weight == 0:
                continue
            agent_data = agent_results.get(agent_id, {})
            param_data = agent_data.get("scores", {}).get(param)
            if param_data is None:
                continue

            score = param_data["score"]
            confidence = agent_data.get("confidence", 0.7)
            effective_weight = weight * confidence

            weighted_sum += score * effective_weight
            total_weight += effective_weight
            agent_scores_for_param.append((agent_id, score))

            fb = (param_data.get("feedback") or "").strip()
            if fb:
                weighted_feedbacks.append((effective_weight, fb))

        final_score = weighted_sum / total_weight if total_weight > 0 else 0.0

        if len(agent_scores_for_param) >= 2:
            scores_only = [s for _, s in agent_scores_for_param]
            spread = max(scores_only) - min(scores_only)
            if spread > CONFLICT_THRESHOLD:
                conflicts.append({
                    "parameter": param,
                    "agents": [a for a, _ in agent_scores_for_param],
                    "spread": round(spread, 1),
                    "note": f"Significant disagreement ({spread:.1f} point spread) — review manually",
                })

        # Use feedback from the highest-weight agent only — avoids repetition across parameters
        best_feedback = max(weighted_feedbacks, key=lambda x: x[0])[1] if weighted_feedbacks else ""

        parameters[param] = {
            "score": round(final_score, 1),
            "feedback": best_feedback,
        }

    overall = sum(p["score"] for p in parameters.values()) / len(parameters)

    return {
        "overall_score": round(overall, 1),
        "parameters": parameters,
        "conflicts": conflicts,
    }
