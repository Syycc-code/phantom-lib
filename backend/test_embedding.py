import sys
import os
from sentence_transformers import SentenceTransformer

def test_embed():
    print("Loading model...")
    try:
        print("Trying small model: all-MiniLM-L6-v2")
        model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cpu')
        print("Model loaded.")
        
        text = "Test sentence."
        print(f"Encoding '{text}'...")
        vec = model.encode([text])
        print(f"Vector shape: {vec.shape}")
        print("Success.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_embed()
