#!/usr/bin/env python3
"""Aspiran print pamphlets (22 Nov 2026): one for students (A5), one for coaching centres (A4).
Each is two-sided: English on the front, Hindi on the back. Each comes in colour and in black and white
(for photocopying). Wording follows the live website (aspiran.in home and /for-coaching, 22 Nov 2026).

Run:  <venv with segno>/bin/python build.py   ->  writes html/*.html; then render.sh prints the PDFs with Chrome.
"""
import io, pathlib, re, segno

HERE = pathlib.Path(__file__).parent
OUT = HERE / "html"
OUT.mkdir(exist_ok=True)

# QR targets. utm_source=pamphlet and utm_medium=student|centre (the app records "pamphlet:student" as the install source;
# Admin -> Insights -> Where people come from). qr() adds utm_campaign (the print run) and utm_content (language and
# colour or mono), so PostHog can tell each printed version apart.
CAMPAIGN = "print-2026-11"
VARIANT = "colour"  # set by the loop at the bottom
LINKS = {
    "student-en": "https://app.aspiran.in/app/?utm_source=pamphlet&utm_medium=student",
    "student-hi": "https://app.aspiran.in/app/?utm_source=pamphlet&utm_medium=student&lang=hi",
    "centre-en": "https://aspiran.in/for-coaching/?utm_source=pamphlet&utm_medium=centre",
    "centre-hi": "https://aspiran.in/hi/for-coaching/?utm_source=pamphlet&utm_medium=centre",
}


def qr(key):
    lang = key.split("-")[1]
    url = f"{LINKS[key]}&utm_campaign={CAMPAIGN}&utm_content={lang}-{VARIANT}"
    q = segno.make(url, error="m")
    buf = io.BytesIO()
    q.save(buf, kind="svg", scale=1, border=0, dark="#000", xmldecl=False, svgns=True, nl=False)
    svg = buf.getvalue().decode()
    n = q.symbol_size(scale=1, border=0)[0]
    svg = re.sub(r'\s(width|height)="\d+"', "", svg, count=2)
    return svg.replace("<svg ", f'<svg class="qr" viewBox="0 0 {n} {n}" ', 1)


KULHAD = ('<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><path class="steam" d="M14 3c-2 3 2 4 0 7M20 2c-2 3 2 4 0 8M26 3c-2 3 2 4 0 7" '
          'fill="none" stroke-width="2" stroke-linecap="round"/><path class="cup" d="M5 15h30l-4.5 20.5a3 3 0 0 1-3 2.5H12.5a3 3 0 0 1-3-2.5z"/>'
          '<rect class="rim" x="4" y="13" width="32" height="4.5" rx="2.2"/></svg>')

# Simple line icons (24px grid, stroke = currentColor).
def icon(paths):
    return f'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">{paths}</svg>'

IC = {
    "pen": icon('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/><path d="M14 20h6"/>'),
    "loop": icon('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4.5h-4.5"/><path d="M12 8v4l3 2"/>'),
    "pod": icon('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/><path d="M15 14.2c2.6-.3 4.8 1.2 5.5 4.8"/>'),
    "brand": icon('<path d="M4 4h10l6 6-10 10-6-6z"/><circle cx="9" cy="9" r="1.6"/>'),
    "mark": icon('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 12l2.5 2.5L16 9"/>'),
    "quiet": icon('<circle cx="10" cy="8" r="3.2"/><path d="M4 20c.7-3.6 3-5.5 6-5.5"/><path d="M15 14h5l-5 5h5"/>'),
    "chat": icon('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>'),
    "doubt": icon('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><path d="M12 17h.01"/>'),
    "book": icon('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>'),
    "tick": icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
}

