import sys
import os
import sqlite3
import traceback

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

print("Starting Reindexer V2...", flush=True)

# Setup path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(current_dir) # Add backend/ to path so app.x works if run from backend/
sys.path.append(parent_dir)  # Add root to path so backend.app works? 

# Ideally we want 'backend' to be the root for imports like 'from app.x import y'
# If we run from root, we need to add 'backend' to sys.path
if os.path.basename(os.getcwd()) == "phantom-lib":
    sys.path.append(os.path.join(os.getcwd(), "backend"))

print(f"CWD: {os.getcwd()}", flush=True)

try:
    from app.core.config import settings
    from app.services.ocr import extract_text_from_file_sync
    from app.services.rag import index_document, get_rag_components
    
    # Initialize RAG components explicitly
    print("Initializing RAG components...", flush=True)
    client, collection, embedder = get_rag_components()
    if not collection:
        print("[ERROR] RAG Collection not initialized.", flush=True)
        sys.exit(1)
    
    db_path = settings.DB_FILE
    print(f"Database Path: {db_path}", flush=True)
    
    if not os.path.exists(db_path):
        print(f"[ERROR] Database not found at {db_path}", flush=True)
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, title, file_path FROM paper")
    papers = cursor.fetchall()
    
    print(f"Found {len(papers)} papers.", flush=True)
    
    for p_id, p_title, p_file_path in papers:
        print(f"Processing: {p_title}", flush=True)
        
        # Path resolution
        if os.path.isabs(p_file_path):
            file_path = p_file_path
        else:
            # Try multiple bases
            candidates = [
                os.path.join(settings.UPLOAD_DIR, os.path.basename(p_file_path)),
                os.path.abspath(os.path.join(current_dir, p_file_path)),
                os.path.abspath(p_file_path)
            ]
            file_path = None
            for c in candidates:
                if os.path.exists(c):
                    file_path = c
                    break
            
            if not file_path:
                print(f"  [SKIP] File not found. Tried: {candidates}", flush=True)
                continue
        
        print(f"  File: {file_path}", flush=True)
        
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            
            full_text, chunks = extract_text_from_file_sync(content, os.path.basename(file_path))
            
            if chunks:
                print(f"  Indexing {len(chunks)} chunks...", flush=True)
                index_document(chunks, str(p_id))
                print("  [OK] Done.", flush=True)
            else:
                print("  [WARN] No text extracted.", flush=True)
                
        except Exception as e:
            print(f"  [ERROR] {e}", flush=True)
            traceback.print_exc()

    print("Reindexing Complete.", flush=True)

except Exception as e:
    print(f"Fatal Error: {e}", flush=True)
    traceback.print_exc()
