# Makes the free workbook sample for posting: same pages as the book sample, but every QR code goes to a page that
# exists today (the Constitution topic in the app, or aspiran.in), with the address printed under it, and no
# promises of features that aren't built yet. Run: python3 workbook.py
import os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "marketing-pack-2026-11-13", "_build", "pylib"))
import qrcode, qrcode.image.svg
SRC = os.path.join(HERE, "..", "..", "books", "polity-revision-sample", "polity-workbook-sample.html")
OUT = os.path.join(HERE, "..", "free-workbook-pdf")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TOPIC = "https://app.aspiran.in/app/?utm_source=workbook&utm_medium=qr&utm_campaign={c}#try/path-pol-constitution"
HOME = "https://aspiran.in/?utm_source=workbook&utm_medium=qr&utm_campaign={c}"

def svg(url):
    s = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=0).to_string(encoding="unicode")
    return re.sub(r'<svg ', '<svg style="width:100%;height:100%" ', s, count=1)

h = open(SRC, encoding="utf-8").read()
links = {
    "https://aspiran.in/?src=wb-polity-ch1": TOPIC.format(c="wb-polity-ch1"),
    "https://aspiran.in/?src=wb-polity-ch2": TOPIC.format(c="wb-polity-ch2"),
    "https://aspiran.in/?src=wb-polity-back": HOME.format(c="wb-polity-back"),
}
for old, new in links.items():
    h = re.sub(r'(<div class="qr" data-qr=")' + re.escape(old) + r'("[^>]*>)</div>', lambda m: m.group(1) + new + m.group(2) + svg(new) + "</div>", h)
    assert new in h, old
h = re.sub(r"<script>\s*document\.querySelectorAll\('\[data-qr\]'\).*?</script>", "", h, flags=re.S)
h = h.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>', "")
# What the QR really opens today.
h = h.replace("<b>Check and go further</b><span class=\"small\">Scan to check your fill-ins, get 10 more questions picked from what you missed, or hear this chapter read aloud.</span>",
              "<b>Go further, free</b><span class=\"small\">Scan to do the whole Constitution topic in the Aspiran app: short reads, recall checks and real past questions. No sign-up. Or type <b style=\"display:inline;font-size:inherit\">aspiran.in</b></span>")
h = h.replace("<b>Check and go further</b><span class=\"small\">Scan to check this chapter, drill the writs, or find a pod revising Fundamental Rights this week.</span>",
              "<b>Go further, free</b><span class=\"small\">Scan to do the whole Constitution topic, Fundamental Rights included, in the Aspiran app. No sign-up. Or type <b style=\"display:inline;font-size:inherit\">aspiran.in</b></span>")
h = h.replace("and Chotu, an AI study buddy.", "and Chotu, a study helper for everyday doubts.")
assert "Check and go further" not in h and " AI " not in h and "an AI" not in h
os.makedirs(OUT, exist_ok=True)
tmp = os.path.join(HERE, "workbook-free.html"); open(tmp, "w", encoding="utf-8").write(h)
pdf = os.path.join(OUT, "Aspiran-Polity-Workbook-free-sample.pdf")
subprocess.run([CHROME, "--headless=new", "--no-pdf-header-footer", "--virtual-time-budget=15000", f"--print-to-pdf={pdf}", "file://" + tmp], capture_output=True, timeout=180)
print(pdf, os.path.getsize(pdf))
