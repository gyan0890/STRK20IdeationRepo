import os
from crewai import LLM
from config import get_settings

# Venice AI rejects stop=[] (requires ≥1 element); drop unsupported params instead
os.environ.setdefault("LITELLM_DROP_PARAMS", "true")

def get_llm() -> LLM:
    s = get_settings()
    return LLM(
        model=f"openai/{s.llm_model}",
        base_url=s.llm_base_url,
        api_key=s.llm_api_key,
    )
