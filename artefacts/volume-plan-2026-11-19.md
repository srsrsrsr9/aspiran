# Competing on volume with McGraw Hill Edge Pass

Written 19 November 2026. Status: a plan, nothing started. Same price as Edge Pass (₹3,999 a year).

## The idea in one paragraph

Edge Pass sells "₹15,500 of books for ₹3,999". We can match their numbers within about 90 days without
lowering quality, because most of the volume is **packaging what we already have** and **public material
(UPSC's own papers)**. The rest comes from the workbook series (book session, `artefacts/books/README.md`),
turned into eBooks as well as print. We count like for like. A Hindi copy never counts as a second item, and
we market a number only once it's live.

## Scoreboard

| What they count | Edge Pass | Aspiran now | Day 30 | Day 90 | Mainly from |
|---|---|---|---|---|---|
| Past papers | 400+ (30 yrs) | 11 | 120 | **400+** | UPSC's own papers (step 2) |
| Quizzes and tests | 900+ | 34 mocks, 2,000+ questions | **900+** | 1,200+ | Packaging (step 1) |
| Courses | 39+ | 8 Polity paths | 20 | **40+** | One path per subject part (step 1) |
| eBooks | 25+ | 0 | 4 | **25+** | Workbooks + monthly digests (step 3) |
| Smart notes | 500+ | 150 long reads | 300 | **600+** | One-page sheet per syllabus leaf (step 4) |
| Reading materials | 1,200+ | 1,300 pieces | Already ahead | Already ahead | Just say it |
| Videos | 2,000+ | 254 | 500 | **2,000+** | PYQ explainers + story shorts (step 5) |
| Mains model answers | Yes | 60 outlines | 200 | **600+** | One per Mains PYQ (step 2) |
| Live events | 35+ recordings | 0 | 2 | 8 | Monthly live hour (step 6) |
| Audio | none | 20.4 hrs | 20 | 40 | When voice credits return |

Things they have that no number fixes: famous authors, and an iOS app. See step 6 and the last section.

## Step 1. Package what we already have (Claude, this week, no new content)

- **Quizzes:** cut the 2,000+ questions into short sets by syllabus leaf (297 leaves). With 3 sets per
  leaf where there are enough questions, that makes about 900 quizzes.
- **Courses:** turn the spine into paths the way the 8 Polity topics already work: one course per subject
  part (Polity, Economy, Modern History, Geography, Environment, Ethics, CSAT and so on). Each course strings
  together the reads, videos, Try-it pieces, flashcards, quizzes and a closing mock already in the app.
  That gives about 20 courses from existing content.
- **A Library page** in the app and on aspiran.in showing the counts by kind, updated by the server from
  live content so it's never stale.

## Step 2. All of UPSC's past papers (Claude, 30 to 90 days)

UPSC's papers are government documents, free to use, and this is the cheapest volume there is.

- **Prelims GS** back to 1995 (about 30 papers) and **CSAT** 2011 to 2025 (15).
- **Mains:** GS1 to GS4 and Essay from 2013 (about 65 papers). Each question gets an answer outline. With a
  full model answer for each, that's 600+ "model answers" by day 90.
- **Optional papers:** the 10 most chosen optionals, Papers I and II from 2013 (about 260 papers). This is
  how a "400+ papers" count is reached.
- **Keys:** UPSC's official key wherever one was published. Anything else is marked "Aspiran key".
- Every question is tagged to the syllabus leaf it tests, with trends by topic (they claim "trend analysis";
  our garden can show it as "how often this leaf has been asked").
- 2024 Prelims goes in as soon as UPSC posts its key (already pending).

## Step 3. eBooks: the workbook series, digital and in print (owner content, Claude builds)

From the book session's plan, each workbook ships **three ways**: printed (for visibility), a fill-in eBook in
the app (Plus), and a free chapter 1 PDF (for reach).

| # | eBook | Source | Owner work |
|---|---|---|---|
| 1 | Polity Workbook | Sample done; finish 12 chapters | Content for 10 chapters |
| 2 | Syllabus Companion | Structure only, no notes | Light: a review |
| 3 | Ethics (GS4) Workbook | 24 existing cases + new | Medium |
| 4–12 | Economy, Environment, Modern History, Geography, Art & Culture, S&T, IR, Society, CSAT | App packs reused | One subject every 1–2 weeks |
| 13–24 | **Monthly current affairs digest** (Oct 2026 onwards) | Built automatically from Chai | None: read it |
| 25 | PYQ book: 30 years, by syllabus leaf | Step 2 | None |
| + | Mains answer-writing workbook (60 outlines + practice pages) | Existing | Light |

With the monthly digests and the PYQ book, **25 eBooks within 90 days needs only about 8 subject workbooks**.
The QR chapter screens (the book plan's open item) get built with step 3, because the eBook *is* that screen.

## Step 4. Smart notes (Claude formats, owner checks)

A one-page revision sheet for every syllabus leaf (297), made from the long reads and checked against primary
sources, plus a mind map per subject part. Each sheet links to its read, its quiz and its PYQs. Hindi goes on
the same sheet.

## Step 5. Videos to 2,000 (mostly automatic)

- **PYQ explainers:** a 60 to 90 second captioned short for every Prelims PYQ (3,000+ by step 2), built from a
  template by `content/tools/story/build-story.py`: question, the trap, the reason, the syllabus leaf. Sound is
  off by default and captions carry it, so no voice credits are needed. This alone passes 2,000.
- **Story shorts:** the 100 illustrated shorts from the video prompt (`artefacts/video-mega-prompt-2026-11-16.md`).
- **Chai shorts:** one a day from the three cards (about 30 a month), never for tragic stories.

## Step 6. Live events and names (owner)

- **A monthly live hour** in the app: strategy, a PYQ walkthrough, Q&A. Recordings go into the library.
- **Guest names instead of famous authors:** retired civil servants, recent rankers and partner coaching
  centres (from the white-label plan), credited by name for what *they* actually did. This is our answer to
  "Laxmikanth inside". Paid per session or revenue share.
- **Author partnerships (later):** approach two or three mid-tier UPSC authors to publish their workbook *with*
  Aspiran: their name, our format and app. It takes longer but is the strongest trust signal.

## What we never do to win on numbers

- Count Hindi as a separate item, or pad numbers with near-duplicates.
- Copy or rework another book's wording or structure (the book plan's copyright rule).
- Claim "checked by a human editor" or put a person's name on what a model made.
- Break the content rules: no timers, streaks or public scores; sound off; schematic maps.

## How the work splits

| Who | What |
|---|---|
| Claude | Steps 1, 2, 4 and 5 (formatting, importing, papers, keys, video building); the eBook reader; the Library page |
| Owner | Workbook content (one subject every 1–2 weeks); guest and author outreach; the live hour; read the digests |
| Both | A new content assignment (no. 9) listing the workbook chapters needed, in order |

## Decisions for you

1. Go ahead with the scoreboard targets (day 30 and day 90)?
2. Optionals: which 10 to cover first? Suggested by how many people choose them: PSIR, Sociology, Geography,
   Anthropology, Public Administration, History, Law, Hindi Literature, Philosophy, Commerce.
3. eBooks inside Plus only, or chapter 1 free for everyone? (Suggested: chapter 1 free.)
4. A monthly plan to match their ₹999 a month? It's a pricing call, not volume, but it's the first thing a
   buyer comparing the two will see.
5. Guest names: who do you already know (rankers, retired officers, coaching partners)?
