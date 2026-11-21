# Demo overhaul (21 Nov 2026)

What changed, from the owner's review of app.aspiran.in/app/#try/path-pol-federalism (1.docx).

## What a visitor sees now
- One road, 10 chapters: Guess first → Watch (Governor video) → The Governor's desk → Sort the lists →
  Real PYQs → The GST vote → Plan a Mains answer → The marking desk (essay) → Make it stick → Your trophies.
  The games, the video and the essay are chapters now, never side doors. No "Back to the topic" anywhere.
- A tour guide on the right (a dock above the buttons on phones) says what each feature does and why it works,
  with one line per chapter on what the app has more of and a Join link. It replaces "Why we do it this way" and
  the "Free preview" strip. It's the tour's voice: no human name, no "AI".
- One big button at the bottom that names what's next ("Next question", "Next bill", "Check my lists",
  "Build the plan", "Next: The GST vote"). The logo replaces the old ⌂ icon.
- Video: own player; the first question under it is the one the video ends on (Article 200), then the 2025
  Supreme Court question. Nothing about the voice.
- Sort: drag tiles into coloured lists (or tap a tile, then a list). PYQs: pick first, then "how sure", then the key.
- GST: 31 seats and the Centre; tap seats, watch the meter and a PASSED/BLOCKED stamp; three findings light up.
- Mains: "Build the plan" writes the answer one line at a time, each with its reason beside it.
- Essay: three pages as trophies, margin notes appear one by one, then a joke and "How marking works" (snap → read → marked).
- Finale: trophy shelf with private stats, library numbers, six things in the app, Free vs Plus (₹3,999/yr,
  about ₹11 a day), one "Join free, keep your N cards" button, the day-3 email.
- No feedback questions or survey for visitors; funnel events only (try_step, try_finish, try_join, demo_act).
- Sound effects are off until the visitor taps the speaker; reduced motion respected; English and Hindi.
- Members and the "whole topic" route keep the old pages (members also now pick before saying how sure).

## Code
- `server/public/app/showcase.js` (new), hooked in from `try.js` `draw()`.
- `content/topic-paths/federalism.json`: no AI/voice wording; the video's closing question added.

## Live database fix: done (21 Nov)
The wording fix is now in the live Federalism topic (run by Claude on the owner's go-ahead). The first single-statement
version was too big for the database (over its 100 KB limit), so `federalism-wording-fix.sql` is now 14 small
field-by-field updates. Checked afterwards: the live row matches the intended topic exactly, with no "AI" and no voice note.

## Follow-up: Chotu's flashlight (prototype, GST vote only)
See `artefacts/flashlight-2026-11-21/README.md`. Not deployed.
