import os
import httpx

_CHUNK = 4000  # safe under Telegram's 4096 hard limit


async def _post_message(token: str, chat_id: str, text: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            )
            return r.status_code == 200
    except Exception:
        return False


async def send_telegram(text: str) -> bool:
    """Send a single message to the SNF channel."""
    token   = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return False
    return await _post_message(token, chat_id, text)


async def send_telegram_messages(parts: list[str]) -> bool:
    """Send multiple messages sequentially (for long pitches)."""
    token   = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return False
    ok = True
    for part in parts:
        ok = await _post_message(token, chat_id, part) and ok
    return ok


async def send_telegram_document(file_id: str, caption: str = "") -> bool:
    """Forward a document (by Telegram file_id) to the SNF channel."""
    token   = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"https://api.telegram.org/bot{token}/sendDocument",
                json={
                    "chat_id": chat_id,
                    "document": file_id,
                    "caption": caption[:1024],
                    "parse_mode": "HTML",
                },
            )
            return r.status_code == 200
    except Exception:
        return False


def _chunks(text: str) -> list[str]:
    return [text[i:i + _CHUNK] for i in range(0, max(len(text), 1), _CHUNK)]


def format_direct_submission(name: str, contact_type: str, contact_value: str,
                              pitch_preview: str, reference: str) -> list[str]:
    """Returns a list of messages: header first, then pitch body chunk(s)."""
    header = (
        f"📬 <b>Direct Pitch Submission</b>\n"
        f"Reference: <code>{reference}</code>\n\n"
        f"<b>Name:</b> {name}\n"
        f"<b>Contact:</b> {contact_type} — {contact_value}"
    )
    pitch_chunks = _chunks(pitch_preview)
    messages = [header]
    for i, chunk in enumerate(pitch_chunks):
        label = "📄 <b>Pitch:</b>" if i == 0 else "📄 <b>Pitch (cont.):</b>"
        messages.append(f"{label}\n{chunk}")
    return messages


def format_analysis_submission(name: str, contact_type: str, contact_value: str,
                                overall: float, parameters: dict, reference: str) -> str:
    param_lines = "\n".join(
        f"  • {k.replace('_', ' ').title()}: {v['score']}"
        for k, v in parameters.items()
    )
    return (
        f"🎯 <b>New Pitch Submission</b>\n"
        f"Reference: <code>{reference}</code>\n\n"
        f"<b>Name:</b> {name}\n"
        f"<b>Contact:</b> {contact_type} — {contact_value}\n"
        f"<b>Overall Score:</b> {overall}/10\n\n"
        f"<b>Parameter Scores:</b>\n{param_lines}"
    )
