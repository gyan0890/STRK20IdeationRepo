from pathlib import Path
from crewai import Agent
from llm_adapter import get_llm

_rubric = (Path(__file__).parent / "prompts" / "scoring_rubric.md").read_text()
_prompt  = (Path(__file__).parent / "prompts" / "business.md").read_text()

def get_business_agent() -> Agent:
    return Agent(
        role="Business Model Analyst",
        goal="Evaluate the business model viability, unit economics, revenue strategy, and competitive moat of the submitted pitch",
        backstory=f"{_prompt}\n\n{_rubric}",
        llm=get_llm(),
        verbose=True,
    )
