#!/usr/bin/env python3
"""Trims silence off each chosen take, applies the character's pitch, and writes _work/vo/<id>.wav plus
build/vo_timing.json ({id: {seconds, words:[{w,t0,t1}]}}) with word times moved to match. No network."""
import json, os, subprocess
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = json.load(open(f"{HERE}/audio/lines.json")); V = json.load(open(f"{HERE}/audio/voices.json"))
os.makedirs(f"{HERE}/_work/vo", exist_ok=True); out = {}
for l in L:
    src, dst = f"{HERE}/audio/vo/{l['id']}.mp3", f"{HERE}/_work/vo/{l['id']}.wav"
    heard = json.load(open(f"{HERE}/audio/vo/{l['id']}.json"))
    v = V[l["spk"]]; p = v.get("pitch", 1.0)
    w = heard["words"]; t0 = max(0, w[0]["t0"] - l.get("lead", 0.06)); t1 = w[-1]["t1"] + 0.15
    chain = f"atrim={t0:.3f}:{t1:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02"
    if p != 1.0: chain += f",asetrate={int(44100*p)},aresample=44100,atempo={1/p*v.get('tempo',1.0):.4f}"
    chain += ",highpass=f=70,acompressor=threshold=0.12:ratio=3:attack=5:release=120,aresample=48000"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", chain, "-ac", "1", dst], check=True)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst]))
    k = v.get("tempo", 1.0)  # pitch is time-neutral; tempo shortens
    out[l["id"]] = {"seconds": round(dur, 3), "words": [{"w": x["w"], "t0": round((x["t0"] - t0) / k, 3), "t1": round((x["t1"] - t0) / k, 3)} for x in w]}
json.dump(out, open(f"{HERE}/build/vo_timing.json", "w"), ensure_ascii=False, indent=0)
for k, v in out.items(): print(k, v["seconds"])
print("total", round(sum(v["seconds"] for v in out.values()), 1))
