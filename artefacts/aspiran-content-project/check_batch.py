#!/usr/bin/env python3
"""Aspiran batch checker (brief rule C6). Usage: python3 check_batch.py aspiran-content

Checks every JSON file under the folder: valid JSON, required fields, en/hi pairs (Devanagari, same list lengths,
same {slots}), banned words, emoji, TRAGIC rules, duplicate ids, and the counts and word limits of each batch type
it knows (by folder name). Prints each issue, then "N issues". Fix and re-run until it prints "0 issues".
Word counts are whitespace-separated words of the English text.
"""
import collections, glob, json, os, re, sys

root = sys.argv[1] if len(sys.argv) > 1 else "aspiran-content"
os.chdir(root)
issues = collections.defaultdict(list)
DEV = re.compile(r"[ऀ-ॿ]")
EMOJI = re.compile(r"[\U0001F300-\U0001FAFF☀-➿]")
BANNED = re.compile(r"\b(hurry|last chance|guaranteed|100% selection|topper'?s secret|you should have)\b", re.I)
wc = lambda s: len(re.findall(r"\S+", s or ""))
add = lambda f, m: issues[f].append(m)
NODE = re.compile(r"^(pre-[1-7]|csat-[1-6]|gs1-[1-9]|gs2-([1-9]|1[01])|gs3-[1-8]|gs4-[1-6]|essay-[12])$")


def en_words(o):
    """All English words inside o (values under 'en' keys)."""
    n = 0
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "en":
                n += sum(wc(x) for x in v) if isinstance(v, list) else wc(v) if isinstance(v, str) else 0
            elif k not in ("hi", "hiAlt", "factsToCheck", "review", "id"):
                n += en_words(v)
    elif isinstance(o, list):
        n += sum(en_words(v) for v in o)
    return n


def walk(f, o, path=""):
    if isinstance(o, dict):
        if "en" in o and isinstance(o["en"], (str, list)):
            e, h = o["en"], o.get("hi")
            if h is None:
                add(f, f"{path}: en without hi")
            elif isinstance(e, list):
                if not isinstance(h, list) or len(e) != len(h):
                    add(f, f"{path}: en/hi list lengths differ")
                else:
                    for x in h:
                        if isinstance(x, str) and x and not DEV.search(x):
                            add(f, f"{path}: hi item without Devanagari: {x[:40]}")
            elif isinstance(h, str):
                if e and not h.strip():
                    add(f, f"{path}: empty hi")
                elif e and not DEV.search(h):
                    add(f, f"{path}: hi has no Devanagari: {h[:50]!r}")
                if set(re.findall(r"\{\w+\}", e)) != set(re.findall(r"\{\w+\}", h)):
                    add(f, f"{path}: {{slots}} differ between en and hi")
        for k, v in o.items():
            walk(f, v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o):
            walk(f, v, f"{path}[{i}]")
    elif isinstance(o, str):
        m = BANNED.search(o)
        if m and "dont" not in path and not path.endswith(".key"):
            add(f, f"{path}: banned word '{m.group(0)}'")


def strings(o):
    if isinstance(o, dict):
        for v in o.values():
            yield from strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)
    elif isinstance(o, str):
        yield o


def over(f, label, text, limit):
    n = wc(text)
    if n > limit:
        add(f, f"{label}: {n} words, limit {limit}")


