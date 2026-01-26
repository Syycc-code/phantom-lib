import sys
print(f"Python Version: {sys.version}")

try:
    import onnxruntime
    print(f"ONNX Runtime Version: {onnxruntime.__version__}")
    print("✅ ONNX Runtime loaded successfully!")
except ImportError as e:
    print(f"❌ Failed to load ONNX Runtime: {e}")
    print("Diagnosis: You are likely missing the Microsoft Visual C++ Redistributable.")

try:
    from rapidocr_onnxruntime import RapidOCR
    engine = RapidOCR()
    print("✅ RapidOCR engine initialized successfully!")
except Exception as e:
    print(f"❌ Failed to initialize RapidOCR: {e}")
