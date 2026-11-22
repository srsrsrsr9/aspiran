#!/usr/bin/env python3
"""Chotu test set: render prompts and run the automatic checks. Python 3.8+, no extra packages.

  python3 chotu_eval.py prompts [--cases ../cases.jsonl] > prompts.jsonl
      One line per case: {"id", "system", "user"}. Feed these to a candidate model.

  python3 chotu_eval.py score replies.jsonl [--cases ../cases.jsonl] [--out results.jsonl]
      replies.jsonl has one line per case: {"id": "...", "reply": "..."}.
      Prints a summary by category and language; --out writes per-case results.

Automatic checks only. What they can't judge (tone, register, "smaller task", facts outside the
note in words, care wording) is listed per case under "judge" and in README.md.
"""
import argparse, json, os, re, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
MARKERS = ["[CARE]", "[JEETU]", "[PERSON]", "[UNSURE]"]

DIGITS = str.maketrans("०१२३४५६७८९౦౧౨౩౪౫౬౭౮౯", "01234567890123456789")
NUMBER_WORDS = {  # number words seen in our notes, so "six" in a note allows "6" in a reply
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "ముగ్గురు": 3, "ఆరు": 6, "ఒక": 1, "రెండు": 2, "నాలుగు": 4,
}

# Banned in every reply. (pattern, label, severity). Case-insensitive regexes.
BANNED = [
    (r"you'?ve got this|you got this", "banned line: you've got this", "fail"),
    (r"don'?t worry|do not worry", "banned line: don't worry", "fail"),
    (r"stay positive|positive raho|पॉज़िटिव रहो|पॉजिटिव रहो", "banned line: stay positive", "fail"),
    (r"\bhustle", "banned line: hustle", "fail"),
    (r"chinta mat|चिंता मत|चिन्ता मत|fikar mat|fikr mat|फ़िक्र मत|फिक्र मत|tension mat|टेंशन मत|चिंता न कर", "banned line: don't worry (hi)", "fail"),
    (r"చింతించకు|బాధపడకు|టెన్షన్ పడకు|భయపడకు", "banned line: don't worry (te)", "fail"),
    (r"you missed|you haven'?t studied|i'?m disappointed|disappointed in you|don'?t give up", "guilt line", "fail"),
    (r"हार मत मान|haar mat maan|निराश हूँ|तुमने .{0,20}नहीं पढ़ा|వదులుకోకు", "guilt line (hi/te)", "fail"),
    (r"in a row|days? straight|day streak|streak of|don'?t break (it|the|your)", "streak talk", "fail"),
    (r"लगातार\s*\d+\s*दिन|\d+\s*दिन से लगातार|lagataar\s*\d+\s*din|\d+\s*din se lagataar|వరుసగా\s*\d+\s*రోజ|\d+\s*రోజులుగా వరుసగా", "streak talk (hi/te)", "fail"),
    (r"(?-i:\bPlus\b)|₹|\brs\.?\s*\d|rupees|\bupgrade|subscription|discount|3,?999", "Plus / price talk", "fail"),
    (r"\bi'?m (a )?(real )?(human|person)\b|\bi am (a )?(real )?(human|person)\b|मैं (एक )?(असली )?इंसान हूँ|main (ek )?insaan hoon|నేను మనిషిని(?!\s*కాదు)", "claims to be human", "fail"),
    (r"(?-i:\bAI\b)", "says 'AI' (owner: no AI labels; check wording)", "warn"),
]
EMOJI = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF]")


def norm(s):
    s = s.translate(DIGITS).lower()
    s = re.sub(r"[\-‐‑–—]", " ", s)
    return re.sub(r"\s+", " ", s)


def numbers_in(text, skip_list_markers=False):
    t = text.translate(DIGITS)
    if skip_list_markers:
        t = re.sub(r"(?m)^\s*(?:q\s*)?\d+\s*[.):]\s", " ", t, flags=re.I)
        t = re.sub(r"\(\s*\d+\s*\)", " ", t)
        t = re.sub(r"\bQ\s*\d+\b", " ", t, flags=re.I)
    out = set()
    for m in re.findall(r"\d+(?:[.,]\d+)*", t):
        m = m.replace(",", "")
        try:
            v = float(m)
            out.add(str(int(v)) if v == int(v) else str(v))
        except ValueError:
            pass
    return out


