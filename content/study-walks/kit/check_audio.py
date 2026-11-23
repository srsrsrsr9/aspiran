"""Check Aspiran Track A audio episodes in a folder. Usage: python3 -I check_audio.py <folder> [--quiet]
Exit code 1 if any problem. Prints one line per problem."""
import json, re, sys, os, glob, collections

root = sys.argv[1]
problems = []
def bad(f, m): problems.append(f"{os.path.basename(f)}: {m}")

DEV = re.compile(r"[ऀ-ॿ]")
BANNED = re.compile(r"\b(AI|A\.I\.|UPSC Pods|editor check|placeholder|hurry|last chance|guaranteed|topper'?s?|you should have|streak|subscribe|next episode|next time|stay tuned|keep listening)\b", re.I)
BANNED_CASE = re.compile(r"\bAI\b")  # case-sensitive "AI"
HI_BANNED = re.compile(r"(टॉपर|गारंटी|जल्दी करें|अगले एपिसोड|अगली बार|सब्सक्राइब)")
LENGTH = {
    "audio-study-walk-A1": ((1650, 2050), (1750, 2400)),
    "audio-study-walk": ((1100, 1380), (1150, 1650)),
    "audio-answer-writing": ((1350, 1650), (1400, 1950)),
}
TONES = {"NEUTRAL", "HOPEFUL", "SERIOUS", "TRAGIC"}
FIELDS = ["id", "version", "batch", "kind", "title", "node", "line", "minutes", "words", "tone", "speakers",
          "pastQuestions", "sources", "recall", "factsToCheck", "notes", "review"]
wc = lambda s: len(re.findall(r"\S+", s))

pyq = {}
kit = os.path.dirname(os.path.abspath(__file__))
try:
    for p in json.load(open(os.path.join(kit, "pyq.json"), encoding="utf-8"))["papers"]:
        pyq[p["id"]] = {str(q["n"]) for q in p["questions"]}
except Exception as e:
    print("warning: could not load pyq.json", e)

def script_text(path):
    t = open(path, encoding="utf-8").read()
    body = []
    for i, line in enumerate(t.splitlines(), 1):
        s = line.strip()
        if not s: continue
        if s == "[pause 4s]": continue
        if not (s.startswith("N: ") or s.startswith("F: ")):
            bad(path, f"line {i} does not start with 'N: ' or 'F: ': {s[:50]}")
            continue
        body.append(s[3:])
    return t, " ".join(body)

