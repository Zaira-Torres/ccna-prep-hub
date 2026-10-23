"""Export tools/cache/repo.json to data/questions.js as window.CCNA_DATA so it loads without CORS on file://"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "cache", "repo.json")
OUT = os.path.join(ROOT, "data", "questions.js")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
data = json.load(open(SRC, encoding="utf-8"))

meta = {
    "total": len(data),
    "generated": "2026-10-23",
    "sources": ["MrVardanyan777/CCNA-Exam-Simulator", "CCNA 200-301 AGO 2023"]
}

payload = {"meta": meta, "questions": data}

with open(OUT, "w", encoding="utf-8") as f:
    f.write("window.CCNA_DATA = ")
    json.dump(payload, f, ensure_ascii=False)
    f.write(";\n")

print(f"Generated {OUT} with {len(data)} questions ({os.path.getsize(OUT)} bytes)")
