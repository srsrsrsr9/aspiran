#!/usr/bin/env python3
"""Generates the sound effects in audio/sfx.json with ElevenLabs sound generation -> audio/sfx/<name>.mp3.
Usage: ELEVENLABS_API_KEY=... python3 build/sfx.py [names...]   (no names: only the missing ones)"""
import json, os, sys, urllib.request
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FX = json.load(open(f"{HERE}/audio/sfx.json")); os.makedirs(f"{HERE}/audio/sfx", exist_ok=True)
for name, (prompt, secs) in FX.items():
    path = f"{HERE}/audio/sfx/{name}.mp3"
    if (sys.argv[1:] and name not in sys.argv[1:]) or (not sys.argv[1:] and os.path.exists(path)): continue
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
        data=json.dumps({"text": prompt, "duration_seconds": secs, "prompt_influence": 0.6}).encode(),
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
    try:
        open(path, "wb").write(urllib.request.urlopen(req, timeout=120).read()); print("ok", name, flush=True)
    except urllib.error.HTTPError as e: print("refused", name, e.code, e.read()[:200], flush=True)
