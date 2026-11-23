"""Lay out Aspiran workbooks (JSON, aspiran/workbook@1) as A4 print pages, English and Hindi editions.
Usage: <python with segno> build_workbooks.py <artefacts/books> <content/pyq/pyq.json>
Writes <book>/<book>-en.html and -hi.html; render.sh prints them to PDF with Chrome.
Fonts are local (../fonts). QR codes are drawn here as inline SVG: https://aspiran.in/?src=wb-<book>-ch<n>."""
import html, io, json, pathlib, re, sys
import segno

ROOT = pathlib.Path(sys.argv[1]); PYQ = json.load(open(sys.argv[2]))
PAPERS = {p["id"]: p for p in PYQ["papers"]}
QS = {(p["id"], q["n"]): q for p in PYQ["papers"] for q in p["questions"]}

def e(s): return html.escape(str(s or ""), quote=True)
def blanks(s):  # escaped text with ____ turned into write-in lines
    return re.sub(r"_{3,}", '<span class="b"></span>', e(s))

def qr(src, lang, size="20mm"):
    url = f"https://aspiran.in/?src={src}" + ("&lang=hi" if lang == "hi" else "")
    buf = io.BytesIO()
    segno.make(url, error="m").save(buf, kind="svg", scale=1, border=0, dark="#2A1B12", xmldecl=False, svgns=True, nl=False)
    svg = re.sub(r'width="\d+" height="\d+"', f'width="{size}" height="{size}"', buf.getvalue().decode(), count=1)
    return svg

# ---------------------------------------------------------------- words on the page (not from the JSON)
UI = {
 "en": dict(
  brand="Aspiran · Workbook", chapter="Chapter", part="Part", youwill="By the end you can", before="Before you read",
  conf="How sure do I feel?", qr_t="Check your answers in the app", qr_p="Scan to open aspiran.in. Practise this chapter's questions there, and revise with your pod.",
  fill="Fill-in notes", fill_do="Read your main book first. Then close it and fill every gap in pencil. Check against the key at the back, then go over in ink.",
  mynotes="My notes", trap="The usual mistake", build="Build it", draw="Draw it from this description", label="Labels to fill",
  words="In your own words", term="Term", mywords="My words, and an example", bank="Word bank", recall="Recall",
  upsc="Practise", why="because", myans="My answer", pyqs="UPSC has asked about this chapter", tried="Tried", gotit="Got it",
  mains="Mains answer", plan="Plan it (about five minutes)", miss="What most answers miss", example="An Indian example to use",
  write="Write your answer", selfcheck="Check your answer", wrote="Wrote it on", rewrote="Rewrote it on",
  news="News log", date="Date", what="What happened (one line)", fits="Where it fits", source="Source", clip="Paste a clipping here",
  start_ex="An example to start with", close="Close the loop", asof="", sources="Primary sources for this chapter",
  key="Answer key", key_do="Check after you have tried. Pencil first, then ink.",
  belongs="This workbook belongs to", attempt="Attempt I'm preparing for", started="I started this book on",
  return_="If found, please return. It holds months of someone's work.",
  contents="Contents", where="Where I stand, chapter by chapter", pass1="1st pass", pass2="2nd pass", pass3="Final month",
  found="Found a mistake? Tell us at aspiran.in; the next copy printed will carry the fix. Maps in Aspiran books are schematic and show no national borders. © 2026 Aspiran.",
  mains_lbl="UPSC Mains", prelims_lbl="UPSC Prelims", q="Q", marks="marks", words_="words", series="",
  about="Aspiran is a study app for UPSC aspirants: small pods that revise together, daily current-affairs cards, and practice that remembers what you got wrong.",
  scan="Scan for the app", english_hindi="English · हिन्दी",
 ),
 "hi": dict(
  brand="Aspiran · वर्कबुक", chapter="अध्याय", part="भाग", youwill="इस अध्याय के बाद आप", before="पढ़ने से पहले",
  conf="मुझे कितना भरोसा है?", qr_t="App में अपने उत्तर जाँचिए", qr_p="Scan करके aspiran.in खोलिए। वहाँ इस अध्याय के प्रश्नों का अभ्यास कीजिए और अपने pod के साथ दोहराइए।",
  fill="भरने वाले notes", fill_do="पहले अपनी मुख्य किताब पढ़िए। फिर उसे बंद करके हर ख़ाली जगह पेंसिल से भरिए। पीछे दी गई key से मिलाइए, फिर पेन से लिखिए।",
  mynotes="मेरे notes", trap="आम ग़लती", build="ख़ुद बनाइए", draw="इस विवरण से चित्र बनाइए", label="भरने वाले लेबल",
  words="अपने शब्दों में", term="शब्द", mywords="मेरे शब्द, और एक उदाहरण", bank="शब्द-बैंक", recall="याद कीजिए",
  upsc="अभ्यास", why="क्योंकि", myans="मेरा उत्तर", pyqs="UPSC ने इस अध्याय से पूछा है", tried="किया", gotit="समझ गया",
  mains="Mains उत्तर", plan="योजना बनाइए (लगभग पाँच मिनट)", miss="ज़्यादातर उत्तर क्या छोड़ देते हैं", example="इस्तेमाल के लिए एक भारतीय उदाहरण",
  write="अपना उत्तर लिखिए", selfcheck="अपना उत्तर जाँचिए", wrote="लिखा", rewrote="दोबारा लिखा",
  news="समाचार लॉग", date="तारीख़", what="क्या हुआ (एक पंक्ति)", fits="कहाँ जुड़ता है", source="स्रोत", clip="यहाँ कतरन चिपकाइए",
  start_ex="शुरुआत के लिए एक उदाहरण", close="चक्र पूरा कीजिए", asof="", sources="इस अध्याय के मूल स्रोत",
  key="उत्तर-कुंजी", key_do="पहले ख़ुद कोशिश कीजिए, फिर मिलाइए। पहले पेंसिल, फिर पेन।",
  belongs="यह वर्कबुक इनकी है", attempt="मैं इस प्रयास की तैयारी कर रहा/रही हूँ", started="यह किताब शुरू की",
  return_="मिले तो कृपया लौटा दें। इसमें किसी की महीनों की मेहनत है।",
  contents="विषय-सूची", where="अध्याय-दर-अध्याय, मैं कहाँ हूँ", pass1="पहली बार", pass2="दूसरी बार", pass3="आख़िरी महीना",
  found="कोई ग़लती दिखी? aspiran.in पर बताइए; अगली छपी प्रति में सुधार होगा। Aspiran की किताबों के नक्शे सांकेतिक हैं और उनमें अंतरराष्ट्रीय सीमाएँ नहीं हैं। © 2026 Aspiran.",
  mains_lbl="UPSC मुख्य परीक्षा", prelims_lbl="UPSC प्रारंभिक परीक्षा", q="प्रश्न", marks="अंक", words_="शब्द", series="",
  about="Aspiran, UPSC अभ्यर्थियों के लिए एक study app है: साथ दोहराने वाले छोटे pod, रोज़ के करंट अफ़ेयर्स कार्ड, और ऐसा अभ्यास जो याद रखता है कि आपसे कहाँ ग़लती हुई।",
  scan="App के लिए scan कीजिए", english_hindi="English · हिन्दी",
 ),
}
PAPER = {"en": {"gs1": "GS I", "gs2": "GS II", "gs3": "GS III", "gs4": "GS IV", "essay": "Essay"},
         "hi": {"gs1": "सामान्य अध्ययन I", "gs2": "सामान्य अध्ययन II", "gs3": "सामान्य अध्ययन III", "gs4": "सामान्य अध्ययन IV", "essay": "निबंध"}}

