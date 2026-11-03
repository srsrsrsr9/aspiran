"""Sarvam voice scripts + Hindi subtitles for one episode.
Usage:
  python sarvam_pack.py units <dist> <base>            # print English caption units (one per spoken sentence) to translate
  python sarvam_pack.py build <dist> <base> <hi.json>  # write <base>.voice.txt, <base>.hi.voice.txt, <base>.hi.srt
hi.json: {"units": [{"show": "Hindi subtitle text", "say": "Hindi text to speak (numbers in words)"}...]}
         one entry per English unit, same order.
"""
import json, re, sys
MAXC = 1500

def vtt_cues(path):
    cues = []
    for blk in open(path, encoding="utf-8").read().split("\n\n"):
        ls = [l for l in blk.strip().splitlines() if l]
        for i, l in enumerate(ls):
            if "-->" in l:
                a, b = [x.strip() for x in l.split("-->")]
                cues.append((sec(a), sec(b), " ".join(ls[i + 1:])))
    return cues

def sec(s):
    h, m, x = s.split(":"); return int(h) * 3600 + int(m) * 60 + float(x)

def units(cues):
    out, cur = [], []
    for c in cues:
        cur.append(c)
        if re.search(r'[.?!]["”)]?$', c[2]):
            out.append((cur[0][0], cur[-1][1], " ".join(x[2] for x in cur))); cur = []
    if cur: out.append((cur[0][0], cur[-1][1], " ".join(x[2] for x in cur)))
    return out

def parts(sents, maxc=MAXC):
    ps, cur = [], ""
    for s in sents:
        s = s.strip()
        if cur and len(cur) + 1 + len(s) > maxc: ps.append(cur); cur = s
        else: cur = (cur + " " + s).strip()
    if cur: ps.append(cur)
    assert all(len(p) <= maxc for p in ps), "a single sentence is over the limit"
    return ps

def voice_file(path, base, lang, sents, title):
    ps = parts(sents); suf = "" if lang == "English" else ".hi"
    L = [f"# {base} | {lang} narration for Sarvam (Bulbul) | {len(ps)} part(s), each at most {MAXC} characters",
         f"# Title: {title}",
         f"# Paste only the text between the dashed lines, one part at a time. Save each as {base}{suf}-NN.mp3.", ""]
    for i, p in enumerate(ps, 1):
        L += [f"----- PART {i:02d} of {len(ps):02d} ({len(p)} characters) -> {base}{suf}-{i:02d}.mp3 -----", p, f"----- END PART {i:02d} -----", ""]
    open(path, "w", encoding="utf-8").write("\n".join(L))
    return ps

def srt_ts(x):
    ms = int(round(x * 1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"

def chunk(text, n=7):
    w = text.split(); k = max(1, -(-len(w) // n)); size = -(-len(w) // k)
    return [" ".join(w[i:i + size]) for i in range(0, len(w), size)]

def main():
    mode, dist, base = sys.argv[1:4]
    U = units(vtt_cues(f"{dist}/{base}.vtt"))
    if mode == "units":
        for i, (a, b, t) in enumerate(U): print(f"{i:2d} [{a:6.2f}-{b:6.2f}] {t}")
        return
    hi = json.load(open(sys.argv[4], encoding="utf-8"))["units"]
    assert len(hi) == len(U), f"hi.json has {len(hi)} units, English has {len(U)}"
    # English voice text: spoken forms from the ElevenLabs script (tags removed)
    el = open(f"{dist}/{base}.elevenlabs.txt", encoding="utf-8").read().splitlines()
    title = el[0].strip("= ").rsplit(" (", 1)[0]
    en = [re.sub(r"\[[^\]]*\]\s*", "", l).strip() for l in el[1:] if l.strip()]
    fix = json.load(open(sys.argv[4], encoding="utf-8")).get("en_fix", {})
    for k_, v_ in fix.items(): en = [l.replace(k_, v_) for l in en]
    pe = voice_file(f"{dist}/{base}.voice.txt", base, "English", en, title)
    ph = voice_file(f"{dist}/{base}.hi.voice.txt", base, "Hindi", [u["say"] for u in hi], hi[0].get("title", title) if False else title)
    srt, k = [], 1
    for (a, b, _), u in zip(U, hi):
        cs = chunk(u["show"]); tot = sum(len(c) for c in cs); t = a
        for c in cs:
            e = t + (b - a) * len(c) / tot; srt += [str(k), f"{srt_ts(t)} --> {srt_ts(e)}", c, ""]; k += 1; t = e
    open(f"{dist}/{base}.hi.srt", "w", encoding="utf-8").write("\n".join(srt))
    print(f"{base}: English {len(pe)} part(s) {[len(p) for p in pe]}, Hindi {len(ph)} part(s) {[len(p) for p in ph]}, {k-1} Hindi cues")

main()
