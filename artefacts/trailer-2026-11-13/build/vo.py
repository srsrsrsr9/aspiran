#!/usr/bin/env python3
"""Voices the trailer with ElevenLabs and checks each take with ElevenLabs speech-to-text.

Usage: ELEVENLABS_API_KEY=... python3 build/vo.py [line ids to re-take...]
Reads audio/lines.json and audio/voices.json. Writes audio/vo/<id>.mp3 (the chosen take) and audio/vo/<id>.json
(the words heard, with times). With no ids, only voices lines that have no take yet. The key is read from the
environment and never written anywhere.
"""
import base64, json, os, re, subprocess, sys, urllib.request, uuid

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.environ["ELEVENLABS_API_KEY"]
LINES = json.load(open(os.path.join(HERE, "audio/lines.json")))
VOICES = json.load(open(os.path.join(HERE, "audio/voices.json")))
OUT = os.path.join(HERE, "audio/vo"); os.makedirs(OUT, exist_ok=True)
MODEL = os.environ.get("VO_MODEL", "eleven_v4")

def post(url, body, headers):
    req = urllib.request.Request(url, data=body, headers={"xi-api-key": KEY, **headers})
    with urllib.request.urlopen(req, timeout=180) as r: return r.read()

def tts(line):
    v = VOICES[line["spk"]]
    body = json.dumps({"text": line["say"], "model_id": MODEL,
                       "voice_settings": {"stability": line.get("stability", v.get("stability", 0.5)), "similarity_boost": 0.8}}).encode()
    return post(f"https://api.elevenlabs.io/v1/text-to-speech/{v['voice']}?output_format=mp3_44100_128", body, {"Content-Type": "application/json"})

def stt(path):
    b = "----" + uuid.uuid4().hex
    data = open(path, "rb").read()
    parts = [f"--{b}\r\nContent-Disposition: form-data; name=\"model_id\"\r\n\r\nscribe_v1\r\n".encode(),
             f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.mp3\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode(), data, f"\r\n--{b}--\r\n".encode()]
    return json.loads(post("https://api.elevenlabs.io/v1/speech-to-text", b"".join(parts), {"Content-Type": f"multipart/form-data; boundary={b}"}))

norm = lambda s: re.sub(r"[^\wऀ-ॿ ]", "", re.sub(r"\[[^\]]*\]", "", s).lower().replace("-", " ")).split()

def take(line):
    path = os.path.join(OUT, line["id"] + ".mp3")
    open(path, "wb").write(tts(line))
    heard = stt(path)
    words = [{"w": w["text"], "t0": w["start"], "t1": w["end"]} for w in heard.get("words", []) if w.get("type") == "word"]
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode())
    want, got = norm(line["say"]), norm(heard.get("text", ""))
    ok = want == got
    json.dump({"id": line["id"], "said": heard.get("text"), "words": words, "seconds": dur, "match": ok}, open(os.path.join(OUT, line["id"] + ".json"), "w"), ensure_ascii=False, indent=1)
    print(f"{line['id']} {dur:5.2f}s {'OK ' if ok else 'DIFF'} heard: {heard.get('text')}", flush=True)

ids = sys.argv[1:]
for line in LINES:
    if ids and line["id"] not in ids: continue
    if not ids and os.path.exists(os.path.join(OUT, line["id"] + ".mp3")): continue
    try: take(line)
    except urllib.error.HTTPError as e: print(line["id"], "refused:", e.code, e.read()[:300].decode(errors="replace"), flush=True)