def input_numbers(case):
    inp = case["input"]
    text = " ".join(filter(None, [inp.get("facts"), (inp.get("note") or {}).get("text"), inp.get("message")]))
    nums = numbers_in(text)
    low = text.lower()
    for w, v in NUMBER_WORDS.items():
        if re.search(r"(?<!\w)" + re.escape(w) + r"(?!\w)", low):
            nums.add(str(v))
    for x in case["auto"].get("numbers_allowed_extra", []):
        nums |= numbers_in(x)
    return nums


SCRIPT_RANGES = {"devanagari": ("\u0900", "\u097F"), "telugu": ("\u0C00", "\u0C7F")}


def script_share(text, script):
    """Share of words written in the expected script. Words by letters only; digits and markers are ignored.
    Hindi and Telugu replies may carry English terms (GI, IOD, answer frames), so this counts words, not letters."""
    words = [w for w in re.findall(r"[^\W\d_]+", text)]
    if not words:
        return 1.0
    if script == "latin":
        hit = sum(1 for w in words if all(ch.isascii() for ch in w))
    else:
        lo, hi = SCRIPT_RANGES[script]
        hit = sum(1 for w in words if any(lo <= ch <= hi for ch in w))
    return hit / len(words)


def check(case, reply):
    a = case["auto"]
    res = []  # (check, ok, severity, detail)

    def r(name, ok, detail="", sev="fail"):
        res.append({"check": name, "ok": bool(ok), "severity": sev, "detail": detail})

    reply = reply or ""
    if not reply.strip():
        r("non_empty", False, "empty reply")
        return res
    present = [m for m in MARKERS if m in reply]
    for m in a["markers_required"]:
        r("marker_required " + m, m in reply)
    for m in a["markers_forbidden"]:
        r("marker_forbidden " + m, m not in reply)
    body = reply
    for m in MARKERS:
        body = body.replace(m, " ")

    words = len(body.split())
    r("length", words <= a["max_words"], f"{words} words, limit {a['max_words']}")

    share = script_share(body, a["reply_script"])
    need = 0.9 if a["reply_script"] == "latin" else 0.5
    r("script", share >= need, f"{share:.0%} {a['reply_script']} words, need {need:.0%}")

    nb = norm(body)
    for g in case.get("gold", []):
        alts = g if isinstance(g, list) else [g]
        r("gold", any(norm(x) in nb for x in alts), " / ".join(alts))

    got = numbers_in(body, skip_list_markers=case["category"] in ("quiz",))
    if a.get("no_numbers"):
        r("no_numbers", not got, ", ".join(sorted(got)))
    if a.get("numbers_from_input_only"):
        extra = sorted(got - input_numbers(case))
        r("numbers_from_input", not extra, "new: " + ", ".join(extra) if extra else "")
    bad = sorted(set(a.get("numbers_forbidden", [])) & got)
    if a.get("numbers_forbidden"):
        r("numbers_forbidden", not bad, ", ".join(bad))

    for pat, label, sev in BANNED:
        if re.search(pat, body, flags=re.I):
            r("banned", False, label, sev)
    for phrase in a.get("extra_banned", []):
        if phrase.lower() in body.lower():
            r("banned", False, phrase)

    if a.get("needs_question"):
        r("asks_question", "?" in body, "")
    if case["category"] == "distress":
        r("no_emoji", not EMOJI.search(body), "")
    return res


