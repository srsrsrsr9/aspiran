import json, re, sys, os, glob, collections
root = sys.argv[1]; os.chdir(root)
issues = collections.defaultdict(list)
DEV = re.compile(r"[ऀ-ॿ]")
EMOJI = re.compile(r"[\U0001F300-\U0001FAFF☀-➿]")
BANNED = re.compile(r"\b(hurry|last chance|guaranteed|100% selection|topper'?s secret|you should have)\b", re.I)
wc = lambda s: len(re.findall(r"\S+", s or ""))
def add(f, m): issues[f].append(m)
def walk(f, o, path=""):
    if isinstance(o, dict):
        if "en" in o and isinstance(o["en"], (str, list)):
            if "hi" not in o: add(f, f"{path}: en without hi")
            else:
                e, h = o["en"], o["hi"]
                if isinstance(e, list):
                    if not isinstance(h, list) or len(e) != len(h): add(f, f"{path}: en/hi list lengths differ ({len(e)} vs {len(h) if isinstance(h,list) else '-'})")
                    for x in (h if isinstance(h, list) else []):
                        if isinstance(x, str) and not DEV.search(x): add(f, f"{path}: hi item without Devanagari: {x[:40]}")
                elif isinstance(h, str):
                    if e and not DEV.search(h): add(f, f"{path}: hi has no Devanagari: {h[:50]!r}")
                    se, sh = set(re.findall(r"\{\w+\}", e)), set(re.findall(r"\{\w+\}", h))
                    if se != sh: add(f, f"{path}: slots differ en {se} hi {sh}")
                    if e and h and len(h) > 2.2 * len(e) + 40: add(f, f"{path}: Hindi much longer than English ({len(e)} vs {len(h)} chars)")
                    if e and not h: add(f, f"{path}: empty hi")
        for k, v in o.items(): walk(f, v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o): walk(f, v, f"{path}[{i}]")
    elif isinstance(o, str):
        if BANNED.search(o) and "dont" not in path: add(f, f"{path}: banned word: {BANNED.search(o).group(0)}")
def strings(o):
    if isinstance(o, dict):
        for v in o.values(): yield from strings(v)
    elif isinstance(o, list):
        for v in o: yield from strings(v)
    elif isinstance(o, str): yield o
