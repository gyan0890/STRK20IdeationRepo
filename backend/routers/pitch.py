import asyncio
import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.pitch import PitchInput, PitchCreateResponse, PitchStatusResponse, PitchResultResponse, AgentStatusItem
from services.db import get_db, PitchRecord
from services.parser import extract_text

router = APIRouter(prefix="/api/pitch", tags=["pitch"])

# In-memory agent status store (keyed by pitch_id)
_agent_status: dict[str, dict] = {}

def _default_agents():
    return {a: {"status": "pending", "score": None} for a in ["colleague", "business", "technical", "market"]}

async def _run_analysis(pitch_id: str, pitch_text: str, db_url: str):
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy import update
    engine = create_async_engine(db_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    def update_agent(agent_id, status, score):
        if pitch_id in _agent_status:
            _agent_status[pitch_id][agent_id] = {"status": status, "score": score}

    for agent_id in ["colleague", "business", "technical", "market"]:
        update_agent(agent_id, "analyzing", None)

    try:
        from agents.orchestrator import run_analysis
        result = await asyncio.to_thread(run_analysis, pitch_text, update_agent)

        async with Session() as session:
            await session.execute(
                update(PitchRecord)
                .where(PitchRecord.pitch_id == pitch_id)
                .values(status="completed", result_json=json.dumps(result), agents_json=json.dumps(_agent_status.get(pitch_id, {})))
            )
            await session.commit()
    except Exception as e:
        async with Session() as session:
            await session.execute(
                update(PitchRecord)
                .where(PitchRecord.pitch_id == pitch_id)
                .values(status="failed", agents_json=json.dumps(_agent_status.get(pitch_id, {})))
            )
            await session.commit()
    finally:
        await engine.dispose()


@router.post("", response_model=PitchCreateResponse)
async def submit_pitch(
    body: PitchInput,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    pitch_text = extract_text(body.pitch_text, body.file_base64, body.file_type)
    if not pitch_text:
        raise HTTPException(400, "Empty pitch text after parsing")

    pitch_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    record = PitchRecord(
        pitch_id=pitch_id,
        status="processing",
        pitch_text=pitch_text,
        created_at=now,
    )
    db.add(record)
    await db.commit()

    _agent_status[pitch_id] = _default_agents()

    from config import get_settings
    background_tasks.add_task(_run_analysis, pitch_id, pitch_text, get_settings().database_url)

    return PitchCreateResponse(
        pitch_id=pitch_id,
        status="processing",
        created_at=now.isoformat(),
    )


@router.get("/{pitch_id}/status", response_model=PitchStatusResponse)
async def get_status(pitch_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PitchRecord).where(PitchRecord.pitch_id == pitch_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Pitch not found")

    agents_raw = _agent_status.get(pitch_id, _default_agents())
    agents = {k: AgentStatusItem(**v) for k, v in agents_raw.items()}

    return PitchStatusResponse(
        pitch_id=pitch_id,
        status=record.status,
        agents=agents,
        result=None,
    )


@router.get("/{pitch_id}", response_model=PitchResultResponse)
async def get_result(pitch_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PitchRecord).where(PitchRecord.pitch_id == pitch_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Pitch not found")
    if record.status != "completed":
        raise HTTPException(400, f"Analysis not complete yet (status: {record.status})")
    if not record.result_json:
        raise HTTPException(500, "Result data missing")

    data = json.loads(record.result_json)
    return PitchResultResponse(
        pitch_id=pitch_id,
        status=record.status,
        overall_score=data["overall_score"],
        parameters=data["parameters"],
        agent_scores=data.get("agent_scores", {}),
        conflicts=data.get("conflicts", []),
        created_at=record.created_at.isoformat(),
    )
