#!/usr/bin/env python3
"""Builds the "Syllabus in a minute" series: short two-host videos on the ca-scene template, one per syllabus topic.

Usage:
  python3 build-syllabus-series.py <content-root> <spec.json> <week> [--only id,id] [--skip-render] [--jobs 3]

<spec.json> is a list of episodes in the short form below. For each one this writes
<content-root>/motion/ca/<week>/<nn>-<id>/story.json (upsc-pods/motion@1, kind "ca-scene"), voices it with
kokoro-vo.py (two Indian voices), renders the app cut with render-motion.cjs (720x1280, no captions, .vtt and .jpg),
and writes <content-root>/motion/ca/<week>/manifest.json (upsc-pods/ca-week@1), so import-ca.mjs uploads it as is.

Episode short form:
  {"n": 36, "id": "preamble-basics", "node": "gs2-1", "paper": ["mains-gs2"], "tone": "NEUTRAL",
   "title": "...", "headline": "...", "ill": "constitution",          # illustrations/syllabus/<ill>.svg
   "sources": ["..."], "note": "what to check",
   "beats": [ {"shot": "map" | "timeline" | "stat" | "quote" | "chips", ...shot data..., "lines": [["A", "..."], ["B", "..."]]} ],
   "open": [["A", "..."], ["B", "..."]],                               # spoken over the opener
   "quiz": {"q": "...", "options": [...], "answerIndex": 1, "why": "...", "say": [["A", "..."], ["B", "..."]]}}
Spoken text writes "G-S-two" for GS2 and so on; the display map turns it back for captions.
"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

TOOLS = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
def opt(name, default=None, flag=False):
    if name not in args: return default
    i = args.index(name)
    if flag: del args[i]; return True
    v = args[i + 1]; del args[i:i + 2]; return v
only = opt("--only"); skip = opt("--skip-render", False, True); jobs = int(opt("--jobs", "3"))
root, spec_path, week = args
root = os.path.abspath(root)
spec = json.load(open(spec_path))
wdir = os.path.join(root, "motion", "ca", week)
os.makedirs(wdir, exist_ok=True)

# Two hosts per video. Pairs rotate so the series doesn't sound like one voice.
PAIRS = [("hf_alpha", "hm_omega"), ("hm_psi", "hf_beta"), ("hf_beta", "hm_omega"), ("hm_omega", "hf_alpha"), ("hf_alpha", "hm_psi"), ("hm_psi", "hf_alpha")]
DISPLAY = {}
for k, v in {"G-S-one": "GS1", "G-S-two": "GS2", "G-S-three": "GS3", "G-S-four": "GS4", "C-SAT": "CSAT", "P-S-I-R": "PSIR"}.items():
    for p in ["", ",", ".", "?", ":", "'s"]: DISPLAY[k + p] = v + p
PAPER_LABEL = {"prelims": "Prelims", "csat": "CSAT", "gs1": "GS1", "gs2": "GS2", "gs3": "GS3", "gs4": "GS4", "essay": "Essay",
               "lang": "Language paper", "english": "English paper", "psir1": "PSIR I", "psir2": "PSIR II", "socio1": "Sociology I",
               "socio2": "Sociology II", "geog1": "Geography I", "geog2": "Geography II", "anthro1": "Anthropology I",
               "anthro2": "Anthropology II", "hist1": "History I", "hist2": "History II"}

def lines(x): return [{"spk": s, "say": t} for s, t in x]

import re, hashlib
norm = lambda w: re.sub(r"[^a-z0-9-]", "", w.lower())
def fix_cues(beat):
    """A cue must be a word the hosts actually say, or the shot shows it at the beat's start. Any cue that isn't
    spoken is moved to a spoken word at the same share of the way through the beat."""
    words = [w for l in beat["lines"] for w in l["say"].split()]
    ns = [norm(w) for w in words]
    groups = [beat["data"].get(k, []) for k in ("items", "points", "pins")] + [beat["data"].get("moves", [])]
    for g in groups:
        for k, x in enumerate(g):
            c = x.get("cue")
            if not c or any(n.startswith(norm(c)) for n in ns): continue
            start = int(len(words) * (k + 0.5) / max(1, len(g))) if len(g) > 1 else 0
            for i in list(range(start, len(words))) + list(range(start - 1, -1, -1)):
                n = ns[i]
                if len(n) >= 3 and not any(m.startswith(n) for m in ns[:i]):
                    x["cue"] = n; break

def story_for(ep, k):
    a, b = PAIRS[(ep["n"]) % len(PAIRS)]
    paper = ep["node"].rsplit("-", 1)[0].replace("pre", "prelims") if ep["node"].startswith("pre-") else ep["node"].rsplit("-", 1)[0]
    beats = [{"shot": "ca-open", "lines": lines(ep["open"]),
              "data": {"kicker": f"{PAPER_LABEL.get(paper, paper)} · Syllabus · AI voices", "headline": ep["headline"],
                       "illustration": f"illustrations/syllabus/{ep['ill']}.svg"}}]
    for bt in ep["beats"]:
        data = {k2: v for k2, v in bt.items() if k2 not in ("shot", "lines")}
        beats.append({"shot": bt["shot"], "lines": lines(bt["lines"]), "data": data})
        fix_cues(beats[-1])
    q = ep["quiz"]
    beats.append({"shot": "quiz", "lines": lines(q["say"]),
                  "data": {"kicker": "Your turn", "q": q["q"], "options": q["options"]}})
    return {
        "schema": "upsc-pods/motion@1", "kind": "ca-scene", "series": "syllabus-in-a-minute", "id": ep["id"], "card": None,
        "lang": "en", "tone": ep.get("tone", "NEUTRAL"), "title": ep["title"], "gsPaper": ep["paper"],
        "syllabusNodes": [ep["node"]] + ep.get("alsoNodes", []), "sources": ep["sources"], "free": ep.get("free", True),
        "quiz": [{"id": f"{ep['id']}-q1", "q": q["q"], "options": q["options"], "answerIndex": q["answerIndex"], "why": q["why"]}],
        "review": {"status": "draft", "checkedBy": None, "checkedOn": None,
                   "note": "Written and voiced by Claude (AI voices, Kokoro), 8 Nov 2026. Not yet checked by a subject or Hindi editor. "
                           + ep.get("note", "Check every number and date against the listed sources.")},
        "format": {"w": 1080, "h": 1920, "fps": 30},
        "voice": {"provider": "kokoro", "speakers": {"A": a, "B": b}, "speed": 1.04},
        "music": {"bed": "audio/bed.m4a", "gain": 0.26, "duck": True, "end": "audio/motif.m4a"},
        "display": DISPLAY, "beats": beats,
    }

def run(*cmd): subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)

def build(ep):
    folder = f"{ep['n']:02d}-{ep['id']}"
    sdir = os.path.join(wdir, folder); os.makedirs(sdir, exist_ok=True)
    rel = os.path.join("motion", "ca", week, folder, "story.json")
    new = story_for(ep, 0)
    path = os.path.join(root, rel)
    json.dump(new, open(path, "w"), indent=1, ensure_ascii=False)
    run(sys.executable, os.path.join(TOOLS, "kokoro-vo.py"), root, rel)
    out = os.path.join(wdir, f"{folder}.mp4")
    stamp = os.path.join(sdir, "rendered.sha")  # hash of the story the mp4 was made from
    h = hashlib.sha1(open(path, "rb").read() + open(os.path.join(sdir, "timing.json"), "rb").read()).hexdigest()
    if os.path.exists(out) and os.path.exists(stamp) and open(stamp).read() == h:
        print("unchanged", folder, flush=True); return folder
    if not skip or not os.path.exists(out):
        env = dict(os.environ, NODE_PATH=subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip())
        subprocess.run(["node", os.path.join(TOOLS, "render-motion.cjs"), root, rel, out, "--cut", "app"], check=True, env=env, stdout=subprocess.DEVNULL)
        open(stamp, "w").write(h)
    print("built", folder, flush=True)
    return folder

todo = [e for e in spec if not only or e["id"] in only.split(",")]
with ThreadPoolExecutor(jobs) as ex: list(ex.map(build, todo))

# Manifest over every episode folder in the week (so batches can be built in parts).
episodes = []
for folder in sorted(f for f in os.listdir(wdir) if os.path.isfile(os.path.join(wdir, f, "story.json"))):
    s = json.load(open(os.path.join(wdir, folder, "story.json")))
    mp4 = os.path.join(wdir, f"{folder}.mp4")
    if not os.path.exists(mp4): continue
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], capture_output=True, text=True).stdout)
    episodes.append({"n": int(folder.split("-")[0]), "id": s["id"], "title": s["title"], "durationSec": round(dur, 2),
                     "mp4": f"{folder}.mp4", "vtt": f"{folder}.vtt", "poster": f"{folder}.jpg",
                     "syllabusNodes": s["syllabusNodes"], "gsPaper": s["gsPaper"], "sources": s["sources"], "quiz": s["quiz"],
                     "free": s["free"], "review": s["review"], "tone": s["tone"], "card": None, "series": s["series"],
                     "voice": "kokoro:" + "+".join(s["voice"]["speakers"].values())})
episodes.sort(key=lambda e: e["n"])
manifest = {"schema": "upsc-pods/ca-week@1", "week": week, "lang": "en",
            "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            "voice": {"provider": "kokoro", "note": "Two AI hosts per video (Kokoro Indian voices hf_alpha, hf_beta, hm_omega, hm_psi), voiced locally."},
            "series": "syllabus-in-a-minute", "episodes": episodes}
json.dump(manifest, open(os.path.join(wdir, "manifest.json"), "w"), indent=1, ensure_ascii=False)
print("manifest", week, len(episodes), "episodes", round(sum(e["durationSec"] for e in episodes), 1), "s")
