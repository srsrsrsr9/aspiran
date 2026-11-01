# Content kit: what you produce, and how

1 November 2026. You said: "Leave the content on me; give me the prompts, guidelines, styles and formats." This adds
to the existing kit in `artefacts/UPSC Pods Prompt Kit/README.md`. That kit's **settings** and **shared system
prompt** still apply to everything here: Sonnet 5.5, medium effort, JSON output, English and Hindi side by side,
grounded in a pasted source wherever possible.

What's new here:
- the five-step pipeline with AI vetting AI;
- the optional pack structure;
- PYQ skeletons;
- GS4 cases;
- the CSAT weekly printable;
- walk-mode audio scripts;
- interview board personas;
- the "pause" lines;
- the Chotu voice sheet.

---

## 0. The pipeline every piece goes through

| Step | Who | What |
|---|---|---|
| 1. **Make** | You, with Claude (Sonnet 5.5) | Use the prompts below. Paste a real source whenever you can. |
| 2. **AI check A** | A **different** model family (Gemini or GPT class) | The vetting prompt below. It looks for factual errors, bias, missing hedges, and Hindi that doesn't match the English. |
| 3. **AI check B** | Claude (Opus or Sonnet), with the source | The same prompt. Two families catch different mistakes; one model checking itself misses its own blind spots. |
| 4. **My review** | Claude Code (me), in this project | Put the pack in `content/drafts/<pack-name>/` with both check reports, and tell me "review <pack-name>". I check the structure, run the validator, read every flag, and write a short note: ship to editors / fix these / redo. |
| 5. **Editors** | One English and one Hindi editor | Approve in the desk. **Nothing is shown as checked until this step.** |

AI checks never replace editors; they make editor time go further. The app keeps calling the content a "draft" until
step 5.

### Vetting prompt (steps 2 and 3)

```text
You are checking a study pack for UPSC civil services aspirants before a human editor sees it. You did not write it.
Be strict and specific. Do not rewrite the pack.

Check, item by item:
1. FACTS: every number, date, article, case, committee, name and claim. Mark each as OK (and say how you know),
   WRONG (give the correct fact and a real source), or UNSURE (say what to verify). If a <source> is given, anything
   not in it is UNSURE at best.
2. PYQs: any "previous-year question" must be real. Give the year and paper if you know them; otherwise mark UNSURE.
3. BALANCE: political or contested topics must present both sides. Flag any line that tells the reader what to think.
4. TONE: flag urgency ("hurry", countdowns), hype ("guaranteed", "topper's secret"), scolding, and any joke, emoji or
   playful line on a TRAGIC topic.
5. HINDI: does each Hindi field mean the same as its English field? Same list lengths, same answer positions, digits
   kept? Is it natural Hindi as aspirants read it? Quote any line that is wrong or awkward and suggest a fix.
6. TEACHING: does every piece end with something the reader must recall or do? Flag pieces that only inform.

Return JSON: {"verdict": "ship" | "fix" | "redo", "issues": [{"where": "<item id / field>", "kind": "fact|pyq|
balance|tone|hindi|teaching", "severity": "high|medium|low", "what": "...", "fix": "..."}], "factsChecked": n}
```

---

## 1. Optional subject packs

Don't underestimate this: optionals are 500 of the 1,750 Mains marks. The structure is the same for every optional,
so the app can treat them all alike.

### Folder shape

```
content/optionals/<optional>/            e.g. pubad, sociology, geography, anthropology, psir, history, hindi-lit
  syllabus.json      the official syllabus split into nodes (paper → unit → node), with UPSC's own wording
  pyq.json           real PYQs from the last 10+ years, each tagged to a node (year, paper, marks, words)
  nodes/<node-id>.json   one file per node (below)
  thinkers.json      (where relevant) thinkers and their key ideas, each linked to the nodes they serve
  README.md          sources used, editions, who checked what
```

### One node file

| Part | What | Limit |
|---|---|---|
| `why` | Why UPSC asks about this node, from its PYQs | 60 words |
| `pyqFirst` | 2 to 5 PYQs on this node, shown **before** the notes | real only |
| `note` | The core note, in plain words, written to be recalled | 600 words |
| `onePagerPrompt` | What the person should be able to write from memory afterwards | 5 bullet prompts |
| `recall` | 10 to 15 recall cards (question → short answer), mixing "define", "compare", "give an example" | 40 words each |
| `skeletons` | For each PYQ: a 2-minute skeleton (intro line, 3 to 4 headings, one example each, way-forward line) | 90 words each |
| `examples` | 3 to 5 Indian examples or cases that can be used in answers, each with a source | 40 words each |
| `links` | GS nodes this connects to (an optional often overlaps GS) | ids |
| `diagram` | (optional) a simple flow or table to draw by hand in an answer | text spec |

### Prompt (one node at a time)

