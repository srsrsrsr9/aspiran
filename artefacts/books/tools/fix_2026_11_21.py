"""One-off fixes to the 21 Nov 2026 workbook deliveries (B1 Syllabus Companion, B2 Polity).
Reads the delivered JSON, writes corrected copies next to the layouts. Every fix is listed in ../NOTES-2026-11-21-B1-B2.md.
Usage: python3 -I fix_2026_11_21.py <B1 workbook.json> <B2 workbook.json> <pyq.json> <repo artefacts/books>"""
import json, re, sys, pathlib
b1p, b2p, pyqp, out = sys.argv[1:5]
pyq = json.load(open(pyqp)); P = {p["id"]: p for p in pyq["papers"]}
Q = {(p["id"], q["n"]): q for p in pyq["papers"] for q in p["questions"]}
log = []
def clean(s): return re.sub(r"[ \t]+", " ", s).strip()
def qnum(n): return re.sub(r"[()]", "", re.sub(r"^Q", "", n))

# ---------- B1 ----------
b1 = json.load(open(b1p))
for pg in b1["parts"]["mains-planning"]["pages"]:
    n = qnum(pg["pyq"]["n"])
    if n != pg["pyq"]["n"]: log.append(f"B1 {pg['id']}: question number '{pg['pyq']['n']}' written as '{n}' to match the past-paper file"); pg["pyq"]["n"] = n
    q = Q[(pg["pyq"]["id"], n)]
    for lang in ("en", "hi"):
        t = clean(q[lang]["q"])
        if pg[lang]["question"] != t:
            log.append(f"B1 {pg['id']} ({lang}): question text set to UPSC's wording from the past-paper file (spacing only)"); pg[lang]["question"] = t
nfix = 0
for r in b1["backMatter"]["pyqTracker"]["rows"]:
    n = qnum(r["n"])
    if n != r["n"]: r["n"] = n; nfix += 1
if nfix: log.append(f"B1 past-question tracker: {nfix} question numbers like 'Q1' or '1(a)' written as '1' / '1a' to match the past-paper file")

cells = 0
for pg in b1["parts"]["pyq-counts"]["pages"]:
    paper = pg["paper"]; nodes = [r["node"] for r in pg["rows"]]; two = 0; have = False
    for y in ("2024", "2025", "2026"):
        pid = ("csp" if paper == "prelims" else "csm") + f"-{y}-" + ("gs1" if paper == "prelims" else paper)
        if pid not in P: continue
        have = True
        two += sum(1 for q in P[pid]["questions"] if sum(1 for n in q["nodes"] if n in nodes) > 1)
        for r in pg["rows"]:
            c = sum(1 for q in P[pid]["questions"] if r["node"] in q["nodes"])
            if r[y] != c: cells += 1; r[y] = c
    for r in pg["rows"]:
        if have: r["total"] = sum(r[y] for y in ("2024", "2025", "2026") if r[y] != "")
    if "questionsWithTwoTags" in pg: pg["questionsWithTwoTags"] = two
log.append(f"B1 past questions by topic: {cells} counts recomputed from the app's past-paper file (the delivery used an older set of topic tags); totals and two-tag counts redone")

READ = {  # (page, index): (en, hi), only lines whose numbers changed
 ("wb-b1-pyq-prelims", 0): ("Current events (pre-1) and economy and social development (pre-5) had the most questions over the three years, about 20 each a year.",
                            "तीन वर्षों में सबसे ज़्यादा प्रश्न सामयिक घटनाओं (pre-1) और आर्थिक तथा सामाजिक विकास (pre-5) से आए, हर साल लगभग 20-20।"),
 ("wb-b1-pyq-prelims", 1): ("Some questions carry two topic tags, so the topic totals add up to more than 300. Read the numbers as 'how often a topic shows up', not as shares.",
                            "कुछ प्रश्नों पर दो topic के tag हैं, इसलिए topic के total 300 से ज़्यादा हो जाते हैं। इन अंकों को 'topic कितनी बार दिखा' की तरह पढ़िए, हिस्सेदारी की तरह नहीं।"),
 ("wb-b1-pyq-gs1", 0): ("Indian society (gs1-6) gave 20 of the 60 questions in these three years, more than any other topic.",
                        "भारतीय समाज (gs1-6) से इन तीन वर्षों के 60 में से 20 प्रश्न आए, किसी भी दूसरे topic से ज़्यादा।"),
 ("wb-b1-pyq-gs1", 1): ("History topics (gs1-2 to gs1-5) gave only 2 to 4 questions each. Resources and industry location (gs1-8) rose from 1 to 5.",
                        "इतिहास के topic (gs1-2 से gs1-5) से हर एक में सिर्फ़ 2 से 4 प्रश्न आए। संसाधन और उद्योगों की अवस्थिति (gs1-8) 1 से बढ़कर 5 हो गई।"),
 ("wb-b1-pyq-gs2", 1): ("Each question here carries one main topic, so the totals add up to 60.",
                        "यहाँ हर प्रश्न का एक मुख्य topic है, इसलिए total 60 बनता है।"),
 ("wb-b1-pyq-gs2", 2): ("Every topic but one got at least 3 questions in three years: GS II rewards covering the whole map more than guessing.",
                        "तीन साल में एक को छोड़ हर topic से कम से कम 3 प्रश्न आए: GS II में अनुमान लगाने से ज़्यादा पूरे map को cover करना काम आता है।"),
 ("wb-b1-pyq-gs3", 0): ("Agriculture (gs3-3) and internal security (gs3-8) came up most often, with science and technology (gs3-5) and conservation (gs3-6) next.",
                        "कृषि (gs3-3) और आंतरिक सुरक्षा (gs3-8) सबसे ज़्यादा बार आए, उसके बाद विज्ञान एवं प्रौद्योगिकी (gs3-5) और संरक्षण (gs3-6)।"),
 ("wb-b1-pyq-gs3", 2): ("Three years is a small sample. Use the earlier-years column to see if this pattern holds.",
                        "तीन साल छोटा sample है। यह pattern टिकता है या नहीं, यह पिछले वर्षों वाले column से देखिए।"),
}
for pg in b1["parts"]["pyq-counts"]["pages"]:
    for (pid, i), (en, hi) in READ.items():
        if pg["id"] == pid: pg["reading"]["en"][i] = en; pg["reading"]["hi"][i] = hi
log.append(f"B1 past questions by topic: {len(READ)} reading notes (en and hi) rewritten to match the recomputed counts")
b1["parts"]["syllabus-map"]["factsToCheck"] = [f for f in b1["parts"]["syllabus-map"]["factsToCheck"] if "100 questions" not in f]
log.append("B1 fact to check closed: Prelims GS I has 100 questions (all three transcribed papers, 2024 to 2026, have 100)")

# ---------- B2 ----------
b2 = json.load(open(b2p))
for ch in b2["chapters"]:
    for b in ch["blocks"]:
        if b["type"] == "mains":
            q = Q[(b["pyq"]["id"], b["pyq"]["n"])]
            for lang in ("en", "hi"):
                t = clean(q[lang]["q"])
                if b[lang]["question"] != t:
                    log.append(f"B2 ch{ch['n']:02d} Mains ({lang}): question text set to UPSC's wording from the past-paper file (spacing only)"); b[lang]["question"] = t

pathlib.Path(out, "syllabus-companion", "workbook.json").write_text(json.dumps(b1, ensure_ascii=False, indent=1))
pathlib.Path(out, "polity-workbook", "workbook.json").write_text(json.dumps(b2, ensure_ascii=False, indent=1))
print("\n".join(log))
