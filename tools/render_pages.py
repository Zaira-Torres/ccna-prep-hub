"""Render selected PDF pages to PNG for visual inspection."""
import sys
import pymupdf

PDF = r"C:\Users\Zaira Torres\Downloads\CCNA_200_301_AGO 2023.pdf"
OUT = sys.argv[1]
pages = [int(a) for a in sys.argv[2:]]

doc = pymupdf.open(PDF)
for p in pages:
    pix = doc[p].get_pixmap(dpi=90)
    pix.save(f"{OUT}/page_{p:03d}.png")
    print("saved", p, pix.width, pix.height)
