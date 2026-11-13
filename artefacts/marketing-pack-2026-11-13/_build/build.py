# Renders every image in the pack from content.py: `python3 build.py` (needs Google Chrome and the website's fonts).
# One HTML file per image, screenshotted by headless Chrome at exact pixels.
import html, os, random, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "pylib"))
from content import CAROUSELS, DOOR, QUOTES, FRIENDS

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
TMP = os.path.join(HERE, "html")
FONTS = os.path.expanduser("~/Documents/aspiran-web/node_modules/@fontsource")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BRAND = os.path.join(PACK, "1-BRAND-post-from-Aspiran-accounts")
FRIEND = os.path.join(PACK, "2-FRIENDS-ONLY-never-from-Aspiran-accounts")

def face(family, pkg, subset, weight):
    return f"@font-face{{font-family:'{family}';font-weight:{weight};src:url('file://{FONTS}/{pkg}/files/{pkg}-{subset}-{weight}-normal.woff2') format('woff2');" + \
        ("unicode-range:U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF;" if subset == "devanagari" else "") + "}"
FACES = "".join([face("Martel", "martel", s, w) for s in ("latin", "devanagari") for w in (400, 700, 800)] +
                [face("Mukta", "mukta", s, w) for s in ("latin", "devanagari") for w in (400, 600, 700)] +
                [face("Plex", "ibm-plex-mono", "latin", w) for w in (400, 500, 700)])

CHOTU = '''<svg viewBox="0 0 200 230" width="{w}" xmlns="http://www.w3.org/2000/svg"><ellipse cx="100" cy="216" rx="58" ry="8" fill="#000" opacity=".25"/>
<g fill="none" stroke="#F0A04B" stroke-width="5" stroke-linecap="round"><path d="M80 52c-8-10 8-14 0-26"/><path d="M100 48c-8-10 8-14 0-28"/><path d="M120 52c-8-10 8-14 0-26"/></g>
<ellipse cx="36" cy="132" rx="17" ry="9" fill="#9A4A26"/><ellipse cx="164" cy="132" rx="17" ry="9" fill="#9A4A26"/>
<path d="M38 74H162L148 192Q146 208 130 208H70Q54 208 52 192Z" fill="#C8693A"/><path d="M45 150H155L148 192Q146 208 130 208H70Q54 208 52 192Z" fill="#9A4A26" opacity=".35"/>
<ellipse cx="100" cy="74" rx="64" ry="12" fill="#E08A55"/><ellipse cx="100" cy="74" rx="54" ry="7.5" fill="#6B3A1F"/>
<ellipse cx="76" cy="120" rx="8" ry="11" fill="#2A1B12"/><circle cx="79" cy="115" r="3" fill="#fff"/><ellipse cx="124" cy="120" rx="8" ry="11" fill="#2A1B12"/><circle cx="127" cy="115" r="3" fill="#fff"/>
<ellipse cx="58" cy="142" rx="9" ry="6" fill="#F2A27C" opacity=".75"/><ellipse cx="142" cy="142" rx="9" ry="6" fill="#F2A27C" opacity=".75"/>
<path d="M88 140Q100 154 112 140" fill="none" stroke="#2A1B12" stroke-width="4" stroke-linecap="round"/>
<rect x="82" y="168" width="36" height="20" rx="6" fill="#FFF6EA"/><text x="100" y="183" text-anchor="middle" font-family="Plex, monospace" font-size="13" font-weight="700" fill="#6B3A1F">AI</text></svg>'''
CUP = '<svg width="{w}" height="{w}" viewBox="0 0 40 40"><path d="M14 3c-2 3 2 4 0 7M20 2c-2 3 2 4 0 8M26 3c-2 3 2 4 0 7" fill="none" stroke="#F0A04B" stroke-width="2" stroke-linecap="round"/><path d="M5 15h30l-4.5 20.5a3 3 0 0 1-3 2.5H12.5a3 3 0 0 1-3-2.5z" fill="#C8693A"/><rect x="4" y="13" width="32" height="4.5" rx="2.2" fill="#E08A55"/></svg>'

