"""Uploads finished, checked readings to R2 and attaches them to the live library items (data.audio.<lang>).
python3 publish.py [--dry] [--ids a,b]   Only readings whose every chunk passed the speech-to-text check go up."""
import json, os, glob, hashlib, subprocess, sys, argparse, datetime
HERE = os.environ.get("CARTESIA_DATA", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "audio", "cartesia"))
SERVER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "server")
PREFIX = "audio-ai/2026-11"
ACTOR = "Aspiran (owner publish)"

def sh(args):
    r = subprocess.run(args, cwd=SERVER, capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stderr[-800:] or r.stdout[-800:])
    return r.stdout

def d1(sql_file=None, command=None):
    a = ["npx", "wrangler", "d1", "execute", "upsc-pods", "--remote", "--env", "production", "--json"]
    a += ["--file", sql_file] if sql_file else ["--command", command]
    out = sh(a)
    try: return json.loads(out[out.index("["):])
    except ValueError:
        if sql_file and "error" not in out.lower(): return None
        raise RuntimeError(out[-600:])

def spoken_hash(kind, j, lang):
    src = j["sections"].get(lang) if kind == "read" else (j.get("script") or {}).get(lang)
    return hashlib.sha256(json.dumps(src, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()[:16]

q = lambda s: "'" + s.replace("'", "''") + "'"

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--dry", action="store_true"); ap.add_argument("--ids"); a = ap.parse_args()
    reps = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(HERE, "out", "*", "*.json")))]
    reps = [r for r in reps if not r["failed"] and (not a.ids or r["id"] in a.ids.split(","))]
    donef = os.path.join(HERE, "published.json"); done = json.load(open(donef)) if os.path.exists(donef) else {}
    reps = [r for r in reps if done.get(f'{r["kind"]}:{r["id"]}.{r["lang"]}') != os.path.getmtime(r["file"])]
    by = {}
    for r in reps: by.setdefault((r["kind"], r["id"]), []).append(r)
    print(f"{len(reps)} readings for {len(by)} items")
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    for (kind, iid), rs in by.items():
        lid = f"{kind}:{iid}"
        row = d1(command=f"SELECT json, hi_editor FROM library WHERE id = {q(lid)}")[0]["results"]
        if not row: print("missing", lid); continue
        j = json.loads(row[0]["json"])
        audio = dict(j.get("audio") or {})
        for r in rs:
            key = f"{PREFIX}/{kind}/{iid}.{r['lang']}.mp3"
            if not a.dry:
                sh(["npx", "wrangler", "r2", "object", "put", f"upsc-pods-media/{key}", "--remote", "--env", "production", "--file", r["file"], "--content-type", "audio/mpeg", "--cache-control", "public, max-age=86400"])
            audio[r["lang"]] = {"url": f"/media/{key}", "seconds": r["seconds"], "voice": r["voice"], "ai": True, "provider": r["provider"], "by": r["model"],
                                "chapters": r["chapters"], "src": spoken_hash(kind, j, r["lang"]), "made": now[:10]}
        j["audio"] = audio
        body = json.dumps(j, ensure_ascii=False, separators=(",", ":"))
        sql = (f"UPDATE library SET json = {q(body)}, updated_at = {q(now)} WHERE id = {q(lid)};\n"
               f"INSERT INTO content_versions (item_type, item_id, json, action, actor, at) VALUES ('library', {q(lid)}, {q(body)}, 'AI voice reading added: {','.join(sorted(audio))}', {q(ACTOR)}, {q(now)});\n"
               f"INSERT INTO audit (at, actor_id, actor, action, target, detail) VALUES ({q(now)}, NULL, {q(ACTOR)}, 'library.audio', {q(lid)}, {q('AI voice: ' + ', '.join(f"{l} {a['by']} / {a['voice']}" for l, a in sorted(audio.items())))});\n")
        f = os.path.join(HERE, "sql", f"{kind}.{iid}.sql"); os.makedirs(os.path.dirname(f), exist_ok=True); open(f, "w").write(sql)
        if not a.dry:
            d1(sql_file=f)
            for r in rs: done[f'{r["kind"]}:{r["id"]}.{r["lang"]}'] = os.path.getmtime(r["file"])
            json.dump(done, open(donef, "w"))
        print("ok" if not a.dry else "dry", lid, sorted(audio))