def qnum(n): return re.sub(r"^(\d+)([a-z])$", r"\1(\2)", str(n))
def pyq_label(pid, n, lang, marks=None, words=None):
    p = PAPERS[pid]; u = UI[lang]
    s = f"{u['mains_lbl'] if p['exam'] == 'mains' else u['prelims_lbl']} {p['year']} · {PAPER[lang]['gs1'] if p['exam'] != 'mains' else PAPER[lang].get(p['paper'], p['paper'])} · {u['q']} {qnum(n)}"
    if marks: s += f" · {marks} {u['marks']}"
    if words: s += f" · {words} {u['words_']}"
    return s

CSS = """
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
:root{--paper:#FFFDF9;--ink:#2A1B12;--muted:#6E5A4C;--line:#E4D8C8;--rule:#D9CDBD;--brand:#9A4E0E;--soft:#F6E2C9;
 --ok:#E3EAD9;--okink:#3E5631;--bad:#F8E1DE;--badink:#8A2A1E;--blue:#DCE6EE;--blueink:#2D4A63}
*{box-sizing:border-box}
html,body{margin:0}
body{background:var(--paper);color:var(--ink);font-family:Mukta,sans-serif;font-size:10.4pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:210mm 297mm;margin:14mm 15mm 17mm 15mm;
 @bottom-left{content:"FOOTER";font:500 7pt Mukta,sans-serif;color:#6E5A4C}
 @bottom-right{content:counter(page);font:700 7.5pt Mukta,sans-serif;color:#6E5A4C}}
@page cover{margin:0;@bottom-left{content:none}@bottom-right{content:none}}
.cover{page:cover;width:210mm;height:297mm;position:relative;background:#2A1B12;color:#FFF6EA;overflow:hidden;break-after:page}
.cover .inner{position:absolute;inset:0;padding:22mm 18mm}
.brandline{font:700 8.5pt Mukta,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#F0A04B}
.cover h1{font:800 50pt/1.05 Martel,serif;color:#FFF6EA;margin:8mm 0 0}
.cover .sub{font:500 14pt/1.35 Mukta,sans-serif;color:#F6E2C9;margin-top:4mm;max-width:160mm}
.cover .pill{margin-top:6mm;display:inline-block;font:700 9pt Mukta,sans-serif;border:1pt solid #F0A04B;color:#F0A04B;border-radius:6mm;padding:1mm 4mm}
.cover .foot{position:absolute;left:18mm;right:18mm;bottom:18mm;display:flex;justify-content:space-between;align-items:flex-end;gap:8mm}
.cover .qrbox{background:#FFF6EA;border-radius:2mm;padding:2mm;display:inline-block;line-height:0}
.cover .word{font:800 22pt Martel,serif}
.newpage{break-before:page;padding-top:2.5mm}
html[lang=hi] h1,html[lang=hi] h2,html[lang=hi] h3{line-height:1.45}
h1,h2,h3{font-family:Martel,serif;font-weight:800;line-height:1.2;margin:0}
h2{font-size:16pt;color:var(--brand);margin:0 0 2.5mm}
h3{font-size:11.5pt;margin:5mm 0 2mm;break-after:avoid}
p{margin:0 0 2.2mm}
ul,ol{margin:0 0 2mm;padding-left:5.5mm} li{margin-bottom:1.2mm}
.kicker{font:700 7.6pt Mukta,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--brand);margin-bottom:1.2mm;break-after:avoid}
.do{font:500 9pt Mukta,sans-serif;background:var(--soft);border-left:2.4mm solid var(--brand);padding:2mm 3mm;margin:2mm 0 3mm;border-radius:0 1.5mm 1.5mm 0;break-inside:avoid;break-after:avoid}
.small{font-size:8.4pt;color:var(--muted)}
.box{border-radius:2.2mm;padding:2.8mm 3.4mm;margin:3mm 0;font-size:9.6pt;break-inside:avoid}
.box .tag{font:700 7pt Mukta,sans-serif;letter-spacing:.12em;text-transform:uppercase;display:block;margin-bottom:1mm}
.trap{background:var(--bad)} .trap .tag{color:var(--badink)}
.hook{background:var(--ok)} .hook .tag{color:var(--okink)}
.asks{background:var(--blue)} .asks .tag{color:var(--blueink)}
.note{background:var(--soft)} .note .tag{color:var(--brand)}
.fill{line-height:2.5;font-size:10.8pt}
.b{display:inline-block;border-bottom:.9pt solid var(--ink);min-width:28mm;height:1.05em;position:relative;margin:0 .6mm;vertical-align:baseline}
.b[data-n]::before{content:attr(data-n);position:absolute;left:0;top:-3.4mm;font:700 6pt Mukta,sans-serif;color:var(--brand)}
.lines{background-image:repeating-linear-gradient(to bottom,transparent 0,transparent calc(8mm - .5pt),var(--rule) calc(8mm - .5pt),var(--rule) 8mm);break-inside:avoid}
.lines.tight{background-image:repeating-linear-gradient(to bottom,transparent 0,transparent calc(6.5mm - .5pt),var(--rule) calc(6.5mm - .5pt),var(--rule) 6.5mm)}
.dots{background-image:radial-gradient(circle,#C9BCA9 .55pt,transparent .7pt);background-size:5mm 5mm;border:.6pt solid var(--line);border-radius:2mm;break-inside:avoid}
.two{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
table{border-collapse:collapse;width:100%;font-size:9.2pt}
thead{display:table-header-group}
tr{break-inside:avoid}
th{font:700 7.2pt Mukta,sans-serif;letter-spacing:.05em;text-transform:uppercase;text-align:left;color:var(--muted);border-bottom:1pt solid var(--ink);padding:1.4mm}
td{border-bottom:.6pt solid var(--rule);padding:1.4mm;vertical-align:top}
table.write td{height:12mm}
table.write td.given{color:var(--okink);font-weight:500}
.chip{display:inline-block;font:700 9pt Mukta,sans-serif;border:.9pt solid var(--ink);border-radius:5mm;padding:.4mm 2.6mm;margin:0 1.2mm 1.6mm 0}
.wbank{border:.8pt solid var(--line);border-radius:2mm;padding:2.2mm 3mm .6mm;margin:2mm 0 3mm;break-inside:avoid}
.wbank .lbl{font:700 7pt Mukta,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:1.4mm}
.qrcard{display:flex;gap:4mm;align-items:center;border:1pt dashed var(--brand);border-radius:2.5mm;padding:2.5mm 3.5mm;margin-top:4mm;break-inside:avoid}
.qrcard svg{flex:none}
.qrcard b{font-family:Martel,serif;font-size:10pt;display:block}
.band{background:var(--brand);color:#FFF6EA;padding:8mm 9mm 7mm;border-radius:3mm;position:relative;margin-bottom:5mm;break-inside:avoid}
.band .kicker{color:#F6E2C9}
.band h1{font-size:24pt;color:#FFF6EA;margin-top:1mm;max-width:128mm}
.band p{color:#FFF6EA;font-size:10.5pt;margin:2.5mm 0 0;max-width:135mm}
.band .num{position:absolute;right:8mm;top:4mm;font:800 56pt Martel,serif;opacity:.22;line-height:1}
.circ{display:inline-flex;gap:6mm;font:500 8pt Mukta,sans-serif;color:var(--muted)}
.circ span{display:inline-flex;align-items:center;gap:1.5mm}
.circ i,.dot3 i{width:5mm;height:5mm;border:.9pt solid var(--muted);border-radius:50%;display:inline-block}
.dot3{display:inline-flex;gap:2.5mm}
.q{break-inside:avoid;margin:0 0 4.5mm}
.q .stem{font-weight:500}
.q .st{margin:1.2mm 0 0 3mm}
.why{display:flex;gap:2mm;align-items:flex-end;font:700 7.4pt Mukta,sans-serif;color:var(--brand);margin:.6mm 0 1mm 3mm;text-transform:uppercase;letter-spacing:.05em}
.why .ln{flex:1;border-bottom:.6pt solid var(--rule);height:6mm}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:.6mm 6mm;margin:1.6mm 0 0 3mm;font-size:9.6pt}
.mine{font:700 7.6pt Mukta,sans-serif;color:var(--muted);margin:1.6mm 0 0 3mm}
.mine i{display:inline-block;width:14mm;border-bottom:.8pt solid var(--muted);margin-left:1.5mm}
.qbox{border:1.2pt solid var(--ink);border-radius:2.5mm;padding:3mm 4mm;margin:2mm 0 4mm;break-inside:avoid}
.qbox .ref{font:700 7.4pt Mukta,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--brand);margin-bottom:1.2mm}
.qbox .text{font-family:Martel,serif;font-weight:800;font-size:11pt;line-height:1.45}
.plan li{margin-bottom:2.6mm}
.plan li .lines{height:8mm;margin-top:.5mm}
.pp h3{margin:3mm 0 1mm}
.check{display:flex;flex-direction:column;gap:1.4mm;font-size:9.4pt;margin:1mm 0 3mm}
.check span::before{content:"";display:inline-block;width:3.4mm;height:3.4mm;border:.9pt solid var(--muted);border-radius:.6mm;margin-right:2mm;vertical-align:-.5mm}
.dates{display:flex;gap:6mm;font:700 8pt Mukta,sans-serif;color:var(--muted);align-items:center;margin-top:3mm;break-inside:avoid}
.dates i{display:inline-block;border-bottom:.8pt solid var(--muted);width:24mm;margin-left:1.5mm}
.clip{border:1pt dashed var(--rule);border-radius:2mm;height:45mm;display:flex;align-items:center;justify-content:center;font:500 8.5pt Mukta,sans-serif;color:var(--muted);margin-top:3mm;break-inside:avoid}
.asof{font-size:8pt;color:var(--muted);border-top:.6pt solid var(--line);padding-top:2mm;margin-top:5mm;break-inside:avoid}
.key{columns:2;column-gap:7mm;font-size:8.6pt;line-height:1.4}
.key h4{font:800 9pt Martel,serif;color:var(--brand);margin:3mm 0 1mm;break-after:avoid}
.key p{margin:0 0 1.4mm;break-inside:avoid}
.key b{font-weight:700;color:var(--brand)}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:0}
.card{height:58mm;border:1pt dashed #B9AC9C;display:grid;grid-template-columns:1fr 1fr;break-inside:avoid}
.card>div{padding:3mm 3.5mm;font-size:9.6pt;overflow:hidden}
.card>div:first-child{border-right:.8pt dotted var(--brand)}
.card .lbl{font:700 6.6pt Mukta,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:1.5mm}
.card .front{font-family:Martel,serif;font-weight:800;font-size:9.6pt}
.cal{table-layout:fixed}
.cal td{height:16mm;border:.6pt solid var(--rule)}
.cal th{text-align:center;border:none}
.idx{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm}
.idx div{border:.6pt solid var(--rule);border-radius:1.5mm;height:30mm;padding:1mm 2mm;font:800 11pt Martel,serif;color:var(--brand);break-inside:avoid}
.node{font:500 7pt Mukta,sans-serif;color:var(--muted)}
.topicrow td{background:var(--soft);font-weight:700;border-bottom:none}
.circles{white-space:nowrap;text-align:center}
"""

