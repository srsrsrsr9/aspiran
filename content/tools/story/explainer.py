#!/usr/bin/env python3
"""explainer: a 9:16 explainer short from licensed footage, stills, drawn diagrams and a narrator.

    python3 content/tools/story/explainer.py <folder with explainer.json> [--no-voice]     build one (or several) videos
    python3 content/tools/story/explainer.py pack <pack folder> <explainer folders...>    copy into a shorts pack + manifest

explainer.json:
  "n", "id" (kebab), "title", "format" (calm | fast | photo: sets captions, transitions and sound), "syllabusNodes",
  "gsPaper", "tone" (NEUTRAL etc.), "sources" (list of strings), "quiz" (3 x {"q", "options" (4), "answerIndex", "why"}),
  "reviewNote", "endcard" ({"from": segment no. for the background, "line": picture credits}).
  "voice": "auto" (default: ElevenLabs Sumeet while the month's characters last, then Fish Shilpa) or {"provider", "id"}.
  Optional overrides: "captions" (lower | box | pop), "transition" (fade | cut), "bed" (none | pulse | drone), "whoosh".
  "segments": each has "say" (narration, one or two sentences) and one picture:
    "src": a video (with "t" start, optional "crop" [cx, cy, height share], "fit": cover | blur) or a still
           (with "kb": in | out | pan, optional "focus" [x, y], "fit": cover | blur);
    "anim": a drawn diagram, schematic, no maps, no borders. Either a built-in name (heat | winds | ghats | share) or
           {"type": "cards" | "flow" | "compare" | "timeline" | "bars" | "ring", "title", ...}:
             cards/flow: "items": ["text", ...]; compare: "left"/"right": {"title", "items": [...]};
             timeline: "items": [{"year", "text"}]; bars: "items": [{"label", "value", "show"?, "hi"?}];
             ring: "value" (0-1), "big", "below". Items appear one by one; an item may carry "at" (seconds).
    "end": true for the Aspiran end card (last segment, no "say").
    "numbers": [{"text", "sub", "word": spoken word that brings it in, "count": true to count up}].
Writes audio/NN.mp3 + audio/check.json (each take checked by speech-to-text), audio/voice.json, and in out/:
<id>.mp4 (720x1280 app cut, no captions), <id>.vtt (its subtitles), <id>.social.mp4 (1080x1920, captions burned in),
<id>.jpg (poster), contact.jpg (12 frames to check by eye), length.json.
All sound effects are made here from tones and noise: nothing to license.
Keys come from the macOS Keychain inside the process and are never printed.
"""
import base64, json, math, re, shutil, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "cartesia")); sys.path.insert(0, str(HERE))
import prov, build, endcard  # noqa: E402

W, H, FPS = 1080, 1920, 30
VIDEO = (".webm", ".mp4", ".mov", ".ogv", ".ogg")
LEAD, PAD, END_LEN = 0.25, 0.45, 3.6
AV = "/System/Library/Fonts/Avenir Next.ttc"
WEIGHT = {"Bold": 0, "Demi Bold": 2, "Medium": 5, "Regular": 7, "Heavy": 8}


def font(size, w="Demi Bold"):
    return ImageFont.truetype(AV, size, index=WEIGHT[w])


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode: sys.exit(f"failed: {' '.join(map(str, cmd))[:300]}\n{r.stderr[-1500:]}")
    return r


def seconds(p):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).stdout)


def speech_span(p):
    """Where speech starts and ends in a take (ignores leading/trailing silence)."""
    r = subprocess.run(["ffmpeg", "-i", str(p), "-af", "silencedetect=n=-45dB:d=0.15", "-f", "null", "-"], capture_output=True, text=True)
    d = seconds(p); st = re.findall(r"silence_start: ([\d.]+)", r.stderr); en = re.findall(r"silence_end: ([\d.]+)", r.stderr)
    a = float(en[0]) if st and float(st[0]) < 0.05 and en else 0.0
    b = float(st[-1]) if st and (len(st) > len(en) or float(en[-1]) >= d - 0.05) else d
    return a, max(a + 0.5, b)


# ---------------------------------------------------------------- voice

def fish_curl(text, v, dest):
    body = json.dumps({"text": text, "reference_id": v["id"], "format": "mp3", "mp3_bitrate": 128,
                       "prosody": {"speed": v.get("speed", 0.95)}, "normalize": True, "latency": "normal"})
    hdr = f"Authorization: Bearer {prov.key('fish-audio')}\nContent-Type: application/json\nmodel: {prov.FISH_MODEL}\n"
    for _ in range(4):
        r = subprocess.run(["curl", "-4", "-s", "-m", "180", "-H", "@-", "--data-binary", body, "-o", str(dest),
                            "https://api.fish.audio/v1/tts"], input=hdr, capture_output=True, text=True)
        if r.returncode == 0 and dest.exists() and dest.stat().st_size > 2000: return
    raise RuntimeError("Fish (curl) failed")


SUMEET = {"provider": "eleven", "id": "5x75eykrmdby4c1wlkAP", "name": "Sumeet (ElevenLabs)"}
SHILPA = {"provider": "fish", "id": "d96e903b57be4742b105dfb0d3e26d51", "speed": 0.95, "name": "Shilpa (Fish)"}


def eleven_left():
    import urllib.request
    r = json.loads(urllib.request.urlopen(urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription",
                   headers={"xi-api-key": prov.key("elevenlabs")}), timeout=30).read())
    return r["character_limit"] - r["character_count"]


def pick_voice(spec, folder):
    """"voice": "auto" (the default): ElevenLabs Sumeet while the month's characters last, then Fish Shilpa (owner, 25 Nov 2026).
    The choice is kept in audio/voice.json so one video never mixes two voices."""
    vf = folder / "audio" / "voice.json"
    if vf.exists(): return json.loads(vf.read_text())
    v = spec.get("voice", "auto")
    if v == "auto":
        need = sum(len(s.get("say", "")) for s in spec["segments"])
        try: v = SUMEET if eleven_left() >= need * 1.6 + 500 else SHILPA   # room for a retake or two
        except Exception: v = SHILPA
    vf.parent.mkdir(exist_ok=True); vf.write_text(json.dumps(v)); return v


