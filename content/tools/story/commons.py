#!/usr/bin/env python3
"""commons: find and fetch Wikimedia Commons pictures and videos with a safe licence, for explainers.

    python3 content/tools/story/commons.py search "<words>" [--video] [--n 12]
    python3 content/tools/story/commons.py get "<File:Title.jpg>" <dest folder> <video number>

Only public domain, CC0, CC BY and GODL-India files pass (CC BY-SA, NC, ND and unknown licences are left out).
`get` downloads the original file (or a 2400 px rendition of very large images) and appends a ledger row to
content/motion/explainers/LEDGER-<range>.md for that video number. Check the file's own page if anything looks odd.
"""
import json, re, sys, urllib.parse, urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "AspiranExplainers/1.0 (educational videos)"}
ROOT = Path(__file__).resolve().parents[3]


def ok_licence(lic):
    l = (lic or "").lower()
    if any(x in l for x in ("-sa", " sa ", "share", "nc", "nd", "fair use")): return False
    return bool(re.search(r"public domain|^pd|cc0|cc[- ]by(?![- ]sa)|godl|no restrictions", l))


def fetch(url, dest=None):
    """curl, not urllib: the network proxy here sometimes cuts Python's chunked reads short."""
    import subprocess
    for _ in range(4):
        r = subprocess.run(["curl", "-4", "-sSfL", "--retry", "5", "--retry-delay", "20", "--max-time", "300", "--speed-time", "45", "--speed-limit", "2000", "-A", UA["User-Agent"], url] + (["-o", str(dest)] if dest else []),
                           capture_output=True)
        if r.returncode == 0: return r.stdout
    raise RuntimeError(f"fetch failed: {url}: {r.stderr.decode()[:200]}")


def call(params):
    q = urllib.parse.urlencode({**params, "format": "json"})
    return json.loads(fetch(f"{API}?{q}"))


def info(titles):
    j = call({"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
              "iiprop": "url|extmetadata|size|mime", "iiurlwidth": 2400})
    out = []
    for p in j.get("query", {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata", {})
        g = lambda k: re.sub(r"<[^>]+>", "", md.get(k, {}).get("value", "")).strip()
        out.append({"title": p["title"], "licence": g("LicenseShortName"), "artist": g("Artist")[:120] or "unknown",
                    "credit": g("Credit")[:160], "w": ii.get("width"), "h": ii.get("height"), "mime": ii.get("mime"),
                    "url": ii.get("url"), "thumb": ii.get("thumburl"), "page": ii.get("descriptionurl")})
    return out


def search(words, video=False, n=12):
    q = words + (" filetype:video" if video else " filetype:bitmap")
    j = call({"action": "query", "list": "search", "srsearch": q, "srnamespace": 6, "srlimit": 40})
    titles = [h["title"] for h in j.get("query", {}).get("search", [])]
    res = []
    for k in range(0, len(titles), 20): res += info(titles[k:k + 20])
    return [r for r in res if ok_licence(r["licence"])][:n]


def ledger_for(num):
    lo = 201 if num <= 250 else 251
    return ROOT / "content/motion/explainers" / f"LEDGER-{lo}-{lo + 49}.md"


def get(title, dest, num):
    r = info([title])[0]
    if not ok_licence(r["licence"]): raise SystemExit(f"{title}: licence {r['licence']!r} is not allowed")
    big = r["w"] and r["w"] > 3000 and r["mime"].startswith("image/") and r["thumb"]
    url = r["thumb"] if big else r["url"]
    dest = Path(dest); dest.mkdir(parents=True, exist_ok=True)
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", title.split(":", 1)[1])[-80:]
    if big: name = Path(name).stem + Path(urllib.parse.urlparse(url).path).suffix
    fetch(url, dest / name)
    import time; time.sleep(2)            # be gentle: Wikimedia answers 429 when downloads come too fast
    led = ledger_for(int(num))
    if not led.exists(): led.write_text("# Picture ledger\n\n| video | file | source page | author | licence | how used |\n|---|---|---|---|---|---|\n")
    led.write_text(led.read_text() + f"| {num} | {name} | {r['page']} | {r['artist'].replace('|', '/')} | {r['licence']} | |\n")
    print(dest / name, "|", r["licence"], "|", r["artist"][:60])
    return dest / name


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[0] == "search":
        n = int(a[a.index("--n") + 1]) if "--n" in a else 12
        for r in search(a[1], "--video" in a, n):
            print(f"{r['title']} | {r['w']}x{r['h']} | {r['licence']} | {r['artist'][:50]}")
    elif a[0] == "get":
        get(a[1], a[2], a[3])
