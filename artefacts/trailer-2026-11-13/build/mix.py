#!/usr/bin/env python3
"""Composes the score (original, synthesised here: the ElevenLabs music endpoint is not available on the free plan),
places voice and effects on the shared timeline, ducks the music under every line, and writes _work/mix.wav.

Usage: python3 build/mix.py            (needs numpy, scipy and ffmpeg; no network)
Scene times are derived from build/timeline.json exactly as scenes/film.js derives them.
"""
import json, os, subprocess
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
TL = json.load(open(f"{HERE}/build/timeline.json"))
at, end, TOTAL = TL["at"], TL["end"], TL["total"]
N = int(TOTAL * SR) + SR
LINES = {l["id"]: l for l in TL["lines"]}

def wt(lid, w):
    import re
    for x in LINES[lid]["words"]:
        if re.sub(r"[^\w]", "", x["w"].lower()).startswith(w.lower()): return x["t0"]
    return LINES[lid]["t0"]

# scene boundaries (same as film.js)
A1 = end["c02"] + 1.05; B0 = A1; B1 = at["n03"] - .55; C1 = at["c05"] - .05; D1 = at["j04"] - .35
E11 = at["c06"] - .25; E21 = at["n05"] - .2; E31 = at["j06"] - .2; E41 = at["c07"] - .25; E51 = at["n08"] - .2
E61 = at["n09"] - .25; F0 = E61; F1 = at["j09"] - .3; G0 = F1; G1 = at["n12"] - .25; H0 = G1; H1 = end["n12"] + .3
I0 = H1; I1 = at["c08"] - .15; J0 = I1; J1 = at["n14"] - .3; E40 = E31; E50 = E41; E30 = E21

def load(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"])
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()

def place(buf, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR));
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    if n <= 0: return
    g = np.array([gain * min(1, 1 - pan), gain * min(1, 1 + pan)], dtype=np.float32)
    buf[i:i + n] += x[:n] * g

# ------------------------------------------------------------------ instruments
rng = np.random.default_rng(7)
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def env_adsr(n, a, r, sus=1.0):
    e = np.ones(n) * sus; na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, sus, na); e[-nr:] *= np.linspace(1, 0, nr); return e

def pad(notes, t0, t1, amp=.08, a=1.2, r=1.5, bright=8):
    n = int((t1 - t0 + r) * SR); t = np.arange(n) / SR; out = np.zeros((n, 2), np.float32)
    for k, m in enumerate(notes):
        for d, pan in ((-.06, -.5), (.06, .5), (0, 0)):
            f = hz(m) * 2 ** (d / 12 * .25); ph = rng.random() * 6; s = np.zeros(n)
            for h in range(1, bright + 1): s += np.sin(2 * np.pi * f * h * t * (1 + .002 * np.sin(2 * np.pi * .3 * t)) + ph * h) / h ** 1.4
            out[:, 0] += s * (1 - pan) * .5; out[:, 1] += s * (1 + pan) * .5
    e = env_adsr(n, a, r) * amp / len(notes); out *= e[:, None]; return out, t0

def piano(m, t0, amp=.2, dur=2.5, pan=0):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m); s = np.zeros(n)
    for h in range(1, 9): s += np.sin(2 * np.pi * f * h * (1 + .0004 * h * h) * t) * np.exp(-t * (1.2 + h * .9)) / h ** 1.3
    s *= np.minimum(1, t / .004); s += np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 30) * .3
    out = np.stack([s * (1 - pan), s * (1 + pan)], 1) * amp; return out.astype(np.float32), t0

def pluck(m, t0, amp=.2, pan=0, decay=7):
    n = int(.6 * SR); t = np.arange(n) / SR; f = hz(m); s = np.zeros(n)
    for h in range(1, 7): s += np.sin(2 * np.pi * f * h * t) * np.exp(-t * decay * (1 + h * .5)) / h
    s *= np.minimum(1, t / .002); return (np.stack([s * (1 - pan), s * (1 + pan)], 1) * amp).astype(np.float32), t0

def string(m, t0, t1, amp=.12, pan=0):
    n = int((t1 - t0 + .8) * SR); t = np.arange(n) / SR; f = hz(m); vib = 1 + .004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / .8)
    s = np.zeros(n); ph = 2 * np.pi * f * np.cumsum(vib) / SR
    for h in range(1, 12): s += np.sin(ph * h) / h * (.9 ** h)
    e = env_adsr(n, .35, .8); return (np.stack([s * (1 - pan), s * (1 + pan)], 1) * (e * amp)[:, None]).astype(np.float32), t0

def drum(t0, amp=.6, f0=110, f1=42, dec=5, noise=.15):
    n = int(1.2 * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t * 18); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec)
    nz = rng.standard_normal(n) * np.exp(-t * 40) * noise; sos = butter(2, 900, "lp", fs=SR, output="sos"); s += sosfilt(sos, nz)
    return (np.stack([s, s], 1) * amp).astype(np.float32), t0

