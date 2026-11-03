"""DECLARATIVE ENGINE: renders a video from a spec's `scenes` list. No code editing needed.
Formats: cards | kinetic | whiteboard.   Scene types: title, statement, list, compare, stat, chain, quiz.
CLI:  EP_DIR=build/ep10 SPEC=specs/ep10.spec.json FONT_DIR=fonts python declarative.py [stills t1 t2 ..|poster|sfx|video]
Scenes cover sentences by index: {"sent":[first,last], "type":..., ...}; the first scene starts at 0, each next scene starts when its first sentence starts.
Anchors ("at": "phrase") must be substrings of a caption segment inside the scene's sentence range; the item appears when that phrase is spoken.
"""
import os, sys, json, math, subprocess
from functools import lru_cache
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
OW, OH = 720, 1280
FPS = 30
EP_DIR = os.environ["EP_DIR"]; FONT_DIR = os.environ.get("FONT_DIR", "fonts")
SPEC = json.load(open(os.environ["SPEC"]))
TIM = json.load(open(f"{EP_DIR}/timing.json")); SEN = TIM["sentences"]; TOTAL = TIM["total"]
FMT = SPEC["format"]; TONE = SPEC["tone"]; TB = 0.55
# palette (shared with the hand-built engines)
BG = (255, 249, 243); INK = (28, 28, 34); MID = (150, 140, 132); GREY = (224, 217, 211)
TEAL = (23, 107, 112); TEAL_L = (212, 237, 234); BROWN = (139, 74, 0); PEACH = (255, 220, 192); SER = (234, 222, 210)
BLUE = (35, 92, 200); GREEN = (18, 140, 92); ORANGE = (238, 128, 28); RED = (218, 48, 48); WOOD = (255, 232, 190); YEL = (255, 226, 64)
BGD = (15, 14, 18); BASE = (205, 199, 190); WHITE = (255, 252, 246); DIM = (112, 106, 102); AMB = (255, 186, 73); PANEL = (32, 30, 36)


@lru_cache(None)
def F(name, size):
    return ImageFont.truetype(f"{FONT_DIR}/{name}.ttf", size)


def clamp(x):
    return max(0.0, min(1.0, x))


