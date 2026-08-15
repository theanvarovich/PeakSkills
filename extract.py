from pypdf import PdfReader
with open("req.txt", "w", encoding="utf-8") as f:
    f.write('\n'.join(p.extract_text() for p in PdfReader('MVP_PRODUCT_PATH.pdf').pages))
