"""Run once to build the FAISS vector store from STRK20 docs.

Usage:
    cd backend
    python -m rag.ingest
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from langchain_community.document_loaders import PyMuPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from config import get_settings

def ingest_documents():
    s = get_settings()
    all_docs = []

    pdf_path = "rag/documents/strk20_whitepaper.pdf"
    if os.path.exists(pdf_path):
        loader = PyMuPDFLoader(pdf_path)
        all_docs.extend(loader.load())
        print(f"Loaded PDF: {pdf_path}")

    md_dir = "rag/documents/starknet_docs"
    if os.path.isdir(md_dir) and any(os.scandir(md_dir)):
        loader = DirectoryLoader(md_dir, glob="**/*.md")
        all_docs.extend(loader.load())
        print(f"Loaded markdown docs from {md_dir}")

    if not all_docs:
        print("No documents found. Place strk20_whitepaper.pdf in rag/documents/ and run again.")
        return

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200,
        separators=["\n## ", "\n### ", "\n\n", "\n", " "],
    )
    chunks = splitter.split_documents(all_docs)

    embeddings = HuggingFaceEmbeddings(model_name=s.embedding_model)
    vectorstore = FAISS.from_documents(chunks, embeddings)
    vectorstore.save_local(s.vectorstore_path)
    print(f"Ingested {len(chunks)} chunks from {len(all_docs)} documents → saved to {s.vectorstore_path}")

if __name__ == "__main__":
    ingest_documents()
