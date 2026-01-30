import sys
import os
import chromadb
from chromadb.config import Settings

sys.path.append(os.path.join(os.getcwd(), "backend"))
from app.core.config import settings

persist_path = os.path.join(settings.UPLOAD_DIR, "chroma_db")
print(f"Checking ChromaDB at: {persist_path}")

try:
    client = chromadb.PersistentClient(path=persist_path, settings=Settings(anonymized_telemetry=False))
    collection = client.get_collection("phantom_knowledge")
    count = collection.count()
    print(f"Total items in collection: {count}")
except Exception as e:
    print(f"Error checking DB: {e}")
