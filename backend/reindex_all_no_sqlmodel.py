import sys
import os
import sqlite3
import asyncio

# Setup path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Import services that don't depend on SQLModel
from app.core.config import settings
from app.services.ocr import extract_text_from_file_sync
from app.services.rag import index_document

def reindex_all():
    print("=== PHANTOM LIBRARY RE-INDEXER (No SQLModel) ===")
    db_path = settings.DB_FILE
    print(f"Database: {db_path}")
    print(f"Uploads Dir: {settings.UPLOAD_DIR}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if table exists
    try:
        cursor.execute("SELECT id, title, file_path FROM paper")
        papers = cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"[ERROR] Could not query paper table: {e}")
        return

    print(f"Found {len(papers)} papers in database.")
    
    success_count = 0
    fail_count = 0
    
    for p_id, p_title, p_file_path in papers:
        print(f"\nProcessing ID {p_id}: {p_title}")
        
        file_path = p_file_path
        
        # Path Resolution Logic
        if not os.path.isabs(file_path):
            possible_path_1 = os.path.abspath(os.path.join(os.getcwd(), "backend", file_path))
            possible_path_2 = os.path.join(settings.UPLOAD_DIR, os.path.basename(file_path))
            
            if os.path.exists(possible_path_1):
                file_path = possible_path_1
            elif os.path.exists(possible_path_2):
                file_path = possible_path_2
            else:
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
            # Note: extract_text_from_file_sync returns (full_text, chunks)
            # ocr.py was modified to disable RapidOCR, so it should be safe.
            full_text, chunks = extract_text_from_file_sync(content, os.path.basename(file_path))
            
            if not chunks:
                print(f"  - [WARN] No text extracted.")
                fail_count += 1
                continue
                
            print(f"  - Indexing {len(chunks)} chunks...")
            index_document(chunks, str(p_id))
            success_count += 1
            print("  - [OK] Indexed.")
            
        except Exception as e:
            print(f"  - [ERROR] Failed: {e}")
            fail_count += 1
            import traceback
            traceback.print_exc()
            
    conn.close()
    print(f"\n=== COMPLETE ===")
    print(f"Success: {success_count}")
    print(f"Failed: {fail_count}")

if __name__ == "__main__":
    reindex_all()