CSS = r"""
@font-face{font-family:Mukta;font-weight:400;src:url(../fonts/mukta-latin-400-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:Mukta;font-weight:500;src:url(../fonts/mukta-latin-500-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+2122,U+2212}
@font-face{font-family:Mukta;font-weight:700;src:url(../fonts/mukta-latin-700-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+2122,U+2212}
@font-face{font-family:Mukta;font-weight:800;src:url(../fonts/mukta-latin-800-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+2122,U+2212}
@font-face{font-family:Mukta;font-weight:400;src:url(../fonts/mukta-devanagari-400-normal.woff2) format("woff2");unicode-range:U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}
@font-face{font-family:Mukta;font-weight:500;src:url(../fonts/mukta-devanagari-500-normal.woff2) format("woff2");unicode-range:U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}
@font-face{font-family:Mukta;font-weight:700;src:url(../fonts/mukta-devanagari-700-normal.woff2) format("woff2");unicode-range:U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}
@font-face{font-family:Mukta;font-weight:800;src:url(../fonts/mukta-devanagari-800-normal.woff2) format("woff2");unicode-range:U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}
@font-face{font-family:Martel;font-weight:800;src:url(../fonts/martel-latin-800-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+2122,U+2212}
@font-face{font-family:Martel;font-weight:800;src:url(../fonts/martel-devanagari-800-normal.woff2) format("woff2");unicode-range:U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}

:root{
  --paper:#FFFFFF; --ink:#2A1B12; --mute:#6E5A4C; --chai:#9A4E0E; --saffron:#F0A04B; --soft:#F6E2C9; --cream:#F7F2EA;
  --line:#E4D8C8; --sky:#0B0E1C; --sky2:#1A1F4A; --skyink:#EEF0FF; --skymute:#A9B0D6; --ok:#4F6B3E;
  --cup:#C8693A; --rim:#E08A55; --steam:#F0A04B;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff}
body{font-family:Mukta,system-ui,sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:var(--w);height:var(--h);position:relative;overflow:hidden;background:var(--paper);display:flex;flex-direction:column;page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
h1,h2,h3{font-family:Martel,Georgia,serif;font-weight:800;line-height:1.18}
.logo{width:1em;height:1em;display:inline-block;vertical-align:-0.12em}
.logo .cup{fill:var(--cup)} .logo .rim{fill:var(--rim)} .logo .steam{stroke:var(--steam)}
.ic{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.qr{display:block;width:100%;height:auto;color:#000;shape-rendering:crispEdges}

/* top band: the night sky */
.band{background:radial-gradient(120% 140% at 85% -20%,var(--sky2) 0%,var(--sky) 60%);color:var(--skyink);position:relative}
.band .stars{position:absolute;inset:0;background-image:
  radial-gradient(1px 1px at 12% 30%,#fff9 50%,transparent 51%),radial-gradient(1px 1px at 28% 72%,#fff7 50%,transparent 51%),
  radial-gradient(1.4px 1.4px at 46% 22%,#fffb 50%,transparent 51%),radial-gradient(1px 1px at 63% 60%,#fff8 50%,transparent 51%),
  radial-gradient(1.2px 1.2px at 78% 28%,#fffa 50%,transparent 51%),radial-gradient(1px 1px at 90% 70%,#fff7 50%,transparent 51%),
  radial-gradient(1px 1px at 36% 45%,#fff6 50%,transparent 51%),radial-gradient(1.3px 1.3px at 55% 85%,#fff9 50%,transparent 51%)}
.band > *{position:relative}
.brandrow{display:flex;align-items:center;justify-content:space-between;gap:3mm}
.brand{display:flex;align-items:center;gap:2mm;font-family:Martel,serif;font-weight:800;letter-spacing:.01em}
.kick{font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--saffron)}
.band h1 .glow{color:var(--saffron)}
.band .lede{color:var(--skymute)}
.pill{display:inline-block;border:1px solid #ffffff40;border-radius:99px;padding:.15em .7em;color:var(--skyink);font-weight:500;white-space:nowrap}

.card{background:var(--cream);border-radius:3mm;border:0.3mm solid var(--line)}
.chai{color:var(--chai)}
.mute{color:var(--mute)}
.tag{display:inline-block;background:var(--soft);color:var(--chai);font-weight:700;border-radius:99px;padding:.05em .6em}
.ticks li{list-style:none;display:flex;gap:1.6mm;align-items:flex-start}
.ticks li .ic{flex:0 0 auto;color:var(--ok);stroke-width:2.4}
.cta{background:var(--sky);color:var(--skyink);border-radius:3mm;display:flex;align-items:center}
.cta .qrbox{background:#fff;border-radius:2mm;flex:0 0 auto}
.cta h2{color:var(--saffron)}
.cta .small{color:var(--skymute)}

/* ---- black and white (photocopy) ---- */
.mono{--paper:#fff;--ink:#000;--mute:#333;--chai:#000;--saffron:#000;--soft:#fff;--cream:#fff;--line:#000;--ok:#000;--cup:#000;--rim:#000;--steam:#000}
.mono .band{background:#fff;color:#000;border-bottom:0.8mm solid #000}
.mono .band .stars{display:none}
.mono .band .lede{color:#222}
.mono .band h1 .glow{color:#000;text-decoration:underline;text-decoration-thickness:.8mm;text-underline-offset:1.2mm}
.mono .pill{border-color:#000;color:#000}
.mono .card{border:0.35mm solid #000}
.mono .tag{border:0.3mm solid #000}
.mono .cta{background:#fff;color:#000;border:0.8mm solid #000}
.mono .cta h2,.mono .cta .small{color:#000}
.mono .kick{color:#000}
.mono .logo .rim{fill:#fff;stroke:#000;stroke-width:1.2}
"""

