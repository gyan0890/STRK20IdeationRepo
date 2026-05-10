export type AgentId = "colleague" | "business" | "technical" | "market";
export type AgentStatus = "pending" | "analyzing" | "done" | "error";
export type ContactType = "email" | "telegram" | "other";

export interface AgentStatusItem {
  status: AgentStatus;
  score: number | null;
}

export interface ParameterResult {
  score: number;
  feedback: string;
}

export interface AgentScoreResult {
  overall: number;
  confidence: number;
}

export interface ConflictItem {
  parameter: string;
  agents: string[];
  spread: number;
  note: string;
}

export interface PitchStatusResponse {
  pitch_id: string;
  status: "processing" | "completed" | "failed";
  agents: Record<AgentId, AgentStatusItem>;
  result: null;
}

export interface PitchResultResponse {
  pitch_id: string;
  status: string;
  overall_score: number;
  parameters: Record<string, ParameterResult>;
  agent_scores: Record<AgentId, AgentScoreResult>;
  conflicts: ConflictItem[];
  created_at: string;
}

export interface SubmitRequest {
  name: string;
  contact_type: ContactType;
  contact_value: string;
}

export interface SubmitResponse {
  submission_id: string;
  reference: string;
  status: string;
}

export interface DirectSubmitRequest {
  name: string;
  pitch_text: string;
  contact_type: ContactType;
  contact_value: string;
}

export interface DirectSubmitResponse {
  reference: string;
  status: string;
}