def record(spec, folder):
    v = pick_voice(spec, folder); out = folder / "audio"; out.mkdir(exist_ok=True)
    cp = out / "check.json"; check = json.loads(cp.read_text()) if cp.exists() else {}
    for i, s in enumerate(spec["segments"], 1):
        if "say" not in s: continue
        dest = out / f"{i:02d}.mp3"
        if dest.exists() and check.get(str(i), {}).get("text") == s["say"]: continue
        best = None
        for n in range(3):
            tmp = out / f"{i:02d}.t{n}.mp3"; align = None
            if v["provider"] == "fish":
                try: prov.fish_tts(s["say"], "en", v["id"], str(tmp), speed=v.get("speed", 0.95))
                except RuntimeError: fish_curl(s["say"], v, tmp)   # the proxy sometimes cuts Python's reads; curl over IPv4 gets through
            else:
                j = prov.post(f"https://api.elevenlabs.io/v1/text-to-speech/{v['id']}/with-timestamps?output_format=mp3_44100_128",
                              {"xi-api-key": prov.key("elevenlabs"), "Content-Type": "application/json"},
                              {"text": s["say"], "model_id": "eleven_multilingual_v2",
                               "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.2}})
                tmp.write_bytes(base64.b64decode(j["audio_base64"])); align = j.get("alignment")
            try: heard = prov.fish_asr(str(tmp), "en")
            except Exception as e: heard = f"(checker failed: {e})"
            sc = round(build.score(s["say"], heard, "en"), 3)
            if not best or sc > best["score"]: best = {"tmp": tmp, "score": sc, "heard": heard, "align": align}
            if sc >= 0.9: break
        shutil.copy(best["tmp"], dest)
        for f in out.glob(f"{i:02d}.t*.mp3"): f.unlink()
        check[str(i)] = {"text": s["say"], "score": best["score"], "heard": best["heard"], "align": best["align"]}
        cp.write_text(json.dumps(check, ensure_ascii=False, indent=1))
        print(f"  voice {i:02d}: {best['score']}", flush=True)
    return check


def word_times(text, take, align):
    """(start, end) per word, from the take's start. ElevenLabs gives exact times; otherwise spread by length over the speech."""
    words = text.split()
    if align:
        chars, st, en = align["characters"], align["character_start_times_seconds"], align["character_end_times_seconds"]
        joined, pos, out = "".join(chars), 0, []
        for w in words:
            j = joined.find(w, pos)
            if j < 0: out = None; break
            out.append((st[j], en[j + len(w) - 1])); pos = j + len(w)
        if out: return out
    a, b = speech_span(take)
    weights = [len(w) + (3 if w[-1] in ",.?!:;" else 1) for w in words]
    tot, t, out = sum(weights), a, []
    for w, k in zip(words, weights):
        d = (b - a) * k / tot; out.append((t, t + d)); t += d
    return out


def chunks(words, most):
    out, cur = [], []
    for k, w in enumerate(words):
        cur.append(k)
        if len(cur) >= most or (w[-1] in ",.?!:;" and len(cur) >= max(2, most // 2)) or w[-1] in ".?!":
            out.append(cur); cur = []
    if cur: out.append(cur)
    return out


# ---------------------------------------------------------------- overlays (RGBA PIL images placed on the frame)

def _shadowed(txt_layer, radius, strength=1.0):
    a = txt_layer.split()[3].filter(ImageFilter.GaussianBlur(radius)).point(lambda v: min(255, int(v * 1.8 * strength)))
    sh = Image.new("RGBA", txt_layer.size, (0, 0, 0, 0)); sh.putalpha(a)
    return Image.alpha_composite(sh, txt_layer)


def wrap(d, text, f, width):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width or not cur: cur = t
        else: lines.append(cur); cur = w
    return lines + ([cur] if cur else [])


def caption_img(text, style):
    """Returns (image, x, y)."""
    if style == "pop":
        f = font(92, "Heavy"); text = text.upper().strip(",;:")
        d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
        lines = wrap(d, text, f, W * 0.84)
        lh = 108; im = Image.new("RGBA", (W, lh * len(lines) + 60), (0, 0, 0, 0)); dd = ImageDraw.Draw(im)
        for k, l in enumerate(lines):
            dd.text((W / 2, 30 + k * lh + lh / 2), l, font=f, anchor="mm", fill=(255, 255, 255, 255), stroke_width=7, stroke_fill=(10, 10, 14, 255))
        return _shadowed(im, 10), 0, 1230 - im.height // 2
    if style == "box":
        f = font(50, "Medium"); d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
        lines = wrap(d, text, f, W * 0.78); lh = 66
        bw = int(max(d.textlength(l, font=f) for l in lines)) + 68; bh = lh * len(lines) + 40
        im = Image.new("RGBA", (bw, bh), (0, 0, 0, 0)); dd = ImageDraw.Draw(im)
        dd.rounded_rectangle([0, 0, bw - 1, bh - 1], radius=24, fill=(16, 12, 26, 205))
        for k, l in enumerate(lines):
            dd.text((bw / 2, 20 + k * lh + lh / 2), l, font=f, anchor="mm", fill=(255, 250, 240, 255))
        return im, (W - bw) // 2, 1440 - bh
    f = font(56, "Demi Bold"); d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))   # lower third, no box
    lines = wrap(d, text, f, W * 0.84); lh = 72
    im = Image.new("RGBA", (W, lh * len(lines) + 40), (0, 0, 0, 0)); dd = ImageDraw.Draw(im)
    for k, l in enumerate(lines):
        dd.text((W / 2, 20 + k * lh + lh / 2), l, font=f, anchor="mm", fill=(255, 255, 255, 255))
    return _shadowed(im, 7, 1.4), 0, 1470 - im.height


def fit_font(text, size):
    """The biggest Heavy font up to `size` that fits the text across the screen."""
    d = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    while size > 60 and d.textlength(text, font=font(size, "Heavy")) > W - 100: size -= 8
    return font(size, "Heavy")


def number_img(text, sub, accent, compact=False):
    """compact: over a drawn diagram, the number sits below the diagram (which then ends at y=920)."""
    if compact:
        big = fit_font(text, 150 if len(text) <= 5 else 120); small = font(44, "Demi Bold")
        im = Image.new("RGBA", (W, 270), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        d.text((W / 2, 95), text, font=big, anchor="mm", fill=accent + (255,))
        if sub: d.text((W / 2, 215), sub, font=small, anchor="mm", fill=(255, 255, 255, 255))
        return _shadowed(im, 12, 1.4), 0, 935
    big = fit_font(text, 250 if len(text) <= 3 else 170); small = font(52, "Demi Bold")
    im = Image.new("RGBA", (W, 420), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text((W / 2, 170), text, font=big, anchor="mm", fill=accent + (255,))
    if sub: d.text((W / 2, 345), sub, font=small, anchor="mm", fill=(255, 255, 255, 255))
    return _shadowed(im, 16, 1.6), 0, 470


class Layer:
    def __init__(self, img, x, y, t0, t1, fin=0.15, fout=0.15, cap=False):
        self.cap = cap
        a = np.asarray(img.convert("RGBA"), dtype=np.float32) / 255.0
        a = a[max(0, -y):, max(0, -x):]          # a layer reaching past the top or left edge is trimmed
        self.rgb, self.a = a[..., :3] * 255.0, a[..., 3:4]
        self.x, self.y, self.t0, self.t1, self.fin, self.fout = max(0, x), max(0, y), t0, t1, fin, fout
        self.h, self.w = self.a.shape[:2]

    def alpha(self, t):
        if t < self.t0 or t >= self.t1: return 0.0
        k = 1.0
        if self.fin: k = min(k, (t - self.t0) / self.fin)
        if self.fout: k = min(k, (self.t1 - t) / self.fout)
        return max(0.0, min(1.0, k))

    def draw(self, frame, t):
        k = self.alpha(t)
        if k <= 0: return
        h, w = min(self.h, H - self.y), min(self.w, W - self.x)
        reg = frame[self.y:self.y + h, self.x:self.x + w]
        a = self.a[:h, :w] * k
        frame[self.y:self.y + h, self.x:self.x + w] = reg * (1 - a) + self.rgb[:h, :w] * a


# ---------------------------------------------------------------- drawn diagrams (schematic; no maps, no borders)

SEA, LAND, HOT, AIR, RAIN = (40, 92, 150), (176, 132, 82), (236, 120, 60), (210, 236, 255), (120, 190, 255)


def _arrow(d, p, q, col, w=10):
    d.line([p, q], fill=col, width=w)
    ang = math.atan2(q[1] - p[1], q[0] - p[0]); s = w * 2.6
    d.polygon([q, (q[0] - s * math.cos(ang - 0.45), q[1] - s * math.sin(ang - 0.45)),
               (q[0] - s * math.cos(ang + 0.45), q[1] - s * math.sin(ang + 0.45))], fill=col)


def _sky(d, top=(18, 24, 44), bot=(44, 60, 96)):
    for y in range(0, H, 8):
        k = y / H; d.rectangle([0, y, W, y + 8], fill=tuple(int(top[i] + (bot[i] - top[i]) * k) for i in range(3)))


def _thermo(d, x, y, level, col, label, f):
    d.rounded_rectangle([x - 22, y - 300, x + 22, y], radius=22, outline=(240, 240, 240), width=5)
    d.ellipse([x - 40, y - 20, x + 40, y + 60], fill=col, outline=(240, 240, 240), width=5)
    d.rounded_rectangle([x - 12, y - 20 - 260 * level, x + 12, y + 10], radius=12, fill=col)
    d.text((x, y - 345), label, font=f, anchor="mm", fill=(255, 255, 255))


GOLD, BLUE, INK, PANEL = (255, 205, 90), (120, 190, 255), (22, 28, 50), (44, 54, 86)


def _mix(c, a, bg=INK):
    return tuple(int(bg[i] + (c[i] - bg[i]) * a) for i in range(3))


def _ease(t, start, dur=0.45):
    x = max(0.0, min(1.0, (t - start) / dur)); return 1 - (1 - x) ** 3


def _lines(d, text, f, width):
    return wrap(d, text, f, width)


def generic_frame(g, t, L):
    """Reusable diagrams, all schematic: cards, flow, compare, timeline, bars, ring. Items appear one by one over the
    first three-quarters of the segment (or at "at" seconds). Content stays between y=230 and y=B so captions fit below."""
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im); _sky(d, (16, 20, 36), (30, 40, 66))
    kind, items = g["type"], g.get("items", []); B = g.get("_bottom", 1130)
    n = max(1, len(items)); span = max(1.0, L * 0.72 - 0.6)
    at = lambda k: items[k].get("at", 0.5 + k * span / n) if isinstance(items[k], dict) else 0.5 + k * span / n
    ft, fi, fs, fb = font(62, "Heavy"), font(46, "Demi Bold"), font(40, "Medium"), font(76, "Heavy")
    top = 250
    if g.get("title"):
        a = _ease(t, 0.1)
        for k, l in enumerate(_lines(d, g["title"], ft, W * 0.86)):
            d.text((W / 2, top + k * 74), l, font=ft, anchor="mm", fill=_mix(GOLD, a))
        top += 74 * len(_lines(d, g["title"], ft, W * 0.86)) + 40
    txt = lambda it: it["text"] if isinstance(it, dict) else it
    if kind == "cards":
        h = min(190, (B - top) / n - 24)
        for k, it in enumerate(items):
            a = _ease(t, at(k)); y = top + k * (h + 24) + 30 * (1 - a)
            if a <= 0: continue
            d.rounded_rectangle([90, y, W - 90, y + h], radius=26, fill=_mix(PANEL, a))
            d.rounded_rectangle([90, y, 104, y + h], radius=6, fill=_mix(GOLD, a))
            ls = _lines(d, txt(it), fi, W - 280)[:3]
            for j, l in enumerate(ls):
                d.text((140, y + h / 2 + (j - (len(ls) - 1) / 2) * 56), l, font=fi, anchor="lm", fill=_mix((255, 255, 255), a, PANEL))
    elif kind == "flow":
        h = min(150, ((B - top) - (n - 1) * 70) / n)
        for k, it in enumerate(items):
            a = _ease(t, at(k)); y = top + k * (h + 70)
            if a <= 0: continue
            col = GOLD if k == n - 1 else BLUE
            d.rounded_rectangle([140, y, W - 140, y + h], radius=30, outline=_mix(col, a), width=6, fill=_mix(PANEL, a))
            ls = _lines(d, txt(it), fi, W - 360)[:2]
            for j, l in enumerate(ls):
                d.text((W / 2, y + h / 2 + (j - (len(ls) - 1) / 2) * 54), l, font=fi, anchor="mm", fill=_mix((255, 255, 255), a, PANEL))
            if k < n - 1:
                b = _ease(t, at(k) + 0.35)
                if b > 0: _arrow(d, (W / 2, y + h + 8), (W / 2, y + h + 8 + 50 * b), _mix((220, 230, 245), b), 8)
    elif kind == "compare":
        cols = [g["left"], g["right"]]
        for c, colspec in enumerate(cols):
            x0 = 70 + c * 480; col = GOLD if c == 0 else BLUE
            a = _ease(t, 0.3 + c * 0.4)
            d.rounded_rectangle([x0, top, x0 + 460, top + 110], radius=24, fill=_mix(col, a))
            for j, l in enumerate(_lines(d, colspec["title"], fi, 420)[:2]):
                d.text((x0 + 230, top + 55 + (j - (min(2, len(_lines(d, colspec["title"], fi, 420))) - 1) / 2) * 50), l, font=fi, anchor="mm", fill=_mix(INK, a, INK) if a < 1 else INK)
            rows = colspec.get("items", []); m = max(len(cols[0].get("items", [])), len(cols[1].get("items", [])), 1)
            for k, it in enumerate(rows):
                st = 1.0 + (k * 2 + c) * (span - 0.6) / (2 * m)
                b = _ease(t, st); y = top + 150 + k * ((B - top - 150) / m)
                if b <= 0: continue
                for j, l in enumerate(_lines(d, it, fs, 420)[:3]):
                    d.text((x0 + 230, y + j * 48), l, font=fs, anchor="mt", fill=_mix((240, 244, 255), b))
    elif kind == "timeline":
        x = 190; d.line([(x, top), (x, B)], fill=(80, 96, 130), width=6)
        step = (B - top) / n
        for k, it in enumerate(items):
            a = _ease(t, at(k)); y = top + k * step + 20
            if a <= 0: continue
            d.ellipse([x - 18, y - 18, x + 18, y + 18], fill=_mix(GOLD, a))
            d.text((x + 50, y), str(it["year"]), font=font(56, "Heavy"), anchor="lm", fill=_mix(GOLD, a))
            for j, l in enumerate(_lines(d, it["text"], fs, W - x - 120)[:2]):
                d.text((x + 50, y + 50 + j * 46), l, font=fs, anchor="lt", fill=_mix((240, 244, 255), a))
    elif kind == "bars":
        vmax = max(float(it["value"]) for it in items); h = min(150, (B - top) / n)
        for k, it in enumerate(items):
            a = _ease(t, at(k), 0.9); y = top + k * h
            if a <= 0: continue
            d.text((100, y + 20), it["label"], font=fs, anchor="lt", fill=_mix((240, 244, 255), min(1, a * 2)))
            wbar = (W - 360) * float(it["value"]) / vmax * a
            d.rounded_rectangle([100, y + 72, 100 + max(16, wbar), y + 72 + 50], radius=14, fill=_mix(GOLD if it.get("hi") else BLUE, min(1, a * 2)))
            d.text((120 + max(16, wbar), y + 97), it.get("show", str(it["value"])), font=fi, anchor="lm", fill=_mix((255, 255, 255), min(1, a * 2)))
    elif kind == "ring":
        cx, cy, r = W / 2, top + 330, 300
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(70, 86, 120), width=64)
        sweep = 360 * float(g["value"]) * _ease(t, 0.4, max(1.0, span * 0.6))
        if sweep > 1: d.arc([cx - r, cy - r, cx + r, cy + r], -90, -90 + sweep, fill=BLUE, width=64)
        d.text((cx, cy), g.get("big", ""), font=font(150, "Heavy"), anchor="mm", fill=(255, 255, 255))
        if g.get("below"):
            a = _ease(t, span * 0.6)
            for j, l in enumerate(_lines(d, g["below"], fi, W * 0.8)[:2]):
                d.text((cx, cy + r + 90 + j * 58), l, font=fi, anchor="mm", fill=_mix((240, 244, 255), a))
    return im


def anim_frame(kind, t, L):
    if isinstance(kind, dict): return generic_frame(kind, t, L)
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im); p = min(1.0, t / max(1.0, L - 0.8))
    f, fb = font(46, "Demi Bold"), font(58, "Heavy")
    if kind in ("heat", "winds"):
        _sky(d)
        d.ellipse([W / 2 - 70, 170, W / 2 + 70, 310], fill=(255, 214, 120))   # sun
        land_top, sea_top = 760, 1120
        d.rectangle([0, land_top, W, sea_top], fill=LAND)                    # land band above, sea below (a diagram, not a map)
        for k in range(0, H - sea_top, 46):
            d.rectangle([0, sea_top + k, W, sea_top + k + 46], fill=tuple(max(0, c - k // 14) for c in SEA))
        d.text((60, land_top + 40), "LAND", font=fb, fill=(255, 245, 230), anchor="lm")
        d.text((60, sea_top + 50), "SEA", font=fb, fill=(220, 240, 255), anchor="lm")
        if kind == "heat":
            _thermo(d, 700, 660, 0.25 + 0.7 * p, HOT, "land", f)
            _thermo(d, 930, 660, 0.25 + 0.22 * p, RAIN, "sea", f)
            if p > 0.45:   # rising air over the land, and low pressure
                k = min(1, (p - 0.45) / 0.3)
                for x in (200, 380):
                    y0 = land_top - 30 - ((t * 120 + x) % 160)
                    _arrow(d, (x, y0 + 120), (x, y0 - 60 * k), (255, 200, 150), 9)
                d.text((290, 420), "LOW PRESSURE", font=fb, anchor="mm", fill=(255, 220, 160))
        else:
            d.text((W / 2, 440), "LOW PRESSURE", font=fb, anchor="mm", fill=(255, 220, 160))
            for col_x in (180, 420, 660, 900):     # moist air streaming from the sea onto the land
                for k in range(3):
                    y = sea_top + 520 - ((t * 260 + k * 230 + col_x) % 700)
                    _arrow(d, (col_x - 60, y + 120), (col_x + 20, y - 40), AIR, 11)
            d.text((W / 2, 1640), "wet sea air flows in", font=f, anchor="mm", fill=(230, 245, 255))
    elif kind == "ghats":
        _sky(d, (30, 40, 64), (70, 90, 120))
        base = 1400
        d.rectangle([0, base, 300, H], fill=SEA)                                   # sea on the left
        ridge = [(300, base), (520, 760), (640, 720), (760, 900), (W, 1080), (W, H), (300, H)]
        d.polygon(ridge, fill=(70, 110, 70))
        d.polygon([(760, 900), (W, 1080), (W, H), (700, H)], fill=(150, 125, 80))     # dry far side
        for k in range(4):                                                         # wind climbing the slope
            q = ((t * 0.5 + k / 4) % 1.0)
            x, y = 40 + q * 460, base - 60 - q * 560
            _arrow(d, (x - 70, y + 80), (x, y), AIR, 10)
        if p > 0.25:
            c = min(1, (p - 0.25) / 0.25)
            for cx, cy, r in ((360, 640, 90), (460, 600, 110), (560, 630, 90)):
                d.ellipse([cx - r * c, cy - r * 0.6 * c, cx + r * c, cy + r * 0.6 * c], fill=(225, 230, 240))
            for k in range(40):                                                     # rain on the sea-facing side
                rx = 330 + (k * 53) % 260; ry = 700 + ((t * 700 + k * 97) % 600)
                if ry < base - (rx - 300) * 1.4 + 40: d.line([(rx, ry), (rx - 6, ry + 30)], fill=RAIN, width=4)
        d.text((330, 470), "rain on this side", font=f, anchor="mm", fill=(220, 240, 255))
        if p > 0.6: d.text((870, 820), "dry side:", font=f, anchor="mm", fill=(255, 225, 170)); d.text((870, 876), "rain shadow", font=fb, anchor="mm", fill=(255, 225, 170))
        d.text((150, base + 90), "SEA", font=fb, anchor="mm", fill=(220, 240, 255))
        d.text((560, 1520), "HILLS", font=fb, anchor="mm", fill=(230, 245, 230))
    elif kind == "share":
        _sky(d, (16, 20, 36), (30, 40, 64))
        cx, cy, r = W / 2, 820, 330
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(80, 96, 130), width=70)
        sweep = 270 * min(1, p * 1.6)
        if sweep > 1: d.arc([cx - r, cy - r, cx + r, cy + r], -90, -90 + sweep, fill=RAIN, width=70)
        d.text((cx, cy - 30), "about", font=f, anchor="mm", fill=(220, 230, 245))
        d.text((cx, cy + 50), "3/4", font=font(150, "Heavy"), anchor="mm", fill=(255, 255, 255))
        d.text((cx, 1270), "of the year's rain falls", font=f, anchor="mm", fill=(230, 240, 255))
        d.text((cx, 1340), "June to September", font=fb, anchor="mm", fill=RAIN)
    return im


# ---------------------------------------------------------------- base pictures per segment

def cover(im, w, h, focus=(0.5, 0.5)):
    s = max(w / im.width, h / im.height); im = im.resize((math.ceil(im.width * s), math.ceil(im.height * s)), Image.LANCZOS)
    x = int(min(max(0, im.width * focus[0] - w / 2), im.width - w)); y = int(min(max(0, im.height * focus[1] - h / 2), im.height - h))
    return im.crop((x, y, x + w, y + h))


def blur_fit(im, w, h):
    bg = cover(im, w, h).filter(ImageFilter.GaussianBlur(40)).point(lambda v: int(v * 0.5))
    fg = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    bg.paste(fg, (0, (h - fg.height) // 2)); return bg


def seg_clip(folder, s, L, dest, tmp, fades):
    fx = []
    if fades[0]: fx.append(f"fade=in:d={fades[0]}")
    if fades[1]: fx.append(f"fade=out:st={L - fades[1]:.3f}:d={fades[1]}")
    tail = ("," + ",".join(fx)) if fx else ""
    enc = ["-r", str(FPS), "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", str(dest)]
    if "anim" in s:
        p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                              "-i", "-", "-vf", "null" + tail, *enc], stdin=subprocess.PIPE)
        for n in range(int(round(L * FPS))): p.stdin.write(anim_frame(s["anim"], n / FPS, L).tobytes())
        p.stdin.close(); p.wait(); return
    src = folder / s["src"]
    if src.suffix in VIDEO:
        if s.get("fit") == "blur":
            vf = (f"split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},gblur=sigma=40,eq=brightness=-0.18[bg];"
                  f"[b]scale={W}:-2[fg];[bg][fg]overlay=0:(H-h)/2" + tail)
        else:
            c = ""
            if "crop" in s:
                cx, cy, ch = s["crop"]
                c = f"crop=w='ih*{ch}*9/16':h='ih*{ch}':x='max(0,min(iw-ow,iw*{cx}-ow/2))':y='max(0,min(ih-oh,ih*{cy}-oh/2))',"
            vf = f"{c}scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}" + tail
        run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(s.get("t", 0)), "-stream_loop", "-1", "-i", str(src), "-t", f"{L:.3f}",
             "-filter_complex", vf, *enc]); return
    im = Image.open(src).convert("RGB"); kb = s.get("kb", "in"); n = int(round(L * FPS))
    if kb == "pan":
        wide = im.width / im.height > W / H
        sc = (H * 1.04) / im.height if wide else (W * 1.04) / im.width
        big = im.resize((int(im.width * sc) // 2 * 2, int(im.height * sc) // 2 * 2), Image.LANCZOS)
        f = tmp / f"{dest.stem}.png"; big.save(f)
        mv = f"x='(iw-ow)*t/{L:.3f}':y='(ih-oh)/2'" if wide else f"x='(iw-ow)/2':y='(ih-oh)*t/{L:.3f}'"
        run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(FPS), "-i", str(f), "-t", f"{L:.3f}",
             "-vf", f"crop={W}:{H}:{mv}" + tail, *enc]); return
    big = blur_fit(im, 2160, 3840) if s.get("fit") == "blur" else cover(im, 2160, 3840, tuple(s.get("focus", (0.5, 0.5))))
    f = tmp / f"{dest.stem}.png"; big.save(f)
    z = f"1+0.10*on/{n}" if kb == "in" else f"1.10-0.10*on/{n}"
    run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(FPS), "-i", str(f), "-t", f"{L:.3f}",
         "-vf", f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS}" + tail, *enc])


