#!/usr/bin/env python3
"""build-story: turn a folder of pictures and a script into an illustrated story video for the app.

    python3 content/tools/story/build-story.py content/motion/story/07-monkey-king-bridge [--lang en] [--no-voice]

The folder holds:
    story.json      what to make (see below)
    shots/01.png …  one picture per shot, portrait (any size; 9:16 is best)
    audio/<lang>/01.mp3 …   optional: a voice take per shot. Missing takes are made with Fish Audio when the
                            FISH_API_KEY environment variable is set; with --no-voice (or no key) the shot is silent
                            and lasts as long as its words would take to read.

story.json:
    { "id": "monkey-king-bridge", "n": 7,
      "title": { "en": "The King Who Made Himself a Bridge", "hi": "…" },
      "voice": { "en": "<Fish voice id>", "hi": "<Fish voice id>" },      optional; the guide's narrators by default
      "poster": 1,                                                         optional; which shot is the poster
      "shots": [ { "img": "01.png", "en": ["Eighty thousand monkeys.", "One way out."], "hi": ["…", "…"] }, … ] }
    Each string is one caption line (keep to about 28 characters); a shot's lines are read as one sentence group.

It writes, into out/<lang>/ :
    <nn>-<id>.mp4          720 x 1280, 30 fps, H.264 + AAC, no captions burned in (the app shows the VTT)
    <nn>-<id>.vtt          captions, one line per cue, timed from the voice
    <nn>-<id>.jpg          poster (also what reduced motion and sound-off show)
    <nn>-<id>.social.mp4   1080 x 1920 with captions burned in, for sharing; the app does not use it
    <nn>-<id>.timing.json  shot and cue times, for checking

Rules it keeps: a slow push-in or drift only (about 4% over a shot), short cross-fades, no music, loudness evened out,
and it refuses a video longer than 120 seconds. The Fish Audio key is read from the environment and never written.
On this Mac:  export FISH_API_KEY="$(security find-generic-password -a aspiran -s fish-audio-api-key -w)"
"""
import argparse, json, os, re, subprocess, sys, tempfile, urllib.request
from pathlib import Path

W, H, FPS = 720, 1280, 30
FADE = 0.3            # cross-fade between shots, seconds
PAD = 0.35            # quiet after each shot's voice
LEAD = 0.25           # quiet before the first word
MAX_SECONDS = 120
NARRATORS = {"en": "e0ea460db14b4430afb6311708937b6d", "hi": "24e7cbf4121745e7bb3b54d1a0d2be80"}
FONTS = {"en": ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"],
         "hi": ["/System/Library/Fonts/Kohinoor.ttc", "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc"]}


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.exit(f"Command failed: {' '.join(map(str, cmd[:6]))} …\n{r.stderr[-1500:]}")
    return r.stdout


