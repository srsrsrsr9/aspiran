"""Assemble a Track A batch: python3 -I assemble.py <batch> <workdir>
Copies episodes to /mnt/project-files/aspiran-batches/v2/audio/<batch>/, writes checks/manifest, checks/report,
checks/self-check.txt and aspiran-<batch>.zip (one top-level folder named after the batch)."""
import json, os, sys, glob, shutil, subprocess, zipfile, datetime

batch, work = sys.argv[1], sys.argv[2]
kit = os.path.dirname(os.path.abspath(__file__))
dest = f"/mnt/project-files/aspiran-batches/v2/audio/{batch}"
stage = os.path.join(os.path.dirname(work.rstrip("/")), "_stage", batch)
shutil.rmtree(stage, ignore_errors=True)
os.makedirs(os.path.join(stage, "checks"))

chk = subprocess.run([sys.executable, "-I", os.path.join(kit, "check_audio.py"), work], capture_output=True, text=True)
eps = []
for jf in sorted(glob.glob(os.path.join(work, "*.json"))):
    if os.path.basename(jf).startswith("_"): continue
    d = json.load(open(jf, encoding="utf-8"))
    i = d["id"]
    for ext in (".json", ".en.txt", ".hi.txt"):
        shutil.copy(os.path.join(work, i + ext), os.path.join(stage, i + ext))
    eps.append(d)

files = []
for d in eps:
    for ext, kind in ((".en.txt", "script-en"), (".hi.txt", "script-hi"), (".json", "episode")):
        files.append({"path": f"{batch}/{d['id']}{ext}", "id": d["id"], "kind": kind})
manifest = {
    "batch": batch,
    "made": datetime.date.today().isoformat(),
    "model": "Claude Opus 5.5",
    "track": "A",
    "files": files,
    "episodes": [{"id": d["id"], "node": d["node"], "line": (d["line"] or {}).get("en"), "title": d["title"]["en"],
                  "minutes": d["minutes"], "words": d["words"], "tone": d["tone"], "sources": len(d["sources"]),
                  "factsToCheck": len(d["factsToCheck"])} for d in eps],
    "counts": {"episodes": len(eps), "minutes": round(sum(d["minutes"] for d in eps), 1),
               "recall": sum(len(d["recall"]) for d in eps), "sources": sum(len(d["sources"]) for d in eps),
               "factsToCheck": sum(len(d["factsToCheck"]) for d in eps)},
    "voiceNotes": "",
}
json.dump(manifest, open(os.path.join(stage, "checks", f"manifest-{batch}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(os.path.join(stage, "checks", "self-check.txt"), "w", encoding="utf-8").write(chk.stdout + chk.stderr)

parts = []
for rf in sorted(glob.glob(os.path.join(work, "_report-*.md"))):
    parts.append(open(rf, encoding="utf-8").read().strip())
head = [f"# Report: audio batch {batch} ({datetime.date.today():%d %b %Y})", "",
        f"{len(eps)} episodes, about {manifest['counts']['minutes']} minutes of English audio (Hindi runs a little longer).",
        f"Code checks: {chk.stdout.strip().splitlines()[-1] if chk.stdout.strip() else 'not run'}.", "",
        "| id | line | min | tone | sources | facts to check |", "|---|---|---|---|---|---|"]
for d in eps:
    head.append(f"| {d['id']} | {(d['line'] or {}).get('en') or d['node']} | {d['minutes']} | {d['tone']} | {len(d['sources'])} | {len(d['factsToCheck'])} |")
ftc = [f"- {d['id']}: {x}" for d in eps for x in d["factsToCheck"]]
body = "\n".join(head) + "\n\n## Facts left out or still to check\n\n" + ("\n".join(ftc) or "None.") + "\n\n## Notes per episode\n\n" + "\n\n".join(parts) + "\n"
open(os.path.join(stage, "checks", f"report-{batch}.md"), "w", encoding="utf-8").write(body)

zp = os.path.join(os.path.dirname(stage), f"aspiran-{batch}.zip")
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, fs in os.walk(stage):
        for f in sorted(fs):
            p = os.path.join(root, f)
            z.write(p, os.path.join(batch, os.path.relpath(p, stage)))
os.makedirs(dest, exist_ok=True)
for root, _, fs in os.walk(stage):
    for f in fs:
        p = os.path.join(root, f); t = os.path.join(dest, os.path.relpath(p, stage))
        os.makedirs(os.path.dirname(t), exist_ok=True); shutil.copy(p, t)
shutil.copy(zp, os.path.join(dest, f"aspiran-{batch}.zip"))
print(dest, len(eps), "episodes;", chk.stdout.strip().splitlines()[-1] if chk.stdout.strip() else "")
