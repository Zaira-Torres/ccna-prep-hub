"""Step 0 - Convert the GitHub repo's questions.js into normalized JSON.

Output: tools/cache/repo.json
"""
import json
import os
import re

import json5

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "raw", "repo_questions.js")
OUT = os.path.join(ROOT, "cache", "repo.json")

DOMAIN_IDS = {
    "Network Fundamentals": "fundamentals",
    "Network Access": "access",
    "IP Connectivity": "connectivity",
    "IP Services": "services",
    "Security Fundamentals": "security",
    "Automation and Programmability": "automation",
}


def main():
    src = open(SRC, encoding="utf-8").read()
    body = src[src.index("["): src.rindex("]") + 1]
    raw = json5.loads(body)
    out = []
    for q in raw:
        text = (q.get("question") or "").strip()
        item = {
            "id": f"r{q['id']}",
            "source": "repo",
            "type": "drag-drop" if q.get("type") == "drag-drop" else "multiple-choice",
            "domain": DOMAIN_IDS.get(q.get("category"), "fundamentals"),
            "difficulty": q.get("difficulty") or "medium",
            "question": text,
            "options": q.get("options") or {},
            "answer": q.get("correctAnswer") or [],
            "explanation": (q.get("explanation") or "").strip(),
            "needsExhibit": bool(q.get("hasImage")) or bool(re.search(r"refer to the exhibit", text, re.I)),
            "image": None,
        }
        if item["type"] == "drag-drop":
            item["pairs"] = q.get("pairs") or []
        out.append(item)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(out)} questions -> {OUT}")
    print("needs exhibit:", sum(q["needsExhibit"] for q in out))
    print("drag-drop without pairs:", sum(1 for q in out if q["type"] == "drag-drop" and not q["pairs"]))
    print("mc without answer:", sum(1 for q in out if q["type"] == "multiple-choice" and not q["answer"]))


if __name__ == "__main__":
    main()
