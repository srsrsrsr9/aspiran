"""Lists each approved note or walk and language that has text but no live audio -> <data>/missing.json (used by build.py --missing).
Refresh <data>/lib.json from production first (README.md)."""
import json, os
DATA = os.environ.get("CARTESIA_DATA", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "audio", "cartesia"))
out = []
for r in json.load(open(os.path.join(DATA, "lib.json")))[0]["results"]:
    j = json.loads(r["json"]); a = j.get("audio") or {}
    if j.get("tone") == "TRAGIC": continue
    src = j.get("sections") if r["kind"] == "read" else j.get("script")
    langs = [l for l in ["en"] + (["hi"] if r["hi_editor"] else []) if l not in a and (src or {}).get(l)]
    if langs: out.append({"id": j["id"], "kind": r["kind"], "langs": langs})
json.dump(out, open(os.path.join(DATA, "missing.json"), "w"), indent=1)
print(len(out), "items,", sum(len(x["langs"]) for x in out), "readings")
