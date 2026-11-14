"""Voices Aspiran's syllabus notes and walk scripts, checks every chunk by speech-to-text, then joins them.
Providers are tried in order per series; when one runs out of credits the next takes over (whole readings, never mid-reading).
python3 build.py [--plan first|rest] [--ids a,b] [--limit N] [--workers 4] [--langs en,hi]"""
import json, os, re, sys, argparse, difflib, subprocess, threading, time
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cart, prov
from cart import dur
from speak import speak, hi_num, en_num

HERE = os.path.dirname(os.path.abspath(__file__))
# Generated audio stays out of git (content/audio/cartesia/ is ignored).
DATA = os.environ.get("CARTESIA_DATA", os.path.join(HERE, "..", "..", "audio", "cartesia"))
LIB = os.path.join(DATA, "lib.json")    # approved reads and walks, see README.md
WORK = os.path.join(DATA, "work")
OUT = os.path.join(DATA, "out")

# One voice per series where credits allow: (provider, voice id, name shown in the app). Order = order tried.
CHAIN = {
    ("read", "en"): [("cartesia", "c63361f8-d142-4c62-8da7-8f8149d973d6", "Krishna"), ("inworld", "Saanvi", "Saanvi"), ("smallest", "aditi", "Aditi")],
    ("read", "hi"): [("cartesia", "5283efe8-07d1-4e3a-b615-2ae4a81c1b73", "Kriti"), ("inworld", "Manoj", "Manoj"), ("smallest", "kunal", "Kunal")],
    ("walk-script", "en"): [("cartesia", "4459a9a5-69d6-4680-b970-e13dc51845b6", "Siya"), ("smallest", "siddharth", "Siddharth"), ("inworld", "Nikhil", "Nikhil")],
    ("walk-script", "hi"): [("cartesia", "205fc552-2cce-4307-baa1-598b9dc3dd01", "Rehan"), ("smallest", "meera", "Meera"), ("inworld", "Seema", "Seema")],
}
MODEL = {"cartesia": "Cartesia sonic-3", "inworld": "Inworld inworld-tts-1.5-max", "smallest": "Smallest lightning-v3.1"}
EXT = {"cartesia": "mp3", "inworld": "mp3", "smallest": "wav"}
dead = set()          # providers that reported no credits in this run
SPEED = 0.95
PASS = {"en": 0.90, "hi": 0.80}
lock = threading.Lock()
usage = {}

def say(provider, voice, lang, text, out, emotion):
    if provider == "cartesia":
        try: cart.tts(voice, lang, text, out, speed=SPEED, emotion=emotion)
        except RuntimeError as e:
            if "402" in str(e) or "credit" in str(e).lower(): raise prov.Broke(str(e))
            raise
    elif provider == "inworld": prov.inworld_tts(text, lang, voice, out, speed=SPEED)
    elif provider == "smallest": prov.smallest_tts(text, lang, voice, out, speed=SPEED)

def split_long(text, n=900):
    """Paragraphs grouped up to n characters; a longer paragraph is cut at sentence ends."""
    paras = []
    for p in text.split("\n"):
        p = p.strip()
        if not p: continue
        if len(p) <= n: paras.append(p); continue
        cur = ""
        for s in re.split(r"(?<=[.!?।])\s+", p):
            if cur and len(cur) + len(s) > n: paras.append(cur); cur = s
            else: cur = (cur + " " + s).strip()
        if cur: paras.append(cur)
    out, cur = [], ""
    for p in paras:
        if cur and len(cur) + len(p) > n: out.append(cur); cur = p
        else: cur = (cur + "\n" + p) if cur else p
    if cur: out.append(cur)
    return out

GAP, QGAP = 0.9, 3.5     # seconds of quiet after a chunk; after a "test yourself" question