def ease(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def rv(t, t0, dur=0.4):
    return ease((t - t0) / dur)


def mix(c, a, bg=BG):
    return tuple(int(round(bg[k] + (c[k] - bg[k]) * a)) for k in range(3))


def wrap(s, font, maxw):
    lines, cur = [], ""
    for w in s.split():
        t = (cur + " " + w).strip()
        if font.getlength(t) <= maxw:
            cur = t
        else:
            lines.append(cur); cur = w
    return lines + ([cur] if cur else [])


def text(d, xy, s, font, fill, track=0, anchor="l"):
    x, y = xy
    w = sum(font.getlength(ch) + track for ch in s) - track if track else font.getlength(s)
    x = x - w / 2 if anchor == "m" else (x - w if anchor == "r" else x)
    if not track:
        d.text((x, y), s, font=font, fill=fill, anchor="ls"); return
    for ch in s:
        d.text((x, y), ch, font=font, fill=fill, anchor="ls"); x += font.getlength(ch) + track


@lru_cache(None)
def sent_text(i):
    return " ".join(g["show"] for g in SEN[i]["segs"])


def when(a, b, sub):
    for i in range(a, b + 1):
        for g in SEN[i]["segs"]:
            if sub in g["show"]:
                return g["start"] + (g["show"].index(sub) / len(g["show"])) * (g["end"] - g["start"])
    return SEN[a]["start"] + 0.5


# ---------------- geometry ----------------
_seed = [0]


def smooth_noise(n, seed, amp):
    rs = np.random.RandomState(seed); ph = rs.rand(3) * 6.28
    i = np.arange(n)
    return amp * (np.sin(i * 0.07 + ph[0]) + 0.6 * np.sin(i * 0.19 + ph[1]) + 0.3 * np.sin(i * 0.41 + ph[2])) / 1.9


def resample(pts, step=9):
    pts = np.array(pts, float); out = [pts[0]]
    for a, b in zip(pts[:-1], pts[1:]):
        L = float(np.hypot(*(b - a))); n = max(1, int(L // step))
        for i in range(1, n + 1):
            out.append(a + (b - a) * i / n)
    return np.array(out)


def hand(pts, amp=1.7):
    _seed[0] += 1
    p = resample(pts); n = len(p)
    nx = smooth_noise(n, _seed[0] * 2, amp); ny = smooth_noise(n, _seed[0] * 2 + 1, amp)
    return [(float(x + dx), float(y + dy)) for (x, y), dx, dy in zip(p, nx, ny)]


def bez(p0, p1, p2, p3, n=22):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        out.append((u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]))
    return out


def arcp(cx, cy, rx, ry, a0, a1, n=36):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def wavep(x0, x1, y, amp, wl, ph=0.0):
    n = max(2, int((x1 - x0) / 8))
    return [(x0 + (x1 - x0) * i / n, y + amp * math.sin(2 * math.pi * (x0 + (x1 - x0) * i / n) / wl + ph)) for i in range(n + 1)]


def rectp(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)]


# ---------------- elements ----------------
class Stroke:
    layer = 1

    def __init__(s, pts, col, w, t0, dur, amp=1.7):
        s.pts = hand(pts, amp); s.col = col; s.w = w; s.t0 = t0; s.dur = max(0.05, dur)
        a = np.array(s.pts); seg = np.hypot(*(a[1:] - a[:-1]).T)
        s.cum = np.concatenate([[0], np.cumsum(seg)]); s.total = float(s.cum[-1])

    def sub(s, t):
        p = clamp((t - s.t0) / s.dur); L = p * s.total
        k = int(np.searchsorted(s.cum, L, side="right"))
        pts = s.pts[:k]
        if k < len(s.pts) and k >= 1:
            a = s.pts[k - 1]; b = s.pts[k]; seg = s.cum[k] - s.cum[k - 1]
            f = (L - s.cum[k - 1]) / seg if seg > 0 else 0
            pts = pts + [(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)]
        return pts

    def draw(s, img, d, t):
        if t < s.t0:
            return
        pts = s.sub(t)
        if len(pts) < 2:
            return
        d.line(pts, fill=s.col, width=s.w, joint="curve")
        r = s.w / 2
        for q in (pts[0], pts[-1]):
            d.ellipse((q[0] - r, q[1] - r, q[0] + r, q[1] + r), fill=s.col)

    def tip(s, t):
        pts = s.sub(t)
        return pts[-1] if pts else None


@lru_cache(None)
def text_surf(string, fname, size, col):
    f = F(fname, size)
    w = int(f.getlength(string)) + 44; h = int(size * 1.7)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((22, int(size * 1.2)), string, font=f, fill=col + (255,), anchor="ls")
    return im


class Txt:
    layer = 1

    def __init__(s, string, fname, size, col, x, y, t0, dur, anchor="l", rot=0.0):
        s.col = col; s.t0 = t0; s.dur = max(0.05, dur); s.size = size
        im = text_surf(string, fname, size, col)
        s.tw = int(F(fname, size).getlength(string))
        if anchor == "m":
            x = x - s.tw / 2
        elif anchor == "r":
            x = x - s.tw
        s.ox, s.oy = x - 22, y - size * 1.2
        s.rot = rot
        if rot:
            cx, cy = s.ox + im.width / 2, s.oy + im.height / 2
            s.im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
            s.ox, s.oy = cx - s.im.width / 2, cy - s.im.height / 2
        else:
            s.im = im
        s.base = (x, y)

    def draw(s, img, d, t):
        if t < s.t0:
            return
        p = clamp((t - s.t0) / s.dur)
        w = int(s.im.width * p)
        if w < 2:
            return
        crop = s.im.crop((0, 0, w, s.im.height))
        img.paste(crop.convert("RGB"), (int(s.ox), int(s.oy)), crop.split()[3])

    def tip(s, t):
        p = clamp((t - s.t0) / s.dur)
        return (s.ox + 22 + s.tw * p, s.base[1] - s.size * 0.25)


class Fill:
    layer = 0

    def __init__(s, poly, col, alpha, t0, dur=0.6):
        s.poly = poly; s.col = col; s.alpha = alpha; s.t0 = t0; s.dur = dur

    def draw(s, ov, t):
        p = clamp((t - s.t0) / s.dur)
        if p > 0:
            ImageDraw.Draw(ov).polygon(s.poly, fill=s.col + (int(255 * s.alpha * p),))

    def tip(s, t):
        return None


class Hl:
    layer = 0

    def __init__(s, box, col, t0, dur=0.6, alpha=0.6):
        s.box = box; s.col = col; s.t0 = t0; s.dur = dur; s.alpha = alpha

    def draw(s, ov, t):
        p = ease((t - s.t0) / s.dur)
        if p > 0:
            x0, y0, x1, y1 = s.box
            ImageDraw.Draw(ov).rounded_rectangle((x0, y0, x0 + (x1 - x0) * p, y1), 10, fill=s.col + (int(255 * s.alpha),))

    def tip(s, t):
        return None


def seq(paths, col, w, t0, dur, amp=1.7):
    """Draw several point-lists one after another; durations proportional to length."""
    lens = [float(np.sum(np.hypot(*(np.diff(np.array(p, float), axis=0)).T))) + 1 for p in paths]
    tot = sum(lens); out = []; t = t0
    for p, L in zip(paths, lens):
        dd = dur * L / tot
        out.append(Stroke(p, col, w, t, dd, amp)); t += dd
    return out



def draw_pen(img, d, E, t):
    cur = None
    for e in E:
        if e.layer == 1 and e.t0 <= t < e.t0 + e.dur + 0.12:
            if cur is None or e.t0 >= cur.t0:
                cur = e
    if cur is None:
        return
    tp = cur.tip(min(t, cur.t0 + cur.dur))
    if not tp:
        return
    col = cur.col
    ux, uy = 0.56, -0.83; vx, vy = 0.83, 0.56
    x, y = tp
    cone = [(x, y), (x + ux * 34 + vx * 10, y + uy * 34 + vy * 10), (x + ux * 34 - vx * 10, y + uy * 34 - vy * 10)]
    body = [(x + ux * 34 + vx * 13, y + uy * 34 + vy * 13), (x + ux * 190 + vx * 13, y + uy * 190 + vy * 13),
            (x + ux * 190 - vx * 13, y + uy * 190 - vy * 13), (x + ux * 34 - vx * 13, y + uy * 34 - vy * 13)]
    d.polygon(body, fill=col, outline=INK)
    d.polygon(cone, fill=(235, 235, 235), outline=INK)
    cap = [(x + ux * 190 + vx * 13, y + uy * 190 + vy * 13), (x + ux * 215 + vx * 11, y + uy * 215 + vy * 11),
           (x + ux * 215 - vx * 11, y + uy * 215 - vy * 11), (x + ux * 190 - vx * 13, y + uy * 190 - vy * 13)]
    d.polygon(cap, fill=(60, 60, 66), outline=INK)



def wiper(img, new, band):
    out = img.copy()
    bx = int(band)
    if bx > 0:
        out.paste(new.crop((0, 0, min(bx, W), H)), (0, 0))
    d = ImageDraw.Draw(out)
    for k in range(6):
        a = 40 - k * 6
        d.rectangle((bx - 30 - k * 28, 0, bx - 30 - k * 28 + 28, H), fill=None)
    d.rounded_rectangle((bx - 6, -20, bx + 150, H + 20), 30, fill=(214, 206, 188), outline=(150, 140, 120), width=5)
    d.rounded_rectangle((bx - 24, -20, bx - 2, H + 20), 8, fill=(70, 70, 76))
    return out




# ---------------- scene model ----------------
def build_scenes():
    L = SPEC["scenes"]; out = []
    for k, s in enumerate(L):
        a, b = s["sent"]
        t0 = 0.0 if k == 0 else SEN[a]["start"]
        t1 = TOTAL if k == len(L) - 1 else SEN[L[k + 1]["sent"][0]]["start"]
        c = dict(s); c.update(a=a, b=b, t0=t0, t1=t1, k=k); out.append(c)
    return out


SC = build_scenes()
NS = len(SC)


def scene_at(t):
    return max([c["k"] for c in SC if c["t0"] <= t] or [0])


def items(c):
    return c.get("items") or c.get("steps") or []


def norm(it):
    return (it, None) if isinstance(it, str) else (it.get("text", ""), it.get("at"))


def at(c, it, i):
    a = it.get("at") if isinstance(it, dict) else None
    if a:
        return max(c["t0"] + 0.3, when(c["a"], c["b"], a) - 0.1)
    return c["t0"] + 0.9 + i * 0.8


def heads(c, font="Merri700", size=96, maxw=900):
    if c.get("lines"):
        return list(c["lines"])
    return wrap(c.get("heading", ""), F(font, size), maxw)[:3] if c.get("heading") else []


def circ(cx, cy, r, n=28):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n + 1)]


