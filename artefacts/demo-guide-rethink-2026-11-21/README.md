# The visitor demo: a better way to guide and sell (proposal, 21 Nov 2026)

Proposal page: https://claude.ai/artifact/3FRPxxx1XonYfHj8DETSDP
Local copy: `aspiran-demo-guide-proposal.html` (built from `proposal.src.html` by inlining the pictures in `screens/`).
Nothing deployed, nothing merged. No app code changed.

## What I saw (played live, laptop 1280 px and phone 375 px)
- The tour guide talks about Aspiran ("We ask you questions BEFORE teaching you anything") while the visitor is thinking.
- The flashlight dims the screen and explains the rule the visitor has just found themselves: a lecture at the moment they should feel clever.
- On a phone the guide dock covers the Governor's answer buttons.
- The finish says "Look at you" over seven "Skipped · Go back" tiles, the guide claims they did everything, then a wall of numbers, features and prices.
- One root cause: every guide so far describes the product. None helps the visitor.

## Four concepts
- **A. Study with Chotu (recommended).** No guide column, no flashlight. Chotu sits at the edge of the work and speaks (voice) only when the
  visitor stalls or misses, with a hint, never about the screen, never praise or judgement. What they find is written onto "My page", which
  they keep by joining. Plus is mentioned once, at the marking desk. Chapter ends on one quiet title line. About 2 days.
- **B. The keynote.** One idea per screen, title cards between chapters, three-card finale. About 1.5 days.
- **C. Your first week.** Two taps up front (attempt, where to start), shorter route, ends with their week with Day 1 ticked. About 3 days.
- **D. The room.** Real counts of how other visitors answered; the ask is a pod seat. About 2 days plus waiting for traffic.

## Why A
It sells what they'll get on day one (Chotu is in Free), answers "no connect" (the only voice speaks when they need help), answers "no class"
(less on screen), the ask is about something they made, and it's the cheapest to try properly. C's questions and D's counts can be added later.

## If the owner picks A
Remove: guide column and dock (all chapters), the flashlight, trophy grid and feature wall.
Add: Chotu at the edge with 2 to 4 hints per chapter (stall or miss), "My page", one title line per chapter end.
Change: cover (one hello), marking desk (the one Plus line, ₹3,999 a year), finish (their page, "Keep my page · Join free").
Voice: about 30 hint lines plus hello/goodbye, English and Hindi, with `server/scripts/flash-voice.mjs`.
Open questions for the owner: one more try after a PYQ miss before the key shows? "My page" or "My notes"?

---

## Build (21 Nov 2026): Concept A, "Study with Chotu"
Owner: "Clearly A is the winner but it can pick bits from B, C and D where it helps. Go ahead and build the whole thing."
Branch `claude/demo-guide-rethink-d525b6`. Not merged, not deployed. Members' pages are unchanged.

### What changed for a visitor
- **Gone:** the side guide's speech bubbles (every chapter), the phone dock, the flashlight on GST, the trophy grid and the feature wall.
- **Chotu sits in the bottom corner** (the kulhad). He says hello once on chapter 1, then speaks only when the visitor stalls
  or misses. He gives a nudge, never the answer. A tap on him gives the hint for where they are. Quiet from 23:30 to 07:00 IST
  (the cover says so, and he speaks only when tapped).
- **Voice** in English and Hindi with his Fish Audio voice: 22 lines, 44 files, `server/public/app/demo-voice/chotu/`.
  On from the first click; the speaker button turns it off. Made with `node scripts/buddy-voice.mjs [key] [--force]`.
- **Stuck is never a dead end.** On GST, from the second stall on the same step, his hint carries a "Show me" button that sets
  the seats for that finding. Every chapter still has Skip.
- **My notes:** each thing the visitor works out becomes a line in a handwritten notes panel (beside the chapter on a laptop;
  a "My notes · n" chip and an "Added" toast on a phone). The finish page is their notes, then "Join free, keep your notes".
- **One quiet line ends each chapter** (the coda), with the Go button pulsing once.
- **Plus is mentioned once**, at the marking desk: ₹3,999 a year, about ₹11 a day. The finish page shows Free and Plus compactly.

### The owner's two calls (my recommendations, as asked)
1. **One more try on a wrong PYQ.** The wrong option is crossed out, "Not that one. One more try.", Chotu gives a question-specific
   hint. The second pick shows the key. The tally counts first picks only.
2. **The page is called "My notes".**

### Borrowed from the other concepts
- **B (keynote):** pacing only. One title line per chapter end and one button that pulses. No title cards.
- **C (first week):** one opening choice that truly changes the route: "Short on time? The 8-minute version" plays 6 chapters
  (warmup, Governor's desk, GST vote, marking desk, cards, finish) instead of 10. Federalism only, where there are enough chapters.
  Nothing is promised that the app can't keep, so the "your first week" ending was left out.
- **D (the room):** **not built.** There's no data on how other visitors answered each option, and inventing numbers is out.
  Can be added once the server records per-option answers and there's enough traffic.

### Checks
- `npm run check` passes. `npm run test:all`: all 25 suites pass (smoke failed once because I edited files mid-run; it passes on a rerun).
- Played end to end as a visitor on a laptop (1366 px) and a phone (375 px), in English and Hindi: no page errors, no sideways
  scroll, voice files load, stall nudges, PYQ second try, GST "Show me" and the notes all work. Also checked: short route
  (6 chapters), night mode (quiet), another topic (Constitution) plays cleanly.
- Screenshots: `build-screens/` (`{laptop|phone}-{en|hi}-NN-chapter.jpg`, plus `check-*` for short route, night and other topic).

### Rough edges
- Video posters and clips don't load on a local server; check on staging/live.
- Chotu's bubble can sit over part of the page (bottom left); a tap anywhere hides it and the voice carries on.
- Notes on topics other than Federalism are built from that topic's own content and read more plainly.
- The notes font (Kalam) draws digits in a handwritten style, which looks slightly odd in Hindi years (1994).
- The status page wasn't updated, since nothing is deployed yet.
