"""Prints what has been voiced so far as a table: paper x subject x minutes (English, Hindi), and the totals by provider."""
import json, os, glob, collections
import plan
D = plan.DATA
where = {(c["kind"], c["id"]): c for c in plan.candidates()}
pub = json.load(open(os.path.join(D, "published.json"))) if os.path.exists(os.path.join(D, "published.json")) else {}
t = collections.defaultdict(lambda: {"n": set(), "en": 0.0, "hi": 0.0}); prov = collections.Counter(); chars = collections.Counter(); failed = []; live = 0.0
for f in sorted(glob.glob(os.path.join(D, "out", "*", "*.json"))):
    r = json.load(open(f))
    if r["failed"]: failed.append(f'{r["id"]}.{r["lang"]} chunks {r["failed"]}'); continue
    c = where[(r["kind"], r["id"])]; k = (c["paper"], c["subject"])
    t[k]["n"].add(r["id"]); t[k][r["lang"]] += r["seconds"] / 60
    prov[f'{r["model"]} / {r["voice"]} ({r["lang"]})'] += r["seconds"] / 60; chars[r["provider"]] += r["chars"]
    if f'{r["kind"]}:{r["id"]}.{r["lang"]}' in pub: live += r["seconds"]
print("| Paper | Subject | Pieces | English min | Hindi min | Total min |\n|---|---|---|---|---|---|")
tot = collections.defaultdict(float)
for (p, s), v in sorted(t.items()):
    print(f'| {p} | {s} | {len(v["n"])} | {v["en"]:.0f} | {v["hi"]:.0f} | {v["en"] + v["hi"]:.0f} |'); tot[p] += v["en"] + v["hi"]
print("\n| Paper | Minutes |\n|---|---|"); [print(f"| {p} | {m:.0f} |") for p, m in sorted(tot.items())]
print(f"\nTotal: {sum(tot.values()) / 60:.1f} hours in {sum(len(v['n']) for v in t.values())} pieces; live: {live / 3600:.1f} hours")
print("\n| Voice | Minutes |\n|---|---|"); [print(f"| {k} | {m:.0f} |") for k, m in sorted(prov.items())]
print("\nCharacters voiced (kept takes):", dict(chars)); print("Not passed:", failed or "none")

# What is still to voice: every planned note or walk without a passed reading, per paper and subject, with characters as spoken.
import sys; sys.argv = sys.argv[:1]; import build
from speak import speak
rows = {(r["kind"], json.loads(r["json"])["id"]): r for r in json.load(open(build.LIB))[0]["results"]}
left = collections.defaultdict(lambda: {"n": set(), "en": 0, "hi": 0, "ren": 0, "rhi": 0})
for (kind, iid), c in where.items():
    if (kind, iid) not in rows: continue
    for u in build.units([rows[(kind, iid)]], None, ["en", "hi"]):
        o = os.path.join(D, "out", kind, f'{iid}.{u["lang"]}.json')
        if os.path.exists(o) and not json.load(open(o))["failed"]: continue
        L = left[(c["paper"], c["subject"])]; L["n"].add(iid); L["r" + u["lang"]] += 1
        L[u["lang"]] += sum(len(speak(t, u["lang"])) for _, t, _, _ in u["chunks"])
print("\nStill to voice\n| Paper | Subject | Notes | English readings | Hindi readings | Characters |\n|---|---|---|---|---|---|")
for (p, s), v in sorted(left.items()): print(f'| {p} | {s} | {len(v["n"])} | {v["ren"]} | {v["rhi"]} | {v["en"] + v["hi"]:,} |')
print(f'Total left: {sum(len(v["n"]) for v in left.values())} notes, {sum(v["ren"] + v["rhi"] for v in left.values())} readings, '
      f'{sum(v["en"] for v in left.values()):,} English + {sum(v["hi"] for v in left.values()):,} Hindi characters')