ICONS = {
    "doc": [[(20, 8), (62, 8), (80, 26), (80, 92), (20, 92), (20, 8)], [(62, 8), (62, 26), (80, 26)], [(32, 48), (68, 48)], [(32, 64), (68, 64)], [(32, 80), (56, 80)]],
    "scale": [[(50, 12), (50, 86)], [(18, 26), (82, 26)], [(18, 26), (8, 54)], [(18, 26), (30, 54)], [(6, 54), (32, 54)], [(82, 26), (70, 54)], [(82, 26), (92, 54)], [(68, 54), (94, 54)], [(34, 88), (66, 88)]],
    "building": [[(8, 34), (50, 10), (92, 34), (8, 34)], [(14, 86), (86, 86)], [(24, 40), (24, 80)], [(42, 40), (42, 80)], [(58, 40), (58, 80)], [(76, 40), (76, 80)]],
    "coin": [circ(50, 50, 40), circ(50, 50, 28), [(50, 34), (50, 66)]],
    "drop": [[(50, 8), (72, 46), (76, 64), (66, 82), (50, 90), (34, 82), (24, 64), (28, 46), (50, 8)]],
    "pin": [[(50, 92), (28, 56), (24, 38), (34, 18), (50, 10), (66, 18), (76, 38), (72, 56), (50, 92)], circ(50, 38, 10, 16)],
}


def icon_strokes(name, cx, cy, size, col, w, t0, dur, amp=1.2):
    paths = [[(cx + (x - 50) * size / 100, cy + (y - 50) * size / 100) for x, y in p] for p in ICONS.get(name, ICONS["doc"])]
    return seq(paths, col, w, t0, dur, amp)


def fit(c, ts, dur, lead=0.1):
    """Clamp an animation so it finishes before its scene ends."""
    ts = min(max(ts, c["t0"] + lead), c["t1"] - 0.35)
    return ts, min(dur, max(0.2, c["t1"] - 0.1 - ts))


def arrow(d, p0, p1, col, width=6, head=22):
    x0, y0 = p0; x1, y1 = p1
    L = math.hypot(x1 - x0, y1 - y0) or 1; ux, uy = (x1 - x0) / L, (y1 - y0) / L
    d.line((x0, y0, x1 - ux * head * 0.6, y1 - uy * head * 0.6), fill=col, width=width)
    px, py = -uy, ux
    d.polygon([(x1, y1), (x1 - ux * head + px * head * 0.6, y1 - uy * head + py * head * 0.6), (x1 - ux * head - px * head * 0.6, y1 - uy * head - py * head * 0.6)], fill=col)


# =====================================================================
# STYLE 1: CARDS
# =====================================================================
CK = {"LIGHT": BROWN, "NEUTRAL": TEAL, "SERIOUS": INK}
CB = {"LIGHT": PEACH, "NEUTRAL": TEAL_L, "SERIOUS": SER}
FILLS = [TEAL_L, PEACH, SER, (244, 238, 231)]
DEFK = {"title": None, "statement": "THE POINT", "list": "KEY POINTS", "compare": "SIDE BY SIDE", "stat": "BY THE NUMBERS", "chain": "STEP BY STEP", "quiz": "YOUR TURN"}


