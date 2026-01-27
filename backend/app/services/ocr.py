import asyncio
from concurrent.futures import ThreadPoolExecutor
import fitz  # PyMuPDF

try:
    from rapidocr_onnxruntime import RapidOCR
    # Attempt GPU
    try:
        ocr_engine = RapidOCR(det_use_cuda=True, cls_use_cuda=True, rec_use_cuda=True)
        print("[PHANTOM] OCR Engine: GPU Acceleration ENABLED (RTX 4060 Mode) 🚀")
    except Exception as e:
        print(f"[PHANTOM] OCR Engine: Fallback to CPU. ({e})")
        ocr_engine = RapidOCR()
except ImportError as e:
    print(f"[PHANTOM] RapidOCR Import Failed: {e}")
    ocr_engine = None

executor = ThreadPoolExecutor(max_workers=4)

def extract_text_from_file_sync(file_content: bytes, filename: str) -> str:
    extracted_text = ""
    try:
        if filename.lower().endswith(".pdf"):
            with fitz.open(stream=file_content, filetype="pdf") as doc:
                # Process all pages
                target_pages = range(doc.page_count)
                for page_num in target_pages:
                    page = doc.load_page(page_num)
                    text = page.get_text()
                    # Skip OCR if text layer exists (>15 chars)
                    if len(text.strip()) > 15:
                        extracted_text += f"\n--- Page {page_num+1} ---\n{text}\n"
                        continue
                    
                    # OCR Fallback
                    if ocr_engine:
                        pix = page.get_pixmap(dpi=72)
                        result, _ = ocr_engine(pix.tobytes("png"))
                        if result:
                            extracted_text += f"\n--- Page {page_num+1} (OCR) ---\n" + "\n".join([line[1] for line in result])
                            
        elif filename.lower().endswith(('.png', '.jpg', '.jpeg')) and ocr_engine:
            result, _ = ocr_engine(file_content)
            if result: extracted_text = "\n".join([line[1] for line in result])
        else:
            extracted_text = file_content.decode('utf-8', errors='ignore')
    except Exception as e:
        return f"[OCR ERROR] {str(e)}"
    return extracted_text

async def extract_text_from_file(file_content: bytes, filename: str) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, extract_text_from_file_sync, file_content, filename)
