"""Publishes the recorded study-walk episodes (walks.py) as Audio lectures: uploads each MP3 to R2 and writes the library
row as approved by "Aspiran (owner publish)" (owner's standing rule, 14 Nov 2026), with a content_versions row and an audit line.
python3 walks_publish.py [--dry] [--ids a,b]   An episode goes up only when both languages are recorded with no failed part.
The entry: read-along chapters (speakers named), the three recall questions as checks, recording.<lang> = [url], and
audio.<lang> = { url, seconds, chapters } so the Listen page lists it. Nothing in it names or describes the voice."""
import json, os, re, glob, argparse, datetime, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import publish, walks

SRC = walks.SRC
PACK = "study-walks-2026-11-21"
PREFIX = "audio-ai/2026-11/study-walk"
SUBJECT = {"gs1-2": ("history", "GS1"), "gs2-1": ("polity", "GS2"), "gs3-1": ("economy", "GS3")}
SAY = {"en": {"N": "Narrator", "F": "Friend", "pause": "(Pause. Answer in your head.)",
              "ch": ["The story", "Three things to keep", "Three questions", "To close"]},
       "hi": {"N": "वाचक", "F": "दोस्त", "pause": "(रुकिए। मन में जवाब दीजिए।)",
              "ch": ["कहानी", "तीन बातें याद रखें", "तीन सवाल", "आख़िर में"]}}
KEEP = re.compile(r"three things to keep|तीन बातें याद", re.I)
ASK = re.compile(r"three (quick )?(recall )?questions|three quick ones|तीन (छोटे )?सवाल|^(One|Question one)\.", re.I)

def lines_of(path):
    out = []
    for raw in open(path, encoding="utf8").read().splitlines():
        raw = raw.strip()
        if not raw: continue
        m = re.fullmatch(r"\[pause (\d+(?:\.\d+)?)s\]", raw)
        out.append(("pause", None) if m else (raw[0], raw[2:].strip()))
    return out

def chapter_starts(ls):
    """Line index where each of the four chapters starts (None when a script has no marker for it)."""
    pauses = [i for i, l in enumerate(ls) if l[0] == "pause"]
    first_q = pauses[0]
    ask = next((i for i in range(first_q - 1, max(-1, first_q - 4), -1) if ls[i][0] == "N" and ASK.search(ls[i][1])), first_q - 1)
    keep = next((i for i in range(ask - 1, max(-1, ask - 8), -1) if ls[i][0] == "N" and KEEP.search(ls[i][1])), None)
    end = pauses[-1] + 2 if pauses[-1] + 2 < len(ls) else None   # the answer after the last pause, then the close
    return [0, keep, ask, end]

