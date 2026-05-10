from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text, DateTime
from datetime import datetime, timezone
from config import get_settings

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class PitchRecord(Base):
    __tablename__ = "pitches"

    pitch_id:    Mapped[str]           = mapped_column(String, primary_key=True)
    status:      Mapped[str]           = mapped_column(String, default="processing")
    pitch_text:  Mapped[str | None]    = mapped_column(Text, nullable=True)
    result_json: Mapped[str | None]    = mapped_column(Text, nullable=True)
    agents_json: Mapped[str | None]    = mapped_column(Text, nullable=True)
    created_at:  Mapped[datetime]      = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class SubmissionRecord(Base):
    __tablename__ = "submissions"

    submission_id: Mapped[str]      = mapped_column(String, primary_key=True)
    pitch_id:      Mapped[str]      = mapped_column(String)
    reference:     Mapped[str]      = mapped_column(String)
    name:          Mapped[str]      = mapped_column(String)
    contact_type:  Mapped[str]      = mapped_column(String)
    contact_value: Mapped[str]      = mapped_column(String)
    created_at:    Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class DirectSubmissionRecord(Base):
    """Pitch submitted directly (no AI analysis) — via web form or Telegram bot."""
    __tablename__ = "direct_submissions"

    submission_id: Mapped[str]      = mapped_column(String, primary_key=True)
    reference:     Mapped[str]      = mapped_column(String)
    name:          Mapped[str]      = mapped_column(String)
    contact_type:  Mapped[str]      = mapped_column(String)
    contact_value: Mapped[str]      = mapped_column(String)
    pitch_text:    Mapped[str]      = mapped_column(Text)
    source:        Mapped[str]      = mapped_column(String, default="web")  # "web" | "telegram"
    created_at:    Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