def units(rows, ids, langs):
    """Each chunk: (chapter label, text, emotion, quiet seconds after)."""
    us = []
    for r in rows:
        j = json.loads(r["json"]); iid = j["id"]
        if ids is not None and iid not in ids: continue
        if j.get("tone") == "TRAGIC": continue      # tragic pieces get no recorded voice
        for lang in ["en"] + (["hi"] if r["hi_editor"] else []):
            if lang not in langs: continue
            calm = "calm" if j.get("tone") == "SERIOUS" else "content"
            ch = []
            if r["kind"] == "read":
                secs = j["sections"].get(lang)
                if not secs: continue
                title, dek = j["title"].get(lang) or j["title"]["en"], (j.get("dek") or {}).get(lang, "")
                if lang == "en": ch.append(("Start", f"{title}.\nAn Aspiran note, read by an AI voice.\n{dek}", calm, GAP))
                else: ch.append(("शुरुआत", f"{title}।\nAspiran का नोट, एक AI आवाज़ में।\n{dek}", calm, GAP))
                for s in secs:
                    head = s.get("heading") or s.get("head") or ""
                    for k, p in enumerate(split_long(s["body"])):
                        ch.append((head, (f"{head}.\n" if k == 0 and head else "") + p, calm, GAP))
                qs = (j.get("recall") or {}).get(lang) or []
                q_emo = "curious" if calm == "content" else "calm"
                if lang == "en":
                    if qs: ch.append(("Test yourself", "Now, test yourself. After each question, pause and answer aloud.", q_emo, GAP))
                    for q in qs: ch.append(("Test yourself", q, q_emo, QGAP))
                    ch.append(("Test yourself" if qs else "End", "That's the end of this note. Write down what you remember, then check it against the page.", calm, GAP))
                else:
                    if qs: ch.append(("ख़ुद को परखें", "अब ख़ुद को परखिए। हर सवाल के बाद रुकिए और जवाब बोलकर दीजिए।", q_emo, GAP))
                    for q in qs: ch.append(("ख़ुद को परखें", q, q_emo, QGAP))
                    ch.append(("ख़ुद को परखें" if qs else "समाप्त", "यह नोट यहीं पूरा होता है। जो याद है, लिख लीजिए, फिर पेज से मिलाइए।", calm, GAP))
            else:  # walk-script
                text = (j.get("script") or {}).get(lang)
                if not text: continue
                topic = j["topic"].get(lang) or j["topic"]["en"]
                if lang == "en": ch.append(("", f"{topic}.\nAn Aspiran guided walk, read by an AI voice.", calm, GAP))
                else: ch.append(("", f"{topic}।\nAspiran की ओर से, चलते-चलते सुनने के लिए। यह एक AI आवाज़ है।", calm, GAP))
                for p in split_long(text): ch.append(("", p, calm, GAP))
                ch.append(("", "Now say your answer aloud, once. Then walk on." if lang == "en" else "अब अपना जवाब एक बार बोलकर कहिए। फिर आगे चलिए।", calm, GAP))
            us.append({"kind": r["kind"], "id": iid, "lang": lang, "chunks": ch})
    return us

def norm(t, lang):
    t = re.sub(r"<[^>]+>", " ", t).lower()
    if lang == "hi":
        t = re.sub(r"\d+(?:,\d{2,3})*(?:\.\d+)?", lambda m: hi_num(m.group(0)), t)
        t = re.sub(r"[a-z]+", " ", t)      # the checker writes loanwords in Latin letters; compare the Devanagari only
        t = t.replace("़", "").replace("ँ", "ं").replace("ी", "ि").replace("ू", "ु").replace("ॉ", "ा")
    else:
        t = t.replace("%", " percent").replace("per cent", "percent")
        t = re.sub(r"\d+(?:,\d{3})*(?:\.\d+)?", lambda m: en_num(m.group(0)), t)
        t = t.replace("-", " ").replace(" and ", " ")
    return re.sub(r"[^\w]|_", "", t)

def score(script, heard, lang):
    """Share of the script found, in order, in what the checker heard."""
    a, b = norm(script, lang), norm(heard, lang)
    if not a: return 1.0
    got = sum(m.size for m in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks())
    extra = max(0, len(b) - len(a)) / len(a)        # a lot of extra speech also fails
    return max(0.0, got / len(a) - max(0.0, extra - 0.25))

def do_chunk(u, i, text, emotion, provider, voice):
    d = os.path.join(WORK, u["kind"], f'{u["id"]}.{u["lang"]}')
    os.makedirs(d, exist_ok=True)
    meta_p = os.path.join(d, f"{provider}.{i:02d}.json")
    spoken = speak(text, u["lang"])
    need = PASS[u["lang"]] - (0.12 if len(spoken) < 120 else 0)     # a short line has little to match on
    if os.path.exists(meta_p):
        m = json.load(open(meta_p))
        m["file"] = os.path.join(d, os.path.basename(m["file"]))
        if os.path.exists(m["file"]) and m["spoken"] == spoken: return m
    best = None
    for take in range(3):
        f = os.path.join(d, f"{provider}.{i:02d}.t{take}.{EXT[provider]}")
        say(provider, voice, u["lang"], spoken, f, emotion)
        secs = dur(f)
        heard = prov.deepgram_stt(f, u["lang"])
        sc = score(spoken, heard, u["lang"])
        with lock:
            g = usage.setdefault(provider, {"chars": 0, "takes": 0, "seconds": 0.0}); g["chars"] += len(spoken); g["takes"] += 1; g["seconds"] += secs
        cand = {"take": take, "file": f, "score": round(sc, 3), "seconds": round(secs, 2), "heard": heard}
        if not best or sc > best["score"]: best = cand
        if sc >= need: break
    m = {"i": i, "provider": provider, "spoken": spoken, **best, "ok": best["score"] >= need}
    json.dump(m, open(meta_p, "w"), ensure_ascii=False, indent=1)
    return m