# ---------------------------------------------------------------- sound

def sound(spec, folder, plan, T, cuts, dest, tmp):
    ins, fl, vparts = [], [], []
    for k, (i, start) in enumerate(plan):
        ins += ["-i", str(folder / "audio" / f"{i:02d}.mp3")]
        fl.append(f"[{k}:a]aresample=44100,aformat=channel_layouts=mono,adelay={int(start * 1000)}:all=1[v{k}]"); vparts.append(f"[v{k}]")
    fl.append("".join(vparts) + f"amix=inputs={len(vparts)}:normalize=0,apad=whole_dur={T:.3f},atrim=0:{T:.3f},loudnorm=I=-15:TP=-1.5:LRA=11[voice]")
    extra = []
    n = len(plan)
    if spec.get("bed") == "pulse":
        for fr, vol in ((55, 0.32), (110, 0.07)):
            ins += ["-f", "lavfi", "-i", f"sine=f={fr}:d={T:.3f}"]
            fl.append(f"[{n}:a]volume={vol},tremolo=f=2:d=0.95[p{n}]"); extra.append(f"[p{n}]"); n += 1
    if spec.get("bed") == "drone":
        for fr in (110, 165, 220):
            ins += ["-f", "lavfi", "-i", f"sine=f={fr}:d={T:.3f}"]
            fl.append(f"[{n}:a]volume=0.035,tremolo=f=0.2:d=0.35[p{n}]"); extra.append(f"[p{n}]"); n += 1
    if spec.get("whoosh"):
        for c in cuts:
            ins += ["-f", "lavfi", "-i", "anoisesrc=c=pink:d=0.7:a=0.6"]
            fl.append(f"[{n}:a]highpass=f=500,lowpass=f=5000,afade=t=in:d=0.42:curve=exp,afade=t=out:st=0.42:d=0.28,"
                      f"volume=0.35,adelay={max(0, int((c - 0.42) * 1000))}:all=1[p{n}]"); extra.append(f"[p{n}]"); n += 1
    if extra:
        fl.append("".join(extra) + f"amix=inputs={len(extra)}:normalize=0,apad=whole_dur={T:.3f},atrim=0:{T:.3f},"
                  f"afade=t=in:d=1.0,afade=t=out:st={T - 2.5:.3f}:d=2.5[fx]")
        fl.append("[voice][fx]amix=inputs=2:normalize=0,alimiter=limit=0.89[out]")
    else:
        fl.append("[voice]alimiter=limit=0.89[out]")
    run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(fl), "-map", "[out]", "-ar", "44100", "-ac", "2", str(dest)])


