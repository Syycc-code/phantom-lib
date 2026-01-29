
import sys
import os
# Fix imports for running as script
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
import chromadb
from chromadb.config import Settings as ChromaSettings

def inspect_chroma():
    persist_path = os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR, "chroma_db")
    print(f"Checking ChromaDB at: {persist_path}")
    
    try:
        client = chromadb.PersistentClient(
            path=persist_path,
            settings=ChromaSettings(anonymized_telemetry=False, allow_reset=True)
        )
        col = client.get_collection("phantom_knowledge")
        
        count = col.count()
        print(f"Total documents in collection: {count}")
        
        if count > 0:
            peek = col.peek(limit=5)
            print("\n--- Metadata Sample ---")
            for meta in peek['metadatas']:
                print(meta)
                
            print("\n--- ID Sample ---")
            print(peek['ids'])
    except Exception as e:
        print(f"Error inspecting Chroma: {e}")

if __name__ == "__main__":
    inspect_chroma()
