from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    llm_provider: str = "venice"
    llm_api_key: str = ""
    llm_base_url: str = "https://api.venice.ai/api/v1"
    llm_model: str = "llama-3.3-70b"

    database_url: str = "sqlite+aiosqlite:///./pitches.db"

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    vectorstore_path: str = "rag/vectorstore"

    next_public_api_url: str = "http://localhost:8000/api"

    class Config:
        env_file = ".env"
        extra = "ignore"  # silently drop unknown .env keys (e.g. CREWAI_*, LITELLM_*)

@lru_cache
def get_settings() -> Settings:
    return Settings()