ids = collections.Counter()
files = sorted(glob.glob("**/*.json", recursive=True))
kinds = collections.Counter()
for f in files:
    try:
        d = json.load(open(f, encoding="utf-8"))
    except Exception as e:
        add(f, f"not valid JSON: {e}")
        continue
    if f in ("manifest.json",) or f.startswith("checks/"):
        continue
    top = f.split("/")[0]
    kinds[top] += 1
    walk(f, d)
    if top == "syllabus":  # B14-B22: one file holds many notes; the fields live on each note
        if d.get("schema") != "upsc-pods/syllabus-notes@1":
            add(f, "schema should be upsc-pods/syllabus-notes@1")
        if d.get("subject") not in ("pol", "his", "anc", "art", "sci", "ir", "soc", "eth", "geo", "env", "eco"):
            add(f, f"subject {d.get('subject')} isn't an app subject key")
        for n in d.get("notes", []):
            at = f"{n.get('id')}"
            ids[n.get("id")] += 1
            for k in ("id", "title", "nodes", "gsPaper", "minutes", "dek", "sections", "keyFacts", "examAngle", "selfCheck", "sources", "verify", "hi", "tone", "factsToCheck", "review"):
                if k not in n:
                    add(f, f"{at}: missing {k}")
            if not str(n.get("id", "")).startswith(f"{d.get('subject')}-"):
                add(f, f"{at}: id should start with {d.get('subject')}-")
            for x in n.get("nodes", []):
                if not NODE.match(x):
                    add(f, f"{at}: node {x} isn't an app topic id (like gs2-1 or pre-4)")
            secs = n.get("sections", [])
            if not 3 <= len(secs) <= 5:
                add(f, f"{at}: {len(secs)} sections, want 3 to 5")
            for s in secs:
                over(f, f"{at} section '{s.get('head','')[:30]}'", s.get("body", ""), 180)
            total = sum(wc(s.get("body", "")) for s in secs)
            if not 500 <= total <= 900:
                add(f, f"{at}: {total} words of sections, want 500 to 900")
            if not 5 <= len(n.get("keyFacts", [])) <= 8:
                add(f, f"{at}: {len(n.get('keyFacts', []))} key facts, want 5 to 8")
            if not 3 <= len(n.get("selfCheck", [])) <= 5:
                add(f, f"{at}: {len(n.get('selfCheck', []))} self-check questions, want 3 to 5")
            over(f, f"{at} examAngle", n.get("examAngle", ""), 60)
            hi = n.get("hi", {})
            for k in ("sections", "keyFacts", "selfCheck"):
                if len(hi.get(k, [])) != len(n.get(k, [])):
                    add(f, f"{at}: hi.{k} has {len(hi.get(k, []))}, English has {len(n.get(k, []))}")
            for s in strings(hi):
                if s and not DEV.search(s):
                    add(f, f"{at}: a hi string has no Devanagari: {s[:40]}")
                    break
            if n.get("review") != {"status": "draft"}:
                add(f, f"{at}: review must be {{\"status\": \"draft\"}}")
        continue

    for k in ("id", "version", "tone", "factsToCheck", "review"):
        if k not in d:
            add(f, f"missing {k}")
    if d.get("version") != 1:
        add(f, "version should be 1")
    if d.get("review") != {"status": "draft"}:
        add(f, 'review must be {"status": "draft"}')
    if d.get("tone") not in ("LIGHT", "NEUTRAL", "SERIOUS", "TRAGIC"):
        add(f, f"tone {d.get('tone')} isn't LIGHT, NEUTRAL, SERIOUS or TRAGIC")
    if not re.fullmatch(r"[a-z0-9-]+", str(d.get("id", ""))):
        add(f, f"id {d.get('id')} isn't lowercase with hyphens")
    ids[d.get("id")] += 1
    if d.get("tone") == "TRAGIC":
        if d.get("shareable") is not False:
            add(f, 'TRAGIC needs "shareable": false')
        if any(EMOJI.search(s) for s in strings(d)):
            add(f, "emoji on a TRAGIC item")
        if top == "walk":
            add(f, "no walk-mode audio for TRAGIC topics")

    if top == "pause-lines":
        L = d.get("lines", [])
        for c, n in collections.Counter(x.get("key") for x in L).items():
            if n > 1:
                add(f, f"duplicate key {c}")
        for x in L:
            over(f, x.get("key"), x.get("en"), 15)
            if x.get("alt"):
                over(f, x.get("key") + " alt", x["alt"].get("en"), 15)
    elif top == "skeletons":
        limit = 140 if d.get("marks") == 15 else 110
        n = en_words({k: d.get(k) for k in ("directive", "intro", "headings", "wayForward", "commonMistake")})
        if n > limit:
            add(f, f"skeleton is {n} English words, limit {limit}")
        h = len(d.get("headings", []))
        want = (4, 5) if d.get("marks") == 15 else (3, 4)
        if not want[0] <= h <= want[1]:
            add(f, f"{h} headings, want {want[0]} to {want[1]} for {d.get('marks')} marks")
        if d.get("isPYQ") is not True or not str(d.get("pyqId", "")).startswith("csm-2025-"):
            add(f, "skeletons are for Appendix 1 PYQs: isPYQ true and a csm-2025-… pyqId")
        if not 1 <= len(d.get("nodes", [])) <= 3:
            add(f, "nodes: 1 to 3 slugs")
    elif top == "gs4-cases":
        if d.get("isPYQ") is not False:
            add(f, "isPYQ must be false")
        over(f, "case", d.get("case", {}).get("en"), 200)
        c = d.get("circle", {})
        if not 4 <= len(c.get("stakeholders", [])) <= 6:
            add(f, f"{len(c.get('stakeholders', []))} stakeholders, want 4 to 6")
        if len(c.get("options", [])) != 3:
            add(f, f"{len(c.get('options', []))} options, want exactly 3")
        if len(d.get("seasoning", [])) > 2:
            add(f, "at most 2 seasoning lines")
        n = en_words(c) + en_words(d.get("seasoning", []))
        if n > 250:
            add(f, f"key (circle + seasoning) is {n} words, limit 250")
    elif f == "gs4-terms/thinkers.json":
        T = d.get("thinkers", [])
        if len(T) != 40:
            add(f, f"{len(T)} thinkers, want 40")
        for t in T:
            nm = t.get("name") if isinstance(t.get("name"), str) else json.dumps(t.get("name"), ensure_ascii=False)[:30]
            over(f, f"{nm} idea", (t.get("idea") or {}).get("en"), 40)
            over(f, f"{nm} useWhen", (t.get("useWhen") or {}).get("en"), 25)
            over(f, f"{nm} misuse", (t.get("misuse") or {}).get("en"), 20)
    elif f == "gs4-terms/terms.json":
        T = d.get("terms", [])
        if len(T) != 60:
            add(f, f"{len(T)} terms, want 60")
        for t in T:
            over(f, f"{(t.get('term') or {}).get('en')} meaning", (t.get("meaning") or {}).get("en"), 30)
    elif top == "csat":
        p1 = d.get("page1", [])
        if len(p1) != 10:
            add(f, f"page1 has {len(p1)} items, want 10")
        want = {"arithmetic": 3, "data": 2, "logic": 2, "series": 2, "decision": 1}
        if dict(collections.Counter(x.get("type") for x in p1)) != want:
            add(f, f"page1 types {dict(collections.Counter(x.get('type') for x in p1))}, want {want}")
        for a, b in zip(p1, p1[1:]):
            if a.get("type") == b.get("type"):
                add(f, f"items {a.get('n')} and {b.get('n')} are both {a.get('type')}")
        for x in p1 + d.get("page2", {}).get("questions", []):
            if len(x.get("options", {}).get("en", [])) != 4:
                add(f, f"item {x.get('n')}: needs 4 options")
        p = d.get("page2", {}).get("passage", {}).get("en", "")
        if not 250 <= wc(p) <= 350:
            add(f, f"passage is {wc(p)} words, want 250 to 350")
        if len(d.get("page2", {}).get("questions", [])) != 3:
            add(f, "page2 needs 3 questions")
        key = d.get("key", [])
        if len(key) != 13:
            add(f, f"key has {len(key)} answers, want 13")
        for k in key:
            over(f, f"key {k.get('n')} why", (k.get("why") or {}).get("en"), 40)
            if not isinstance(k.get("answer"), int) or not 0 <= k["answer"] <= 3:
                add(f, f"key {k.get('n')}: answer must be 0 to 3")
            if k.get("n", 0) > 10 and k.get("supportingLine") and k["supportingLine"] not in p:
                add(f, f"key {k.get('n')}: supportingLine isn't an exact sentence from the passage")
    elif top == "walk":
        s = d.get("script", {}).get("en", "")
        if not 550 <= wc(s) <= 800:
            add(f, f"script is {wc(s)} English words, want 550 to 800")
        if s.count("[PAUSE") < 4:
            add(f, "script needs 3 chunk pauses and a final pause")
    elif top == "terms":
        T = d.get("terms", [])
        if len(T) != 80:
            add(f, f"{len(T)} terms, want 80")
        for c, n in collections.Counter(t.get("en", "").lower() for t in T).items():
            if n > 1:
                add(f, f"term listed twice: {c}")
        for t in T:
            over(f, f"{t.get('en')} meaning", (t.get("meaning") or {}).get("en"), 20)
    elif top == "optionals" and "/nodes/" in f:
        over(f, "why", d.get("why", {}).get("en"), 60)
        over(f, "note", d.get("note", {}).get("en"), 600)
        pq, rc = d.get("practiceQuestions", []), d.get("recall", [])
        if not 3 <= len(pq) <= 5:
            add(f, f"{len(pq)} practice questions, want 3 to 5")
        if any(q.get("isPYQ") is not False for q in pq):
            add(f, "practice questions must be isPYQ false")
        if not 10 <= len(rc) <= 15:
            add(f, f"{len(rc)} recall cards, want 10 to 15")
        kc = collections.Counter(r.get("kind") for r in rc)
        if set(kc) != {"define", "compare", "example", "apply"} or max(kc.values()) > len(rc) / 2:
            add(f, f"recall kinds {dict(kc)}: mix all four, none more than half")
        for r in rc:
            over(f, "recall answer", (r.get("a") or {}).get("en"), 40)
        if sorted(s.get("for") for s in d.get("skeletons", [])) != list(range(len(pq))):
            add(f, "one skeleton per practice question (for = 0, 1, 2 …)")
        ex = d.get("examples", [])
        if not 3 <= len(ex) <= 5:
            add(f, f"{len(ex)} examples, want 3 to 5")
        for e in ex:
            over(f, "example", e.get("en"), 40)
            if not e.get("source"):
                add(f, f"example without a source: {e.get('en', '')[:50]}")
        for t in d.get("thinkers", []):
            over(f, f"thinker {t.get('name')}", (t.get("idea") or {}).get("en"), 30)
    elif top == "essay":
        if d.get("isPYQ") is not False:
            add(f, "isPYQ must be false")
        for o in d.get("openers", []):
            if re.search(r"[\"“”]", o.get("en", "")):
                add(f, "an opener has quotation marks: never a quote")
    elif top == "restart":
        over(f, "headline", (d.get("headline") or {}).get("en"), 8)
        over(f, "body", (d.get("body") or {}).get("en"), 40)
        if re.search(r"\b\d+\s*(day|week|month)s?\b|\b(days|weeks) (missed|away|gone)\b", json.dumps(d.get("body", {})) + json.dumps(d.get("headline", {})), re.I):
            add(f, "never mention how long someone was away")
    elif top == "interview" and "bank" in f:
        for q in d.get("questions", []):
            if q.get("depth") not in ("opener", "follow-up", "deep"):
                add(f, f"{q.get('id')}: depth must be opener, follow-up or deep")
            if not isinstance(q.get("idkOk"), bool):
                add(f, f"{q.get('id')}: idkOk must be true or false")
            if re.search(r"\b(religio|caste|marri|wedding|family income|salary)", (q.get("q") or {}).get("en", ""), re.I):
                add(f, f"{q.get('id')}: a topic a board shouldn't ask about")

for k, n in ids.items():
    if n > 1:
        add("(all files)", f"id {k} used {n} times")

total = sum(len(v) for v in issues.values())
print(f"{len(files)} files: " + ", ".join(f"{k} {n}" for k, n in sorted(kinds.items())))
for f, L in issues.items():
    print(f"\n{f}")
    for m in L:
        print("  -", m)
print(f"\n{total} issues")
sys.exit(1 if total else 0)