# ---------------------------------------------------------------- students (A5)
STUDENT = {
    "en": dict(
        lang="en", kick="For UPSC aspirants", langs="English · हिंदी",
        h1='Study once.<br><span class="glow">Remember it</span> in the exam hall.',
        lede="Revision that comes back before you forget, Mains answers marked in minutes, every PYQ, and a pod to prep with.",
        pains=[
            ("pen", "“Nobody checks my answers.”",
             "Write on paper, take a photo. In minutes: marks on five parts (what the question asked, structure, content, examples, conclusion) and one fix for each."),
            ("loop", "“I read it in October. It’s gone by March.”",
             "A 10 to 20 minute review a day. What you studied comes back just before you’d forget it: a day, a week, then months."),
            ("pod", "“I’m preparing alone.”",
             "A study room from day one, and a small pod of up to 8 aspirants at your stage. No ranks, no showing off."),
        ],
        nums=[("1,797", "PYQs 2016–2026, with UPSC’s own keys"), ("2,000+", "practice questions"), ("400+", "short videos"), ("25+ hrs", "audio notes")],
        free_h="Free trial", free_note="no card needed",
        free=["Daily revision and current affairs", "All notes, PYQs and videos", "3 answers checked a week, 1 mock a month", "Your pod and study room"],
        plus_h="Plus", plus_price="₹3,999", plus_per="a year · about ₹11 a day",
        plus=["Unlimited answer checking", "All 35 full mocks", "Essays marked from 3 photos"],
        cta_h="Scan to join free", cta_p="Takes a minute. Works on any phone, in the browser.", url="aspiran.in",
        foot="Hindi on the back · हिंदी पीछे है",
    ),
    "hi": dict(
        lang="hi", kick="UPSC अभ्यर्थियों के लिए", langs="हिंदी · English",
        h1='एक बार पढ़िए।<br><span class="glow">एग्ज़ाम हॉल तक याद रहेगा।</span>',
        lede="भूलने से पहले लौटता रिवीज़न, मिनटों में मेन्स आंसर की जाँच, हर PYQ, और साथ पढ़ने को एक पॉड।",
        pains=[
            ("pen", "“मेरे उत्तर कोई नहीं जाँचता।”",
             "काग़ज़ पर लिखिए, फ़ोटो लीजिए। मिनटों में पाँच चीज़ों पर अंक (सवाल का निर्देश, ढाँचा, सामग्री, उदाहरण, निष्कर्ष) और हर एक के लिए एक सुधार।"),
            ("loop", "“अक्टूबर में पढ़ा, मार्च तक भूल गया।”",
             "रोज़ 10 से 20 मिनट का रिव्यू। जो पढ़ा, वह ठीक भूलने से पहले लौटता है: एक दिन, एक हफ़्ता, फिर महीने।"),
            ("pod", "“मैं अकेले पढ़ रहा हूँ।”",
             "पहले दिन से एक स्टडी रूम, और आपके स्टेज के 8 तक अभ्यर्थियों का छोटा पॉड। न रैंक, न दिखावा।"),
        ],
        nums=[("1,797", "PYQ 2016–2026, UPSC की अपनी आंसर-की के साथ"), ("2,000+", "प्रैक्टिस सवाल"), ("400+", "छोटे वीडियो"), ("25+ घंटे", "ऑडियो नोट्स")],
        free_h="फ़्री ट्रायल", free_note="कोई कार्ड नहीं",
        free=["रोज़ का रिवीज़न और करंट अफ़ेयर्स", "सारे नोट्स, PYQ और वीडियो", "हफ़्ते में 3 आंसर की जाँच, महीने में 1 मॉक", "आपका पॉड और स्टडी रूम"],
        plus_h="Plus", plus_price="₹3,999", plus_per="साल · लगभग ₹11 रोज़",
        plus=["अनलिमिटेड आंसर की जाँच", "सारे 35 फ़ुल मॉक", "3 फ़ोटो से एसे की जाँच"],
        cta_h="स्कैन कीजिए, फ़्री में जुड़िए", cta_p="एक मिनट लगता है। किसी भी फ़ोन पर, ब्राउज़र में।", url="aspiran.in",
        foot="English on the back · अंग्रेज़ी पीछे है",
    ),
}