def page(lang, title, footer, body):
    return (f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><title>{e(title)}</title>'
            f'<style>{CSS.replace("FOOTER", footer.replace(chr(34), ""))}</style></head><body>{body}</body></html>')

def cover(lang, title, sub, foot_left, src, extra=""):
    u = UI[lang]
    return f"""<section class="cover"><svg viewBox="0 0 794 1123" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">
<defs><pattern id="d" width="19" height="19" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#F0A04B" opacity=".2"/></pattern></defs><rect width="794" height="1123" fill="url(#d)"/>
<g transform="translate(170 520) rotate(-4)"><rect width="460" height="330" rx="8" fill="#FFFDF9"/>
<g stroke="#D9CDBD" stroke-width="1.4">{''.join(f'<line x1="40" y1="{60+i*34}" x2="420" y2="{60+i*34}"/>' for i in range(8))}</g>
<g fill="none" stroke="#9A4E0E" stroke-width="3" stroke-linecap="round"><path d="M50 52 q40 -14 80 0 t80 0"/><path d="M50 120 q30 -10 60 0"/><path d="M160 120 l90 0"/></g>
<g fill="none" stroke="#2D4A63" stroke-width="2.2"><circle cx="380" cy="190" r="14"/><circle cx="380" cy="230" r="14"/><path d="M366 230 a14 14 0 0 1 14 -14 v28 a14 14 0 0 1 -14 -14" fill="#2D4A63"/></g>
<ellipse cx="128" cy="262" rx="88" ry="20" fill="none" stroke="#C9772B" stroke-width="2.4"/></g></svg>
<div class="inner"><div class="brandline">{e(u['brand'])}</div><h1>{e(title)}</h1><div class="sub">{e(sub)}</div><div class="pill">{e(u['english_hindi'])}</div>{extra}</div>
<div class="foot"><div style="display:flex;gap:5mm;align-items:center"><span class="qrbox">{qr(src, lang, "24mm")}</span>
<div style="font:600 10pt Mukta,sans-serif;color:#F6E2C9">aspiran.in<br><span style="font-weight:400;opacity:.85">{e(u['scan'])}</span><br><span style="font-weight:400;opacity:.85">{e(foot_left)}</span></div></div>
<div class="word">Aspiran</div></div></section>"""

