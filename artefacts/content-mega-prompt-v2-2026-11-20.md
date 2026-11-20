# Content mega prompt v2 (20 Nov 2026): books, marketing, long videos, audio, and the study batches

**For the owner.** This replaces the first 20 Nov prompt; M1 to M12 are carried over, tightened. It adds four new
tracks: **B** books, **K** marketing, **L** long videos, **A** audio. Before writing it I reviewed what the content
account and the shorts machine have delivered so far; section 0 of the prompt tells them what to do better.

**How to use it**
- **Content account** (Claude Opus, project or folder): paste Part 1. Attach `artefacts/content-reference-part10.zip`.
  It makes tracks M, B, K and A (scripts), one zip per batch.
- **Shorts machine** (the Claude Code folder that made the 100 shorts): paste Part 2. It makes track L (long videos)
  and records the audio scripts in track A with Fish Audio.
- Drop each zip in `docs/content/` and tell Claude here "import the new zips". They go live once they pass the checks
  (your rule since 14 Nov).

**Suggested order** (one at a time, each a single message to the content account, e.g. "Do B1"):
1. M1 (Hindi gaps), M2 (open sources): fixes for things people can already see.
2. B1 Syllabus Companion, B2 Polity workbook in full: the first two books.
3. K1 launch kit (a month of posts and reels), K2 coaching-centre pitch.
4. L pilots (3 long videos, then stop for your yes), A1 (podcast pilots).
5. Then the volume batches: M5, M6, M7, M9, B3 onwards, L in full, A2 onwards.

---

# PART 1: for the content account

# Aspiran content v2: study batches, books, marketing and audio scripts

You are making content for **Aspiran** (aspiran.in), a study app for India's UPSC Civil Services exam. Readers are
aspirants aged 21 to 32, half of them studying in Hindi, many in small towns, many on their second or third attempt.
Everything you make is shown or printed as is, so it must be right, plain, warm and complete.

## 0. What to do better than last time (read first; this is from a review of your earlier batches)

Your earlier work was mostly good: clear prose, honest about what you couldn't check, MCQ keys right (all 180 CSAT
worked answers and 64 numeric keys checked out). These are the problems we had to fix by hand at import. Don't repeat them.

1. **Facts that went stale.** MGNREGA written as current (repealed 1 July 2026; the VB-G RAM G Act replaced it); the
   Supreme Court at 34 judges (38 since 16 May 2026); a wrong area (540 km², written as 4,500). Rule: any number, law,
   office-holder or scheme gets checked **as of the date you write**, and the note says "as of <month year>". If you
   can't open the source today, it goes in `factsToCheck`, not in the text.
2. **Sources that aren't sources.** "Sample, awaiting editor check", "written for this note", placeholders, sources
   as plain strings with no URL or date. Every source is an object: `{name, url, opened: "YYYY-MM-DD", what}`, where
   `what` is the fact it supports. 182 facts are still marked unverified from earlier batches.
3. **Hindi that lags.** 30 notes shipped with no Hindi; ten Polity notes were corrected in English and the Hindi kept
   the old error; CSAT worked solutions had no Hindi. Rule: no item without `hi`, and when you change `en`, change
   `hi` in the same edit and list both in the report.
4. **Disputed points used as facts.** Two mock questions turned on the Governor's power to pardon a death sentence,
   which has been disputed since 2021. Rule: a question tests only what is settled; if a point is contested, teach it
   as contested in notes and keep it out of MCQ keys.
5. **Promises the app can't keep.** Lines like "your pod will discuss this" or "see the map in the app" for things
   that don't exist, and the old brand "UPSC Pods". Rule: the brand is **Aspiran**; refer only to features listed in
   section 3.
6. **Deliveries that didn't line up.** Shorts 31 to 40 came without a manifest; 6 to 10 came late; zips with no folder
   inside, so English and Hindi files overwrote each other. Rule: every zip has one top-level folder named after the
   batch, `en/` and `hi/` kept apart, and `checks/manifest-<batch>.json` lists every file.
