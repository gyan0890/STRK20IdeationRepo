from pathlib import Path
from crewai import Agent
from llm_adapter import get_llm

_rubric = (Path(__file__).parent / "prompts" / "scoring_rubric.md").read_text()
_prompt  = (Path(__file__).parent / "prompts" / "market.md").read_text()

def get_market_agent() -> Agent:
    return Agent(
        role="Market & Revenue Analyst",
        goal="Evaluate the market opportunity, demand signals, TAM/SAM/SOM claims, revenue projections, and profitability timeline",
        backstory=f"{_prompt}\n\n{_rubric}",
        llm=get_llm(),
        verbose=True,
    )
