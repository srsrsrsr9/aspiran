#!/usr/bin/env python3
"""Voices a motion story with local Kokoro voices, two hosts per video like a podcast.

Usage: python3 kokoro-vo.py <content-root> <story.json> [--models <dir with kokoro-v1.0.onnx and voices-v1.0.bin>]

Writes <story dir>/vo/<n>.mp3 and <story dir>/timing.json, the same contract motion-vo.cjs writes
({voice, beats:[{hash, file, seconds, words:[{w, t0, t1}]}]}), so render-motion.cjs works unchanged.

story.voice = {"provider": "kokoro", "speakers": {"A": "hf_alpha", "B": "hm_omega"}, "speed": 1.05}
Each beat has "lines": [{"spk": "A", "say": "..."}, ...] (or a plain "say", spoken by A). The beat's "say" is
rewritten as the lines joined, so other tools still see the full text.

Kokoro's Indian voices: hf_alpha, hf_beta (women), hm_omega, hm_psi (men). Text is phonemised as English.
Kokoro gives no word timings. Each sentence is voiced on its own, so sentence edges are exact; words inside a
sentence are timed by their share of the letters. Captions are close, not exact.
Models: https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0). Re-voices only changed beats.
"""
import hashlib, json, os, re, subprocess, sys, tempfile

import numpy as np
import soundfile as sf

args = sys.argv[1:]
models = os.environ.get("KOKORO_MODELS", ".")
if "--models" in args:
    i = args.index("--models"); models = args[i + 1]; del args[i:i + 2]
root, story_rel = args
story_path = os.path.join(root, story_rel)
d = os.path.dirname(story_path)
story = json.load(open(story_path))
V = story["voice"]
SPK = V.get("speakers", {"A": "hf_alpha", "B": "hm_omega"})
SPEED = V.get("speed", 1.05)
SR = 24000
GAP_SENT, GAP_TURN = 0.16, 0.34

timing_path = os.path.join(d, "timing.json")
old = json.load(open(timing_path)) if os.path.exists(timing_path) else {"beats": []}
os.makedirs(os.path.join(d, "vo"), exist_ok=True)

_k = None
def kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(models, "kokoro-v1.0.onnx"), os.path.join(models, "voices-v1.0.bin"))
    return _k

def sentences(text):
    # Split after . ? ! (and ... ) followed by a space; keep the punctuation with the sentence.
    parts = re.split(r"(?<=[.?!])\s+(?=[A-Z0-9\"'‘“(])", text.strip())
    return [p for p in parts if p.strip()]

def trim(a, thr=0.004):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx): return a
    s, e = max(0, idx[0] - int(0.02 * SR)), min(len(a), idx[-1] + int(0.06 * SR))
    return a[s:e]

def voice_beat(lines):
    pieces, words, t = [], [], 0.0
    prev_spk = None
    for ln in lines:
        spk = ln.get("spk", "A")
        for s in sentences(ln["say"]):
            if pieces:
                gap = GAP_TURN if spk != prev_spk else GAP_SENT
                pieces.append(np.zeros(int(gap * SR), dtype=np.float32)); t += gap
            a, sr = kokoro().create(s, voice=SPK[spk], speed=SPEED, lang="en-us")
            assert sr == SR
            a = trim(a.astype(np.float32))
            dur = len(a) / SR
            ws = s.split()
            weights = [len(re.sub(r"[^\w]", "", w)) + 1.5 + (2.5 if re.search(r"[,;:]$", w) else 0) for w in ws]
            tot = sum(weights); u = t
            for w, wt in zip(ws, weights):
                span = dur * wt / tot
                words.append({"w": w, "t0": round(u, 3), "t1": round(u + span * 0.92, 3), "spk": spk}); u += span
            pieces.append(a); t += dur
            prev_spk = spk
    return np.concatenate(pieces), words

beats = []
for i, b in enumerate(story["beats"]):
    lines = b.get("lines") or [{"spk": "A", "say": b["say"]}]
    b["say"] = " ".join(l["say"] for l in lines)
    h = hashlib.sha1(json.dumps([lines, SPK, SPEED]).encode()).hexdigest()[:12]
    f = f"vo/{i + 1:02d}.mp3"
    prev = old["beats"][i] if i < len(old["beats"]) else None
    if prev and prev.get("hash") == h and os.path.exists(os.path.join(d, f)):
        beats.append(prev); continue
    audio, words = voice_beat(lines)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sf.write(tmp.name, audio, SR)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-ar", "44100", "-b:a", "128k", os.path.join(d, f)], check=True)
        os.unlink(tmp.name)
    secs = round(len(audio) / SR, 3)
    beats.append({"hash": h, "file": f, "seconds": secs, "words": words})
    print("voiced", story["id"], f, f"{secs}s")

json.dump(story, open(story_path, "w"), indent=1, ensure_ascii=False)
json.dump({"voice": "kokoro:" + "+".join(SPK.values()), "beats": beats}, open(timing_path, "w"), indent=1, ensure_ascii=False)
