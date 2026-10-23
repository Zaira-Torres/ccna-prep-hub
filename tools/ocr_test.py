"""OCR test: render pages at high DPI, lightly suppress the pastel watermark, run RapidOCR."""
import sys
import numpy as np
import pymupdf
from rapidocr_onnxruntime import RapidOCR

PDF = r"C:\Users\Zaira Torres\Downloads\CCNA_200_301_AGO 2023.pdf"
pages = [int(a) for a in sys.argv[1:]] or [2]

engine = RapidOCR()
doc = pymupdf.open(PDF)


def clean(img: np.ndarray) -> np.ndarray:
    """Whiten light/pastel pixels (watermark) while keeping dark, red and green text."""
    rgb = img.astype(np.int16)
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    light = mn > 150  # pastel watermark is light in every channel
    out = img.copy()
    out[light] = 255
    _ = mx
    return out


for p in pages:
    pix = doc[p].get_pixmap(dpi=200)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3]
    img = clean(img)
    result, _ = engine(img)
    print(f"\n===== PAGE {p} =====")
    for box, text, score in result or []:
        y = int(box[0][1])
        x = int(box[0][0])
        print(f"{y:5d} {x:5d} {score:.2f} | {text}")