def rr(d, box, fill, a, bw=5, r=40, bg=BG):
    d.rounded_rectangle(box, r, fill=mix(fill, a, bg) if fill else None, outline=mix(INK, a, bg), width=bw)


def cards_scene(c, t):
    typ = c["type"]; kc = CK[TONE]; img = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(img)
    k = c.get("kicker", f"EPISODE {SPEC['n']}" if typ == "title" else DEFK.get(typ))
    if k:
        text(d, (90, 288), k.upper(), F("Sans700", 40), kc, track=7)
    if typ == "quiz":
        Q = SPEC["quiz"]; lines = wrap(Q["q"], F("Merri700", 66), 900); a = rv(t, c["t0"] + 0.3)
        for i, ln in enumerate(lines):
            text(d, (90, 392 + i * 84), ln, F("Merri700", 66), mix(INK, a))
        y0 = 392 + len(lines) * 84 + 70
        for i, o in enumerate(Q["options"]):
            a = rv(t, c["t0"] + 1.0 + i * 0.35); y = y0 + i * 150 + (1 - a) * 20
            d.rounded_rectangle((90, y, 990, y + 110), 55, fill=BG, outline=mix(INK, a), width=4)
            text(d, (140, y + 72), "ABCD"[i], F("Sans700", 44), mix(BROWN, a))
            f = F("Sans600", 40) if all(F("Sans600", 40).getlength(x) <= 760 for x in Q["options"]) else F("Sans600", 32)
            text(d, (210, y + 70), o, f, mix(INK, a))
        return img
    lines = heads(c); a0 = rv(t, c["t0"] + 0.25)
    hs = next((z for z in (96, 88, 80, 72, 64, 56) if not lines or max(F("Merri700", z).getlength(l) for l in lines) <= 900), 56)
    y = 400
    for ln in lines:
        text(d, (90, y), ln, F("Merri700", hs), mix(INK, a0)); y += int(hs * 1.1)
    yb = y + 60 if lines else 400
    if typ == "title":
        d.rounded_rectangle((90, 860, 997, 1487), 52, fill=CB[TONE])
        d.rectangle((93, 886, 994, 1460), fill=BG)
        d.rounded_rectangle((90, 860, 997, 1487), 52, outline=INK, width=5)
        for s in c.setdefault("_ic", icon_strokes(c.get("icon", "doc"), 543, 1173, 380, kc, 8, c["t0"] + 0.6, 1.6, 0.8)):
            s.draw(img, d, t)
    elif typ == "statement":
        sub = c.get("sub")
        if sub:
            a = rv(t, c["t0"] + 1.0)
            for i, ln in enumerate(wrap(sub, F("Sans400", 52), 880)[:4]):
                text(d, (90, yb + 20 + i * 70), ln, F("Sans400", 52), mix((90, 80, 74), a))
    elif typ in ("list", "chain"):
        its = items(c)
        for i, it in enumerate(its):
            txt, _ = norm(it); a = rv(t, at(c, it, i)); y = yb + i * 190
            rr(d, (90, y, 990, y + 140), FILLS[i % 4], a)
            ls = wrap(txt, F("Merri700", 44), 800)[:2]
            for j, ln in enumerate(ls):
                text(d, (140, y + (86 if len(ls) == 1 else 62) + j * 50), ln, F("Merri700", 44), mix(INK, a))
            if typ == "chain" and i > 0:
                arrow(d, (540, y - 44), (540, y - 6), mix(INK, a), 6, 18)
    elif typ == "compare":
        for j, (p, fill, col) in enumerate(((c["left"], TEAL_L, TEAL), (c["right"], PEACH, BROWN))):
            x0 = 90 + j * 465; a = rv(t, at(c, p, j))
            rr(d, (x0, yb, x0 + 435, yb + 560), fill, a)
            text(d, (x0 + 36, yb + 80), p["label"].upper(), F("Sans700", 32), mix(col, a), track=4)
            for i, ln in enumerate(wrap(p["text"], F("Merri700", 46), 360)[:6]):
                text(d, (x0 + 36, yb + 160 + i * 62), ln, F("Merri700", 46), mix(INK, a))
    elif typ == "stat":
        a = rv(t, at(c, c, 0)); yb = max(yb, 560)
        text(d, (540, yb + 300), str(c["value"]), F("Merri900", 230), mix(kc, a), anchor="m")
        if c.get("label"):
            text(d, (540, yb + 400), c["label"], F("Sans600", 50), mix(INK, a), anchor="m")
        for i, ln in enumerate(wrap(c.get("sub", ""), F("Sans400", 46), 860)[:3]):
            text(d, (540, yb + 480 + i * 62), ln, F("Sans400", 46), mix((90, 80, 74), rv(t, at(c, c, 0) + 0.8)), anchor="m")
    return img


def progress_bar(img, t):
    d = ImageDraw.Draw(img); x0, x1, gap, y = 70, 1010, 12, 70; segw = (x1 - x0 - gap * (NS - 1)) / NS
    for i, c in enumerate(SC):
        xa = x0 + i * (segw + gap); d.rounded_rectangle((xa, y, xa + segw, y + 10), 5, fill=GREY)
        fr = 1.0 if i < scene_at(t) else (clamp((t - c["t0"]) / (c["t1"] - c["t0"])) if i == scene_at(t) else 0)
        if fr > 0.02:
            d.rounded_rectangle((xa, y, xa + max(10, segw * fr), y + 10), 5, fill=INK)


