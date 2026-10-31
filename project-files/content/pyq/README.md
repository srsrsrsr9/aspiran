# Previous-year questions (PYQ)

Draft for the content editor. Nothing in this folder is written by a model.

**Source.** Only UPSC's own question papers and answer keys, from the "Previous Question Papers" and "Answer Keys" pages on upsc.gov.in. Prelims keys are published after the whole exam cycle ends. Papers from coaching sites or apps are not used, because their wording and keys differ.

**Why it is empty.** upsc.gov.in blocks automated downloads from Claude's cloud machine, and questions are never typed from memory. A person downloads the PDFs once.

**What a person does (about 20 minutes):**
1. On upsc.gov.in, open Examinations, then Previous Question Papers, then Civil Services (Preliminary). Download General Studies Paper I for the years you want (start with the last five), and the matching answer keys.
2. Put the PDFs in `content/pyq/papers/` (or upload them in the project, and Claude will move them).
3. Run, for each paper and key (or ask Claude to):
   - `node tools/pyq-import.mjs paper pyq/papers/<file>.pdf --year 2025 --paper prelims-gs1 --series A --origin "upsc.gov.in, downloaded <date>"`
   - `node tools/pyq-import.mjs key pyq/papers/<key>.pdf --year 2025 --paper prelims-gs1 --series A --origin "upsc.gov.in, downloaded <date>"`
   - `node tools/pyq-import.mjs check`
4. An editor compares each imported question with the PDF, sets `import.status` to "checked", and tags it with syllabus-map node ids (for Polity, from `polity/syllabus-map.json`).

**How packs link to PYQs.** Packs, long reads and mock questions hang on syllabus-map nodes. When a checked PYQ carries a node id, it appears under that node, and a pack card can show "Asked in Prelims 2023" instead of "No direct PYQ". No pack claims a PYQ link until then.

**Rights.** UPSC papers are public, but check with the lawyer before showing full question text in the app; showing the year, the topic and a link to the official PDF is the safe default.

The importer reads `pdftotext -layout` output. It was tested only on a made-up sample, so expect to fix its parsing on the first real paper, and every question stays "needs-check" until a person compares it.
