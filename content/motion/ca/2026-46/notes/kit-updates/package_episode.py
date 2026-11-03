"""Package one episode: loudness-normalised audio, VTT, manifest entry (draft), claims table, ElevenLabs script.
Usage: python package_episode.py <spec.json> <builddir> [--audio-only] [--dist dist]
Order: tts_ep -> [engine sfx] -> package --audio-only -> engine video -> package --dist
Inputs in builddir: timing.json, vo.wav (or vo_sfx.wav), and optionally video.mp4 / poster.jpg from an engine.
Outputs: builddir/vo_norm.wav, builddir/<base>.vtt, <base>.manifest-entry.json, <base>.claims.md, <base>.elevenlabs.txt;
with --dist, copies video.mp4 -> <base>.mp4 and poster.jpg -> <base>.jpg plus the files above into dist/.
"""
import json, os, shutil, subprocess, sys
spec = json.load(open(sys.argv[1])); b = sys.argv[2]
dist = sys.argv[sys.argv.index("--dist") + 1] if "--dist" in sys.argv else None
base = f"{spec['n']:02d}-{spec['id']}"; T = json.load(open(f"{b}/timing.json"))
src = f"{b}/vo_sfx.wav" if os.path.exists(f"{b}/vo_sfx.wav") else f"{b}/vo.wav"
AUDIO_ONLY = "--audio-only" in sys.argv
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", "loudnorm=I=-16:TP=-2.0:LRA=7,aresample=48000", "-ac", "1", f"{b}/vo_norm.wav"], check=True)

if AUDIO_ONLY:
    print('audio normalised ->', f'{b}/vo_norm.wav'); sys.exit(0)

def ts(x): return f"{int(x//3600):02d}:{int(x%3600//60):02d}:{x%60:06.3f}"
cues = []
for s in T["sentences"]:
    for g in s["segs"]:
        ch, cur = [], []
        for w in g["show"].split():
            cur.append(w)
            if len(" ".join(cur)) >= 24: ch.append(" ".join(cur)); cur = []
        if cur:
            if ch and len(" ".join(cur)) < 10: ch[-1] += " " + " ".join(cur)
            else: ch.append(" ".join(cur))
        tot = sum(map(len, ch)); t = g["start"]; dur = g["end"] - g["start"]
        for c in ch:
            e = t + dur * len(c) / tot; cues.append((t, e, c)); t = e
vtt = ["WEBVTT", ""]
for i, (a, e, c) in enumerate(cues, 1): vtt += [str(i), f"{ts(a)} --> {ts(e)}", c, ""]
open(f"{b}/{base}.vtt", "w").write("\n".join(vtt))

weak = [c for c in spec.get("claims", []) if c.get("status") != "verified-primary"]
note = spec.get("review_note", "")
if weak: note += " Not verified against a primary source: " + "; ".join(c["claim"] for c in weak) + "."
note += f" FORMAT: {spec.get('format','?')}. Narration is a placeholder voice, not the production ElevenLabs voice. mp4Social not built."
q = spec["quiz"]
entry = {"n": spec["n"], "id": spec["id"], "title": spec["title"], "durationSec": round(T["total"], 2),
         "mp4": f"{base}.mp4", "mp4Social": f"{base}.social.mp4", "vtt": f"{base}.vtt", "poster": f"{base}.jpg",
         "syllabusNodes": [], "gsPaper": spec["gsPaper"], "sources": spec["sources"],
         "quiz": [{"id": f"{spec['id']}-q1", "q": q["q"], "options": q["options"], "answerIndex": q["answerIndex"], "why": q["why"]}],
         "free": False, "review": {"status": "draft", "checkedBy": None, "checkedOn": None, "note": note.strip()},
         "tone": spec["tone"], "card": None}
json.dump(entry, open(f"{b}/{base}.manifest-entry.json", "w"), indent=2, ensure_ascii=False)
with open(f"{b}/{base}.claims.md", "w") as f:
    f.write(f"# Claims table: {spec['title']}\n\n| # | Claim (as spoken or shown) | Source | Status |\n|---|---|---|---|\n")
    for i, c in enumerate(spec.get("claims", []), 1):
        f.write(f"| {i} | {c['claim']} | {c.get('source','')} {c.get('url','')} | {c.get('status','')} |\n")
with open(f"{b}/{base}.elevenlabs.txt", "w") as f:
    f.write(f"=== {spec['title']} ({spec['tone']}) ===\n")
    for sent in spec["script"]:
        f.write(" ".join((f"[{s[5]}] " if len(s) > 5 and s[5] else "") + (s[1] or s[0]) for s in sent) + "\n")
if dist:
    os.makedirs(dist, exist_ok=True)
    for name, dst in ((f"{base}.vtt",)*2, (f"{base}.manifest-entry.json",)*2, (f"{base}.claims.md",)*2, (f"{base}.elevenlabs.txt",)*2):
        shutil.copy(f"{b}/{name}", f"{dist}/{dst}")
    if os.path.exists(f"{b}/video.mp4"): shutil.copy(f"{b}/video.mp4", f"{dist}/{base}.mp4")
    if os.path.exists(f"{b}/poster.jpg"): shutil.copy(f"{b}/poster.jpg", f"{dist}/{base}.jpg")
print(f"packaged {base}: {len(cues)} cues, {T['total']:.1f}s, {len(weak)} claims not primary-verified")