STUDENT_CSS = r"""
:root{--w:148mm;--h:210mm}
@page{size:148mm 210mm;margin:0}
.band{padding:7.5mm 8mm 6.5mm}
.brand{font-size:15pt}
.brandrow .pill{font-size:7.5pt}
.kick{font-size:7pt;margin:4mm 0 1.2mm}
h1{font-size:21pt}
.hi h1{font-size:19.5pt;line-height:1.3}
.lede{font-size:9.6pt;line-height:1.4;margin-top:2mm}
.body{flex:1;display:flex;flex-direction:column;padding:4.6mm 8mm 4.5mm;gap:3.2mm}
.pains{display:flex;flex-direction:column;gap:2.6mm}
.pain{display:grid;grid-template-columns:9mm 1fr;gap:2.6mm;align-items:start}
.pain .icb{width:9mm;height:9mm;border-radius:2.2mm;background:var(--soft);color:var(--chai);padding:1.6mm}
.mono .pain .icb{border:0.35mm solid #000}
.pain h3{font-size:10.6pt;color:var(--chai)}
.hi .pain h3{font-size:10.2pt;line-height:1.35}
.pain p{font-size:8.5pt;line-height:1.36;margin-top:.3mm}
.nums{display:grid;grid-template-columns:repeat(4,1fr);gap:1.6mm}
.nums div{padding:1.6mm 1.8mm;text-align:center}
.nums b{display:block;font-family:Martel,serif;font-weight:800;font-size:12pt;color:var(--chai);line-height:1.2}
.nums span{display:block;font-size:7pt;line-height:1.25;color:var(--mute)}
.price{display:grid;grid-template-columns:1.25fr 1fr;gap:2mm}
.price .card{padding:2.8mm 3.2mm}
.price h3{font-size:9.5pt;display:flex;align-items:baseline;gap:1.6mm;flex-wrap:wrap}
.price h3 small{font-family:Mukta,sans-serif;font-weight:500;font-size:6.8pt;color:var(--mute)}
.price .amt{font-family:Martel,serif;font-weight:800;font-size:13pt;color:var(--chai)}
.price .per{font-size:6.8pt;color:var(--mute)}
.ticks{margin-top:1mm}
.ticks li{font-size:8.1pt;line-height:1.3;margin-top:.9mm}
.ticks li .ic{width:3mm;height:3mm;margin-top:.5mm}
.cta{margin-top:auto;padding:3mm;gap:3.5mm}
.cta .qrbox{width:31mm;padding:2.2mm}
.cta h2{font-size:14pt}
.hi .cta h2{font-size:12pt;line-height:1.35}
.cta .small{font-size:8.4pt;line-height:1.35;margin-top:1mm}
.cta .url{font-family:Martel,serif;font-weight:800;font-size:12pt;margin-top:1.5mm}
.foot{font-size:6.8pt;text-align:center;color:var(--mute);margin-top:-1.5mm}
"""


