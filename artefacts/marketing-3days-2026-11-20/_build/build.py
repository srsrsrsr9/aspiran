# Renders every image in this 3-day pack: python3 build.py (needs Google Chrome, the website's fonts, and
# workbook.py run first for the page images). Reuses the look and slide code of the 13 Nov pack, with Chotu's
# "AI" badge taken off (owner, 17 Nov: no AI labels anywhere).
import os, sys, subprocess, html, re
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
OLD = os.path.join(HERE, "..", "..", "marketing-pack-2026-11-13", "_build")
sys.path.insert(0, OLD); sys.path.insert(0, os.path.join(OLD, "pylib"))
src = open(os.path.join(OLD, "build.py"), encoding="utf-8").read()
ns = {"__file__": os.path.join(OLD, "build.py"), "__name__": "oldbuild"}
exec(src[:src.index("jobs = []")], ns)
ns["CHOTU"] = re.sub(r'<rect x="82" y="168".*?</text>', "", ns["CHOTU"], flags=re.S)
assert ">AI<" not in ns["CHOTU"]
from content import CAROUSELS, DOOR, QUOTES
import qrcode, qrcode.image.svg
page, slide, E, CHROME = ns["page"], ns["slide"], html.escape, ns["CHROME"]
PACK = os.path.dirname(HERE); TMP = os.path.join(HERE, "html"); PAGES = os.path.join(HERE, "pages")

def qr(url, px):
    s = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=1).to_string(encoding="unicode")
    return f'<div style="width:{px}px;height:{px}px;background:#fff;border-radius:18px;padding:12px;flex:none">' + s.replace("<svg ", '<svg style="width:100%;height:100%" ', 1) + "</div>"

EXTRA = '''<style>.shot{border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.55);border:1.5px solid rgba(255,220,180,.35);height:%dpx;background:#fff}
.shot img{width:100%%;display:block}.qrrow{display:flex;gap:34px;align-items:center}.qrrow p{font-size:36px;line-height:1.45}.hi .qrrow p{font-size:34px}</style>'''

WB_IG = "https://app.aspiran.in/app/?utm_source=instagram&utm_medium=workbook#try/path-pol-constitution"
WB = {
 "en": [
  {"t": "hook", "kick": "NEW · FREE SAMPLE", "h1": ["A UPSC book", "you finish yourself."], "sub": "Not notes to read. A Polity workbook you fill in, until exam day."},
  {"t": "page", "img": "p-05.png", "kick": "1 · FILL THE GAPS", "h": "Read your book. Close it. Fill in from memory."},
  {"t": "page", "img": "p-06.png", "kick": "2 · REBUILD IT", "h": "Build the Preamble again, from memory."},
  {"t": "page", "img": "p-16.png", "kick": "3 · HELP THAT FADES", "h": "The first rows are done. The rest are yours."},
  {"t": "page", "img": "p-09.png", "kick": "4 · EXPLAIN, DON'T TICK", "h": "Every statement gets a “because…”"},
  {"t": "page", "img": "p-25.png", "kick": "5 · IT KEEPS GROWING", "h": "A mistake log, a PYQ tracker, a news log."},
  {"t": "page", "img": "p-12.png", "kick": "6 · HINDI TOO", "h": "English and Hindi."},
  {"t": "wbdoor", "h": "Two chapters, free.", "sub": "The Preamble and Fundamental Rights. 29 A4 pages. Print it and fill it in pencil.", "btn": "DM us “WORKBOOK” for the PDF", "qr": "Scan to do the whole Constitution topic in the app, free, no sign-up."},
 ],
 "hi": [
  {"t": "hook", "kick": "नया · मुफ़्त नमूना", "h1": ["UPSC की एक किताब,", "जिसे आप ख़ुद पूरा करते हैं।"], "sub": "पढ़ने के नोट्स नहीं। राजव्यवस्था की वर्कबुक, जिसे आप परीक्षा तक भरते रहते हैं।"},
  {"t": "page", "img": "p-05.png", "kick": "1 · खाली जगह भरिए", "h": "किताब पढ़िए। बंद कीजिए। याद से भरिए।"},
  {"t": "page", "img": "p-06.png", "kick": "2 · फिर से बनाइए", "h": "प्रस्तावना को याद से दोबारा बनाइए।"},
  {"t": "page", "img": "p-16.png", "kick": "3 · मदद धीरे-धीरे कम", "h": "पहली पंक्तियाँ भरी हैं। बाक़ी आपकी।"},
  {"t": "page", "img": "p-09.png", "kick": "4 · सिर्फ़ टिक नहीं, कारण", "h": "हर कथन के साथ “क्योंकि…”"},
  {"t": "page", "img": "p-25.png", "kick": "5 · बढ़ती रहती है", "h": "ग़लतियों की सूची, PYQ ट्रैकर, ख़बरों की सूची।"},
  {"t": "page", "img": "p-12.png", "kick": "6 · हिंदी में भी", "h": "हिंदी और अंग्रेज़ी में।"},
  {"t": "wbdoor", "h": "दो अध्याय, मुफ़्त।", "sub": "प्रस्तावना और मौलिक अधिकार। 29 A4 पन्ने। प्रिंट कीजिए, पेंसिल से भरिए।", "btn": "PDF के लिए हमें “WORKBOOK” लिखकर भेजिए", "qr": "स्कैन करके ऐप में पूरा संविधान टॉपिक कीजिए, मुफ़्त, बिना साइन-अप।"},
 ],
}

