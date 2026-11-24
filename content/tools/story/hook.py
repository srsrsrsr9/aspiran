"""hook: the opening line of a wisdom short, shown without a voice.

Used by build-story.py for a shot marked "hook": true. The old line (Sanskrit, Tamil, Pali…) appears word by word over
the picture: each word fades in with a soft gold bloom that settles into a gentle glow; when the line is complete, the
whole line glows once and the transliteration fades in below. Sound: a low drone and a soft swell under the shot, a
quiet chime per word, and a bell when the line is complete. All sound is made here (sine tones and filtered noise),
so there is nothing to license. Nothing flashes or shakes; the bloom is a slow fade.
"""
import subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageFilter

LEAD = 0.7        # picture alone before the first word
STEP = 0.6        # between words
HOLD = 2.2        # the whole line on screen after the last word
FADE_IN = 0.4

FONTS = {"Devanagari": "KohinoorDevanagari-Semibold", "Tamil": "TamilSangamMN-Bold", "Latin": "Georgia-Italic"}


def length(lines):
    n = sum(len(l.split()) for l in lines)
    return LEAD + STEP * (n - 1) + FADE_IN + HOLD


def word_times(lines, lead=LEAD):
    t, out = lead, []
    for l in lines:
        for _ in l.split():
            out.append(t); t += STEP
    return out


def _script(text):
    for ch in text:
        if "஀" <= ch <= "௿": return "Tamil"
        if "ऀ" <= ch <= "ॿ": return "Devanagari"
    return "Latin"


def _draw(lines, show, W, H, size, top, fontname, rgba=(255, 248, 235, 255)):
    """All lines laid out as one centred block; only words whose index is in `show` are visible, so every layer lines up."""
    import AppKit, Foundation
    rep = AppKit.NSBitmapImageRep.alloc().initWithBitmapDataPlanes_pixelsWide_pixelsHigh_bitsPerSample_samplesPerPixel_hasAlpha_isPlanar_colorSpaceName_bytesPerRow_bitsPerPixel_(
        None, W, H, 8, 4, True, False, AppKit.NSDeviceRGBColorSpace, 0, 0)
    ctx = AppKit.NSGraphicsContext.graphicsContextWithBitmapImageRep_(rep)
    AppKit.NSGraphicsContext.saveGraphicsState(); AppKit.NSGraphicsContext.setCurrentContext_(ctx)
    font = AppKit.NSFont.fontWithName_size_(fontname, size) or AppKit.NSFont.boldSystemFontOfSize_(size)
    para = AppKit.NSMutableParagraphStyle.alloc().init(); para.setAlignment_(AppKit.NSTextAlignmentCenter)
    para.setLineSpacing_(size * 0.35)
    on = AppKit.NSColor.colorWithCalibratedRed_green_blue_alpha_(*[c / 255 for c in rgba[:3]], rgba[3] / 255)
    off = AppKit.NSColor.clearColor()
    s = AppKit.NSMutableAttributedString.alloc().init()
    i = 0
    for li, line in enumerate(lines):
        for wi, w in enumerate(line.split()):
            if wi: s.appendAttributedString_(AppKit.NSAttributedString.alloc().initWithString_attributes_(" ", {AppKit.NSFontAttributeName: font}))
            s.appendAttributedString_(AppKit.NSAttributedString.alloc().initWithString_attributes_(w, {
                AppKit.NSFontAttributeName: font, AppKit.NSForegroundColorAttributeName: on if i in show else off}))
            i += 1
        if li < len(lines) - 1:
            s.appendAttributedString_(AppKit.NSAttributedString.alloc().initWithString_attributes_("\n", {AppKit.NSFontAttributeName: font}))
    s.addAttribute_value_range_(AppKit.NSParagraphStyleAttributeName, para, Foundation.NSMakeRange(0, s.length()))
    box = s.boundingRectWithSize_options_(Foundation.NSMakeSize(W * 0.9, H), AppKit.NSStringDrawingUsesLineFragmentOrigin)
    th = box.size.height
    s.drawWithRect_options_(Foundation.NSMakeRect(W * 0.05, H - top - th, W * 0.9, th), AppKit.NSStringDrawingUsesLineFragmentOrigin)
    AppKit.NSGraphicsContext.restoreGraphicsState()
    p = Path(tempfile.mkdtemp()) / "t.png"
    rep.representationUsingType_properties_(AppKit.NSBitmapImageFileTypePNG, None).writeToFile_atomically_(str(p), False)
    return Image.open(p).convert("RGBA"), th, box.size.width