def student_side(d):
    pains = "".join(f'<div class="pain"><div class="icb">{IC[i]}</div><div><h3>{h}</h3><p>{p}</p></div></div>' for i, h, p in d["pains"])
    nums = "".join(f'<div class="card"><b>{n}</b><span>{t}</span></div>' for n, t in d["nums"])
    tick = IC["tick"]
    free = "".join(f"<li>{tick}<span>{x}</span></li>" for x in d["free"])
    plus = "".join(f"<li>{tick}<span>{x}</span></li>" for x in d["plus"])
    return f"""
<section class="page {d['lang']}" lang="{d['lang']}">
  <header class="band"><div class="stars"></div>
    <div class="brandrow"><div class="brand">{KULHAD}<span>Aspiran</span></div><span class="pill">{d['langs']}</span></div>
    <p class="kick">{d['kick']}</p>
    <h1>{d['h1']}</h1>
    <p class="lede">{d['lede']}</p>
  </header>
  <div class="body">
    <div class="pains">{pains}</div>
    <div class="nums">{nums}</div>
    <div class="price">
      <div class="card"><h3>{d['free_h']} <small>{d['free_note']}</small></h3><ul class="ticks">{free}</ul></div>
      <div class="card"><h3>{d['plus_h']} <span class="amt">{d['plus_price']}</span></h3><p class="per">{d['plus_per']}</p><ul class="ticks">{plus}</ul></div>
    </div>
    <div class="cta">
      <div class="qrbox">{qr('student-' + d['lang'])}</div>
      <div><h2>{d['cta_h']}</h2><p class="small">{d['cta_p']}</p><p class="url">{d['url']}</p></div>
    </div>
    <p class="foot">{d['foot']}</p>
  </div>
</section>"""


