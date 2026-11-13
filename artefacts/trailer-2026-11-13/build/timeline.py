#!/usr/bin/env python3
"""Places every kept line on the timeline. Each entry: (line id, seconds of air before it).
Writes build/timeline.json and scenes/timeline.js (window.TL) so the picture and the mix share one clock."""
import json, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEQ = [("c01", 1.3), ("h01", .12), ("c02", .2),            # cold open, October desk
       ("c04", 2.35),                                        # montage: magazines, streaks, 73%
       ("n03", 1.3), ("n04", .45), ("j01", 1.35),            # the leak, Ebbinghaus, Jeetu off screen
       ("c05", .05), ("j04", 2.1),                          # Jeetu's entrance
       ("c06", .25), ("j05", .08), ("n05", .35),            # answer first, how sure, the review
       ("j06", .35), ("n06", .3), ("j07", .1),              # Mains, Hindi or English
       ("c07", .35), ("n08", .35),                           # Chai, the pod
       ("n09", .4), ("j09", 2.4), ("h03", .25),            # the garden, March payoff
       ("n12", .5),                                          # the thought; refusal as on-screen stamps
       ("c08", 3.1), ("j10", .2), ("c09", .15),             # title hit, button
       ("n14", .6)]
TAIL = 1.3
T = json.load(open(f"{HERE}/build/vo_timing.json")); L = {l["id"]: l for l in json.load(open(f"{HERE}/audio/lines.json"))}
t, lines = 0.0, []
for lid, gap in SEQ:
    t += gap; d = T[lid]["seconds"]
    lines.append({"id": lid, "spk": L[lid]["spk"], "t0": round(t, 3), "t1": round(t + d, 3), "cap": L[lid]["cap"], "en": L[lid].get("en"),
                  "words": [{"w": w["w"], "t0": round(t + w["t0"], 3), "t1": round(t + w["t1"], 3)} for w in T[lid]["words"]]})
    t += d
total = round(t + TAIL, 2)
tl = {"total": total, "fps": 30, "lines": lines, "at": {l["id"]: l["t0"] for l in lines}, "end": {l["id"]: l["t1"] for l in lines}}
json.dump(tl, open(f"{HERE}/build/timeline.json", "w"), ensure_ascii=False, indent=0)
open(f"{HERE}/scenes/timeline.js", "w").write("window.TL = " + json.dumps(tl, ensure_ascii=False) + ";\n")
print("total", total); print(" ".join(f"{l['id']}@{l['t0']:.1f}-{l['t1']:.1f}" for l in lines))
