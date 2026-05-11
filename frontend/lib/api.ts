import type {
  PitchStatusResponse, PitchResultResponse,
  SubmitRequest, SubmitResponse,
  DirectSubmitResponse,
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

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1]); // strip the "data:...;base64," prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function submitDirect(params: {
  name: string;
  pitch_text: string;
  contact_type: string;
  contact_value: string;
  file?: File | null;
}): Promise<DirectSubmitResponse> {
  let file_base64: string | undefined;
  let file_name: string | undefined;
  let file_content_type: string | undefined;

  if (params.file) {
    file_base64 = await fileToBase64(params.file);
    file_name = params.file.name;
    file_content_type = params.file.type || "application/octet-stream";
  }

  const res = await fetch(`${BASE}/telegram/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: params.name,
      pitch_text: params.pitch_text,
      contact_type: params.contact_type,
      contact_value: params.contact_value,
      file_name,
      file_base64,
      file_content_type,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
