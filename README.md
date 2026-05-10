# STRK20 Pitch Analyzer

Multi-agent AI pitch evaluation for the Starknet ecosystem.

## Quick start

```bash
# 1. Copy env and fill in your API keys
cp .env.example .env

# 2. (Optional) Build the RAG vector store from STRK20 docs
#    Place strk20_whitepaper.pdf in backend/rag/documents/
cd backend
python -m rag.ingest

# 3. Run with Docker Compose
cd ..
docker-compose up

# OR run manually:
# Terminal 1 — Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Terminal 2 — Frontend (requires Node >= 20.9)
cd frontend && npm install && npm run dev
```

Open http://localhost:3000

## Architecture

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS v4 — dark theme matching strk20.starknet.io
- **Backend**: FastAPI + SQLite — async, background task execution
- **Agents**: CrewAI — Business, Technical (RAG-enabled), Market, + Colleague external API
- **RAG**: FAISS + sentence-transformers — STRK20 whitepaper + Starknet docs
- **Scoring**: 6 parameters, weighted aggregation, conflict detection

## Environment variables

See `.env.example`. Key vars:

| Variable | Description |
|----------|-------------|
| `LLM_API_KEY` | Venice AI or Near AI API key |
| `LLM_BASE_URL` | Provider endpoint (must be OpenAI-compatible) |
| `LLM_MODEL` | Model name, e.g. `llama-3.3-70b` |
| `COLLEAGUE_API_URL` | Optional external agent endpoint |

## RAG setup

Place documents in `backend/rag/documents/`:
- `strk20_whitepaper.pdf` — from https://eprint.iacr.org/2026/474
- `starknet_docs/` — Markdown exports from docs.starknet.io

Then run: `cd backend && python -m rag.ingest`
