import json
import re
from crewai import Crew, Task, Process
from agents.business_agent import get_business_agent
from agents.technical_agent import get_technical_agent
from agents.market_agent import get_market_agent
from agents.colleague_tool import ColleagueAgentTool
from services.aggregator import aggregate_scores

def _parse_json(raw: str) -> dict:
    """Extract JSON from agent output (may be wrapped in markdown code fences)."""
    # CrewAI 1.x may include "Final Answer:" header before JSON
    final_match = re.search(r"Final Answer:\s*([\s\S]+)", raw)
    text = final_match.group(1).strip() if final_match else raw.strip()

    fence_match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    text = fence_match.group(1) if fence_match else text

    return json.loads(text.strip())

def _task_raw(task: Task) -> str:
    """Get raw string output from a CrewAI 1.x TaskOutput."""
    output = task.output
    if output is None:
        raise ValueError("No output on task")
    # TaskOutput in crewai 1.x has a .raw attribute
    return output.raw if hasattr(output, "raw") else str(output)

def run_analysis(pitch_text: str, status_callback=None) -> dict:
    """
    Runs all 4 agents against pitch_text.
    status_callback(agent_id, status, score) is called as each agent completes.
    Returns the aggregated result dict.
    """
    business_agent  = get_business_agent()
    technical_agent = get_technical_agent()
    market_agent    = get_market_agent()

    rubric_note = "Return a JSON object only. No markdown fences, no explanation — just the JSON."

    business_task = Task(
        description=f"""Analyze this pitch and score it on business_model, revenue_profit, and innovation.
{rubric_note}

PITCH:
{pitch_text}""",
        agent=business_agent,
        expected_output='JSON object with keys: scores (dict of parameter->{{score, feedback}}), overall (float 0-10), confidence (float 0-1)',
    )

    technical_task = Task(
        description=f"""Analyze this pitch for technical feasibility on Starknet.
Use starknet_docs_search to verify claims. Score on technical_feasibility and innovation.
{rubric_note}

PITCH:
{pitch_text}""",
        agent=technical_agent,
        expected_output='JSON object with keys: scores (dict of parameter->{{score, feedback}}), overall (float 0-10), confidence (float 0-1)',
    )

    market_task = Task(
        description=f"""Analyze this pitch for market viability.
Score on market_size, revenue_profit, and team_execution.
{rubric_note}

PITCH:
{pitch_text}""",
        agent=market_agent,
        expected_output='JSON object with keys: scores (dict of parameter->{{score, feedback}}), overall (float 0-10), confidence (float 0-1)',
    )

    crew = Crew(
        agents=[business_agent, technical_agent, market_agent],
        tasks=[business_task, technical_task, market_task],
        process=Process.sequential,
        verbose=False,
    )

    crew.kickoff()

    # Parse individual task outputs
    agent_results = {}
    task_agents = [
        ("business",  business_task),
        ("technical", technical_task),
        ("market",    market_task),
    ]
    for agent_id, task in task_agents:
        try:
            parsed = _parse_json(_task_raw(task))
            agent_results[agent_id] = parsed
            score = parsed.get("overall", 0.0)
            if status_callback:
                status_callback(agent_id, "done", score)
        except Exception as e:
            agent_results[agent_id] = {"scores": {}, "overall": 0.0, "confidence": 0.5}
            if status_callback:
                status_callback(agent_id, "error", None)

    # Colleague agent (runs inline, not via CrewAI)
    colleague_tool = ColleagueAgentTool()
    try:
        colleague_raw = colleague_tool._run(pitch_text)
        colleague_data = _parse_json(colleague_raw)
        agent_results["colleague"] = colleague_data
        if status_callback:
            status_callback("colleague", "done", colleague_data.get("overall", 0.0))
    except Exception:
        agent_results["colleague"] = {"scores": {}, "overall": 0.0, "confidence": 0.5}
        if status_callback:
            status_callback("colleague", "error", None)

    aggregated = aggregate_scores(agent_results)

    aggregated["agent_scores"] = {
        agent_id: {
            "overall": data.get("overall", 0.0),
            "confidence": data.get("confidence", 0.7),
        }
        for agent_id, data in agent_results.items()
    }

    return aggregated