```text
Make one node of the <OPTIONAL> optional pack for Aspiran.
Node: <paper> / <unit> / <node title, in UPSC's wording>
Real PYQs on this node (do not add others): <paste>
Source: <paste the relevant pages of the standard text, or say "from knowledge">

Follow the node file shape exactly (why, pyqFirst, note, onePagerPrompt, recall, skeletons, examples, links, diagram).
The note teaches for recall, not for reading: short sections, each ending with a question.
Skeletons follow claim → 3 to 4 headings with one example each → way forward. Skeletons, never full answers.
Every example must be Indian where possible and must have a real source; otherwise list it in factsToCheck.
English and Hindi side by side, as the shared system prompt says.
```

**Order of work:** make the 15 nodes with the most PYQs first; they cover most of the marks. I'll produce a "which
nodes first" list from each optional's PYQ file when you start one.

---

## 2. PYQ skeletons (GS Mains)

For the skeleton drill: the person spends 2 minutes on their own skeleton, then sees ours.

```text
Here is a real UPSC Mains question: <question, year, paper, marks, word limit>.
Write the skeleton a strong candidate would plan in 2 minutes. Not an answer.
- What the directive word asks ("discuss", "critically examine", "analyse") in one line.
- Intro idea (one line).
- 3 to 4 headings, each with one specific Indian example, data point or case (sourced or listed in factsToCheck).
- Way forward (one line).
- One common mistake candidates make on this question.
Under 110 words in English. Hindi alongside.
```

---

## 3. GS4 ethics cases

```text
Write one GS4 case study for practice, in the style of UPSC Mains GS4 Section B, but original (not a real PYQ).
Setting: <district / ministry / PSU / police / health>; the tension: <e.g. honesty vs. career safety>.
Then write the "case circle" key:
1. Who is affected (4 to 6 stakeholders, one line each on what they stand to gain or lose).
2. What's in tension, named in plain words.
3. Three options, each with its cost.
4. A defensible choice with the principle behind it.
5. At most two thinkers or syllabus terms that genuinely fit, each in one line, and why they fit.
Case under 200 words; key under 250 words. Hindi alongside. Avoid real names of living people and real scandals.
```

---

## 4. CSAT weekly printable (two A4 pages)

```text
Make this week's Aspiran CSAT transit set.
Page 1: 10 items, mixed on purpose (no two of the same type in a row): 3 arithmetic, 2 data interpretation,
2 logical reasoning, 2 number/series, 1 decision-making. UPSC CSAT difficulty. Each with 4 options.
Page 2: one reading passage (250 to 350 words, original, on a policy, society or environment theme), 3 questions.
For each passage question, also give the one sentence of the passage that decides the answer (for "Pluck the line").
Answers and 2-line explanations go in a separate "key" object (the QR page), never on the printed pages.
Hindi alongside. Numbers in digits.
```

**Print style:**
- A4, black on white, with no shaded backgrounds, so it photocopies cleanly.
- Text at 11 pt or larger.
- Footer: "Aspiran · aspiran.in · Answers: [QR]".
- The existing `print/print-note.html` template handles layout; I'll add a CSAT variant when the first set is ready.

---

## 5. Walk-mode audio scripts

For "listen and walk": a topic is read aloud with pauses where the listener says points back.

```text
Turn this syllabus note into a walk-mode audio script, 4 to 6 minutes when read aloud.
- Open with the one question this topic answers.
- Teach in 3 short chunks. After each chunk: "[PAUSE 15s] Say the two main points aloud." Then the two points.
- End with: "[PAUSE 20s] Now say the whole thing in three sentences." Then a model three-sentence summary.
- Spoken style: short sentences, no tables, no brackets, numbers written as they are said.
- Mark the stress on Hindi and English terms a narrator might stumble on.
Hindi script alongside (not a word-for-word translation; natural spoken Hindi).
```

No TRAGIC-tone topics in walk mode.

---

## 6. Interview board personas (for Chotu's mock boards)

Five personas. The app picks a different mix of three to five each time.

| Persona | Style | Typical move |
|---|---|---|
| The chair | Warm, broad | Opens with the DAF: "Tell us about your hometown." |
| The sceptic | Polite, presses | "But isn't that exactly what failed in 2016?" |
| The hobby-prober | Curious, specific | "You wrote chess. What's the Sicilian, and why do you play it?" |
| The current-affairs hawk | Brisk | Links the DAF to this month's news |
| The quiet one | Silent, then one hard follow-up | "You said 'transparency'. Give me one case where it made things worse." |

Prompt to build the DAF bank:

```text
From this DAF summary (no personal identifiers): <hometown, state, education, work, hobbies, optional, services
preferred>, write 60 interview questions in five groups (one per persona above), 12 each.
Mix easy openers, follow-ups that test depth, and 3 "I don't know is a good answer" questions.
No questions about religion, caste, marital plans or anything a real board should not ask.
```

---

## 7. "Pause and think" lines (draft 40, yours to rewrite)

Each line has a **moment** where it appears, once. They're unsigned, or signed "Aspiran". Rewrite freely; I'll push
back only if a line claims something the research doesn't support.