def build_lang(d, lang, rep):
    ls = lines_of(glob.glob(os.path.join(SRC, "*", f'{d["id"]}.{lang}.txt'))[0])
    starts = chapter_starts(ls)
    S = SAY[lang]
    bounds = [(k, s) for k, s in enumerate(starts) if s is not None]
    chapters, audio_ch = [], []
    segs = walks.parse(glob.glob(os.path.join(SRC, "*", f'{d["id"]}.{lang}.txt'))[0])
    marks = {int(k): v for k, v in rep["marks"].items()}
    for n, (k, s) in enumerate(bounds):
        e = bounds[n + 1][1] if n + 1 < len(bounds) else len(ls)
        text = "\n\n".join(S["pause"] if w == "pause" else f"{S[w]}: {t}" for w, t in ls[s:e])
        chapters.append({"title": S["ch"][k], "script": text})
        # Time of the chapter's first spoken part in the joined file.
        head = next(t for w, t in ls[s:e] if w != "pause")
        seg = next(i for i, sg in enumerate(segs) if sg[0] != "pause" and head.startswith(sg[1][:40]))
        audio_ch.append({"t": marks.get(seg, 0.0), "title": S["ch"][k]})
    r = d["recall"]
    check = [{"q": q["q"][lang], "options": q["options"][lang], "answerIndex": q["answerIndex"], "why": q["why"][lang]} for q in r]
    summary = ls[0][1]   # the opening question
    return {"title": d["title"][lang], "summary": summary, "chapters": chapters, "check": check}, audio_ch

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--dry", action="store_true"); ap.add_argument("--ids"); a = ap.parse_args()
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"); today = now[:10]
    for jf in sorted(glob.glob(os.path.join(SRC, "A*", "*.json"))):
        d = json.load(open(jf, encoding="utf8"))
        if a.ids and d["id"] not in a.ids.split(","): continue
        reps = {}
        for lang in ("en", "hi"):
            p = os.path.join(walks.OUT, f'{d["id"]}.{lang}.json')
            if os.path.exists(p): reps[lang] = json.load(open(p))
        if set(reps) != {"en", "hi"} or any(r["failed"] for r in reps.values()):
            print("skip (not fully recorded and checked):", d["id"]); continue
        subject, paper = SUBJECT[d["node"]]
        item = {"kind": "audio-lecture", "id": d["id"], "series": "study-walk", "batch": d["batch"], "subject": subject, "paper": paper,
                "node": d["node"], "line": d.get("line"), "tone": d["tone"], "minutes": round(reps["en"]["seconds"] / 60),
                "pastQuestions": d.get("pastQuestions", []), "sources": d["sources"], "factsToCheck": d.get("factsToCheck", []),
                "recording": {}, "audio": {}}
        for lang in ("en", "hi"):
            item[lang], ach = build_lang(d, lang, reps[lang])
            key = f"{PREFIX}/{d['id']}.{lang}.mp3"
            if not a.dry:
                publish.sh(["npx", "wrangler", "r2", "object", "put", f"upsc-pods-media/{key}", "--remote", "--env", "production",
                            "--file", reps[lang]["file"], "--content-type", "audio/mpeg", "--cache-control", "public, max-age=86400"])
            item["recording"][lang] = [f"/media/{key}"]
            item["audio"][lang] = {"url": f"/media/{key}", "seconds": reps[lang]["seconds"], "provider": "fish", "by": "Fish Audio s2.1-pro",
                                   "voice": " + ".join(reps[lang]["voices"]), "chapters": ach, "made": today}
        lid = f"audio-lecture:{d['id']}"
        title = f"Audio lecture: {item['en']['title']} ({item['minutes']} min)"
        flags = [f"From pack {PACK}: Track A batch {d['batch']}, made by the content account; recorded with Fish Audio (two voices), every part checked by speech-to-text",
                 f"{len(item['factsToCheck'])} facts the writer could not open a source for were left out or worded safely; see factsToCheck"]
        body = json.dumps(item, ensure_ascii=False, separators=(",", ":"))
        q = publish.q
        A = publish.ACTOR
        sql = (f"INSERT INTO library (id, kind, pack, title, json, flags, status, en_editor, en_checked_on, hi_editor, hi_checked_on, updated_at) "
               f"VALUES ({q(lid)}, 'audio-lecture', {q(PACK)}, {q(title)}, {q(body)}, {q(json.dumps(flags, ensure_ascii=False))}, 'approved', {q(A)}, {q(today)}, {q(A)}, {q(today)}, {q(now)}) "
               f"ON CONFLICT(id) DO UPDATE SET json = excluded.json, title = excluded.title, flags = excluded.flags, pack = excluded.pack, status = 'approved', "
               f"en_editor = excluded.en_editor, en_checked_on = excluded.en_checked_on, hi_editor = excluded.hi_editor, hi_checked_on = excluded.hi_checked_on, updated_at = excluded.updated_at;\n"
               f"INSERT INTO content_versions (item_type, item_id, json, action, actor, at) VALUES ('library', {q(lid)}, {q(body)}, 'Study walk imported, recorded and approved', {q(A)}, {q(now)});\n"
               f"INSERT INTO audit (at, actor_id, actor, action, target, detail) VALUES ({q(now)}, NULL, {q(A)}, 'library.approve', {q(lid)}, {q('Study walk with recording (en, hi), Fish Audio')});\n")
        f = os.path.join(publish.HERE, "sql", f"walk.{d['id']}.sql"); os.makedirs(os.path.dirname(f), exist_ok=True); open(f, "w").write(sql)
        out_json = os.path.join(walks.OUT, f"{d['id']}.item.json"); json.dump(item, open(out_json, "w"), ensure_ascii=False, indent=1)
        if not a.dry: publish.d1(sql_file=f)
        print("dry" if a.dry else "ok", lid, item["minutes"], "min", [len(item[l]["chapters"]) for l in ("en", "hi")], "chapters")