def cards_frame(t, cam=True):
    k = scene_at(t); c = SC[k]; img = cards_scene(c, t)
    a = ease((t - c["t0"]) / 0.35) if k > 0 else 1.0
    if a < 1.0:
        img = Image.blend(Image.new("RGB", (W, H), BG), img, a)
    progress_bar(img, t)
    return img


# =====================================================================
# STYLE 2: KINETIC DARK
# =====================================================================
def kin_bg():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H * 0.42) / (H * 0.62)) ** 2)
    k = np.clip(1.0 - r, 0, 1)[..., None]
    lo = np.array((9, 8, 11), np.float32); hi = np.array((26, 23, 30), np.float32)
    return Image.fromarray((lo + (hi - lo) * k).astype(np.uint8), "RGB")


KBG = kin_bg() if FMT == "kinetic" else None


def cw(w):
    return w.strip(".,:;?!\"'()").lower()


def size_for(n, cap):
    return min(cap, 150 if n <= 3 else (118 if n <= 6 else (96 if n <= 9 else 84)))


@lru_cache(None)
def kin_layout(si, cap, emph, warn):
    s = SEN[si]; words = []; y = 400
    for g in s["segs"]:
        ws = g["show"].split(); size = size_for(len(ws), cap); fname = "Merri900" if size >= 118 else "Merri700"
        font = F(fname, size); lh = int(size * 1.2); sp = font.getlength(" "); lines, cur, cw_ = [], [], 0
        for w in ws:
            wl = font.getlength(w)
            if cur and cw_ + sp + wl > 900:
                lines.append(cur); cur = [w]; cw_ = wl
            else:
                cw_ += (sp if cur else 0) + wl; cur.append(w)
        lines.append(cur)
        wt = [len(cw(w)) + 2 for w in ws]; tot = sum(wt); acc = 0; times = []
        for x in wt:
            times.append(g["start"] + acc / tot * (g["end"] - g["start"]) * 0.97); acc += x
        i = 0
        for line in lines:
            x = 90
            for w in line:
                wl = font.getlength(w)
                col = RED if cw(w) in warn else (AMB if cw(w) in emph else None)
                words.append(dict(w=w, x=x, yb=y + int(size * 0.92), size=size, font=fname, t=times[i], col=col))
                x += wl + sp; i += 1
            y += lh
        y += int(size * 0.22)
    return words, y


def kin_sets(c):
    sp = lambda L: tuple(sorted({cw(w) for p in L for w in p.split()}))
    return sp(c.get("emph", [])), sp(c.get("warn", []))


def kin_plan(c):
    """Pick a type size so text + visuals fit; returns (cap, visual_top)."""
    e, w = kin_sets(c); vis = c["type"] != "title" and c["type"] != "statement"
    limit = 1120 if vis else 1500
    for cap in (150, 118, 96, 84, 72, 64):
        b = max(kin_layout(i, cap, e, w)[1] for i in range(c["a"], c["b"] + 1))
        if b <= limit:
            return cap, max(1000, b + 50)
    return 64, max(1000, b + 50)


