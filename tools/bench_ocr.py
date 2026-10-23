"""Benchmark OCR settings (scale, threads) on a few screenshots to pick the fastest acceptable config."""
import time
import numpy as np
import pymupdf
from rapidocr_onnxruntime import RapidOCR

PDF = r"C:\Users\Zaira Torres\Downloads\CCNA_200_301_AGO 2023.pdf"
doc = pymupdf.open(PDF)
xrefs = [doc[p].get_images()[0][0] for p in (60, 61)]


def load(xref, scale):
    pix = pymupdf.Pixmap(doc, xref)
    if pix.n != 3 or pix.alpha:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    w, h = pix.width, pix.height
    if scale != 1:
        pix = pymupdf.Pixmap(pix, int(w * scale), int(h * scale), None)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3).copy()
    img[img.min(axis=2) > 140] = 255
    # crop: drop window title bar and bottom toolbar
    return img[int(45 * scale): int(725 * scale)]


for threads in (4, 8):
    eng = RapidOCR(intra_op_num_threads=threads)
    for scale in (1.0, 1.5, 2.0):
        t = time.time()
        n = 0
        txt = []
        for x in xrefs:
            res, _ = eng(load(x, scale))
            n += len(res or [])
            txt += [r[1] for r in (res or [])][:8]
        print(f"threads={threads} scale={scale}: {(time.time() - t) / len(xrefs):.1f}s/img, {n} boxes")
        print("   ", " | ".join(txt)[:300])
