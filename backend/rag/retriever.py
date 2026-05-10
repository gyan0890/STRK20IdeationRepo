from __future__ import annotations
from config import get_settings

_vectorstore = None

def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        from langchain_community.vectorstores import FAISS
        from langchain_huggingface import HuggingFaceEmbeddings
        s = get_settings()
        embeddings = HuggingFaceEmbeddings(model_name=s.embedding_model)
        _vectorstore = FAISS.load_local(
            s.vectorstore_path, embeddings,
            allow_dangerous_deserialization=True,
        )
    return _vectorstore

def search_docs(query: str, top_k: int = 5) -> list[dict]:
    try:
        vs = get_vectorstore()
        results = vs.similarity_search_with_score(query, k=top_k)
        return [
            {"text": doc.page_content, "source": doc.metadata.get("source", ""), "score": float(score)}
            for doc, score in results
        ]
    except Exception:
        return [{"text": "Vector store not yet initialized. Run rag/ingest.py first.", "source": "", "score": 0.0}]
