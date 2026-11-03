# Content assignment, 3 Nov 2026: for the other Claude account

For the owner. Seven videos isn't enough, and the app has room for two new kinds: **printables** (one-page sheets to
download and print) and **audio lectures** (10–15 minute talks to listen to on a walk or a commute). This file has
everything to paste. I'll build the app screens for both new kinds while you make them.

## Decide first (2 minutes)
1. **Hindi voice in ElevenLabs.** Every video and lecture needs one. Pick a calm, clear Hindi voice and use it for
   everything. Without it, Hindi users get English only.
2. **Order.** My suggestion: Part 1 (videos V2) and Part 2 (printables) in parallel, then Part 3 (audio), then Part 4.

## What's in the app now
| Kind | Have | Gap |
|---|---|---|
| Videos | 7 (episodes 10–12, 14–17), English only | Episode 18, V2, V3; Hindi versions |
| Printables | 0 | Everything (Part 2) |
| Audio lectures | 0 | Everything (Part 3) |
| GS mocks | 3 English, mock 1 with Hindi | Hindi for mocks 2 and 3 |
| CSAT mocks | 2 full papers | Fine for now |
| Optionals | nodes 1–5 (+ more from B26–B28) | Keep going |

---

## Part 1. Videos: 19 more episodes
Same way as before: a chat with **code execution and web search on** (Claude Sonnet), upload `upsc-pods-kit.zip`,
paste **Message 2** below with one row of episodes at a time. Record each `.elevenlabs.txt` in ElevenLabs, English
and Hindi. Put finished folders in `~/Downloads/aspiran-videos/`.

**Finish V1:** 18 Fundamental Duties.

**V2 (10):** 19 Deficits and the FRBM anchor · 20 Inflation targeting · 21 Forest (Conservation) Amendment 2023 ·
22 Western disturbances vs the monsoon · 23 WTO peace clause and MSP · 24 Tribunals and independence ·
25 DPDP Act 2023 · 26 Project Cheetah · 27 Governor's assent timelines · 13 Indus Waters Treaty (SERIOUS; last,
strictly neutral, only if you're comfortable).

**V3 (8 evergreen, the topics every aspirant gets stuck on):** 28 Repo, reverse repo and the liquidity window ·
29 How a bill becomes law (both Houses, joint sitting) · 30 Federalism: the three lists and Article 356 ·
31 El Niño, La Niña and the Indian monsoon · 32 Biodiversity hotspots and India's protected areas ·
33 The Preamble, word by word · 34 Balance of payments: current vs capital account · 35 The 1857 revolt: causes and
why it failed.

## Part 2. Printables: 40 one-page sheets (new)
A printable is one A4 page: a table, a timeline, a map key or a comparison, in English and Hindi. Paste
**Message 1** into the content Project. Batches:

| Batch | Sheets |
|---|---|
| P1 | Polity (10): Articles to know, Fundamental Rights at a glance, DPSP vs FR, Constitutional bodies, Amendments that matter, Emergency types, Money Bill vs Financial Bill, Parliamentary committees, Writs, Schedules |
| P2 | Economy (8): Monetary policy tools, Fiscal terms, Budget documents, Inflation measures, BoP, Banking regulators, Schemes by ministry, Key indices and who publishes them |
| P3 | Geography and environment (8): Rivers and tributaries (schematic), Soils, Monsoon mechanism, Climate conventions timeline, Protected-area types, Ramsar and biosphere basics, Minerals, Cyclone naming and seasons |
| P4 | History and culture (8): Modern India timeline 1757–1947, Governors-General and Viceroys, Congress sessions, Acts 1773–1947, Bhakti and Sufi, Temple architecture styles, Classical dances, Buddhism and Jainism compared |
| P5 | Ethics and CSAT (6): GS4 thinkers one-liners, Ethics terms, Case-study answer frame, CSAT formulas, CSAT reasoning patterns, Exam-day checklist |

## Part 3. Audio lectures: 12 talks (new)
A talk is a script you record in ElevenLabs, 1,500–2,000 words (10–15 minutes), English and Hindi, with chapters,
3 check questions at the end, and sources. Paste **Message 3** into the content Project for scripts; record them
like the videos.

**A1 (6):** Reading the Union Budget · Parliament's year · How the RBI sets rates · The monsoon from start to finish ·
India's freedom struggle in one hour (as 2 talks: 1857–1919, 1919–1947).
**A2 (6):** Ethics: integrity, probity and accountability · Ethics: emotional intelligence for administrators ·
Climate negotiations from Rio to now · Federalism and Centre–State relations · Internal security basics ·
How to read a CSAT passage.

## Part 4. Still open from before
- **B24b:** Hindi for GS mocks 2 and 3 (200 questions). Same rules as B24.
- **Optionals:** next nodes for each optional, in the priority order from B25.

---

## Message 1: paste into the content Project (printables)