def seconds(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(out.strip())


def fish_tts(text, lang, voice, dest):
    key = os.environ.get("FISH_API_KEY")
    if not key:
        return False
    body = json.dumps({"text": text, "reference_id": voice, "language": lang, "format": "mp3", "mp3_bitrate": 128,
                       "prosody": {"speed": 0.95}, "normalize": True, "latency": "normal"}).encode()
    req = urllib.request.Request("https://api.fish.audio/v1/tts", data=body, method="POST", headers={
        "Authorization": "Bearer " + key, "Content-Type": "application/json", "model": "s2.1-pro"})
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            data = res.read()
    except Exception as e:  # the key never appears in the message
        sys.exit(f"Fish Audio did not answer for a {lang} line: {type(e).__name__} {getattr(e, 'code', '')}")
    if len(data) < 2000:
        sys.exit(f"Fish Audio sent too little audio for a {lang} line; check the credits and the voice id.")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return True


def vtt_time(t):
    return f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{t % 60:06.3f}"


def caption_png_mac(text, lang, dest, scale):
    """The same caption drawn by macOS itself, which joins Devanagari letters properly (Pillow alone does not)."""
    import AppKit, Foundation
    w, h = int(W * scale), int(H * scale)
    size = 44 * scale
    font = (AppKit.NSFont.fontWithName_size_("KohinoorDevanagari-Bold", size) if lang == "hi" else None) \
        or AppKit.NSFont.boldSystemFontOfSize_(size)
    para = AppKit.NSMutableParagraphStyle.alloc().init()
    para.setAlignment_(AppKit.NSTextAlignmentCenter)
    attrs = {AppKit.NSFontAttributeName: font, AppKit.NSForegroundColorAttributeName: AppKit.NSColor.whiteColor(),
             AppKit.NSParagraphStyleAttributeName: para}
    string = AppKit.NSAttributedString.alloc().initWithString_attributes_(text, attrs)
    box = string.boundingRectWithSize_options_(Foundation.NSMakeSize(w * 0.8, h), AppKit.NSStringDrawingUsesLineFragmentOrigin)
    tw, th = box.size.width, box.size.height
    bw, bh = tw + 48 * scale, th + 28 * scale
    rep = AppKit.NSBitmapImageRep.alloc().initWithBitmapDataPlanes_pixelsWide_pixelsHigh_bitsPerSample_samplesPerPixel_hasAlpha_isPlanar_colorSpaceName_bytesPerRow_bitsPerPixel_(
        None, w, h, 8, 4, True, False, AppKit.NSDeviceRGBColorSpace, 0, 0)
    ctx = AppKit.NSGraphicsContext.graphicsContextWithBitmapImageRep_(rep)
    AppKit.NSGraphicsContext.saveGraphicsState()
    AppKit.NSGraphicsContext.setCurrentContext_(ctx)
    x0, top = (w - bw) / 2, h * 0.30                      # top edge of the box, measured from the top of the frame
    y0 = h - top - bh                                     # AppKit counts from the bottom
    AppKit.NSColor.colorWithCalibratedRed_green_blue_alpha_(16 / 255, 16 / 255, 20 / 255, 0.84).setFill()
    AppKit.NSBezierPath.bezierPathWithRoundedRect_xRadius_yRadius_(Foundation.NSMakeRect(x0, y0, bw, bh), 18 * scale, 18 * scale).fill()
    string.drawWithRect_options_(Foundation.NSMakeRect((w - w * 0.8) / 2, y0 + 14 * scale, w * 0.8, th), AppKit.NSStringDrawingUsesLineFragmentOrigin)
    AppKit.NSGraphicsContext.restoreGraphicsState()
    rep.representationUsingType_properties_(AppKit.NSBitmapImageFileTypePNG, None).writeToFile_atomically_(str(dest), False)


def caption_png(text, lang, dest, scale):
    try:
        return caption_png_mac(text, lang, dest, scale)
    except ImportError:
        if lang != "en":
            print("Note: Hindi captions in the social cut need macOS drawing (pyobjc); letters may not join correctly.")
    return caption_png_pillow(text, lang, dest, scale)


def caption_png_pillow(text, lang, dest, scale):
    """One caption as a transparent picture: white bold type on a dark rounded box, upper middle of the frame."""
    from PIL import Image, ImageDraw, ImageFont
    w, h = int(W * scale), int(H * scale)
    size = int(44 * scale)
    font = None
    for f in FONTS.get(lang, FONTS["en"]):
        try:
            font = ImageFont.truetype(f, size, **({"index": 1} if f.endswith("Kohinoor.ttc") else {}))
            break
        except Exception:
            continue
    font = font or ImageFont.load_default()
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Wrap by width so a long line never runs off the picture.
    words, lines, cur = text.split(), [], ""
    for word in words:
        t = (cur + " " + word).strip()
        if d.textlength(t, font=font) > w * 0.8 and cur:
            lines.append(cur); cur = word
        else:
            cur = t
    lines.append(cur)
    lh = int(size * 1.35)
    bw = int(max(d.textlength(l, font=font) for l in lines) + 48 * scale)
    bh = lh * len(lines) + int(28 * scale)
    x0, y0 = (w - bw) // 2, int(h * 0.30)
    d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=int(18 * scale), fill=(16, 16, 20, 215))
    for i, l in enumerate(lines):
        d.text(((w - d.textlength(l, font=font)) / 2, y0 + int(14 * scale) + i * lh), l, font=font, fill=(255, 255, 255, 255))
    img.save(dest)


