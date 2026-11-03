"""Validate an episode spec. Usage: python validate_spec.py <spec.json> [--out resolved.json]
Exit 0 = OK (warnings allowed), 1 = errors. Each error says WHAT to fix. Designed so a small model can repair its own spec.
Guards: source status is DERIVED from URL domains (the model cannot self-declare 'primary'); every number used in narration or on screen
must appear in the claims table; anchors must exist in the captions; text lengths are capped so layouts cannot overflow."""
import json, re, sys
from urllib.parse import urlparse

PRIMARY = ("gov.in", "nic.in", "rbi.org.in", "ramsar.org", "un.org", "wto.org", "imf.org", "worldbank.org", "fao.org", "who.int",
           "unfccc.int", "icj-cij.org", "ilo.org", "oecd.org", "parliament.uk", "eci.gov.in", "sebi.gov.in")
FORMATS = ("cards", "kinetic", "whiteboard"); TONES = ("LIGHT", "NEUTRAL", "SERIOUS")
GS = ("prelims-gs", "mains-gs1", "mains-gs2", "mains-gs3", "mains-gs4")
ICONS = ("doc", "scale", "building", "coin", "drop", "pin")
TYPES = ("title", "statement", "list", "compare", "stat", "chain", "quiz")
E, Wn = [], []


def err(path, msg): E.append(f"{path}: {msg}")
def warn(path, msg): Wn.append(f"{path}: {msg}")


def host(u):
    return (urlparse(u).hostname or "").lower().removeprefix("www.")


def reg(h):
    p = h.split("."); return ".".join(p[-3:]) if len(p) > 2 and p[-2] in ("co", "gov", "nic", "org", "ac") else ".".join(p[-2:])


def is_primary(u):
    h = host(u); return any(h == d or h.endswith("." + d) for d in PRIMARY)


