"""Builds the 'Try it yourself' pack: 60 syllabus interactives, 5 per 'Syllabus in a minute' paper folder.

    python3 content/interactives/src/build.py

Checks every piece (kinds, counts, en and hi on every text, the episode and node exist in the video manifests),
then writes content/interactives/syllabus-interactives-2026-11-14/ (manifest.json + interactive/<id>.json).
Import from server/: npm run import -- ../content/interactives/syllabus-interactives-2026-11-14
"""
import hashlib
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from data_a import PIECES as A  # noqa: E402
from data_b import PIECES as Bp  # noqa: E402
from data_c import PIECES as C  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
PACK = "syllabus-interactives-2026-11-14"
OUT = os.path.join(ROOT, "content", "interactives", PACK)
KINDS = ["decide", "order", "sort", "match", "statements", "dial"]
NAMES = {"decide": ("You decide", "आप तय करें"), "order": ("Put in order", "क्रम में लगाइए"), "sort": ("Sort", "छाँटिए"),
         "match": ("Match", "मिलाइए"), "statements": ("Statements", "कथन"), "dial": ("Dial", "डायल")}

pieces = A + Bp + C
errs = []


def bi(v, where):
    if not (isinstance(v, dict) and str(v.get("en", "")).strip() and str(v.get("hi", "")).strip()):
        errs.append(f"{where}: needs en and hi")


manifests = {}
for w in range(1, 13):
    week = f"2000-{w:02d}"
    manifests[week] = json.load(open(os.path.join(ROOT, "content", "motion", "syllabus", week, "manifest.json")))

seen = set()
for p in pieces:
    pid = f"try-{p['episode']}"
    at = pid
    if pid in seen:
        errs.append(f"{at}: duplicate")
    seen.add(pid)
    m = manifests.get(p["week"])
    ep = next((e for e in (m or {}).get("episodes", []) if e["id"] == p["episode"]), None)
    if not ep:
        errs.append(f"{at}: no episode {p['episode']} in {p['week']}")
    elif p["node"] not in ep.get("syllabusNodes", []):
        errs.append(f"{at}: node {p['node']} isn't on the episode ({ep.get('syllabusNodes')})")
    if p["type"] not in KINDS:
        errs.append(f"{at}: unknown type {p['type']}")
    for k in ("title", "prompt", "takeaway"):
        bi(p.get(k), f"{at}.{k}")
    if not p.get("sources"):
        errs.append(f"{at}: no sources")
    t = p["type"]
    if t == "decide":
        if not p.get("rounds"):
            errs.append(f"{at}: no rounds")
        for i, r in enumerate(p.get("rounds", [])):
            bi(r["situation"], f"{at}.rounds[{i}]")
            if sum(1 for o in r["options"] if o["best"]) != 1:
                errs.append(f"{at}.rounds[{i}]: exactly one best option")
            for o in r["options"]:
                bi(o["text"], at); bi(o["why"], at)
    elif t == "order":
        if not 3 <= len(p["items"]) <= 8:
            errs.append(f"{at}: 3 to 8 items")
        for x in p["items"]:
            bi(x["text"], at)
            if "note" in x:
                bi(x["note"], at)
        bi(p["ends"], at); bi(p["ends2"], at)
    elif t == "sort":
        for b in p["buckets"]:
            bi(b, at)
        for x in p["items"]:
            bi(x["text"], at)
            if not 0 <= x.get("bucket", -1) < len(p["buckets"]):
                errs.append(f"{at}: bad bucket")
        if set(x["bucket"] for x in p["items"]) != set(range(len(p["buckets"]))):
            errs.append(f"{at}: an empty bucket")
    elif t == "match":
        bi(p["left"], at); bi(p["right"], at)
        if not 3 <= len(p["pairs"]) <= 6:
            errs.append(f"{at}: 3 to 6 pairs")
        for x in p["pairs"]:
            bi(x["a"], at); bi(x["b"], at)
    elif t == "statements":
        if not 3 <= len(p["statements"]) <= 6:
            errs.append(f"{at}: 3 to 6 statements")
        if all(s["answer"] for s in p["statements"]) or not any(s["answer"] for s in p["statements"]):
            errs.append(f"{at}: mix true and false")
        for s in p["statements"]:
            bi(s["text"], at); bi(s["why"], at)
    elif t == "dial":
        bi(p["unit"], at); bi(p["explain"], at)
        lo, hi_, step, ans = p["min"], p["max"], p["step"], p["answer"]
        if not lo <= ans <= hi_:
            errs.append(f"{at}: answer outside the dial")
        k = (ans - lo) / step
        if abs(k - round(k)) > 1e-6:
            errs.append(f"{at}: the answer isn't on a step")
        if p["start"] == ans:
            errs.append(f"{at}: the dial starts on the answer")

per_week = Counter(p["week"] for p in pieces)
per_kind = Counter(p["type"] for p in pieces)
if len(pieces) != 60:
    errs.append(f"{len(pieces)} pieces, expected 60")
for w, n in per_week.items():
    if n != 5:
        errs.append(f"{w}: {n} pieces, expected 5")
for k in KINDS:
    if per_kind[k] != 10:
        errs.append(f"{k}: {per_kind[k]} pieces, expected 10")
if sum(1 for p in pieces if p["free"]) != 12:
    errs.append(f"{sum(1 for p in pieces if p['free'])} free, expected 12")
if errs:
    print("\n".join(errs))
    sys.exit(1)

os.makedirs(os.path.join(OUT, "interactive"), exist_ok=True)
files, entry = [], []
for p in pieces:
    pid = f"try-{p['episode']}"
    m = manifests[p["week"]]
    ep = next(e for e in m["episodes"] if e["id"] == p["episode"])
    body = {k: v for k, v in p.items() if k not in ("week", "episode", "node", "type", "free")}
    data = {
        "schema": "aspiran/syllabus-interactive@1", "id": pid, "type": p["type"],
        "typeName": {"en": NAMES[p["type"]][0], "hi": NAMES[p["type"]][1]},
        "series": "syllabus-in-a-minute", "week": p["week"], "episode": p["episode"], "episodeN": ep["n"],
        "episodeTitle": ep["title"], "node": p["node"], "paper": {"en": m["title"], "hi": m["titleHi"]},
        "free": p["free"], **body,
        "review": {"status": "draft", "note": "Written by Claude from the listed sources, 14 Nov 2026. Hindi by Claude. Not yet checked by a subject or Hindi editor."},
    }
    path = f"interactive/{pid}.json"
    raw = (json.dumps(data, ensure_ascii=False, indent=1) + "\n").encode("utf-8")
    open(os.path.join(OUT, path), "wb").write(raw)
    files.append({"path": path, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()})
    entry.append(path)

manifest = {"schema": "upsc-pods/pack-manifest@1", "packId": PACK, "createdOn": "2026-11-14",
            "status": "draft, not editor-approved",
            "note": "Try it yourself: 60 syllabus interactives (10 each of You decide, Put in order, Sort, Match, Statements and Dial), five per Syllabus in a minute paper. 12 are free on the visitor shelf.",
            "entry": {"interactives": entry}, "files": files, "totalBytes": sum(f["bytes"] for f in files)}
json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"Wrote {len(files)} pieces to {OUT}")
print("Per paper:", dict(sorted(per_week.items())))
print("Per kind:", dict(per_kind))
