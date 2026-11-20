"""Other voice providers. Keys come from the macOS Keychain inside the process; never printed or stored."""
import json, os, subprocess, urllib.request, base64, time
import socket
_gai = socket.getaddrinfo
def _v4(host, *a, **k):   # api.fish.audio stalls over IPv6 on this network; IPv4 only
    r = [x for x in _gai(host, *a, **k) if x[0] == socket.AF_INET]
    return r or _gai(host, *a, **k)
socket.getaddrinfo = _v4
_K = {}
def key(name):
    if name not in _K:
        _K[name] = subprocess.run(["security","find-generic-password","-a","aspiran","-s",name+"-api-key","-w"],capture_output=True,text=True,check=True).stdout.strip()
    return _K[name]
class Broke(Exception): pass   # out of credits / quota
def post(url, headers, body, raw=False, timeout=300, tries=6):
    data = body if isinstance(body, (bytes, bytearray)) else json.dumps(body).encode()
    last = None
    for a in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers), timeout=timeout) as r:
                b = r.read(); return b if raw else json.loads(b)
        except urllib.error.HTTPError as e:
            msg = e.read()[:400].decode("utf8", "replace"); last = f"HTTP {e.code}: {msg}"
            low = msg.lower()
            if e.code in (402,) or any(w in low for w in ("credit", "quota", "insufficient", "balance", "limit reached", "exhaust")): 
                if e.code != 429 or "quota" in low or "credit" in low: raise Broke(last)
            if e.code in (408, 429, 500, 502, 503, 504): time.sleep(4 * (a + 1)); continue
            raise RuntimeError(last)
        except Broke: raise
        except Exception as e: last = str(e); time.sleep(4 * (a + 1))
    raise RuntimeError(last or "failed")
def sarvam_tts(text, lang, speaker, out_wav, model="bulbul:v2", pace=1.0):
    j = post("https://api.sarvam.ai/text-to-speech", {"api-subscription-key": key("sarvam"), "Content-Type": "application/json"},
             {"text": text, "target_language_code": "hi-IN" if lang == "hi" else "en-IN", "speaker": speaker, "model": model, "pace": pace, "speech_sample_rate": 24000})
    open(out_wav, "wb").write(base64.b64decode(j["audios"][0]))
def small_copy(path):
    """A 32 kbps mono copy for the checker: smaller uploads don't stall."""
    out = path + ".stt.mp3"
    if not os.path.exists(out):
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-b:a", "32k", out], check=True)
    return out
def deepgram_stt(path, lang):
    path = small_copy(path)
    q = "model=nova-3&smart_format=false&punctuate=true&language=" + ("hi" if lang == "hi" else "en-IN")
    ct = "audio/wav" if path.endswith(".wav") else "audio/mpeg"
    j = post("https://api.deepgram.com/v1/listen?" + q, {"Authorization": "Token " + key("deepgram"), "Content-Type": ct}, open(path, "rb").read(), timeout=90)
    return j["results"]["channels"][0]["alternatives"][0]["transcript"]
def smallest_tts(text, lang, voice, out_wav, speed=1.0):
    b = post("https://waves-api.smallest.ai/api/v1/lightning-v3.1/get_speech", {"Authorization": "Bearer " + key("smallest"), "Content-Type": "application/json"},
             {"text": text, "voice_id": voice, "sample_rate": 24000, "speed": speed, "language": lang, "output_format": "wav"}, raw=True)
    open(out_wav, "wb").write(b)
