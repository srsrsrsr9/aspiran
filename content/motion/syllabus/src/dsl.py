"""Short-hand for writing "Syllabus in a minute" episodes. Each batch file builds a list with E(...) and calls out().
Lines are written "A: ... | B: ..." (A and B are the two hosts). The result is the spec build-syllabus-series.py reads.
On-screen text uses GS2; spoken text uses G-S-two (the display map turns it back in captions)."""
import json, sys

def L(s):
    out = []
    for part in s.split("|"):
        spk, txt = part.strip().split(":", 1)
        out.append([spk.strip(), txt.strip()])
    return out

def TL(kicker, pts, say):
    return {"shot": "timeline", "kicker": kicker, "points": [{"year": y, "label": l, "cue": c} for y, l, c in pts], "lines": L(say)}

def ST(kicker, items, say, note=None):
    its = []
    for it in items:
        v, suf, lab, cue = it[:4]
        d = {"value": v, "suffix": suf, "label": lab, "cue": cue}
        if len(it) > 4: d["prefix"] = it[4]
        if isinstance(v, float): d["decimals"] = len(str(v).split(".")[1])
        its.append(d)
    b = {"shot": "stat", "kicker": kicker, "items": its, "lines": L(say)}
    if note: b["note"] = {"text": note[0], "cue": note[1]}
    return b

def QT(kicker, text, say, by=None):
    b = {"shot": "quote", "kicker": kicker, "text": text, "lines": L(say)}
    if by: b["by"] = by
    return b

def CH(kicker, title, items, say):
    return {"shot": "chips", "kicker": kicker, "title": title, "items": [{"text": t, "sub": s, "cue": c} for t, s, c in items], "lines": L(say)}

def MP(start, moves, pins, say, areas=None, lon0=0):
    b = {"shot": "map", "lon0": lon0, "start": {"center": start[0], "zoom": start[1]},
         "moves": [{"cue": c, "center": ce, "zoom": z, "d": 1.6} for c, ce, z in moves],
         "pins": [{"at": at, "label": lab, "cue": c} for at, lab, c in pins], "lines": L(say)}
    if areas: b["areas"] = [{"at": at, "r": r, "label": lab, "cue": c, "warm": w} for at, r, lab, c, w in areas]
    return b

def QZ(q, options, ans, why, say):
    return {"q": q, "options": options, "answerIndex": ans, "why": why, "say": L(say)}

EPS = []
def E(n, id, node, paper, title, headline, ill, sources, open, beats, quiz, tone="NEUTRAL", note=None, also=None):
    e = {"n": n, "id": id, "node": node, "paper": paper, "tone": tone, "title": title, "headline": headline, "ill": ill,
         "sources": sources, "open": L(open), "beats": beats, "quiz": quiz}
    if note: e["note"] = note
    if also: e["alsoNodes"] = also
    EPS.append(e)

def out():
    json.dump(EPS, sys.stdout, indent=1, ensure_ascii=False)