def qrcard(src, lang):
    u = UI[lang]
    return f'<div class="qrcard">{qr(src, lang)}<div><b>{e(u["qr_t"])}</b><span class="small">{e(u["qr_p"])}</span></div></div>'

def lines(h, tight=False): return f'<div class="lines{" tight" if tight else ""}" style="height:{h}mm"></div>'
def circ(labels): return '<span class="circ">' + "".join(f"<span><i></i>{e(l)}</span>" for l in labels) + "</span>"

def belongs(lang, colour_rows, marks_note):
    u = UI[lang]
    colour = {"en": ("Your own colour code", "Pick four highlighters and write what each colour means. Use the same code everywhere in this book.", "Colour", "I use it for"),
              "hi": ("आपका अपना रंग-कोड", "चार highlighter चुनिए और लिखिए कि हर रंग का क्या मतलब है। पूरी किताब में यही कोड रखिए।", "रंग", "मैं इसका उपयोग करता/करती हूँ")}[lang]
    rows = "".join(f'<tr><td><span style="display:inline-block;width:14mm;height:5mm;border:.8pt dashed var(--muted);border-radius:1mm"></span></td><td></td><td class="small">{e(r)}</td></tr>' for r in colour_rows)
    return f"""<section><div class="kicker">{e(u['brand'])}</div><h2>{e(u['belongs'])}</h2>{lines(16)}
<div class="two small" style="margin-top:2mm"><div>{e(u['attempt'])}{lines(9)}</div><div>{e(u['started'])}{lines(9)}</div></div>
<p class="small" style="margin-top:1mm">{e(u['return_'])}</p>
<h3>{e(colour[0])}</h3><div class="do">{e(colour[1])}</div>
<table class="write"><thead><tr><th style="width:22%">{e(colour[2])}</th><th>{e(colour[3])}</th><th style="width:40%"></th></tr></thead>{rows}</table>
{marks_note}</section>"""

MARKS = {"en": ("Margin marks", ["★ asked in a past UPSC paper", "? doubt: ask your pod", "! I keep forgetting this", "↔ links to another chapter (write the page)", "N seen in the news (log it)", "✓ sorted, I know this now"]),
         "hi": ("हाशिये के निशान", ["★ UPSC के पिछले प्रश्नपत्र में पूछा गया", "? संदेह: अपने pod से पूछिए", "! यह मैं बार-बार भूलता/भूलती हूँ", "↔ दूसरे अध्याय से जुड़ता है (पेज लिखिए)", "N ख़बरों में देखा (log कीजिए)", "✓ अब पक्का है"])}
def marks_html(lang):
    t, items = MARKS[lang]
    return f'<h3>{e(t)}</h3><div class="two" style="font-size:9.6pt"><div>{"<br>".join(e(x) for x in items[:3])}</div><div>{"<br>".join(e(x) for x in items[3:])}</div></div>'

# ================================================================ B2: subject workbook (chapters)
def fill_text(text, key, lang):
    width = {k["n"]: len(k[lang]) for k in key}
    def rep(m):
        n = int(m.group(1)); w = max(20, min(62, int(width.get(n, 10) * 2.1)))
        return f'<span class="b" data-n="{n}" style="min-width:{w}mm"></span>'
    return re.sub(r"\{\{(\d+)\}\}", rep, e(text))

