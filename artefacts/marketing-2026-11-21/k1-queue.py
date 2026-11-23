#!/usr/bin/env python3
"""Turns the cleaned K1 launch kit (30 days x Telegram, WhatsApp, Instagram) into paste-ready files in the daily-posts
folder, next to the reels calendar, with a date for each day.

Reads   artefacts/marketing-2026-11-21/K1/*.json, artefacts/daily-posts-2026-11-20/reels/calendar.csv,
        the shorts zips in docs/content/asp/ and docs/content/aspiran-shorts/ (main checkout) to find each reel's file
Writes  artefacts/daily-posts-2026-11-20/launch-k1/  calendar.md, calendar.csv, days/<date>-dNN-<channel>-<lang>.txt
Run:    python3 -I artefacts/marketing-2026-11-21/k1-queue.py [--start 2026-11-23]
"""
import csv, datetime as dt, json, pathlib, subprocess, sys, zipfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
common = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "--git-common-dir"], capture_output=True, text=True).stdout.strip()
MAIN = (ROOT / common).resolve().parent if common else ROOT
CONTENT = next(p for p in [ROOT / "docs/content", MAIN / "docs/content"] if (p / "asp").exists())
OUT = ROOT / "artefacts/daily-posts-2026-11-20/launch-k1"
START = dt.date.fromisoformat(sys.argv[sys.argv.index("--start") + 1]) if "--start" in sys.argv else dt.date(2026, 11, 23)
K1 = {ch: {i["day"]: i for i in json.load(open(HERE / "K1" / f"{ch}.json", encoding="utf-8"))["items"]} for ch in ("telegram", "whatsapp", "instagram")}
LABEL = {"recall": "Recall question", "didyouknow": "Did you know", "method": "Method", "product": "Product moment"}

# Where each illustrated short's social cut (1080 x 1920, captions on) is, per language.
social = {}
for z in sorted((CONTENT / "asp").glob("shorts-*.zip")):
    lang = "hi" if "hindi" in z.name else "en"
    for name in zipfile.ZipFile(z).namelist():
        if name.endswith(".social.mp4"):
            social.setdefault((pathlib.Path(name).name.replace(".social.mp4", ".mp4"), lang), f"docs/content/asp/{z.name} → {name}")
for f in (CONTENT / "aspiran-shorts").glob("200*/*.social.mp4"):
    lang = "hi" if f.parent.name.startswith("2002") else "en"
    social.setdefault((f.name.replace(".social.mp4", ".mp4"), lang), f"docs/content/aspiran-shorts/{f.parent.name}/{f.name}")
for f in (CONTENT / "aspiran-shorts/_parts").glob("*.part00"):
    folder, name = f.name.split("--")[0], f.name.split("--")[1].replace(".social.mp4.part00", ".mp4")
    social.setdefault((name, "hi" if folder.startswith("2002") else "en"), f"docs/content/aspiran-shorts/_parts (join the parts first: join-large-videos.bat, or `cat`)")

# The reels calendar's Instagram rows, to keep K1 and the calendar from showing the same short close together.
cal = {}
with open(ROOT / "artefacts/daily-posts-2026-11-20/reels/calendar.csv", encoding="utf-8") as fh:
    for r in csv.DictReader(fh):
        if r["platform"] == "instagram":
            cal[r["date"]] = int(r["short"])
cal_by_short = {}
for d, n in cal.items():
    cal_by_short.setdefault(n, []).append(d)


def reel_where(reel, lang):
    if reel["library"] == "syllabus-videos":
        return f"syllabus video {reel['file']} (in the app: Practice → Videos → Syllabus in a minute; not in the shorts zips)"
    return social.get((reel["file"], lang), f"{reel['file']}: no social cut on this Mac yet")


