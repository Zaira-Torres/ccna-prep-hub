"""Match cached PDF screenshots against repo questions and see how many overlap.
Also check how deduplication works.
"""
import json
import glob
import re

repo = json.load(open("tools/cache/repo.json", encoding="utf-8"))
print(f"Repo questions: {len(repo)}")

# Normalize text for matching
def norm(txt):
    return re.sub(r"[^a-z0-9]", "", txt.lower())

repo_lookup = {}
for q in repo:
    k = norm(q["question"][:60])
    if k:
        repo_lookup[k] = q

ocr_files = sorted(glob.glob("tools/cache/ocr/*.json"))
print(f"Cached OCR files: {len(ocr_files)}")

matches = 0
new_items = 0

for f in ocr_files:
    data = json.load(open(f, encoding="utf-8"))
    full_text = " ".join(line[5] for line in data["lines"])
    # Look for question line
    found = False
    for k in repo_lookup:
        if k in norm(full_text):
            found = True
            matches += 1
            break
    if not found:
        new_items += 1

print(f"Matches against repo bank: {matches}")
print(f"Potential new questions: {new_items}")