def hat(t0, amp=.05, pan=.3):
    n = int(.08 * SR); t = np.arange(n) / SR; s = rng.standard_normal(n) * np.exp(-t * 70); sos = butter(2, 7000, "hp", fs=SR, output="sos"); s = sosfilt(sos, s)
    return (np.stack([s * (1 - pan), s * (1 + pan)], 1) * amp).astype(np.float32), t0

def riser(t0, t1, amp=.12):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; p = t / (t1 - t0); s = rng.standard_normal(n)
    out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        fc = 300 + 6000 * p[i] ** 2; sos = butter(2, [fc * .7, min(fc * 1.3, 20000)], "bp", fs=SR, output="sos"); out[i:i + seg] = sosfilt(sos, s[i:i + seg])
    tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (p * 2.5)) / SR) * .35
    s = (out + tone) * p ** 2 * amp; return np.stack([s, s], 1).astype(np.float32), t0

music = np.zeros((N, 2), np.float32)
def M(x_t, gain=1.0):
    x, t = x_t; place(music, x, t, gain)

# ------------------------------------------------------------------ the score (D minor, lifting to F major)
Dm, Bb, F, C, Gm, Am = [50, 57, 62, 65], [46, 53, 58, 62], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 58, 62], [45, 57, 60, 64]
# A. cold open: felt piano motif over a low pad; a two-note "ba-dum" on the page-number joke
M(pad([38, 50, 57], .3, A1 - .2, amp=.07, a=2.0, r=.6))
motif = [74, 72, 69, 67, 69, 65]
for i, m in enumerate(motif): M(piano(m, .9 + i * .62, amp=.13, pan=.2 * (-1) ** i))
pj = wt("c02", "page")
M(pluck(57, pj + .55, amp=.22)); M(pluck(50, pj + .78, amp=.25))
# B. montage: a busy staccato ostinato at 132 bpm that piles up, then is sucked away at B1
beat = 60 / 132 / 2; t = B0; k = 0
seq = [62, 65, 69, 65, 62, 65, 70, 65, 60, 64, 67, 64, 62, 65, 69, 72]
while t < B1 - .55:
    quiet = .45 if at["c04"] - .1 < t < end["c04"] else 1
    M(pluck(seq[k % 16], t, amp=(.15 + .06 * (t - B0) / (B1 - B0)) * quiet, pan=.3 * (-1) ** k, decay=10))
    if k % 2 == 0: M(hat(t, amp=.04 + .03 * (t - B0) / (B1 - B0)))
    if k % 4 == 0: M(drum(t, amp=.32, f0=90, f1=50, dec=8, noise=.05))
    if k % 8 == 0: M(pluck(seq[k % 16] - 24, t, amp=.25, decay=4))
    t += beat; k += 1
# C. the leak: a dark low drone, then warm strings when Jeetu speaks
M(pad([26, 38, 45], B1 + .3, at["j01"] - .2, amp=.07, a=2.5, r=1.2, bright=4))
M(pad([75, 76], at["n04"], wt("n04", "gone") + 1.5, amp=.015, a=2, r=1, bright=2))
M(string(46, at["j01"] - .2, end["j01"] + 1.2, amp=.07, pan=-.2)); M(string(53, at["j01"] + .3, end["j01"] + 1.2, amp=.05, pan=.2)); M(string(62, wt("j01", "forgetting") - .3, end["j01"] + 1.2, amp=.04))
# D. Jeetu's entrance: a warm cello-like phrase in F
for m, a0, d in [(53, end["c05"] - .3, 1.0), (57, end["c05"] + .7, .6), (60, end["c05"] + 1.3, 1.2)]: M(string(m - 12, a0, a0 + d, amp=.1))
M(pad(F, end["c05"], D1 + .4, amp=.06, a=1.2, r=.8))
M(pluck(64, wt("c05", "act"), amp=.15)); M(pluck(62, wt("c05", "act") + .18, amp=.15))
# E. the method: a pulse at 100 bpm that grows layer by layer, chords Dm Bb F C
b = 60 / 100; prog = [Dm, Bb, F, C]; t = D1; k = 0
while t < F0 - .1:
    bar = int((t - D1) / (4 * b)); ch = prog[bar % 4]; layer = min(3, int((t - D1) / ((F0 - D1) / 4)))
    if k % 4 == 0: M(pad(ch, t, t + 4 * b, amp=.05 + .01 * layer, a=.4, r=.6))
    M(piano(ch[(k * 2) % 4] + 12, t, amp=.06 + .015 * layer, dur=1.2, pan=.3 * (-1) ** k))
    if layer >= 1: M(piano(ch[(k * 2 + 1) % 4] + 12, t + b / 2, amp=.045 + .01 * layer, dur=1, pan=-.3 * (-1) ** k))
    if k % 2 == 0: M(drum(t, amp=.22 + .06 * layer, f0=100, f1=45, dec=6, noise=.08))
    if layer >= 2: M(hat(t + b / 2, amp=.035))
    t += b; k += 1
