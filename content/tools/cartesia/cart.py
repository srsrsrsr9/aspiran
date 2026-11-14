"""Cartesia helpers. The key is read from the macOS Keychain inside this process; never printed or stored."""
import json, subprocess, urllib.request, uuid, time
_K = None
def key():
    global _K
    if _K is None:
        _K = subprocess.run(["security","find-generic-password","-a","aspiran","-s","cartesia-api-key","-w"],capture_output=True,text=True,check=True).stdout.strip()
    return _K
H = lambda: {"X-API-Key": key(), "Cartesia-Version": "2025-04-16"}
def tts(voice, lang, text, out, speed=None, emotion=None, volume=None, fmt="mp3"):
    b = {"model_id":"sonic-3","transcript":text,"voice":{"mode":"id","id":voice},"language":lang,
         "output_format":({"container":"mp3","sample_rate":44100,"bit_rate":128000} if fmt=="mp3" else {"container":"wav","encoding":"pcm_s16le","sample_rate":44100})}
    g = {}
    if speed is not None: g["speed"]=speed
    if emotion: g["emotion"]=emotion
    if volume is not None: g["volume"]=volume
    if g: b["generation_config"]=g
    for attempt in range(5):
        req = urllib.request.Request("https://api.cartesia.ai/tts/bytes", data=json.dumps(b).encode(), headers={**H(),"Content-Type":"application/json"})
        try:
            with urllib.request.urlopen(req, timeout=300) as r: data=r.read()
            open(out,"wb").write(data); return len(text)
        except urllib.error.HTTPError as e:
            msg=e.read()[:300]
            if e.code in (429,500,502,503,504): time.sleep(5*(attempt+1)); continue
            raise RuntimeError(f"HTTP {e.code}: {msg}")
        except Exception as e:
            time.sleep(5*(attempt+1))
    raise RuntimeError("tts failed after retries")
def stt(path, lang):
    bd = uuid.uuid4().hex
    data = open(path,"rb").read()
    parts = []
    for k,v in (("model","ink-whisper"),("language",lang)):
        parts.append(f'--{bd}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    parts.append(f'--{bd}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode()+data+b"\r\n")
    parts.append(f"--{bd}--\r\n".encode())
    for attempt in range(5):
        req = urllib.request.Request("https://api.cartesia.ai/stt", data=b"".join(parts), headers={**H(),"Content-Type":f"multipart/form-data; boundary={bd}"})
        try:
            with urllib.request.urlopen(req, timeout=300) as r: return json.loads(r.read())["text"]
        except urllib.error.HTTPError as e:
            if e.code in (429,500,502,503,504): time.sleep(5*(attempt+1)); continue
            raise RuntimeError(f"STT HTTP {e.code}: {e.read()[:300]}")
        except Exception: time.sleep(5*(attempt+1))
    raise RuntimeError("stt failed")
def dur(path):
    return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",path],capture_output=True,text=True).stdout.strip() or 0)