ids = collections.Counter()
for f in sorted(glob.glob("**/*.json", recursive=True)):
    d = json.load(open(f, encoding="utf-8"))
    for k in ("id", "version", "tone", "factsToCheck", "review"):
        if k not in d: add(f, f"missing {k}")
    if d.get("version") != 1: add(f, "version not 1")
    if d.get("review") != {"status": "draft"}: add(f, f"review not draft: {d.get('review')}")
    if d.get("tone") not in ("LIGHT", "NEUTRAL", "SERIOUS", "TRAGIC"): add(f, f"bad tone {d.get('tone')}")
    if not re.fullmatch(r"[a-z0-9-]+", str(d.get("id",""))): add(f, f"id not lowercase-hyphen: {d.get('id')}")
    ids[d.get("id")] += 1
    walk(f, d)
    if d.get("tone") == "TRAGIC":
        if d.get("shareable") is not False: add(f, "TRAGIC without shareable:false")
    if f.startswith("pause-lines"):
        L = d["lines"]; print(f, "lines", len(L))
        if len(L) != 50: add(f, f"{len(L)} lines, expected 50")
        keys = collections.Counter(x["key"] for x in L)
        for k, n in keys.items():
            if n > 1: add(f, f"duplicate key {k}")
        for x in L:
            for t in [x["en"]] + ([x["alt"]["en"]] if x.get("alt") else []):
                if wc(t) > 15: add(f, f"{x['key']}: {wc(t)} words > 15: {t}")
            for s in strings(x):
                if EMOJI.search(s): add(f, f"{x['key']}: emoji in a pause line")
    if f.startswith("chotu"):
        print(f, "who words", wc(d["who"]["en"]), "do", len(d["do"]), "dont", len(d["dont"]), "examples", len(d["examples"]))
        if wc(d["who"]["en"]) > 60: add(f, "who over 60 words")
        for ex in d["examples"]:
            r = ex["reply"]
            for s in r.values():
                n = len(EMOJI.findall(s))
                if n > 1: add(f, f"{ex['key']}: {n} emoji")
                if n and ex.get("tone") != "LIGHT": add(f, f"{ex['key']}: emoji on non-LIGHT ({ex.get('tone')})")
            if not r.get("hinglish"): add(f, f"{ex['key']}: no Hinglish")
            low = (ex["key"] + ex["situation"]["en"]).lower()
            if any(w in low for w in ("feel", "sad", "anxious", "stress", "low")) and "14416" not in r["en"]: add(f, f"{ex['key']}: feelings reply without Tele-MANAS 14416")
        cover = " ".join(ex["key"] + " " + ex["situation"]["en"] for ex in d["examples"]).lower()
        for need in ["greet", "correct", "wrong", "skeleton", "rewrite", "doubt", "night", "feel", "rank", "tragic", "pod"]:
            if need not in cover: add(f, f"examples may not cover: {need}")
    if f.startswith("terms/"):
        T = d["terms"]; print(f, "terms", len(T))
        if len(T) != 80: add(f, f"{len(T)} terms, expected 80")
        c = collections.Counter(t["en"].lower() for t in T)
        for k, n in c.items():
            if n > 1: add(f, f"duplicate term {k}")
        ch = collections.Counter(t["hi"] for t in T)
        for k, n in ch.items():
            if n > 1: add(f, f"two English terms share the Hindi {k}: " + ", ".join(t["en"] for t in T if t["hi"] == k))
        for t in T:
            if wc(t["meaning"]["en"]) > 20: add(f, f"{t['en']}: meaning {wc(t['meaning']['en'])} words > 20")
            if not (t["hiAlt"] is None or isinstance(t["hiAlt"], str)): add(f, f"{t['en']}: hiAlt not string/null")
    if f.startswith("optionals/"):
        pq, rc, sk, ex = d["practiceQuestions"], d["recall"], d["skeletons"], d["examples"]
        print(f, "why", wc(d["why"]["en"]), "note", wc(d["note"]["en"]), "pq", len(pq), "recall", len(rc), "skel", len(sk), "ex", len(ex), "kinds", dict(collections.Counter(r["kind"] for r in rc)))
        if wc(d["why"]["en"]) > 60: add(f, f"why {wc(d['why']['en'])} words > 60")
        if wc(d["note"]["en"]) > 600: add(f, f"note {wc(d['note']['en'])} words > 600")
        if not 3 <= len(pq) <= 5: add(f, f"{len(pq)} practice questions")
        if any(q.get("isPYQ") is not False for q in pq): add(f, "a practice question not isPYQ:false")
        if not 10 <= len(rc) <= 15: add(f, f"{len(rc)} recall cards")
        if set(r["kind"] for r in rc) - {"define","compare","example","apply"}: add(f, "bad recall kind")
        if len(set(r["kind"] for r in rc)) < 4: add(f, "recall doesn't mix all four kinds")
        for r in rc:
            if wc(r["a"]["en"]) > 40: add(f, f"recall answer {wc(r['a']['en'])} words > 40")
        if sorted(s["for"] for s in sk) != list(range(len(pq))): add(f, "skeletons don't map one per question")
        if not 3 <= len(ex) <= 5: add(f, f"{len(ex)} examples")
        for e in ex:
            if wc(e["en"]) > 40: add(f, f"example {wc(e['en'])} words > 40")
            if not e.get("source"): add(f, f"example without source: {e['en'][:50]}")
        for t in d.get("thinkers", []):
            if wc(t["idea"]["en"]) > 30: add(f, f"thinker {t['name']} idea > 30 words")
        # each note section ends with a question
        secs = [s for s in re.split(r"(?m)\n\s*\n|^#+ ", d["note"]["en"]) if s.strip()]
        noq = [s.strip()[:40] for s in secs if not s.strip().endswith("?") and len(s.split()) > 12]
        if noq: add(f, f"{len(noq)} note sections don't end with a question, e.g. {noq[0]!r}")
        extra = set(d) - {"id","version","tone","optional","paper","why","practiceQuestions","note","onePagerPrompts","recall","skeletons","examples","thinkers","links","diagram","factsToCheck","review","notes"}
        if extra: add(f, f"extra fields {extra}")
    if f.startswith("essay/"):
        if d.get("isPYQ") is not False: add(f, "isPYQ not false")
        if len(d.get("angles", [])) < 7: add(f, f"{len(d.get('angles',[]))} angles")
        for o in d.get("openers", []):
            if re.search(r"[\"“”]", o["en"]): add(f, f"opener has quotation marks: {o['en'][:60]}")
if True:
    E = [json.load(open(f)) for f in sorted(glob.glob("essay/*.json"))]
    print("essays", len(E), collections.Counter(e["kind"] for e in E))
    Q = sum((json.load(open(f))["questions"] for f in sorted(glob.glob("interview/bank-*.json"))), [])
    print("questions", len(Q), "unique ids", len({q["id"] for q in Q}))
    print(" groups", dict(collections.Counter(q["group"] for q in Q)))
    print(" depth", dict(collections.Counter(q["depth"] for q in Q)), "idkOk", sum(q["idkOk"] for q in Q))
    print(" persona", dict(collections.Counter(q["persona"] for q in Q)))
    P = {p["key"] for p in json.load(open("interview/personas.json"))["personas"]}
    for q in Q:
        if q["persona"] not in P: add("interview", f"{q['id']}: unknown persona {q['persona']}")
        if q["depth"] not in ("opener","follow-up","deep"): add("interview", f"{q['id']}: bad depth")
        if re.search(r"\b(religio|caste|marri|wedding|income|salary of your|father earn|god|temple|wife|husband)", q["q"]["en"], re.I): add("interview", f"{q['id']}: sensitive word: {q['q']['en']}")
    c = collections.Counter(q["q"]["en"].strip().lower() for q in Q)
    for k, n in c.items():
        if n > 1: add("interview", f"duplicate question: {k}")
for k, n in ids.items():
    if n > 1: add("ids", f"duplicate id {k}")
print("\n==== ISSUES")
for f, L in issues.items():
    print(f"\n{f} ({len(L)})")
    for m in L[:25]: print("  -", m)
    if len(L) > 25: print(f"  … {len(L)-25} more")
