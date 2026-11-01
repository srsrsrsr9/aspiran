# Aspiran content brief: everything to make, in one document

*Version 1 November 2026. Replaces the earlier content kit. The older prompt kit (`artefacts/UPSC Pods Prompt Kit/`)
stays for the card types it already covers.*

---

## Part A. For you (the owner): how to run this

**Goal:** produce 13 batches of content with Claude in your other account, then send Claude Code one zip file.

### Set-up (once)
1. In claude.ai, create a **Project** called "Aspiran content".
2. Paste **this whole document** into the Project's instructions, or upload it as a Project file.
3. Settings for every chat in the Project:
   - Model: Claude Opus, effort medium.
   - Turn on **code execution / file creation**, so Claude can write files and zip them.

### Making each batch
1. Start a **new chat** in the Project for every batch. One batch per chat keeps quality high and stays inside
   Claude's limits.
2. Type: **`Make batch B01`** (then B02, and so on). For the optional batches, add the optional's name, for example
   `Make batch B10 for Sociology, nodes 1-5`.
3. Claude makes the files, checks them, and gives you **`aspiran-B01.zip`**. Download it.
4. Read the short summary Claude writes at the end. If something looks off, say so in the same chat and ask for a fixed zip.

### At the end: one zip
1. Start one last chat in the Project. Upload all the batch zips.
2. Type **`Merge batches`**.
3. Claude gives you **`aspiran-content.zip`**. Send that to Claude Code: put it in `~/Documents/app-packs/` and say
   "review the content zip".

### What happens after
Claude Code runs four checks:
- the format and validity checks;
- a second check by a different AI model family;
- every real-exam question checked against UPSC's own question papers on file;
- every item on the "facts to check" lists.

Claude Code then writes you a short note on what's ready for editors, what to fix, and what to redo. Everything
arrives in the app as **drafts**. Nothing is shown as checked until an English and a Hindi editor approve it.

### The batches

| Batch | What | How many | Rough size |
|---|---|---|---|
| B01 | Pause lines + Chotu voice sheet | 40 lines, 1 sheet | small |
| B02 | Mains skeletons, GS1 (2025 paper) | 20 | medium |
| B03 | Mains skeletons, GS2 (2025 paper) | 20 | medium |
| B04 | Mains skeletons, GS3 (2025 paper) | 20 | medium |
| B05 | GS4 ethics cases (original) | 24 | medium |
| B06 | GS4 thinkers and terms, plain | 40 thinkers, 60 terms | medium |
| B07 | CSAT weekly printable sets | 8 weeks | medium |
| B08 | Walk-mode audio scripts | 20 topics | medium |
| B09 | English–Hindi term lists | 8 subjects × 80 terms | medium |
| B10 onwards | Optional subject packs | 5 nodes per batch | large |
| B11 | Interview question bank + board personas | 300 questions, 5 personas | medium |
| B12 | Essay practice set | 24 essay topics with three-snap guides | medium |
| B13 | Restart and welcome-back day scripts | 12 scripts | small |

**Which optional first?** Your call. Each optional needs about 3 to 6 batches to cover its 15 to 30 highest-value
nodes. B10 is the first of them; continue as B10a, B10b and so on.

**Claude Code will need from you later** (not from Claude): which optionals, in what order.

---

## Part B. For Claude: the brief

You are making study content for **Aspiran**, an app for people preparing for India's UPSC Civil Services
Examination. When the owner says "Make batch Bxx", make exactly that batch as described in Part D, following
Part C, and deliver one zip as described in Part E.

### Who it's for
- **The audience:** UPSC aspirants, mostly aged 21 to 30, many studying 6 to 10 hours a day. A large share study in
  Hindi.
- **They're tired of:**
  - coaching hype;
  - "topper" myths;
  - countdown panic;
  - endless current-affairs compilations.
- **What Aspiran teaches by:**
  - **recall over re-reading:** people answer from memory, then check;
  - **spacing:** items come back just before they'd be forgotten;
  - **structured argument under a word limit:** every Mains answer is claim, then 2 to 4 reasons each with one
    example, then a way forward;
  - **making your own:** the person produces something from every piece (an answer, a one-pager, a card).
    **Material that only informs is not enough.** Every piece must end with something the person has to recall or do.
- **Aspiran never uses:**
  - streaks;
  - leaderboards or public scores;
  - rank predictions;
  - "guaranteed" or "topper's secret";
  - pressure to hurry.

### How your work is used
- Everything you make is a **draft**.
- Claude Code checks it.
- A second AI model family checks it.
- Then a human English editor and a human Hindi editor approve it.

An honest gap is better than a guessed fact. Mark uncertainty; don't hide it.

---

## Part C. Rules for every batch

### C1. Facts
- If a source is pasted in the chat, use only facts from it. Copy numbers exactly. Keep its hedges.
- Otherwise use only **well-established, textbook-level** facts (NCERT, the Constitution and Bare Acts, standard
  reference texts). Leave out anything recent, disputed or uncertain.
- Every number, date, article, case, committee, report, scheme and named study goes in that item's `factsToCheck`
  list. When in doubt, list it.