def leaf(fill, flower=False, s=3.2):
    f = '<g transform="translate(42 0)"><g fill="#F0A04B">' + "".join(f'<ellipse cy="-3.3" rx="2.3" ry="3.3" transform="rotate({a})"/>' for a in (0, 72, 144, 216, 288)) + '</g><circle r="1.9" fill="#FFE0A8"/></g>' if flower else ""
    return f'<svg width="{int(52*s)}" height="{int(26*s)}" viewBox="-2 -13 52 26"><path d="M0 0 C 14 -10, 34 -8, 44 0 C 34 8, 14 10, 0 0 Z" fill="{fill}"/>{f}</svg>'

def ladder(hi):
    names = ["अभी नहीं", "पढ़ लिया", "याद से बता सकते हैं", "उत्तर में लिख सकते हैं"] if hi else ["Not yet", "Met", "Can recall", "Can use"]
    fills = ["rgba(96,112,150,.55)", "#6DB36F", "#9BE38C", "#C6FFA6"]
    return '<div class="ladder">' + "".join(f'<div>{leaf(fills[i], i == 3)}<span>{names[i]}</span></div>' for i in range(4)) + "</div>"

def stars(w, h, seed):
    r = random.Random(seed)
    return f'<svg class="stars" width="{w}" height="{h}">' + "".join(
        f'<circle cx="{r.randint(0, w)}" cy="{r.randint(0, h)}" r="{r.choice([1, 1, 1.4, 2, 2.6])}" fill="{r.choice(["#EEEAF6", "#EEEAF6", "#FFD9A0"])}" opacity="{r.uniform(.25, .8):.2f}"/>' for _ in range(90)) + "</svg>"