def _fit(lines, W, H, base, fontname):
    size = base
    while size > 20:
        _, th, tw = _draw(lines, set(), W, H, size, H * 0.25, fontname)
        widest = max(_draw([l], set(), W, H, size, 0, fontname)[2] for l in lines)
        if widest <= W * 0.86: return size, th
        size -= 2
    return size, th


def _glow(img, radius, color, strength):
    a = img.split()[3].filter(ImageFilter.GaussianBlur(radius))
    a = a.point(lambda v: min(255, int(v * strength)))
    g = Image.new("RGBA", img.size, color + (0,)); g.putalpha(a)
    return g


def layers(lines, translit, W, H, scale, tmp, tag):
    """Writes the PNG layers for one hook at one size. Returns [(png, kind, word_index or None)]."""
    fontname = FONTS[_script(" ".join(lines))]
    size, th = _fit(lines, W, H, int(70 * scale), fontname)
    top = H * 0.24
    n = sum(len(l.split()) for l in lines)
    out = []
    for i in range(n):
        txt, _, _ = _draw(lines, {i}, W, H, size, top, fontname)
        shadow = _glow(txt, 8 * scale, (16, 6, 28), 2.6)                 # keeps the words legible on a bright sky
        steady = _glow(txt, 16 * scale, (255, 180, 90), 2.0)             # the glow that stays
        word = Image.alpha_composite(Image.alpha_composite(shadow, steady), txt)
        bloom = _glow(txt, 34 * scale, (255, 206, 130), 4.5)              # the soft bloom that fades away
        for kind, im in (("word", word), ("bloom", bloom)):
            f = tmp / f"{tag}-{kind}-{i:02d}.png"; im.save(f); out.append((f, kind, i))
    # a soft dark haze behind the block, so the line stands out on any sky
    from PIL import ImageDraw
    haze = Image.new("L", (W, H), 0); d = ImageDraw.Draw(haze)
    d.ellipse([W * -0.1, top - 60 * scale, W * 1.1, top + th + (110 if translit else 60) * scale], fill=150)
    haze = haze.filter(ImageFilter.GaussianBlur(50 * scale))
    hz = Image.new("RGBA", (W, H), (18, 8, 32, 0)); hz.putalpha(haze)
    f = tmp / f"{tag}-haze.png"; hz.save(f); out.insert(0, (f, "haze", None))
    full, _, _ = _draw(lines, set(range(n)), W, H, size, top, fontname)
    f = tmp / f"{tag}-line.png"; _glow(full, 36 * scale, (255, 226, 170), 2.2).save(f); out.append((f, "line", None))
    if translit:
        tsize = int(32 * scale)
        t, _, _ = _draw(translit if isinstance(translit, list) else [translit], set(range(999)),
                        W, H, tsize, top + th + 34 * scale, FONTS["Latin"], (245, 230, 255, 235))
        t = Image.alpha_composite(_glow(t, 5 * scale, (20, 10, 30), 1.5), t)
        f = tmp / f"{tag}-translit.png"; t.save(f); out.append((f, "translit", None))
    return out