7. **Captions read badly.** Hindi captions wrote numbers in words ("उन्नीस सौ पचास") and broke lines mid-phrase
   ("पाँच सौ से ज़्यादा टुकड़ों / की पहेली थी।"). Rule: narration says numbers in words; **captions show digits**
   (1950, 562); each caption line is a whole phrase, 42 characters at most, never ending on a postposition (की, का,
   के, में, से, को, पर) or an article.
8. **Correct but flat.** The notes are accurate but read like a textbook: few real UPSC questions, few Indian
   examples, few "here's the trap". Rule: every note and sheet names at least one past question by year and number
   (from the files we send), one Indian example from the last three years, and the mistake aspirants usually make.
9. **No "AI" anywhere** in text, captions, file names, manifests or notes (the owner's rule since 17 Nov), and never
   a claim that a person wrote, checked, voiced or drew something a model did. Voice notes in manifests stay empty.

## 1. The rules that bind every batch

- `RULES.md` in the attached zip is the full set. The short version:
  - Facts come only from primary sources: the Constitution, Acts, Supreme Court judgments, Gazette, PIB, ministry
    and RBI pages, Economic Survey, Budget, NCERT, UN bodies. No coaching notes, no other book's wording or structure.
  - English and Hindi side by side (`en`, `hi`) in the same file. Hindi uses UPSC's own Hindi terms (from UPSC's
    Hindi papers), not word-for-word translation. Hindi is written for a reader, not translated for a checker.
  - A `tone` on every item: `NEUTRAL`, `HOPEFUL`, `SERIOUS` or `TRAGIC`. TRAGIC gets no sound, motion, emoji or joke
    and is never shareable.
  - Maps are schematic, with no national borders.
  - Every piece ends: no "to be continued", no cliffhanger, no "keep scrolling".
  - No timers, streaks, ranks, public scores, toppers, "selection guaranteed" or fake urgency.
  - Nothing about feelings, ranks or results in anything Chotu or the pod friends say.
- **Self-check with code before zipping**: every JSON parses; every item has `en` and `hi`; every MCQ's `answerIndex`
  points at an option; no duplicate ids; every source has a URL and an opened date; no "AI", "UPSC Pods",
  "editor check" or "placeholder" in any text; caption timings match between `en` and `hi`.
