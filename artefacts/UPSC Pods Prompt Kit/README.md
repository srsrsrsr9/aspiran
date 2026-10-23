# UPSC Pods content prompt kit for Claude Sonnet 5.5 (medium effort)

22 Oct 2026. Four content families, each with a ready-to-paste prompt, a style guide, an output template and five topics:

1. **Insight shorts** (Deepstash-style): the existing Hidden Why format
2. **Boredom-break games**: Pods Connect, Higher or Lower, Fact or Fake
3. **Printable notes** people will actually forward
4. **What aspirants would pay for**: Answer Mirror, Mains value-add sheets, DAF interview drill

Everything here builds on what the project already has: the shared writer rules in `content/templates/SYSTEM_PROMPT.md`, the Hidden Why schema, the nine game engines, and the house rules in `content/README.md` (no streaks, no countdowns, every piece ends, wrong answers get an explanation and never a buzzer). Every output is a draft until a subject editor and a Hindi editor approve it.

## Files in this kit

| Path | What it is |
|---|---|
| `README.md` | This kit |
| `schemas/*.fill.schema.json` | The output template for each type, as JSON Schema (use as `output_config.format`) |
| `print/print-note.html` | Renders any printable note on one A4 page, English or Hindi, with the footer branding and QR. Paste model output into it, then Print → Save as PDF |
| `print/sample-writs.*` | A finished sample note (The five writs) as JSON, HTML, PDF and PNG in both languages |

---

## 0. How to run it

### Settings

| Setting | Value |
|---|---|
| Model | `claude-sonnet-5-5` |
| Effort | `output_config: { effort: "medium" }` |
| Thinking | leave it out (adaptive by default). Don't send `temperature`; it is rejected |
| Output | `output_config.format: { type: "json_schema", schema: <the fill schema> }` |
| `max_tokens` | 16000 |

**In the project's own pipeline** (best for volume): `tools/generate.mjs` already sends effort medium with the fill schema and one repair turn. Run it with `--model claude-sonnet-5-5`. Hidden Why works today. The seven new types in `schemas/` need a template folder and assembler entry first (see "Next steps" at the end).

