"""
诊断后端崩溃问题的脚本
"""
import sys
import os

print("=" * 60)
print("Phantom Library Backend Crash Diagnosis")
print("=" * 60)

# 1. Check Python version
print(f"\n[1] Python Version: {sys.version}")

# 2. Check available memory
try:
    import psutil
    mem = psutil.virtual_memory()
    print(f"\n[2] System Memory:")
    print(f"    Total: {mem.total / 1024 / 1024 / 1024:.2f} GB")
    print(f"    Available: {mem.available / 1024 / 1024 / 1024:.2f} GB")
    print(f"    Used: {mem.percent}%")
    
    if mem.available < 2 * 1024 * 1024 * 1024:  # Less than 2GB
        print("    ⚠️  WARNING: Low available memory! This may cause crashes.")
except ImportError:
    print("\n[2] psutil not installed - cannot check memory")
    print("    Install with: pip install psutil")

# 3. Check RAG dependencies
print("\n[3] RAG Dependencies:")
try:
    import chromadb
    print(f"    ✓ chromadb: {chromadb.__version__}")
except ImportError as e:
    print(f"    ✗ chromadb: NOT INSTALLED ({e})")

try:
    import sentence_transformers
    print(f"    ✓ sentence-transformers: {sentence_transformers.__version__}")
except ImportError as e:
    print(f"    ✗ sentence-transformers: NOT INSTALLED ({e})")

try:
    import torch
    print(f"    ✓ torch: {torch.__version__}")
    print(f"    CUDA available: {torch.cuda.is_available()}")
except ImportError as e:
    print(f"    ✗ torch: NOT INSTALLED ({e})")

# 4. Check ChromaDB path
print("\n[4] ChromaDB Status:")
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "uploads")
chroma_path = os.path.join(uploads_dir, "chroma_db_v2")

if os.path.exists(chroma_path):
    print(f"    Path: {chroma_path}")
    print(f"    ✓ Database exists")
    
    # Check size
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(chroma_path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            total_size += os.path.getsize(fp)
    
    print(f"    Size: {total_size / 1024 / 1024:.2f} MB")
    
    if total_size > 500 * 1024 * 1024:  # Over 500MB
        print("    ⚠️  WARNING: Large database size may cause memory issues")
else:
    print(f"    ✗ Database not found at: {chroma_path}")

# 5. Test embedding model loading
print("\n[5] Testing Embedding Model:")
try:
    from sentence_transformers import SentenceTransformer
    print("    Loading model (this may take a moment)...")
    os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
    
    model_name = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
    embedder = SentenceTransformer(model_name, device='cpu')
    
    # Test encoding
    test_text = ["This is a test sentence"]
    embeddings = embedder.encode(test_text, show_progress_bar=False)
    
    print(f"    ✓ Model loaded successfully")
    print(f"    Model device: cpu")
    print(f"    Embedding dimension: {len(embeddings[0])}")
    
    del embedder
    import gc
    gc.collect()
    
except Exception as e:
    print(f"    ✗ Model loading failed: {e}")
    import traceback
    traceback.print_exc()

# 6. Check backend log
print("\n[6] Recent Backend Log:")
log_path = os.path.join(os.path.dirname(__file__), "backend.log")
if os.path.exists(log_path):
    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        print(f"    Total lines: {len(lines)}")
        print("    Last 10 lines:")
        for line in lines[-10:]:
            print(f"      {line.rstrip()}")
else:
    print(f"    ✗ Log not found at: {log_path}")

# 7. Recommendations
print("\n" + "=" * 60)
print("RECOMMENDATIONS:")
print("=" * 60)

recommendations = []

# Check memory
try:
    if mem.available < 2 * 1024 * 1024 * 1024:
        recommendations.append("• Close other applications to free up memory")
        recommendations.append("• Reduce batch size in rag.py (already set to 1)")
except:
    pass

# Check if crash occurs
recommendations.append("• Monitor Task Manager during upload to see if Python crashes")
recommendations.append("• Try uploading a smaller PDF first to test")
recommendations.append("• Check Windows Event Viewer for crash logs")
recommendations.append("• Consider disabling RAG temporarily if crashes persist")

for rec in recommendations:
    print(rec)

print("\n" + "=" * 60)
print("Diagnosis complete!")
print("=" * 60)
