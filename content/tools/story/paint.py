#!/usr/bin/env python3
"""paint: make the pictures for a story folder with an image model on OpenRouter.

    OPENROUTER_API_KEY=... python3 content/tools/story/paint.py <story folder> [--only 1,3] [--model google/gemini-3.1-flash-image]

For every shot in story.json that has an "art" description and no picture yet in shots/, asks for one portrait (9:16)
painting in the series style and saves it as shots/<img>. Shots with "endcard" are made by endcard.py, not here.
Writes shots/ledger.json (model, prompt, cost) next to the pictures. The key is read from the environment and never written.
"""
import argparse, base64, json, os, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path

STYLE = ("Painted illustration in soft gouache and watercolour, like a classic Indian storybook plate. "
         "Dusk palette: rose pink, soft violet, lavender clouds, warm gold light, gentle painted texture. "
         "Vertical 9:16 composition; keep the upper third calm and uncluttered (text will sit there). "
         "No text, letters, numbers, signs, logos, watermarks or borders anywhere. "
         "People only small, from behind or in silhouette, with no visible faces. "
         "No gods, deities, saints, religious symbols or national flags. No maps. Scene: ")


def paint(prompt, model, key):
    body = {"model": model, "modalities": ["image", "text"], "image_config": {"aspect_ratio": "9:16"},
            "messages": [{"role": "user", "content": STYLE + prompt}], "usage": {"include": True}, "max_tokens": int(os.environ.get("PAINT_MAX_TOKENS", "4000"))}
    # curl, not urllib: the answer is a few MB and the network proxy sometimes cuts a long read short.
    with tempfile.TemporaryDirectory() as t:
        bf, of = Path(t) / "body.json", Path(t) / "out.json"
        bf.write_text(json.dumps(body))
        for a in range(4):
            r = subprocess.run(["curl", "-s", "-m", "240", "-o", str(of), "-w", "%{http_code}", "https://openrouter.ai/api/v1/chat/completions",
                                "-H", "Authorization: Bearer " + key, "-H", "Content-Type: application/json", "--data-binary", "@" + str(bf)],
                               capture_output=True, text=True)
            code = r.stdout.strip()
            try:
                d = json.loads(of.read_text())
            except Exception:
                print(f"  incomplete answer (curl {r.returncode}, HTTP {code}), retrying"); time.sleep(4 * (a + 1)); continue
            if code == "402" and "in_flight" in str(d) and a < 3:
                print("  OpenRouter is holding credit for earlier requests; waiting 130 s"); time.sleep(130); continue
            if code in ("401", "402", "403"): sys.exit(f"OpenRouter refused (HTTP {code}): {str(d)[:300]}")
            try:
                url = d["choices"][0]["message"]["images"][0]["image_url"]["url"]
                return base64.b64decode(url.split(",", 1)[1]), (d.get("usage") or {}).get("cost")
            except (KeyError, IndexError, TypeError):
                print(f"  no picture in the answer (HTTP {code}): {str(d)[:150]}"); time.sleep(4 * (a + 1))
    sys.exit("OpenRouter gave no picture after 4 tries.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("folder"); ap.add_argument("--only"); ap.add_argument("--model", default="google/gemini-3.1-flash-image")
    ap.add_argument("--redo", action="store_true", help="paint again even if the picture exists")
    a = ap.parse_args()
    key = os.environ.get("OPENROUTER_API_KEY") or sys.exit("Set OPENROUTER_API_KEY.")
    folder = Path(a.folder); story = json.loads((folder / "story.json").read_text())
    only = {int(x) for x in a.only.split(",")} if a.only else None
    ledger_path = folder / "shots" / "ledger.json"
    ledger = json.loads(ledger_path.read_text()) if ledger_path.exists() else []
    for i, s in enumerate(story["shots"], 1):
        if "art" not in s or (only and i not in only): continue
        dest = folder / "shots" / s["img"]
        if dest.exists() and not a.redo: continue
        img, cost = paint(s["art"], a.model, key)
        dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(img)
        ledger.append({"shot": i, "img": s["img"], "model": a.model, "cost": cost, "at": time.strftime("%Y-%m-%dT%H:%M:%S")})
        print(f"{folder.name} shot {i}: {len(img) // 1024} KB, cost {cost}")
        ledger_path.write_text(json.dumps(ledger, indent=1))
    ledger_path.write_text(json.dumps(ledger, indent=1))
