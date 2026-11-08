"""Checks batch specs: quiz options that won't fit (>30 chars), kickers that won't fit (>26), cue words not spoken."""
import json, re, subprocess, sys
norm = lambda s: re.sub(r"[^a-z0-9-]", "", s.lower())
for f in sys.argv[1:]:
    for e in json.loads(subprocess.run([sys.executable, f], capture_output=True, text=True, check=True).stdout):
        tag = f"{e['n']} {e['id']}"
        for o in e["quiz"]["options"]:
            if len(o) > 30: print(tag, "OPTION", len(o), o)
        for b in e["beats"]:
            if len(b.get("kicker", "")) > 26: print(tag, "KICKER", b["kicker"])
            words = [norm(w) for _, t in b["lines"] for w in t.split()]
            cues = [x.get("cue") for k in ("items", "points", "pins") for x in b.get(k, [])] + [m.get("cue") for m in b.get("moves", [])]
            for c in cues:
                if c and not any(w.startswith(norm(c)) for w in words): print(tag, "CUE", repr(c), "not spoken in", b["shot"])