def inworld_tts(text, lang, voice, out_mp3, model="inworld-tts-1.5-max", speed=1.0):
    j = post("https://api.inworld.ai/tts/v1/voice", {"Authorization": "Basic " + key("inworld"), "Content-Type": "application/json"},
             {"text": text, "voiceId": voice, "modelId": model, "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 44100, "speakingRate": speed}})
    open(out_mp3, "wb").write(base64.b64decode(j["audioContent"]))
def chariot_tts(text, lang, voice, out_wav, model="chariot-multilingual-v1", speed=1.0):
    """Chariot sync TTS (1 credit per character, WAV 44.1 kHz mono). A request takes at most 1,000 characters, so longer text goes in parts."""
    import re, wave, io
    parts, cur = [], ""
    for s in re.split(r"(?<=[.!?।\n])\s*", text):
        if cur and len(cur) + len(s) + 1 > 950: parts.append(cur); cur = s
        else: cur = (cur + " " + s).strip()
    if cur: parts.append(cur)
    frames, params = [], None
    for p in parts:
        b = post("https://api.chariot.in/v1/tts", {"chariotai-api-key": key("chariot"), "Content-Type": "application/json"},
                 {"voice_id": voice, "text": p, "model_type": model, "speed": speed}, raw=True)
        with wave.open(io.BytesIO(b)) as w: params = params or w.getparams(); frames.append(w.readframes(w.getnframes()))
    with wave.open(out_wav, "wb") as w: w.setparams(params); [w.writeframes(f) for f in frames]
def chariot_stt(path, lang):
    """Chariot file speech-to-text (1.5 credits per second); used as a second opinion on a chunk the first checker failed."""
    r = subprocess.run(["curl", "-s", "--fail-with-body", "https://api.chariot.in/v1/asr/transcribe", "-H", "chariotai-api-key: " + key("chariot"),
                        "-F", "language=" + lang, "-F", "style=native", "-F", "input_audio_file=@" + path], capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stdout[-300:])
    return json.loads(r.stdout).get("text", "")
FISH_LEDGER = []   # one entry per Fish request: bytes of text sent (billed at about $15 per million bytes)
import threading
FISH_SLOTS = threading.BoundedSemaphore(int(os.environ.get("FISH_SLOTS", "5")))
FISH_MODEL = os.environ.get("FISH_MODEL", "s2.1-pro")
def _fish_once(body, deadline):
    """One request with a whole-request deadline: the service sometimes sends the header and then trickles for many minutes."""
    req = urllib.request.Request("https://api.fish.audio/v1/tts", data=json.dumps(body).encode(),
        headers={"Authorization": "Bearer " + key("fish-audio"), "Content-Type": "application/json", "model": FISH_MODEL})
    t0, buf = time.time(), bytearray()
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            while True:
                c = r.read1(65536)   # returns as soon as anything arrives, so the deadline is checked
                if not c: return bytes(buf)
                buf += c
                el = time.time() - t0   # audio streams in at about real time (16 KB a second); a stalled request trickles
                if el > deadline or (el > 45 and len(buf) < el * 4000): raise TimeoutError(f"slow: {len(buf)} bytes in {int(el)}s")
    except urllib.error.HTTPError as e:
        msg = e.read()[:300].decode("utf8", "replace")
        if e.code == 402 or "credit" in msg.lower() or "balance" in msg.lower(): raise Broke(f"HTTP {e.code}: {msg}")
        raise RuntimeError(f"HTTP {e.code}: {msg}")
def fish_tts(text, lang, voice, out_mp3, speed=0.95):
    """Fish Audio (paid, commercial use), a Fish-licensed voice. The answer is the MP3 itself."""
    body = {"text": text, "reference_id": voice, "format": "mp3", "mp3_bitrate": 128, "prosody": {"speed": speed}, "normalize": True, "latency": "normal"}
    last, a, busy = None, 0, 0
    while True:
        try:
            with FISH_SLOTS: b = _fish_once(body, 120 + len(text) // 4)
            break
        except Broke: raise
        except Exception as e:
            last = e
            if "429" in str(e) and busy < 40: busy += 1; time.sleep(5 + 3 * min(busy, 10)); continue   # over the concurrency cap: wait, not a failure
            a += 1
            if isinstance(e, TimeoutError): FISH_LEDGER.append(len(text.encode("utf8")))   # a cut-off request may still be billed
            if a >= 8: raise RuntimeError(f"Fish failed 8 times: {last}")
            time.sleep(3 * a)
    if len(b) < 2000: raise RuntimeError("Fish returned no audio: " + b[:200].decode("utf8", "replace"))
    open(out_mp3, "wb").write(b)
    FISH_LEDGER.append(len(text.encode("utf8")))
def fish_asr(path, lang):
    """Fish Audio speech-to-text; the second opinion on a chunk the first checker failed."""
    r = subprocess.run(["curl", "-4", "-s", "--fail-with-body", "https://api.fish.audio/v1/asr", "-H", "Authorization: Bearer " + key("fish-audio"),
                        "-F", "language=" + lang, "-F", "ignore_timestamps=true", "-F", "audio=@" + small_copy(path), "-m", "120"], capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stdout[-300:])
    return json.loads(r.stdout).get("text", "")
def fish_credit():
    return float(json.loads(urllib.request.urlopen(urllib.request.Request("https://api.fish.audio/wallet/self/api-credit", headers={"Authorization": "Bearer " + key("fish-audio")}), timeout=30).read())["credit"])