# ---------------------------------------------------------------- build

FORMATS = {   # the three formats the owner kept (25 Nov 2026); a spec may still override any of these
    "calm":  {"captions": "lower", "transition": "fade", "bed": None, "whoosh": False},
    "fast":  {"captions": "pop", "transition": "cut", "bed": "pulse", "whoosh": True},
    "photo": {"captions": "box", "transition": "fade", "bed": "drone", "whoosh": False},
}


GLYPHS = {"₹": "Rs ", "→": "›", "₂": "2", "₃": "3", "⁻": "-"}     # Avenir Next has no glyph for these


def _glyphsafe(o):
    """Swap characters the font can't draw in on-screen text (diagrams, numbers, endcard); narration is untouched."""
    if isinstance(o, str):
        for a, b in GLYPHS.items(): o = o.replace(a, b)
        return re.sub(r"Rs (?=[,.;:)\]])", "Rs", o.replace("Rs  ", "Rs "))
    if isinstance(o, list): return [_glyphsafe(v) for v in o]
    if isinstance(o, dict): return {k: (v if k in ("say", "src", "word") else _glyphsafe(v)) for k, v in o.items()}
    return o


def build_one(folder, no_voice=False):
    spec = json.loads((folder / "explainer.json").read_text())
    spec = {**FORMATS.get(spec.get("format"), {}), **spec}
    spec["segments"], spec["endcard"] = _glyphsafe(spec["segments"]), _glyphsafe(spec.get("endcard", {}))
    check = {} if no_voice else record(spec, folder)
    if no_voice: check = json.loads((folder / "audio" / "check.json").read_text())
    tmp = Path(tempfile.mkdtemp()); out = folder / "out"; out.mkdir(exist_ok=True)
    segs, t, plan, layers, cuts = spec["segments"], 0.0, [], [], []
    fade = spec.get("transition") == "fade"
    clips, cues = [], []
    # 1. lengths, voice placement, captions and numbers
    lens = []
    for i, s in enumerate(segs, 1):
        if s.get("end"): lens.append(END_LEN); continue
        take = folder / "audio" / f"{i:02d}.mp3"
        lens.append(LEAD + seconds(take) + PAD)
    for i, (s, L) in enumerate(zip(segs, lens), 1):
        if i > 1: cuts.append(t)
        if "say" in s:
            take = folder / "audio" / f"{i:02d}.mp3"; plan.append((i, t + LEAD))
            words = s["say"].split(); wt = word_times(s["say"], take, check.get(str(i), {}).get("align"))
            style = spec.get("captions", "lower")
            groups = chunks(words, 3 if style == "pop" else 7)
            for gi, g in enumerate(chunks(words, 7)):     # subtitles for the app cut: always calm, 7 words at most
                nxt = chunks(words, 7)[gi + 1][0] if gi + 1 < len(chunks(words, 7)) else None
                a = t + LEAD + wt[g[0]][0]; b = t + LEAD + (wt[nxt][0] if nxt is not None else wt[g[-1]][1] + 0.3)
                cues.append((a, b, " ".join(words[k] for k in g)))
            for gi, g in enumerate(groups):
                a = t + LEAD + wt[g[0]][0]; b = t + LEAD + wt[g[-1]][1] + (0.12 if style == "pop" else 0.25)
                if gi + 1 < len(groups): b = min(b, t + LEAD + wt[groups[gi + 1][0]][0])   # never two captions at once
                img, x, y = caption_img(" ".join(words[k] for k in g), style)
                if style == "pop":    # a quick pop: slightly larger for the first frames
                    big = img.resize((int(img.width * 1.12), int(img.height * 1.12)), Image.LANCZOS)
                    layers.append(Layer(big, x - (big.width - img.width) // 2, y - (big.height - img.height) // 2, a, a + 0.08, 0.04, 0, cap=True))
                    layers.append(Layer(img, x, y, a + 0.08, b, 0, 0.06, cap=True))
                else:
                    layers.append(Layer(img, x, y, a, b, 0.12, 0.12, cap=True))
            nums = s.get("numbers", [])
            compact = isinstance(s.get("anim"), dict) and bool(nums)
            if compact: s["anim"]["_bottom"] = 900        # leave room under the diagram for the number
            starts = []
            for k, nm in enumerate(nums):
                st = t + 0.3
                if nm.get("word"):
                    hit = [j for j, w in enumerate(words) if w.strip(",.?!").lower().startswith(nm["word"].lower())]
                    if hit: st = t + LEAD + wt[hit[0]][0]
                starts.append(st)
            for k, nm in enumerate(nums):
                st, en = starts[k], (starts[k + 1] - 0.05 if k + 1 < len(nums) else t + L - 0.15)
                accent = (255, 205, 90)
                digits = re.fullmatch(r"\d+", nm["text"])
                if nm.get("count") and digits:
                    target, steps = int(nm["text"]), 14
                    for q in range(steps):
                        v = round(target * (1 - (1 - (q + 1) / steps) ** 3))
                        img, x, y = number_img(str(v), nm.get("sub"), accent, compact)
                        layers.append(Layer(img, x, y, st + q * 0.05, st + (q + 1) * 0.05, 0.05 if q == 0 else 0, 0))
                    img, x, y = number_img(nm["text"], nm.get("sub"), accent, compact)
                    layers.append(Layer(img, x, y, st + steps * 0.05, en, 0, 0.2))
                else:
                    img, x, y = number_img(nm["text"], nm.get("sub"), accent, compact)
                    layers.append(Layer(img, x, y, st, en, 0.25, 0.2))
        t += L
    T = t
    # 2. pictures
    for i, (s, L) in enumerate(zip(segs, lens), 1):
        dest = tmp / f"s{i:02d}.mp4"
        fades = (0.3 if fade or i == 1 else 0, 0.3 if fade or s.get("end") else 0)
        if s.get("end"):
            src = segs[spec["endcard"]["from"] - 1]
            grab = tmp / "endbase.png"
            if "src" in src and Path(src["src"]).suffix in VIDEO:
                run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(src.get("t", 0) + 1), "-i", str(folder / src["src"]), "-frames:v", "1", str(grab)])
                Image.open(grab).convert("RGB").save(grab)
                cover(Image.open(grab), W, H).save(grab)
            elif "src" in src: cover(Image.open(folder / src["src"]).convert("RGB"), W, H, tuple(src.get("focus", (0.5, 0.5)))).save(grab)
            else: anim_frame(src["anim"], 99, 100).save(grab)
            card = tmp / "endcard.png"; endcard.card(grab, spec["endcard"]["line"], "en", card, tmp)
            seg_clip(folder, {"src": str(card), "kb": "in"}, L, dest, tmp, fades)
        else:
            seg_clip(folder, s, L, dest, tmp, fades)
        clips.append(dest); print(f"  picture {i:02d}: {L:.1f}s", flush=True)
    lst = tmp / "list.txt"; lst.write_text("".join(f"file '{c}'\n" for c in clips))
    base = tmp / "base.mp4"; run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(base)])
    # 3. sound
    wav = tmp / "mix.wav"; sound(spec, folder, plan, T, cuts, wav, tmp)
    # 4. two cuts: social (1080x1920, captions burned in) and app (720x1280, numbers only; the app shows the VTT)
    final, app = out / f"{spec['id']}.social.mp4", out / f"{spec['id']}.mp4"
    dec = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", str(base), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    def encoder(dest, crf, scale=None):
        return subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                                 "-i", str(wav), "-map", "0:v", "-map", "1:a"] + (["-vf", f"scale={scale}:flags=lanczos"] if scale else []) +
                                ["-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
                                 "-c:a", "aac", "-b:a", "128k" if scale else "160k", "-shortest", "-movflags", "+faststart", str(dest)], stdin=subprocess.PIPE)
    enc, enc_app = encoder(final, 19), encoder(app, 25, "720:1280")
    n = 0
    while True:
        b = dec.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        tt = n / FPS; act = [l for l in layers if l.t0 <= tt < l.t1]
        if act:
            fr = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32)
            for l in act:
                if not l.cap: l.draw(fr, tt)
            enc_app.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
            for l in act:
                if l.cap: l.draw(fr, tt)
            b = np.clip(fr, 0, 255).astype(np.uint8).tobytes()
        else:
            enc_app.stdin.write(b)
        enc.stdin.write(b); n += 1
    for e in (enc, enc_app): e.stdin.close(); e.wait()
    dec.wait()
    stamp = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{x % 60:06.3f}"
    (out / f"{spec['id']}.vtt").write_text("WEBVTT\n\n" + "".join(f"{k}\n{stamp(a)} --> {stamp(b)}\n{txt}\n\n" for k, (a, b, txt) in enumerate(cues, 1)))
    (out / "length.json").write_text(json.dumps({"durationSec": round(T, 1)}))
    # 5. poster and contact sheet
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{lens[0] * 0.6:.2f}", "-i", str(app), "-frames:v", "1", "-q:v", "3", str(out / f"{spec['id']}.jpg")])
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(final), "-vf", f"fps=12/{T:.2f},scale=270:-2,tile=6x2", "-frames:v", "1", str(out / "contact.jpg")])
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"{folder.name}: {T:.1f}s -> {final}")
    return final