# F. the garden: big swell, then the lift to F major with shimmer arpeggios and drums
M(pad([34, 46, 53, 58, 62], F0, end["n09"] + .2, amp=.08, a=2.5, r=.6))
ls = end["n09"] + .05
for i, ch in enumerate([Bb, F, C, F]):
    t0 = ls + i * (F1 - ls) / 4; M(pad([c + 12 for c in ch] + [ch[0] - 12], t0, t0 + (F1 - ls) / 4 + .2, amp=.11, a=.3, r=.5))
    M(drum(t0, amp=.6, f0=80, f1=38, dec=3, noise=.2))
    for j in range(8): M(piano(ch[j % 4] + 24 + (12 if j > 3 else 0), t0 + j * (F1 - ls) / 32, amp=.07, dur=1.5, pan=.5 * np.sin(j)))
M(riser(F0 + .5, ls, amp=.08))
# G. March: hush, a gentle F major and three bell notes on "Federalism. Seventh Schedule. Three lists."
M(pad([41, 53, 57, 60, 65], G0, G1 + .5, amp=.06, a=.8, r=1))
for i, w in enumerate(["federalism", "seventh", "three"]): M(piano([77, 81, 84][i], wt("h03", w) + .1, amp=.1, dur=3))
# H. the thought: pulse returns and builds to the hit (stop just before it)
t = H0; k = 0
while t < H1 - .25:
    p = (t - H0) / (H1 - H0); ch = [Dm, Bb, F, C][int(p * 4) % 4]
    if k % 4 == 0: M(pad(ch, t, min(t + 4 * b, H1 - .2), amp=.07 + .05 * p, a=.2, r=.15))
    M(drum(t, amp=.25 + .35 * p, f0=100, f1=42, dec=6)); M(piano(ch[k % 4] + 12, t, amp=.06 + .05 * p, dur=.8))
    t += b / (1 + (p > .6)); k += 1
M(riser(H1 - 4.0, H1 - .05, amp=.16))
# I. title: a huge low chord under the hit
M(pad([26, 38, 45, 50, 53, 57], I0, I1 + .5, amp=.14, a=.02, r=1.2, bright=10)); M(drum(I0, amp=1.0, f0=70, f1=30, dec=1.5, noise=.4))
# J. button: light plucks, and a sting after "I AM the chai"
for i, m in enumerate([65, 69, 72, 69, 65, 67, 69, 67]): M(pluck(m, J0 + .5 + i * .55, amp=.07, pan=.4 * (-1) ** i))
M(pluck(62, end["c09"] + .1, amp=.18)); M(pluck(57, end["c09"] + .32, amp=.2)); M(pluck(50, end["c09"] + .52, amp=.26, decay=3))
# K. end card: the opening motif returns, resolved in F major, and a long final chord
for i, m in enumerate([72, 69, 65, 67, 69, 77]): M(piano(m, J1 + .2 + i * .5, amp=.12, dur=3))
M(pad([41, 53, 57, 60, 65, 69], J1, TOTAL - .2, amp=.09, a=.6, r=2.4))

# reverb on the score
ir_n = int(2.6 * SR); tt = np.arange(ir_n) / SR
ir = np.stack([rng.standard_normal(ir_n) * np.exp(-tt / .7), rng.standard_normal(ir_n) * np.exp(-tt / .7)], 1); ir /= np.abs(ir).sum(0) / 6
wet = np.stack([fftconvolve(music[:, c], ir[:, c])[:N] for c in range(2)], 1).astype(np.float32)
music = music * .8 + wet * .35
# hard stops where the edit cuts the music (the suck into March; the beat before the hit)
def gate(t0, t1, fade=.08):
    i0, i1 = int(t0 * SR), int(t1 * SR); f = int(fade * SR)
    music[i0:i0 + f] *= np.linspace(1, 0, f)[:, None]; music[i0 + f:i1] = 0
gate(B1 - .05, B1 + .25); gate(H1 - .2, H1 - .01, .05)

# ------------------------------------------------------------------ voice
vo = np.zeros((N, 2), np.float32)
pans = {"C": .12, "J": -.1, "H": -.05, "N": 0}
for l in TL["lines"]:
    x = load(f"{HERE}/_work/vo/{l['id']}.wav"); place(vo, x, l["t0"], 1.0, pans[l["spk"]])