ids = collections.Counter()
answers = collections.Counter()
for jf in sorted(glob.glob(os.path.join(root, "*.json"))):
    if os.path.basename(jf).startswith("_"): continue
    try:
        d = json.load(open(jf, encoding="utf-8"))
    except Exception as e:
        bad(jf, f"JSON does not parse: {e}"); continue
    for k in FIELDS:
        if k not in d: bad(jf, f"missing field {k}")
    for k in d:
        if k not in FIELDS: bad(jf, f"unexpected field {k}")
    i = d.get("id", "")
    ids[i] += 1
    if not re.fullmatch(r"a[0-9][a-z0-9-]*", str(i)): bad(jf, f"id not lowercase-hyphen starting a<n>: {i}")
    if os.path.basename(jf) != f"{i}.json": bad(jf, "file name does not match id")
    if d.get("version") != 1: bad(jf, "version not 1")
    if d.get("review") != {"status": "draft"}: bad(jf, "review not draft")
    if d.get("tone") not in TONES: bad(jf, f"bad tone {d.get('tone')}")
    if d.get("tone") == "TRAGIC": bad(jf, "TRAGIC topics get no walk audio")
    for k in ("title",):
        v = d.get(k) or {}
        if not v.get("en") or not DEV.search(v.get("hi", "")): bad(jf, f"{k} needs en and Devanagari hi")
    ln = d.get("line")
    if ln is not None and (not isinstance(ln, dict) or not DEV.search(ln.get("hi", "")) or not ln.get("en")):
        bad(jf, "line must be null or {index,en,hi}")
    src = d.get("sources") or []
    if len(src) < 2: bad(jf, f"only {len(src)} sources")
    for s in src:
        if not isinstance(s, dict) or set(s) != {"name", "url", "opened", "what"}: bad(jf, f"source not {{name,url,opened,what}}: {str(s)[:60]}"); continue
        if not re.match(r"https?://", s["url"]): bad(jf, f"source url not http: {s['url'][:50]}")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", s["opened"]): bad(jf, f"opened not a date: {s['opened']}")
        if not s["what"].strip(): bad(jf, "source with empty 'what'")
    for pq in d.get("pastQuestions") or []:
        if pq.get("paper") not in pyq or str(pq.get("n")) not in pyq[pq.get("paper")]:
            bad(jf, f"past question not in pyq.json: {pq}")
    rc = d.get("recall") or []
    if len(rc) != 3: bad(jf, f"{len(rc)} recall questions, expected 3")
    for r in rc:
        try:
            oe, oh = r["options"]["en"], r["options"]["hi"]
            if len(oe) != len(oh) or len(oe) < 2: bad(jf, "recall options en/hi lengths differ")
            if not (0 <= r["answerIndex"] < len(oe)): bad(jf, "answerIndex out of range")
            answers[r["answerIndex"]] += 1
            for x in oh + [r["q"]["hi"], r["why"]["hi"]]:
                if not DEV.search(x): bad(jf, f"recall hi without Devanagari: {x[:30]}")
            if not r["q"]["en"] or not r["why"]["en"]: bad(jf, "recall en empty")
        except Exception as e:
            bad(jf, f"recall item malformed: {e}")
    if not isinstance(d.get("factsToCheck"), list): bad(jf, "factsToCheck not a list")
    # scripts
    words = {}
    for lang in ("en", "hi"):
        tf = os.path.join(root, f"{i}.{lang}.txt")
        if not os.path.exists(tf): bad(jf, f"missing {i}.{lang}.txt"); continue
        raw, body = script_text(tf)
        words[lang] = wc(body)
        if raw.count("[pause 4s]") < 3: bad(tf, f"only {raw.count('[pause 4s]')} [pause 4s] markers")
        stripped = raw.replace("[pause 4s]", "")
        dig = re.findall(r"[0-9०-९]+", stripped)
        if dig: bad(tf, f"digits in script (say numbers in words): {dig[:6]}")
        if re.search(r"[\[\]\(\)#*•|]", stripped): bad(tf, "brackets, markup or bullets in script")
        if BANNED_CASE.search(stripped) or BANNED.search(stripped):
            m = (BANNED_CASE.search(stripped) or BANNED.search(stripped)).group(0)
            bad(tf, f"banned word: {m}")
        if lang == "hi":
            if not DEV.search(raw): bad(tf, "Hindi script has no Devanagari")
            if HI_BANNED.search(raw): bad(tf, f"banned Hindi word: {HI_BANNED.search(raw).group(0)}")
            latin = len(re.findall(r"[A-Za-z]+", body)); total = max(1, wc(body))
            if latin / total > 0.08: bad(tf, f"Hindi script is {latin*100//total}% Latin-script words (Hinglish?)")
        if "F: " not in raw: bad(tf, "no F: lines")
    kind = d.get("kind")
    key = "audio-study-walk-A1" if (kind == "audio-study-walk" and str(d.get("batch")) == "A1") else kind
    if key in LENGTH and words:
        (elo, ehi), (hlo, hhi) = LENGTH[key]
        if "en" in words and not (elo <= words["en"] <= ehi): bad(jf, f"English {words['en']} words, need {elo}-{ehi}")
        if "hi" in words and not (hlo <= words["hi"] <= hhi): bad(jf, f"Hindi {words['hi']} words, need {hlo}-{hhi}")
    elif key not in LENGTH: bad(jf, f"unknown kind {kind}")
    if words and d.get("words") != {"en": words.get("en"), "hi": words.get("hi")}:
        bad(jf, f"words field {d.get('words')} != counted {words}")
    # strings in json
    blob = json.dumps(d, ensure_ascii=False)
    if BANNED_CASE.search(blob) or re.search(r"UPSC Pods|editor check|placeholder", blob, re.I): bad(jf, "banned word in json")
for i, n in ids.items():
    if n > 1: problems.append(f"duplicate id {i}")
for p in problems: print(p)
print(f"checked {sum(ids.values())} episodes; {len(problems)} problems; answer positions {dict(sorted(answers.items()))}")
sys.exit(1 if problems else 0)