CSS = '''*{box-sizing:border-box;margin:0;padding:0}html,body{width:%(w)dpx;height:%(h)dpx;overflow:hidden}
body{background:radial-gradient(900px 700px at 85%% -5%%,#1A1840 0%%,transparent 62%%),radial-gradient(800px 700px at -10%% 60%%,#10203A 0%%,transparent 60%%),#06070F;color:#EEEAF6;font-family:'Mukta',sans-serif;position:relative}
.stars{position:absolute;inset:0}.wrap{position:absolute;inset:0;padding:%(py)dpx 84px %(pb)dpx;display:flex;flex-direction:column;justify-content:center;gap:40px}
.kick{font:500 27px/1.5 'Plex','Mukta',monospace;letter-spacing:.12em;color:#7FE3F0;text-transform:uppercase}
.hi .kick{letter-spacing:.04em;font-family:'Mukta',sans-serif;font-weight:600;font-size:32px}
h1{font:800 104px/1.08 'Martel',serif;letter-spacing:-.015em}.hi h1{font-size:82px;line-height:1.32;letter-spacing:0}
h1 .glow{background:linear-gradient(90deg,#FFC27A,#CFE3A8 60%%,#7FE3F0);-webkit-background-clip:text;background-clip:text;color:transparent}
h2{font:800 72px/1.16 'Martel',serif}.hi h2{font-size:60px;line-height:1.4}
p{font-size:44px;line-height:1.5;color:#EEEAF6}.hi p{font-size:42px;line-height:1.62}.sub{color:#A3A8C6}
.card{background:rgba(18,22,42,.82);border:1.5px solid rgba(170,180,255,.2);border-radius:32px;padding:44px 48px;display:flex;flex-direction:column;gap:22px}
.card.fact{border-color:rgba(127,227,240,.45)}.card.fact p{font-family:'Martel','Mukta',serif;font-size:46px;line-height:1.6}.hi .card.fact p{font-size:42px;line-height:1.7}
.q{font:800 60px/1.25 'Martel',serif}.hi .q{font-size:52px;line-height:1.45}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:22px}.opts.one{grid-template-columns:1fr}
.opt{border:1.5px solid rgba(170,180,255,.28);background:rgba(255,255,255,.04);border-radius:22px;padding:26px 30px;font-size:42px;font-weight:600}
.note{font-size:36px;color:#A3A8C6}.big{font:800 190px/1 'Martel',serif;color:#FFC27A;text-shadow:0 0 40px rgba(240,160,75,.45)}.hi .big{font-size:150px;line-height:1.3}
ol,ul{list-style:none;display:flex;flex-direction:column;gap:26px}li{font-size:44px;line-height:1.42;display:flex;gap:26px;align-items:flex-start}.hi li{font-size:41px;line-height:1.58}
li b{flex:none;width:64px;height:64px;border-radius:50%%;background:rgba(240,160,75,.16);color:#FFC27A;border:1.5px solid rgba(240,160,75,.5);display:flex;align-items:center;justify-content:center;font:700 30px 'Plex',monospace;margin-top:2px}
.paper{background:#F7F2EA;color:#2A1B12;border-radius:26px;padding:42px 46px;display:flex;flex-direction:column;gap:22px;box-shadow:0 20px 60px rgba(0,0,0,.45)}
.paper .pq{font:700 40px/1.4 'Martel','Mukta',serif;color:#6B3A1F}.paper .pa{font:400 37px/1.62 'Martel','Mukta',serif;color:#2A1B12}.paper .pn{font:500 24px 'Plex','Mukta',monospace;letter-spacing:.06em;color:#6E5A4C;text-transform:uppercase}
.hi .paper .pq{font-size:38px;line-height:1.6}.hi .paper .pa{font-size:35px;line-height:1.75}.hi .paper .pn{font-family:'Mukta';font-size:28px;letter-spacing:0;text-transform:none}
.mrow{display:flex;align-items:center;gap:26px;font-size:44px;font-weight:600}.mrow span{flex:0 0 330px}.dots{display:flex;gap:14px}.dots i{width:54px;height:54px;border-radius:50%%;border:2px solid rgba(170,180,255,.3)}.dots i.on{background:#F0A04B;border-color:#FFC27A}
.mrow em{font:700 40px 'Plex',monospace;font-style:normal;color:#FFC27A;margin-left:auto}
.word{font:800 96px/1.1 'Martel',serif;color:#FFC27A}.hi .word{font-size:74px;line-height:1.35}.word.strike{color:#A3A8C6;text-decoration:line-through;text-decoration-color:rgba(240,138,123,.85);text-decoration-thickness:5px;font-size:70px;line-height:1.25}.hi .word.strike{font-size:60px;line-height:1.5}
.means{font-size:50px;line-height:1.45}.hi .means{font-size:46px;line-height:1.6}
.btn{align-self:flex-start;background:linear-gradient(180deg,#FFC27A,#F0A04B);color:#1B1205;font-weight:700;font-size:42px;border-radius:999px;padding:30px 50px;box-shadow:0 0 0 2px rgba(255,194,122,.4),0 14px 50px rgba(240,160,75,.35)}.hi .btn{font-size:38px}
.url{font:700 64px 'Plex',monospace;color:#EEEAF6;letter-spacing:.02em}
.ladder{display:flex;gap:26px;align-items:flex-end}.ladder div{display:flex;flex-direction:column;gap:6px;align-items:flex-start}.ladder span{font-size:27px;color:#A3A8C6}
.foot{position:absolute;left:84px;right:84px;bottom:%(fb)dpx;display:flex;justify-content:space-between;align-items:center;font:500 27px 'Plex',monospace;letter-spacing:.08em;color:#9097B8}
.foot .l{display:flex;align-items:center;gap:14px;color:#EEEAF6}.chotu{position:absolute;right:70px;bottom:%(cb)dpx}
.ai{font:700 22px 'Plex',monospace;letter-spacing:.1em;color:#1B1205;background:#FFC27A;border-radius:8px;padding:4px 10px;margin-left:12px;vertical-align:middle}'''

