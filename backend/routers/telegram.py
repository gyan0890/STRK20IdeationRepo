import uuid
import random
import string
from fastapi import APIRouter, Depends, UploadFile, File, Form
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


class DirectSubmitResponse:
    pass

from pydantic import BaseModel
class DirectSubmitResponseModel(BaseModel):
    reference: str
    status: str


@router.post("/submit", response_model=DirectSubmitResponseModel)
async def direct_submit(
    name:          str            = Form(...),
    contact_type:  str            = Form(...),
    contact_value: str            = Form(...),
    pitch_text:    str            = Form(""),
    file:          Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    reference = _ref()

    # Determine stored pitch text
    stored_pitch = pitch_text.strip()
    if file and file.filename:
        stored_pitch = stored_pitch or f"[File: {file.filename}]"

    record = DirectSubmissionRecord(
        submission_id=str(uuid.uuid4()),
        reference=reference,
        name=name.strip(),
        contact_type=contact_type,
        contact_value=contact_value.strip(),
        pitch_text=stored_pitch,
        source="web",
    )
    db.add(record)
    await db.commit()

    # Always send the header + text parts
    header_parts = format_direct_submission(
        name=name,
        contact_type=contact_type,
        contact_value=contact_value,
        pitch_preview=stored_pitch,
        reference=reference,
    )
    await send_telegram_messages(header_parts)

    # If a file was uploaded, send it to TG
    if file and file.filename:
        file_bytes = await file.read()
        caption = f"📎 <b>{file.filename}</b>\nRef: <code>{reference}</code>"
        await send_telegram_file_upload(
            filename=file.filename,
            file_bytes=file_bytes,
            content_type=file.content_type or "application/octet-stream",
            caption=caption,
        )

    return DirectSubmitResponseModel(reference=reference, status="submitted")