**In claude.ai** (best for trying a topic): start a chat on Sonnet 5.5, paste the shared system prompt below as the first message (or into a Project's instructions), then paste the category prompt with your topic and source filled in.

### Two ways to feed facts

- **Grounded (preferred).** Paste a source between `<source>` tags: an NCERT section, a PIB release, a Bare Act article, a report summary. The model may only use facts from it, and the validator checks every number against it.
- **From knowledge (for quick drafts only).** No source. The model may use only textbook-stable facts, must list every number, date, article and named study in `factsToCheck`, and must mark every source `verify: true`. An editor clears that list before anything ships.

### Shared system prompt (paste first, every time)

This is `content/templates/SYSTEM_PROMPT.md` plus a short addendum for chat use. In the pipeline, use `SYSTEM_PROMPT.md` as it is.

```text
You write short, interactive study pieces for UPSC Pods, an Android app where civil services aspirants study together. You write every piece in English and Hindi. An editor checks your draft before anyone sees it, so a gap you leave honestly is better than a fact you guess.

FACTS
- If a <source> is given, use only facts, numbers, dates, names and article numbers that appear in it. Copy numbers exactly. Keep its hedges ("about", "usually").
- If no <source> is given, use only well-established, textbook-level facts (the level of NCERT, the Bare Act, or a standard polity text). Leave out anything recent, disputed or that you are not sure of. List every number, date, article, case, committee and study you used in "factsToCheck", and set verify: true on every source.
- Name only sources that really exist. If you are unsure of an edition or year, say "edition to confirm" rather than guessing.
- Never invent a previous-year question, a quotation, a statistic, a survey, or a story about a real aspirant.

VOICE
- Warm, plain and exact, like a good senior explaining over chai. Short sentences. Gloss any jargon.
- Teach the static concept under the news, and say why it matters for the exam.
- Present political questions from both sides. Never tell the reader what to think about a party, a government or a person.
- Word limits are hard limits, counted in words.

TONE: LIGHT (everyday, quirky; the only tone that may joke or use an emoji), NEUTRAL (most policy, polity, geography, economy), SERIOUS (security, disasters, health crises), TRAGIC (loss of life: no jokes, no emoji, not shareable).

NEVER WRITE: countdowns, streaks, "hurry", "last chance"; "guaranteed", "100% selection", "topper's secret"; hype or scolding. A wrong answer gets an explanation, never a put-down.

HINDI
- Natural Hindi in Devanagari, as aspirants read it. Standard terms: अनुच्छेद, संशोधन, धन विधेयक, मौलिक अधिकार, लोकसभा, राज्यसभा. Keep acronyms (GDP, IMD, UNESCO).
- Same meaning, order, list lengths and answer positions as the English. Numbers stay as digits. Up to a third longer is fine.
- Content (facts, statements, options) in standard Hindi. Anything that talks to the reader (tips, hints, explanations) in friendly spoken Hindi with the everyday English words aspirants use (exam, mock, revision), always आप, free of gender.

OUTPUT
Return one JSON object and nothing else: {"pack": <object matching the template>, "factsToCheck": ["...", "..."]}. In the pipeline, return the pack alone. Every "en" field has a matching "hi" field.
```

---

## 1. Insight shorts (Deepstash-style)

**Format:** `upsc-pods/hidden-why@1`, already in the app and the generator (`content/templates/hidden-why/`, six samples in `content/hidden-why/`, live preview in the "Deepstash-style insight stories" thread). One counterintuitive idea, told in 5 to 8 captions over one tall illustration, then three cards: Say it smart, Careful + If they ask next, Use it in.

**Why this and not plain idea cards:** Deepstash works because each story is one surprise, one named idea and one takeaway. For aspirants the takeaway has to be usable: a line for the interview or an answer opening. The Hidden Why already does that, so the kit keeps it and widens the kinds of hook.

### Prompt

```text
Write one Hidden Why story (schema upsc-pods/hidden-why@1) about: {TOPIC}
Idea it should name: {IDEA, e.g. "Jevons paradox"}
Papers it should serve: {e.g. mains-gs3, mains-essay, interview}
<source>
{PASTE SOURCE TEXT, or delete this block to write from knowledge}
</source>

How to build it:
1. Pick the hook: a true claim that sounds wrong. It must be the first caption and make someone stop scrolling.
2. Tell the evidence in order, one step per caption, 16 words or fewer each. Real place, real year, real actors.
3. The last caption names the idea, in the form "Economists call this ..." or "This is called ...".
4. For each frame give focus [x, y, zoom] on a 360x640 illustration that you imagine top to bottom: setting at the top, people in the middle, consequence at the bottom. [180, 320, 1] is the whole picture; zoom at most 2.5.
5. sayItSmart: about 40 words, first person, with the evidence inside it, ending with what you would do with the idea as an officer.
6. careful: what is contested, or where the popular version has no record. If the famous version is a myth, say so and give the documented one.
7. followUp: the next question a board member would ask, and an honest hint.
8. Prefer Indian evidence. If the best study is foreign, add an Indian application in useItIn.

Output template: content/prompt-kit/schemas/hidden-why.fill.schema.json
```

### Style guide

| Do | Don't |
|---|---|
| Hook is a claim, not a question ("Banning a pesticide can raise its use") | "Did you know...?" or "You won't believe..." |
| One idea per story; name it once, at the end | Two ideas, or naming it in frame 1 |
| Every caption moves the story; cut any that only describes | Adjectives doing the work ("shocking", "amazing") |
| Real actors and dates in frames 2 to 4 | Invented dialogue or quotes |
| sayItSmart sounds like a calm officer | Sounds like a coaching ad |
| Say when evidence is one study, or contested | Present one study as settled law |

Hook types to rotate across the week: a policy that backfired, a number that surprises, an Indian natural experiment, a myth with a documented twin, a law named after a person.

### Template (shape)

```json
{
  "id": "jevons-paradox-led-bulbs", "tone": "NEUTRAL",
  "title": {"en": "≤8 words", "hi": "…"},
  "scene": "illustration-key",
  "frames": [{"en": "Hook, ≤16 words", "hi": "…", "focus": [180, 320, 1]}, "… 5 to 8 frames, last one names the idea"],
  "named": {"en": "Jevons paradox (efficiency raises total use)", "hi": "…"},
  "sayItSmart": {"en": "≈40 words, first person", "hi": "…"},
  "careful": {"en": "≤45 words", "hi": "…"},
  "followUp": {"q": {"en": "…", "hi": "…"}, "hint": {"en": "…", "hi": "…"}},
  "useItIn": [{"paper": "mains-gs3", "en": "Kind of answer it fits", "hi": "…"}],
  "linkedPacks": [],
  "sources": [{"label": "Study or record", "verify": true}]
}
```

### Five topics

| # | Idea | The story | Papers | Source to paste |
|---|---|---|---|---|
| 1 | Law of one price | Kerala fishermen got mobile phones (1997 to 2001); fish prices across beach markets converged and waste fell to almost nothing | GS3, GS2, Essay | Robert Jensen, "The Digital Provide", Quarterly Journal of Economics (2007) |
| 2 | Governing the commons | Uttarakhand's Van Panchayats: villagers, not the state, managing forests since 1931, and Ostrom's design rules | GS2, GS3, GS4 | Elinor Ostrom, Governing the Commons (1990); Van Panchayat Rules |
| 3 | Default effect (nudge) | Organ donation rates differ hugely between opt-in and opt-out countries; India's Economic Survey 2018-19 used nudges for policy | GS2, GS4, Essay | Johnson and Goldstein, Science (2003); Economic Survey 2018-19, Vol 1, Ch 2 |
| 4 | Braess's paradox | Seoul tore down an elevated highway to restore the Cheonggyecheon stream (2003 to 2005), and traffic did not get worse | GS1 (urbanisation), GS3, Essay | Seoul Metropolitan Government project reports; Braess (1968) |
| 5 | Jevons paradox | Cheaper, more efficient energy can raise total use: Jevons on coal (1865) and the rebound debate after India's LED push | GS3 (energy), Essay | W.S. Jevons, The Coal Question (1865); a UJALA programme summary |

---

## 2. Boredom-break games

**The brief was "most addictive".** The project's rules rule out the usual tricks (streaks, timers, loss aversion, endless feeds), and they should: these members are under real exam stress. So the pull comes from what makes good puzzles hard to put down, which costs nothing ethically:

- **Curiosity gap:** every move reveals something (a group name, a number, a correction).
- **Near miss:** "One away" in Connect. It is the strongest "one more try" feeling in puzzle design, and it teaches at the same time.
- **Rising difficulty inside a round:** easy first, hardest last.
- **A satisfying end:** every round ends on a screen that sums up what was learnt, with "Back to study" as the main button and "Another round" as the second.
- **Short:** 2 to 4 minutes. Offered when the member taps "I'm bored", or after 25 minutes of study in a session. Never pushed by notification.

Three modes. Each runs on an existing engine with a small variant, so the app needs no new renderer for two of them.

| Mode | Engine | Why it is in |
|---|---|---|
| **Pods Connect** (16 tiles, 4 hidden groups) | Sort into buckets, with bucket names hidden until found | The NYT Connections loop: the most replayed word puzzle of the last few years. Red herrings train exactly the "looks right, isn't" skill Prelims tests |
| **Higher or Lower** | Choose (two options) | Fast, numeric, and builds the sense of scale aspirants lack (areas, lengths, populations, years) |
| **Fact or Fake** | Choose (two options), card swipe look | Ten fast true/false calls. Every fake is a real exam trap, so it is revision in disguise |

### Prompt

```text
Make one boredom-break game for UPSC aspirants.
Mode: {connect | higher-lower | swipe}
Topic: {TOPIC}
Paper: {e.g. prelims-gs1}
<source>
{PASTE SOURCE TEXT, or delete this block to write from knowledge}
</source>

Rules for every mode:
- It has to be fun in the first ten seconds and still teach something by the end. Start easy, end tricky.
- Every fact comes from the source (or, without one, is textbook-stable and listed in factsToCheck).
- Wrong answers are explained kindly. No timers, scores to share, streaks or urgency words.

Mode rules:
CONNECT (schema connect.fill.schema.json): 16 tiles in 4 groups of 4. Tiles are 3 words or fewer. Difficulty 1 to 4, one group each: 1 is a plain category, 4 is a clever link (same first word, all named after people, all from one year). Plant at least 2 red herrings: tiles that seem to fit another group, listed in redHerrings with a note. Each group's "why" teaches the rule with the fact behind it. No tile may truly belong to two groups.
HIGHER-LOWER (higher-lower.fill.schema.json): 8 to 12 items, one metric, one unit, values copied exactly. No two values within 3% of each other. Mix big and small so some pairs feel close. Each item has a nugget shown after the reveal. End with a takeaway pattern.
SWIPE (swipe.fill.schema.json): 10 to 12 statements of 18 words or fewer; 40 to 60% true. Each fake uses one named trap (extreme-word, half-true, swapped-pair, wrong-number, right-fact-wrong-reason, sounds-familiar). The reveal corrects a fake, or adds a sticky extra detail to a true one. Order: three easy, then mixed, then the two hardest last.
```

### Style guide

| Do | Don't |
|---|---|
| Group labels that make people groan when revealed ("All rivers that flow west") | Labels that are just the topic name |
| Red herrings that a well-read aspirant falls for | Trick tiles that rely on spelling or wordplay only |
| Numbers that surprise (Goa vs Delhi area) | Pairs nobody could reason about |
| Fakes that sound like a coaching handout | Silly fakes ("The Ganga flows into Antarctica") |
| End line: what this round trained, in one sentence | "You scored 7/10!" or any comparison with others |
| LIGHT tone allowed for trivia-style decks, with at most one emoji on the end screen | Emoji on SERIOUS or TRAGIC topics |

### Templates (shape)

```json
// Pods Connect
{"id": "…", "tone": "NEUTRAL", "title": {"en": "…", "hi": "…"},
 "groups": [{"difficulty": 1, "label": {"en": "…", "hi": "…"},
             "tiles": [{"en": "≤3 words", "hi": "…"}, "…4 tiles"],
             "why": {"en": "≤25 words", "hi": "…"}}, "…4 groups"],
 "redHerrings": [{"tile": "exact English tile", "looksLike": 2, "note": {"en": "…", "hi": "…"}}],
 "sources": [{"label": "…", "verify": true}]}

// Higher or Lower
{"id": "…", "tone": "NEUTRAL", "title": {…}, "metric": {…}, "unit": {…}, "direction": "higher-wins",
 "items": [{"name": {…}, "value": 3702, "valueLabel": "3,702", "nugget": {…}}, "…8 to 12"],
 "takeaway": {…}, "sources": […]}

// Fact or Fake
{"id": "…", "tone": "NEUTRAL", "title": {…},
 "cards": [{"isTrue": false, "trap": "swapped-pair", "statement": {…}, "reveal": {…}}, "…10 to 12"],
 "endLine": {…}, "sources": […]}
```

Full schemas: `schemas/connect.fill.schema.json`, `schemas/higher-lower.fill.schema.json`, `schemas/swipe.fill.schema.json`.

### Five topics per mode

**Pods Connect**

| # | Topic | Example of the trick |
|---|---|---|
| 1 | Rivers of India | West-flowing / Himalayan / tributaries of the Godavari / named after goddesses |
| 2 | Constitution's borrowed features | Britain / US / Ireland / Canada, with "Rule of law" as a herring |
| 3 | Environmental conventions | Ramsar / CITES / CBD / UNFCCC children (Kyoto, Paris, Cartagena, Nagoya) |
| 4 | Modern history: 1905 to 1920 | Events of 1905, 1911, 1916, 1919 |
| 5 | Economy jargon | Monetary tools / fiscal terms / types of inflation / RBI's own words |

**Higher or Lower**

| # | Metric |
|---|---|
| 1 | Area of Indian states (Census 2011 / Survey of India) |
| 2 | Length of Indian rivers (NCERT Class 11, India: Physical Environment) |
| 3 | Year a constitutional amendment came into force (Bare Act) |
| 4 | Forest cover by state (India State of Forest Report: use the latest edition you can cite) |
| 5 | Height of Himalayan and peninsular peaks (NCERT) |

**Fact or Fake**

| # | Deck |
|---|---|
| 1 | Parliament: sessions, joint sitting, Money Bills |
| 2 | Monsoon and climate of India |
| 3 | Fundamental Rights and their exceptions |
| 4 | Buddhism and Jainism |
| 5 | Space missions of ISRO |

---

## 3. Printable notes people will forward

**Format:** new, `upsc-pods/print-note@1`. One topic, one A4 page, front only. The renderer (`print/print-note.html`) lays it out, fits it to the page and adds the branding. See the sample: `print/sample-writs.en.pdf` and `print/sample-writs.hi.pdf`.

### What makes a note worth forwarding

Aspirants already swap PDFs on Telegram and WhatsApp all day; most are clutter. A note gets forwarded when it does one of these better than the rest, so every note must do all six:

1. **Whole topic, one page.** If it needs two pages it is two topics.
2. **A table or flow that replaces a chapter.** The core block is the reason someone prints it.
3. **Traps examiners set**, each crossed out with the truth under it. This is what makes someone say "send me that".
4. **"What most notes miss"**: the one point that good answers use and summaries skip.
5. **A 5-question self-test**, with answers printed upside down at the bottom.
6. **Trust**: sources on the page, an edition date, and "Checked by <editor>" once approved. Drafts print with a red DRAFT stamp so an unchecked note can't travel.

It must also print well: black text on white, colour only as a light tint, legible after a photocopy, under 300 KB as PDF.

### Branding (subtle, but it pays)

The footer is the only branding: the three-circle pod mark and "UPSC Pods", the line **"Free to print, copy and share. Not for sale."**, "Notes worth passing on · upscpods.app", and a small QR code labelled "Practise this topic in 3 min" that deep-links to the same topic in the app (`https://upscpods.app/n/<id>?ref=print&lang=en`). The `ref=print` tag lets you count installs that came from paper. No logo in the header and no watermark across the content; those make people crop the page, and a cropped page carries no link.

Confirm the deep-link path with the app thread before the first batch; it is a setting at the top of the renderer.

### Prompt

```text
Write one printable note (schema print-note.fill.schema.json) on: {TOPIC}
Paper and syllabus line: {e.g. mains-gs2 / "Structure, organisation and functioning of the Judiciary"}
Core layout: {table | compare | timeline | flow | grid}, or choose the one that teaches it best
<source>
{PASTE SOURCE TEXT, or delete this block to write from knowledge}
</source>

This note will be printed and forwarded between aspirants, so it must be better than the notes they already have. Make it:
- Complete: someone who reads only this page can answer a Prelims question and write a Mains paragraph on the topic.
- Dense but calm: no filler words, no exclamation marks, no "important!!" labels.
- thirtySeconds: the whole topic in one paragraph of 45 words or fewer.
- core: 4 to 10 rows, cells of 14 words or fewer. Choose columns that answer the questions examiners ask (what, who, when, not-applicable-to).
- traps: exactly 3. Each is a statement an examiner might print that is wrong, with the truth in 18 words or fewer.
- overlooked: one point most notes miss and good answers use.
- memoryHook: only if honest and memorable; otherwise null.
- mainsAngles: 2 or 3 specific angles, each naming a case, report or example.
- selfTest: 5 short questions with answers of 10 words or fewer. Mix recall and one "why".
- It must fit one A4 page: stay well inside every word limit.
```

### Style guide

| Do | Don't |
|---|---|
| Headings that say what the reader gets ("Each writ in one row") | Headings like "Introduction", "Conclusion" |
| One idea per cell | Paragraphs inside table cells |
| Article numbers, years and names in every row where they exist | Vague cells ("various restrictions apply") |
| Traps taken from real Prelims patterns (extreme words, swapped pairs) | Traps nobody would believe |
| Neutral wording on anything political | Opinions, party names, praise or blame |
| Same structure in Hindi; Hindi technical terms with English in brackets the first time if the term is new | Transliterated English in place of standard Hindi terms |

### Template (shape)

```json
{
  "id": "five-writs", "tone": "NEUTRAL",
  "title": {"en": "The five writs, on one page", "hi": "…"},
  "syllabus": {"paper": "mains-gs2", "line": {"en": "…", "hi": "…"}},
  "thirtySeconds": {"en": "≤45 words", "hi": "…"},
  "core": {"layout": "table", "heading": {…},
           "columns": [{"en": "Writ", "hi": "रिट"}, "…2 to 4"],
           "rows": [[{"en": "cell ≤14 words", "hi": "…"}, "…one per column"], "…4 to 10 rows"]},
  "traps": [{"trap": {…}, "truth": {…}}, "…exactly 3"],
  "memoryHook": {"en": "…", "hi": "…"},
  "overlooked": {"en": "≤35 words", "hi": "…"},
  "mainsAngles": [{"paper": "mains-gs2", "line": {…}}, "…2 to 3"],
  "selfTest": [{"q": {…}, "a": {…}}, "…exactly 5"],
  "sources": [{"label": "…", "verify": true}]
}
```

Add `"edition": "Oct 2026"` and the usual `review` block when the pack is assembled; the renderer reads both. Full schema: `schemas/print-note.fill.schema.json`. Finished example: `print/sample-writs.json`.

### Five topics

Chosen because they are asked often, are stable (no figures that change yearly), and are where aspirants most want a one-page summary.

| # | Topic | Layout |
|---|---|---|
| 1 | The five writs (Art 32 and 226) | table (sample already built) |
| 2 | Emergency provisions: Articles 352, 356 and 360 compared | compare |
| 3 | How the Indian monsoon works, step by step | flow |
| 4 | Landmark constitutional amendments (1st to 106th) | timeline |
| 5 | Global environmental conventions: year, aim, India's status | table |

### How to make a PDF

Open `print/print-note.html`, press **Paste model output**, paste the reply (the whole `{pack, factsToCheck}` object is fine), press **Render**, switch English/Hindi, then **Print or save as PDF** with margins set to None. It shrinks the content to fit one page and warns if the note is still too long. For batches, the same page renders headless with Playwright (the sample PDFs were made that way).

---

## 4. What aspirants would pay for

What aspirants pay coaching institutes for most, and can't get from free PDFs, is **feedback on their own Mains answers**, then **ready "value-add" material** (data, cases, committees, examples) for Mains, then **interview preparation built around their own DAF** (Detailed Application Form). All three are hard to do well at scale by hand, and all three suit a model, with guardrails. The app's existing formats already cover practice questions and mocks, so these fill the gap.

### 4a. Answer Mirror: feedback on your own answer

The member types or photographs a Mains answer. They get specific, kind, actionable feedback: what works, whether the question's demand was met, three fixes shown before and after, a better introduction and conclusion, and a private practice band. Nothing is shared, nothing is stored without consent, and the band is always labelled a practice estimate, not a UPSC prediction.

**Prompt (system prompt as above, then):**

```text
Give feedback on this Mains answer (schema answer-mirror.fill.schema.json).
Question: {QUESTION}
Marks and word limit: {10 marks, 150 words | 15 marks, 250 words}
Paper: {mains-gs2}
<answer>
{THE MEMBER'S ANSWER, exactly as written}
</answer>

You are a kind, exact senior who has evaluated many answers. Feedback must be specific to this answer; generic advice is useless.
1. demand: name the directive word and list each part the question asks; mark each yes / partly / no.
2. keepThis first: what genuinely works, quoting or pointing to it.
3. rubric: one band per area (demand, structure, content, evidence, balance, presentation) with a short note.
4. fixes: exactly 3, the highest-impact first. "before" quotes the member's words exactly; "after" rewrites that part.
5. missing: dimensions, examples, data or cases a strong answer would add. Only facts you are sure of; put any number in factsToCheck.
6. betterIntro and betterConclusion: within the word budget the question allows.
7. diagramIdea: a simple flowchart or map that would add marks, or null.
8. practiceBand: a range such as "4 to 5 of 10", and the caveat that this is a practice estimate.
Never mock, never compare with other aspirants, never promise a mark.
```

**Style guide:** praise first and specifically; one problem per fix; fixes that a person can apply in their next answer ("open with the Article, then the problem"), not "improve structure". Hindi answers get Hindi feedback. If the answer is off-topic or blank, say so gently and give a 3-line plan instead of a rubric.

**Template:** `schemas/answer-mirror.fill.schema.json` (demand, keepThis, rubric, fixes, missing, betterIntro, betterConclusion, diagramIdea, practiceBand).

**Five practice questions to launch with** (original, written in the UPSC style, not previous-year questions):

| # | Paper | Question |
|---|---|---|
| 1 | GS2 | "The office of the Governor has drifted from constitutional head to political actor." Critically examine. (15 marks, 250 words) |
| 2 | GS3 | Explain how stubble burning in north-west India links groundwater policy, crop choice and air quality. (10 marks, 150 words) |
| 3 | GS1 | Discuss the role of the press in the Indian national movement between 1870 and 1920. (10 marks, 150 words) |
| 4 | GS4 | What do you understand by "conflict of interest"? Illustrate with an example from public administration. (10 marks, 150 words) |
| 5 | GS3 | Disaster management in India has moved from relief to preparedness. Evaluate with examples. (15 marks, 250 words) |

### 4b. Mains value-add sheet

Per topic: 3 to 6 data points, cases, committees, Indian and global examples, keywords and way-forward lines. This is what toppers' notes are famous for and what aspirants spend weeks collecting. Every item carries a `verify` flag; quotes are only picked by id from the project's checked quote bank, never written by the model.

**Prompt:**

```text
Make a Mains value-add sheet (schema value-add.fill.schema.json) on: {TOPIC}
Paper and syllabus line: {…}
<source>
{PASTE SOURCES: report summaries, judgments, scheme pages. Strongly preferred for this type.}
</source>

- data: figures that strengthen an answer, each with what it is useful for and the exact source and year. If a figure is not in the source, leave it out.
- cases and committees: name, year and the one point that matters for this topic. Only ones you are certain of.
- examples: at least one Indian state or district example and one global example, each with what answer it fits.
- keywords: the terms an examiner scans for.
- wayForward: concrete, balanced steps, each naming who would act.
- quoteIds: only ids from the quote bank list given below, or empty. Never write a quote.
Quote bank ids available: {paste ids from content/quotes/quotes.json, or "none"}
```

**Style guide:** every line must be usable as-is in an answer; the year beside every figure; no figure older than the latest edition available in the source; balanced way forward, never one-sided. These sheets also print through the note renderer later if wanted.

**Template:** `schemas/value-add.fill.schema.json`.

**Five topics:** (1) Urban flooding, GS1 and GS3; (2) Judicial pendency and reforms, GS2; (3) Groundwater depletion, GS3; (4) Cooperative federalism and the GST Council, GS2; (5) Malnutrition and the POSHAN mission, GS2.

### 4c. DAF interview drill

The member enters their DAF basics (home state and district, education, work, hobbies, optional subject, service preferences). They get the questions a board is likely to ask about each, why it would ask, how to approach each, and what to avoid, plus two situational questions. It is the most personal and most anxious stage of the exam, and the one with the least good free material.

**Prompt:**

```text
Make a DAF interview drill (schema daf-drill.fill.schema.json) for this candidate.
<daf>
Home state and district: {…}
Education: {degree, subject, college}
Work experience: {…}
Hobbies and achievements: {…}
Optional subject: {…}
Service preferences: {…}
Gap years: {…}
</daf>

- 4 to 8 sections, one per DAF field that gives a board something to ask about. 2 to 4 questions each.
- Questions should be the kind boards really ask: about their district's issues, their subject applied to governance, why they changed path, what their hobby teaches.
- whyAsked: what the board is testing (honesty, depth, balance, awareness).
- approach: how to structure an honest answer. Never write the answer for them, and never suggest a fact they should claim.
- avoid: the common mistake for that question.
- 2 situational questions linked to their service preference.
- No facts about their district unless they are textbook-stable; put any in factsToCheck.
Do not keep or repeat personal details beyond what the questions need.
```

**Style guide:** calm and respectful; no "the board will grill you"; approaches that build honest answers, not scripts; never guess the candidate's caste, religion or politics from their details.

**Template:** `schemas/daf-drill.fill.schema.json`.

**Five sample DAFs to test with** (composites, not real people): (1) engineer from Nalgonda, Telangana, ex-IT, hobby cricket; (2) MBBS doctor from Darbhanga, Bihar, optional Medical Science; (3) BA History from Kohima, Nagaland, hobby folk music; (4) B.Com from Ludhiana, Punjab, worked in a family business, optional Sociology; (5) BSc Agriculture from Nashik, Maharashtra, three gap years, hobby trekking.

---

## Quality bar before anything ships

- Run every pack through `tools/validate.mjs` once its template is registered (word limits, Devanagari in Hindi fields, list lengths match, no urgency words, numbers checked against the source).
- Clear `factsToCheck` and every `verify: true` source with a subject editor.
- Hindi editor approves every Hindi string.
- Games: play each one once on a phone. If a round takes more than 4 minutes, cut it.
- Notes: print one on a cheap printer and photocopy it. If the table is hard to read, it isn't ready.

## Next steps (not done here)

1. Add template folders for the seven new types (`connect`, `higher-lower`, `swipe`, `print-note`, `answer-mirror`, `value-add`, `daf-drill`) with config, brief and example, so `generate.mjs` and the validator handle them like the other 70.
2. Connect needs a small variant of the bucket-sort renderer (hidden labels, select four, "One away"). Higher or Lower and Fact or Fake run on the Choose engine.
3. Answer Mirror and DAF drill take the member's own text, so they belong to Chotu AI inside the app with the privacy rules from the Chotu design doc, not to the batch content pipeline.
4. Confirm the print deep-link path and set up the `ref=print` install tracking.