def page(body, lang, w=1080, h=1350, n=None, total=None, seed=1, chotu=False):
    story = h > 1500
    css = CSS % {"w": w, "h": h, "py": 300 if story else 96, "pb": 380 if story else 170, "fb": 270 if story else 62, "cb": 330 if story else 120}
    count = f"{n}/{total}" if n else ""
    return f'''<!doctype html><html lang="{lang}"><meta charset="utf-8"><style>{FACES}{css}</style><body class="{lang}">{stars(w, h, seed)}
<div class="wrap">{body}</div>{'<div class="chotu">' + CHOTU.format(w=150) + '</div>' if chotu else ''}
<div class="foot"><span class="l">{CUP.format(w=40)} aspiran.in</span><span>{count}</span></div></body></html>'''

E = html.escape
def slide(s, lang):
    hi, t = lang == "hi", s["t"]
    k = f'<div class="kick">{E(s["kick"])}</div>' if s.get("kick") else ""
    if t == "hook":
        return k + f'<h1>{E(s["h1"][0])}<br><span class="glow">{E(s["h1"][1])}</span></h1><p class="sub">{E(s["sub"])}</p>', False
    if t == "text":
        ps = "".join(f"<p>{E(x)}</p>" for x in s["body"])
        if s.get("card"): return k + f'<h2>{E(s["h"])}</h2><div class="card fact">{ps}</div>', False
        return k + f'<h2>{E(s["h"])}</h2>{ps}', False
    if t == "quiz":
        long = max(len(o) for o in s["opts"]) > 14
        return k + f'<div class="card"><div class="q">{E(s["q"])}</div><div class="opts {"one" if long else ""}">' + "".join(f'<div class="opt">{E(o)}</div>' for o in s["opts"]) + f'</div></div><p class="note">{E(s["note"])}</p>', False
    if t == "answer":
        return k + f'<div class="big">{E(s["big"])}</div>' + "".join(f"<p>{E(x)}</p>" for x in s["body"]), False
    if t == "list":
        return k + f'<h2>{E(s["h"])}</h2><ol>' + "".join(f"<li><b>{i + 1}</b><span>{E(x)}</span></li>" for i, x in enumerate(s["items"])) + "</ol>" + (f'<p class="note">{E(s["foot"])}</p>' if s.get("foot") else ""), False
    if t == "sheet":
        return k + f'<div class="paper"><div class="pq">{E(s["q"])}</div><div class="pa">{E(s["answer"])}</div><div class="pn">{E(s["note"])}</div></div>', False
    if t == "marks":
        rows = "".join(f'<div class="mrow"><span>{E(name)}</span><div class="dots">' + "".join(f'<i class="{"on" if j < n else ""}"></i>' for j in range(5)) + f'</div><em>{n}/5</em></div>' for name, n in s["rows"])
        return k + f'<div class="card">{rows}</div><p class="note">{E(s["foot"])}</p>', False
    if t == "pair":
        return k + f'<div class="word {"strike" if s.get("strike") else ""}">{E(s["a"])}</div><p class="means">{E(s["b"])}</p>', False
    if t == "door":
        return f'<h2>{E(s["h"])}</h2><p class="sub">{E(s["sub"])}</p><div class="btn">{E(s["btn"])}</div><div class="url">aspiran.in</div>{ladder(hi)}', True
    if t == "quote":
        return f'<h1>{E(s["h1"][0])}<br><span class="glow">{E(s["h1"][1])}</span></h1>' + (f'<div class="btn">{E(s["btn"])}</div>' if s.get("btn") else ""), False
    raise ValueError(t)

