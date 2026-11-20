"""build.py <id> <draft.json|-> <fix.txt> > transcript.tsv
fix.txt lines:
  @ <words> <marks>                 default words/marks from here on (applies to later question lines)
  <n> <nodes> [| old=>new ;; old=>new]   keep draft question i (counting draft order), fix text
  <n> <nodes> = <full text>          text given in full (draft ignored); "\\n" for new lines
  <n>:<k> ...                        printed number n, draft question k (when draft order differs)
Prelims-style options are not handled here."""
import json, re, sys
pid, dpath, fpath = sys.argv[1:4]
draft = json.load(open(dpath))['q'] if dpath != '-' else []
words = marks = None; out = []; seen = set(); i = 0
for raw in open(fpath, encoding='utf-8'):
    line = raw.rstrip('\n')
    if not line.strip() or line.startswith('#'): continue
    if line.startswith('@'):
        _, w, m = line.split(); words = None if w == '-' else int(w); marks = float(m) if '.' in m else int(m); continue
    m = re.match(r'^(\w+)(?::(\d+))?\s+(\S+)\s*(?:(\|)\s*(.*)|(=)\s*(.*))?$', line)
    if not m: sys.exit(f'{pid}: bad line {line!r}')
    n, k, nodes = m.group(1), m.group(2), m.group(3)
    if m.group(6):
        text = m.group(7); i = int(k) if k else i + 1
    else:
        i = int(k) if k else i + 1
        text = draft[i - 1]['q']
        for rep in (m.group(5) or '').split(';;'):
            if not rep.strip(): continue
            a, b = rep.split('=>', 1); a = a.strip(); b = b.strip()
            if a not in text: sys.exit(f'{pid} Q{n}: {a!r} not in {text!r}')
            text = text.replace(a, b, 1)
    text = re.sub(r'^\W{0,3}\d?\s*\[?\[?\w{2,4}\]?\]?-\w{1,3}-\S{2,7}\s*\|?\s*\d?\s+', '', text)
    text = re.sub(r'^\[\[\[?\w+\]\]\s*\S{0,3}\s*', '', text)
    text = re.sub(r'\s*[({\[]?\s*j?Answer\s+\S{1,3}\s+\S{2,5}\s*(words?\s*)?[)}\]]?\s*\S{0,3}\s*$', '', text, flags=re.I)
    text = re.sub(r'\s*[({]\s*\d{2,3}\s*words?\s*[)}]\s*\S{0,3}\s*$', '', text, flags=re.I)
    text = re.sub(r'\s+\d+\s*\+\s*\d+\s*=\s*\d+\s*$', '', text)
    if n in seen: sys.exit(f'{pid}: Q{n} twice')
    seen.add(n)
    text = re.sub(r'[ \t]+', ' ', text).strip()
    if re.search(r'\[\[|\]\]|\t', text): sys.exit(f'{pid} Q{n}: stray marks')
    mk = '' if marks is None else (str(marks).rstrip('0').rstrip('.') if isinstance(marks, float) else str(marks))
    out.append('\t'.join([n, mk, '' if words is None else str(words), nodes, text]))
print('\n'.join(out))