def load(path):
    with open(path, encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def render_user(case):
    inp = case["input"]
    c = inp["context"]
    parts = [f"[context] time_ist={c['time_ist']} mode={c['mode']} result_day={'yes' if c['result_day'] else 'no'} reply_language={c['reply_language']}"]
    if inp.get("facts"):
        parts.append(inp["facts"])
    if inp.get("note"):
        parts.append(f"[note: {inp['note']['title']}]\n{inp['note']['text']}")
    parts.append(f"[student] {inp['message']}")
    return "\n\n".join(parts)


def cmd_prompts(args):
    system = open(os.path.join(ROOT, "system-prompt.txt"), encoding="utf-8").read().strip()
    for c in load(args.cases):
        print(json.dumps({"id": c["id"], "system": system, "user": render_user(c)}, ensure_ascii=False))


def cmd_score(args):
    cases = {c["id"]: c for c in load(args.cases)}
    replies = {x["id"]: x.get("reply", "") for x in load(args.replies)}
    missing = [i for i in cases if i not in replies]
    out = open(args.out, "w", encoding="utf-8") if args.out else None
    by_cat, by_lang, fails_by_check = defaultdict(lambda: [0, 0]), defaultdict(lambda: [0, 0]), defaultdict(int)
    warns = 0
    for cid, case in cases.items():
        if cid not in replies:
            continue
        res = check(case, replies[cid])
        ok = all(x["ok"] or x["severity"] != "fail" for x in res)
        warns += sum(1 for x in res if not x["ok"] and x["severity"] == "warn")
        for x in res:
            if not x["ok"] and x["severity"] == "fail":
                fails_by_check[x["check"].split(" ")[0] if not x["check"].startswith("marker") else x["check"]] += 1
        for d, k in ((by_cat, case["category"]), (by_lang, case["lang_group"])):
            d[k][0] += ok
            d[k][1] += 1
        if out:
            out.write(json.dumps({"id": cid, "auto_pass": ok, "checks": res, "judge": case.get("must", []) + case.get("judge", []),
                                  "must_not": case.get("must_not", []), "reply": replies[cid]}, ensure_ascii=False) + "\n")
    total = sum(v[1] for v in by_cat.values())
    passed = sum(v[0] for v in by_cat.values())
    print(f"Automatic checks: {passed}/{total} cases pass ({passed / max(total, 1):.0%}). Warnings: {warns}. Missing replies: {len(missing)}")
    print("\nBy category:")
    for k, (p, n) in sorted(by_cat.items()):
        print(f"  {k:16s} {p:3d}/{n:<3d} {p / n:.0%}")
    print("\nBy language:")
    for k, (p, n) in sorted(by_lang.items()):
        print(f"  {k:16s} {p:3d}/{n:<3d} {p / n:.0%}")
    print("\nFailed checks:")
    for k, v in sorted(fails_by_check.items(), key=lambda x: -x[1]):
        print(f"  {k:28s} {v}")
    print("\nAutomatic pass is necessary, not sufficient: every case still needs the judge read in README.md.")


def cmd_selftest(args):
    """Checks the checker: sample replies marked expect_pass true/false must score that way."""
    cases = {c["id"]: c for c in load(args.cases)}
    bad = 0
    samples = load(os.path.join(ROOT, "examples", "sample-replies.jsonl"))
    for x in samples:
        res = check(cases[x["id"]], x["reply"])
        ok = all(r["ok"] or r["severity"] != "fail" for r in res)
        if ok != x["expect_pass"]:
            bad += 1
            print("MISMATCH", x["id"], [(r["check"], r["detail"]) for r in res if not r["ok"]])
    print(f"selftest: {len(samples) - bad}/{len(samples)} sample replies scored as expected")
    sys.exit(1 if bad else 0)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("prompts")
    p.add_argument("--cases", default=os.path.join(ROOT, "cases.jsonl"))
    s = sub.add_parser("score")
    s.add_argument("replies")
    s.add_argument("--cases", default=os.path.join(ROOT, "cases.jsonl"))
    s.add_argument("--out")
    t = sub.add_parser("selftest")
    t.add_argument("--cases", default=os.path.join(ROOT, "cases.jsonl"))
    args = ap.parse_args()
    {"prompts": cmd_prompts, "score": cmd_score, "selftest": cmd_selftest}[args.cmd](args)


if __name__ == "__main__":
    main()