PAPER = {"gs1": "mains-gs1", "gs2": "mains-gs2", "gs3": "mains-gs3", "gs4": "mains-gs4", "prelims": "prelims-gs1", "essay": "mains-essay"}


def pack(dest, folders, today=None):
    """Copy built explainers into a shorts pack (content/motion/shorts/2001-NN) and write its manifest.json.
    Each explainer.json carries n, id, title, syllabusNodes, gsPaper, format, tone, sources, quiz and reviewNote."""
    import datetime
    dest.mkdir(parents=True, exist_ok=True)
    today = today or datetime.date.today().isoformat()
    eps, voices = [], set()
    for f in folders:
        spec = json.loads((f / "explainer.json").read_text()); out = f / "out"; stem = f"{spec['n']:03d}-{spec['id']}"
        for k in ("n", "id", "title", "syllabusNodes", "gsPaper", "format", "tone", "sources", "quiz", "reviewNote"):
            if not spec.get(k): raise SystemExit(f"{f.name}: explainer.json needs {k}")
        if len(spec["quiz"]) != 3: raise SystemExit(f"{f.name}: quiz needs 3 questions")
        for ext in (".mp4", ".social.mp4", ".vtt", ".jpg"):
            shutil.copy(out / f"{spec['id']}{ext}", dest / f"{stem}{ext}")
        v = json.loads((f / "audio" / "voice.json").read_text()) if (f / "audio" / "voice.json").exists() else {}
        voices.add("elevenlabs" if v.get("provider") == "eleven" else "fish-audio")
        quiz = [{"id": f"{spec['id']}-q{k}", **{x: q[x] for x in ("q", "options", "answerIndex", "why")}} for k, q in enumerate(spec["quiz"], 1)]
        eps.append({"n": spec["n"], "id": spec["id"], "title": spec["title"],
                    "durationSec": json.loads((out / "length.json").read_text())["durationSec"],
                    "mp4": f"{stem}.mp4", "vtt": f"{stem}.vtt", "poster": f"{stem}.jpg", "mp4Social": f"{stem}.social.mp4",
                    "syllabusNodes": spec["syllabusNodes"], "gsPaper": [PAPER.get(x, x) for x in spec["gsPaper"]], "format": "explainer-" + spec["format"],
                    "tone": spec["tone"], "sources": spec["sources"], "quiz": quiz, "free": True,
                    "review": {"status": "approved", "checkedBy": "Aspiran (owner publish)", "checkedOn": today, "note": spec["reviewNote"]}})
    eps.sort(key=lambda e: e["n"])
    first, last = eps[0]["n"], eps[-1]["n"]
    m = {"schema": "upsc-pods/ca-week@1", "week": dest.name, "lang": "en",
         "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
         "series": "illustrated-shorts", "title": f"Explainers, {first} to {last}" if first != last else f"Explainer {first}",
         "titleHi": f"समझिए, {first} से {last}" if first != last else f"समझिए, {first}",
         "voice": {"provider": "+".join(sorted(voices))}, "episodes": eps}
    (dest / "manifest.json").write_text(json.dumps(m, ensure_ascii=False, indent=1) + "\n")
    print(f"{dest.name}: {len(eps)} explainers, {first}-{last}")


if __name__ == "__main__":
    if sys.argv[1:2] == ["pack"]:     # python3 explainer.py pack <pack folder> <explainer folders...>
        pack(Path(sys.argv[2]).resolve(), [Path(a).resolve() for a in sys.argv[3:]]); sys.exit()
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    for a in args: build_one(Path(a).resolve(), "--no-voice" in sys.argv)