def slide2(s, lang):
    k = f'<div class="kick">{E(s.get("kick", ""))}</div>'
    if s["t"] == "page":
        return k + f'<h2>{E(s["h"])}</h2><div class="shot" style=""><img src="file://{PAGES}/{s["img"]}"></div>', False
    if s["t"] == "wbdoor":
        return (f'<h2>{E(s["h"])}</h2><p class="sub">{E(s["sub"])}</p><div class="btn">{E(s["btn"])}</div>'
                f'<div class="qrrow">{qr(WB_IG, 230)}<p>{E(s["qr"])}<br><b>aspiran.in</b></p></div>'), True
    return slide(s, lang)

jobs = []
def add(doc, rel, w=1080, h=1350, shot_h=820):
    out = os.path.join(PACK, rel); os.makedirs(os.path.dirname(out), exist_ok=True); os.makedirs(TMP, exist_ok=True)
    doc = doc.replace("</body>", (EXTRA % shot_h) + "</body>")
    p = os.path.join(TMP, rel.replace("/", "__").replace(".png", ".html")); open(p, "w", encoding="utf-8").write(doc)
    jobs.append((p, out, w, h))

seed = 500
for cid in ("C1-the-leak", "C2-how-sure-are-you"):
    for lang, slides in CAROUSELS[cid].items():
        al = slides + [DOOR[lang]]
        for i, s in enumerate(al):
            seed += 1; body, ch = slide(s, lang)
            add(page(body, lang, n=i + 1, total=len(al), seed=seed, chotu=ch), f"images/instagram-carousels/{cid}/{lang}/{i + 1:02d}.png")
for lang, slides in WB.items():
    for i, s in enumerate(slides):
        seed += 1; body, ch = slide2(s, lang)
        add(page(body, lang, n=i + 1, total=len(slides), seed=seed, chotu=ch), f"images/instagram-carousels/W1-workbook/{lang}/{i + 1:02d}.png")
    # Story for the workbook day: one page and the line.
    seed += 1
    body, _ = slide2({"t": "page", "img": "p-06.png", "kick": WB[lang][2]["kick"], "h": WB[lang][0]["h1"][0] + " " + WB[lang][0]["h1"][1]}, lang)
    add(page(body + f'<div class="btn">{E(WB[lang][-1]["btn"])}</div>', lang, h=1920, seed=seed), f"images/stories/{lang}/S2-workbook.png", h=1920, shot_h=1000)
Q = dict(QUOTES)
for qid, name in (("Q2-rereading", "S1-rereading"), ("Q5-sure", "S3-sure")):
    for lang, lines in Q[qid].items():
        seed += 1; body, _ = slide({"t": "quote", "h1": lines, "btn": DOOR[lang]["btn"]}, lang)
        add(page(body, lang, h=1920, seed=seed), f"images/stories/{lang}/{name}.png", h=1920)
for qid in ("Q1-october-march", "Q5-sure"):
    seed += 1; body, _ = slide({"t": "quote", "h1": Q[qid]["en"]}, "en")
    add(page(body, "en", w=1200, h=675, seed=seed).replace("font:800 104px", "font:800 78px").replace("padding:96px 84px 170px", "padding:60px 84px 110px"), f"images/x-and-linkedin/{qid}.png", w=1200, h=675)
# Wide workbook image for X and LinkedIn.
seed += 1
wide = (f'<div style="display:flex;gap:56px;align-items:center"><div style="flex:1;display:flex;flex-direction:column;gap:22px"><div class="kick">FREE SAMPLE · POLITY</div>'
        f'<h2 style="font-size:58px">A UPSC book you finish yourself.</h2><p class="sub" style="font-size:30px">Fill-in notes, rebuild-from-memory pages, a mistake log. Two chapters free.</p></div>'
        f'<div class="shot" style="width:400px;transform:rotate(2deg)"><img src="file://{PAGES}/p-06.png"></div></div>')
add(page(wide, "en", w=1200, h=675, seed=seed).replace("padding:96px 84px 170px", "padding:50px 84px 100px"), "images/x-and-linkedin/W1-workbook.png", w=1200, h=675, shot_h=470)

def shoot(j):
    s, o, w, h = j
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", f"--window-size={w},{h}",
                    "--allow-file-access-from-files", "--virtual-time-budget=4000", f"--screenshot={o}", "file://" + s], capture_output=True, timeout=120)
    return os.path.exists(o)
only = sys.argv[1] if len(sys.argv) > 1 else ""
todo = [j for j in jobs if only in j[1]]
with ThreadPoolExecutor(4) as ex: ok = list(ex.map(shoot, todo))
print(f"{sum(ok)} of {len(todo)} images rendered")
