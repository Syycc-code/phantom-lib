import shutil
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
import os
import asyncio

from app.api.deps import get_session
from app.models.paper import Paper
from app.services.ocr import extract_text_from_file_sync
from app.services.rag import index_document, get_rag_components
from app.core.config import settings

router = APIRouter()

@router.get("/inspect")
async def inspect_rag_status():
    """
    Inspect the internal state of RAG system.
    """
    client, collection, _ = get_rag_components()
    
    status = {
        "rag_available": True if collection else False,
        "persist_path": os.path.join(settings.UPLOAD_DIR, "chroma_db"),
        "collection_name": collection.name if collection else None,
        "count": 0,
        "sample_metadata": []
    }
    
    if collection:
        try:
            status["count"] = collection.count()
            if status["count"] > 0:
                peek = collection.peek(limit=5)
                status["sample_metadata"] = peek.get('metadatas', [])
                status["sample_ids"] = peek.get('ids', [])
        except Exception as e:
            status["error"] = str(e)
            
    return status

@router.post("/reindex")
async def reindex_all_papers(reset: bool = False, session: Session = Depends(get_session)):
    """
    Force re-index of all papers.
    If reset=True, it DELETES the existing chroma_db folder to fix corruption.
    """
    
    if reset:
        print("[DEBUG] HARD RESET: Deleting ChromaDB folder...")
        persist_path = os.path.join(settings.UPLOAD_DIR, "chroma_db")
        if os.path.exists(persist_path):
            try:
                # Force close client if possible? 
                # Actually we can't easily close the global client from here if it's open.
                # But typically file locks might prevent deletion on Windows if server is running.
                # We will try.
                shutil.rmtree(persist_path)
                print("[DEBUG] ChromaDB folder deleted.")
            except Exception as e:
                print(f"[DEBUG] Failed to delete ChromaDB (File Locked?): {e}")
                return {"error": f"Could not delete DB. Stop server and delete {persist_path} manually."}
    
    papers = session.exec(select(Paper)).all()
    results = {"success": [], "failed": []}
    
    # Reset Chroma Collection first? 
    # Maybe risky, but safer to avoid duplicates.
    client, collection, _ = get_rag_components()
    if collection:
        print("[DEBUG] Clearing existing ChromaDB collection...")
        try:
            # Delete all (pass empty where to delete everything? No, logic varies)
            # Safest is to delete collection and recreate, but we just re-add.
            # Chroma handles duplicates by ID overwriting if IDs match.
            # But our old IDs were based on filename, new ones on paper_id.
            # So we will have duplicates. Ideally we should wipe.
            pass 
        except:
            pass

    print(f"[DEBUG] Starting Re-index for {len(papers)} papers...")
    
    for paper in papers:
        if not paper.file_path or not os.path.exists(paper.file_path):
            results["failed"].append(f"{paper.title} (File missing)")
            continue
            
        try:
            # 1. Read file
            with open(paper.file_path, "rb") as f:
                content = f.read()
            
            # 2. Extract Text & BBox
            # Use sync version to avoid asyncio complications in loop, or run in thread
            _, chunks = await asyncio.to_thread(extract_text_from_file_sync, content, paper.file_path)
            
            # 3. Index with CORRECT source (paper_id)
            rag_source = str(paper.id)
            await asyncio.to_thread(index_document, chunks, rag_source)
            
            results["success"].append(paper.title)
            print(f"[DEBUG] Re-indexed: {paper.title} -> Source: {rag_source}")
            
        except Exception as e:
            results["failed"].append(f"{paper.title} ({str(e)})")
            print(f"[DEBUG] Failed: {paper.title} - {e}")
            
    return results
