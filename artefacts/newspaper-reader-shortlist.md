# Newspaper reader: what I picked from the other AIs (23 Nov 2026)

Inputs: three answers to prompt 1 (20 formats each, 60 in all), one each to prompts 2 (memory), 3 (clips) and 4
(morning reader). No answer to prompt 5 (technical); I decided that part myself from the codebase.

## Decision in one line

Don't build a separate reader. Turn Daily Chai into the reader: a 5 to 7 minute morning edition with a fixed shape,
each story told through one of six "lenses", plus clip-a-line saving and a gentle way for clips to come back. One
Android release adds it. After that, every edition is just data from the server.

## What we already have (so this is smaller than it looks)

- Chai already publishes 3 cards at 07:00, says "It ends", and has a Save button (whole card, kept on the phone).
- Saved cards and answered questions already go into an FSRS revision queue (`dueCards()` on Android, `fsrs.js` on web).
- Several Library kinds already match formats the AIs suggested: Two Sides, Domino effect, Then and now, Myth vs Fact,
  Scratch and reveal, Chai stall radio, Postcards, timeline.
- The web app has no build step, so it gets everything the day the server ships it.

## How I judged

Each idea was scored on: (1) memory value with evidence behind it, (2) fits the rules, (3) can the 05:00 Chai
drafting fill it and can the desk check it in under a minute, (4) no invented facts, (5) works with a fixed set of
native blocks (no release per format).

The biggest warning sign in the answers: they **made up facts** to fill examples ("6.5%", "6-0 vote", "next review
June", "inflation 3.8%"). So any format that needs invented quotes, invented experts or invented dialogue is out, or
must be built only from sourced lines.

## Picked

### 1. The shape of the morning (from prompt 2; strongest evidence)

| Step | Time | What happens |
|---|---|---|
| Recall opener | 45 s | One older card comes back as a question. Guess, then reveal. |
| Story 1 to 3 | about 1.5 min each | Hook question, the facts, one drawing that shows the relationship, why it matters for the exam, "Where it lives" |
| Closing recall | 60 s | "What were today's three?" Try first, then see them. No score. |
| End | | Save clips, then "That's today's Chai. It ends." |

"Where it lives" strip: one syllabus line, and a past UPSC question only when there is a real match. A forced
PYQ link is worse than none.

### 2. Six story lenses (the format engine)

One lens per story, picked by the kind of story. Each lens is a fixed native layout filled by JSON.

| Lens | Best for | Why it sticks | Source |
|---|---|---|---|
| **Redacted file**: 3 to 4 key terms blacked out, tap to reveal after guessing | Institutions, schemes, Prelims terms | Retrieval practice | AI 3 #12 |
| **Two sides** (courtroom look): only real, sourced arguments, aspirant gives the verdict | Policy debates, judgments | Arguing both sides (all three AIs' #1 pick) | Two Sides kind, reskinned |
| **Domino chain**: cause to effect, aspirant marks strong vs weak links | Economy, environment | Causal mapping | Domino effect kind |
| **Thread**: a growing timeline for a story that runs for weeks; closes with one summary card | Bills, cases, talks | Expanding schema | Prompt 2 |
| **Finish the comic**: 4 panels, last bubble blank, pick the right line | Any story with a clear "so what" | Generation effect | AI 3 #9 |
| **Examiner's pick**: "Which question would UPSC ask?" then the real past question | Every story, once a week | Exam-format practice | All three AIs |

The lens is suggested by the 05:00 drafting and can be changed on the desk.

### 3. The morning reader (from prompt 4)

The **chai-stall akhbaar reader**, with the desk's **margin notes** inside each card:
- Two or three lines of text at the top (no voice unless tapped; sound stays off by default).
- Introduces the three stories as three stops, then gets out of the way.
- Day 1 explains the shape; by day 30 it only points out links ("this connects to 2 Nov").
- Tragic story: the reader drops the stall voice for that card. Plain facts, no emoji, not shareable.
- Notification at 07:30: "Today's Chai: three stories." Nothing about missed days, ever.

### 4. Clips (from prompt 3, trimmed)

- **Clip a line, a number, or a both-sides pair**, not only the whole card. Long-press, Save. Under a second, no popup.
- Each clip keeps three layers: what you saved, where it came from (card, date), and why it matters (the card's own
  syllabus tags, written by us, not generated later).
- Optional one-line "why I saved this" note.
- **Coming back:** at most 2 or 3 a day, inside the recall opener and closing recall. No overdue count shown. Skipped
  days don't pile up.
- **My clips** page sorted by GS paper and syllabus line, offline.
- Later: a monthly "My newspaper" of the month's clips (printable page) and "this connects to a story from 3 weeks ago",
  using shared syllabus lines, checked on the desk.

### 5. How it ships without a new build each day

A fixed set of native blocks (headline, text, drawing, redacted line, two-sides pair, chain, timeline, comic panel,
question, "Where it lives", clip button) that the server arranges with JSON. One Android release adds the blocks
and the new Chai shape. After that, new stories, lenses that reuse the blocks, reader lines and clips all arrive as
data. Web gets it the same day. A brand-new block type would still need one release, so we start with enough of them.

## Rejected, and why

- **WhatsApp forward, clickbait styles**: teaches the shape of misinformation; the fake version can stick instead of the real one.
- **Obituary, Wanted poster, Matrimonial ads**: jokes about real events; risky with tragic news; the obituary even implies the opposite happened.
- **Podcast debate, Cabinet memo, Press conference with invented quotes**: put words in real people's mouths.
- **Newsroom challenge**: scored. Breaks the no-scores rule.
- **Memory palace, Museum, Harikatha, Antakshari**: heavy to make daily; the wrapper is remembered, not the fact.
- **Postcard from 2031, Colonial gazette**: speculation and history the drafting would have to invent.
- **Cricket commentary, Sabzi mandi, Auto-driver chat**: fun, but they blur cause and effect (the RBI doesn't set
  tomato prices). They could come back later as an occasional light card, never for serious news.
- **Generated answer skeletons, semantic search, podcasts from clips**: later. They need model calls on every use.

## Build order (when you say go)

1. New Chai shape (recall opener, hook, "Where it lives", closing recall) on web first, then Android. Content-only on web.
2. The six lenses as blocks, filled by the 05:00 drafting; lens picker on the desk.
3. Clip a line and My clips; resurfacing capped at 3 a day.
4. Threads for long-running stories.
5. Monthly "My newspaper" and "connects to 3 weeks ago".
