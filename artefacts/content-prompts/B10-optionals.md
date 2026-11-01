# Make an optional-subject batch for Aspiran

Paste all of this into a new chat, then type, for example: Make batch B10d for Geography, nodes 5-9. If you have the optional's syllabus.json, paste it too.

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

## Your batch

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

## How to deliver (this chat can't make files)
- Don't zip. Print every file as its own block: first a line with only the path (for example
  `aspiran-content/skeletons/gs1-2025-01.json`), then the JSON in a ```json block. Nothing else on the path line.
- End with `aspiran-content/manifest.json` and `aspiran-content/checks/self-check.json`, as described in Part E.
- If the batch doesn't fit in one reply, stop at a whole file and write `CONTINUES`. I'll say "next".
- No commentary between files. Put anything you're unsure of in the manifest's `openQuestions`.
- You can't run code, so check word counts and list lengths carefully by hand. Claude Code re-checks them with code.

## Part E (manifest and self-check shapes)
aspiran-content/
  manifest.json          {"batch": "B01", "made": "<date>", "model": "<model name>", "files": [{"path": "...", "id": "...", "items": n}],
                          "counts": {...}, "openQuestions": ["anything you were unsure about"]}
  checks/self-check.json {"batch": "B01", "checksRun": [...], "issuesFound": [...], "fixed": [...], "stillOpen": [...]}
  <the batch's folders and files, exactly as named in Part D>
