# Content assignment 3b, 3 Nov 2026: the next job for the other Claude account

For the owner. Part 2 came back and is checked: 40 printables, 12 audio-lecture scripts, 20 more optional notes,
19 video episodes (13 and 18–35) and 40 recorded audio parts. All of it is in the project as **drafts**. This file
has your answers to its questions (my suggestions, change any you disagree with) and the next job to paste.

## Decide first (5 minutes)
1. **Sarvam credits.** 191 narration parts (about 2.4 lakh characters) wait for credits: the rest of the A1 talks,
   all of A2, and episodes 13 and 25–35. Top up the Sarvam account (check sarvam.ai/api-pricing; at the usual rate
   this is a few hundred rupees), then paste **Message 2**.
2. **B24b.** Upload `content/mocks/prelims-gs1-full-mock-2.json` and `-3.json` with **Message 2**. Without them the
   Hindi for mocks 2 and 3 can't start.
3. **Your answers to its questions.** These are my suggestions and are already written into Message 1. Change any line
   before you paste.

| Question | Suggested answer |
|---|---|
| MGNREGA on the schemes sheet | Add it back under its current name **only after an editor confirms the name** from the Gazette. Put the name in `factsToCheck`. |
| Exam-day checklist subject | Keep `csat` and `Prelims`. |
| CSAT mock passages format | Yes. The importer already reads a `passages` list and a `table` on data questions. |
| CSAT node ids `csat-2` to `csat-5` | Keep them. The editor checks them against the topic list. |
| PTGs or PVTGs | Write **PVTGs**. On the first mention, add "(PTGs in the UPSC syllabus)". |
| Geography map-question node | Yes, add one: `geo-p2-map`, a short guide to the compulsory map question. Schematic only, no national borders. |
| Seismic Zone VI | Leave it as it is. Put it in `factsToCheck` until the BIS code is confirmed. |
| Hindi numbers | Use words in `.voice.txt` files only, because they're read aloud. Use digits on screen (rule C4). |
| Article letters in Hindi | Write 51क(ट) as the Hindi Constitution does, with 51A(k) in brackets on the first mention. |

## What's in the project now (drafts, waiting for the editors)
| Kind | Count | Gap |
|---|---|---|
| Videos | 26 episodes, English placeholder voice | Sarvam voice and Hindi audio (Message 2) |
| Printables | 40 | Fine for now. The app screen is mine to build. |
| Audio lectures | 12 scripts; 2 talks partly recorded | Recording (Message 2) |
| Practice formats | about 110 items over 37 formats | **The biggest gap** (Message 1) |
| Flashcards | 12 decks (144 cards) | Thin (Message 1) |
| Optional notes | about 65 over 6 subjects | Keep going (Message 1) |
| Prelims past papers | 5 GS papers (2018, 2019, 2021, 2023, 2025) loaded by me from upsc.gov.in | I'm checking the other years myself. Not for this account. |

## Order
Message 1 first (practice is the biggest gap), one batch per zip. Message 2 runs once credits are in. Videos are paused
until the recordings exist: 26 episodes are enough for now.

## Files to upload
- With Message 1: `artefacts/practice-format-samples.zip`. It has one real file for each of the 11 formats, and its
  shape is the one to copy.
- With Message 2: `content/mocks/prelims-gs1-full-mock-2.json` and `-3.json`.

---

## Message 1: paste into the content Project (practice, flashcards, optionals)

```text
Claude Code here. Part 2 is checked and in the project as drafts: thank you. Answers to your questions:
- MGNREGA: add it back under its current legal name only if you can cite the Gazette; put the name in factsToCheck.
- Exam-day checklist: keep subject csat, paper Prelims.
- CSAT passages: your format is right (top-level "passages", questions point to a passage id, data questions carry
  "table"). Keep it.
- PTGs vs PVTGs: write PVTGs; on first mention add "(PTGs in the UPSC syllabus)".
- Geography: add a node geo-p2-map for the compulsory map question. Schematic only, no national borders.
- Seismic Zone VI: no change; keep it in factsToCheck.
- Hindi numbers: words only in .voice.txt files; digits everywhere on screen (rule C4).
- Hindi article letters: 51क(ट), with 51A(k) in brackets on first mention.

Next job: practice. The app has 37 practice formats but only 2 to 7 items in each, so a keen aspirant runs out in a
sitting. practice-format-samples.zip has one real file per format: copy its shape exactly (same keys, the same
"schema" value, mood and sfx as in the sample, tags.stage/papers, review.status "draft", sources, tone). One file per
item: practice/<format>/<subject-prefix>-<slug>.json, where the prefix is one of pol, eco, geo, env, anc, med, mod,
art, sci, ir, soc, eth. Each file holds 4 to 6 questions (or 9 to 12 pairs or cards), en and hi side by side.

Batches (one zip each, named X1.zip and so on). Spread the topics over the whole Prelims and GS syllabus; no two files
on the same topic within a format:
X1: how-many-correct (20 files) and trap-spotter (20).
X2: assertion-reason (20) and two-truths (20).
X3: odd-one-out (20) and timeline-shuffle (20).
X4: pair-up (20) and landmark-case (20: one Supreme Court case each, holding and why it matters, from the judgment or
    a reliable law report; if you can't confirm the holding, leave the case out).
X5: fill-the-gap (20) and better-answer (20; Mains answers, GS1 to GS4).
F1: flashcards, 24 decks of 12 cards, 4 for each of Polity, Economy, Geography, Environment, History and Science.
B30: optionals, the next 5 nodes for each of the 6 optionals in the B25 priority order, same node format as B29, plus
    geo-p2-map.

Rules:
- Original questions. Nothing copied from past papers or coaching material.
- Every statement's truth checked against an official source (Constitution, Gazette, PIB, RBI, ministries, NCERT).
  Anything with a date or number goes in factsToCheck. Where a fact changed in 2025 or 2026, use the current one.
- Prelims-style traps are fine. Trick questions with two defensible answers are not.
- No exam predictions, ranks, scores, timers or streaks. Maps: no national borders, schematic only.
- TRAGIC topics (disasters, violence, deaths): leave them out of practice games.
- Run your own code checks before zipping: valid JSON, en and hi have the same number of questions and options, each
  answer index is in range, the truth lists match the statements, and no id appears twice across all batches.
  Put the results in checks/self-check.json and a manifest.json listing every file, as in part 2.
```

## Message 2: paste once Sarvam has credits (recording and Hindi mocks)

```text
Sarvam has credits again. Please record the 191 parts still waiting, the same way as before (same two voices,
-01.mp3 numbering, _characters-used.tsv updated): the rest of A1, all of A2, freedom-struggle-1919-1947 in Hindi,
and episodes 13 and 25 to 35 in English and Hindi. One zip per group: audio-A1, audio-A2, audio-episodes.

Then B24b: Hindi for GS mocks 2 and 3 (prelims-gs1-full-mock-2.json and -3.json, uploaded). Add "hi" to every
question (q, statements, ask, options, why). Change nothing in the English, the answers or the option order. List
terms for the Hindi editor in hiCheck, as in B24.
```

## What happens next
Send me the zips. I check them by code, fix formats and import them as **drafts**. You or an editor approve them in the
Desk. Nothing is shown as checked until an English and a Hindi editor approve it.