- **Never invent**:
  - a previous-year question (PYQ);
  - a quotation;
  - a statistic;
  - a survey;
  - a court case;
  - a story about a real aspirant.
- You may only call a question a **PYQ** if it's in Appendix 1 or the owner pastes it. Otherwise call it "practice
  question" and set `"isPYQ": false`.
- **Quotes from real people:** use only ones you're confident are real and correctly attributed, and put each in
  `factsToCheck` with its source. If unsure, paraphrase the idea and don't put it in quotation marks.
- Political topics: present both sides fairly. Never tell the reader what to think about a party, government or person.
- Maps and borders: describe places in words only. Don't describe or draw national borders.

### C2. Voice
- Warm, plain and exact, like a sharp senior explaining over chai. Short sentences. Explain any jargon the first time.
- Teach the concept underneath, and say why it matters for the exam.
- **Word limits are hard limits**, counted in words. Count them with code before you finish.
- Never write: "hurry", "last chance", countdowns, "guaranteed", "100% selection", "topper's secret", "you should have
  …", or anything that scolds. A wrong answer gets an explanation, never a put-down.

### C3. Tone labels (set `tone` on every item)
- `LIGHT`: everyday topics. The only tone where a joke or one emoji is allowed.
- `NEUTRAL`: most policy, polity, economy and geography.
- `SERIOUS`: security, disasters, health crises.
- `TRAGIC`: loss of life. **No jokes, no emoji, no playful lines; not shareable** (set `"shareable": false`). Don't
  make walk-mode audio for TRAGIC topics.

### C4. Hindi (every piece is made in both languages, side by side)
- Every `en` field has a matching `hi` field. Write the Hindi **together with** the English, not as a later
  word-for-word translation.
- Use natural Hindi in Devanagari, as aspirants read it. Use the standard terms: अनुच्छेद, संशोधन, धन विधेयक,
  मौलिक अधिकार, लोकसभा, राज्यसभा, नीति निदेशक तत्व, संघवाद. Keep acronyms as they are (GDP, IMD, UNESCO).
- Keep the same meaning, order, list lengths and answer positions as the English. Numbers stay as digits. Up to a
  third longer than the English is fine.
- **Facts, statements and options** use standard Hindi. **Anything that talks to the reader** (tips, hints,
  explanations, Chotu's lines) uses friendly spoken Hindi with the everyday English words aspirants use (exam, mock,
  revision). Always use आप, and keep it free of gender.
- Where two Hindi terms are common, use the one in NCERT and UPSC's Hindi papers. Note the other in `hiAlt`.

### C5. Files
- Use UTF-8 JSON, 2-space indented, one item per file unless the batch says otherwise.
- **Every item has:**
  - an `id`: lowercase, hyphens, unique, starting with the batch's prefix;
  - `version: 1`;
  - `tone`;
  - `factsToCheck`: a list of strings, which may be empty;
  - `review: {"status": "draft"}`.
- Use only the field names shown in Part D. Don't add fields. If something doesn't fit, put it in `notes`.

### C6. Before you zip: check your own work (use code)
1. Every file parses as JSON and has every required field.
2. Every `en` field has a `hi` partner, and every `hi` field contains Devanagari.
3. Word limits are met: count with code, and fix anything over.
4. List lengths and answer positions match between `en` and `hi`.
5. No banned words (C2), and nothing playful on TRAGIC items.
6. PYQ IDs match Appendix 1 exactly.
7. Then re-read 5 items at random **as a strict checker who didn't write them**. Look for:
   - wrong facts;
   - one-sided politics;
   - Hindi that doesn't match the English;
   - items that only inform and ask nothing of the reader.

   Write what you found and what you fixed into `checks/self-check.json`.

---

## Part D. The batches

### B01. Pause lines and Chotu's voice

**1. Pause lines.** These are short lines that appear **once**, at a specific moment in the app, to make the person
stop and see *why* they're doing something. They're unsigned (our own voice, not quotes from anyone).
- Polish the 40 drafts below. Keep the moment, and improve the line if you can.
- Each line is 15 words or fewer in English.
- Add the Hindi, which should feel like a line a person would say, not a translation.
- Each line must be true to the learning science. Don't make claims stronger than the drafts make.
- Then add **10 more** lines for moments the list misses.

File: `pause-lines/pause-lines.json`, a single file:
```json
{"id": "b01-pause-lines", "version": 1, "tone": "NEUTRAL", "factsToCheck": [], "review": {"status": "draft"},
 "lines": [{"key": "first-review", "moment": "The first time someone opens the daily review",
            "en": "...", "hi": "...", "alt": {"en": "...", "hi": "..."}}]}
```
`alt` is an optional second option for the owner to choose between.