def block_html(b, ch, lang, num):
    u = UI[lang]; t = b["type"]; d = b.get(lang, {})
    if t == "fillin":
        return (f'<section class="newpage"><div class="kicker">{num} · {e(u["fill"])}</div><h2>{e(d["title"])}</h2>'
                f'<div class="do">{e(u["fill_do"])}</div><div class="fill"><p>{fill_text(d["text"], b["key"], lang)}</p></div>'
                f'<h3>{e(u["mynotes"])}</h3>{lines(40)}</section>')
    if t == "diagram":
        labs = "".join(f"<li>{blanks(x)}</li>" for x in d.get("labels", []))
        return (f'<section class="newpage"><div class="kicker">{num} · {e(u["build"])}</div><h2>{e(d["title"])}</h2>'
                f'<div class="do">{e(d.get("task", ""))}</div><div class="box note"><span class="tag">{e(u["draw"])}</span>{e(d["describe"])}</div>'
                f'<div class="dots" style="height:92mm"></div><h3>{e(u["label"])}</h3><ul style="list-style:none;padding:0;line-height:2.15">{labs}</ul></section>')
    if t == "own-words":
        rows = "".join(f'<tr><td style="width:32%"><b>{e(x)}</b></td><td></td></tr>' for x in d["terms"])
        return (f'<section style="margin-top:6mm"><div class="kicker">{num} · {e(u["words"])}</div><h2>{e(d["title"])}</h2>'
                f'<div class="do">{e(d.get("prompt", ""))}</div><table class="write" style="--h:16mm"><thead><tr><th>{e(u["term"])}</th><th>{e(u["mywords"])}</th></tr></thead>'
                f'{rows.replace("<td></td>", "<td style=\"height:17mm\"></td>")}</table></section>')
    if t in ("sort", "timeline"):
        tb = d["table"]; cols = tb["columns"]
        head = "".join(f"<th>{e(c)}</th>" for c in cols)
        body = "".join("<tr>" + "".join(f'<td class="{"given" if c and i > 0 else ""}" style="{"width:16%" if i == 0 and t == "timeline" else ""}">{e(c)}</td>' for i, c in enumerate(r)) + "</tr>" for r in tb["rows"])
        bank = "".join(f'<span class="chip">{e(w)}</span>' for w in d.get("wordBank", []))
        return (f'<section class="newpage"><div class="kicker">{num} · {e(u["build"])}</div><h2>{e(d["title"])}</h2><div class="do">{e(d["task"])}</div>'
                f'<div class="wbank"><div class="lbl">{e(u["bank"])}</div>{bank}</div><table class="write"><thead><tr>{head}</tr></thead>{body}</table></section>')
    if t == "recall":
        qs = "".join(f'<li style="break-inside:avoid">{e(q)}{lines(13, True)}</li>' for q in d["questions"])
        return f'<section class="newpage"><div class="kicker">{num} · {e(u["recall"])}</div><h2>{e(d["title"])}</h2><ol>{qs}</ol></section>'
    if t == "upsc":
        out = [f'<section class="newpage"><div class="kicker">{num} · {e(u["upsc"])}</div><h2>{e(d["title"])}</h2>']
        for i, q in enumerate(b["questions"], 1):
            qq = q[lang]; sts = qq.get("statements", [])
            why = f'<div class="why">{e(u["why"])}<span class="ln"></span></div>'
            body = "".join(f'<div class="st">{e(s)}</div>{why}' for s in sts)
            opts = "".join(f"<div>{e(o)}</div>" for o in qq["options"])
            extra = "" if sts else why * 2
            out.append(f'<div class="q"><div class="stem">{i}. {e(qq["stem"])}</div>{body}<div class="opts">{opts}</div>{extra}<div class="mine">{e(u["myans"])}<i></i></div></div>')
        pq = ch.get("pastQuestions", [])
        if pq:
            rows = []
            for p in pq:
                q = QS[(p["id"], p["n"])]; txt = (q.get(lang) or q["en"])["q"].split("\n")[0]
                rows.append(f'<tr><td style="width:30%" class="small">{e(pyq_label(p["id"], p["n"], lang))}</td><td>{e(txt[:150] + ("…" if len(txt) > 150 else ""))}</td><td style="width:9%"><span class="dot3"><i></i></span></td><td style="width:9%"><span class="dot3"><i></i></span></td></tr>')
            out.append(f'<div style="break-inside:avoid"><h3>★ {e(u["pyqs"])}</h3><table><thead><tr><th></th><th></th><th>{e(u["tried"])}</th><th>{e(u["gotit"])}</th></tr></thead>{"".join(rows)}</table></div>')
        out.append("</section>")
        return "".join(out)
    if t == "mains":
        p = b["pyq"]
        plan = "".join(f"<li>{blanks(x)}{lines(8)}</li>" for x in d["planningBox"])
        chk = "".join(f"<span>{e(x)}</span>" for x in d["selfCheck"])
        return (f'<section class="newpage"><div class="kicker">{num} · {e(u["mains"])}</div>'
                f'<div class="qbox"><div class="ref">{e(pyq_label(p["id"], p["n"], lang, p.get("marks"), p.get("words")))}</div><div class="text">{e(d["question"])}</div></div>'
                f'<h3>{e(u["plan"])}</h3><ol class="plan">{plan}</ol>'
                f'<div class="box trap"><span class="tag">{e(u["miss"])}</span>{e(d["whatMostAnswersMiss"])}</div>'
                f'<div class="box hook"><span class="tag">{e(u["example"])}</span>{e(d["indianExample"])}</div></section>'
                f'<section class="newpage"><h3 style="margin-top:0">{e(u["write"])}</h3>{lines(184)}'
                f'<h3>{e(u["selfcheck"])}</h3><div class="check">{chk}</div>'
                f'<div class="dates">{e(u["wrote"])}<i></i>{e(u["rewrote"])}<i></i><i></i></div></section>')
    if t == "newslog":
        pr = "".join(f"<li>{e(x)}</li>" for x in d["prompts"])
        rows = '<tr><td style="height:12mm"></td><td></td><td></td><td></td></tr>' * int(d.get("rows", 6))
        ex = ch.get("indianExample", {}).get(lang)
        return (f'<section class="newpage"><div class="kicker">{num} · {e(u["news"])}</div><h2>{e(d["title"])}</h2><ul>{pr}</ul>'
                + (f'<div class="box hook"><span class="tag">{e(u["start_ex"])}</span>{e(ex)}</div>' if ex else "")
                + f'<table><thead><tr><th style="width:15%">{e(u["date"])}</th><th>{e(u["what"])}</th><th style="width:18%">{e(u["fits"])}</th><th style="width:16%">{e(u["source"])}</th></tr></thead>{rows}</table>'
                f'<div class="clip">{e(u["clip"])}</div></section>')
    if t == "close":
        return f'<div class="box note" style="margin-top:5mm"><span class="tag">{e(u["close"])}</span>{e(d["text"])}</div>'
    if t == "opener":
        return ""
    raise ValueError(t)

def chapter_html(ch, lang, book):
    u = UI[lang]; op = next(b for b in ch["blocks"] if b["type"] == "opener")[lang]
    src = ch["qr"].strip("{}").split(":", 1)[1]
    out = [f'<section class="newpage"><div class="band"><div class="num">{ch["n"]:02d}</div><div class="kicker">{e(u["chapter"])} {ch["n"]}</div>'
           f'<h1>{e(ch["title"][lang])}</h1><p>{e(ch["readFirst"][lang])}</p></div>'
           f'<div class="kicker">{e(u["youwill"])}</div><ul>{"".join(f"<li>{e(x)}</li>" for x in op["youWillBeAbleTo"])}</ul>'
           f'<h3>{e(u["before"])}</h3><div class="do">{e(op["writeWhatYouKnow"])}</div>{lines(max(6, op.get("lines", 6)) * 8 + 16)}'
           f'<h3>{e(u["conf"])}</h3><p class="small">{e(ch["confidence"][lang])}</p>'
           f'{circ(ch["confidence"]["circles"] if lang == "en" else ["पहले", "बाद में", "एक महीने बाद"])}{qrcard(src, lang)}</section>']
    sub = 0; last_fill = max(i for i, b in enumerate(ch["blocks"]) if b["type"] in ("fillin", "opener"))
    for i, b in enumerate(ch["blocks"]):
        if b["type"] in ("opener", "close"):
            if b["type"] == "close":
                out.append(block_html(b, ch, lang, ""))
            continue
        sub += 1
        out.append(block_html(b, ch, lang, f"{ch['n']}.{sub}"))
        if i == last_fill and ch.get("usualMistake"):
            out[-1] = out[-1].replace(f'<h3>{e(u["mynotes"])}</h3>', f'<div class="box trap"><span class="tag">{e(u["trap"])}</span>{e(ch["usualMistake"][lang])}</div><h3>{e(u["mynotes"])}</h3>')
    srcs = "; ".join(e(s["name"]) for s in ch.get("sources", []))
    out.append(f'<div class="asof">{e(ch["asOf"][lang])}<br>{e(u["sources"])}: {srcs}.</div>')
    return "".join(out)

def key_html(chs, lang):
    u = UI[lang]; out = [f'<section class="newpage"><div class="kicker">{e(u["key"])}</div><h2>{e(u["key"])}</h2><div class="do">{e(u["key_do"])}</div><div class="key">']
    for ch in chs:
        out.append(f'<h4>{e(u["chapter"])} {ch["n"]} · {e(ch["title"][lang])}</h4>')
        titles = {b["id"]: (b.get(lang) or {}).get("title", "") for b in ch["blocks"]}
        for k in ch["answerKey"]:
            out.append(f'<p><b>{e(titles.get(k["block"], ""))}.</b> {e(k[lang])}</p>')
        for b in ch["blocks"]:
            if b["type"] == "upsc":
                for i, q in enumerate(b["questions"], 1):
                    ans = q[lang]["options"][q["answerIndex"]]
                    out.append(f'<p><b>{e(u["upsc"])} {i}: {e(ans)}.</b> {" ".join(e(x[lang]) for x in q["because"])}</p>')
    out.append("</div></section>")
    return "".join(out)

