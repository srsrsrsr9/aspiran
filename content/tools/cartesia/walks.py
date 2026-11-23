"""Records the Track A "study walk" episodes (content/study-walks/<batch>/<id>.<lang>.txt) with Fish Audio, two voices.
N: lines in the narrator's voice, F: lines in the friend's, [pause Ns] as silence. Every request is checked by speech-to-text
(Deepgram nova-3, then Fish's own as a second opinion), up to 3 takes. Joined at -16 LUFS, mono MP3.
python3 walks.py [--ids a,b] [--langs en,hi] [--workers 8]
Output: content/audio/cartesia/walks/<id>.<lang>.mp3 and .json (git-ignored). Keys from the Keychain inside prov.py."""
import json, os, re, sys, glob, argparse, subprocess, threading
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import prov, build
from cart import dur

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "..", "study-walks")
OUT = os.path.join(build.DATA, "walks")
# Both Fish-licensed. Friend: SHILPA in both languages (Fish has no licensed female Hindi voice; she reads Hindi cleanly).
VOICE = {("N", "en"): (build.FISH_EN, "Shubh"), ("N", "hi"): (build.FISH_HI, "Shant"),
         ("F", "en"): ("d96e903b57be4742b105dfb0d3e26d51", "Shilpa"), ("F", "hi"): ("d96e903b57be4742b105dfb0d3e26d51", "Shilpa")}
GAP_TURN, GAP_SAME = 0.55, 0.35   # seconds between speakers / between parts of one speaker's turn
lock = threading.Lock()

def parse(path):
    """[(speaker, text) | ("pause", seconds)] in order."""
    segs = []
    for line in open(path, encoding="utf8").read().splitlines():
        line = line.strip()
        if not line: continue
        m = re.fullmatch(r"\[pause (\d+(?:\.\d+)?)s\]", line)
        if m: segs.append(("pause", float(m.group(1)))); continue
        m = re.match(r"^([NF]):\s*(.+)$", line)
        if not m: raise ValueError(f"{path}: line without speaker: {line[:60]}")
        for part in build.split_long(m.group(2)): segs.append((m.group(1), part))
    return segs

def take(id_, lang, i, who, text):
    d = os.path.join(OUT, "work", f"{id_}.{lang}"); os.makedirs(d, exist_ok=True)
    meta_p = os.path.join(d, f"{i:03d}.json")
    need = build.PASS[lang] - (0.12 if len(text) < 120 else 0)
    if os.path.exists(meta_p):
        m = json.load(open(meta_p))
        if m["text"] == text and m["who"] == who and os.path.exists(m["file"]) and m["ok"]: return m
    voice, name = VOICE[(who, lang)]
    best, takes = None, []
    for t in range(3):
        f = os.path.join(d, f"{i:03d}.t{t}.mp3")
        prov.fish_tts(text, lang, voice, f)
        try: heard = prov.deepgram_stt(f, lang)
        except Exception: heard = prov.fish_asr(f, lang)   # Deepgram sometimes drops the connection
        sc = round(build.score(text, heard, lang), 3)
        takes.append(sc)
        c = {"file": f, "score": sc, "heard": heard, "seconds": round(dur(f), 2)}
        if not best or sc > best["score"]: best = c
        if sc >= need: break
    m = {"i": i, "who": who, "voice": name, "text": text, **best, "takes": takes, "ok": best["score"] >= need}
    if not m["ok"]:
        try:
            h2 = prov.fish_asr(m["file"], lang); s2 = round(build.score(text, h2, lang), 3)
            if s2 >= need: m["check2"] = {"by": "Fish Audio asr", "score": s2, "heard": h2}; m["ok"] = True
            else: m["check2_failed"] = {"score": s2, "heard": h2}
        except Exception as e: m["check2_error"] = str(e)[:200]
    json.dump(m, open(meta_p, "w"), ensure_ascii=False, indent=1)
    return m

def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr); p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    return float(i[-1]), (float(p[-1]) if p else None)

