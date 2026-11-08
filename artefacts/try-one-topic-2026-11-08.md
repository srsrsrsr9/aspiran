# Try one topic: Federalism, open without an account

8 November 2026. Branch `sample-topic-open-access`. Not deployed, not merged.

## What it is

A visitor opens `aspiran.in/app/#try` (or "Try one whole topic first" on the welcome screen) and works through one
whole topic, start to finish, with no account. The topic is **Federalism and Centre–state relations** (GS2 and Prelims).
I chose it because it had the most material already, and because UPSC asks it most: at least 11 Prelims questions in
2018–2025 and a 15-mark GS2 question in Mains 2025.

About 75 minutes in three sittings. One thing on screen at a time. It keeps the reader's place.

| Step | What the reader does | Why (teaching plan) |
|---|---|---|
| 1. Guess first | 3 questions before reading | Pretesting: a wrong guess followed by the answer sticks |
| 2–7. Five short reads | 4–5 minutes each, a check after each, plus "Which list?" (sort 12 subjects) | Recall straight after reading; lookalikes mixed together |
| 8. Say it from memory | Write or say everything, then tick 10 points | Free recall; the unticked points are "your real syllabus" |
| 9. What UPSC asked | 8 real PYQs (2018–2025), "Sure / Not sure" before answering | PYQ-first; calibration for negative marking |
| 10. Use it | 3 situations (Article 252, Article 254(2), a Bommai-type case) | Transfer: applying it, not just recalling it |
| 11. Plan a Mains answer | Pick Mains 2025 GS2 Q14 or a Governor question, plan in about 2 minutes, then our skeleton, a self-check, and "better conclusion" | Try before show; one answer shape everywhere |
| 12. Keep it | 8 cards into the review queue (FSRS); topic marked Met on the syllabus map | Spacing |
| 13. Finish | What you can now do; join free | Every piece ends |

Rules kept: no timers, streaks or public scores (counts are private, on the device); no sound or motion; no AI; no
upsell inside the path (one quiet "Join free" at the end); English and Hindi, with a language switch on every step.

## Content quality

- I checked the existing federalism note, walk, audio, practice and skeletons. They were accurate, but they left out
  what Mains now asks:
  - the Governor and bills (the 2025 rulings);
  - Article 356 and S.R. Bommai;
  - the GST Council's voting maths and Mohit Minerals;
  - cesses outside the divisible pool;
  - borrowing limits.
- The path covers these in new text. It reuses the strongest existing pieces: the skeleton for Mains 2025 Q14 and two
  of the "better conclusion" pairs.
- All 8 PYQ answers are checked automatically against UPSC's official keys in `content/pyq/pyq.json`.
- **You said on 2 Nov that you make all content.** You asked for content here, so I wrote it, and it is a draft like
  everything else.

## Before it opens (owner and editors)

1. **Polity editor:** check the 13 facts in `factsToCheck`. The most date-sensitive is the Presidential Reference
   opinion of November 2025 (no court-set time limits for Governors, no "deemed assent"). Also check whether Kerala's
   borrowing case has been decided, and whether the 16th Finance Commission's share has been published.
2. **Hindi editor (Pooja):** the whole Hindi text. The Hindi PYQ text is our own translation, not UPSC's Hindi paper.
3. Import and approve: `node scripts/syllabus.mjs pack`, then `npm run import -- <folder>`, then approve English on the
   desk. It shows to visitors only after that. Hindi shows only after the Hindi approval.
4. Walk the draft yourself first: `/app/#try/path-pol-federalism?preview` (it asks for your desk key).

## Built

- `content/topic-paths/federalism.json`: the path (new content type `aspiran/topic-path@1`).
- `server/src/try.ts`: `/try` serves approved paths only; a desk key can preview drafts.
- `server/public/app/try.js`: the screen. Linked from the welcome screen, sign-in and Practice.
- `server/scripts/syllabus.mjs`: checks and packs topic paths.
- `server/test/try.mjs` (`npm run test:try`): checks the gate.

## Not done (your call)

- The website (aspiran-web) doesn't link to it yet.
- The Android app has no screen for it. Visitors use the web app, which works on phones.
- The status page isn't updated. I'll update it once this branch is merged and deployed.