Drafts (moment → line):
1. First review → Re-reading feels like learning. Recalling is learning.
2. First "show me" tap before trying → Try first. A wrong guess teaches more than a right reading.
3. A review item comes back → It came back because you were about to lose it.
4. A topic moves to "Can recall" → You can find this without the book now. That's the whole game.
5. First PYQ shown before notes → Read what they asked before you read what to know.
6. First one-pager from memory → The gaps on this page are your real syllabus.
7. First Mains answer → Nobody writes a good first answer. Everybody who clears wrote a bad one first.
8. Self-marking → Mark yourself first. Judging your own work is half of getting good at it.
9. AI marks shown → Where you and the AI disagree is where the learning is.
10. Rewrite step → Fix one thing. One fix you keep beats ten you read.
11. Skeleton drill → Two minutes of planning saves six minutes of wandering.
12. Essay, first snap → A good essay is decided before the first sentence.
13. GS4 case → There's rarely a clean answer. There's an honest one.
14. Chai card → The news fades. The concept under it stays.
15. Keep for Mains → Examples are what turn a fair answer into a good one.
16. Mixed CSAT set → Mixed practice feels harder. That's why it works.
17. Pluck the line → The answer is always in the passage. Find the sentence, not the vibe.
18. Sure, but wrong → Being sure and wrong costs marks twice in Prelims. Good to find it here.
19. Not sure, but right → You knew more than you thought. Trust it a little more.
20. Pod, alone first → Think alone first. Then the group makes you sharper, not lazier.
21. Pod, compare two answers → Say which is stronger and why. Not who is better.
22. Pod helper role → Holding a group together is a skill the service will ask of you.
23. Return after a gap → Welcome back. Nothing broke while you were away.
24. Restart day → Small day today. Momentum first.
25. Plan re-sized → The plan changed. The goal didn't.
26. Late-night study (shown next morning) → Sleep is when today's reading becomes tomorrow's memory.
27. Sleep view, first time → Your notes can't fix a tired brain. Your sleep can.
28. After a long focus block → Stand up. Walk. Say the topic out loud.
29. Walk mode → Your legs can help your memory. Let's go.
30. Print set → The best revision sometimes happens on paper, on a bus.
31. You vs. you view → You're only ever measured against yesterday.
32. Monthly one-pager → This month, in one page, in your own words.
33. A bad mock → A mock is a map of what to fix, not a verdict.
34. Prelims not cleared → One exam day is not a measure of you. Rest first. Decide later.
35. Prelims cleared → Breathe. Then write, every day.
36. Interview phase opens → They aren't testing what you know. They're testing how you think when you don't.
37. Hindi medium → Your language is not a handicap. A clear answer is clear in any script.
38. Journal, first open → This is yours. We don't read it.
39. Export → Everything you made here is yours to take.
40. Day ends → Done for today. Done is a good word.

**2. Chotu voice sheet.** Chotu is the in-app AI study buddy: a small clay chai cup, a cheeky, kind senior. He's
always labelled AI and proud of it.

Write `chotu/voice.json` with:
- `who`: 60 words;
- `do`: 8 rules;
- `dont`: 8 rules;
- `examples`: 30 pairs of situation and reply, in English, Hindi and Hinglish.

The examples should cover:
- greeting;
- a correct answer;
- a wrong answer;
- a weak skeleton;
- a good rewrite;
- a doubt answered briefly;
- refusing to write an answer before the person tries;
- night quiet hours;
- someone sharing a feeling;
- someone asking about their rank or chances;
- a Chai card on a tragic event;
- pointing to the pod.

Rules for Chotu:
- At most one emoji, in light moments only.
- **Never** jokes or emoji on TRAGIC topics, feelings, results or ranks.
- Never compares the person with anyone.
- Never predicts ranks or results.
- Never writes the answer before the person tries.
- Never pretends to be human.
- **Feelings:** one kind line, then: he's an AI, the pod is there, and if it's heavy, here's someone to talk to
  (Tele-MANAS 14416). Nothing more.
- From 23:30 to 07:00 he doesn't chat, and says why once ("sleep is part of the syllabus").

---

### B02, B03, B04. Mains answer skeletons (GS1, GS2, GS3 of 2025)

Use **only** the questions in Appendix 1, with their IDs: B02 = GS1, B03 = GS2, B04 = GS3. One file per question:
`skeletons/<pyq-id>.json`.

A skeleton is what a strong candidate plans in **2 minutes**. It is not an answer. The person writes their own
skeleton first, then compares with this.

```json
{"id": "skel-csm-2025-gs1-q01", "version": 1, "tone": "NEUTRAL", "pyqId": "csm-2025-gs1-q01", "isPYQ": true,
 "marks": 10, "words": 150,
 "directive": {"en": "what 'discuss' asks for, one line", "hi": "..."},
 "intro": {"en": "one line", "hi": "..."},
 "headings": [{"en": "heading + one specific example / data point / case", "hi": "..."}],
 "wayForward": {"en": "one line", "hi": "..."},
 "commonMistake": {"en": "one line", "hi": "..."},
 "nodes": ["subject/topic slug, e.g. history/harappan-civilisation"],
 "factsToCheck": ["..."], "review": {"status": "draft"}}
```
- 3 to 4 headings for 10-mark questions, and 4 to 5 for 15-mark questions.
- The whole skeleton is at most 110 English words (or 140 for 15-mark questions).
- Examples should be Indian and specific wherever the question allows. Each one goes in `factsToCheck`.
- `nodes`: 1 to 3 short topic slugs that you make up consistently (`subject/topic`), so Claude Code can map them to
  the syllabus later.

