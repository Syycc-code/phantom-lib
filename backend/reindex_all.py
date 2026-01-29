import sys
import os
import asyncio

# Setup path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlmodel import Session, create_engine, select
from app.core.config import settings
from app.models.paper import Paper
from app.models.folder import Folder
from app.services.ocr import extract_text_from_file_sync
from app.services.rag import index_document

def reindex_all():
    print("=== PHANTOM LIBRARY RE-INDEXER ===")
    print(f"Database: {settings.SQLITE_URL}")
    print(f"Uploads Dir: {settings.UPLOAD_DIR}")
    
    engine = create_engine(settings.SQLITE_URL)
    
    with Session(engine) as session:
        papers = session.exec(select(Paper)).all()
        print(f"Found {len(papers)} papers in database.")
        
        success_count = 0
        fail_count = 0
        
        for paper in papers:
            print(f"\nProcessing ID {paper.id}: {paper.title}")
            
            # Resolve file path
            file_path = paper.file_path
            
            # Handle relative paths from legacy config
            if not os.path.isabs(file_path):
                # Try relative to backend root first
                possible_path_1 = os.path.abspath(os.path.join(os.getcwd(), "backend", file_path))
                # Try relative to uploads dir
                possible_path_2 = os.path.join(settings.UPLOAD_DIR, os.path.basename(file_path))
                
                if os.path.exists(possible_path_1):
                    file_path = possible_path_1
                elif os.path.exists(possible_path_2):
                    file_path = possible_path_2
                else:
                     # Try treating it as relative to CWD if running from backend folder?
                     # We assume running from root based on sys.path hack
                     possible_path_3 = os.path.abspath(file_path)
                     if os.path.exists(possible_path_3):
                         file_path = possible_path_3
            
            if not os.path.exists(file_path):
                print(f"[ERROR] File not found: {file_path}")
                fail_count += 1
                continue
                
            try:
                with open(file_path, "rb") as f:
                    content = f.read()
                
                print(f"  - Extracting text from {file_path}...")
                full_text, chunks = extract_text_from_file_sync(content, os.path.basename(file_path))
                
                if not chunks:
                    print(f"  - [WARN] No text extracted.")
                    fail_count += 1
                    continue
                    
                print(f"  - Indexing {len(chunks)} chunks...")
                # CRITICAL: Use paper.id as source
                index_document(chunks, str(paper.id))
                success_count += 1
                print("  - [OK] Indexed.")
                
            except Exception as e:
                print(f"  - [ERROR] Failed: {e}")
                fail_count += 1
                
        print(f"\n=== COMPLETE ===")
        print(f"Success: {success_count}")
        print(f"Failed: {fail_count}")

if __name__ == "__main__":
    reindex_all()
