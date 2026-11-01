import sys, json, re, os
src, out = sys.argv[1], sys.argv[2]
t = open(src, encoding="utf-8").read().replace("\r\n", "\n")
dec = json.JSONDecoder()
paths = [m for m in re.finditer(r"^(aspiran-content/\S+)(?: \((\w+)\))?\s*$", t, re.M)]
batch = "B01"; res = []
for i, m in enumerate(paths):
    p, b = m.group(1), m.group(2)
    end = paths[i+1].start() if i+1 < len(paths) else len(t)
    seg = t[m.end():end]
    if b: batch = b
    j = seg.find("{")
    try:
        obj, k = dec.raw_decode(seg[j:])
        ok = True
    except Exception as e:
        obj, ok = None, str(e)[:80]
    if p.endswith("manifest.json") or p.endswith("self-check.json"):
        if obj and obj.get("batch"): batch = obj["batch"]
    res.append((m.start(), p, batch, ok, obj))
# second pass: batch label for a file = batch of the next manifest after it
mans = [(pos, obj.get("batch")) for pos, p, b, ok, obj in res if p.endswith("manifest.json") and obj]
for pos, p, b, ok, obj in res:
    nb = next((mb for mpos, mb in mans if mpos >= pos), "?")
    d = os.path.join(out, nb, p); os.makedirs(os.path.dirname(d), exist_ok=True)
    if obj is not None: json.dump(obj, open(d, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(nb, p, "OK" if ok is True else "BAD JSON: " + ok)
# trailing text after last block
print("---TAIL---"); print(t[-1500:])