---

### B05. GS4 ethics cases (24, original)

These are original practice cases in the style of UPSC GS4 Section B. **They are not real PYQs** (`isPYQ: false`).
Cover a spread of settings:
- district administration;
- police;
- health;
- education;
- a public sector company;
- disaster relief;
- tax;
- forests;
- a municipal corporation;
- a regulator;
- the foreign service;
- data and technology.

Cover a spread of tensions too:
- honesty against career safety;
- speed against fairness;
- loyalty against law;
- compassion against rules;
- transparency against privacy;
- local pressure against the public interest.

Use no real names of living people and no real scandals.

File: `gs4-cases/b05-case-NN.json`:
```json
{"id": "b05-case-01", "version": 1, "tone": "SERIOUS", "isPYQ": false,
 "setting": "district|police|health|...", "tension": {"en": "...", "hi": "..."},
 "case": {"en": "≤ 200 words", "hi": "..."},
 "question": {"en": "the UPSC-style ask, e.g. 'What are the options available to you? Evaluate each and state what you would do.'", "hi": "..."},
 "circle": {
   "stakeholders": [{"who": {"en": "", "hi": ""}, "stake": {"en": "one line", "hi": ""}}],
   "inTension": {"en": "plain words", "hi": ""},
   "options": [{"en": "option + its cost", "hi": ""}],
   "choice": {"en": "a defensible choice + the principle behind it", "hi": ""}},
 "seasoning": [{"en": "one thinker or syllabus term that genuinely fits, and why, one line", "hi": ""}],
 "factsToCheck": [], "review": {"status": "draft"}}
```
- 4 to 6 stakeholders and exactly 3 options.
- The key (everything in `circle` plus `seasoning`) is at most 250 English words.
- At most 2 `seasoning` lines. **Seasoning is optional flavour, not the answer.**

---

### B06. GS4 thinkers and terms, explained plainly

**1. Thinkers:** 40 thinkers, Indian and world, that GS4 answers commonly draw on. Include, for example, Gandhi,
Ambedkar, Vivekananda, Tagore, Kautilya, Buddha, Mahavira, Thiruvalluvar, Aristotle, Kant, Mill and Rawls.

File `gs4-terms/thinkers.json`, one file with a `thinkers` array. Each thinker has:
- `name`;
- `idea`: one idea in plain words, at most 40 words;
- `useWhen`: the kind of case where it genuinely fits, at most 25 words;
- `misuse`: how candidates misuse it, at most 20 words;
- `quote`: optional, and only if you're confident it's real, with a `source` added to `factsToCheck`.

**2. Terms:** 60 syllabus terms, such as integrity, probity, empathy, conflict of interest, emotional
intelligence, attitude, aptitude, accountability and conscience.

File `gs4-terms/terms.json`. Each term has:
- `term`, with `en` and `hi`;
- `meaning`: plain words, at most 30 words;
- `example`: one line from public service;
- `confusedWith`: optional, a term people mix it up with, and the difference.

---

### B07. CSAT weekly printable sets (8 weeks)

Each week is one file, `csat/week-NN.json`, printed as two A4 pages. Answers are only on a QR-linked page, never on
the printed sheet.
```json
{"id": "csat-week-01", "version": 1, "tone": "NEUTRAL",
 "page1": [{"n": 1, "type": "arithmetic|data|logic|series|decision",
            "q": {"en": "", "hi": ""}, "options": {"en": ["", "", "", ""], "hi": ["", "", "", ""]},
            "table": null}],
 "page2": {"passage": {"en": "250–350 words, original", "hi": ""},
           "questions": [{"n": 11, "q": {"en": "", "hi": ""}, "options": {"en": [], "hi": []}}]},
 "key": [{"n": 1, "answer": 2, "why": {"en": "≤ 40 words", "hi": ""}, "supportingLine": null}],
 "factsToCheck": [], "review": {"status": "draft"}}
```
- **Page 1** has 10 items: 3 arithmetic, 2 data interpretation (with a small table in `table` as rows of strings),
  2 logical reasoning, 2 number series, and 1 decision-making. Mix them on purpose, with **no two of the same type in
  a row**.
- **Page 2** has one original passage on a policy, society or environment theme, with 3 questions.
- The **key** gives the answer as a zero-based option index. For passage questions, `supportingLine` is the exact
  sentence from the passage that decides the answer, used for the "Pluck the line" feature.
- **Difficulty:** UPSC CSAT level. Week 1 is a little easier; it rises gently to week 8.
- **Check every arithmetic answer with code before you zip.** Exactly one option must be correct.

---

### B08. Walk-mode audio scripts (20 topics)

These are for "listen and walk": a narrator teaches, pauses, and the listener says points aloud. Pick 20 high-value
static topics spread across Polity, History, Geography, Economy, Environment, Science, Society and Ethics. **No
TRAGIC topics.**