def join(id_, lang, segs, metas):
    out = os.path.join(OUT, f"{id_}.{lang}.mp3")
    inputs, filt, n, t, prev, marks = [], "", 0, 0.0, None, {}
    k = 0
    for s, m in zip(segs, metas):
        if s[0] == "pause":
            filt += f"anullsrc=r=44100:cl=mono,atrim=duration={s[1]}[a{n}];"; t += s[1]; n += 1; prev = None; continue
        gap = 0 if prev is None else (GAP_SAME if prev == s[0] else GAP_TURN)
        if gap:
            filt += f"anullsrc=r=44100:cl=mono,atrim=duration={gap}[a{n}];"; t += gap; n += 1
        marks[m["i"]] = round(t, 1)
        inputs += ["-i", m["file"]]
        filt += f"[{k}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono[a{n}];"; k += 1; n += 1
        t += m["seconds"]; prev = s[0]
    raw = out.replace(".mp3", ".raw.wav")
    filt += "".join(f"[a{j}]" for j in range(n)) + f"concat=n={n}:v=0:a=1[out]"
    fs = out.replace(".mp3", ".filter.txt"); open(fs, "w").write(filt)
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex_script", fs, "-map", "[out]", "-ac", "1", "-ar", "44100", raw], check=True)
    os.remove(fs)
    # Two-pass loudness to -16 LUFS integrated, true peak under -1.5 dBTP.
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    st = r.stderr.rindex("{"); j = json.loads(r.stderr[st:r.stderr.index("}", st) + 1])
    ln = f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", ln + ",aresample=44100", "-ac", "1", "-b:a", "96k", out], check=True)
    os.remove(raw)
    return out, marks

def run(id_, lang, ex):
    src = glob.glob(os.path.join(SRC, "*", f"{id_}.{lang}.txt"))[0]
    segs = parse(src)
    jobs = [(i, s) for i, s in enumerate(segs) if s[0] != "pause"]
    futs = {i: ex.submit(take, id_, lang, i, s[0], s[1]) for i, s in jobs}
    metas = [futs[i].result() if s[0] != "pause" else None for i, s in enumerate(segs)]
    out, marks = join(id_, lang, segs, metas)
    I, peak = lufs(out)
    spoken = [m for m in metas if m]
    rep = {"id": id_, "lang": lang, "file": out, "seconds": round(dur(out), 1), "lufs": I, "peak": peak, "requests": len(spoken),
           "retaken": [m["i"] for m in spoken if len(m["takes"]) > 1], "check2": [m["i"] for m in spoken if m.get("check2")],
           "failed": [{"i": m["i"], "score": m["score"], "text": m["text"], "heard": m["heard"]} for m in spoken if not m["ok"]],
           "minScore": min(m["score"] for m in spoken), "bytes": sum(len(m["text"].encode("utf8")) for m in spoken),
           "voices": sorted({m["voice"] for m in spoken}), "marks": marks}
    json.dump(rep, open(out.replace(".mp3", ".json"), "w"), ensure_ascii=False, indent=1)
    print(f"{id_}.{lang}: {rep['seconds']/60:.1f} min, {I} LUFS, {len(rep['retaken'])} retaken, {len(rep['failed'])} failed, min {rep['minScore']}", flush=True)
    return rep

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids"); ap.add_argument("--langs", default="en,hi"); ap.add_argument("--workers", type=int, default=8)
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    ids = a.ids.split(",") if a.ids else sorted({os.path.basename(p).split(".")[0] for p in glob.glob(os.path.join(SRC, "*", "*.en.txt"))})
    c0 = prov.fish_credit(); print(f"Fish credit at start: ${c0:.2f}", flush=True)
    with ThreadPoolExecutor(a.workers) as ex, ThreadPoolExecutor(4) as outer:
        def safe(x):
            try: return run(x[0], x[1], ex)
            except Exception as e: print(f"{x[0]}.{x[1]}: stopped ({str(e)[:120]}); run again to resume", flush=True)
        list(outer.map(safe, [(i, l) for i in ids for l in a.langs.split(",")]))
    c1 = prov.fish_credit(); print(f"Fish credit at end: ${c1:.2f} (used ${c0 - c1:.2f})", flush=True)
