#!/usr/bin/env python3
"""voice: record every shot of a story folder with Fish Audio and check each take by speech-to-text.

    python3 content/tools/story/voice.py <story folder> [--lang en --lang hi]

Writes audio/<lang>/<nn>.mp3 (the takes build-story.py uses) and audio/check.json. Shots listed in story.json
"original": {"voiced": [...]} are the old line in its own language (Sanskrit, Tamil…): one take in the Hindi
narrator's voice, used in both language versions. Up to 3 takes per shot; the best is kept and the score recorded.
Fish key from the macOS Keychain (account aspiran), never printed.
"""
import argparse, json, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "cartesia"))
import prov, build  # noqa: E402

NARRATORS = {"en": "e0ea460db14b4430afb6311708937b6d", "hi": "24e7cbf4121745e7bb3b54d1a0d2be80"}
NEED = {"en": 0.88, "hi": 0.80, "sa": 0.6, "ta": 0.6}   # old-language lines: the checker hears Sanskrit/Tamil less well


def take(text, voice, lang, dest):
    best = None
    for n in range(3):
        f = dest.with_suffix(f".t{n}.mp3")
        prov.fish_tts(text, lang, voice, str(f))
        try: heard = prov.fish_asr(str(f), lang)
        except Exception as e: heard = f"(checker failed: {e})"
        s = round(build.score(text, heard, lang if lang in ("en", "hi") else "hi"), 3)
        if not best or s > best["score"]: best = {"file": f, "score": s, "heard": heard, "takes": n + 1}
        if s >= NEED.get(lang, 0.8): break
    shutil.copy(best["file"], dest)
    for f in dest.parent.glob(dest.stem + ".t*.mp3"): f.unlink()
    return {"text": text, "score": best["score"], "heard": best["heard"], "takes": best["takes"], "ok": best["score"] >= NEED.get(lang, 0.8)}


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("folder"); ap.add_argument("--lang", action="append")
    a = ap.parse_args()
    folder = Path(a.folder); story = json.loads((folder / "story.json").read_text())
    orig = story.get("original", {}); voiced = set(orig.get("voiced", [])); olang = orig.get("lang", "sa")
    checks = {}
    c0 = prov.fish_credit()
    for lang in a.lang or ["en", "hi"]:
        (folder / "audio" / lang).mkdir(parents=True, exist_ok=True)
        for i, s in enumerate(story["shots"], 1):
            dest = folder / "audio" / lang / f"{i:02d}.mp3"
            if dest.exists(): continue
            text = " ".join(s[lang])
            if i in voiced:
                shared = folder / "audio" / "orig" / f"{i:02d}.mp3"
                shared.parent.mkdir(exist_ok=True)
                if not shared.exists():
                    checks[f"orig-{i}"] = take(text, NARRATORS["hi"], olang, shared)
                shutil.copy(shared, dest); continue
            checks[f"{lang}-{i}"] = take(text, NARRATORS[lang], lang, dest)
            print(f"{folder.name} {lang} {i}: {checks[f'{lang}-{i}']['score']}", flush=True)
    old = json.loads((folder / "audio" / "check.json").read_text()) if (folder / "audio" / "check.json").exists() else {}
    old.update({k: v for k, v in checks.items()})
    (folder / "audio" / "check.json").write_text(json.dumps(old, ensure_ascii=False, indent=1))
    c1 = prov.fish_credit()
    bad = [k for k, v in old.items() if not v["ok"]]
    print(f"{folder.name}: Fish ${c0 - c1:.2f} used; below the bar: {bad or 'none'}")
