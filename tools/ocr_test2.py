"""OCR test v2: extract the native embedded screenshots, upscale, whiten watermark, OCR."""
import sys
import numpy as np
import pymupdf
from rapidocr_onnxruntime import RapidOCR

PDF = r"C:\Users\Zaira Torres\Downloads\CCNA_200_301_AGO 2023.pdf"
pages = [int(a) for a in sys.argv[1:]] or [2]

engine = RapidOCR()
doc = pymupdf.open(PDF)


def load(xref: int) -> np.ndarray:
    pix = pymupdf.Pixmap(doc, xref)
    if pix.n != 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    # 2x upscale with smooth interpolation helps small UI fonts
    pix = pymupdf.Pixmap(pix, pix.width * 2, pix.height * 2, None)
    return np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3).copy()


THRESH = int(__import__("os").environ.get("OCR_THRESH", "130"))


def clean(img: np.ndarray) -> np.ndarray:
    """Black text on white: any pixel whose darkest channel is low (black/red/green ink) -> black."""
    mn = img.min(axis=2)
    bw = np.where(mn < THRESH, 0, 255).astype(np.uint8)
    return np.stack([bw, bw, bw], axis=2)


for p in pages:
    for k, info in enumerate(doc[p].get_images()):
        img = clean(load(info[0]))
        result, _ = engine(img)
        print(f"\n===== PAGE {p} IMG {k} =====")
        for box, text, score in result or []:
            print(f"{int(box[0][1]):5d} {int(box[0][0]):5d} {score:.2f} | {text}")
