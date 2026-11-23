"""Build the sample Morning Paper page from an edition file.

Usage (from the repo root):
  python3 artefacts/newspaper-reader-v2/build.py artefacts/newspaper-reader-v2/edition-2026-11-20.json

It copies each linked past UPSC question word for word from content/pyq/pyq.json (with the official key and
explanation where the bank has them), so the page never carries a retyped question. Output: morning-paper.html.
In the real app the same edition JSON would come from the server each morning and the renderer would stay put.
"""
import json, pathlib, sys

here = pathlib.Path(__file__).resolve().parent
root = here.parent.parent
edition = json.loads(pathlib.Path(sys.argv[1]).read_text())
bank = json.loads((root / "content/pyq/pyq.json").read_text())
papers = {p["id"]: p for p in bank["papers"]}

pyqs = {}
for story in edition["stories"]:
    for link in story.get("pyq", []):
        pid, n = link["ref"].split("#")
        paper = papers[pid]
        q = next(x for x in paper["questions"] if x["n"] == n)
        if paper["exam"] == "prelims" and paper["answerKey"].get("status") != "official":
            raise SystemExit(f"{link['ref']}: no official key, not linking it")
        entry = {"exam": paper["exam"], "year": paper["year"], "paper": paper["paper"], "n": n,
                 "src": paper["source"]["url"], "en": q["en"], "hi": q.get("hi"),
                 "marks": q.get("marks"), "words": q.get("words")}
        if paper["exam"] == "prelims":
            entry["answer"] = q["answer"]
            why = (q.get("explain") or {}).get("why")
            if why:
                entry["why"] = why
        pyqs[link["ref"]] = entry
edition["pyqs"] = pyqs

data = json.dumps(edition, ensure_ascii=False).replace("</", "<\\/")
html = (here / "paper-template.html").read_text().replace("/*EDITION*/", data)
(here / "morning-paper.html").write_text(html)
print("wrote", here / "morning-paper.html", len(html), "bytes,", len(pyqs), "past questions")
