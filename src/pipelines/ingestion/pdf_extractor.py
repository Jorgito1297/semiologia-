import os
import fitz  # PyMuPDF

def extract_pdf_text(filepath: str, page_range=None) -> str:
    """Extracts text from a PDF file using PyMuPDF."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"PDF file not found: {filepath}")
    doc = fitz.open(filepath)
    text_parts = []
    start = 0
    end = len(doc)
    if page_range:
        start = max(0, page_range[0] - 1)
        if len(page_range) > 1:
            end = min(len(doc), page_range[1])
    for i in range(start, end):
        text_parts.append(doc[i].get_text())
    return "\n\n".join(text_parts)
