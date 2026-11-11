# "Try one topic": expert UX review and demo design

8 Nov 2026. Reviewer stance: senior UX designer and founder selling to UPSC aspirants. Based on try.js, federalism.json, the 8 Nov note, CLAUDE.md, ux-research/, and screenshots 00, 04, 09, 11, 12, 13, 22, 30.

## Verdict in four lines

- **75 minutes is right for the product but wrong for a demo.** Keep the full topic path, but make a **15-minute Express route the default door**, with every extra as a detour the visitor opts into.
- **The sceptic decides in the first screen, and right now it is a syllabus page.** The Start button is below the fold on a 390×844 phone. The cover leads with "75 minutes", and nothing on it shows the product working.
- **Only two things set us apart, so put both inside the first 5 minutes:** being wrong first (guess, then the answer) and doing things (sorting, the Governor's desk). Reading comes after.
- **New pieces are detours, not steps.** Videos, the GST simulator, Chai cards, essay snaps, the "why" notes and the tour all hang off the path. None of them adds a numbered step.

---

## 1. Demo structure

### The decision
There are two routes over one set of content, and the visitor picks a route on the cover. **Express (about 15 min)** is the highlighted default. **Full topic (about 75 min, three sittings)** is the second option. Both share progress, so Express → Full carries on without repeating anything.

### Express route (15 min, 8 screens)
| # | Screen | Min | Why it's in |
|---|---|---|---|
| E1 | **Guess first**: 3 questions, before any reading | 1.5 | Gets them doing something within 10 seconds, and the wrong guesses make them curious |
| E2 | **One short read**: "The Governor and bills" (the read-3 bill paragraph, cut to about 180 words) plus 1 check | 3 | Shows our reading is short, current (2025 rulings) and exam-shaped |
| E3 | **Governor's desk** (interactive, below) | 3 | The "aha", and the thing they tell a friend about |
| E4 | **Which list?**: 6 subjects, not 12, all lookalikes | 1.5 | Fast, tactile, catches people out |
| E5 | **What UPSC asked**: 3 PYQs with Sure / Not sure, then the calibration line | 3 | Proves we're tied to the real exam, and shows the confidence-calibration idea |
| E6 | **Plan a Mains answer**: about 1 minute of planning, then our skeleton plus a 5-tick self-check | 2 | Answer writing is aspirants' biggest worry |
| E7 | **Keep it**: 8 cards into review, return date shown | 0.5 | Shows spaced review without having to explain it |
| E8 | **Finish**: "You can now…", 3-card tour, 4-question survey, Join | 1 | Ends the demo and collects feedback |

### Full route (about 75 min core plus detours)
Guess first → Read 1 → Read 2 → Which list? (12) → Read 3 → **Governor's desk** → Read 4 → **GST Council vote** → Read 5 → Say it from memory → What UPSC asked (8) → Use it (3 situations) → Plan a Mains answer → Keep it → Finish.
The two interactives become the end-of-read check for reads 3 and 4. They replace a quick check, so the step count barely grows.

### Detours (optional, never numbered, never required)
Each detour is one quiet card inside a step, with this pattern: `[icon] Side door · 2 min: <name>  ›`. Tapping it opens the detour, and closing it returns to the same spot.
| Detour | Lives on | Length |
|---|---|---|
| Video 1, "Strong centre, real states" | Read 1 (Full) / Guess-first answer reveal (Express) | ≤90 s |
| Video 2, "Where a state's rupee comes from" | Read 4 | ≤90 s |
| GST Council vote | Read 4 (core in Full, detour in Express from E5) | 3 |
| Federalism in this week's Chai (3–4 cards) | After Read 5 / after E5 | 3 |
| Essay in three snaps | Plan a Mains answer | 4 |
| "Why we do it" notes | One collapsed line under every step title | 15 s each |
| Tour of the app | Finish (always), plus the "What else is in the app?" link in the top bar | 2 |

Videos: tap to play, **sound off with captions burnt in** (sound only after a tap on the speaker), 360p ≤4 MB, a poster image only until tapped, and a "Read it instead" transcript link. They never autoplay.

### Entry screen copy (English, 58 words)
> **Headline (chosen):** Learn one UPSC topic properly. Judge us by it.
>
> Federalism: the topic UPSC asked 11 times in five Prelims papers. You'll guess, read short, run a Governor's desk, answer real PYQs and plan a Mains answer. No account, no clock, nothing to pay. Your answers stay on this phone.
>
> [ **Express · 15 min** ] (primary)    [ Whole topic · 75 min, 3 sittings ] (secondary)

Other headline options:
1. "One topic. Done properly. No sign-up."
2. "15 minutes. One topic. Then decide."

(Use the chosen one: it is honest, confident, and invites the sceptic to judge.)

Hindi needs its own version from Pooja, not a literal translation.

---

## 2. The first 30 seconds

What they must **feel**: "This is serious, it respects me, and it's already making me think." What they must **see**: one screen, nothing pushy, the first action above the fold, and the first question within one tap.

**0–5 s: the cover (above the fold on a 360×640 phone).** Show only these: a slim top bar (Aspiran · English/हिन्दी), the headline, 2 lines of copy, the two route buttons, and one honesty line:
> Written by our team. Checked against UPSC's official answer keys. No AI in this topic.

(The last sentence is true for the path today. Add "Checked by our editors" only after the editors have actually signed it off.)

The "What you'll be able to do" box, "Why this topic" and the sittings text move below the buttons, into a "What's inside ›" disclosure.

**5–30 s: the first question, straight after one tap.**
> **Guess first.** You haven't read anything yet. Good: a wrong guess now makes the answer stick later. *(Why we do this ›)*
>
> Q1. Article 356 is in force in a state. Who makes its laws?

Wrong answer feedback: "Most people guess that. Here's what actually happens…" (never "Wrong!"). The aspirant has been corrected kindly within 30 seconds, and that is the hook.

---

## 3. Top 10 UI fixes (from the screenshots)

| # | Element | Problem | Fix |
|---|---|---|---|
| 1 | **Cover, Start button** (00) | Below the fold at 390×844 (y≈1060). The first thing a visitor reads is a long outcomes list, then "75 minutes". | Use the new cover from §2: route buttons above the fold, details behind "What's inside ›". |
| 2 | **PYQ step, one 6,000px page** (09) | 8 questions stacked on one screen breaks "one thing at a time". Scrolling back to see the tally is tiring, and it's heavy on a cheap phone. | One question per screen, with an inline "Next question" and a final tally screen ("6 of 8. 2 you were sure of but got wrong…"). |
| 3 | **Answered options, contrast** (05, 09, 11, 30) | After answering, every option fades to about 40% grey, including the right answer. The pale pink/green fills are barely distinguishable and probably fail WCAG AA. | Keep the text at full contrast. Mark the right answer with a bold border, a ✓ and the words "Right answer". Mark the picked wrong one with "Your pick". Fade only the other two options, and to no less than 4.5:1 contrast. |
| 4 | **Which list? results** (04) | The results are confusing. "Water supply → State" sits inside the Union box, so it reads as if the right answer were Union. Wrong items are bold and right items plain, which reverses the emphasis. The box headers look like disabled buttons. "4 / 12" reads like a score. | Show each item as "**Water supply** · you put Union · it's **State**". Make the list header a solid label, not a grey pill. Replace "4 / 12" with "8 to look at again", and keep counts private and gentle. |
| 5 | **Header stack** (all) | Before the title there are 5 rows: brand, Join chip, draft banner, back link + step, 13 dots, Read in. On mobile the title starts at about y=270. | Merge them into a single 48px bar: `← Federalism · 5/13 · EN/हि · ⋯`. Move "Join" into the ⋯ menu and the finish screen (CLAUDE.md says "no upsell inside the path"). Shrink the draft banner to a 1-line strip. |
| 6 | **13 progress dots** (04, 12) | Unlabelled, and they wrap below the step text on mobile (12). There are too many to be useful. | Show 4 named stages: Learn · Practise · Write · Keep, with the current stage filled. Express shows 8 small segments. |
| 7 | **Read steps, walls of text** (30, 22) | Read 3 is about 600 words in 5 dense paragraphs, with no anchors, bold or signposts. The "Part 3 of 5 · About 5 min" line is jammed against the title. | Give each paragraph a 2–4-word bold lead-in (**Governor's options.** …). Add one "Remember this" box per read. Use 1.6 line-height and 8px between the meta line and the title. Cap at 18–20px on desktop. |
| 8 | **Hindi reading** (22) | Tight Devanagari line-height clips the matras. The title wraps into the meta line. Mixed "topic", "review", "cards" and "Met" in Hindi UI looks unfinished. | Set Hindi line-height to 1.75 and use a Devanagari-tuned font (Noto Sans Devanagari / Mukta). Pooja should decide which English loanwords stay (UPSC, PYQ) and which become Hindi (विषय, दोहराना). |
| 9 | **Mains step, skeleton visible too early / too long** (11) | Plan box, skeleton, checklist and two "Which conclusion?" exercises are all on one 3,700px screen. Try-before-show only works if the skeleton is hidden until they've planned. | Split it into 3 screens: Plan (with "Show our skeleton" disabled until 1 line is typed or "I planned on paper" is tapped), Skeleton + self-check, Better conclusion (1 pair in Express, 2 in Full). |
| 10 | **Keep it / Finish jargon and dead end** (12, 13) | "Met on your syllabus map" is internal language. Keep it lists 8 questions with no answers, which is a dead read. Finish has no feedback and no tour. | Say "Federalism is ticked on your syllabus map (✓ learnt once, review due 11 Nov)". Show the 8 card fronts as small flip cards, or just "8 cards, first back on 11 Nov". Finish gets the tour and survey (§6, §7). |

Also: the sticky Back/Next bar should be pinned at the bottom (thumb reach), with 48px targets. On desktop (30), keep the reading column but centre the Next button group and drop the full-width draft box.

---

## 4. The two interactive pieces

Both are tap-only, with no drag, no timer, no animation (a state change only) and no sound. Each fits a 360px-wide screen and is pure HTML/CSS with no library, under 30 KB. The result is always given in words, never by colour alone.

### A. Governor's desk (about 2.5 min)
**S1, setup.** "You're the Governor. Three bills are on your desk. Each has a different catch." A file card shows the bill's name, who passed it and one line about it. Below it are 5 stamp buttons, laid out as a 2+2+1 grid of large tiles: **Sign it** · **Say no** · **Send it back with a note** · **Send to the President** · **Put it in the drawer**.

**S2, Bill 1: "State Farm Produce (Amendment) Bill".** This is an ordinary bill. Whatever they tap, it shows what Article 200 allows. If they pick "Send it back", the next card says: "The Assembly passed it again, unchanged. It's back on your desk." The stamps re-appear, and **"Say no" is now struck out**, with this line: "First proviso to Article 200: once re-passed, you shall not withhold assent." Main discovery: *sending a bill back is a pause, not a veto.*

**S3, Bill 2: a bill that cuts the High Court's powers.** If they tap anything except "Send to the President": "Not allowed here. If a bill would weaken the High Court, the Governor *must* reserve it (second proviso)." Discovery: *some bills must be sent to the President; the Governor has no choice.*

**S4, Bill 3: a Money Bill.** "Send it back" is greyed, with a note: "Money Bills can't be returned." Then they tap "Put it in the drawer". The drawer opens with three dated notes: *April 2025: Supreme Court sets time limits, treats 10 bills as assented* → *November 2025: Constitution Bench says courts can't fix deadlines or deem assent* → *"But you can't sit on it forever: long, unexplained delay can be taken to court."*

**S5, recap card.** Three ticks for what they found, plus a "Which PYQ asked this?" link to the 2023 Governor PYQ.

**Aha line:** *"A Governor has four doors. Once the Assembly passes a bill again, the 'no' door is locked."*

The humour line goes in the drawer (§8).

### B. GST Council vote (about 3 min)
The facts, for the editor to confirm: the Centre's vote counts for 1/3 of the votes cast and all states together for 2/3. A decision needs 3/4 of the weighted votes of members present and voting. There are 31 voting governments (28 states + Delhi, Puducherry, J&K). *Mohit Minerals* (2022) held that the Council's recommendations persuade but don't bind.

**S1, the board.** At the top there is one big horizontal bar, "Weighted yes", with a fixed line at 75% labelled "needed to pass". Under it sits a **Centre** toggle tile (Yes/No) and a **States voting yes** stepper `[−] 19 [+]` (from 0 to 31). Beneath that, a 31-dot grid fills with each tap, to show the count. The bar's number is shown as text, e.g. "74.2%: not passed".

**S2, three challenges**, one at a time, each a single card:
1. "Can the Centre pass a rate cut alone?" The visitor sets Centre Yes and 0 states, and sees 33.3%. → "No. And without the Centre, all 31 states reach 66.7%. Also no."
2. "With the Centre on board, what's the fewest states needed?" They step up until it passes at **20** (76.3%). At 19 it shows 74.2%, which is not enough.
3. "You're the opposition states. How many of you does it take to block?" The answer is **12**.

**S3, the twist card.** "Passed. Now must every state follow it?" Two buttons: *Yes, it's binding* / *No*. → "Mohit Minerals (2022): the Council's recommendations persuade; they don't bind Parliament or the Assemblies. Cooperative federalism runs on talking, not on maths alone."

**Aha line:** *"The Centre can block anything on its own. The states need twelve of them together to do the same."*

Both pieces end with one micro-question (§7) and a "Back to the topic" button.

---

## 5. Essay in three snaps

**Where:** a detour from Plan a Mains answer (Full and Express), titled "Side door · 4 min: Watch an answer being built". Use a Mains GS2 answer, since that's the topic. (If the owner wants an Essay-paper prompt instead, use "A federation is only as strong as the trust between its parts.")

**The samples (the owner makes them, per CLAUDE.md).** Three real handwritten A4 pages by a named team member, scanned:
1. **Snap 1, skeleton:** 6 lines of scribbles, arrows, abbreviations.
2. **Snap 2, outline:** intro line, 4 headed points with an Article/case each, way forward.
3. **Snap 3, answer:** page 1 of the full 250-word answer, with a margin diagram.

Label them honestly: **"Written by our team for this demo. Not a topper's copy."** No fake student names and no marks shown.

**Viewer (mobile).** A segmented control at the top: `Skeleton · Outline · Answer`. The page image (WebP, about 1000px wide, ≤150 KB each; it loads only when the detour opens) supports pinch-zoom. **Numbered margin pins** sit on the image. Tapping a pin opens a bottom sheet with the comment, and next/previous arrows step through the pins in order, so nobody has to aim at tiny targets. Each snap has 3–4 pins, coloured *and* lettered by the three levels:
- **S · Structure** (does it answer every part, in order?)
- **C · Content** (Article, case, number, both sides?)
- **E · Expression** (opening line, conclusion, length)

A filter chip row ("Show: S C E") lets them look at one level at a time. A "Read the page as text" link gives the transcription, for accessibility, slow data and Hindi. The comments are written in the voice of a kind senior, e.g. *"C: 'Planning-era transfers' is right, but name Gadgil (1969); examiners reward the specific."*

What should land: watching the pins move from mostly S on snap 1 to mostly E on snap 3 teaches "get structure right first" without a lecture.

**Try your own.** On the last snap: **"Snap your own plan"** → `<input type="file" accept="image/*" capture="environment">`. The photo shows on screen next to the 5-point self-check list (the same ticks as the Mains step), so they mark their own page. The copy:
> Your photo stays on this phone. We don't upload it. Members can send an answer for feedback from Chotu · AI, which marks it against the same checklist; an AI's comments are a first look, not an examiner's.

Then two buttons: [Done, keep my self-check] [Join free to get AI feedback]. Before that copy ships, confirm in `server/src/answers.ts` and pricing whether AI evaluation is free or Plus, and say which.

---

## 6. "Rest of the app" tour (6 cards, swipe or Next, skippable)

Each card has one line, one screenshot or 4-second still (no video), and a **Built / Coming** tag. Verify each tag against the live build the week it ships.

| # | Card line | What to show | Tag |
|---|---|---|---|
| 1 | **Pods: 5–8 aspirants at your stage, not a 50,000-member Telegram.** | The pod chat with the Friday Quiz Night card (one shared pod score, no ranks) | Built |
| 2 | **Today's Chai: five news cards a morning, each tied to a GS paper. Then it ends.** | One real Chai card with the "Why this matters for UPSC" chips | Built |
| 3 | **Review: today's 8 federalism cards come back on 11 Nov, here.** | The review queue, with *their* cards shown if they did Keep it | Built |
| 4 | **Chotu · AI: a study buddy that explains and quizzes. Quiet from 11:30 pm to 7 am.** | One sample exchange, clearly labelled AI | Built (say "on your phone or online", as appropriate) |
| 5 | **Walk mode: listen to a topic on a walk; questions come at the end.** | The federalism walk screen | Check: built for some topics only? Say so |
| 6 | **Calm, for the bad evenings: breathing, grounding, and the helpline first.** | The Calm screen, with no promo tone | Built |

The last card: "Your syllabus map, answer studio and mocks are in there too." [Join free] [Not now]. There is no countdown and no "only N seats left" unless the ₹999 × 300 counter is real and live.

---

## 7. Feedback

### Micro-questions: 3 in Express, 5 in Full, never more
Rules: they appear inline under the step's content, *after* the step is done, as one row of tappable chips. They're never a modal, never block Next, and need no typing. Tap and a "Thanks" replaces the chips. "Skip" is implicit: just press Next. Nothing is sent until they tap.

| Where | Question | Chips |
|---|---|---|
| After the first read (E2 / Read 1) | Was that clear? | Clear · Too dense · Too basic |
| After Governor's desk | More of these? | Yes, lots · Now and then · Prefer reading |
| After the PYQ tally | Did the "Sure / Not sure" help? | Yes · Not really |
| (Full) after GST vote | Same chips as the Governor's desk | |
| (Full) after Say it from memory | Would you do this alone? | Yes · Only with a pod · No |

The privacy line, shown once at the first micro-question, is "Your taps are sent anonymously to help us improve. Nothing else is." This replaces "nothing is sent anywhere" in try.js and the 8 Nov note, which would otherwise be untrue.

### End screen (the Finish step)
In order:
1. "You can now:", with the 4 outcomes and ticks only for the steps they did (Express shows 3).
2. **Four questions, one card, all optional:**
   - How likely are you to tell a fellow aspirant about this? (0–10, as large buttons; no stars)
   - What did you like most? (chips: Guess first · Governor's desk · GST vote · PYQs · Mains plan · Hindi · Essay snaps)
   - **What's missing?** (free text, Hindi or English; mic dictation through the keyboard is fine)
   - I am: (chips) Preparing, 1st attempt · Repeat attempt · Working + preparing · Teacher/mentor · Just looking
   - [Send] (and "Leave my email to hear when what I asked for is built (optional)")
3. The tour (6 cards).
4. [Join free, no card needed] [Look around the Free Shelf].

### Showing "what's missing" was heard
- **Right away:** after Send, show "Got it. Here's what aspirants asked for most this month, and what we did:" followed by a **"You asked, we did" list of 3–5 editor-written lines**, e.g. *"More Hindi PYQ explanations (asked 140 times) → added to Polity, 6 Nov."* The counts are real aggregates. The owner curates it weekly in admin. It never auto-publishes raw text, because of moderation, the crisis protocol and privacy.
- **Later:** people who left an email get one message when *their* theme ships. One email, no drip.
- **Crisis:** any free text matching the crisis-protocol distress phrases shows the helpline card on screen at once (per `community/crisis-protocol.md`) and is flagged for a human. It is never auto-answered.
- **Investors/partners:** the same feedback powers an admin chart (completion by step, chip shares, top "missing" themes). That is the traction story, and it is real.

---

## 8. Humour: 6 lines to ship

The tone is a dry senior in the library, never mocking the aspirant. Use none in TRAGIC content and none in Calm.

1. **Cover, under the route buttons:** "No clock runs. Chai is optional but recommended."
2. **Guess first, after a wrong guess:** "Wrong here costs nothing. In Prelims it costs a third of a mark. Good place to practise."
3. **Which list?, on the prisons/criminal law reveal:** "Prisons: State. Criminal law: Concurrent. The framers did not design this for your convenience."
4. **Governor's desk, inside the drawer:** "This file has been in the drawer so long the MLAs have started a WhatsApp group about it."
5. **GST vote, after challenge 3:** "Nobody wins alone. This is also why the meetings run long."
6. **Essay snap 1, pin S1:** "Skeletons are allowed to be ugly. Nobody frames one."

---

## Build order (suggested)
1. Cover + Express route + fixes 1–6 (one day of work; this is what makes the demo convincing).
2. Governor's desk → micro-feedback + end survey + "You asked, we did" admin.
3. Tour cards → GST vote → essay snaps (the owner makes the pages) → videos (the owner makes them) → Chai detour.
4. Before any of it is public, editors approve the federalism path (8 Nov note, "Before it opens").
