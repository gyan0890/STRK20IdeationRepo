import uuid
import random
import string
import base64
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from services.db import get_db, DirectSubmissionRecord
from services.telegram import (
    send_telegram_messages,
    send_telegram_file_upload,
    format_direct_submission,
)

router = APIRouter(prefix="/api/telegram", tags=["telegram"])


def _ref() -> str:
    return "STRK-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class DirectSubmitRequest(BaseModel):
    name: str
    pitch_text: str = ""
    contact_type: str
    contact_value: str
    file_name: Optional[str] = None
    file_base64: Optional[str] = None
    file_content_type: Optional[str] = None


class DirectSubmitResponse(BaseModel):
    reference: str
    status: str


@router.post("/submit", response_model=DirectSubmitResponse)
async def direct_submit(body: DirectSubmitRequest, db: AsyncSession = Depends(get_db)):
    reference = _ref()

    stored_pitch = body.pitch_text.strip()
    if body.file_name and not stored_pitch:
        stored_pitch = f"[File: {body.file_name}]"

    record = DirectSubmissionRecord(
        submission_id=str(uuid.uuid4()),
        reference=reference,
        name=body.name.strip(),
        contact_type=body.contact_type,
        contact_value=body.contact_value.strip(),
        pitch_text=stored_pitch,
        source="web",
    )
    db.add(record)
    await db.commit()

    parts = format_direct_submission(
        name=body.name,
        contact_type=body.contact_type,
        contact_value=body.contact_value,
        pitch_preview=stored_pitch,
        reference=reference,
    )
    await send_telegram_messages(parts)

    if body.file_base64 and body.file_name:
        file_bytes = base64.b64decode(body.file_base64)
        caption = f"📎 <b>{body.file_name}</b>\nRef: <code>{reference}</code>"
        await send_telegram_file_upload(
            filename=body.file_name,
            file_bytes=file_bytes,
            content_type=body.file_content_type or "application/octet-stream",
            caption=caption,
        )

    return DirectSubmitResponse(reference=reference, status="submitted")
