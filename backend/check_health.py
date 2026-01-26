import sys
import os
import time

print("="*50)
print("PHANTOM BACKEND HEALTH CHECK")
print("="*50)

# 1. Check Imports
print("[1/4] Checking dependencies...")
try:
    import fastapi
    import uvicorn
    import rapidocr_onnxruntime
    print("  [OK] Core dependencies OK")
except ImportError as e:
    print(f"  [FAIL] Missing dependency: {e}")
    sys.exit(1)

# 2. Check RAG availability
print("[2/4] Checking RAG status...")
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    print("  [OK] RAG libraries installed")
except ImportError:
    print("  [WARN] RAG libraries missing (Feature will be disabled)")

# 3. Check App Import (Syntax Check)
print("[3/4] Loading application (may take time)...")
start_time = time.time()
try:
    os.environ["DEEPSEEK_API_KEY"] = "mock-key"
    from main import app, RAG_AVAILABLE
    print(f"  [OK] Application loaded in {time.time() - start_time:.2f}s")
    print(f"  [INFO] RAG Feature: {'Enabled' if RAG_AVAILABLE else 'Disabled'}")
except Exception as e:
    print(f"  [FAIL] Application load failed: {e}")
    # Print full traceback for debugging
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 4. Check Config
print("[4/4] Verifying configurations...")
from main import executor
try:
    if executor._max_workers >= 4:
        print(f"  [OK] Thread pool optimized ({executor._max_workers} workers)")
    else:
        print(f"  [WARN] Thread pool small ({executor._max_workers} workers)")
        
    print("="*50)
    print("SYSTEM READY! You can start the server now.")
    print("="*50)
except Exception as e:
    print(f"  [WARN] Config check warning: {e}")
