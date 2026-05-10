"""
Standalone Telegram bot — run separately alongside the FastAPI server:
  uv run python telegram_bot.py

Users can message the bot directly with their pitch. The bot:
  1. Accepts text or file (PDF/PPTX)
  2. Asks for contact info
  3. Stores in DB and forwards to the SNF channel
"""
import asyncio
import logging
import os
import random
import string
import uuid
from dotenv import load_dotenv

load_dotenv()

from telegram import Update, Document
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    ConversationHandler, filters, ContextTypes,
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from services.telegram import send_telegram, format_direct_submission
from services.db import DirectSubmissionRecord

logging.basicConfig(level=logging.INFO)

WAITING_PITCH, WAITING_CONTACT = range(2)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./pitches.db")
engine = create_async_engine(DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)


def _ref() -> str:
    return "STRK-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(
        "👋 Welcome to the Starknet Foundation pitch inbox.\n\n"
        "Send me your pitch — text description, PDF, or deck — and we'll get back to you.\n\n"
        "What's your project about?"
    )
    return WAITING_PITCH


async def receive_pitch(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    msg = update.message

    if msg.document:
        # Store file_id so we can retrieve it; extract text later if needed
        ctx.user_data["pitch_text"] = f"[File: {msg.document.file_name}] {msg.caption or ''}"
        ctx.user_data["file_id"] = msg.document.file_id
    elif msg.text:
        ctx.user_data["pitch_text"] = msg.text
    else:
        await msg.reply_text("Please send text or a file (PDF/PPTX).")
        return WAITING_PITCH

    await msg.reply_text(
        "Got it! 🎯\n\nWhat's the best way to reach you?\n"
        "Reply with your email, Telegram handle (@username), or any other contact."
    )
    ctx.user_data["tg_username"] = f"@{msg.from_user.username}" if msg.from_user.username else str(msg.from_user.id)
    return WAITING_CONTACT


async def receive_contact(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    contact_value = update.message.text.strip()
    pitch_text    = ctx.user_data.get("pitch_text", "")
    tg_name       = ctx.user_data.get("tg_username", "unknown")
    reference     = _ref()

    contact_type = (
        "email"    if "@" in contact_value and "." in contact_value else
        "telegram" if contact_value.startswith("@") else
        "other"
    )

    async with Session() as session:
        record = DirectSubmissionRecord(
            submission_id=str(uuid.uuid4()),
            reference=reference,
            name=tg_name,
            contact_type=contact_type,
            contact_value=contact_value,
            pitch_text=pitch_text,
            source="telegram",
        )
        session.add(record)
        await session.commit()

    msg = format_direct_submission(
        name=tg_name,
        contact_type=contact_type,
        contact_value=contact_value,
        pitch_preview=pitch_text,
        reference=reference,
    )
    await send_telegram(msg)

    await update.message.reply_text(
        f"✅ Submitted! Your reference is <code>{reference}</code>\n\n"
        "The Starknet Foundation team will review your pitch and get back to you.",
        parse_mode="HTML",
    )
    ctx.user_data.clear()
    return ConversationHandler.END


async def cmd_cancel(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    ctx.user_data.clear()
    await update.message.reply_text("Cancelled. Send /start to begin again.")
    return ConversationHandler.END


def main() -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN not set in .env")

    app = Application.builder().token(token).build()

    conv = ConversationHandler(
        entry_points=[CommandHandler("start", cmd_start),
                      MessageHandler(filters.TEXT & ~filters.COMMAND, cmd_start)],
        states={
            WAITING_PITCH:   [MessageHandler(filters.TEXT | filters.Document.ALL, receive_pitch)],
            WAITING_CONTACT: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_contact)],
        },
        fallbacks=[CommandHandler("cancel", cmd_cancel)],
    )
    app.add_handler(conv)

    logging.info("Bot polling — Ctrl+C to stop")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