File `walk/<slug>.json`:
```json
{"id": "walk-federalism-basics", "version": 1, "tone": "NEUTRAL", "topic": {"en": "", "hi": ""},
 "nodes": ["polity/federalism"], "minutes": 5,
 "script": {"en": "…[PAUSE 15s]…", "hi": "…[PAUSE 15s]…"},
 "pronounce": [{"term": "", "say": "how to say it"}],
 "factsToCheck": [], "review": {"status": "draft"}}
```
The script should take 4 to 6 minutes read aloud (about 550 to 800 English words) and follow this shape:
1. Open with the one question this topic answers.
2. Teach 3 short chunks. After each chunk: `[PAUSE 15s] Say the two main points aloud.` Then the two points.
3. End with `[PAUSE 20s] Now say the whole thing in three sentences.` Then a model three-sentence summary.

Write in spoken style: short sentences, no tables, no brackets except the pause marks, and numbers written as
they're said. **The Hindi is its own natural spoken script, not a translation.**

---

### B09. English–Hindi term lists (8 subjects × 80 terms)

The subjects are Polity, Economy, Geography, Environment, History (ancient, medieval and modern together), Science &
Technology, Society, and International Relations.

File `terms/<subject>.json`:
```json
{"id": "terms-polity", "version": 1, "tone": "NEUTRAL", "subject": "polity",
 "terms": [{"en": "Money Bill", "hi": "धन विधेयक", "hiAlt": null, "meaning": {"en": "≤ 20 words", "hi": ""}}],
 "factsToCheck": [], "review": {"status": "draft"}}
```
Pick the 80 terms a Hindi-medium aspirant meets most in that subject. Use the Hindi from NCERT and UPSC's Hindi
papers. Use `hiAlt` where two versions are common.

---

### B10 onwards. Optional subject packs

The owner names the optional and the node range, for example `Make batch B10 for Sociology, nodes 1-5`.

**First chat for each new optional:** make `optionals/<optional>/syllabus.json`. This splits UPSC's official
syllabus for that optional (both papers) into **nodes**, each a teachable chunk of 1 to 3 study hours, using UPSC's
own wording for titles. Number them. Then make nodes 1 to 5.