def overlay(base_clip, p, W, H, scale, fps, tmp, tag, dest, lead):
    """Lays the hook layers over the already-moving picture clip."""
    lay = layers(p["lines"], p.get("translit"), W, H, scale, tmp, tag)
    times = word_times(p["lines"], lead)
    done = times[-1] + FADE_IN
    inputs, chain, last = ["-i", str(base_clip)], [], "[0:v]"
    for n, (f, kind, i) in enumerate(lay, 1):
        inputs += ["-loop", "1", "-t", f"{p['len']:.3f}", "-i", str(f)]
        if kind == "haze":
            fx = f"fade=in:st=0:d={max(0.3, lead):.3f}:alpha=1"
        elif kind == "word":
            fx = f"fade=in:st={times[i]:.3f}:d={FADE_IN}:alpha=1"
        elif kind == "bloom":
            fx = f"fade=in:st={times[i]:.3f}:d=0.25:alpha=1,fade=out:st={times[i] + 0.3:.3f}:d=0.9:alpha=1"
        elif kind == "line":
            fx = f"fade=in:st={done:.3f}:d=0.5:alpha=1,fade=out:st={done + 0.6:.3f}:d=1.2:alpha=1"
        else:
            fx = f"fade=in:st={done + 0.3:.3f}:d=0.6:alpha=1"
        chain.append(f"[{n}:v]format=rgba,{fx}[l{n}]")
        chain.append(f"{last}[l{n}]overlay=0:0:shortest=1[o{n}]")
        last = f"[o{n}]"
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(chain), "-map", last,
                        "-r", str(fps), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", str(dest)],
                       capture_output=True, text=True)
    if r.returncode: sys.exit("hook overlay failed: " + r.stderr[-800:])


def sfx(p, tmp, tag, lead):
    """The hook's sound as one WAV, starting at the shot's start: drone + swell, a chime per word, a bell at the end."""
    L = p["len"] + 1.2   # the drone tails off into the next shot
    times = word_times(p["lines"], lead)
    done = times[-1] + FADE_IN
    ins = [
        # drone: a low fifth with a slow breath, faded in and out
        f"sine=f=110:d={L}", f"sine=f=165:d={L}", f"sine=f=220:d={L}",
        # swell: soft filtered noise rising under the first second
        f"anoisesrc=c=pink:d=1.6:a=0.5",
        # bell at the end: a few inharmonic partials
        "sine=f=523:d=3.5", "sine=f=1443:d=3.5", "sine=f=2826:d=3.5",
    ]
    fl = [
        f"[0:a][1:a][2:a]amix=inputs=3:normalize=0,volume=0.05,tremolo=f=0.25:d=0.3,afade=t=in:d=0.8,afade=t=out:st={L - 1.6:.2f}:d=1.6[drone]",
        f"[3:a]lowpass=f=900,volume=0.25,afade=t=in:d=1.0,afade=t=out:st=1.0:d=0.6[swell]",
        f"[4:a]volume=0.5[b1];[5:a]volume=0.16[b2];[6:a]volume=0.06[b3];[b1][b2][b3]amix=inputs=3:normalize=0,"
        f"afade=t=out:st=0.02:d=3.4:curve=exp,volume=0.35,adelay={int(done * 1000)}:all=1[bell]",
    ]
    parts = ["[drone]", "[swell]", "[bell]"]
    for k, t in enumerate(times):   # a soft chime per word, alternating two notes
        f = 1318 if k % 2 == 0 else 1568
        ins += [f"sine=f={f}:d=0.9", f"sine=f={f * 2.01:.0f}:d=0.9"]
        a, b = 7 + 2 * k, 8 + 2 * k
        fl.append(f"[{a}:a]volume=0.5[c{k}a];[{b}:a]volume=0.12[c{k}b];[c{k}a][c{k}b]amix=inputs=2:normalize=0,"
                  f"afade=t=in:d=0.01,afade=t=out:st=0.02:d=0.85:curve=exp,volume=0.12,adelay={int(t * 1000)}:all=1[ch{k}]")
        parts.append(f"[ch{k}]")
    fl.append("".join(parts) + f"amix=inputs={len(parts)}:normalize=0,volume=4.2,apad=whole_dur={L},atrim=0:{L}[out]")
    args = []
    for s in ins: args += ["-f", "lavfi", "-i", s]
    dest = tmp / f"{tag}-sfx.wav"
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args, "-filter_complex", ";".join(fl), "-map", "[out]",
                        "-ar", "44100", "-ac", "1", str(dest)], capture_output=True, text=True)
    if r.returncode: sys.exit("hook sound failed: " + r.stderr[-800:])
    return dest
