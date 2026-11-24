#!/usr/bin/env python3
"""endcard: make the closing picture for a story folder: a shot, dimmed, with the Aspiran mark, name and source line.

    python3 content/tools/story/endcard.py <story folder>

For each shot with "endcard": "<base picture>", writes shots/<img> per language as shots/<img stem>.<lang>.png and,
because build-story.py reads one picture per shot, the language-free shots/<img> as the English one. Run build-story
with --lang hi after copying the .hi.png over it (build.sh does this). Text drawn by macOS so Devanagari joins properly.
"""
import json, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

W, H = 1080, 1920


def text_png(lines, dest):
    """lines: [(text, size, (r,g,b,a), font name or None, gap_after)], centred, starting at 62% of the height."""
    import AppKit, Foundation
    rep = AppKit.NSBitmapImageRep.alloc().initWithBitmapDataPlanes_pixelsWide_pixelsHigh_bitsPerSample_samplesPerPixel_hasAlpha_isPlanar_colorSpaceName_bytesPerRow_bitsPerPixel_(
        None, W, H, 8, 4, True, False, AppKit.NSDeviceRGBColorSpace, 0, 0)
    ctx = AppKit.NSGraphicsContext.graphicsContextWithBitmapImageRep_(rep)
    AppKit.NSGraphicsContext.saveGraphicsState(); AppKit.NSGraphicsContext.setCurrentContext_(ctx)
    para = AppKit.NSMutableParagraphStyle.alloc().init(); para.setAlignment_(AppKit.NSTextAlignmentCenter)
    top = H * 0.60
    for text, size, rgba, fname, gap in lines:
        font = (AppKit.NSFont.fontWithName_size_(fname, size) if fname else None) or AppKit.NSFont.systemFontOfSize_weight_(size, 0.3)
        col = AppKit.NSColor.colorWithCalibratedRed_green_blue_alpha_(*[c / 255 for c in rgba[:3]], rgba[3] / 255)
        s = AppKit.NSAttributedString.alloc().initWithString_attributes_(text, {
            AppKit.NSFontAttributeName: font, AppKit.NSForegroundColorAttributeName: col, AppKit.NSParagraphStyleAttributeName: para})
        box = s.boundingRectWithSize_options_(Foundation.NSMakeSize(W * 0.84, H), AppKit.NSStringDrawingUsesLineFragmentOrigin)
        th = box.size.height
        s.drawWithRect_options_(Foundation.NSMakeRect(W * 0.08, H - top - th, W * 0.84, th), AppKit.NSStringDrawingUsesLineFragmentOrigin)
        top += th + gap
    AppKit.NSGraphicsContext.restoreGraphicsState()
    rep.representationUsingType_properties_(AppKit.NSBitmapImageFileTypePNG, None).writeToFile_atomically_(str(dest), False)


def kulhad(size):
    """The Aspiran cup mark (artefacts/brand/aspiran-kulhad.svg), drawn at size x size."""
    k = size / 40
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for x in (14, 20, 26):   # steam
        d.line([(x * k, 3 * k), ((x - 1.5) * k, 6 * k), (x * k, 9 * k)], fill="#D9822B", width=max(2, int(2 * k)), joint="curve")
    d.polygon([(5 * k, 15 * k), (35 * k, 15 * k), (30.5 * k, 37 * k), (9.5 * k, 37 * k)], fill="#C8693A")
    d.rounded_rectangle([4 * k, 13 * k, 36 * k, 17.5 * k], radius=2.2 * k, fill="#E08A55")
    for x in (14, 22.8):
        d.rounded_rectangle([x * k, 22 * k, (x + 3.2) * k, 27 * k], radius=1.6 * k, fill="#2A1B12")
    return im


def card(base, source, lang, dest, tmp):
    im = Image.open(base).convert("RGB")
    im = im.resize((W, int(im.height * W / im.width))).crop((0, 0, W, H)) if im.height * W / im.width >= H else im.resize((W, H))
    im = ImageEnhance.Brightness(im.filter(ImageFilter.GaussianBlur(6))).enhance(0.45)
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shade)
    for y in range(int(H * 0.45), H):   # darker toward the bottom so the text reads
        sd.line([(0, y), (W, y)], fill=(12, 8, 20, int(150 * (y - H * 0.45) / (H * 0.55))))
    im = Image.alpha_composite(im.convert("RGBA"), shade)
    m = kulhad(150); im.alpha_composite(m, ((W - 150) // 2, int(H * 0.60) - 190))
    tp = Path(tempfile.mkdtemp()) / f"endtext-{lang}.png"   # macOS writes via a temp file; keep it in TMPDIR
    text_png([("Aspiran", 96, (255, 244, 230, 255), "Georgia-Bold", 18),
              ("aspiran.in", 40, (240, 200, 170, 255), None, 70),
              (source, 34 if lang == "en" else 36, (235, 225, 240, 230), "KohinoorDevanagari-Regular" if lang == "hi" else None, 0)], tp)
    im.alpha_composite(Image.open(tp).convert("RGBA"))
    im.convert("RGB").save(dest)


if __name__ == "__main__":
    folder = Path(sys.argv[1]).resolve(); story = json.loads((folder / "story.json").read_text())
    for s in story["shots"]:
        if "endcard" not in s: continue
        stem = Path(s["img"]).stem
        for lang in ("en", "hi"):
            dest = folder / "shots" / f"{stem}.{lang}.png"
            card(folder / "shots" / s["endcard"], story["endcard"][lang], lang, dest, folder / "shots")
            print("wrote", dest)
