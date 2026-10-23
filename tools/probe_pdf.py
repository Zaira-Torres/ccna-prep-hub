"""Inspect the CCNA PDF: page count, text density, images, and sample text."""
import sys
import fitz  # PyMuPDF

PDF = r"C:\Users\Zaira Torres\Downloads\CCNA_200_301_AGO 2023.pdf"

doc = fitz.open(PDF)
print("pages:", doc.page_count)
print("metadata:", doc.metadata)

total_chars = 0
img_pages = 0
for i, page in enumerate(doc):
    t = page.get_text()
    total_chars += len(t)
    if page.get_images():
        img_pages += 1
print("total chars:", total_chars, "pages with images:", img_pages)

sample = [int(a) for a in sys.argv[1:]] or [0, 1, 2, 5, 10, 50]
for p in sample:
    if p < doc.page_count:
        print(f"\n===== PAGE {p} =====")
        print(doc[p].get_text()[:3000])
