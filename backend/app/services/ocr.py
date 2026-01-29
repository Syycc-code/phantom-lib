import asyncio
from concurrent.futures import ThreadPoolExecutor
import fitz  # PyMuPDF
from typing import Tuple, List, Dict, Any

try:
    # from rapidocr_onnxruntime import RapidOCR
    # Attempt GPU
    # try:
    #     ocr_engine = RapidOCR(det_use_cuda=True, cls_use_cuda=True, rec_use_cuda=True)
    #     print("[PHANTOM] OCR Engine: GPU Acceleration ENABLED (RTX 4060 Mode) 🚀")
    # except Exception as e:
    #     print(f"[PHANTOM] OCR Engine: Fallback to CPU. ({e})")
    #     ocr_engine = RapidOCR()
    print("[PHANTOM] OCR Engine: DISABLED (Segfault Prevention)")
    ocr_engine = None
except ImportError as e:
    print(f"[PHANTOM] RapidOCR Import Failed: {e}")
    ocr_engine = None

executor = ThreadPoolExecutor(max_workers=4)

def extract_text_from_file_sync(file_content: bytes, filename: str) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Returns:
        full_text: concatenated string for general use
        chunks: list of dicts {text, page, bbox} for RAG indexing
    """
    extracted_text = ""
    chunks = []
    
    try:
        if filename.lower().endswith(".pdf"):
            with fitz.open(stream=file_content, filetype="pdf") as doc:
                # Process ALL pages for indexing, but limit text preview if needed
                # For RAG, we want full content.
                
                for page_num, page in enumerate(doc):
                    # 1. Try extracting text blocks with coordinates
                    blocks = page.get_text("blocks")
                    page_has_text = False
                    
                    if blocks:
                        for b in blocks:
                            # block format: (x0, y0, x1, y1, "text", block_no, block_type)
                            if b[6] == 0: # 0 = text
                                x0, y0, x1, y1, text, _, _ = b
                                clean_text = text.strip()
                                if len(clean_text) > 1:
                                    chunks.append({
                                        "text": clean_text,
                                        "page": page_num + 1, # 1-based index
                                        "bbox": [x0, y0, x1, y1]
                                    })
                                    extracted_text += clean_text + "\n\n"
                                    page_has_text = True
                    
                    # 2. OCR Fallback if page is empty image
                    if not page_has_text and ocr_engine:
                        # Note: RapidOCR doesn't give PDF coordinates easily without complex mapping.
                        # For now, we treat OCR content as page-level chunk without precise bbox.
                        pix = page.get_pixmap(dpi=72)
                        result, _ = ocr_engine(pix.tobytes("png"))
                        if result:
                            ocr_text = "\n".join([line[1] for line in result])
                            if ocr_text.strip():
                                chunks.append({
                                    "text": ocr_text,
                                    "page": page_num + 1,
                                    "bbox": [0, 0, page.rect.width, page.rect.height] # Full page bbox
                                })
                                extracted_text += f"\n--- Page {page_num+1} (OCR) ---\n{ocr_text}\n"

        elif filename.lower().endswith(('.png', '.jpg', '.jpeg')) and ocr_engine:
            result, _ = ocr_engine(file_content)
            if result: 
                text = "\n".join([line[1] for line in result])
                extracted_text = text
                chunks.append({
                    "text": text,
                    "page": 1,
                    "bbox": [0, 0, 0, 0] # Unknown
                })
        else:
            extracted_text = file_content.decode('utf-8', errors='ignore')
            chunks.append({"text": extracted_text, "page": 1, "bbox": []})
            
    except Exception as e:
        print(f"[OCR ERROR] {str(e)}")
        return f"[OCR ERROR] {str(e)}", []
        
    return extracted_text, chunks

async def extract_text_from_file(file_content: bytes, filename: str) -> Tuple[str, List[Dict[str, Any]]]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, extract_text_from_file_sync, file_content, filename)