@lru_cache(2048)
def word_surf(w, size, fname, col):
    f = F(fname, size); im = Image.new("RGBA", (int(f.getlength(w)) + 40, int(size * 1.5)), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((20, int(size * 1.1)), w, font=f, fill=col + (255,), anchor="ls"); return im


def kin_text(img, d, si, c, t):
    cap, _ = kin_plan(c); e, wn = kin_sets(c)
    for w in kin_layout(si, cap, e, wn)[0]:
        age = t - w["t"]
        if age < 0:
            continue
        col = w["col"] or (WHITE if age < 0.3 else BASE); pop = ease(age / 0.2); font = F(w["font"], w["size"])
        if pop >= 1:
            d.text((w["x"], w["yb"]), w["w"], font=font, fill=col, anchor="ls")
        else:
            s = 1.18 - 0.18 * pop; im = word_surf(w["w"], w["size"], w["font"], col)
            nw, nh = max(1, int(im.width * s)), max(1, int(im.height * s)); im2 = im.resize((nw, nh), Image.BILINEAR)
            a = im2.split()[3].point(lambda v: int(v * pop))
            cx = w["x"] - 20 + im.width / 2; cy = w["yb"] - w["size"] * 1.1 + im.height / 2 + (1 - pop) * 14
            img.paste(im2.convert("RGB"), (int(cx - nw / 2), int(cy - nh / 2)), a)


def kin_vis(img, d, c, t, vy):
    typ = c["type"]; mb = lambda col, a: mix(col, a, BGD)
    if typ == "quiz":
        t0 = c["t0"]
        for i, o in enumerate(SPEC["quiz"]["options"]):
            p = ease((t - (t0 + 1.4 + i * 0.3)) / 0.35)
            if p <= 0.01:
                continue
            y = vy + i * 150
            d.rounded_rectangle((90, y, 90 + max(130, int(900 * p)), y + 120), 24, fill=PANEL); d.rounded_rectangle((90, y, 220, y + 120), 24, fill=AMB)
            d.text((155, y + 62), "ABCD"[i], font=F("Sans700", 54), fill=BGD, anchor="mm")
            if p > 0.7:
                f = F("Sans600", 44) if all(F("Sans600", 44).getlength(x) <= 680 for x in SPEC["quiz"]["options"]) else F("Sans600", 34)
                d.text((260, y + 64), o, font=f, fill=mb(WHITE, (p - 0.7) / 0.3), anchor="lm")
    elif typ in ("list", "chain"):
        for i, it in enumerate(items(c)):
            txt, _ = norm(it); p = ease((t - at(c, it, i)) / 0.4)
            if p <= 0.01:
                continue
            y = vy + i * 145
            d.rounded_rectangle((90, y, 90 + max(40, int(900 * p)), y + 112), 22, fill=PANEL); d.rounded_rectangle((90, y, 112, y + 112), 8, fill=AMB)
            if p > 0.6:
                f = F("Sans600", 42) if F("Sans600", 42).getlength(txt) <= 800 else F("Sans600", 34)
                d.text((150, y + 58), txt, font=f, fill=mb(WHITE, (p - 0.6) / 0.4), anchor="lm")
            if typ == "chain" and i > 0:
                d.polygon([(100, y - 26), (124, y - 26), (112, y - 8)], fill=mb(AMB, p))
    elif typ == "compare":
        for j, p_ in enumerate((c["left"], c["right"])):
            x0 = 90 + j * 465; p = ease((t - at(c, p_, j)) / 0.4)
            if p <= 0.01:
                continue
            d.rounded_rectangle((x0, vy, x0 + 435, vy + 420), 26, fill=mb(PANEL, p), outline=mb(AMB if j == 0 else WHITE, p), width=3)
            d.text((x0 + 34, vy + 60), p_["label"].upper(), font=F("Sans700", 30), fill=mb(AMB if j == 0 else WHITE, p), anchor="ls")
            for i, ln in enumerate(wrap(p_["text"], F("Merri700", 42), 360)[:5]):
                d.text((x0 + 34, vy + 130 + i * 58), ln, font=F("Merri700", 42), fill=mb(WHITE, p), anchor="ls")
    elif typ == "stat":
        t0 = at(c, c, 0); p = ease((t - t0) / 0.9); v = str(c["value"])
        num = "".join(ch for ch in v if ch.isdigit() or ch == "."); pre = v[: v.find(num[0])] if num else ""; suf = v[v.find(num[0]) + len(num):] if num else ""
        shown = v
        if num:
            val = float(num) * p; shown = pre + (f"{val:.1f}" if "." in num else f"{int(round(val))}") + suf
        d.text((540, vy + 170), shown, font=F("Merri900", 200), fill=mb(AMB, clamp(p * 3)), anchor="mm")
        if c.get("label"):
            d.text((540, vy + 320), c["label"], font=F("Sans600", 46), fill=mb(WHITE, rv(t, t0 + 0.6, 0.4), ), anchor="mm")
    elif typ == "title":
        for s in c.setdefault("_ic", icon_strokes(c.get("icon", "doc"), 540, vy + 160, 340, AMB, 7, c["t0"] + 1.2, 1.6, 0.8)):
            s.draw(img, d, t)


def kin_frame(t, cam=True):
    k = scene_at(t); c = SC[k]
    si = max([i for i in range(c["a"], c["b"] + 1) if SEN[i]["start"] <= t] or [c["a"]])
    content = KBG.copy(); d = ImageDraw.Draw(content)
    tag = c.get("kicker") or ("YOUR TURN" if c["type"] == "quiz" else SPEC["id"].replace("-", " "))
    x = 90
    for ch in tag.upper():
        d.text((x, 200), ch, font=F("Sans700", 34), fill=AMB, anchor="ls"); x += F("Sans700", 34).getlength(ch) + 7
    if t >= SEN[0]["start"] - 0.05:
        kin_text(content, d, si, c, t); kin_vis(content, d, c, t, kin_plan(c)[1] if c["type"] != "quiz" else min(1100, max(900, kin_plan(c)[1] + 20)))
    nxt = SEN[si + 1]["start"] if si + 1 < len(SEN) else None
    if nxt and t > nxt - 0.18 and si == c["b"] and k + 1 < NS:
        content = Image.blend(content, KBG, ease((t - (nxt - 0.18)) / 0.18))
    img = content; d = ImageDraw.Draw(img)
    for s0 in [x["t0"] - 0.04 for x in SC[1:]]:
        p = (t - s0) / 0.34
        if 0 <= p <= 1:
            y = -110 + ease(p) * (H + 220); d.rectangle((0, y, W, y + 100), fill=AMB); d.rectangle((0, y - 40, W, y), fill=mix(AMB, 0.25, BGD))
    d.line((90, 1832, 990, 1832), fill=(48, 45, 52), width=4); d.line((90, 1832, 90 + 900 * min(1, t / TOTAL), 1832), fill=AMB, width=4)
    d.text((90, 1884), f"EP {SPEC['n']}", font=F("Sans700", 26), fill=DIM, anchor="ls")
    if not cam:
        return img
    z = 1.0 + 0.05 * (t / TOTAL); cx = W / 2 + 10 * math.sin(t * 0.35); cy = H / 2 + 8 * math.cos(t * 0.28)
    hw, hh = W / (2 * z), H / (2 * z); cx = min(max(cx, hw), W - hw); cy = min(max(cy, hh), H - hh)
    return img.resize((OW, OH), Image.LANCZOS, box=(cx - hw, cy - hh, cx + hw, cy + hh))


# =====================================================================
# STYLE 3: WHITEBOARD
# =====================================================================
def build_paper():
    rs = np.random.RandomState(5)
    low = Image.fromarray((rs.rand(24, 14) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    arr = np.asarray(low, np.float32) / 255
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); r = ((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2
    shade = (0.988 + 0.022 * arr) * (1 - 0.04 * np.clip(r - 0.45, 0, 1))
    return Image.fromarray(np.clip(np.array((252, 250, 244), np.float32)[None, None, :] * shade[..., None], 0, 255).astype(np.uint8))


PAPER = build_paper() if FMT == "whiteboard" else None
ACC = [BLUE, GREEN, ORANGE]


def wb_build(c):
    E = []; typ = c["type"]; acc = ACC[c["k"] % 3]; t0 = c["t0"] + (TB if c["k"] > 0 else 0.1)

    def S(pts, col, w, ts, dur, amp=1.7):
        ts, dur = fit(c, max(ts, t0), dur); E.append(Stroke(pts, col, w, ts, dur, amp))

    def Sq(paths, col, w, ts, dur, amp=1.7):
        lens = [float(np.sum(np.hypot(*(np.diff(np.array(p, float), axis=0)).T))) + 1 for p in paths]; tot = sum(lens); tt = ts
        for p, L in zip(paths, lens):
            S(p, col, w, tt, dur * L / tot, amp); tt += dur * L / tot

    def T(s, fname, size, col, x, y, ts, dur, anchor="l"):
        ts, dur = fit(c, max(ts, t0), dur); E.append(Txt(s, fname, size, col, x, y, ts, dur, anchor))

    def P(s, fname, size, col, x, y, ts, maxw, lh, anchor="l", maxl=3):
        for i, ln in enumerate(wrap(s, F(fname, size), maxw)[:maxl]):
            T(ln, fname, size, col, x, y + i * lh, ts + i * 0.45, 0.6, anchor)

    def box(x0, y0, x1, y1, ts, fill=True):
        if fill:
            ts2, d2 = fit(c, max(ts, t0), 0.4); E.append(Fill([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], WOOD, 0.8, ts2, d2))
        S(rectp(x0, y0, x1, y1), INK, 6, ts, 0.5)

    if typ == "quiz":
        kq = max(0.35, min(1.0, (c["t1"] - 1.0 - t0) / 3.9))  # finish all options >= 1 s before the end
        T("Your turn!", "Caveat700", 140, ORANGE, 90, 330, t0 + 0.1, 0.9 * kq)
        qs = wrap(SPEC["quiz"]["q"], F("Patrick400", 64), 900)[:3]
        for i, ln in enumerate(qs):
            T(ln, "Patrick400", 64, INK, 90, 470 + i * 80, t0 + (1.0 + i * 0.4) * kq, 0.5 * kq)
        y0 = 470 + len(qs) * 80 + 90
        for i, o in enumerate(SPEC["quiz"]["options"]):
            y = y0 + i * 175; ts = t0 + (1.9 + i * 0.4) * kq
            S(rectp(90, y, 990, y + 130), INK, 6, ts, 0.35 * kq)
            T("ABCD"[i], "Caveat700", 96, BLUE, 150, y + 96, ts + 0.25 * kq, 0.25 * kq, "m")
            T(o, "Patrick400", 54 if all(F("Patrick400", 54).getlength(x) <= 700 for x in SPEC["quiz"]["options"]) else 42, INK, 240, y + 86, ts + 0.3 * kq, 0.5 * kq)
        return E
    ls = c.get("lines") or wrap(c.get("heading", ""), F("Caveat700", 140), 900)[:3]
    hz = next((z for z in (140, 120, 104, 90, 76) if all(F("Caveat700", z).getlength(l) <= 900 for l in ls)), 76)
    n = len(ls); hy = 330
    for i, ln in enumerate(ls):
        T(ln, "Caveat700", hz, INK if i else acc, 90, hy + i * hz, t0 + 0.1 + i * 0.8, 0.8)
    yb = hy + max(n - 1, 0) * hz + 130 if n else 330
    if n:
        S(wavep(95, 95 + min(800, int(F("Caveat700", hz).getlength(ls[-1]))), hy + (n - 1) * hz + 36, 5, 90), acc, 8, t0 + 0.1 + n * 0.8, 0.5)
    if typ == "title":
        Sq(ICONS[c.get("icon", "doc")] and [[(540 + (x - 50) * 5.2, 1180 + (y - 50) * 5.2) for x, y in p] for p in ICONS.get(c.get("icon", "doc"), ICONS["doc"])], acc, 8, t0 + 0.9, 2.0, 1.4)
    elif typ == "statement" and c.get("sub"):
        P(c["sub"], "Patrick400", 54, (90, 80, 74), 90, yb + 40, t0 + 1.2, 900, 72, maxl=4)
    elif typ in ("list", "chain"):
        for i, it in enumerate(items(c)):
            txt, _ = norm(it); ts = at(c, it, i); y = yb + 40 + i * 200
            box(90, y, 990, y + 150, ts)
            if typ == "list":
                S([(130, y + 78), (152, y + 104), (190, y + 52)], GREEN, 9, ts + 0.3, 0.3)
            P(txt, "Patrick400", 50, INK, 230 if typ == "list" else 140, y + (92 if F("Patrick400", 50).getlength(txt) <= 700 else 68), ts + 0.4, 700 if typ == "list" else 800, 54, maxl=2)
            if typ == "chain" and i > 0:
                S([(540, y - 48), (540, y - 6)], INK, 7, ts - 0.2, 0.25); S([(520, y - 24), (540, y - 6), (560, y - 24)], INK, 7, ts, 0.2)
    elif typ == "compare":
        for j, p in enumerate((c["left"], c["right"])):
            x0 = 90 + j * 465; ts = at(c, p, j); col = BLUE if j == 0 else GREEN
            box(x0, yb + 20, x0 + 435, yb + 600, ts)
            lz = next((z for z in (70, 58, 48, 40) if F("Caveat700", z).getlength(p["label"]) <= 375), 40)
            T(p["label"], "Caveat700", lz, col, x0 + 30, yb + 110, ts + 0.3, 0.5)
            P(p["text"], "Patrick400", 46, INK, x0 + 30, yb + 190, ts + 0.6, 380, 60, maxl=6)
    elif typ == "stat":
        ts = at(c, c, 0); yb = max(yb, 560)
        T(str(c["value"]), "Caveat700", 300, acc, 540, yb + 330, ts, 0.9, "m")
        S(circ(540, yb + 250, 250, 36), acc, 7, ts + 0.9, 0.7, 2.2)
        if c.get("label"):
            T(c["label"], "Patrick400", 58, INK, 540, yb + 520, ts + 1.0, 0.7, "m")
        P(c.get("sub", ""), "Patrick400", 46, (90, 80, 74), 540, yb + 600, ts + 1.5, 860, 60, "m", 3)
    return E


@lru_cache(None)
def wb_els(k):
    return wb_build(SC[k])


def wb_scene(k, t):
    E = wb_els(k); img = PAPER.copy()
    if any(x.layer == 0 and t >= x.t0 for x in E):
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        for x in E:
            if x.layer == 0:
                x.draw(ov, t)
        img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
    d = ImageDraw.Draw(img)
    for x in E:
        if x.layer == 1:
            x.draw(img, d, t)
    draw_pen(img, d, E, t)
    return img


def wb_frame(t, cam=True):
    k = scene_at(t); c = SC[k]
    if k > 0 and t < c["t0"] + TB:
        img = wiper(wb_scene(k - 1, c["t0"] - 0.001), wb_scene(k, t), -170 + ease((t - c["t0"]) / TB) * (W + 340))
    else:
        img = wb_scene(k, t)
    d = ImageDraw.Draw(img); n = int(860 * clamp(t / TOTAL))
    d.line([(90 + i, 1838 + 5 * math.sin(i / 38.0)) for i in range(0, 861, 6)], fill=(222, 218, 210), width=6)
    if n > 6:
        d.line([(90 + i, 1838 + 5 * math.sin(i / 38.0)) for i in range(0, n, 6)], fill=BLUE, width=6, joint="curve")
    d.text((90, 1890), f"EP {SPEC['n']}", font=F("Patrick400", 32), fill=(128, 126, 128), anchor="ls")
    return img


# ---------------- dispatch ----------------
FRAME = {"cards": cards_frame, "kinetic": kin_frame, "whiteboard": wb_frame}[FMT]
ACT = sorted([(e.t0, e.t0 + e.dur) for k in range(NS) for e in wb_els(k) if e.layer == 1]) if FMT == "whiteboard" else []
SCN = [(c["t0"], c["t1"]) for c in SC] if FMT != "cards" else []


def render(i):
    im = FRAME(i / FPS)
    return (im if im.size == (OW, OH) else im.resize((OW, OH), Image.LANCZOS)).tobytes()


def sfx_mix(src, dst):
    import soundfile as sf
    y, sr = sf.read(src); y = y.astype(np.float32); rs = np.random.RandomState(11)

    def add(t0, s):
        i0 = int(t0 * sr)
        if 0 <= i0 < len(y):
            n = min(len(s), len(y) - i0); y[i0:i0 + n] += s[:n]
    merged = []
    for a, b in ACT:
        if merged and a <= merged[-1][1] + 0.05:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    for a, b in merged:
        n = int((b - a) * sr)
        if n < 200:
            continue
        x = rs.randn(n); x = x - np.convolve(x, np.ones(40) / 40, "same"); x = np.convolve(x, np.ones(5) / 5, "same")
        tt = np.arange(n) / sr
        env = (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * (3.2 + rs.rand()) * tt))) * np.minimum(1, np.minimum(tt / 0.03, (b - a - tt) / 0.03))
        add(a, (x * env * 0.05).astype(np.float32))
    for s0, _ in SCN[1:]:
        n = int(sr * 0.5); tt = np.arange(n) / sr
        x = np.convolve(rs.randn(n), np.ones(30) / 30, "same")
        add(s0 - 0.02, (x * np.sin(np.pi * tt / 0.5) ** 2 * 0.5).astype(np.float32))
    sf.write(dst, y, sr)




if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "video"
    if mode == "stills":
        for k, tt in enumerate(map(float, sys.argv[2:])):
            FRAME(tt, cam=False).resize((540, 960), Image.LANCZOS).save(f"{EP_DIR}/still_{k}.png")
    elif mode == "sfx":
        sfx_mix(f"{EP_DIR}/vo.wav", f"{EP_DIR}/vo_sfx.wav")
    elif mode == "poster":
        FRAME(SC[0]["t1"] - 0.3, cam=False).save(f"{EP_DIR}/poster.jpg", quality=92)
    else:
        n = int(math.ceil(TOTAL * FPS))
        cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}", "-r", str(FPS), "-i", "-",
               "-i", f"{EP_DIR}/vo_norm.wav", "-t", f"{TOTAL:.3f}", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-profile:v", "high",
               "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "1", f"{EP_DIR}/video.mp4"]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        with Pool() as pool:
            for b in pool.imap(render, range(n), chunksize=6):
                p.stdin.write(b)
        p.stdin.close(); p.wait(); print("done", n)
