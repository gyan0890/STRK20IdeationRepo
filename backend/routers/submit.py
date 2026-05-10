import json
import uuid
import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.submission import SubmitRequest, SubmitResponse
from services.db import get_db, PitchRecord, SubmissionRecord
from services.telegram import send_telegram, format_analysis_submission

router = APIRouter(prefix="/api/pitch", tags=["submit"])

def _ref() -> str:
    return "STRK-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.post("/{pitch_id}/submit", response_model=SubmitResponse)
async def submit_pitch(pitch_id: str, body: SubmitRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PitchRecord).where(PitchRecord.pitch_id == pitch_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Pitch not found")

    submission_id = str(uuid.uuid4())
    reference = _ref()

    sub = SubmissionRecord(
        submission_id=submission_id,
        pitch_id=pitch_id,
        reference=reference,
        name=body.name,
        contact_type=body.contact_type,
        contact_value=body.contact_value,
    )
    db.add(sub)
    await db.commit()

    # Send TG notification (best-effort)
    if record.result_json:
        try:
            data = json.loads(record.result_json)
            msg = format_analysis_submission(
                name=body.name,
                contact_type=body.contact_type,
                contact_value=body.contact_value,
                overall=data.get("overall_score", 0),
                parameters=data.get("parameters", {}),
                reference=reference,
            )
            await send_telegram(msg)
        except Exception:
            pass

    return SubmitResponse(submission_id=submission_id, reference=reference, status="submitted")
