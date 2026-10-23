"""Step 1 - OCR every screenshot embedded in the CCNA PDF and cache the results.

Output: tools/cache/ocr/NNNN.json  (one per screenshot, resumable)
Each file: {"idx", "page", "xref", "w", "h", "lines": [[y, x, x2, y2, score, text], ...]}
Coordinates are in native screenshot pixels (1432x805).

Usage:  python tools/extract_pdf.py [workers]
"""
import json
import os
import sys
import time
from multiprocessing import Pool

import numpy as np
import pymupdf

PDF = r"C:\Users\Zaira Torres\Downloads\CCNA_200_301_AGO 2023.pdf"
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "cache", "ocr")
SCALE = 1
CROP_TOP, CROP_BOTTOM = 45, 725  # drop window title bar and bottom toolbar (native px)

_engine = None
_doc = None


def list_images():
    doc = pymupdf.open(PDF)
    items = []
    for p in range(doc.page_count):
        for info in doc[p].get_images():
            items.append((len(items), p, info[0]))
    return items


def load(doc, xref):
    pix = pymupdf.Pixmap(doc, xref)
    if pix.n != 3 or pix.alpha:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    w, h = pix.width, pix.height
    if SCALE != 1:
        pix = pymupdf.Pixmap(pix, w * SCALE, h * SCALE, None)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3).copy()
    return img[CROP_TOP * SCALE: CROP_BOTTOM * SCALE], w, h


def clean(img):
    """Whiten the pastel watermark (light in every channel); keep black/red/green ink."""
    img[img.min(axis=2) > 140] = 255
    return img


def work(item):
    global _engine, _doc
    idx, page, xref = item
    path = os.path.join(OUT, f"{idx:04d}.json")
    if os.path.exists(path):
        return idx, "cached"
    if _engine is None:
        from rapidocr_onnxruntime import RapidOCR
        _engine = RapidOCR(intra_op_num_threads=4)
        _doc = pymupdf.open(PDF)
    img, w, h = load(_doc, xref)
    result, _ = _engine(clean(img))
    lines = []
    for box, text, score in result or []:
        xs = [pt[0] / SCALE for pt in box]
        ys = [pt[1] / SCALE + CROP_TOP for pt in box]
        lines.append([round(min(ys)), round(min(xs)), round(max(xs)), round(max(ys)), round(float(score), 3), text])
    lines.sort(key=lambda l: (l[0], l[1]))
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"idx": idx, "page": page, "xref": xref, "w": w, "h": h, "lines": lines}, f, ensure_ascii=False)
    return idx, "done"


def main():
    os.makedirs(OUT, exist_ok=True)
    workers = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    items = list_images()
    print(f"{len(items)} screenshots, {workers} workers", flush=True)
    t0 = time.time()
    with Pool(workers) as pool:
        for n, (idx, status) in enumerate(pool.imap_unordered(work, items), 1):
            if n % 10 == 0 or n == len(items):
                el = time.time() - t0
                print(f"{n}/{len(items)}  {el:.0f}s elapsed  ~{el / n * (len(items) - n):.0f}s left", flush=True)


if __name__ == "__main__":
    main()
