from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class PitchInput(BaseModel):
    pitch_text: Optional[str] = None
    file_base64: Optional[str] = None
    file_type: Optional[str] = None  # "pdf" | "pptx" | null

class AgentStatusItem(BaseModel):
    status: str = "pending"  # pending | analyzing | done | error
    score: Optional[float] = None

class ParameterResult(BaseModel):
    score: float
    feedback: str

class AgentScoreResult(BaseModel):
    overall: float
    confidence: float

class ConflictItem(BaseModel):
    parameter: str
    agents: list[str]
    spread: float
    note: str

class PitchStatusResponse(BaseModel):
    pitch_id: str
    status: str
    agents: dict[str, AgentStatusItem]
    result: Optional[dict] = None

class PitchResultResponse(BaseModel):
    pitch_id: str
    status: str
    overall_score: float
    parameters: dict[str, ParameterResult]
    agent_scores: dict[str, AgentScoreResult]
    conflicts: list[ConflictItem]
    created_at: str

class PitchCreateResponse(BaseModel):
    pitch_id: str
    status: str
    created_at: str