PAPER_CSS = '''*{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:%(h)dpx;overflow:hidden}
body{background:#F7F2EA;color:#2A1B12;font-family:'Mukta',sans-serif;padding:%(py)dpx 96px;display:flex;flex-direction:column;justify-content:center;gap:44px}
.k{font:500 28px 'Plex','Mukta',monospace;letter-spacing:.12em;color:#9A4E0E}.hi .k{font:600 34px 'Mukta';letter-spacing:.02em}
.h{font:800 76px/1.2 'Martel',serif;color:#6B3A1F}.hi .h{font-size:62px;line-height:1.5}
.b{font-size:44px;line-height:1.55;color:#2A1B12}.hi .b{line-height:1.7}.u{font:500 30px 'Plex',monospace;color:#6E5A4C;letter-spacing:.04em}'''
def friend_page(c, lang, h):
    css = PAPER_CSS % {"h": h, "py": 320 if h > 1500 else 110}
    return f'<!doctype html><html lang="{lang}"><meta charset="utf-8"><style>{FACES}{css}</style><body class="{lang}"><div class="k">{E(c["k"])}</div><div class="h">{E(c["h"])}</div><div class="b">{E(c["b"])}</div><div class="u">aspiran.in</div></body></html>'

def print_sheet():
    import qrcode, qrcode.image.svg
    url = "https://app.aspiran.in/app/?utm_source=print&utm_medium=qr#try"
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=1)
    svg = img.to_string(encoding="unicode")
    rows = [("Articles 14 to 18", "Right to equality"), ("Articles 19 to 22", "Right to freedom"), ("Articles 23 and 24", "Right against exploitation"),
            ("Articles 25 to 28", "Right to freedom of religion"), ("Articles 29 and 30", "Cultural and educational rights"), ("Article 32", "Right to constitutional remedies")]
    trs = "".join(f"<tr><td>{a}</td><td>{b}</td></tr>" for a, b in rows)
    return f'''<!doctype html><html lang="en"><meta charset="utf-8"><style>{FACES}@page{{size:A4;margin:0}}*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:210mm;height:297mm;background:#F7F2EA;color:#2A1B12;font-family:'Mukta',sans-serif;padding:14mm 16mm 10mm;display:flex;flex-direction:column;gap:4.5mm}}
.k{{font:500 9pt 'Plex',monospace;letter-spacing:.12em;color:#9A4E0E}}h1{{font:800 27pt/1.15 'Martel',serif;color:#6B3A1F}}p{{font-size:11.5pt;line-height:1.5}}
.cols{{flex:none;border:1px solid #E4D8C8;border-radius:4mm;background:#FFFDF9;overflow:hidden}}table{{border-collapse:collapse;width:100%}}
td{{padding:2.5mm 4mm;border-bottom:1px solid #E4D8C8;font-size:12.5pt}}td:first-child{{width:50%;font-weight:700;border-right:1.5px dashed #9A4E0E}}tr:last-child td{{border-bottom:0}}
.fold{{font:500 8pt 'Plex',monospace;letter-spacing:.1em;color:#9A4E0E;text-align:center}}
.box{{background:#F6E2C9;border-radius:4mm;padding:5mm}}.box b{{color:#6B3A1F}}ol{{padding-left:5mm;font-size:11.5pt;line-height:1.55}}
.lines div{{border-bottom:1px solid #C9BBA6;height:8mm}}.foot{{flex:none;margin-top:auto;display:flex;gap:7mm;align-items:center;border-top:1px solid #E4D8C8;padding-top:5mm}}
.qr{{width:30mm;height:30mm;background:#fff;padding:1.5mm;border-radius:2mm;flex:none}}.qr svg{{width:100%;height:100%}}.foot h2{{font:800 15pt 'Martel',serif;color:#6B3A1F}}.foot p{{font-size:10.5pt}}</style>
<body><div class="k">RECALL SHEET · POLITY · FUNDAMENTAL RIGHTS</div><h1>Fold it. Say it. Check it.</h1>
<p>Reading this sheet again will feel like learning. It isn't. <b>Fold the page along the dotted line</b> so the right-hand column is hidden, say each answer out loud, then unfold and check.</p>
<div class="fold">FOLD ALONG THE DOTTED LINE ↓</div>
<div class="cols"><table>{trs}</table></div>
<div class="box"><p><b>Now the harder way.</b> Hide the left column instead. Which Articles carry each right?</p></div>
<div><p><b>Three questions, from memory. Write, then check with your book.</b></p><ol><li>Which of these six rights did Dr Ambedkar call the "heart and soul" of the Constitution?</li><li>The right to education for ages 6 to 14 sits in which Article?</li><li>Which right was removed from this list in 1978, and where does it sit now?</li></ol></div>
<div class="lines"><div></div><div></div></div>
<p><b>Come back to this sheet tomorrow, then in a week, then in a month.</b> Each time, fold first.</p>
<div class="foot"><div class="qr">{svg}</div><div><h2>From Aspiran. Try one whole topic free.</h2><p>Scan to do Federalism start to finish in about 20 minutes: guess first, short reads, recall checks, real past questions. No sign-up. <b>aspiran.in</b></p><p style="color:#6E5A4C;font-size:9pt;margin-top:2mm">Aspiran is a study app for UPSC aspirants, in English and Hindi. Not affiliated with UPSC.</p></div></div></body></html>'''

