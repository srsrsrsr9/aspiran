"""review.py <draft.json>: numbered questions, unknown words in [[ ]]."""
import json, re, sys, os
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = set(w.strip().lower() for w in open('/usr/share/dict/words'))
extra = os.path.join(S, 'tools', 'vocab.txt')
if os.path.exists(extra): V |= set(w.strip().lower() for w in open(extra))
def known(w):
    lw = w.lower()
    if lw in V or not re.search('[a-z]', lw): return True
    for suf in ('s', 'es', 'ed', 'd', 'ing', 'ly', "'s", 'ies', 'ation', 'al', 'ism', 'ist', 'ists', 'isation', 'ization', 'ise', 'ised'):
        if lw.endswith(suf) and (lw[:-len(suf)] in V or lw[:-len(suf)] + 'e' in V or lw[:-len(suf)] + 'y' in V): return True
    return False
d = json.load(open(sys.argv[1]))
for i, q in enumerate(d['q'], 1):
    t = re.sub(r"[A-Za-z][A-Za-z']*", lambda m: m.group(0) if known(m.group(0).strip("'")) else '[[' + m.group(0) + ']]', q['q'])
    print(f"{i}|{q['words']}|{q['marks']}|{t}")
if d['tail']: print('TAIL|' + d['tail'][:400].replace('\n', ' / '))