def join(u, metas):
    os.makedirs(os.path.join(OUT, u["kind"]), exist_ok=True)
    out = os.path.join(OUT, u["kind"], f'{u["id"]}.{u["lang"]}.mp3')
    inputs, t, chapters = [], 0.0, []
    for m, (label, _, _, gap) in zip(metas, u["chunks"]):
        if label and (not chapters or chapters[-1]["title"] != label): chapters.append({"t": round(t, 1), "title": label})
        inputs += ["-i", m["file"]]
        t += m["seconds"] + gap
    n = len(metas)
    parts = "".join(f"[{k}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono,apad=pad_dur={u['chunks'][k][3]}[a{k}];" for k in range(n))
    parts += "".join(f"[a{k}]" for k in range(n)) + f"concat=n={n}:v=0:a=1,loudnorm=I=-18:TP=-1.5:LRA=11[out]"
    script = out.replace(".mp3", ".filter.txt"); open(script, "w").write(parts)
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex_script", script, "-map", "[out]", "-ac", "1", "-ar", "44100", "-b:a", "64k", out], check=True)
    os.remove(script)
    return out, round(dur(out), 1), chapters

def run_unit(u, ex):
    for provider, voice, name in CHAIN[(u["kind"], u["lang"])]:
        if provider in dead: continue
        futs = [ex.submit(do_chunk, u, i, text, emo, provider, voice) for i, (_, text, emo, _) in enumerate(u["chunks"])]
        metas, broke = [], None
        for f in futs:
            try: metas.append(f.result())
            except prov.Broke as e: broke = e
        if broke:
            with lock: dead.add(provider)
            print(f"   {provider} is out of credits ({str(broke)[:90]}); moving on", flush=True)
            continue
        out, secs, chapters = join(u, metas)
        rep = {"kind": u["kind"], "id": u["id"], "lang": u["lang"], "provider": provider, "model": MODEL[provider], "voice": name, "file": out, "seconds": secs,
               "chapters": chapters, "chunks": len(metas), "minScore": min(m["score"] for m in metas), "failed": [m["i"] for m in metas if not m["ok"]],
               "chars": sum(len(m["spoken"]) for m in metas)}
        json.dump(rep, open(out.replace(".mp3", ".json"), "w"), ensure_ascii=False, indent=1)
        return rep
    return None

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", default="first"); ap.add_argument("--ids"); ap.add_argument("--limit", type=int); ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--langs", default="en,hi"); ap.add_argument("--skip", default="cartesia")
    a = ap.parse_args()
    dead.update(x for x in a.skip.split(",") if x)
    rows = {json.loads(r["json"])["id"]: r for r in json.load(open(LIB))[0]["results"] if r["kind"] in ("read", "walk-script")}
    order = a.ids.split(",") if a.ids else [c["id"] for c in json.load(open(os.path.join(DATA, "plan.json")))[a.plan]]
    us = [u for i in order if i in rows for u in units([rows[i]], None, a.langs.split(","))]
    if a.limit: us = us[: a.limit]
    print(f"{len(us)} readings, {sum(len(u['chunks']) for u in us)} chunks", flush=True)
    ex = ThreadPoolExecutor(a.workers)
    t0 = time.time(); total = 0.0
    for n, u in enumerate(us, 1):
        done = os.path.join(OUT, u["kind"], f'{u["id"]}.{u["lang"]}.json')
        if os.path.exists(done) and not json.load(open(done))["failed"]:
            total += json.load(open(done))["seconds"]; continue
        try: r = run_unit(u, ex)
        except Exception as e:
            print(f'[{n}/{len(us)}] ERROR {u["id"]}.{u["lang"]}: {str(e)[:200]}', flush=True); continue
        if r is None: print("Every provider for this series is out of credits. Stopping.", flush=True); break
        total += r["seconds"]
        print(f'[{n}/{len(us)}] {r["id"]}.{r["lang"]} {r["provider"]}/{r["voice"]} {r["seconds"]/60:.1f} min, lowest check {r["minScore"]}, failed {r["failed"]} | total {total/3600:.2f} h | {int(time.time()-t0)}s', flush=True)
    log = os.path.join(DATA, "usage.jsonl"); open(log, "a").write(json.dumps({"at": time.strftime("%Y-%m-%d %H:%M"), **usage}) + "\n")
    print("usage", usage, "dead", sorted(dead), flush=True)
