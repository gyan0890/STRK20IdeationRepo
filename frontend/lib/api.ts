import type {
  PitchStatusResponse, PitchResultResponse,
  SubmitRequest, SubmitResponse,
  DirectSubmitRequest, DirectSubmitResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function submitPitch(payload: {
  pitch_text?: string;
  file_base64?: string;
  file_type?: string;
}): Promise<{ pitch_id: string; status: string; created_at: string }> {
  const res = await fetch(`${BASE}/pitch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPitchStatus(pitchId: string): Promise<PitchStatusResponse> {
  const res = await fetch(`${BASE}/pitch/${pitchId}/status`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPitchResult(pitchId: string): Promise<PitchResultResponse> {
  const res = await fetch(`${BASE}/pitch/${pitchId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitContact(pitchId: string, data: SubmitRequest): Promise<SubmitResponse> {
  const res = await fetch(`${BASE}/pitch/${pitchId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitDirect(data: DirectSubmitRequest): Promise<DirectSubmitResponse> {
  const res = await fetch(`${BASE}/telegram/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