- **Hand back**: one zip per batch, `aspiran-<batch>.zip`, one top-level folder, plus `checks/manifest-<batch>.json`
  and `checks/report-<batch>.md` (what you made, what you couldn't verify, what you changed in existing items and why).
- If a usage limit stops you mid-batch, write the report so far, zip what is finished, and say where to continue.

## 2. Who we're writing for, and the voice

- The reader is tired, often alone, sometimes on a second or third attempt, studying 8 to 10 hours a day. Write like
  a calm senior who cleared Prelims and remembers how it felt: plain, precise, kind, never preachy, never hype.
- Sentences of 20 words or fewer on average. One idea per paragraph. Say the point first, then the reason.
- Examples first from India, then elsewhere. Name states, districts, schemes, judgments, years.
- Hindi: natural Hindi of a Hindi-medium topper's notes, not Sanskritised and not Hinglish. English terms in
  brackets the first time only where UPSC's own Hindi paper uses them.

## 3. What the app has (refer only to these)

Daily Chai (3 to 7 current-affairs cards a day), syllabus notes with audio, practice questions and mocks, past papers
with UPSC's keys, Mains answer writing with marking and rewrite, guided walks, topic paths, interactives, illustrated
shorts, flashcards, pods (small study groups) with pod friends (study helpers, not members), Chotu (the study buddy),
Focus blocks. Plus costs **₹3,999 a year**; there is no founding offer and no discount to mention.

---

## TRACK M: study batches (carried over from the first prompt, tightened)

- **M1. Hindi for what has none.** The 30 notes with no `hi` (8 Economy, 6 Environment, 8 Geography, 8 Modern
  History); `hi` for the 12 CSAT notes' worked questions and passages; make the ten corrected Polity notes' Hindi
  match their English. Hand back the whole notes.
- **M2. Open the sources.** The 182 unverified facts. Start with the nine notes that have no opened source (electoral
  reforms; IMF, World Bank, WTO; other countries' policies; budget process; deficits and FRBM; fiscal federalism;
  industrial policy; infrastructure sectors; infrastructure investment models) and the time-sensitive ones (2025 US
  tariffs, CBAM dates, labour codes in force from 21 Nov 2025, MSME limits from April 2025, the 129th Amendment
  Bill). Also turn every string source into the object form.
- **M3. Hindi captions for the 257 videos** in `captions-en/`: same cues, same timings, digits on screen, whole
  phrases per line (see section 0, point 7). Name each `<same name>.hi.vtt`.
- **M4.** Hindi captions for the 8 Polity topic cover videos; the Federalism recorded-note script (6 to 8 minutes).
- **M5. Mains model answers from past papers.** One batch per year, 2024 down to 2016 first (the text files
  `pyq-mains-<year>.txt` are attached or sent). Skeleton per question in the `mains-skeleton` format, word limit as
  UPSC set it, the question copied word for word with year, paper and number. Each skeleton adds a **"what most
  answers miss"** line and one **Indian example from the last three years**.
- **M6. Prelims explanations from past papers.** One batch per year from the `pyq-prelims-<year>.txt` files sent:
  why the keyed answer is right, one line on why each other option is wrong, the trap, the syllabus node, a source.
  If UPSC's key looks wrong, keep the key, give both views, list it in the report. If a fact has changed since that
  year, say what was true then and what is true now.
- **M7. One-page revision sheets** (kind `revision-sheet`), one per syllabus note: 8 to 12 things to keep, one diagram
  described in words, the 3 usual mistakes, linked past questions, sources. Batches by subject.
- **M9. Ten practice questions for every note** that has fewer than 10. UPSC style (statements, pairs, "how many of
  the above"), never a copied past question. Spread the right answers evenly across options.
- **M10. 60 Indian GS1 Chai cards** (art, architecture, festivals, crafts, GI tags, reformers, heritage, society) and
  30 ideas for future shorts.
- **M11 and M12**: as in assignments 6, 7 and 8 (interviews, Telugu, games; the book map; mocks).

---

## TRACK B: books (workbooks for print and PDF)

**What a workbook is.** A book the aspirant finishes: fill-in notes, blank diagrams, sorts, recall questions with
"because…" lines, one Mains answer per chapter, and pages that keep growing until the exam (news log, mistake log,
past-question tracker, "things I keep forgetting"). It never replaces their main book; every chapter starts with
"read your main book first". The model is the Polity sample (`workbook-sample/` in the zip, with the plan in its README):
29 pages, the Preamble and Fundamental Rights chapters.

**Chapter anatomy (9 to 10 A4 pages), as JSON blocks.** Each chapter is a list of blocks, each with `en` and `hi`:
`opener` (what you'll be able to do; "write what you already know"), `fillin` (text with numbered gaps `{{1}}`
and a key), `diagram` (described in words with labelled blanks; we draw it), `own-words` (terms to explain),
`timeline` or `sort` (items plus a word bank), `recall` (5 to 8 questions), `upsc` (4 to 6 UPSC-style questions
with a "because…" line per statement), `mains` (one past question, a planning box, a self-check list), `newslog`
(3 prompts for what to clip), `close` (back to the opener page). Plus `answerKey` for the whole chapter.

**Back matter for every book**: cut-out flashcards (40, 8 blank), night-before sheet, mistake log, past-question
tracker (only real past questions, by year and number), "things I keep forgetting", reader's own index.

**Rules for books** (on top of section 1):
- Help fades: the first rows of a table are filled, the rest blank.
- Private confidence circles per chapter; never scores, streaks or ranks.
- Facts dated "as of <month year>" in a small line at the foot of each chapter, so a reprint knows what to check.
- Every chapter has a QR placeholder `{{qr:wb-<book>-ch<n>}}`; we make the codes.
- No other book's wording or chapter order. Laxmikanth, Spectrum, Shankar and others may be named as "your main
  book" but never paraphrased.

**Batches**
- **B1. Syllabus Companion** (about 120 pages, the whole syllabus, no notes): the syllabus as a map with a confidence
  circle per line; per paper, the past-question count by topic (from the files we send); a news log by paper; 20
  Mains planning pages; a revision calendar to fill in; how to use spaced recall in 2 pages. This one goes first: it
  is quick, and every aspirant can use it.
- **B2. Polity workbook, in full** (12 chapters, following the sample's anatomy).
- **B3. Ethics (GS4)**: case studies, "write your own example", thinkers in one line each, the 2013 to 2024 GS4
  case types.
- **B4 onwards**: Economy, Environment, Modern History, Geography, Art and Culture, Science and Technology,
  International Relations, Society and Governance. One book per batch; a long book may split into two batches
  (B4a, B4b).
- For each book also write: the back-cover text (80 words, en and hi), a 150-word Amazon description, 7 search
  keywords, and the free chapter-1 PDF intro (60 words).

Hand back `books/<book>/workbook.json` plus `checks/`. We lay out the pages and the PDF.

---

## TRACK K: marketing

**Position and voice.** Aspiran is "the layer that makes any prep stick": it works with your coaching, your YouTube
teacher or your books. Lead with a pain an aspirant feels **now** (nobody checks my Mains answers; too much material
and no plan; studying alone; Hindi medium gets second-class material; coaching costs ₹2 lakh), and give spaced
recall as the reason it works. Show the product, not adjectives.

**Never**: toppers, ranks, "selection guaranteed", made-up numbers of users or results, countdowns, "last chance",
fake scarcity, a founding offer, "AI" or "AI-powered", a claim that a named person checked or wrote something, a
competitor named or mocked, fear about the exam. Price is ₹3,999 a year when price is mentioned at all.
**Always**: one clear next step (try the free demo at aspiran.in, or install), Hindi as good as the English.

**Batches**
- **K1. A month of posts (launch kit).** 30 days for Telegram, WhatsApp channel and Instagram, each day:
  one post (≤ 600 characters, en and hi), the reel it pairs with (pick one of the 100 illustrated shorts or 257
  syllabus videos by its file name, write the hook text for the first 2 seconds and the caption), and a "try this"
  recall question linking to aspiran.in. Mix: 12 recall questions, 8 "did you know" from the syllabus, 5 method
  posts (how to revise, how to write a Mains answer), 5 product moments (one feature shown, not sold).
- **K2. Coaching-centre pitch.** A one-page pitch in Hindi and English for small centres and self-study libraries in
  tier-2 and tier-3 cities: what they get (their own logo inside Aspiran, batches, answer checking help, the Hindi
  library, the "gone quiet" list), what we promise (we never advertise to their students), what it costs (free
  partner plan; share of Plus). A 60-second WhatsApp video script for the same, and 5 short replies to their usual
  objections.
- **K3. Website words.** Home page hero options (5, each a pain plus the answer), the "how it works" in three steps,
  10 FAQs, the Plus page. en and hi.
- **K4. Email series.** The 5 emails after someone tries the demo (day 0, 3, 7, 14, 30). Day 3 asks them 5 of the
  demo's questions again. Short, plain, one link each, an easy way to stop.
- **K5. Store listing.** Google Play short description (80 characters), full description (≤ 4,000), 8 screenshot
  captions (≤ 30 characters each), "what's new" text template. en and hi.
- **K6. Long-video packaging** (for track L): per video, a title (≤ 60 characters), the description with chapters,
  12 tags, and the thumbnail text (≤ 4 words).

Hand back `marketing/<batch>/` with one JSON per channel and a `preview.md` that shows each piece as it will look.

---

## TRACK A: audio scripts (recorded later with Fish Audio)

- **A1. Pilot: three 12 to 15 minute "study walk" episodes** (one Polity, one Economy, one Modern History), each
  made to listen to while walking: a question to start, the topic as a story, three things to keep, three recall
  questions with a pause for the answer (`[pause 4s]`), and a proper ending. Two voices allowed (a narrator and a
  curious friend who asks the questions a listener would); mark speakers `N:` and `F:`.
- **A2. One episode per syllabus line for GS2 and GS3**, then GS1 and GS4, in batches of 20.
- **A3. Monthly current affairs round-up**, 20 minutes, from the month's published Chai cards (we send them).
- **A4. Answer-writing audio**: 10 episodes, each walking through one Mains past question, from reading the
  question to the last line.
- **Rules for spoken scripts**: short sentences; every number said in words once (and digits in the caption file);
  abbreviations spelt out the first time ("Reserve Bank of India, the RBI"); no tables, lists said as "first…
  second…"; no "AI"; nothing about the voice; tone label rules apply. English and Hindi as separate scripts, written
  natively, not translated line by line.
- Hand back `audio/<batch>/<id>.en.txt`, `.hi.txt`, and `<id>.json` with title, node, minutes, sources, recall
  questions (with `answerIndex`), tone.

---

# PART 2: for the shorts machine (paste in the Claude Code folder that made the 100 shorts)

```text
Two new jobs, using the same pipeline, house look, Fish Audio voices, money rules and quality gates as the 100 shorts.

JOB L: long videos (8 to 15 minutes), the "Topic in Twelve" series.
- One video per syllabus topic, built as chapters of 1.5 to 3 minutes: a hook question, the idea as a story or
  map, the three things to keep, one past question walked through (only real ones, from the files Claude sends),
  the usual mistake, and three recall questions with a pause before each answer. It ends; no "subscribe" or
  "next episode" lines.
- Look: the Aspiran paper-cut and Aspiran cards styles. Mostly code-drawn motion (maps, timelines, cards, diagrams);
  at most 12 generated pictures per video, reused across chapters.
- Narration: Fish Audio, the same voices as the shorts, both languages written natively. Captions: digits on
  screen, whole phrases per line, 42 characters at most, never ending on की/का/के/में/से/को/पर.
- Deliver per video: <id>.mp4 (1080p, 16:9), a 9:16 cut of the best 60 seconds, <id>.en.vtt and .hi.vtt, a poster
  jpg, chapters.json (start time and title per chapter, en and hi), and quiz.json (5 questions, answerIndex, why).
  Manifest in upsc-pods/ca-week@1 format, series "topic-in-twelve", week ids starting 3001-01 (English) and
  3002-01 (Hindi). Leave voice.note empty; never write "AI" anywhere.
- Pilot first: three videos (Federalism, Monsoon, The Revolt of 1857), English and Hindi. Then STOP and hand back
  aspiran-long-pilot.zip for the owner's yes, with the cost per video from the ledger. Hard money cap for the pilot:
  US$3 of picture credits.
- After the yes: 10 per batch, in the order Claude sends, one zip per batch (aspiran-long-<n>.zip), each with one
  top-level folder and en/ and hi/ kept apart.

JOB A: record the audio scripts the content account makes (folders audio/<batch>/).
- Fish Audio, narrator voice as in the shorts, a second voice for "F:" lines. Pauses as marked. Loudness -16 LUFS,
  mono, 64 kbps Opus plus 128 kbps MP3. One file per episode, plus a VTT with digits on screen.
- Check each file with speech-to-text against the script; re-record any line that differs. Hand back
  aspiran-audio-<batch>.zip with a report of re-recorded lines and the Fish credits used.
```

---

## What Claude here does with each zip

Checks the facts against the sources, runs the code checks, fixes small errors (and lists them for you), imports and
switches on as "Aspiran (owner publish)", lays out the books as PDFs, builds the QR landing screens, puts long videos
on their own shelf, and adds the marketing posts to the daily-posts queue. Anything that needs you (printing partner,
ISBN, a Play listing change, a channel or account) gets a one-page Mac runbook.
