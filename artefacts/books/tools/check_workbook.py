"""Check an Aspiran workbook JSON before layout.
Usage: python3 -I check_workbook.py <workbook.json> <content/pyq/pyq.json>
Prints one line per issue. Checks: every en has a hi (and the reverse); past-question refs exist in pyq.json and
copied question text matches; banned wording; fill-in gaps match keys; answerIndex in range; chapter asOf."""
import json, re, sys, unicodedata

wb = json.load(open(sys.argv[1])); pyq = json.load(open(sys.argv[2]))
P = {p["id"]: p for p in pyq["papers"]}
Q = {(p["id"], str(q["n"])): q for p in pyq["papers"] for q in p["questions"]}
issues = []
def bad(where, msg): issues.append(f"{where}: {msg}")

BANNED = [(re.compile(r"\bAI\b"), "AI"), (re.compile(r"UPSC Pods", re.I), "UPSC Pods"),
          (re.compile(r"\b(TODO|TBD|FIXME|lorem|XXX|placeholder)\b", re.I), "placeholder"),
          (re.compile(r"\bChotu\b"), "Chotu"), (re.compile(r"artificial intelligence", re.I), "AI (spelt out)")]
def walk(o, path=""):
    if isinstance(o, dict):
        ks = set(o)
        if "en" in ks and "hi" not in ks: bad(path, "has en but no hi")
        if "hi" in ks and "en" not in ks: bad(path, "has hi but no en")
        if "en" in ks and "hi" in ks:
            e, h = o["en"], o["hi"]
            if isinstance(e, str) and isinstance(h, str) and bool(e.strip()) != bool(h.strip()): bad(path, "one of en/hi is empty")
            if isinstance(e, list) and isinstance(h, list) and len(e) != len(h): bad(path, f"en has {len(e)} items, hi has {len(h)}")
        for k, v in o.items(): walk(v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o): walk(v, f"{path}[{i}]")
    elif isinstance(o, str):
        if path.endswith((".url", ".notes")) or ".sources" in path or "factsToCheck" in path: return
        for rx, name in BANNED:
            if rx.search(o): bad(path, f"banned wording '{name}': {o[:90]}")
        for m in re.finditer(r"\{\{([^}]*)\}\}", o):
            if not re.fullmatch(r"\d+|qr:wb-[a-z0-9-]+", m.group(1)): bad(path, f"unknown placeholder {m.group(0)}")
walk(wb, wb.get("id", "book"))

def norm(s): return re.sub(r"\s+", " ", unicodedata.normalize("NFC", s or "")).strip().rstrip("।. ")
def ref(where, pid, n, text=None):
    if pid not in P: bad(where, f"past paper {pid} not in pyq.json"); return None
    q = Q.get((pid, str(n)))
    if not q: bad(where, f"{pid} Q{n} not in pyq.json"); return None
    if text:
        for lang in ("en", "hi"):
            t = text.get(lang)
            if t and q.get(lang) and norm(t) != norm(q[lang]["q"]):
                bad(where, f"{pid} Q{n} {lang} text differs from pyq.json:\n    book: {t[:140]}\n    pyq:  {q[lang]['q'][:140]}")
    return q

# Prose mentions like "Prelims 2024 GS I, Q 61" -> csp-2024-gs1 / 61
PROSE = re.compile(r"(Prelims|Mains) (20\d\d) (GS ?(?:I{1,3}|IV)|CSAT|Essay)[, ]+Q ?(\d+)")
def paperid(kind, yr, pap):
    pap = pap.replace(" ", "").lower(); m = {"gsi": "gs1", "gsii": "gs2", "gsiii": "gs3", "gsiv": "gs4", "csat": "gs2", "essay": "essay"}[pap]
    return f"{'csp' if kind == 'Prelims' else 'csm'}-{yr}-{m}"
def prose(o, path):
    if isinstance(o, dict): [prose(v, f"{path}.{k}") for k, v in o.items()]
    elif isinstance(o, list): [prose(v, f"{path}[{i}]") for i, v in enumerate(o)]
    elif isinstance(o, str):
        for m in PROSE.finditer(o): ref(path + " (mentioned in text)", paperid(*m.group(1, 2, 3)), m.group(4))
prose(wb, wb.get("id", "book"))

for ch in wb.get("chapters", []):
    cid = ch["id"]
    if not ch.get("asOf"): bad(cid, "no asOf line")
    if not re.fullmatch(r"\{\{qr:wb-[a-z]+-ch\d+\}\}", ch.get("qr", "")): bad(cid, f"qr placeholder odd: {ch.get('qr')}")
    for pq in ch.get("pastQuestions", []): ref(cid + ".pastQuestions", pq["id"], pq["n"])
    keyed = {k["block"] for k in ch.get("answerKey", [])}
    for b in ch["blocks"]:
        w = f"{cid}/{b['id']}"
        if b["type"] == "fillin":
            for lang in ("en", "hi"):
                gaps = sorted(int(x) for x in re.findall(r"\{\{(\d+)\}\}", b[lang]["text"]))
                if gaps != list(range(1, len(gaps) + 1)): bad(w, f"{lang} gaps not 1..n: {gaps}")
                if len(gaps) != len(b.get("key", [])): bad(w, f"{lang} has {len(gaps)} gaps but key has {len(b.get('key', []))}")
        if b["type"] == "upsc":
            for q in b["questions"]:
                n = len(q["en"]["options"])
                if not (0 <= q["answerIndex"] < n): bad(q["id"], "answerIndex out of range")
                if len(q["hi"]["options"]) != n: bad(q["id"], "en/hi option count differs")
                if not q.get("because"): bad(q["id"], "no because lines")
                if q.get("isPYQ"): bad(q["id"], "marked isPYQ inside the 'original questions' block")
        if b["type"] == "mains":
            ref(w, b["pyq"]["id"], b["pyq"]["n"], {"en": b["en"]["question"], "hi": b["hi"]["question"]})
        if b["type"] in ("fillin", "diagram", "sort", "timeline", "recall") and b["id"] not in keyed:
            bad(w, "no answerKey entry")

parts = wb.get("parts", {})
for pg in parts.get("mains-planning", {}).get("pages", []):
    ref(pg["id"], pg["pyq"]["id"], pg["pyq"]["n"], {"en": pg["en"]["question"], "hi": pg["hi"]["question"]})
bm = wb.get("backMatter") or {}
for r in (bm.get("pyqTracker") or {}).get("rows", []):
    q = ref("pyqTracker", r["id"], r["n"])
    if q and P[r["id"]]["year"] != r["year"]: bad("pyqTracker", f"{r['id']} Q{r['n']} year {r['year']} wrong")
fc = bm.get("flashcards", [])
if fc and (len(fc) != 40 or sum(1 for f in fc if f.get("blank")) != 8): bad("flashcards", f"{len(fc)} cards, {sum(1 for f in fc if f.get('blank'))} blank (spec: 40, 8 blank)")

print(f"{len(issues)} issue(s)"); print("\n".join(issues))
