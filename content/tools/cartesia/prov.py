"""Other voice providers. Keys come from the macOS Keychain inside the process; never printed or stored."""
import json, subprocess, urllib.request, base64, time
_K = {}
def key(name):
    if name not in _K:
        _K[name] = subprocess.run(["security","find-generic-password","-a","aspiran","-s",name+"-api-key","-w"],capture_output=True,text=True,check=True).stdout.strip()
    return _K[name]
class Broke(Exception): pass   # out of credits / quota
def post(url, headers, body, raw=False, timeout=300, tries=4):
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
            if e.code in (429, 500, 502, 503, 504): time.sleep(4 * (a + 1)); continue
            raise RuntimeError(last)
        except Broke: raise
        except Exception as e: last = str(e); time.sleep(4 * (a + 1))
    raise RuntimeError(last or "failed")
def sarvam_tts(text, lang, speaker, out_wav, model="bulbul:v2", pace=1.0):
    j = post("https://api.sarvam.ai/text-to-speech", {"api-subscription-key": key("sarvam"), "Content-Type": "application/json"},
             {"text": text, "target_language_code": "hi-IN" if lang == "hi" else "en-IN", "speaker": speaker, "model": model, "pace": pace, "speech_sample_rate": 24000})
    open(out_wav, "wb").write(base64.b64decode(j["audios"][0]))
def deepgram_stt(path, lang):
    q = "model=nova-3&smart_format=false&punctuate=true&language=" + ("hi" if lang == "hi" else "en-IN")
    ct = "audio/wav" if path.endswith(".wav") else "audio/mpeg"
    j = post("https://api.deepgram.com/v1/listen?" + q, {"Authorization": "Token " + key("deepgram"), "Content-Type": ct}, open(path, "rb").read())
    return j["results"]["channels"][0]["alternatives"][0]["transcript"]
def smallest_tts(text, lang, voice, out_wav, speed=1.0):
    b = post("https://waves-api.smallest.ai/api/v1/lightning-v3.1/get_speech", {"Authorization": "Bearer " + key("smallest"), "Content-Type": "application/json"},
             {"text": text, "voice_id": voice, "sample_rate": 24000, "speed": speed, "language": lang, "output_format": "wav"}, raw=True)
    open(out_wav, "wb").write(b)
def inworld_tts(text, lang, voice, out_mp3, model="inworld-tts-1.5-max", speed=1.0):
    j = post("https://api.inworld.ai/tts/v1/voice", {"Authorization": "Basic " + key("inworld"), "Content-Type": "application/json"},
             {"text": text, "voiceId": voice, "modelId": model, "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 44100, "speakingRate": speed}})
    open(out_mp3, "wb").write(base64.b64decode(j["audioContent"]))
