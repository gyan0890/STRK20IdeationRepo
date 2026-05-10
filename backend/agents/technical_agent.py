from pathlib import Path
from crewai import Agent
from crewai.tools import BaseTool
from llm_adapter import get_llm

_rubric = (Path(__file__).parent / "prompts" / "scoring_rubric.md").read_text()
_prompt  = (Path(__file__).parent / "prompts" / "technical.md").read_text()

class StarknetDocsTool(BaseTool):
    name: str = "starknet_docs_search"
    description: str = "Search STRK20 whitepaper and Starknet documentation for technical reference"

    def _run(self, query: str) -> str:
        from rag.retriever import search_docs
        results = search_docs(query, top_k=5)
        return "\n\n---\n\n".join(r["text"] for r in results)

def get_technical_agent() -> Agent:
    return Agent(
        role="Technical Feasibility Evaluator",
        goal="Evaluate whether the proposed project is technically buildable on Starknet, whether it correctly leverages STRK20 token privacy features, and whether the architecture is sound",
        backstory=f"{_prompt}\n\n{_rubric}",
        tools=[StarknetDocsTool()],
        llm=get_llm(),
        verbose=True,
    )
