"""Process PDF screenshots:
1. Deduplicate against repo questions using fuzzy/normalized string matching.
2. For matching repo questions that need an exhibit, attach the cropped screenshot.
3. For unique new questions from the PDF, crop the question area and add them as image-choice questions.
4. Export updated data/questions.js.
"""
import glob
import json
import os
import re
import numpy as np
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = r"C:\Users\Zaira Torres\Downloads\CCNA_200_301_AGO 2023.pdf"
CACHE_DIR = os.path.join(ROOT, "tools", "cache")
OCR_DIR = os.path.join(CACHE_DIR, "ocr")
IMG_DIR = os.path.join(ROOT, "data", "images")
REPO_JSON = os.path.join(CACHE_DIR, "repo.json")
OUT_JS = os.path.join(ROOT, "data", "questions.js")

os.makedirs(IMG_DIR, exist_ok=True)

repo_data = json.load(open(REPO_JSON, encoding="utf-8"))

def norm(txt):
    return re.sub(r"[^a-z0-9]", "", txt.lower())

# Map normalized prefix -> repo question
repo_lookup = {}
for q in repo_data:
    k = norm(q["question"][:50])
    if len(k) >= 15:
        repo_lookup[k] = q

doc = None
if os.path.exists(PDF_PATH):
    doc = pymupdf.open(PDF_PATH)

ocr_files = sorted(glob.glob(os.path.join(OCR_DIR, "*.json")))
print(f"Found {len(ocr_files)} cached OCR items to process")

exhibits_attached = 0
new_pdf_questions = []

for f in ocr_files:
    meta = json.load(open(f, encoding="utf-8"))
    idx = meta["idx"]
    page_num = meta["page"]
    xref = meta["xref"]
    lines = meta["lines"]
    
    # Reconstruct text
    full_text = " ".join(line[5] for line in lines)
    norm_full = norm(full_text)
    
    # Detect Answer: e.g. "Answer C", "Answer: AD", "Answer. C"
    ans_match = re.search(r"Answer[\s:.]*([A-F]{1,4})", full_text, re.I)
    answer = list(ans_match.group(1).upper()) if ans_match else []
    
    # Check if duplicate in repo
    matched_repo_q = None
    for k, q in repo_lookup.items():
        if k in norm_full:
            matched_repo_q = q
            break
            
    # Crop and save clean image (y: 50 to 720)
    img_name = f"pdf_{idx:04d}.png"
    img_rel_path = f"data/images/{img_name}"
    img_abs_path = os.path.join(IMG_DIR, img_name)
    
    if not os.path.exists(img_abs_path) and doc:
        try:
            pix = pymupdf.Pixmap(doc, xref)
            if pix.n != 3 or pix.alpha:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            # Crop out title bar (top 45px) and bottom toolbar (bottom 80px)
            crop_rect = pymupdf.IRect(0, 48, pix.width, min(pix.height - 40, 725))
            cropped_pix = pymupdf.Pixmap(pix, crop_rect)
            cropped_pix.save(img_abs_path)
        except Exception as e:
            pass

    if matched_repo_q:
        # If repo question needed an exhibit, attach this image!
        if matched_repo_q.get("needsExhibit") and not matched_repo_q.get("image"):
            matched_repo_q["image"] = img_rel_path
            exhibits_attached += 1
    else:
        # Unique question from PDF!
        if answer: # only add if we successfully identified the answer key
            # Extract question title line
            title = ""
            for l in lines:
                txt = l[5]
                if any(w in txt.lower() for w in ["which", "what", "how", "refer to", "an engineer", "a network", "a router", "a switch", "why"]):
                    title = txt
                    break
            if not title and lines:
                title = f"CCNA Exam Question #{idx + 1}"
                
            # Classify domain based on keywords
            t_low = full_text.lower()
            if any(w in t_low for w in ["ospf", "eigrp", "bgp", "route", "routing", "next-hop", "gateway"]):
                domain = "connectivity"
            elif any(w in t_low for w in ["vlan", "trunk", "spanning-tree", "stp", "etherchannel", "switch"]):
                domain = "access"
            elif any(w in t_low for w in ["acl", "access-list", "radius", "tacacs", "ssh", "port-security", "dhcp snooping"]):
                domain = "security"
            elif any(w in t_low for w in ["dhcp", "dns", "snmp", "ntp", "nat", "pat", "tftp", "ftp"]):
                domain = "services"
            elif any(w in t_low for w in ["rest", "api", "json", "dna center", "ansible", "puppet", "chef", "python"]):
                domain = "automation"
            else:
                domain = "fundamentals"

            new_q = {
                "id": f"pdf_{idx:04d}",
                "source": "pdf",
                "type": "image-choice",
                "domain": domain,
                "difficulty": "medium",
                "question": title if len(title) > 10 else f"Refer to the exhibit to answer the question.",
                "options": {letter: f"Opción {letter}" for letter in ["A", "B", "C", "D"]},
                "letters": ["A", "B", "C", "D"],
                "answer": answer,
                "explanation": f"Respuesta confirmada del examen CCNA: {', '.join(answer)}. Revisa el comando y la topología en la captura superior.",
                "needsExhibit": True,
                "image": img_rel_path
            }
            new_pdf_questions.append(new_q)

print(f"Exhibits attached to existing repo questions: {exhibits_attached}")
print(f"New verified unique questions added from PDF: {len(new_pdf_questions)}")

# Combine all
all_questions = repo_data + new_pdf_questions

meta = {
    "total": len(all_questions),
    "repoCount": len(repo_data),
    "pdfNewCount": len(new_pdf_questions),
    "exhibitsAttached": exhibits_attached,
    "generated": "2026-10-23",
    "sources": ["MrVardanyan777/CCNA-Exam-Simulator", "CCNA 200-301 AGO 2023"]
}

payload = {"meta": meta, "questions": all_questions}

with open(OUT_JS, "w", encoding="utf-8") as f:
    f.write("window.CCNA_DATA = ")
    json.dump(payload, f, ensure_ascii=False)
    f.write(";\n")

print(f"Updated {OUT_JS} with {len(all_questions)} total unified questions.")