# ---------------------------------------------------------------- centres (A4)
CENTRE = {
    "en": dict(
        lang="en", kick="For UPSC coaching centres and study libraries", langs="English · हिंदी",
        h1='Your teachers teach.<br><span class="glow">Aspiran makes it stay.</span>',
        lede="Give every student Aspiran with your centre’s name on it. What you taught comes back to them before they forget it, their answers are marked in minutes, and you see who has gone quiet before they drop out.",
        pills=["Free 30-day pilot", "Hindi and English", "Web and Android"],
        gets_h="What your centre gets",
        gets=[
            ("brand", "Your name, your colour", "Students join with your code; from then on the app shows your logo and colour, with “with Aspiran” under it."),
            ("mark", "Every answer, marked in minutes", "Students write answers daily and get marks on five parts, with a fix for each. A teacher view to confirm marks is being built with our first centres."),
            ("quiet", "Who has gone quiet", "Weak topics per batch, and the students who haven’t turned up for a few days, so you can talk to them before they drop out."),
            ("chat", "Batch chat and announcements", "Each batch has its own chat, with announcements pinned at the top. Teachers can hide messages and see what was reported."),
            ("doubt", "Doubts and study plans", "Students ask doubts, teachers answer. Day-by-day plans for a batch or for one student."),
            ("book", "Your own material", "Add your notes and question sets, for one batch or all, next to Aspiran’s library."),
        ],
        also_h="Plus everything Aspiran gives every student",
        nums=[("1,797", "PYQs on UPSC’s keys"), ("2,000+", "practice questions"), ("400+", "short videos"), ("25+ hrs", "audio notes"), ("Daily", "review and current affairs")],
        prom_h="Our promises to you",
        promises=["We never sell to your students or show them ads", "Your students never see another centre",
                  "Your centre’s data is yours; download it as CSV", "A student’s private space (pod, journal, notes) stays private, from you too",
                  "No lock-in: leave whenever you like"],
        steps_h="How it starts",
        steps=[("A 15-minute call", "Your batches, your students and what you need."), ("We set up your centre", "Your name, logo, batches and joining codes, in a day."),
               ("A free 30-day pilot", "With one or two batches. We look at what’s working with you each week."),
               ("Then you decide", "A price for your size after the pilot. If it doesn’t fit, you owe nothing.")],
        cta_h="Start a free 30-day pilot", cta_p="Scan to see what students see and to book the 15-minute call. We reply within two working days.",
        url="aspiran.in/for-coaching", mail="hello@aspiran.in", wa="WhatsApp +91 98766 56573",
        contact="Your Aspiran contact", foot="Hindi on the back · हिंदी पीछे है",
    ),
    "hi": dict(
        lang="hi", kick="UPSC कोचिंग संस्थानों और स्टडी लाइब्रेरी के लिए", langs="हिंदी · English",
        h1='आपके शिक्षक पढ़ाते हैं।<br><span class="glow">Aspiran याद रखवाता है।</span>',
        lede="हर छात्र को आपके संस्थान के नाम के साथ Aspiran दीजिए। आपने जो पढ़ाया, वह भूलने से पहले उनके पास लौटता है, उनके उत्तर मिनटों में जँचते हैं, और छोड़ने से पहले आपको पता चलता है कि कौन चुप हो गया।",
        pills=["30 दिन का मुफ़्त पायलट", "हिंदी और अंग्रेज़ी", "वेब और Android"],
        gets_h="आपके संस्थान को क्या मिलता है",
        gets=[
            ("brand", "आपका नाम, आपका रंग", "छात्र आपके कोड से जुड़ते हैं; उसके बाद ऐप में आपका लोगो और रंग दिखता है, “with Aspiran” के साथ।"),
            ("mark", "हर उत्तर, मिनटों में जँचा", "छात्र रोज़ उत्तर लिखते हैं और मिनटों में पाँच हिस्सों पर अंक और सुधार पाते हैं। शिक्षकों के लिए अंक पक्के करने का व्यू हम अपने पहले संस्थानों के साथ बना रहे हैं।"),
            ("quiet", "कौन चुप हो गया", "हर बैच के कमज़ोर टॉपिक और वे छात्र जो कुछ दिनों से नहीं आए, ताकि छोड़ने से पहले आप बात कर सकें।"),
            ("chat", "बैच चैट और घोषणाएँ", "हर बैच का अपना चैट, ऊपर पिन की हुई घोषणाएँ। शिक्षक संदेश छिपा सकते हैं और रिपोर्ट देख सकते हैं।"),
            ("doubt", "डाउट और स्टडी प्लान", "छात्र डाउट पूछते हैं, शिक्षक जवाब देते हैं। बैच या एक छात्र के लिए दिन-दर-दिन प्लान।"),
            ("book", "आपकी अपनी सामग्री", "अपने नोट्स और सवालों के सेट डालिए, एक बैच के लिए या सबके लिए, Aspiran की लाइब्रेरी के साथ।"),
        ],
        also_h="साथ में वह सब जो Aspiran हर छात्र को देता है",
        nums=[("1,797", "PYQ, UPSC की आंसर-की के साथ"), ("2,000+", "प्रैक्टिस सवाल"), ("400+", "छोटे वीडियो"), ("25+ घंटे", "ऑडियो नोट्स"), ("रोज़", "रिव्यू और करंट अफ़ेयर्स")],
        prom_h="आपसे हमारे वादे",
        promises=["हम आपके छात्रों को कभी कुछ नहीं बेचते, न उन्हें कोई विज्ञापन दिखाते हैं", "आपके छात्रों को कभी कोई दूसरा संस्थान नहीं दिखेगा",
                  "आपके संस्थान का डेटा आपका है; आप CSV में ले जा सकते हैं", "छात्र की निजी चीज़ें (पॉड, जर्नल, नोट्स) निजी रहती हैं, आपसे भी",
                  "कोई लॉक-इन नहीं: जब चाहें छोड़ दीजिए"],
        steps_h="शुरुआत कैसे होती है",
        steps=[("15 मिनट की बात", "आपके बैच, छात्र और आप क्या चाहते हैं।"), ("हम संस्थान सेट करते हैं", "आपका नाम, लोगो, बैच और जुड़ने के कोड, एक दिन में।"),
               ("30 दिन का मुफ़्त पायलट", "एक या दो बैच के साथ। हम हर हफ़्ते देखते हैं कि क्या काम कर रहा है।"),
               ("फिर आप तय कीजिए", "पायलट के बाद आपके आकार के हिसाब से क़ीमत। न जमे तो कुछ नहीं देना।")],
        cta_h="30 दिन का मुफ़्त पायलट शुरू कीजिए", cta_p="स्कैन करके देखिए छात्र क्या देखते हैं, और 15 मिनट की बात तय कीजिए। हम दो कामकाजी दिनों में जवाब देते हैं।",
        url="aspiran.in/hi/for-coaching", mail="hello@aspiran.in", wa="WhatsApp +91 98766 56573",
        contact="आपके Aspiran संपर्क", foot="English on the back · अंग्रेज़ी पीछे है",
    ),
}