B2_TEXT = {
 "en": dict(title="Polity", sub="The workbook you fill in. Twelve chapters, from the making of the Constitution to the basic structure.",
   foot="Edition of November 2026",
   how=("This is not a book to read. It's a book to finish.",
        "The notes in most books are already complete, so your eyes slide over them. Here you complete them: fill the gaps, draw the diagrams, sort, recall, explain why, and write one Mains answer in every chapter. Use it next to whatever Polity book you already trust; every chapter starts with \"read your main book first\". By exam day this book will be full of your handwriting."),
   colour=["Article numbers", "Amendments and years", "Court cases", "Things I keep getting wrong"],
   missing_t="Not in this edition yet",
   missing="The pages that usually close an Aspiran workbook are coming in the next printing: cut-out flashcards, your night-before sheet, a mistake log, a past-question tracker, \"things I keep forgetting\" and your own index. Until then, keep a mistake log and a list of past questions in your notebook or in the app. Each chapter already lists the UPSC questions asked on it.",
   imprint="Facts in each chapter are dated in a small line at its foot, so a reprint knows what to check. They are taken from the text of the Constitution of India, its amendment Acts, the Supreme Court judgments named in each chapter and other government sources. Practice questions marked \"original\" are written for this book; past questions are UPSC's own, quoted by year and number."),
 "hi": dict(title="राजव्यवस्था (Polity)", sub="वह वर्कबुक जिसे आप भरते हैं। बारह अध्याय, संविधान के निर्माण से मूल ढाँचे तक।",
   foot="नवंबर 2026 संस्करण",
   how=("यह पढ़ने की किताब नहीं, पूरी करने की किताब है।",
        "ज़्यादातर किताबों के notes पहले से पूरे होते हैं, इसलिए नज़र उन पर से फिसल जाती है। यहाँ आप उन्हें पूरा करते हैं: ख़ाली जगहें भरिए, चित्र बनाइए, छाँटिए, याद कीजिए, 'क्योंकि' लिखिए, और हर अध्याय में एक Mains उत्तर लिखिए। इसे अपनी भरोसेमंद Polity किताब के साथ चलाइए; हर अध्याय \"पहले अपनी मुख्य किताब पढ़िए\" से शुरू होता है। परीक्षा के दिन तक यह किताब आपकी लिखावट से भर जाएगी।"),
   colour=["अनुच्छेद संख्याएँ", "संशोधन और वर्ष", "न्यायालय के मामले", "जिनमें मैं बार-बार ग़लती करता/करती हूँ"],
   missing_t="इस संस्करण में अभी नहीं",
   missing="Aspiran वर्कबुक के आख़िर में आने वाले पन्ने अगली छपाई में आएँगे: काटकर बनाने वाले flashcards, परीक्षा से पहले की रात का पन्ना, गलतियों का log, पिछले प्रश्नों का tracker, \"जो बातें मैं बार-बार भूलता/भूलती हूँ\" और आपकी अपनी अनुक्रमणिका। तब तक गलतियों का log और पिछले प्रश्नों की सूची अपनी copy में या app में रखिए। हर अध्याय में उस पर पूछे गए UPSC प्रश्न पहले से दिए हैं।",
   imprint="हर अध्याय के तथ्यों की तारीख़ उसके अंत में एक छोटी पंक्ति में दी है, ताकि पुनर्मुद्रण के समय पता रहे कि क्या जाँचना है। तथ्य भारत के संविधान के पाठ, संशोधन अधिनियमों, हर अध्याय में नामित सर्वोच्च न्यायालय के निर्णयों और अन्य सरकारी स्रोतों से लिए गए हैं। \"मौलिक\" लिखे अभ्यास प्रश्न इस किताब के लिए लिखे गए हैं; पिछले प्रश्न UPSC के अपने हैं, वर्ष और संख्या के साथ।"),
}

def build_b2(lang):
    wb = json.load(open(ROOT / "polity-workbook" / "workbook.json")); u = UI[lang]; T = B2_TEXT[lang]
    chs = wb["chapters"]
    rows = "".join(f'<tr><td><b>{c["n"]}</b></td><td>{e(c["title"][lang])}</td><td><span class="dot3"><i></i></span></td><td><span class="dot3"><i></i></span></td><td><span class="dot3"><i></i></span></td></tr>' for c in chs)
    front = (cover(lang, T["title"], T["sub"], T["foot"], "wb-polity-cover")
             + belongs(lang, T["colour"], marks_html(lang))
             + f'<section><h3>{e(T["how"][0])}</h3><p>{e(T["how"][1])}</p></section>'
             + f'<section class="newpage"><div class="kicker">{e(u["contents"])}</div><h2>{e(u["where"])}</h2>'
               f'<table class="write"><thead><tr><th style="width:6%"></th><th></th><th style="width:14%">{e(u["pass1"])}</th><th style="width:14%">{e(u["pass2"])}</th><th style="width:14%">{e(u["pass3"])}</th></tr></thead>{rows}'
               f'<tr><td></td><td>{e(u["key"])}</td><td></td><td></td><td></td></tr></table>'
               f'<div class="box asks"><span class="tag">{e(T["missing_t"])}</span>{e(T["missing"])}</div>'
               f'<p class="small" style="margin-top:4mm">{e(T["imprint"])} {e(u["found"])}</p></section>')
    body = front + "".join(chapter_html(c, lang, "polity") for c in chs)
    body += f'<section class="newpage"><div class="kicker">{e(T["missing_t"])}</div><h2>{e(T["missing_t"])}</h2><p>{e(T["missing"])}</p></section>'
    body += key_html(chs, lang)
    out = ROOT / "polity-workbook" / f"polity-workbook-{lang}.html"
    out.write_text(page(lang, "Polity Workbook" if lang == "en" else "राजव्यवस्था वर्कबुक", ("Aspiran · Polity Workbook" if lang == "en" else "Aspiran · राजव्यवस्था वर्कबुक"), body))
    return out

# ================================================================ B1: Syllabus Companion
B1_UI = {
 "en": dict(map_legend="How to shade", line="Syllabus line", topic="Topic", total="Total", earlier="Earlier years (fill in)",
            plan_n="Planning page", demand="What the question asks", intro="Introduction", body="Body", ex="An example to recall", concl="Conclusion",
            done="Planned on", wrote="Answer written on", flash="Cut along the dashed lines. Fold each card on the dotted line.", front="Question", back="Answer",
            example_row="Example", week="", contents_t="What's in this book", foot="Edition of November 2026", optional_row="", tracker_ref="Paper"),
 "hi": dict(map_legend="कैसे भरें", line="पाठ्यक्रम की पंक्ति", topic="Topic", total="कुल", earlier="पिछले वर्ष (स्वयं भरें)",
            plan_n="Planning पेज", demand="प्रश्न क्या माँगता है", intro="भूमिका", body="मुख्य भाग", ex="याद करने के लिए एक उदाहरण", concl="निष्कर्ष",
            done="Plan किया", wrote="उत्तर लिखा", flash="डैश वाली रेखाओं पर काटिए। हर कार्ड को बिंदु वाली रेखा पर मोड़िए।", front="प्रश्न", back="उत्तर",
            example_row="उदाहरण", week="", contents_t="इस किताब में", foot="नवंबर 2026 संस्करण", optional_row="", tracker_ref="प्रश्नपत्र"),
}