jobs = []  # (html path, png path, w, h)
def add(doc, out, w=1080, h=1350):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    name = out.replace(PACK, "").strip("/").replace("/", "__").replace(".png", ".html").replace(".pdf", ".html")
    path = os.path.join(TMP, name)
    open(path, "w").write(doc)
    jobs.append((path, out, w, h))

os.makedirs(TMP, exist_ok=True)
seed = 0
for cid, langs in CAROUSELS.items():
    for lang, slides in langs.items():
        all_slides = slides + [DOOR[lang]]
        for i, s in enumerate(all_slides):
            seed += 1
            body, chotu = slide(s, lang)
            add(page(body, lang, n=i + 1, total=len(all_slides), seed=seed, chotu=chotu), f"{BRAND}/instagram-carousels/{cid}/{lang}/{i + 1:02d}.png")
for qid, langs in QUOTES:
    for lang, lines in langs.items():
        seed += 1
        btn = DOOR[lang]["btn"]
        body, _ = slide({"t": "quote", "h1": lines, "btn": btn}, lang)
        add(page(body, lang, seed=seed), f"{BRAND}/single-posts/{lang}/{qid}.png")
        add(page(body, lang, h=1920, seed=seed), f"{BRAND}/stories-and-status/{lang}/{qid}.png", h=1920)
        if lang == "en":
            body2, _ = slide({"t": "quote", "h1": lines}, lang)
            add(page(body2, lang, w=1200, h=675, seed=seed).replace("font:800 104px", "font:800 78px").replace("padding:96px 84px 170px", "padding:60px 84px 110px"), f"{BRAND}/x-and-linkedin-images/{qid}.png", w=1200, h=675)
for fid, langs in FRIENDS:
    for lang, c in langs.items():
        add(friend_page(c, lang, 1350), f"{FRIEND}/images/{lang}/{fid}-post.png")
        add(friend_page(c, lang, 1920), f"{FRIEND}/images/{lang}/{fid}-story.png", h=1920)

def shoot(job):
    src, out, w, h = job
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", f"--window-size={w},{h}",
                    "--virtual-time-budget=3000", f"--screenshot={out}", "file://" + src], capture_output=True, timeout=120)
    return os.path.exists(out)
only = sys.argv[1] if len(sys.argv) > 1 else ""
todo = [j for j in jobs if only in j[1]]
with ThreadPoolExecutor(4) as ex: ok = list(ex.map(shoot, todo))
print(f"{sum(ok)} of {len(todo)} images rendered")

if not only or "print" in only:
    sheet = os.path.join(TMP, "print-recall-sheet.html")
    open(sheet, "w").write(print_sheet())
    out = f"{BRAND}/print/recall-sheet-fundamental-rights-A4.pdf"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={out}", "file://" + sheet], capture_output=True, timeout=120)
    print("print sheet:", os.path.exists(out))