CENTRE_CSS = r"""
:root{--w:210mm;--h:297mm}
@page{size:210mm 297mm;margin:0}
.band{padding:8mm 12mm 6.5mm}
.brand{font-size:20pt}
.brandrow .pill{font-size:9pt}
.kick{font-size:9pt;margin:4.5mm 0 1.4mm}
h1{font-size:27pt}
.hi h1{font-size:25pt;line-height:1.3}
.lede{font-size:10.8pt;line-height:1.42;margin-top:2.5mm;max-width:176mm}
.pills{display:flex;gap:2mm;margin-top:3.5mm;flex-wrap:wrap}
.pills .pill{font-size:9pt;border-color:var(--saffron);color:var(--saffron)}
.mono .pills .pill{border-color:#000;color:#000}
.body{flex:1;display:flex;flex-direction:column;padding:5mm 12mm 5mm;gap:3.4mm}
h2.sec{font-size:13.5pt;color:var(--ink)}
.gets{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2.6mm;margin-top:-1.5mm}
.get{padding:3mm 3.2mm}.get .hd{display:flex;align-items:center;gap:2.2mm;margin-bottom:1.4mm}
.get .icb{flex:0 0 8mm;width:8mm;height:8mm;border-radius:2mm;background:var(--soft);color:var(--chai);padding:1.4mm}
.mono .get .icb{border:0.35mm solid #000}
.get h3{font-size:10pt;line-height:1.2;color:var(--chai)}
.hi .get h3{font-size:10pt;line-height:1.35}
.get p{font-size:8.5pt;line-height:1.38}
.also{display:flex;align-items:center;gap:3mm;flex-wrap:wrap;margin-top:-1mm}
.also h3{font-family:Mukta,sans-serif;font-weight:700;font-size:9pt;color:var(--mute);width:100%}
.nums{display:grid;grid-template-columns:repeat(5,1fr);gap:2.4mm;width:100%}
.nums div{padding:1.6mm 2mm;text-align:center}
.nums b{display:block;font-family:Martel,serif;font-weight:800;font-size:13pt;color:var(--chai);line-height:1.25}
.nums span{display:block;font-size:7.6pt;line-height:1.3;color:var(--mute)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.two .card{padding:3.2mm 3.6mm}
.two h2{font-size:12pt;margin-bottom:1.5mm}
.ticks li{font-size:9pt;line-height:1.33;margin-top:1.1mm}
.ticks li .ic{width:3.6mm;height:3.6mm;margin-top:.5mm}
.steps{list-style:none;counter-reset:s}
.steps li{counter-increment:s;display:grid;grid-template-columns:6mm 1fr;gap:2mm;margin-top:1mm;font-size:8.8pt;line-height:1.32}
.steps li::before{content:counter(s);width:5.5mm;height:5.5mm;border-radius:50%;background:var(--chai);color:#fff;font-weight:700;font-size:8.5pt;display:flex;align-items:center;justify-content:center}
.mono .steps li::before{background:#fff;color:#000;border:0.35mm solid #000}
.steps b{display:block;font-weight:700}
.steps span{color:var(--mute)}
.cta{margin-top:auto;padding:4mm;gap:5mm}
.cta .qrbox{width:33mm;padding:2.4mm}
.cta h2{font-size:17pt}
.hi .cta h2{font-size:15.5pt;line-height:1.35}
.cta .small{font-size:9.4pt;line-height:1.4;margin-top:1.5mm;max-width:95mm}
.cta .url{font-family:Martel,serif;font-weight:800;font-size:13pt;margin-top:2mm}
.cta .reach{font-size:9.4pt;margin-top:.8mm}
.cta .main{flex:1}
.cta .contact{flex:0 0 48mm;align-self:stretch;background:#fff;color:#2A1B12;border-radius:2mm;padding:3mm 3.5mm;display:flex;flex-direction:column;justify-content:space-between;font-size:8.5pt}
.cta .contact .ln{border-bottom:0.3mm solid #2A1B12;height:7.5mm}
.cta .contact p{color:#6E5A4C;font-weight:500}
.mono .cta .contact{border:0.35mm solid #000}
.mono .cta .contact .ln{border-bottom-color:#000}
.mono .cta .contact p{color:#000}
.foot{font-size:7.5pt;text-align:center;color:var(--mute);margin-top:-1.8mm}
"""


