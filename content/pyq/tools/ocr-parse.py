"""Turns a UPSC Prelims paper's English column OCR (tesseract --psm 4 tsv, one file per column, in reading order) into
numbered questions with four options.   python3 -I ocr-parse.py col1.tsv col2.tsv ... > q.json
Every question ends with option (d): the first line after (d) and its wrapped lines that starts at the column's text
edge (not indented like a wrapped option) begins the next question. Question numbers are often lost or read as stray
lines in the margin, so they are ignored and questions are counted in order.
OCR misreads 1/l, quotes and line breaks: a person checks the result against the PDF. Problems go to stderr."""
import csv, json, re, sys, collections

OPT = re.compile(r"^[\s_.,'‘’“\"]*[\(\[\{|]\s*(a|b|c|d|ce|©|e|@|ec|dq|aq|cq|bq|d\))\s*[\)\]\}|][.,]?\s*", re.I)
INLINE = re.compile(r"\s+[_.]?\(([a-d]|ce|ec)\)\s*")
lines = []  # (x relative to the column's text edge, text)
for path in sys.argv[1:]:
    rows = list(csv.DictReader(open(path, encoding="utf-8", errors="ignore"), delimiter="\t", quoting=csv.QUOTE_NONE))
    ls = collections.OrderedDict()
    for r in rows:
        if r["level"] == "5" and r["text"].strip():
            ls.setdefault((r["block_num"], r["par_num"], r["line_num"]), []).append(r)
    items = sorted(((int(ws[0]["top"]), int(ws[0]["left"]), " ".join(w["text"] for w in ws)) for ws in ls.values()))
    items = [(x, t) for _, x, t in items if not re.match(r"^(VGYH|[A-Z]{4}-[A-Z]-[A-Z]{3}|SPACE FOR ROUGH|ROUGH WORK)", t)]
    if not items: continue
    edge = sorted(x for x, _ in items)[len(items) // 2]
    # The left edge is the leftmost common x: take the 20th percentile of lines that aren't margin noise.
    xs = sorted(x for x, _ in items if x > edge - 60)
    edge = xs[len(xs) // 5] if xs else edge
    for x, t in items:
        if x < edge - 60:  # a question number or a stray mark in the margin
            rest = re.sub(r"^\s*[\[\]i\d]{0,3}\s*[.,]?\s*", "", t, count=1)
            if len(re.sub(r"[^A-Za-z]", "", rest)) < 4: continue
            t, x = rest, edge
        lines.append((x - edge, t))

qs, cur, opts = [], None, 0
after_d = False
for dx, t in lines:
    is_opt = bool(OPT.match(t)) and dx < 40
    if cur is None or (after_d and dx < 40 and not is_opt):
        cur = {"stem": [], "opts": []}; qs.append(cur); after_d = False
    if is_opt and len(cur["opts"]) < 4:
        # Short options can sit two to a line: "(a) Clothing (b) Coins".
        for seg in INLINE.split(OPT.sub("", t, count=1))[::2]:
            if len(cur["opts"]) < 4: cur["opts"].append(seg)
            else: cur["opts"][-1] += " " + seg
        after_d = len(cur["opts"]) == 4
    elif cur["opts"]:
        cur["opts"][-1] += " " + t
    else:
        cur["stem"].append(t)
if len(qs) != 100: print(f"found {len(qs)} questions, not 100", file=sys.stderr)
out = []
for n, q in enumerate(qs, 1):
    o = [re.sub(r"\s+", " ", s).strip() for s in q["opts"]] + [""] * (4 - len(q["opts"]))
    if len(q["opts"]) != 4: print(f"{n}: {len(q['opts'])} options: {' '.join(q['stem'])[:60]}", file=sys.stderr)
    out.append({"n": n, "q": "\n".join(q["stem"]).strip(), "options": o})
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
