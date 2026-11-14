"""Fixes the usual OCR slips in a parsed Prelims paper (ocr-parse.py output) and writes the pyq.mjs TSV.
python3 -I ocr-clean.py q.json [nodes.txt] > paper.tsv     nodes.txt: one "n<TAB>pre-3" per line (optional).
"1 and 2" read as "land 2", "1 only" as "lonly", missing spaces around "and", curly-quote noise, stray marks."""
import json, re, sys

def fix(s):
    s = s.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\b[lI]\s*only\b", "1 only", s)
    s = re.sub(r"\b1?[lI]\s*and\s*(?=\d)", "1 and ", s)
    s = re.sub(r"\b1\s*land\s*(?=\d)", "1 and ", s)
    s = re.sub(r"\bBoth\s*1\s*l?and\s*", "Both 1 and ", s)
    s = re.sub(r"\bBoth\s*[lI1]\s*and\s*", "Both 1 and ", s)
    s = re.sub(r"\bNeither\s*[lI1]\.?\s*nor\s*", "Neither 1 nor ", s)
    s = re.sub(r"(\d)\s*and\s*(\d)", r"\1 and \2", s)
    s = re.sub(r"(\d)\s*only\b", r"\1 only", s)
    s = re.sub(r"(\d),\s*(?=\d)", r"\1, ", s)
    s = re.sub(r"\bIfa\b", "If a", s)
    s = re.sub(r"\bIna\b", "In a", s)
    s = re.sub(r"\s+[|_.,'\"P]+$", "", s)  # stray marks after an option
    s = re.sub(r"(^|\s)[_|§©]+\s*'?\s*(?=\S)", r"\1", s)  # stray marks inside the text
    s = re.sub(r"^(\d{1,2}\.\s)['_|]\s*", r"\1", s)
    s = re.sub(r"^[,.]\s*", "", s)
    s = re.sub(r"\s+([,.;:?])", r"\1", s).replace(" :", ":")
    return s.strip()

def fix_stem(s):
    out = []
    for line in s.split("\n"):
        line = re.sub(r"^[|'\"‘’“.]+\s*", "", line.strip())
        line = re.sub(r"\s+[|<>~—]+\s*$", "", line)
        if not line: continue
        # A numbered statement starts a new line; anything else continues the one before.
        if out and not re.match(r"^(\d{1,2}[.,;]|[iI][.,]?\s|List|Which|Select|How many|Who|What|Consider)(?=\s|$)|^(Which|Select|How many)\b", line):
            out[-1] += " " + line
        else:
            out.append(line)
    # Statements are numbered 1, 2, 3...: OCR reads 1 as "i" and 3 as "8".
    k = 0
    for i, l in enumerate(out):
        m = re.match(r"^([iI]|\d{1,2})[.,;]?\s+", l)
        if not m: continue
        want = k + 1
        got = m.group(1)
        if got == str(want) or (got in "iI" and want == 1) or (got in ("8", "38") and want == 3) or (got == "65" and want == 5):
            out[i] = f"{want}. " + l[m.end():]; k = want
    return "\\n".join(fix(l) for l in out)

qs = json.load(open(sys.argv[1], encoding="utf-8"))
# Corrections a person made against the PDF: <paper>.fixes.json beside the OCR, {"n": [["old", "new"], ...]}.
import os
fx = sys.argv[1].replace(".ocr.json", ".fixes.json")
FIXES = json.load(open(fx, encoding="utf-8")) if os.path.exists(fx) else {}
nodes = {}
if len(sys.argv) > 2:
    for l in open(sys.argv[2], encoding="utf-8"):
        if l.strip(): n, v = l.split(); nodes[n] = v
for q in qs:
    row = "\t".join([fix_stem(q["q"])] + [fix(o) for o in q["options"]])
    for old, new in FIXES.get(str(q["n"]), []):
        if old not in row: print(f"Q{q['n']}: fix not found: {old}", file=sys.stderr)
        row = row.replace(old, new)
    print("\t".join([str(q["n"]), "", "", nodes.get(str(q["n"]), ""), row]))
    continue
    print("\t".join([str(q["n"]), "", "", nodes.get(str(q["n"]), ""), fix_stem(q["q"])] + [fix(o) for o in q["options"]]))