def centre_side(d):
    gets = "".join(f'<div class="card get"><div class="hd"><div class="icb">{IC[i]}</div><h3>{h}</h3></div><p>{p}</p></div>' for i, h, p in d["gets"])
    nums = "".join(f'<div class="card"><b>{n}</b><span>{t}</span></div>' for n, t in d["nums"])
    tick = IC["tick"]
    prom = "".join(f"<li>{tick}<span>{x}</span></li>" for x in d["promises"])
    steps = "".join(f"<li><div><b>{h}</b><span>{p}</span></div></li>" for h, p in d["steps"])
    pills = "".join(f'<span class="pill">{p}</span>' for p in d["pills"])
    return f"""
<section class="page {d['lang']}" lang="{d['lang']}">
  <header class="band"><div class="stars"></div>
    <div class="brandrow"><div class="brand">{KULHAD}<span>Aspiran</span></div><span class="pill">{d['langs']}</span></div>
    <p class="kick">{d['kick']}</p>
    <h1>{d['h1']}</h1>
    <p class="lede">{d['lede']}</p>
    <div class="pills">{pills}</div>
  </header>
  <div class="body">
    <h2 class="sec">{d['gets_h']}</h2>
    <div class="gets">{gets}</div>
    <div class="also"><h3>{d['also_h']}</h3><div class="nums">{nums}</div></div>
    <div class="two">
      <div class="card"><h2>{d['prom_h']}</h2><ul class="ticks">{prom}</ul></div>
      <div class="card"><h2>{d['steps_h']}</h2><ol class="steps">{steps}</ol></div>
    </div>
    <div class="cta">
      <div class="qrbox">{qr('centre-' + d['lang'])}</div>
      <div class="main"><h2>{d['cta_h']}</h2><p class="small">{d['cta_p']}</p><p class="url">{d['url']}</p>
        <p class="reach">{d['mail']} · {d['wa']}</p></div>
      <div class="contact"><p>{d['contact']}</p><div class="ln"></div><div class="ln"></div></div>
    </div>
    <p class="foot">{d['foot']}</p>
  </div>
</section>"""


def page(title, css, body, mono):
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>
<style>{CSS}{css}</style><script>addEventListener("load",()=>{{document.documentElement.dataset.fit=[...document.querySelectorAll(".body")].some(b=>b.scrollHeight>b.clientHeight+1)?"OVERFLOW":"fits"}})</script></head><body class="{'mono' if mono else ''}">{body}</body></html>"""


for mono in (False, True):
    tag = "mono" if mono else "colour"
    VARIANT = tag
    (OUT / f"students-A5-{tag}.html").write_text(page("Aspiran for students", STUDENT_CSS, student_side(STUDENT["en"]) + student_side(STUDENT["hi"]), mono))
    (OUT / f"centres-A4-{tag}.html").write_text(page("Aspiran for coaching centres", CENTRE_CSS, centre_side(CENTRE["en"]) + centre_side(CENTRE["hi"]), mono))
    # Students, two A5 on one A4 sheet (landscape): print double-sided, cut down the middle.
    two_css = STUDENT_CSS.replace("@page{size:148mm 210mm;margin:0}", "@page{size:297mm 210mm;margin:0}") + \
        ".sheet{width:297mm;height:210mm;display:flex;page-break-after:always;break-after:page}.sheet:last-child{page-break-after:auto}" \
        ".sheet .page{page-break-after:auto;break-after:auto;border-right:0.2mm dashed #bbb}.sheet .page+.page{border-right:0;border-left:0.2mm dashed #bbb}"
    en, hi = student_side(STUDENT["en"]), student_side(STUDENT["hi"])
    (OUT / f"students-2up-on-A4-{tag}.html").write_text(page("Aspiran for students, 2 per A4", two_css,
        f'<div class="sheet">{en}{en}</div><div class="sheet">{hi}{hi}</div>', mono))
print("ok", sorted(p.name for p in OUT.iterdir()))