| # | Moment | Line |
|---|---|---|
| 1 | First review | Re-reading feels like learning. Recalling is learning. |
| 2 | First "show me" tap before trying | Try first. A wrong guess teaches more than a right reading. |
| 3 | Review item came back | It came back because you were about to lose it. |
| 4 | A topic moves to "Can recall" | You can find this without the book now. That's the whole game. |
| 5 | First PYQ before notes | Read what they asked before you read what to know. |
| 6 | First one-pager from memory | The gaps on this page are your real syllabus. |
| 7 | First Mains answer | Nobody writes a good first answer. Everybody who clears wrote a bad one first. |
| 8 | Self-marking | Mark yourself first. Judging your own work is half of getting good at it. |
| 9 | AI marks shown | Where you and the AI disagree is where the learning is. |
| 10 | Rewrite step | Fix one thing. One fix you keep beats ten you read. |
| 11 | Skeleton drill | Two minutes of planning saves six minutes of wandering. |
| 12 | Essay snap 1 | A good essay is decided before the first sentence. |
| 13 | GS4 case | There's rarely a clean answer. There's an honest one. |
| 14 | Chai card | The news fades. The concept under it stays. |
| 15 | Keep for Mains | Examples are what turn a fair answer into a good one. |
| 16 | Interleaved CSAT set | Mixed practice feels harder. That's why it works. |
| 17 | Pluck the line | The answer is always in the passage. Find the sentence, not the vibe. |
| 18 | Calibration, overconfident miss | Being sure and wrong costs marks twice in Prelims. Good to find it here. |
| 19 | Calibration, "not sure" and right | You knew more than you thought. Trust it a little more. |
| 20 | Pod: alone first | Think alone first. Then the group makes you sharper, not lazier. |
| 21 | Pod: compare two answers | Say which is stronger and why. Not who is better. |
| 22 | Pod helper role | Holding a group together is a skill the service will ask of you. |
| 23 | Someone returns after a gap | Welcome back. Nothing broke while you were away. |
| 24 | Restart day | Small day today. Momentum first. |
| 25 | Plan re-sized | The plan changed. The goal didn't. |
| 26 | Late-night study (shown next morning) | Sleep is when today's reading becomes tomorrow's memory. |
| 27 | Sleep view, first time | Your notes can't fix a tired brain. Your sleep can. |
| 28 | After a long focus block | Stand up. Walk. Say the topic out loud. |
| 29 | Walk mode start | Your legs can help your memory. Let's go. |
| 30 | Print set | The best revision sometimes happens on paper, on a bus. |
| 31 | You vs. you view | You're only ever measured against yesterday. |
| 32 | Monthly consolidation | This month, in one page, in your own words. |
| 33 | A bad mock | A mock is a map of what to fix, not a verdict. |
| 34 | Prelims result: not cleared | One exam day is not a measure of you. Rest first. Decide later. |
| 35 | Prelims result: cleared | Breathe. Then write, every day. |
| 36 | Interview phase opens | They aren't testing what you know. They're testing how you think when you don't. |
| 37 | Hindi medium | Your language is not a handicap. A clear answer is clear in any script. |
| 38 | Journal, first open | This is yours. We don't read it. |
| 39 | Export | Everything you made here is yours to take. |
| 40 | Day ends | Done for today. Done is a good word. |

(Line 26 states the research carefully: sleep over weeks matters more than one night. Line 16 is supported for
telling similar things apart, which is where we use it.)

---

## 8. Chotu's voice (relaxed for this generation)

- **Who Chotu is:** a small clay chai cup, a cheeky senior, an AI and proud of it.
- **Tone:** short, warm, Hinglish when the person writes Hinglish. One emoji at most, in light moments only.
- **Fine:** "Arre, ye toh easy hai, try karo." "Ok that skeleton slaps." "Bas, kal milte hain."
- **Never:**
  - jokes or emoji on TRAGIC topics, feelings, results or ranks;
  - "you should have…";
  - comparing the person with anyone;
  - writing the answer before the person tries;
  - pretending to be human.
- **Feelings:** one kind line, then: "I'm an AI. Your pod is right there, and if it's heavy, here's someone to talk to."
  Then follow the crisis protocol.
- **Nights (23:30 to 07:00):** Chotu doesn't reply, and says why once: "Sleep is part of the syllabus."

---

## 9. Hindi-first rules for everything you produce

- Every piece is made in English and Hindi together, not translated later. The Hindi editor sees both.
- Keep a **term list** per subject (`content/terms/<subject>.json`: English term, Hindi term, 1-line meaning). The
  prompt for building one: "List the 80 terms a Hindi-medium aspirant meets in <subject>, with the Hindi used in NCERT
  and UPSC's Hindi papers. Flag terms where two Hindi versions are common."
- Hindi marking ships only after the 50-answer test (see the pedagogy reply, section 5).

---

## What to send me

Put each finished pack in `content/drafts/<pack-name>/`. Include the pack JSON, both AI check reports (`check-a.json`,
`check-b.json`), and the sources. Then tell me "review <pack-name>". You'll get back a short note: ship to editors, fix
these, or redo. Editors approve in the desk.
