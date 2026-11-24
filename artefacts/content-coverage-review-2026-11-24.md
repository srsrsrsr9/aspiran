# Content coverage and review in Admin (24 Nov 2026)

**What's new:** Admin → Content → **Coverage and review**. One page that shows what content we have and lets you
rate each piece. Built and tested on branch `claude/content-coverage-review-3670a4`. Not deployed yet; the main
session merges and deploys.

## What you see

- **Top numbers:** pieces in all, how many are in the app, how many have approved Hindi, Telugu, how many you've
  reviewed, your average rating, and how many you rated 1 or 2.
- **Gaps to fill:** plain sentences, worst first. For example "Chai is thin in GS1: N cards, against about M on
  average", "GS4 has nothing live in: Videos", "Hindi is behind in CSAT", and syllabus topics with nothing at all.
- **By type:** Chai cards, past papers (PYQs), mocks, practice (games, quizzes, flashcards, Try it yourself),
  lessons and notes, videos, Listen audio, study walks. Made, in the app, Hindi, Telugu, number of questions, and
  how much you've reviewed.
- **By paper:** a table of Prelims, CSAT, GS1 to GS4, Essay, optionals against each type. Red means nothing at all;
  amber means drafts only or far fewer than the paper's other types.
- **Chai cards by GS paper:** GS1, GS2, GS3, GS4, and cards with no paper named.
- **Review queue:** filter by type, paper, or "To review / Rated 1 or 2 / With issues / Reviewed / Everything".
  Unreviewed pieces come first, then the lowest rated. A piece edited after your review comes back as
  "Changed since review".

## Reviewing a piece

Press **Review**. You see every text in English and Hindi side by side (Telugu too when there is one); parts with no
Hindi are marked in red. Videos show the player and caption links. Then give 1 to 5 stars, tick any issues (factual
error, translation, tone, formatting, out of date, other), add a note, and press **Mark reviewed and open the next**.
**Save, not finished** keeps it in your queue. Fixing the text itself is still done on the News desk.

Reviews stay inside Admin. Nothing in the app or on the website says a piece was "checked by a human editor"
because of them. Admin shows "Reviewed by <name>" on the piece only.

## Keeping database reads low

Counting reads every piece once (about 1,500 to 2,000 rows), so the result is kept for 12 hours in R2 storage, not
the database. Opening the page reads only that saved count and the review rows. **Count again** recounts on demand.
The older topic table in the Content section now reads the same saved count, so opening Content no longer scans the
whole library each time. (The News desk's own Coverage tab still counts live; it could switch to the saved count too.)

## For the main session (merge and deploy)

- New: `server/src/content-review.ts`, `server/migrations/0017_content_reviews.sql`, `server/test/reviews.mjs`
  (`npm run test:reviews`, also in `test:all`).
- Changed: `server/src/admin.ts` (3 routes, `coverage` now cached), `server/src/admin.html` (one nav line, a CSS block,
  and one new view block before `views.backups`), `server/src/coverage.ts` (rows can be passed in; same results).
- Apply the migration before or after deploy (the Worker also creates the table on first use):
  `npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0017_content_reviews.sql`
- Checks run on 24 Nov: `npm run check` and `npm run check:schema` pass; `npm run test:all` 28 of 28 suites pass.
- The first load after deploy builds the count once; later loads read the saved file.

## Not done / worth knowing

- Videos are counted from the R2 manifests (weekly current affairs, Syllabus in a minute, shorts). The 454 videos on
  the status page include English and Hindi copies; the count here is per scene per language file.
- "Lessons" vs "practice" follows the content kinds; if you'd group something differently (for example CSAT weeks), say so.
- Telugu shows as a gap until Telugu pieces are approved.
