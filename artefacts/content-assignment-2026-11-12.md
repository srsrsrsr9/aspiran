# Content assignment 8, 12 Nov 2026: filling the gaps from the full review

**For the owner:** paste everything below the line into the other AI, and attach `artefacts/content-reference-part8.zip`
(format samples, the syllabus ids, the list of notes we already have, and the checker). It is written so the result can
be imported as it comes back. Batches are in priority order: stop anywhere and what's done is still useful.

Three things only you can do are at the very end.

---

## Brief for the AI building this

You are making study content for **Aspiran**, an app for India's UPSC Civil Services Exam, in **English and Hindi**.
Another system will import your files directly, so the formats and the checks below are not optional. Read the
attached zip first:

- `samples/syllabus-node-ids.js` and `samples/syllabus-lines.js`: every syllabus topic ("node", e.g. `gs2-2`) and its
  lines. **Every item you make must name the node ids it belongs to, using only ids from this file.**
- `samples/existing-notes.txt`: the 98 notes that already exist (id, title, nodes), and `existing-notes/`: the notes
  themselves. Don't remake them; G1 corrects them.
- `samples/*.json`: one real file of each format. **Copy the shape exactly:** same keys, same nesting, same `schema`.
- `tools/check.py`: run it on your output folder before you hand anything back. It must report no issues.

### What Aspiran is (so the content fits)

Aspiran is a **companion to the standard books, not a replacement**. Its job is to make an aspirant remember what
they read, use it in an answer, and see where they stand. So the content is recall questions, past questions, answer
frames and short, exact notes. Not long lectures.

### Rules for every file

1. **Facts.** Every fact that can change (a number, a date, an office-holder, a court ruling, a scheme, a rate, a
   committee, an amendment) goes in the item's `factsToCheck` list with: the claim, the **primary source** (the Act,
   the judgment, the Gazette, PIB, the ministry or commission's own report, UPSC's own PDF), its URL, and the date you
   opened it. Coaching sites, Wikipedia and news reports are not primary sources. If you can't open the primary
   source, write `"status": "unverified"` on that fact. Never guess.