# ------------------------------------------------------------------ effects (cue sheet)
fx = np.zeros((N, 2), np.float32)
tSec, tRe, tHi = wt("j06", "second") - .4, wt("j06", "rewrite") - .1, at["n06"] - .2
CUES = [("lamp", .35, .8), ("highlight", .75, .35), ("highlight", 2.4, .3), ("whoosh", pj - .12, .4), ("boing", pj + .1, .45),
        ("thud", B0 + .27, .9), ("thud", B0 + .72, .9), ("thud", B0 + 1.17, 1.0), ("buzz", B0 + 1.2, .6), ("ding", B0 + 1.6, .45),
        ("ding", at["c04"] - .95, .45), ("buzz", end["c04"] + .1, .6), ("suck", B1 - 1.5, .8),
        ("drone", at["n03"] - .1, .8), ("page", at["n04"] - .3, .5), ("dust", wt("n04", "gone") - .3, .7), ("whoosh", at["j01"] - 1.2, .3),
        ("door", at["c05"] + .2, .7), ("glint", end["c05"] + 1.3, .55), ("tumbler", end["c05"] + 1.9, .4), ("whoosh2", D1 - .25, .6),
        ("flip", wt("j04", "look") - .05, .6), ("whoosh", E11 - .1, .35), ("stamp", wt("j05", "ish") - .15, .6)]
CUES += [("bloom", E30 + .1 + 3.6 * r, .45) for r in (.18, .42, .78)]
CUES += [("pen", E40 + .1, .5), ("tick", wt("j06", "mark"), .6), ("whoosh", tSec, .35), ("pen", tRe + .3, .45), ("flip", tHi, .6),
         ("pour", E50 - .1, .6), ("whoosh2", wt("c07", "not"), .5), ("bloom", wt("n08", "एक") - .2, .5), ("whoosh", F0 - .1, .4),
         ("garden", end["n09"] + .05, .7)]
CUES += [("bloom", wt("h03", w) + .1, .5) for w in ("federalism", "seventh", "three")]
CUES += [("stamp", H0 + .25, .6), ("blow", H0 + .6, .6), ("stamp", H0 + 1.05, .6), ("shatter", H0 + 1.85, .55), ("riser", H1 - 4.0, .5),
         ("hit", H1, 1.0), ("glint", I0 + .2, .4), ("boing", at["c09"] - .1, .3), ("sip", end["c09"] + .2, .6), ("whoosh", J1 - .1, .35), ("bloom", J1 + .6, .4)]
for name, t, g in CUES:
    x = load(f"{HERE}/audio/sfx/{name}.mp3"); place(fx, x, t, g * .55, 0)

# ------------------------------------------------------------------ duck the music under the voice, then sum
envv = np.abs(vo).max(1); k = int(.03 * SR); envv = np.convolve(envv, np.ones(k) / k, "same")
duck = np.where(envv > .01, 1.0, 0.0)
# smooth: fast attack (60 ms), slow release (450 ms)
d = np.zeros(N); a_, r_ = 1 - np.exp(-1 / (.06 * SR)), 1 - np.exp(-1 / (.45 * SR)); y = 0
idx = np.flatnonzero(np.diff(duck)) ; # run the one-pole only where needed: compute in blocks
blk = 480; dd = duck.reshape(-1, blk).max(1) if N % blk == 0 else np.pad(duck, (0, blk - N % blk)).reshape(-1, blk).max(1)
ys = np.zeros(len(dd)); a2, r2 = 1 - np.exp(-blk / (.06 * SR)), 1 - np.exp(-blk / (.45 * SR))
for i, v in enumerate(dd): y += (v - y) * (a2 if v > y else r2); ys[i] = y
d = np.repeat(ys, blk)[:N]
music_gain = 1 - .7 * d
mix = vo * 1.0 + music * music_gain[:, None] * 1.0 + fx * (1 - .35 * d)[:, None]
mix[int(TOTAL * SR):] = 0
fade = int(.6 * SR); e0 = int(TOTAL * SR) - fade; mix[e0:e0 + fade] *= np.linspace(1, 0, fade)[:, None]
mix = mix[:int(TOTAL * SR)]
peak = np.abs(mix).max(); mix = mix / peak * .95
os.makedirs(f"{HERE}/_work", exist_ok=True)
raw = f"{HERE}/_work/mix-raw.f32"; mix.astype(np.float32).tofile(raw)
# loudness to -14 LUFS (streaming) with a true-peak ceiling
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000",
                "-c:a", "pcm_s16le", f"{HERE}/_work/mix.wav"], check=True)
for nm, buf in (("music", music), ("vo", vo), ("fx", fx)):
    (buf[:int(TOTAL * SR)] / max(1e-6, np.abs(buf).max()) * .9).astype(np.float32).tofile(f"{HERE}/_work/{nm}.f32")
print("mix written", round(TOTAL, 2), "s; peak before norm", round(float(peak), 2))
