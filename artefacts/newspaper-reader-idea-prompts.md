# Newspaper reader: prompts to gather ideas from other AI (23 Nov 2026)

Paste each prompt into a different AI (ChatGPT, Gemini, Grok, DeepSeek, Perplexity…). Same prompt into two of them is fine.
Paste every reply back to Claude, labelled with the prompt number and which AI wrote it. Claude scores and picks.

Every prompt starts with the same context block. Copy it in full.

---

## Context block (put this at the top of every prompt)

```
CONTEXT
I run a study app for UPSC Civil Services aspirants in India (ages 20 to 30, many in small towns, phones first,
English and Hindi). Every morning at 7:00 IST the app publishes "Daily Chai": three current-affairs cards, usually
one each for GS Paper 1, 2 and 3, each with a drawing, a short explainer and takeaways. After the last card it says
"That's today's Chai. It ends."

I want to add a NEWSPAPER READER: it takes the day's news and makes it exciting and memorable instead of boring,
lets the aspirant SAVE CLIPS for later revision, and appears every morning as part of Daily Chai.

Hard rules (ideas that break these are rejected):
- No timers, streaks, leaderboards or public scores. No guilt or FOMO. Every session has a clear end.
- Sound is off by default and nothing autoplays. Respect "reduce motion".
- Tragic news (deaths, disasters, violence) gets a plain, respectful treatment: no sound, motion, emoji, jokes or sharing.
- Maps are schematic and show no national borders.
- Must work in Hindi as well as English, on cheap Android phones and patchy mobile data.
- New content arrives daily with NO new app release. The app is updated rarely; content is sent from our server as data.
- Exam-focused: every story should link to the syllabus and, where possible, to past UPSC questions (PYQs).
- Factual accuracy matters more than excitement. Nothing invented.
```

---

## Prompt 1: Wild formats (divergent ideas)

```
[CONTEXT BLOCK]

TASK
Give me 20 genuinely different FORMATS for presenting one news story so a UPSC aspirant remembers it a week later.
Push past the obvious (summaries, flashcards, quizzes). Think of newspapers, comics, radio, games, street theatre,
courtroom drama, cricket commentary, Indian storytelling traditions, museum exhibits, anything.

For each format give:
1. Name (3 words max)
2. What the aspirant sees and does, in 2 sentences
3. A worked example using this real story: "RBI keeps the repo rate unchanged at its monetary policy meeting"
4. Why it helps memory (one line, name the learning-science idea if there is one)
5. Effort to make each day: low / medium / high
6. Which hard rule it is most at risk of breaking, if any

Then pick your top 3 and say why.
```

## Prompt 2: Making it stick (memory and exam value)

```
[CONTEXT BLOCK]

TASK
Act as a cognitive scientist who also coached UPSC toppers. Design how a 5 to 8 minute morning news session should
work so the news is still in the aspirant's head on exam day, months later.

Cover:
1. The ideal shape of one session (what comes first, middle, last) and why
2. How to link today's story to the static syllabus (e.g. a story on a Supreme Court ruling links to the Polity chapter
   on fundamental rights) and to past questions, without making it feel like homework
3. How saved clips should come back later (spacing, interleaving, "this connects to a story from 3 weeks ago")
4. How to handle a story that keeps developing over weeks (e.g. a bill moving through Parliament)
5. Three things most current-affairs apps do that actively HURT memory
6. How to measure, privately for the aspirant, whether it is working, without scores or streaks

Be specific and practical. Cite research where you can, and say plainly when you are unsure.
```

## Prompt 3: Save the clip (the clipping feature)

```
[CONTEXT BLOCK]

TASK
Design the "save a clip" feature end to end. An aspirant reading the news wants to keep a piece of it for revision.

Answer:
1. What exactly can be clipped (a whole story, a sentence, a number, a map, a quote, a "both sides" pair)? What is the
   best default?
2. The gesture to clip on a phone, and what the aspirant sees right after (one-thumb, under one second)
3. Where clips live and how they are organised automatically (by GS paper, topic, syllabus line, month) with zero
   manual tagging
4. Five creative ways clips are used later: e.g. turning a month of clips into a one-page revision sheet, a mains answer
   skeleton, a "connect the dots" view, a printable PDF, a pod discussion
5. How clips work offline and sync later
6. What would make an aspirant say "this is better than my own newspaper notebook"

Give a short user story for a day, a week and the month before the exam.
```

## Prompt 4: The morning reader (character and ritual)

```
[CONTEXT BLOCK]

The app already has a study buddy character called Chotu. Study helpers are clearly marked as helpers, never pretend
to be human, and are quiet from 23:30 to 07:00.

TASK
Design the morning ritual: the "reader" who shows up every morning inside Daily Chai and gives out the news, like a
friend at a chai stall who has read all the papers.

Give 5 different concepts. For each:
1. Who or what the reader is (a character, a newspaper-vendor voice, a radio host, a desk, an object), with a short
   sample script in English AND Hindi for a 60-second opening of the day
2. How the 3 Chai cards and the reader fit together (reader before, around, or instead of the cards)
3. How it opens (notification text, first screen) without nagging or guilt
4. How it ends, clearly, every day
5. How it changes tone for a tragic story
6. What it would feel like on day 1 versus day 100 (so it doesn't get stale)

Then say which concept you'd ship and why.
```

## Prompt 5: Daily content without app releases (the technical shape)

```
[CONTEXT BLOCK]

Technical setup: the server is a Cloudflare Worker with a SQL database (D1) and file storage (R2). The Android app is
Kotlin and Jetpack Compose; there is also a plain-JavaScript web app (no build step). Today each content "kind"
(explainer, timeline, quiz…) is a native screen, so a new kind needs an app release. We want the newspaper reader to
get new content, and ideally new layouts, every day with no release.

TASK
Recommend how to build this. Compare at least these options and pick one:
a) A fixed set of native "blocks" (headline, image, quote, number, map, both-sides, clip button) the server arranges
   with JSON (server-driven UI)
b) A WebView inside the app showing web pages from our server
c) A hybrid: native shell plus a WebView for each story's interactive part
d) Anything better you know of

For your pick give: a JSON schema for one day's edition, how clips are stored and synced, offline caching for cheap
phones, Hindi text and font handling, accessibility (screen readers, reduce motion), how to test, and the 3 biggest
risks. Keep it small enough for one developer to build in two weeks.
```

## Prompt 6: Red team (send last, with the shortlist)

Use this after Claude sends back a shortlist.

```
[CONTEXT BLOCK]

Here is the shortlist of ideas for the newspaper reader:
[PASTE SHORTLIST]

TASK
Be a harsh critic. For each idea: the most likely reason it fails with real aspirants after 3 weeks, what a tired
aspirant at 7 am on a crowded bus would actually do with it, any rule it quietly breaks, and one change that would
fix it. Then rank them.
```
