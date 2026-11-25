"""Replace live past papers with a newer local build (for example once UPSC's answer key is filled), approved in English.
   python3 -I key-update.py <local rows.json> <out dir>
local rows.json: the papers as the real importer wrote them on a local server (SELECT * FROM library WHERE id IN ...).
Writes one UPDATE and one content_versions row per paper, plus expect.json for verify.py (run it with ACT set to the
action below). Approvals: "Aspiran (owner publish)"."""
import json, os, sys
rows_f, out = sys.argv[1:3]
DAY, AT, WHO, ACT = "2026-11-25", "2026-11-25T18:00:00.000Z", "Aspiran (owner publish)", "official key 2026-11-25 and approve"
q = lambda v: "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"
sql, expect = [], {}
for r in json.load(open(rows_f)):
    assert r["kind"] == "pyq", r["id"]
    sql += [f"UPDATE library SET json = {q(r['json'])}, flags = {q(r['flags'])}, title = {q(r['title'])}, status = 'approved', en_editor = {q(WHO)}, en_checked_on = {q(DAY)}, updated_at = {q(AT)} WHERE id = {q(r['id'])};",
            f"INSERT INTO content_versions (item_type, item_id, json, action, actor, at) VALUES ('library', {q(r['id'])}, {q(r['json'])}, {q(ACT)}, {q(WHO)}, {q(AT)});"]
    expect[r["id"]] = dict(json=r["json"], flags=r["flags"], title=r["title"], status="approved", en_editor=WHO, en_checked_on=DAY)
os.makedirs(out, exist_ok=True)
open(f"{out}/batch-1.sql", "w").write("\n".join(sql) + "\n")
json.dump(expect, open(f"{out}/expect.json", "w"), ensure_ascii=False)
print(len(expect), "papers;", "ACT=" + ACT)
