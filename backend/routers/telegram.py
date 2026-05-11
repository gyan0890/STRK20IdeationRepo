import uuid
import random
import string
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from services.db import get_db, DirectSubmissionRecord
from services.telegram import send_telegram_messages, format_direct_submission

router = APIRouter(prefix="/api/telegram", tags=["telegram"])

def _ref() -> str:
    return "STRK-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

class DirectSubmitRequest(BaseModel):
    name: str
    pitch_text: str
    contact_type: str   # "email" | "telegram" | "other"
    contact_value: str

class DirectSubmitResponse(BaseModel):
    reference: str
    status: str

@router.post("/submit", response_model=DirectSubmitResponse)
async def direct_submit(body: DirectSubmitRequest, db: AsyncSession = Depends(get_db)):
    reference = _ref()
    record = DirectSubmissionRecord(
        submission_id=str(uuid.uuid4()),
        reference=reference,
        name=body.name.strip(),
        contact_type=body.contact_type,
        contact_value=body.contact_value.strip(),
        pitch_text=body.pitch_text.strip(),
        source="web",
    )
    db.add(record)
    await db.commit()

    parts = format_direct_submission(
        name=body.name,
        contact_type=body.contact_type,
        contact_value=body.contact_value,
        pitch_preview=body.pitch_text,
        reference=reference,
    )
    await send_telegram_messages(parts)

    return DirectSubmitResponse(reference=reference, status="submitted")
