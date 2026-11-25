"""Second live import of 25 Nov 2026 (content gaps, part 2): builds SQL written straight to D1, as on 21 and 25 Nov.
   python3 -I live-import.py <live-before.json> <new-facts.json> <local-papers.json> <out dir>
live-before.json: the live library rows (SELECT *) for the notes and topic paths in scope.
new-facts.json: {library id: factsToCheck} from content/syllabus and content/topic-paths at the merged commit.
local-papers.json: the new pyq rows as the real importer wrote them on a fresh local server (SELECT * FROM library).
Notes and topic paths keep their live JSON and take only `factsToCheck` (nothing else changed in the files), so recorded
readings are kept. Papers are new rows, English approved. Every write adds one content_versions row.
Approvals: "Aspiran (owner publish)"."""
import json, os, sys
before_f, facts_f, papers_f, out = sys.argv[1:5]
DAY, AT, WHO, ACT = os.environ.get("DAY", "2026-11-25"), os.environ.get("AT", "2026-11-25T12:00:00.000Z"), "Aspiran (owner publish)", os.environ.get("ACT", "import 2026-11-25b batch and approve")
dump = lambda d: json.dumps(d, separators=(",", ":"), ensure_ascii=False)
q = lambda v: "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"
before = {r["id"]: r for r in json.load(open(before_f))}
facts = json.load(open(facts_f))
items, expect = [], {}
for k, f in facts.items():
    live = before[k]
    assert dump(json.loads(live["json"])) == live["json"], k + ": live JSON does not round-trip"
    assert live["status"] == "approved" and live["en_editor"] and live["hi_editor"], k + ": not approved in both languages"
    data = json.loads(live["json"])
    if data.get("factsToCheck") == f: continue
    data["factsToCheck"] = f; j = dump(data)
    # Topic paths run to 175 KB, over D1's 100 KB statement limit, so only factsToCheck is sent: json_set changes that
    # one key in place, and the history row copies the result. verify.py checks the outcome byte for byte against `j`.
    items.append([f"UPDATE library SET json = json_set(json, '$.factsToCheck', json({q(dump(f))})), status = 'approved', en_editor = {q(WHO)}, en_checked_on = {q(DAY)}, hi_editor = {q(WHO)}, hi_checked_on = {q(DAY)}, updated_at = {q(AT)} WHERE id = {q(k)};",
                  f"INSERT INTO content_versions (item_type, item_id, json, action, actor, at) SELECT 'library', id, json, {q(ACT)}, {q(WHO)}, {q(AT)} FROM library WHERE id = {q(k)};"])
    expect[k] = dict(json=j, status="approved", en_editor=WHO, hi_editor=WHO, en_checked_on=DAY, hi_checked_on=DAY, title=live["title"], flags=live["flags"], pack=live["pack"], translations=live["translations"], approvals=live["approvals"])
for r in json.load(open(papers_f)):
    assert r["kind"] == "pyq" and r["id"] not in before, r["id"]
    items.append([f"INSERT INTO library (id, kind, pack, title, json, flags, status, en_editor, en_checked_on, updated_at) VALUES ({q(r['id'])}, 'pyq', {q(r['pack'])}, {q(r['title'])}, {q(r['json'])}, {q(r['flags'])}, 'approved', {q(WHO)}, {q(DAY)}, {q(AT)});",
                  f"INSERT INTO content_versions (item_type, item_id, json, action, actor, at) VALUES ('library', {q(r['id'])}, {q(r['json'])}, {q(ACT)}, {q(WHO)}, {q(AT)});"])
    expect[r["id"]] = dict(json=r["json"], status="approved", en_editor=WHO, hi_editor=None, en_checked_on=DAY, hi_checked_on=None, title=r["title"], flags=r["flags"], pack=r["pack"], translations=None, approvals=None)
os.makedirs(out, exist_ok=True)
for i in range(0, len(items), 40):
    open(f"{out}/batch-{i // 40 + 1}.sql", "w").write("\n".join(s for it in items[i:i + 40] for s in it) + "\n")
json.dump(expect, open(f"{out}/expect.json", "w"), ensure_ascii=False)
print(len(items), "items in", -(-len(items) // 40), "batches;", sum(k.startswith("pyq:") for k in expect), "papers")
