"""Chooses which notes and walks to voice first so the hours spread evenly: paper, then subject, round-robin.
python3 plan.py [minutes per paper, both languages together; default 105]  ->  <data>/plan.json and a table."""
import json, os, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get("CARTESIA_DATA", os.path.join(HERE, "..", "..", "audio", "cartesia"))
EN_CPS, HI_CPS = 15.5, 12.5      # characters a second, measured on test takes
PREFIX = {"anc": ("GS1", "Ancient, medieval and culture"), "art": ("GS1", "Ancient, medieval and culture"), "geo": ("GS1", "Geography"),
          "soc": ("GS1", "Indian society"), "ir": ("GS2", "International relations"), "eco": ("GS3", "Economy"), "env": ("GS3", "Environment"),
          "sci": ("GS3", "Science and technology"), "sec": ("GS3", "Internal security"), "eth": ("GS4", "Ethics"), "csat": ("Prelims", "CSAT"), "ess": ("Essay", "Essay")}
WALK = {"ethics": ("GS4", "Ethics"), "polity": ("GS2", "Polity"), "environment": ("GS3", "Environment"), "science": ("GS3", "Science and technology"),
        "economy": ("GS3", "Economy"), "geography": ("GS1", "Geography"), "society": ("GS1", "Indian society")}

def place(kind, j):
    if kind == "walk-script":
        a, b = j["nodes"][0].split("/")
        if a == "history": return ("GS1", "Modern history" if b == "national-movement" else "Ancient, medieval and culture")
        return WALK[a]
    p, topic = j["id"].split("-")[0], j.get("topic", "")
    if j["id"] == "soc-cooperative-federalism": return ("GS2", "Polity")
    if p == "pol": return ("GS2", "Governance and social justice" if topic.startswith("Governance") else "Polity")
    if p == "his": return ("GS1", "World history" if topic == "World history" else "Modern history")
    if p == "eth": return ("GS4", "Ethics: thinkers and cases" if topic == "Ethics, Integrity and Aptitude" else "Ethics: concepts")
    return PREFIX[p]

def candidates():
    rows = json.load(open(os.path.join(DATA, "lib.json")))[0]["results"]
    out = []
    for r in rows:
        if r["kind"] not in ("read", "walk-script"): continue
        j = json.loads(r["json"])
        if j.get("tone") == "TRAGIC": continue
        if r["kind"] == "read":
            en = sum(len(s["body"]) for s in j["sections"]["en"]); hi = sum(len(s["body"]) for s in (j["sections"].get("hi") or [])) if r["hi_editor"] else 0
            title = j["title"]["en"]
        else:
            en = len(j["script"]["en"]); hi = len(j["script"].get("hi") or "") if r["hi_editor"] else 0; title = j["topic"]["en"]
        paper, subject = place(r["kind"], j)
        out.append({"kind": r["kind"], "id": j["id"], "title": title, "paper": paper, "subject": subject, "en": en, "hi": hi,
                    "min": round(en / EN_CPS / 60 + hi / HI_CPS / 60, 1)})
    return out

if __name__ == "__main__":
    budget = float(sys.argv[1]) if len(sys.argv) > 1 else 105
    cs = candidates()
    papers = ["GS1", "GS2", "GS3", "GS4", "Prelims", "Essay"]
    picked, rest = [], []
    per = {}
    for p in papers:
        subs = collections.OrderedDict()
        # both languages first, walks (short) before notes, shorter notes first so more subjects fit
        for c in sorted([c for c in cs if c["paper"] == p], key=lambda c: (c["hi"] == 0, c["kind"] != "walk-script", c["en"])):
            subs.setdefault(c["subject"], []).append(c)
        order, total = [], 0.0
        while any(subs.values()):
            for s in sorted(subs, key=lambda s: sum(x["min"] for x in order if x["subject"] == s)):   # the subject with least so far goes next
                if subs[s]:
                    c = subs[s].pop(0)
                    if total + c["min"] <= budget + 6 and c["hi"]: order.append(c); total += c["min"]
                    else: rest.append(c)
                    break
        per[p] = order
    # interleave papers so a stop at any point is still even
    k = 0
    while any(per.values()):
        p = papers[k % len(papers)]; k += 1
        if per[p]: picked.append(per[p].pop(0))
    json.dump({"first": picked, "rest": rest}, open(os.path.join(DATA, "plan.json"), "w"), ensure_ascii=False, indent=1)
    t = collections.defaultdict(lambda: [0, 0.0])
    for c in picked: t[(c["paper"], c["subject"])][0] += 1; t[(c["paper"], c["subject"])][1] += c["min"]
    for (p, s), (n, m) in sorted(t.items()): print(f"{p:8} {s:32} {n:3} pieces {m:6.1f} min")
    for p in papers: print(p, round(sum(c["min"] for c in picked if c["paper"] == p)), "min")
    print("total", len(picked), "pieces", round(sum(c["min"] for c in picked) / 60, 1), "h,", sum(c["en"] + c["hi"] for c in picked), "chars; rest", len(rest))
