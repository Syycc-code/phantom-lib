import os
import sys

print("1. Start")
try:
    import chromadb
    from chromadb.config import Settings
    print("2. Chroma imported")
except ImportError as e:
    print(f"Error importing chroma: {e}")

try:
    from sentence_transformers import SentenceTransformer
    print("3. SentenceTransformer imported")
except ImportError as e:
    print(f"Error importing st: {e}")

def test_crash():
    print("4. Init Embedder")
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cpu')
    print("5. Embedder Loaded")
    
    print("6. Init Chroma")
    # Use a temp dir to avoid locking issues
    persist_path = os.path.join(os.getcwd(), "backend", "uploads", "chroma_debug")
    os.makedirs(persist_path, exist_ok=True)
    
    client = chromadb.PersistentClient(
        path=persist_path,
        settings=Settings(anonymized_telemetry=False, allow_reset=True)
    )
    print("7. Chroma Client Created")
    
    col = client.get_or_create_collection("debug_collection")
    print("8. Collection Created")
    
    print("9. Generating Embedding")
    vec = model.encode(["test"]).tolist()
    print("10. Embedding Generated")
    
    print("11. Adding to DB")
    col.add(
        documents=["test"],
        embeddings=vec,
        ids=["test_id"],
        metadatas=[{"source": "test"}]
    )
    print("12. Success")

if __name__ == "__main__":
    test_crash()
