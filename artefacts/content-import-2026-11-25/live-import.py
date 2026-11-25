"""Live import of 25 Nov 2026 (content gaps): builds SQL written straight to D1, as on 21 Nov.
   python3 -I live-import-2026-11-25.py <live-before.json> <local-import.json> <out dir>
live-before.json: the live library rows (SELECT *) for the notes in scope.
local-import.json: the same ids after the real importer (npm run import) ran on a local copy seeded with those rows.
Notes keep their live JSON and take only `factsToCheck` from the import: a full re-import would drop the recorded
readings (their `audio` has no `src` hash). Live JSON was written compactly by Python, which round-trips it exactly.
Papers are new rows, English approved. Every write adds one content_versions row. Approvals: "Aspiran (owner publish)"."""
import json, os, sys
before_f, local_f, out = sys.argv[1:4]
DAY, AT, WHO, ACT = "2026-11-25", "2026-11-25T09:00:00.000Z", "Aspiran (owner publish)", "import 2026-11-25 batch and approve"
dump = lambda d: json.dumps(d, separators=(",", ":"), ensure_ascii=False)
q = lambda v: "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"
before = {r["id"]: r for r in json.load(open(before_f))}
items, expect = [], {}
for r in json.load(open(local_f)):
    live = before.get(r["id"])
    if r["kind"] == "read":
        assert live, r["id"]
        assert dump(json.loads(live["json"])) == live["json"], r["id"] + ": live JSON does not round-trip"
        data = json.loads(live["json"]); facts = json.loads(r["json"]).get("factsToCheck")
        if data.get("factsToCheck") == facts: continue
        data["factsToCheck"] = facts; j = dump(data)
        assert live["en_editor"] and live["hi_editor"], r["id"] + ": not approved in both languages"
        items.append([f"UPDATE library SET json = {q(j)}, status = 'approved', en_editor = {q(WHO)}, en_checked_on = {q(DAY)}, hi_editor = {q(WHO)}, hi_checked_on = {q(DAY)}, updated_at = {q(AT)} WHERE id = {q(r['id'])};",
                      f"INSERT INTO content_versions (item_type, item_id, json, action, actor, at) VALUES ('library', {q(r['id'])}, {q(j)}, {q(ACT)}, {q(WHO)}, {q(AT)});"])
        expect[r["id"]] = dict(json=j, status="approved", en_editor=WHO, hi_editor=WHO, en_checked_on=DAY, hi_checked_on=DAY, title=live["title"], flags=live["flags"], pack=live["pack"], translations=live["translations"], approvals=live["approvals"])
    elif r["kind"] == "pyq":
        assert not live, r["id"] + ": already live"
        items.append([f"INSERT INTO library (id, kind, pack, title, json, flags, status, en_editor, en_checked_on, updated_at) VALUES ({q(r['id'])}, 'pyq', {q(r['pack'])}, {q(r['title'])}, {q(r['json'])}, {q(r['flags'])}, 'approved', {q(WHO)}, {q(DAY)}, {q(AT)});",
                      f"INSERT INTO content_versions (item_type, item_id, json, action, actor, at) VALUES ('library', {q(r['id'])}, {q(r['json'])}, {q(ACT)}, {q(WHO)}, {q(AT)});"])
        expect[r["id"]] = dict(json=r["json"], status="approved", en_editor=WHO, hi_editor=None, en_checked_on=DAY, hi_checked_on=None, title=r["title"], flags=r["flags"], pack=r["pack"], translations=None, approvals=None)
os.makedirs(out, exist_ok=True)
for i in range(0, len(items), 40):
    open(f"{out}/batch-{i // 40 + 1}.sql", "w").write("\n".join(s for it in items[i:i + 40] for s in it) + "\n")
json.dump(expect, open(f"{out}/expect.json", "w"), ensure_ascii=False)
print(len(items), "items in", -(-len(items) // 40), "batches;", sum(k.startswith("pyq:") for k in expect), "papers")