```text
Claude Code here. Everything up to B28 is checked and in the app as drafts. Next is a new kind: printables.
Same rules as the brief (drafts only, facts in factsToCheck, en and hi side by side, your own code checks before
zipping, one zip per batch). Batches P1 to P5 are below; one batch per zip, named P1.zip and so on.

One file per sheet: printables/<subject>-<slug>.json, shaped like this:
{
  "kind": "printable",
  "id": "polity-writs",
  "subject": "polity",            // polity, economy, geography, environment, history, culture, ethics, csat, ...
  "paper": "GS2",                 // GS1-GS4, CSAT or Prelims
  "status": "draft",
  "en": {
    "title": "The five writs",
    "subtitle": "Article 32 and 226, in one page",
    "blocks": [
      {"type": "table", "caption": "...", "head": ["Writ", "Meaning", "Against whom", "Example"], "rows": [["...", "...", "...", "..."]]},
      {"type": "timeline", "caption": "...", "items": [{"when": "1950", "what": "..."}]},
      {"type": "list", "caption": "...", "items": ["..."]},
      {"type": "compare", "caption": "...", "left": {"title": "...", "points": ["..."]}, "right": {"title": "...", "points": ["..."]}},
      {"type": "note", "text": "..."}
    ],
    "remember": ["three short lines to remember"]
  },
  "hi": { same shape, same blocks in the same order, in Hindi },
  "sources": ["official source names or URLs"],
  "factsToCheck": ["..."]
}

Rules:
- It must fit one A4 page: at most about 350 words in English, 2–4 blocks, a table at most 12 rows.
- Facts only from official sources (Constitution text, PIB, RBI, ministries, NCERT). Anything with a date or number
  goes in factsToCheck.
- Maps: no maps with national borders. Rivers and soils as schematic lists or tables, not drawn.
- No exam predictions, no "most important for 2027" claims, no ranks or scores.

P1 Polity (10): Articles to know; Fundamental Rights at a glance; DPSP vs Fundamental Rights; Constitutional bodies;
Amendments that matter; Emergency types; Money Bill vs Financial Bill; Parliamentary committees; Writs; Schedules.
P2 Economy (8): Monetary policy tools; Fiscal terms; Budget documents; Inflation measures (CPI, WPI, deflator);
Balance of payments; Financial regulators; Flagship schemes by ministry; Key indices and who publishes them.
P3 Geography and environment (8): Rivers and tributaries (as a table); Soils; Monsoon mechanism; Climate conventions
timeline; Protected-area types; Ramsar sites and biosphere reserves basics; Minerals and where they're found;
Cyclone seasons and naming.
P4 History and culture (8): Modern India timeline 1757–1947; Governors-General and Viceroys; Congress sessions;
Constitutional Acts 1773–1947; Bhakti and Sufi; Temple architecture styles; Classical dances; Buddhism and Jainism compared.
P5 Ethics and CSAT (6): GS4 thinkers one-liners; Ethics terms; Case-study answer frame; CSAT formulas (with one worked
example each, checked by running code); CSAT reasoning patterns; Exam-day checklist.
```

## Message 2: paste into a video chat (code and web search on)

```text
Using the kit's Prompt A, make the next episodes, one at a time, in the same format as before (script, captions,
quiz, sources, .elevenlabs.txt). New this time: also write a Hindi script and Hindi captions (.hi.srt and
.hi.elevenlabs.txt) for each episode, the same scenes in the same order. Episodes in this batch: <paste one row
from Part 1, e.g. "18 Fundamental Duties · 19 Deficits and the FRBM anchor · 20 Inflation targeting">.
Rules as before: every claim in sources, sound off by default, no national borders on any map, schematic only,
neutral tone, and episode 13 (Indus Waters) strictly neutral and marked SERIOUS.
```

## Message 3: paste into the content Project (audio lectures)

```text
Next new kind: audio lectures. Scripts only; the owner records them in ElevenLabs. Same rules as the brief.
Batches A1 and A2 below; one zip each.

One file per talk: audio/<slug>.json, shaped like this:
{
  "kind": "audio-lecture",
  "id": "rbi-sets-rates",
  "subject": "economy",
  "paper": "GS3",
  "status": "draft",
  "minutes": 12,
  "en": {
    "title": "How the RBI sets rates",
    "summary": "two sentences on what you'll understand by the end",
    "chapters": [{"title": "...", "script": "spoken text, plain sentences, no bullet points"}],
    "check": [{"q": "...", "options": ["...", "...", "...", "..."], "answerIndex": 0, "why": "..."}]
  },
  "hi": { same shape, same chapters in the same order, in natural spoken Hindi },
  "sources": ["..."],
  "factsToCheck": ["..."]
}
Also put the plain text to record in audio/<slug>.en.elevenlabs.txt and audio/<slug>.hi.elevenlabs.txt.

Rules:
- 1,500–2,000 words in English, 3–6 chapters, written to be heard: short sentences, numbers said in words, each
  chapter starts by saying where we are. No "as you can see".
- Exactly 3 check questions at the end. Original, not copied from past papers.
- Calm, friendly, never rushed. No pressure, no "you must", no ranks or results. Ends with a short recap.
- Facts from official sources; anything with a date or number goes in factsToCheck.

A1: Reading the Union Budget; Parliament's year (sessions, Question Hour, how bills move); How the RBI sets rates;
The monsoon from start to finish; India's freedom struggle part 1 (1857–1919); part 2 (1919–1947).
A2: Ethics: integrity, probity and accountability; Ethics: emotional intelligence for administrators; Climate
negotiations from Rio to now; Federalism and Centre–State relations; Internal security basics; How to read a CSAT passage.
```

## Message 4: paste into the content Project (Hindi mocks, optionals)

```text
Two more, after the printables and audio:
B24b. Hindi for GS mocks 2 and 3 (prelims-gs1-full-mock-2.json and -3.json, uploaded): add "hi" to every question
(q, statements, ask, options, why). Change nothing in the English, the answers or the option order.
B29. Optionals: the next 3 nodes for each optional, following the priority order from B25, same node format.
```

**Upload with Message 4:** `content/mocks/prelims-gs1-full-mock-2.json` and `-3.json`.

## What happens to everything
Send me the zips and video folders. I check them by code, fix formats, and import them as **drafts**. You or an
editor approve them in the Desk (videos in the new Videos tab). Nothing is shown as checked until an English and a
Hindi editor approve it.