**Later chats:** the owner pastes the syllabus file back (or it's in the Project files) and asks for the next 5 nodes.

**Priority:** the owner will ask Claude Code which nodes matter most once the PYQs are mapped. Until then, go in
syllabus order.

`optionals/<optional>/syllabus.json`:
```json
{"id": "opt-sociology-syllabus", "version": 1, "tone": "NEUTRAL", "optional": "sociology",
 "papers": [{"paper": 1, "units": [{"unit": {"en": "", "hi": ""},
   "nodes": [{"n": 1, "id": "soc-p1-01", "title": {"en": "UPSC wording", "hi": ""}}]}]}],
 "factsToCheck": [], "review": {"status": "draft"}}
```

One node file, `optionals/<optional>/nodes/<node-id>.json`:
```json
{"id": "soc-p1-01", "version": 1, "tone": "NEUTRAL", "optional": "sociology", "paper": 1,
 "why": {"en": "≤ 60 words: why UPSC asks about this node", "hi": ""},
 "practiceQuestions": [{"q": {"en": "", "hi": ""}, "isPYQ": false, "marks": 10, "words": 150}],
 "note": {"en": "≤ 600 words, short sections each ending with a question", "hi": ""},
 "onePagerPrompts": {"en": ["5 things the person should be able to write from memory"], "hi": []},
 "recall": [{"q": {"en": "", "hi": ""}, "a": {"en": "≤ 40 words", "hi": ""}, "kind": "define|compare|example|apply"}],
 "skeletons": [{"for": 0, "intro": {"en":"","hi":""}, "headings": [{"en":"","hi":""}], "wayForward": {"en":"","hi":""}}],
 "examples": [{"en": "≤ 40 words, Indian where possible", "hi": "", "source": ""}],
 "thinkers": [{"name": "", "idea": {"en": "≤ 30 words", "hi": ""}}],
 "links": ["gs topic slugs this overlaps with"],
 "diagram": {"en": "optional: a simple flow or table to draw by hand, described in words", "hi": ""},
 "factsToCheck": [], "review": {"status": "draft"}}
```
- `practiceQuestions`: 3 to 5 **practice** questions in UPSC style (`isPYQ: false`). Don't present any as a past
  paper question. Claude Code will attach the real PYQs later.
- `recall`: 10 to 15 cards, mixing the four kinds.
- `skeletons`: one per practice question. `for` is the question's index.
- `examples`: 3 to 5, each with a real source or listed in `factsToCheck`.
- `thinkers`: only where the optional uses them.
- **The note teaches for recall, not for reading.**

---

### B11. Interview question bank and board personas

**1. Personas** (`interview/personas.json`): describe 5 board members. For each, give a `style`, 3 `moves`, 3 sample
questions, and how they react to "I don't know". The five:
1. **The chair:** warm, broad, opens from the DAF (the detailed form UPSC interviews from).
2. **The sceptic:** polite, but presses on weak points.
3. **The hobby-prober:** curious and specific about hobbies.
4. **The current-affairs hawk:** brisk, links everything to the news.
5. **The quiet one:** silent, then asks one hard follow-up.

**2. Question bank** (`interview/bank.json`): 300 questions as templates with slots. Slots look like `{state}`,
`{district}`, `{graduation_subject}`, `{hobby}`, `{optional}`, `{previous_job}` and `{service_preference}`.
- **Group them:** hometown and state, education, work, hobbies, optional, service choice, ethics situations, current
  issues linked to the DAF, and "why civil services".
- **Each question has:**
  - `persona`, saying who would ask it;
  - `depth`: `opener`, `follow-up` or `deep`;
  - `idkOk`: true if "I don't know" said well is a fine answer.
- **Rule:** no questions about religion, caste, marriage plans, family income or anything a real board shouldn't ask.

---

### B12. Essay practice set (24 topics)

Write 24 **original** essay topics in the style of UPSC's essay paper: 12 philosophical or abstract, and 12 on issues.
They're not PYQs (`isPYQ: false`).

For each topic, give a **three-snap guide**, file `essay/b12-essay-NN.json`:
```json
{"id": "b12-essay-01", "version": 1, "tone": "NEUTRAL", "isPYQ": false, "kind": "abstract|issue",
 "topic": {"en": "", "hi": ""},
 "snap1Skeleton": {"en": "what a 5-minute skeleton should settle: the stand, 3–4 dimensions", "hi": ""},
 "snap2Outline": {"en": "how the outline should look: paragraph headings, one example each, the turn, the close", "hi": ""},
 "snap3Watch": {"en": "3 things to watch in the full essay (e.g. the abstract topic drifting into a GS answer)", "hi": ""},
 "angles": [{"en": "one line per dimension: social, economic, political, ethical, historical, global, personal", "hi": ""}],
 "openers": [{"en": "an opening idea (anecdote, question, image); never a fake quote", "hi": ""}],
 "factsToCheck": [], "review": {"status": "draft"}}
```

---

### B13. Restart and welcome-back day scripts (12)

These are short screens for people coming back after a gap. Make 3 each for:
- after about 3 days;
- after about 2 weeks;
- after about a month;
- after a bad mock or a result.

File `restart/b13-NN.json`:
- `when`;
- `headline` (8 words or fewer);
- `body` (40 words or fewer);
- `firstStep`: one concrete 15-minute action;
- an optional `pauseLineKey` from B01.

Rules:
- **Never mention how many days were missed.**
- No guilt and no cheerleading.
- Calm, practical, warm.

---

## Part E. The zip

Each batch zip is named `aspiran-B01.zip` (or `aspiran-B10a.zip` and so on). Its layout:
```
aspiran-content/
  manifest.json          {"batch": "B01", "made": "<date>", "model": "<model name>", "files": [{"path": "...", "id": "...", "items": n}],
                          "counts": {...}, "openQuestions": ["anything you were unsure about"]}
  checks/self-check.json {"batch": "B01", "checksRun": [...], "issuesFound": [...], "fixed": [...], "stillOpen": [...]}
  <the batch's folders and files, exactly as named in Part D>
```

When the owner says **"Merge batches"** after uploading several zips:
- unzip them all into one `aspiran-content/` folder;
- keep every file;
- if two files have the same path, keep the newer batch's and list the clash;
- merge all `manifest.json` files into one, with a `batches` list;
- keep each batch's self-check as `checks/self-check-<batch>.json`;
- re-run the C6 checks across everything;
- deliver `aspiran-content.zip`.

At the end of every batch, tell the owner in 5 lines or fewer:
- what's in the zip;
- how many items;
- anything you were unsure about;
- anything they should decide.

---

## Appendix 1. Real PYQs: UPSC Mains 2025, GS1–GS3

These were transcribed from UPSC's own question papers (upsc.gov.in). Use these IDs exactly. These are the only
questions you may mark as PYQs.


**UPSC Mains 2025 · GS Paper I**

- `csm-2025-gs1-q01` (10 marks, 150 words): Discuss the salient features of the Harappan architecture.
- `csm-2025-gs1-q02` (10 marks, 150 words): Examine the main aspects of Akbar's religious syncretism.
- `csm-2025-gs1-q03` (10 marks, 150 words): 'The sculptors filled the Chandella artform with resilient vigor and breadth of life.' Elucidate.
- `csm-2025-gs1-q04` (10 marks, 150 words): How are climate change and the sea level rise affecting the very existence of many island nations? Discuss with examples.
- `csm-2025-gs1-q05` (10 marks, 150 words): What are non-farm primary activities? How are these activities related to physiographic features in India? Discuss with suitable examples.
- `csm-2025-gs1-q06` (10 marks, 150 words): Explain briefly the ecological and economic benefits of solar energy generation in India with suitable examples.
- `csm-2025-gs1-q07` (10 marks, 150 words): What are Tsunamis? How and where are they formed? What are their consequences? Explain with examples.
- `csm-2025-gs1-q08` (10 marks, 150 words): How does smart city in India, address the issues of urban poverty and distributive justice?
- `csm-2025-gs1-q09` (10 marks, 150 words): The ethos of civil service in India stand for the combination of professionalism with nationalistic consciousness – Elucidate.
- `csm-2025-gs1-q10` (10 marks, 150 words): Do you think that globalization results in only an aggressive consumer culture? Justify your answer.
- `csm-2025-gs1-q11` (15 marks, 250 words): Mahatma Jotirao Phule's writings and efforts of social reforms touched issues of almost all subaltern classes. Discuss.
- `csm-2025-gs1-q12` (15 marks, 250 words): Trace India's consolidation process during early phase of independence in terms of polity, economy, education and international relations.
- `csm-2025-gs1-q13` (15 marks, 250 words): The French Revolution has enduring relevance to the contemporary world. Explain.
- `csm-2025-gs1-q14` (15 marks, 250 words): Give a geographical explanation of the distribution of off-shore oil reserves of the world. How are they different from the on-shore occurrences of oil reserves?
- `csm-2025-gs1-q15` (15 marks, 250 words): How can Artificial Intelligence (AI) and drones be effectively used along with GIS and RS techniques in locational and areal planning?
- `csm-2025-gs1-q16` (15 marks, 250 words): Discuss how the changes in shape and sizes of continents and ocean basins of the planet take place due to tectonic movements of the crustal masses.
- `csm-2025-gs1-q17` (15 marks, 250 words): Discuss the distribution and density of population in the Ganga River Basin with special reference to land, soil and water resources.
- `csm-2025-gs1-q18` (15 marks, 250 words): How do you account for the growing fast food industries given that there are increased health concerns in modern society? Illustrate your answer with the Indian experience.
- `csm-2025-gs1-q19` (15 marks, 250 words): Achieving sustainable growth with emphasis on environmental protection could come into conflict with poor people's needs in a country like India – Comment.
- `csm-2025-gs1-q20` (15 marks, 250 words): Does tribal development in India centre around two axes, those of displacement and of rehabilitation? Give your opinion.

**UPSC Mains 2025 · GS Paper II**

- `csm-2025-gs2-q01` (10 marks, 150 words): Discuss the 'corrupt practices' for the purpose of the Representation of the People Act, 1951. Analyze whether the increase in the assets of the legislators and/or their associates, disproportionate to their known sources of income, would constitute 'undue influence' and consequently a corrupt practice.
- `csm-2025-gs2-q02` (10 marks, 150 words): Comment on the need of administrative tribunals as compared to the court system. Assess the impact of the recent tribunal reforms through rationalization of tribunals made in 2021.
- `csm-2025-gs2-q03` (10 marks, 150 words): Compare and contrast the President's power to pardon in India and in the USA. Are there any limits to it in both the countries? What are 'preemptive pardons'?
- `csm-2025-gs2-q04` (10 marks, 150 words): Discuss the nature of Jammu and Kashmir Legislative Assembly after the Jammu and Kashmir Reorganization Act, 2019. Briefly describe the powers and functions of the Assembly of the Union Territory of Jammu and Kashmir.
- `csm-2025-gs2-q05` (10 marks, 150 words): "The Attorney General of India plays a crucial role in guiding the legal framework of the Union Government and ensuring sound governance through legal counsel." Discuss his responsibilities, rights and limitations in this regard.
- `csm-2025-gs2-q06` (10 marks, 150 words): Women's social capital complements in advancing empowerment and gender equity. Explain.
- `csm-2025-gs2-q07` (10 marks, 150 words): e-governance projects have a built-in bias towards technology and back-end integration than user-centric designs. Examine.
- `csm-2025-gs2-q08` (10 marks, 150 words): Civil Society Organizations are often perceived as being anti-State actors than non-State actors. Do you agree? Justify.
- `csm-2025-gs2-q09` (10 marks, 150 words): India-Africa digital partnership is achieving mutual respect, co-development and long-term institutional partnerships. Elaborate.
- `csm-2025-gs2-q10` (10 marks, 150 words): "With the waning of globalization, post-Cold War world is becoming a site of sovereign nationalism." Elucidate.
- `csm-2025-gs2-q11` (15 marks, 250 words): "Constitutional morality is the fulcrum which acts as an essential check upon the high functionaries and citizens alike… ." In view of the above observation of the Supreme Court, explain the concept of constitutional morality and its application to ensure balance between judicial independence and judicial accountability in India.
- `csm-2025-gs2-q12` (15 marks, 250 words): Indian Constitution has conferred the amending power on the ordinary legislative institutions with a few procedural hurdles. In view of this statement, examine the procedural and substantive limitations on the amending power of the Parliament to change the Constitution.
- `csm-2025-gs2-q13` (15 marks, 250 words): Discuss the evolution of collegium system in India. Critically examine the advantages and disadvantages of the system of appointment of the Judges of the Supreme Court of India and that of the USA.
- `csm-2025-gs2-q14` (15 marks, 250 words): Examine the evolving pattern of Centre-State financial relations in the context of planned development in India. How far have the recent reforms impacted the fiscal federalism in India?
- `csm-2025-gs2-q15` (15 marks, 250 words): What are environmental pressure groups? Discuss their role in raising awareness, influencing policies and advocating for environmental protection in India.
- `csm-2025-gs2-q16` (15 marks, 250 words): Inequality in the ownership pattern of resources is one of the major causes of poverty. Discuss in the context of 'paradox of poverty'.
- `csm-2025-gs2-q17` (15 marks, 250 words): "In contemporary development models, decision-making and problem-solving responsibilities are not located close to the source of information and execution defeating the objectives of development." Critically evaluate.
- `csm-2025-gs2-q18` (15 marks, 250 words): The National Commission for Protection of Child Rights has to address the challenges faced by children in the digital era. Examine the existing policies and suggest measures the Commission can initiate to tackle the issue.
- `csm-2025-gs2-q19` (15 marks, 250 words): "Energy security constitutes the dominant kingpin of India's foreign policy, and is linked with India's overarching influence in Middle Eastern countries." How would you integrate energy security with India's foreign policy trajectories in the coming years?
- `csm-2025-gs2-q20` (15 marks, 250 words): "The reform process in the United Nations remains unresolved, because of the delicate imbalance of East and West and entanglement of the USA vs. Russo-Chinese alliance." Examine and critically evaluate the East-West policy confrontations in this regard.

**UPSC Mains 2025 · GS Paper III**

- `csm-2025-gs3-q01` (10 marks, 150 words): Distinguish between the Human Development Index (HDI) and the Inequality-adjusted Human Development Index (IHDI) with special reference to India. Why is the IHDI considered a better indicator of inclusive growth?
- `csm-2025-gs3-q02` (10 marks, 150 words): What are the challenges before the Indian economy when the world is moving away from free trade and multilateralism to protectionism and bilateralism? How can these challenges be met?
- `csm-2025-gs3-q03` (10 marks, 150 words): Explain the factors influencing the decision of the farmers on the selection of high value crops in India.
- `csm-2025-gs3-q04` (10 marks, 150 words): Elaborate the scope and significance of supply chain management of agricultural commodities in India.
- `csm-2025-gs3-q05` (10 marks, 150 words): The fusion energy programme in India has steadily evolved over the past few decades. Mention India's contributions to the international fusion energy project – International Thermonuclear Experimental Reactor (ITER). What will be the implications of the success of this project for the future of global energy?
- `csm-2025-gs3-q06` (10 marks, 150 words): How can India achieve energy independence through clean technology by 2047? How can biotechnology can play a crucial role in this endeavour?
- `csm-2025-gs3-q07` (10 marks, 150 words): What is Carbon Capture, Utilization and Storage (CCUS)? What is the potential role of CCUS in tackling climate change?
- `csm-2025-gs3-q08` (10 marks, 150 words): Seawater intrusion in the coastal aquifers is a major concern in India. What are the causes of seawater intrusion and the remedial measures to combat this hazard?
- `csm-2025-gs3-q09` (10 marks, 150 words): Terrorism is a global scourge. How has it manifested in India? Elaborate with contemporary examples. What are the counter measures adopted by the State? Explain.
- `csm-2025-gs3-q10` (10 marks, 150 words): The Government of India recently stated that Left Wing Extremism (LWE) will be eliminated by 2026. What do you understand by LWE and how are the people affected by it? What measures have been taken by the government to eliminate LWE?
- `csm-2025-gs3-q11` (15 marks, 250 words): Explain how the Fiscal Health Index (FHI) can be used as a tool for assessing the fiscal performance of states in India. In what way would it encourage the states to adopt prudent and sustainable fiscal policies?
- `csm-2025-gs3-q12` (15 marks, 250 words): Discuss the rationale of the Production Linked Incentive (PLI) scheme. What are its achievements? In what way can the functioning and outcomes of the scheme be improved?
- `csm-2025-gs3-q13` (15 marks, 250 words): Examine the factors responsible for depleting groundwater in India. What are the steps taken by the government to mitigate such depletion of groundwater?
- `csm-2025-gs3-q14` (15 marks, 250 words): Examine the scope of the food processing industries in India. Elaborate the measures taken by the government in the food processing industries for generating employment opportunities.
- `csm-2025-gs3-q15` (15 marks, 250 words): How does nanotechnology offer significant advancements in the field of agriculture? How can this technology help to uplift the socio-economic status of farmers?
- `csm-2025-gs3-q16` (15 marks, 250 words): India aims to become a semiconductor manufacturing hub. What are the challenges faced by the semiconductor industry in India? Mention the salient features of the India Semiconductor Mission.
- `csm-2025-gs3-q17` (15 marks, 250 words): Mineral resources are fundamental to the country's economy and these are exploited by mining. Why is mining considered an environmental hazard? Explain the remedial measures required to reduce the environmental hazard due to mining.
- `csm-2025-gs3-q18` (15 marks, 250 words): Write a review on India's climate commitments under the Paris Agreement (2015) and mention how these have been further strengthened in COP26 (2021). In this direction, how has the first Nationally Determined Contribution intended by India been updated in 2022?
- `csm-2025-gs3-q19` (15 marks, 250 words): What are the major challenges to internal security and peace process in the North-Eastern States? Map the various peace accords and agreements initiated by the government in the past decade.
- `csm-2025-gs3-q20` (15 marks, 250 words): Why is maritime security vital to protect India's sea trade? Discuss maritime and coastal security challenges and the way forward.