def build(folder, lang, no_voice):
    story = json.loads((folder / "story.json").read_text())
    sid = re.sub(r"[^A-Za-z0-9._-]", "-", story["id"])[:70]
    name = f"{int(story.get('n', 1)):02d}-{sid}"
    shots = story["shots"]
    if not shots:
        sys.exit("story.json has no shots.")
    voice = (story.get("voice") or {}).get(lang) or NARRATORS.get(lang)
    out = folder / "out" / lang
    out.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="story-"))

    # 1. Voice per shot, so each picture lasts exactly as long as its words.
    plan, silent = [], 0
    for i, s in enumerate(shots, 1):
        img = folder / "shots" / s["img"]
        if not img.is_file():
            sys.exit(f"Shot {i}: no picture at {img}")
        lines = [l.strip() for l in s.get(lang, []) if l.strip()]
        if not lines:
            sys.exit(f"Shot {i} has no {lang} lines.")
        take = folder / "audio" / lang / f"{i:02d}.mp3"
        if not take.is_file() and not no_voice:
            fish_tts(" ".join(lines), lang, voice, take)
        if take.is_file():
            dur = seconds(take)
        else:
            silent += 1
            dur = max(1.6, len(" ".join(lines).split()) * (0.42 if lang == "en" else 0.5))
            take = None
        plan.append({"img": img, "lines": lines, "take": take, "voice": dur})
    if silent and not no_voice:
        print(f"Note: {silent} shot(s) have no voice (no FISH_API_KEY and no take in audio/{lang}/). They are silent.")

    # 2. Times. Shot i shows from start_i for length_i; neighbours overlap by FADE.
    t = 0.0
    for i, p in enumerate(plan):
        lead = LEAD if i == 0 else 0.0
        p["len"] = lead + p["voice"] + PAD + (FADE if i < len(plan) - 1 else 0.4)
        p["start"] = t
        p["speak"] = t + lead + (FADE / 2 if i else 0)
        t += p["len"] - (FADE if i < len(plan) - 1 else 0)
    total = t
    if total > MAX_SECONDS:
        sys.exit(f"This story runs {total:.0f} seconds; the limit is {MAX_SECONDS}. Cut lines or shots.")

    # 3. Captions: a shot's lines share its voice time by length.
    cues = []
    for p in plan:
        chars = sum(len(l) for l in p["lines"])
        at = p["speak"]
        for l in p["lines"]:
            d = p["voice"] * len(l) / chars
            cues.append({"start": at, "end": at + d, "text": l})
            at += d
    vtt = "WEBVTT\n\n" + "\n".join(f"{n}\n{vtt_time(c['start'])} --> {vtt_time(c['end'])}\n{c['text']}\n" for n, c in enumerate(cues, 1))
    (out / f"{name}.vtt").write_text(vtt)

    # 4. Each shot as a clip with a slow push-in or drift (about 4%), alternating so it never feels mechanical.
    def clips(scale, tag):
        w, h = int(W * scale), int(H * scale)
        made = []
        for i, p in enumerate(plan):
            frames = int(round(p["len"] * FPS))
            big = f"scale={w * 2}:{h * 2}:force_original_aspect_ratio=increase,crop={w * 2}:{h * 2}"
            if i % 3 == 0:    # push in
                zp = f"zoompan=z='1+0.04*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            elif i % 3 == 1:  # pull back
                zp = f"zoompan=z='1.04-0.04*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            else:             # drift sideways
                zp = f"zoompan=z='1.04':x='(iw-iw/zoom)*on/{frames}':y='ih/2-(ih/zoom/2)'"
            dest = tmp / f"{tag}-{i:02d}.mp4"
            run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", str(p["img"]), "-vf",
                 f"{big},{zp}:d={frames}:s={w}x{h}:fps={FPS},format=yuv420p", "-frames:v", str(frames),
                 "-c:v", "libx264", "-preset", "medium", "-crf", "20", str(dest)])
            made.append(dest)
        return made

    def join(clip_files, dest, crf):
        if len(clip_files) == 1:
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(clip_files[0]), "-c", "copy", str(dest)])
            return
        inputs, chain, last = [], [], "[0:v]"
        for f in clip_files:
            inputs += ["-i", str(f)]
        for i in range(1, len(clip_files)):
            offset = plan[i]["start"]
            label = f"[v{i}]"
            chain.append(f"{last}[{i}:v]xfade=transition=fade:duration={FADE}:offset={offset:.3f}{label}")
            last = label
        run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(chain), "-map", last,
             "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p", "-r", str(FPS), str(dest)])

    # 5. The voice track: each take placed at its shot's speaking time, then loudness evened out.
    audio = tmp / "voice.m4a"
    takes = [(p["take"], p["speak"]) for p in plan if p["take"]]
    if takes:
        inputs, parts = [], []
        for n, (f, at) in enumerate(takes):
            inputs += ["-i", str(f)]
            parts.append(f"[{n}:a]adelay={int(at * 1000)}:all=1[a{n}]")
        mix = "".join(f"[a{n}]" for n in range(len(takes)))
        run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex",
             ";".join(parts) + f";{mix}amix=inputs={len(takes)}:normalize=0,apad=whole_dur={total:.3f},loudnorm=I=-16:TP=-1.5:LRA=11[a]",
             "-map", "[a]", "-t", f"{total:.3f}", "-c:a", "aac", "-b:a", "96k", "-ar", "44100", "-ac", "1", str(audio)])
    else:
        run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", f"{total:.3f}",
             "-c:a", "aac", "-b:a", "48k", str(audio)])

    # 6. The app copy: no burned captions.
    silent_video = tmp / "app.mp4"
    join(clips(1, "app"), silent_video, 23)
    app = out / f"{name}.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(silent_video), "-i", str(audio), "-c:v", "copy", "-c:a", "copy",
         "-shortest", "-movflags", "+faststart", str(app)])

    # 7. Poster.
    poster = plan[max(0, int(story.get("poster", 1)) - 1)]["img"]
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(poster), "-vf",
         f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}", "-q:v", "3", str(out / f"{name}.jpg")])

    # 8. The social cut: 1080 x 1920 with each caption laid over its time.
    scale = 1.5
    social_silent = tmp / "social.mp4"
    join(clips(scale, "soc"), social_silent, 20)
    inputs, chain, last = ["-i", str(social_silent)], [], "[0:v]"
    for n, c in enumerate(cues, 1):
        png = tmp / f"cap-{n:03d}.png"
        caption_png(c["text"], lang, png, scale)
        inputs += ["-i", str(png)]
        label = f"[c{n}]"
        chain.append(f"{last}[{n}:v]overlay=0:0:enable='between(t,{c['start']:.3f},{c['end']:.3f})'{label}")
        last = label
    run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-i", str(audio), "-filter_complex", ";".join(chain), "-map", last,
         "-map", f"{len(cues) + 1}:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
         "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(out / f"{name}.social.mp4")])

    (out / f"{name}.timing.json").write_text(json.dumps({
        "id": story["id"], "lang": lang, "durationSec": round(total, 2), "voiced": len(takes), "shots": [
            {"n": i + 1, "start": round(p["start"], 3), "len": round(p["len"], 3), "voice": round(p["voice"], 3)} for i, p in enumerate(plan)],
        "cues": [{"start": round(c["start"], 3), "end": round(c["end"], 3), "text": c["text"]} for c in cues]}, ensure_ascii=False, indent=1))
    mb = app.stat().st_size / 1e6
    print(f"{name} [{lang}]: {total:.1f} s, {len(plan)} shots, {len(cues)} caption lines, app copy {mb:.1f} MB"
          + ("  (over 5 MB: use fewer or simpler pictures)" if mb > 5 else ""))
    print(f"  → {out}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Assemble an illustrated story video from pictures and a script.")
    ap.add_argument("folder")
    ap.add_argument("--lang", action="append", help="en or hi; give it twice for both. Default: every language in story.json")
    ap.add_argument("--no-voice", action="store_true", help="don't call Fish Audio; shots without a take stay silent")
    a = ap.parse_args()
    folder = Path(a.folder).resolve()
    if not (folder / "story.json").is_file():
        sys.exit(f"No story.json in {folder}")
    langs = a.lang or [l for l in ("en", "hi") if json.loads((folder / "story.json").read_text())["shots"][0].get(l)]
    for lang in langs:
        build(folder, lang, a.no_voice)
