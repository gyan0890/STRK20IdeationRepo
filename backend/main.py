from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.db import init_db
from routers.pitch import router as pitch_router
from routers.submit import router as submit_router
from routers.telegram import router as telegram_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="STRK20 Pitch Analyzer", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pitch_router)
app.include_router(submit_router)
app.include_router(telegram_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
