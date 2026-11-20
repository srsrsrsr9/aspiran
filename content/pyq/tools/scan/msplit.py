"""msplit.py <ocr dir>: English lines of a Mains paper split into questions at '(… N words) M'. Prints JSON."""
import re, sys, glob, json
d = sys.argv[1]
def pages():
    fs = sorted(glob.glob(d + '/p-*.txt'), key=lambda f: int(re.search(r'p-(\d+)', f).group(1)))
    return fs
lines = []
fs = pages()
if fs and re.search(r'INSTRUCTIONS', open(fs[0], encoding='utf-8').read(), re.I): fs = fs[1:]
for f in fs:
    for l in open(f, encoding='utf-8'):
        l = l.rstrip()
        if not l.strip(): continue
        dev = len(re.findall('[ऀ-ॿ]', l)); lat = len(re.findall('[A-Za-z]', l))
        if dev >= lat or lat < 2 and not re.fullmatch(r'\s*\d{1,2}\s*', l): continue
        if re.match(r'^[A-Z]{2,4}-[A-Z0-9]-[A-Z0-9]{2,5}\S*(\s+\d+)?\s*$', l.strip()): continue  # footer code
        if re.search(r'P\.?\s*T\.?\s*O', l): continue
        if re.match(r'^\W*(\S{1,6}\s*/\s*)?SECTION\s*[-—–]?\s*\S{0,2}\s*$', l.strip(), re.I): continue
        if re.fullmatch(r'\W*\d{1,2}\W*', l.strip()): continue
        lines.append(l.strip())
text = '\n'.join(lines)
# drop the cover instructions: start at first SECTION or first line after 'QUESTION PAPER SPECIFIC INSTRUCTIONS' block end
start = 0
body = text[start:]
MARK = re.compile(r'[({\[]\s*(?:Answer\s+\S{1,3}\s+)?(?:about\s+)?(\d{2,4})\s*w\w{2,5}\s*[)}\]]\s*[.,\'"|;]?\s*(\d{1,3}(?:\.\d)?|12[.,]5|12[%½])?\s*\S{0,3}\s*$', re.I)
END = re.compile(r'(?<=[.?!"\')\w:\]}-])\s*[;|]?\s+(10|15|20|25|12[%½]|12\.5|12½|12 ?1/2)\s*[.,\'"|;:]?\s*$')
out = []; cur = []
for l in body.split('\n'):
    if re.match(r'^\s*Answer.{0,8}all the following', l, re.I) or re.match(r'^\s*words\. Each question carries', l, re.I): cur = []; continue
    m = MARK.search(l)
    if m:
        cur.append(l[:m.start()]); out.append({'q': '\n'.join(cur).strip(), 'words': int(m.group(1)), 'marks': m.group(2)}); cur = []; continue
    m = END.search(l)
    if m and cur is not None and len(' '.join(cur + [l])) > 25:
        cur.append(l[:m.start()]); out.append({'q': '\n'.join(cur).strip(), 'words': None, 'marks': m.group(1)}); cur = []; continue
    cur.append(l)
tail = '\n'.join(cur).strip()

def clean(t):
    t = t.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"').replace('—', '-').replace('–', '-')
    t = re.sub(r'(\w)-\n(\w)', r'\1-\2', t)
    t = re.sub(r'\s*\n\s*', ' ', t)
    t = re.sub(r'\s+7\s+(?=[A-Z])', '? ', t); t = re.sub(r'\s+7\s*$', '?', t)
    t = re.sub(r'\s+([?,.;:])', r'\1', t)
    t = re.sub(r'\s{2,}', ' ', t)
    return t.strip()
for o in out: o['q'] = clean(o['q'])
json.dump({'n': len(out), 'q': out, 'tail': tail, 'head': text[:start][-600:]}, sys.stdout, ensure_ascii=False, indent=1)