def part_opener(n, title, intro, lang, first=True):
    u = UI[lang]
    return (f'<section class="newpage"><div class="band"><div class="num">{n:02d}</div><div class="kicker">{e(u["part"])} {n}</div><h1>{e(title)}</h1>'
            + (f"<p>{e(intro)}</p>" if intro else "") + "</div>")

def build_b1(lang):
    wb = json.load(open(ROOT / "syllabus-companion" / "workbook.json")); u = UI[lang]; v = B1_UI[lang]
    P = wb["parts"]; S = {s["id"]: s for s in P["sections"]["sections"]}; bm = wb["backMatter"]
    C = {c["n"]: c["title"][lang] for c in wb["contents"]}
    src = lambda n: f"wb-syllabus-ch{n}"
    out = [cover(lang, wb["title"][lang], wb["subtitle"][lang], v["foot"], "wb-syllabus-cover")]
    out.append(belongs(lang, (["Prelims", "Mains", "Current affairs", "Lines I keep putting off"] if lang == "en" else ["Prelims", "Mains", "करंट अफ़ेयर्स", "जिन पंक्तियों को मैं टालता/टालती हूँ"]), ""))
    crow = "".join(f'<tr><td><b>{n}</b></td><td>{e(t)}</td></tr>' for n, t in C.items())
    out.append(f'<section class="newpage"><div class="kicker">{e(u["contents"])}</div><h2>{e(v["contents_t"])}</h2><table>{crow}</table>'
               f'<p class="small" style="margin-top:5mm">{e(wb["asOf"])} · {e(u["found"])}</p></section>')
    # 1 how to use
    h = S["wb-b1-how-to-use"][lang]
    out.append(part_opener(1, C[1], "", lang) + "<ol>" + "".join(f"<li>{e(x)}</li>" for x in h["lines"]) + "</ol>"
               + f'<div class="box asks"><span class="tag">{e(h["exam"]["title"])}</span><ul>{"".join(f"<li>{e(x)}</li>" for x in h["exam"]["rows"])}</ul><span class="small">{e(h["exam"]["source"])}</span></div>'
               + qrcard(src(1), lang) + "</section>")
    # 2 syllabus map
    m = P["syllabus-map"]
    out.append(part_opener(2, C[2], m["intro"][lang], lang) + f'<h3>{e(v["map_legend"])}</h3><ul>{"".join(f"<li>{e(x)}</li>" for x in m["howToShade"][lang])}</ul>'
               + circ(m["circleLabels"][lang]) + qrcard(src(2), lang) + "</section>")
    cl = m["circleLabels"][lang]
    chead = "".join(f'<th style="width:11%;text-align:center">{e(x)}</th>' for x in cl)
    ring = '<td class="circles"><span class="dot3"><i></i></span></td>' * 3
    for pg in m["pages"]:
        rows = []
        if pg.get("topics"):
            for t in pg["topics"]:
                rows.append(f'<tr class="topicrow"><td colspan="4">{e(t["title"][lang])} <span class="node">{e(t["node"])}</span></td></tr>')
                rows += [f"<tr><td>{e(l['text'][lang])}</td>{ring}</tr>" for l in t["lines"]]
        elif pg.get("papers"):
            for pp in pg["papers"]:
                rows.append(f'<tr class="topicrow"><td colspan="4">{e(pp["title"][lang])}</td></tr>')
                rows += [f"<tr><td>{e(l['text'][lang])}</td>{ring}</tr>" for l in pp["lines"]]
        else:
            rows += [f'<tr><td style="height:9mm"></td>{ring}</tr>'] * int(pg.get("rows", 40))
        out.append(f'<section class="newpage"><div class="kicker">{e(C[2])}</div><h2>{e(pg["title"][lang])}</h2><p class="small">{e(pg["note"][lang])}</p>'
                   f'<table><thead><tr><th>{e(v["line"])}</th>{chead}</tr></thead>{"".join(rows)}</table></section>')
    # 3 past-question counts
    c = P["pyq-counts"]
    out.append(part_opener(3, C[3], c["intro"][lang], lang) + qrcard(src(3), lang) + "</section>")
    for pg in c["pages"]:
        cols = pg["columns"][lang]
        rows = "".join(f'<tr><td>{e(r["topic"][lang])} <span class="node">{e(r["node"])}</span></td>'
                       + "".join(f'<td style="text-align:center">{e(r[y])}</td>' for y in ("2024", "2025", "2026"))
                       + f'<td style="text-align:center"><b>{e(r["total"]) if r["2024"] != "" else ""}</b></td><td></td></tr>' for r in pg["rows"])
        out.append(f'<section class="newpage"><div class="kicker">{e(C[3])}</div><h2>{e(pg["title"][lang])}</h2>'
                   f'<table class="write"><thead><tr><th>{e(cols[1])}</th>' + "".join(f'<th style="width:8%;text-align:center">{e(x)}</th>' for x in cols[2:6])
                   + f'<th style="width:22%">{e(cols[6])}</th></tr></thead>{rows}</table><ul style="margin-top:4mm">{"".join(f"<li>{e(x)}</li>" for x in pg["reading"][lang])}</ul></section>')
    # 4 Mains planning
    mp = P["mains-planning"]
    out.append(part_opener(4, C[4], mp["intro"][lang], lang) + qrcard(src(4), lang) + "</section>")
    for pg in mp["pages"]:
        d = pg[lang]; pb = d["planningBox"]; p = pg["pyq"]
        heads = "".join(f"<li>{e(x)}{lines(8)}</li>" for x in pb["bodyHeads"])
        out.append(f'<section class="newpage pp"><div class="kicker">{e(v["plan_n"])} {pg["n"]}</div>'
                   f'<div class="qbox"><div class="ref">{e(pyq_label(p["id"], p["n"], lang, p.get("marks"), p.get("words")))}</div><div class="text">{e(d["question"])}</div></div>'
                   f'<h3>{e(v["demand"])}</h3><p>{blanks(pb["demand"])}</p>'
                   f'<h3>{e(v["intro"])}</h3><p>{blanks(pb["intro"])}</p>{lines(8)}'
                   f'<h3>{e(v["body"])}</h3><ol class="plan">{heads}</ol>'
                   f'<h3>{e(v["ex"])}</h3><p>{blanks(pb["indianExample"])}</p>{lines(8)}'
                   f'<h3>{e(v["concl"])}</h3><p>{blanks(pb["conclusion"])}</p>{lines(8)}'
                   f'<h3>{e(u["selfcheck"])}</h3><div class="check">{"".join(f"<span>{e(x)}</span>" for x in d["selfCheck"])}</div>'
                   f'<div class="dates">{e(v["done"])}<i></i>{e(v["wrote"])}<i></i></div></section>')
    # 5 news log
    nl = S["wb-b1-newslog-by-paper"]
    out.append(part_opener(5, C[5], nl[lang]["how"], lang) + qrcard(src(5), lang) + "</section>")
    cols = nl[lang]["columns"]
    for lg in nl["logs"]:
        rows = '<tr><td style="height:10.5mm"></td><td></td><td></td><td></td></tr>' * int(lg.get("rows", 20))
        out.append(f'<section class="newpage"><div class="kicker">{e(C[5])}</div><h2>{e(lg["title"][lang])}</h2><ul>{"".join(f"<li>{e(x)}</li>" for x in lg[lang]["prompts"])}</ul>'
                   f'<table><thead><tr><th style="width:14%">{e(cols[0])}</th><th>{e(cols[1])}</th><th style="width:12%">{e(cols[2])}</th><th style="width:18%">{e(cols[3])}</th></tr></thead>{rows}</table></section>')
    # 6 spaced recall
    sr = S["wb-b1-spaced-recall"][lang]
    out.append(part_opener(6, C[6], "", lang) + qrcard(src(6), lang) + "</section>")
    for i, pg in enumerate(sr["pages"]):
        tb = pg.get("table")
        tbl = ""
        if tb:
            tbl = (f'<table class="write" style="margin-top:4mm"><thead><tr>{"".join(f"<th>{e(x)}</th>" for x in tb["columns"])}</tr></thead>'
                   + ("<tr>" + "<td></td>" * len(tb["columns"]) + "</tr>") * int(tb["rows"]) + "</table>")
        out.append(f'<section class="newpage"><div class="kicker">{e(C[6])}</div><h2>{e(pg["title"])}</h2>{"".join(f"<p>{e(x)}</p>" for x in pg["paras"])}{tbl}</section>')
    # 7 calendar
    rc = S["wb-b1-revision-calendar"][lang]
    wr = rc["weeklyRhythm"]
    out.append(part_opener(7, C[7], rc["how"], lang) + f'<h3>{e(wr["title"])}</h3><div style="line-height:2.6">{"<br>".join(blanks(x) for x in wr["rows"])}</div>' + qrcard(src(7), lang) + "</section>")
    wd = "".join(f"<th>{e(x)}</th>" for x in rc["weekdays"])
    for i, mo in enumerate(rc["months"]):
        grid = ("<tr>" + "<td></td>" * 7 + "</tr>") * 6
        out.append(f'<section class="{"newpage" if i % 2 == 0 else ""}" style="margin-top:{0 if i % 2 == 0 else 6}mm;break-inside:avoid"><div class="kicker">{e(mo["label"])}</div>'
                   f'<p><b>{blanks(mo["write"])}</b></p><table class="cal"><thead><tr>{wd}</tr></thead>{grid}</table><p style="margin-top:2mm">{blanks(mo["notes"])}</p></section>')
    # 8 back matter
    out.append(part_opener(8, C[8], "", lang) + qrcard(src(8), lang) + "</section>")
    cards = bm["flashcards"]
    for i in range(0, len(cards), 8):
        cs = "".join(f'<div class="card"><div><span class="lbl">{e(v["front"])}</span><span class="front">{e(cd["front"][lang])}</span></div>'
                     f'<div><span class="lbl">{e(v["back"])}</span>{e(cd["back"][lang])}</div></div>' for cd in cards[i:i + 8])
        out.append(f'<section class="newpage"><p class="small">✂ {e(v["flash"])}</p><div class="cards">{cs}</div></section>')
    nb = bm["nightBefore"][lang]
    out.append(f'<section class="newpage"><h2>{e(nb["title"])}</h2><div class="check">{"".join(f"<span>{e(x)}</span>" for x in nb["keep"])}</div>{lines(48)}<div class="box hook">{e(nb["calm"])}</div></section>')
    ml = bm["mistakeLog"][lang]
    rows = f'<tr><td class="given">{"</td><td class=given>".join(e(x) for x in ml["example"])}</td></tr>' + ("<tr>" + "<td></td>" * len(ml["columns"]) + "</tr>") * int(ml["rows"])
    out.append(f'<section class="newpage"><h2>{e(ml["title"])}</h2><div class="do">{e(ml["how"])}</div><table class="write"><thead><tr>{"".join(f"<th>{e(x)}</th>" for x in ml["columns"])}</tr></thead>{rows}</table></section>')
    pt = bm["pyqTracker"]; cols = pt[lang]["columns"]
    rows = "".join(f'<tr><td>{r["year"]}</td><td>{e(PAPER[lang].get(PAPERS[r["id"]]["paper"], r["paper"]))}</td><td>{e(qnum(r["n"]))}</td><td>{e(r["topic"][lang])}</td><td class="node">{e(r["chapter"])}</td><td><span class="dot3"><i></i></span></td><td><span class="dot3"><i></i></span></td></tr>' for r in pt["rows"])
    out.append(f'<section class="newpage"><h2>{e(pt[lang]["title"])}</h2><div class="do">{e(pt[lang]["how"])}</div><table style="font-size:8.6pt"><thead><tr>{"".join(f"<th>{e(x)}</th>" for x in cols)}</tr></thead>{rows}</table></section>')
    kf = bm["keepForgetting"][lang]
    out.append(f'<section class="newpage"><h2>{e(kf["title"])}</h2><div class="do">{e(kf["how"])}</div>{lines(int(kf["rows"]) * 9)}</section>')
    oi = bm["ownIndex"][lang]
    out.append(f'<section class="newpage"><h2>{e(oi["title"])}</h2><div class="do">{e(oi["how"])}</div><div class="idx">{"".join(f"<div>{e(x)}</div>" for x in oi["letters"])}</div></section>')
    # back cover text
    out.append(f'<section class="newpage"><div class="band"><div class="kicker">Aspiran</div><h1>{e(wb["title"][lang])}</h1><p>{e(wb["backCover"][lang])}</p></div><p>{e(u["about"])}</p>{qrcard("wb-syllabus-back", lang)}</section>')
    o = ROOT / "syllabus-companion" / f"syllabus-companion-{lang}.html"
    o.write_text(page(lang, "Syllabus Companion" if lang == "en" else "सिलेबस साथी", ("Aspiran · Syllabus Companion" if lang == "en" else "Aspiran · सिलेबस साथी"), "".join(out)))
    return o

for lang in ("en", "hi"):
    print(build_b2(lang)); print(build_b1(lang))
