import os
import httpx

async def send_telegram(text: str) -> bool:
    """Send a message to the configured SNF Telegram channel. Silently skips if unconfigured."""
    token   = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            )
            return r.status_code == 200
    except Exception:
        return False


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


def format_direct_submission(name: str, contact_type: str, contact_value: str,
                              pitch_preview: str, reference: str) -> str:
    preview = pitch_preview[:400] + ("…" if len(pitch_preview) > 400 else "")
    return (
        f"📬 <b>Direct Pitch Submission</b>\n"
        f"Reference: <code>{reference}</code>\n\n"
        f"<b>Name:</b> {name}\n"
        f"<b>Contact:</b> {contact_type} — {contact_value}\n\n"
        f"<b>Pitch:</b>\n{preview}"
    )