def main():
    spec = json.load(open(sys.argv[1]))
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else None
    for k in ("n", "id", "title", "format", "tone", "gsPaper", "sources", "quiz", "script", "claims", "scenes"):
        if k not in spec: err(k, "missing required field")
    if E: return finish(spec, out)
    if not isinstance(spec["n"], int): err("n", "must be an integer")
    if not re.fullmatch(r"[a-z0-9-]+", spec["id"]): err("id", "lowercase letters, digits and hyphens only")
    if spec["format"] not in FORMATS: err("format", f"must be one of {FORMATS}")
    if spec["tone"] not in TONES: err("tone", f"must be one of {TONES}")
    if not spec["gsPaper"] or any(g not in GS for g in spec["gsPaper"]): err("gsPaper", f"values must come from {GS}")
    if not spec["sources"]: err("sources", "list at least one named source")
    if len(spec["title"]) > 80: err("title", "keep under 80 characters")
    # ---- quiz
    q = spec["quiz"]
    if len(q.get("options", [])) != 4: err("quiz.options", "need exactly 4 options")
    elif not isinstance(q.get("answerIndex"), int) or not 0 <= q["answerIndex"] <= 3: err("quiz.answerIndex", "integer 0-3")
    if not str(q.get("why", "")).startswith("Right."): err("quiz.why", "must start with 'Right.' and be one sentence")
    if any(len(o) > 44 for o in q.get("options", [])): err("quiz.options", "each option 44 characters or fewer")
    # ---- script
    S = spec["script"]; words = 0
    if not 5 <= len(S) <= 10: err("script", f"need 5-10 sentences, have {len(S)}")
    for i, sent in enumerate(S):
        if not sent: err(f"script[{i}]", "empty sentence"); continue
        for j, seg in enumerate(sent):
            p = f"script[{i}][{j}]"
            if not (isinstance(seg, list) and 5 <= len(seg) <= 6): err(p, "segment must be [show, say|null, speed, pause, gain, tag?]"); continue
            show, say, sp, pa, ga = seg[:5]
            if not isinstance(show, str) or not show.strip(): err(p, "show text missing"); continue
            if say is not None and not isinstance(say, str): err(p, "say must be text or null")
            if not 0.75 <= sp <= 1.15: err(p, f"speed {sp} outside 0.75-1.15")
            if not 0 <= pa <= 1.2: err(p, f"pause {pa} outside 0-1.2")
            if not 0.8 <= ga <= 1.0: err(p, f"gain {ga} outside 0.8-1.0")
            if len(show) > 150: err(p, "caption text over 150 characters; split into more segments")
            if say is None and re.search(r"\d", show): err(p, "show contains digits but say is null: write the numbers out in 'say' (e.g. 'nineteen eighty-nine', 'R B I')")
            if say is None and re.search(r"\b[A-Z]{2,}\b", show): warn(p, "acronym in show with no 'say': spell letters in say (e.g. 'M C L R') unless it is read as a word")
            words += len((say or show).split())
    if not 80 <= words <= 145: err("script", f"{words} spoken words; need roughly 95-125 (80-145 allowed)")
    elif not 95 <= words <= 125: warn("script", f"{words} spoken words; target 95-125")
    last = " ".join(s[0] for s in S[-1]) if S and S[-1] else ""
    if not last.lower().startswith("your turn"): err("script[-1]", "last sentence must start with 'Your turn' and then ask the quiz question")
    elif q.get("q") and q["q"].lower().rstrip("?") not in last.lower(): err("script[-1]", "must contain the quiz question text exactly as in quiz.q")
    # ---- scenes
    sc = spec["scenes"]; prev = -1; cap = [" ".join(g[0] for g in sent) for sent in S]
    if not sc: err("scenes", "empty")
    for k, c in enumerate(sc):
        p = f"scenes[{k}]"; t = c.get("type"); a, b = (c.get("sent") or [None, None])[:2]
        if t not in TYPES: err(p, f"type must be one of {TYPES}"); continue
        if not (isinstance(a, int) and isinstance(b, int) and 0 <= a <= b < len(S)): err(p + ".sent", "must be [first,last] sentence indexes"); continue
        if a != prev + 1: err(p + ".sent", f"scenes must cover sentences in order with no gaps: expected to start at {prev + 1}, got {a}")
        prev = b
        if t == "quiz" and k != len(sc) - 1: err(p, "quiz scene must be the last scene")
        if k == len(sc) - 1 and t != "quiz": err(p, "last scene must be type 'quiz'")
        if k == 0 and t != "title": err(p, "first scene must be type 'title'")
        rng = " | ".join(cap[a:b + 1])

        def anchor(x, path):
            if isinstance(x, dict) and x.get("at") and x["at"] not in rng:
                err(path + ".at", f"'{x['at']}' is not a phrase in the captions of sentences {a}-{b}. Captions are: {rng}")

        def length(s, mx, path):
            if not isinstance(s, str) or not s.strip(): err(path, "missing text")
            elif len(s) > mx: err(path, f"'{s}' is {len(s)} characters; maximum {mx}")
        if t in ("title", "statement"):
            L = c.get("lines")
            if not L or not 1 <= len(L) <= 3: err(p + ".lines", "need 1-3 short lines")
            else:
                for i, ln in enumerate(L): length(ln, 24, f"{p}.lines[{i}]")
            if c.get("icon") and c["icon"] not in ICONS: err(p + ".icon", f"must be one of {ICONS}")
            if t == "statement" and c.get("sub"): length(c["sub"], 110, p + ".sub")
        if t in ("list", "chain", "compare", "stat") and c.get("heading"): length(c["heading"], 44, p + ".heading")
        if t in ("list", "chain"):
            its = c.get("items" if t == "list" else "steps") or []
            if not 2 <= len(its) <= 4: err(p, f"need 2-4 {'items' if t == 'list' else 'steps'}")
            for i, it in enumerate(its):
                tx = it if isinstance(it, str) else it.get("text", ""); length(tx, 46 if t == "list" else 40, f"{p}[{i}].text"); anchor(it, f"{p}[{i}]")
        if t == "compare":
            for side in ("left", "right"):
                s = c.get(side)
                if not isinstance(s, dict): err(p + "." + side, "need {label, text}"); continue
                length(s.get("label"), 16, f"{p}.{side}.label"); length(s.get("text"), 70, f"{p}.{side}.text"); anchor(s, f"{p}.{side}")
        if t == "stat":
            length(str(c.get("value", "")), 7, p + ".value"); length(c.get("label", "x"), 30, p + ".label")
            if c.get("sub"): length(c["sub"], 60, p + ".sub")
            anchor(c, p)
    if sc and prev != len(S) - 1: err("scenes", f"scenes end at sentence {prev}; must cover all {len(S)} sentences")
    # ---- claims (fact-check guards)
    cl = spec["claims"]
    if len(cl) < 4: err("claims", f"only {len(cl)} claims; list every fact in the video (at least 4)")
    corpus = " ".join([c.get("claim", "") + " " + c.get("quote", "") for c in cl] + spec["sources"])
    for i, c in enumerate(cl):
        p = f"claims[{i}]"
        if not c.get("claim"): err(p, "missing claim text"); continue
        u1, u2 = c.get("url", ""), c.get("url2", "")
        if not u1.startswith("http"): err(p + ".url", "needs the full https URL of a page you actually opened or found by search"); continue
        if c.get("status") == "unverified": err(p, "unverified claim: remove it from the script or verify it"); continue
        hosts = {reg(host(u)) for u in (u1, u2) if u.startswith("http")}
        if is_primary(u1) or (u2 and is_primary(u2)): c["status"] = "verified-primary"
        elif len(hosts) >= 2: c["status"] = "verified-secondary"
        else: err(p, "only one non-official source: add 'url2' from a different website, or use an official source (gov.in, rbi.org.in, un.org...)")
        if c.get("quote") and len(c["quote"].split()) > 15: err(p + ".quote", "keep quotes to 15 words or fewer")
    # ---- number lint
    texts = [x for sent in S for seg in sent for x in (seg[0],)] + [spec["title"]]
    for c in sc:
        for k in ("lines", "steps"):
            texts += [x for x in (c.get(k) or []) if isinstance(x, str)]
        for k in ("heading", "sub", "label", "value"):
            if c.get(k): texts.append(str(c[k]))
        for it in (c.get("items") or []) + (c.get("steps") or []):
            texts.append(it if isinstance(it, str) else it.get("text", ""))
        for side in ("left", "right"):
            if isinstance(c.get(side), dict): texts += [str(c[side].get("text", "")), str(c[side].get("label", ""))]
    flat = corpus.replace(",", "")
    for tok in sorted({m.replace(",", "") for m in re.findall(r"\d[\d,]*(?:\.\d+)?", " ".join(texts))}):
        if tok != str(spec["n"]) and tok not in flat: err("numbers", f"the number '{tok}' appears in the video but in no claim or source. Add a claim containing it (with a URL) or remove it")
    return finish(spec, out)


def finish(spec, out):
    for w in Wn: print("WARN ", w)
    for e in E: print("ERROR", e)
    print(f"{'FAILED' if E else 'OK'}: {len(E)} errors, {len(Wn)} warnings")
    if not E and out: json.dump(spec, open(out, "w"), indent=1, ensure_ascii=False)
    sys.exit(1 if E else 0)


main()