2. **As of.** Every item carries `"review": {"asOf": "YYYY-MM-DD", "recheckBy": "YYYY-MM-DD", "recheckWhen": "..."}`.
   `recheckWhen` says what event would make it stale ("next Union Budget", "Supreme Court ruling in the Kerala
   borrowing suit", "Census 2027 figures published"). Things that never change get `recheckBy` two years out.
3. **Current to today.** Assume today is 12 Nov 2026. Prelims 2026 has been held. The 16th Finance Commission has
   reported (41% kept for 2026 to 2031). GST moved to 5% and 18% with a 40% rate from 22 Sep 2025. The Supreme Court's
   opinion on Governors' assent is dated 20 Nov 2025. Check everything else of this kind yourself.
4. **Past questions are sacred.** A question may be called a UPSC past question only if its text and its answer key
   come word for word from UPSC's own paper and UPSC's own key. Give the year, paper and question number. If you write
   a question yourself, it is "practice", never "PYQ".
5. **Hindi.** Every English string has its Hindi beside it (`en` / `hi`, as in the samples). Use the terms UPSC's own
   Hindi papers use. Where a term is better known in English, give both: राजकोषीय घाटा (fiscal deficit).
6. **Tone.** Plain, calm, exact. No emoji, no exclamation marks, no "topper's secret", no rank or selection talk, no
   praise or blame of any party, leader, religion, caste or region. Maps are described in words, never drawn with
   national borders.
7. **Ids.** Lower-case, hyphenated, unique, and stable: `<subject>-<topic>-<slug>`. Never reuse an id from
   `existing-notes.txt`.
8. **No invented quotes, people, cases, reports or statistics.** If you need an example and can't source it, leave it out.

### How to vet before handing back (do all four)

1. **Make** the batch.
2. **Second read by a different model** (not the one that wrote it). It gets only the file and the primary sources,
   and must list every claim it could not find in a source. Fix or mark `unverified`.
3. **Solve every question blind.** A fresh pass answers each MCQ without seeing the key. Any disagreement with the key
   is looked up and settled, with the source noted.
4. **Run `python3 tools/check.py <your folder>`.** Zero issues.

Then write `checks/manifest-<batch>.json` (shape in `samples/manifest-sample.json`): every file with its path, id and
item count, the model that made it, the model that checked it, the count of `unverified` facts, and an
`openQuestions` list for anything a human must decide.

### What to hand back

One zip per batch, named `aspiran-<batch>.zip`, with this layout:

```
syllabus/<subject>.json            notes (schema upsc-pods/syllabus-notes@1)
topic-paths/<node>.json            one whole topic, start to finish (schema aspiran/topic-path@1)
pyq/pyq-<year>-<paper>.json        past papers (pyq.schema.json)
mocks/<id>.json                    mock papers
data/<name>.json                   G4, G6 and G7 below
checks/manifest-<batch>.json
```

---

## The batches, in order

### G1. Fact refresh of the 98 existing notes (do this first)

A review of one flagship topic found nine wrong or out-of-date facts. Assume the rest are the same.

- The 98 notes are in the zip under `existing-notes/` (14 files). For each note, hand back the **same file with the
  facts corrected in place** (English and Hindi), every time-sensitive claim added to that note's `factsToCheck` with
  its primary source, and `review.asOf`, `review.recheckBy`, `review.recheckWhen` filled. Keep every id unchanged.
- List what you changed, note by note, in `checks/G1-changes.md` (old wording, new wording, source).
- Order: Polity (16 notes), Economy (8), Governance (8), International relations (6), Environment (6), Science and
  technology (8), then the rest.
- Done when: all 14 files are back, the checker passes, and each changed fact has a primary source or is marked `unverified`.

### G2. One subject, complete: Polity (GS2 nodes `gs2-1` to `gs2-7`, and `pre-4`)

This is the loop the first users will live in. Make it whole before touching anything else.

For **each of the eight nodes**, one topic path in the exact shape of `samples/topic-path-federalism.json`
(`gs2-2` exists; make the other seven):

- a guess-first opener, 4 to 6 short reads (300 to 500 words each), a recall check after each read;
- **every UPSC Prelims question on this node from 2011 to 2026** and **every Mains question from 2013 to 2025**, word
  for word, with year and number (see rule 4);
- three Mains questions with a full answer frame each: what the directive word asks, a 6-line skeleton, the two
  examples and one case or report that earn marks, and a 150-word model answer;
- 12 review cards for spaced recall;
- `factsToCheck`, `sources`, `review` as in the rules.

Done when: seven files, each passing the checker, each with zero `unverified` facts in the PYQ step.

### G3. The topics with nothing, or almost nothing

Notes in the shape of `samples/syllabus-note-sample.json` (900 to 1,400 words, `keyFacts`, `examAngle`, `selfCheck`
with 5 questions, Hindi).

| Node | Topic | Have | Make |
|---|---|---:|---|
| `csat-1` to `csat-6` | Comprehension; logical reasoning; decision making; mental ability; numeracy and data interpretation; interpersonal skills | 0 | 2 method notes each (12), each with 15 worked questions |
| `gs4-6` | Ethics case studies | 0 | 3 notes: how to read a case, the stakeholder frame, writing the answer |
| `essay-1`, `essay-2` | Essay and answer structure | 0 | 4 notes: picking the topic, the skeleton, openings and closings, common faults |
| `gs2-5` | Elections and the RPA | 1 | 3 more |
| `gs2-11` | Indian diaspora | 1 | 2 more |
| `gs3-2` | Budgeting and taxation | 1 | 3 more (Budget 2026-27 figures from the Budget documents only) |
| `gs3-4` | Industry and infrastructure | 1 | 3 more |
| `gs4-3` | Emotional intelligence | 1 | 2 more |
| `gs4-4` | Moral thinkers | 1 | 4 more (Indian and Western, their own words sourced) |

### G4. The book map (new, small, high value)

Aspirants read standard books. Tell them exactly where each syllabus line lives.

`data/book-map.json`: for every node in `syllabus-node-ids.js` (common papers only), a list of
`{ "book", "edition", "chapters": ["12. Fundamental Rights", ...], "pages": "optional", "note": {en, hi} }` covering
the NCERTs (class and chapter), Laxmikanth's *Indian Polity*, Spectrum's *Modern India*, the usual economy, geography,
environment and ethics texts, and free official sources (the Economic Survey, India Year Book, ARC reports) with
their chapter names. Chapter titles must be copied from the book's own contents page for the edition you name. If you
can't see the contents page, say so in `openQuestions` instead of guessing.

### G5. Past papers, complete

Shape: `samples/pyq-sample.json` and `pyq.schema.json`. UPSC's own PDFs and keys only.

- **Prelims GS Paper I:** 2011 to 2017, 2020, 2022, 2024, 2026 (we hold 2018, 2019, 2021, 2023, 2025). Note any
  question UPSC dropped.
- **Prelims CSAT (Paper II):** 2021 to 2026.
- **Mains GS1 to GS4 and Essay:** 2013 to 2024 (we hold 2025).
- **Every question tagged** with its node id(s) and, for Prelims, the trap type if any (extreme word, two close
  options, outdated fact, "how many of the above").
- **Hindi from UPSC's own Hindi paper**, not a translation. Where you can't get the Hindi paper, leave `hi` empty and
  list the paper in `openQuestions`.

### G6. Cut-offs ("where do I stand", shown privately)

`data/cutoffs.json`: UPSC's official cut-off marks for Prelims (GS Paper I, by category), Mains and Final, for
CSE 2013 to 2025, each row with the URL of UPSC's own cut-off notice. No estimates, no coaching-site numbers.

### G7. A public page for every topic (for search)

`data/node-intro.json`: for each common-paper node, in English and Hindi:

- `what`: 80 to 120 words on what UPSC actually asks from this topic, in plain words;
- `counts`: how many Prelims and Mains questions it drew in each year we hold (computed from G5, not estimated);
- `faq`: 3 real questions aspirants ask about this topic, each answered in under 60 words;
- `tryQuestion`: one past question (with year) and a two-line explanation of the answer.

These are shown to people who haven't signed in, so they must be accurate, modest, and make no promises.

### G8. More mocks

- Prelims GS Paper I mocks 4 to 8 (100 questions each, UPSC's spread of subjects and question styles from 2023 to
  2026), CSAT mocks 3 and 4, and one 25-question sectional test per subject (9 files).
- Shape: `samples/mock-sample.json`. Every question: node id, a 2 to 4 line explanation, the source of the fact.
- Step 3 of the vetting (blind solve) is mandatory here. Report the agreement rate in the manifest.

### G9. One optional, done properly (wait for the owner's choice)

Don't spread over six. The owner picks **one** optional. For it: every syllabus topic of both papers as a node note
(the existing optional node shape), the past questions from 2013 to 2025 tagged by node, and 40 answer frames.

---

## Only the owner can do these

1. **50 real, human-marked Mains answers** (25 English, 25 Hindi, with the evaluator's marks and comments), from
   people who agree to share them. This is the test set that proves the AI marker; no AI can make it.
2. **Pick the one optional** for G9.
3. **Clean PDFs** of any UPSC paper or key the other AI says it couldn't open (it will list them in `openQuestions`).
