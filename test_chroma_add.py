import sys
import os
import chromadb
from chromadb.config import Settings

path = os.path.join(os.getcwd(), "backend", "uploads", "chroma_test")
os.makedirs(path, exist_ok=True)
print(f"Testing Chroma at {path}", flush=True)

try:
    client = chromadb.PersistentClient(path=path, settings=Settings(anonymized_telemetry=False, allow_reset=True))
    collection = client.get_or_create_collection("test_col")
    print("Collection created.", flush=True)
    
    print("Adding item...", flush=True)
    collection.add(
        documents=["This is a test"],
        embeddings=[[0.1] * 384], # Dummy embedding
        metadatas=[{"source": "test"}],
        ids=["test_1"]
    )
    print("Item added.", flush=True)
    
    count = collection.count()
    print(f"Count: {count}", flush=True)
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc()
