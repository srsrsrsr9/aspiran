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

HEADER = re.compile(r"^[\W_]*[HA]?GY-P-JHK[I!|\]]\W*(\(?\s*\d+\s*[-\u2013\u2014+.]*\s*[A/]?\s*\)?\.?)?\s*")
CODE = re.compile(r"^[\dLlsi,\s.]*(and|ang|only|Both|Neither)?[\dLlsi,\s.and]*(only)?\W*$")

def fix_code(o):
    """Answer codes like "1, 2 and 3 only": OCR reads 3 as 8, 38 or 83, "1 and" as "land", "1" as "od"."""
    o = re.sub(r"^[^\w(]+", "", o)
    if not re.search(r"\d|^od\b", o) or len(o) > 30 or re.search(r"[a-z]{4,}", o.replace("only", "")): return o
    o = re.sub(r"\b(?:[Ll]and|ang)\b", lambda m: "1 and" if m.group(0)[0] in "Ll" else "and", o)
    o = re.sub(r"\bod\b", "1", o)
    o = re.sub(r"\b(?:83|38|s8|8|30)\b", "3", o)
    o = re.sub(r"\bonly\b.*$", "only", o)
    o = re.sub(r"\s+[*{}>~\-\u2014.\d]+$", "", o) if not o.rstrip().endswith("only") and re.search(r"\d\s+\d+$", o) else re.sub(r"\s*[*{}>~\-\u2014]+$", "", o)
    return o.strip()

def money(s):
    s = re.sub(r"(\d{1,2}), ?(\d\d), ?(\d{3})\b", r"\1,\2,\3", s)
    return re.sub(r"(?:= ?|\u20b9 ?)(?=\d{1,2},\d\d,\d{3})", "\u20b9", s)

def fix_stem(s):
    s = money(s)
    out = []
    for line in s.split("\n"):
        line = HEADER.sub("", line.strip())
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
    return "\\n".join(money(fix(l)) for l in out)

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
    row = "\t".join([fix_stem(q["q"])] + [fix_code(money(fix(o))) for o in q["options"]])
    for old, new in FIXES.get(str(q["n"]), []):
        if old not in row: print(f"Q{q['n']}: fix not found: {old}", file=sys.stderr)
        row = row.replace(old, new)
    print("\t".join([str(q["n"]), "", "", nodes.get(str(q["n"]), ""), row]))
    continue
    print("\t".join([str(q["n"]), "", "", nodes.get(str(q["n"]), ""), fix_stem(q["q"])] + [fix(o) for o in q["options"]]))