def main():
    (OUT / "days").mkdir(parents=True, exist_ok=True)
    for old in (OUT / "days").glob("*.txt"):
        old.unlink()
    rows, md, clashes = [], [], []
    for day in range(1, 31):
        date = START + dt.timedelta(days=day - 1)
        tg, wa, ig = K1["telegram"][day], K1["whatsapp"][day], K1["instagram"][day]
        reel = ig["reel"]
        num = int(reel["file"][:3]) if reel["library"] == "illustrated-shorts" else None
        if num is not None:
            for d in cal_by_short.get(num, []):
                gap = abs((dt.date.fromisoformat(d) - date).days)
                if gap <= 7:
                    clashes.append(f"Day {day} ({date}) uses short {num:03d}; the reels calendar has it on {d} ({gap} days apart).")
        stem = f"{date}-d{day:02d}"
        t = tg["tryThis"]
        letters = "abcd"
        for lang in ("en", "hi"):
            poll = "\n".join([t["q"][lang], *[f"({letters[i]}) {o[lang]}" for i, o in enumerate(t["options"])],
                              f"Correct option: ({letters[t['answerIndex']]})", f"Explanation: {t['why'][lang]}"])
            (OUT / "days" / f"{stem}-telegram-{lang}.txt").write_text(
                f"{tg['post'][lang]}\n\n---- Quiz poll (Telegram: attach → Poll → Quiz mode) ----\n{poll}\n", "utf-8")
            (OUT / "days" / f"{stem}-whatsapp-{lang}.txt").write_text(
                f"{wa['post'][lang]}\n\n---- Second message, at 21:00 ----\n{wa['answerReveal'][lang]}\n", "utf-8")
            tags = " ".join(ig.get("hashtags", {}).get(lang, []) if isinstance(ig.get("hashtags"), dict) else ig.get("hashtags", []))
            (OUT / "days" / f"{stem}-instagram-{lang}.txt").write_text(
                f"Reel: {reel_where(reel, lang)}\nHook text for the first 2 seconds:\n{reel['hook'][lang]}\n\n---- Caption ----\n"
                f"{ig['post'][lang]}\n\n{tags}\n\n---- First comment ----\n{ig['answerReveal'][lang]}\n", "utf-8")
        rows.append({"date": str(date), "day": day, "type": tg["type"], "tone": tg["tone"], "reel": reel["file"],
                     "telegram": "19:00", "whatsapp": "19:00 (answer 21:00)", "instagram": "18:30",
                     "en_cut": reel_where(reel, "en"), "hi_cut": reel_where(reel, "hi")})
        md.append(f"| {date:%a %d %b} | {day} | {LABEL[tg['type']]} | `{reel['file']}` | {t['q']['en']} |")
    with open(OUT / "calendar.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader(); w.writerows(rows)
    missing = sorted({r["reel"] for r in rows if "no social cut" in r["en_cut"] or "no social cut" in r["hi_cut"]})
    parts = sorted({r["reel"] for r in rows if "_parts" in r["en_cut"] or "_parts" in r["hi_cut"]})
    end = START + dt.timedelta(days=29)
    (OUT / "calendar.md").write_text("\n".join([
        f"# Launch kit K1: 30 days of posts, {START:%d %b} to {end:%d %b %Y}",
        "",
        "From the content account's K1 batch (21 Nov), checked and cleaned in `artefacts/marketing-2026-11-21/`.",
        "Each day: one Telegram post with a quiz poll, one WhatsApp channel post with the answer as a second message,",
        "and one Instagram Reel with its caption and the answer as the first comment. English and Hindi for each.",
        "",
        "**Times (IST).** Telegram and WhatsApp at 19:00 (the automatic Chai post stays at 07:30). Instagram at 18:30:",
        "for these 30 days the K1 Reel takes the reels calendar's Instagram slot, and that calendar's YouTube Shorts carry",
        "on as planned. Paste from `days/<date>-dNN-<channel>-<en|hi>.txt`.",
        "",
        "Mix: 12 recall questions, 8 did-you-knows, 5 method posts, 5 product moments. No price in any post.",
        "",
        "| Date | Day | Kind | Reel | Recall question |",
        "|---|---|---|---|---|",
        *md,
        "",
        "## Reel files",
        "",
        "Every reel file name was checked against the 100 illustrated shorts and the 257 syllabus videos: all 30 exist.",
        "The video to upload for each day is named at the top of its Instagram file and in `calendar.csv`.",
        *([f"- Only in split parts on this Mac (join first): {', '.join(parts)}."] if parts else []),
        *([f"- No social cut on this Mac yet: {', '.join(missing)}. Use the plain .mp4, or swap the day's reel."] if missing else []),
        "- Days 1 and 9 use syllabus videos (`2000-01/01-ca-to-static.mp4`, `2000-02/14-nagara-dravida.mp4`). They are",
        "  in the app's video library, not in the shorts zips.",
        "",
        "## Same short close together",
        "",
        "These shorts are also in the reels calendar within a week. For these 30 days that calendar posts to YouTube only,",
        "so each one shows once on Instagram (K1) and once on YouTube. Fine as is; swap a day's reel if you'd rather not.",
        "",
        *([f"- {c}" for c in clashes] or ["None within 7 days."]),
        "",
        f"Remake after edits: `python3 -I artefacts/marketing-2026-11-21/k1-queue.py --start {START}`",
        "",
    ]), "utf-8")
    print(f"{len(rows)} days, {len(list((OUT / 'days').glob('*.txt')))} files → {OUT}")
    print("clashes:", *clashes, sep="\n  ")
    print("missing:", missing, "parts:", parts)


if __name__ == "__main__":
    main()
