# UPSC Pods content pack: preview, 10 Oct 2026

This folder holds the sample content from the content plan's preview, as plain files the app can load. Nothing here is editor-approved yet. Every item has `review.status: "draft"` and must not go live until an English and a Hindi editor have approved it. The app's existing news desk handles that approval.

Live preview of the same content: https://claude.ai/artifact/QXBZwcKkxR7TMixYHDU1Hu

## Tools to use next time

- **Cinetic** (https://github.com/Leonxlnx/cinetic): the founder asked on 19 Oct 2026 that the next content build use it. Read its README and licence before using it, and check it fits the content rules here (no autoplay sound, reduced motion respected, every piece finite).

## Files

| Path | What it is |
| --- | --- |
| `manifest.json` | Every file in the pack, with its size and SHA-256, so the app can check a download |
| `cards/chai-2026-10-10.json` | 3 Chai cards (GI tag, El Niño, Sendai Framework) in English and Hindi, using the app's six zones |
| `illustrations/*.svg` | One drawing per card, 320×200, using the illustration palette, 1.3-1.6 KB each |
| `share/<card>.<lang>.png` | Ready-made 1080×1920 "Chai of the Day" status cards, 6 in total |
| `explainers/article-200.json` | The Ek Minute explainer: 7 timed scenes, captions in both languages, element layout and states |
| `reels/chai-in-60-2026-10-10.json` | The "Chai in 60 seconds" timeline, which reuses the cards above |
| `audio/*.ogg`, `audio/*.m4a` | The chai motif (3 s), a music bed and two soundscapes (36 s seamless loops) |
| `audio/audio.json` | What each sound is for, plus the synthesis settings used to make it |
| `timelines/making-the-constitution.json` | Timeline story: 7 dated steps, 1946 to 1950, EN and HI |
| `games/match-the-article.json` | Match the Article: a pool of 14 Article-to-meaning pairs, 6 per round |
| `quizzes/quiz-night-week-41.json` | Friday quiz pack: 5 questions revising the week's samples |
| `maps/strait-of-hormuz.json` + `illustrations/hormuz-schematic.svg` | Map Chai: 4 tappable pins and a "Find it" target on a schematic base map |
| `numbers/sex-ratio-census-2011.json` | Number Sense: one figure, 4 bars (axis 800 to 1,100, reference line at 1,000), what it means, sources |
| `myths/forward-buster-constitution.json` | Myth vs Fact: 3 forwarded claims with verdicts (Fact, Myth, Half-true) and corrections |
| `debates/simultaneous-elections.json` | Two Sides: 3 points for, 3 against, and a 3-point answer outline |
| `winddown/lamp-off.json` | Lamp Off: a 2-minute wind-down after Close the Day; uses `audio/bed.ogg` |
| `tokens.json` | Colours (light, dark and after 20:00), how each tone tag changes the look, and fonts |

The whole pack is about 2.5 MB. Most of that is the share PNGs and the audio fallbacks. A normal daily pack would carry only the card JSON and SVGs, which come to under 20 KB.

## Newer types (added 10 Oct, from the UI/UX thread's ideas)

Map Chai, Number Sense, Myth vs Fact, Two Sides and Lamp Off came from the UI/UX research thread's list of 12. Each file has a `schema` name, `en` and `hi` text side by side, and the same draft `review` block as the cards. All of them follow the same rules: no timers, no score shown to anyone else, and a finished screen at the end. Lamp Off is never shareable.

The base map is a schematic with no national boundaries drawn. Keep it that way: an Indian map with borders would need the official Survey of India outline.

## Card format (`upsc-pods/chai-pack@1`)

Each card has `id`, `tone` (LIGHT, NEUTRAL, SERIOUS or TRAGIC), `illustration`, `shareCard`, `shareable`, `review`, and one block per language (`en`, `hi`) with:

- `lensChips`: up to 4 chips, zone 1
- `headline`: zone 2
- `summary`: zone 3
- `whyItMatters`: zone 4, 2-3 bullets
- `examCorner`: zone 5, an MCQ with `options`, `answerIndex` (0-based) and two feedback lines
- `chotuJoke`: present only on LIGHT cards; show it labelled "Chotu · AI"
- `takeaway`: the one line used by the reel and the share card

`pyq` is `null` on all three cards, so the card shows `pyqLabel` ("No direct PYQ"). The trust footer (zone 6) is built from `review` once an editor approves the card. Until then, use the `ui.trust` string, which says the card is a sample.

## Rules the app should follow

- TRAGIC cards: no illustration motion, no music, no emoji, no joke, and `shareable: false`. None of the three samples is tragic.
- Entry motion uses the time in `tokens.json` → `tone`. With the system's "remove animations" setting on, show everything still.
- Sound is off by default and never autoplays. The motif is never used as a notification sound.
- In data saver, skip the illustrations and audio. The text is complete without them.

## Notes for the build

- `gi.svg` and `nino.svg` include `<text>` labels ("GI", "INDIA", "PACIFIC"). Android Studio's Vector Asset import drops text. Either draw those labels in Compose over the image, or render the SVGs with an SVG library. `sendai.svg` has no text and imports cleanly.
- `.ogg` files are Opus, which the platform player supports from Android 10. Use the `.m4a` files on older phones.
- The audio is a code-generated stand-in, mixed quietly (peaks at about -9 to -16 dBFS). The real recordings will replace these files under the same names.
- The explainer has no narration yet (`audio.narration: null`). It is designed to work on captions alone.
- `explainers/article-200.json` gives positions on a 360×400 canvas. Scale them to the screen width.

## Part 2: seven new types with sound effects and motion

| Type | Schema | Sample | What it does |
|---|---|---|---|
| Scratch and reveal | `scratch-card@1` | `scratch/three-quick-facts.json` | Guess, then scratch a chai stain off the card. The scrape follows finger speed; a chime plays at 55% cleared. |
| Stamp trail | `stamp-trail@1` | `journeys/bill-to-act.json` | A process as a journey. Each station stamps the item (thud, 200 ms squash), then it slides on (whoosh, 350 ms). |
| Chai stall radio | `radio@1` | `radio/monsoon-desk.json` | Drag a transistor dial through static to 2 to 4 bulletins that type out; the chai motif ends the show. |
| Snap together | `assemble@1` | `assemble/preamble-snap.json` | Tap tiles into order. They spring into slots with a wooden snap; a wrong one wobbles with a soft nudge. |
| Domino effect | `chain@1` | `chains/el-nino-to-your-plate.json` | Cause and effect as dominoes, with clicks rising in pitch, ending on "where can policy break the chain?" |
| Then and now | `then-now@1` | `thennow/literacy-1951-2011.json` | A slider between two census years, with ticks at each tenth. It shows only the two real data points, never estimates. |
| Postcard from a place | `postcard@1` | `postcards/sundarbans.json` | A card with a soundscape (waves, rain, wind, market, forest) that flips over (400 ms) and gets a postmark. |

Rules for all of them: sound stays off until the member turns it on; TRAGIC tone plays no sound; with motion off, every piece still works (scratch becomes one tap, the flip becomes a swap, text appears at once); every piece ends.

Sound files are in `audio/sfx/`: 12 effects and 6 looping beds, in Opus `.ogg` with AAC `.m4a` fallback. `audio/sfx/sfx.json` gives each file's length, whether it loops, and the gain to play it at.

## Templates: making a lot of content with a small model

`templates/` has one folder per content type, all 55 of them, plus `quote-bank/`:

- `schema.json` is the full pack. Fields marked `"x-from": "config"` (geometry, timings, sound ids, review state) are never written by the model.
- `fill.schema.json` is only what a writer or model fills, with word limits.
- `config.json` holds knobs and defaults (recipes, map anchors, sound choices).
- `brief.md` has the instructions for that type. `example.json` is a valid pack.
- `SYSTEM_PROMPT.md` is shared by every type: facts only from the source, tone rules, banned phrases, and Hindi style.

`tools/` (Node 18+, no dependencies except the SDK for generation):

```
node tools/validate.mjs content/chains/*.json            # schema + house rules
node tools/validate.mjs --source story.txt pack.json     # also flags numbers not in the source
node tools/selftest.mjs                                  # every template rebuilds its example from fill + config
npm install @anthropic-ai/sdk
node tools/generate.mjs jobs/jobs.example.jsonl --dry-run   # see the prompts
node tools/generate.mjs jobs/jobs.example.jsonl             # Claude Haiku 5.5 fills, then assemble + validate
node tools/generate.mjs jobs/jobs.example.jsonl --batch     # same, through the Batches API at half price
```

A job is one line: `{"type": "chain", "sourceFile": "sources/x.txt", "config": {...}}`. The generator sends the fill schema as a structured output, checks the reply, gives the model one repair turn listing any errors, assembles the pack, and writes it to `content/_generated/` as `review.status: "draft"` with a `provenance` block. Nothing is published, and an editor still approves EN and HI.

House rules the validator enforces: word limits; English and Hindi with the same list lengths, fields and answers; Devanagari in every Hindi field; jokes only on LIGHT; no emoji outside LIGHT; no sound and no sharing on TRAGIC; no urgency, streaks or promises; and a warning for any number in the English that is not in the source text.

Test run: `content/_generated/haiku-test/` has eight packs that Claude Haiku wrote from fresh source texts in `jobs/sources/`. Seven passed on the first try and one passed after the repair turn; no number was missing from its source. The first run caught a real bug (the schema tool dropped any field named `title`), which is fixed. This run went through a Claude agent with the same prompts, not through `generate.mjs`, because this environment has no API key.

Geometry-heavy types (explainer, map) never ask the model for coordinates. The explainer fills captions and labels into a fixed recipe, and the map picks pins from named anchors in `config.json`.

## Part 3: thirty more templates on nine engines

The 30 newest types are configurations of nine shared interaction engines, so the app needs nine renderers, not thirty. Each folder in `templates/` says its engine in `brief.md`, and `templates/registry.json` lists `engine` and `wave` for every type.

| Engine | Types |
|---|---|
| Choose | trap-spotter, better-answer, odd-one-out, two-truths, who-am-i, assertion-reason, how-many-correct |
| Sort into buckets | bucket-sort, union-state-list, fact-or-opinion |
| Put in order | rank-it, timeline-shuffle |
| Match pairs | pair-up, committee-match |
| Flip and reveal | flashcards, mnemonic, acronym-unpack, landmark-case, scheme-snapshot, index-card, word-bank, directive-word, two-levels |
| Step through | story-beats, ethics-dilemma, answer-skeleton |
| Side by side | versus, before-after |
| Link web | link-web |
| Fill the gap | fill-the-gap |

Every engine is tap-only (no drag needed), plays to an end, keeps sound off until the member turns it on, and works with motion off. Wrong answers get a soft nudge and an explanation, never a buzzer or a score that follows the member around. The ethics dilemma has no right answer and no right or wrong sounds.

Samples: each type has `content/<type>/<type>-sample.json`, written by Claude Haiku from a fresh source text in `jobs/sources/` (job list: `jobs/jobs.wave2.jsonl`). 28 of 30 passed the validator on the first try. Two needed one repair turn (an option one word over its limit, and a pack one pair short), and a third was repaired because it used a number that was not in its source. Details are in `_generated/haiku-wave2/report.json`. All are drafts awaiting an editor.

New validator rules: in trap-spotter the right option must be tagged "none" and every wrong one must name a trap; how-many-correct needs one true/false per statement; timelines run oldest first and rankings largest first; bucket indexes must exist; fill-the-gap gaps are numbered in order and match the answers and word bank. The "guarantee" rule now catches only promises of results, so names like the Employment Guarantee Act pass.

## Part 4: ideas from the great minds (C12 to C20)

Seven more templates on the same engines, from the great-minds playbook (`research/great-minds-playbook.md`, sections D and E). Each has a Haiku-written sample in `content/<type>/<type>-sample.json`; job list `jobs/jobs.wave3.jsonl`.

| Idea | Template or file | Engine |
|---|---|---|
| C12 Story spine | `story-spine`: a news item as a five-line Pixar spine, then the member writes one for an essay topic (nothing they write is saved or sent) | Step through |
| C13 Kautilya lens | `kautilya-lens`, plus a Myth vs Fact pack `myths/chanakya-myth-or-fact.json` ("Did Chanakya really say this?") | Flip and reveal |
| C14 Should I guess? | `should-i-guess`: the assembler works out the expected marks from the marking scheme in config (+2, −0.66), so the writer only describes situations | Choose |
| C15 Memory hooks | optional `memoryHook` on rank-it, timeline-shuffle, pair-up, committee-match, union-state-list and bucket-sort, with the Hindi written natively; sample `timeline-shuffle/national-emergencies-with-hook.json` | (end screen) |
| C16 Repeater stories | `repeater-journey`: hero's-journey order with the decision questions; a new path is a full ending | Step through |
| C17 Strategy corner | `strategy-corner`: one sourced line turned into a question about your own prep | Flip and reveal |
| C18 Quote bank | `quotes/quotes.json` (schema in `templates/quote-bank/`), 8 starter entries | reference |
| C19 Book Chai | `book-chai`: one idea, "which situation fits?", how to use it this week, a free route to read it | Choose |
| C20 Narrated classics | `narrated-classic`: a public-domain passage (Giles, 1910) with the text around it; `narrator` and `audio` stay null until a human records it | Step through |

How quotes stay honest: kautilya-lens and strategy-corner only pick a quote id. The assembler copies the exact words, citation, Hindi translation and verified flag from the quote bank, so a model can never misquote. Every starter quote is unverified (`verifiedBy: null`) until an editor checks it against the named edition; the app should show only verified quotes, at most one per screen, never on TRAGIC content or in a distress flow. Hindi translations are left for the Hindi editor. Portraits are placeholders for our own illustrations; Sun Tzu and Kautilya are labelled as an artist's impression. No web photos, and no AI voice imitating anyone.

New validator rules: story-spine lines must start with the five openers in order; strategy-corner and kautilya-lens reject battle words aimed at people (enemy, battle, war, defeat and so on) outside the quote itself; a repeater story about a real member needs `consent.given: true` (the sample is marked as an illustrative composite); a narrated passage must be copied exactly from its source text.

Haiku test (`_generated/haiku-wave3/report.json`): 7 of 9 passed first time. One needed a repair turn (a line one word over its limit). One was flagged because an English book title was in the Hindi field; titles are now allowed there.

Still to do by people: verify each quote and the Giles passage against the editions; translate quotes and the passage into Hindi; record the narrations; draw the portraits; check the marking scheme against the 2027 notice.


## Part 5: exam coverage and tags

We listed every question format in Prelims GS Paper I, CSAT, the Mains GS papers, the Essay and the two qualifying language papers: 30 formats in all (`templates/exam-formats.json`). Before this part, 7 had no template: how many pairs are correctly matched, Statement I/II/III, CSAT reading comprehension, CSAT basic numeracy, CSAT logical reasoning, CSAT data interpretation, and the précis. 15 new templates now cover those 7 and deepen 8 thin ones. The build fails if any format loses its last template.

| Format | Paper | Already covered by | New in part 5 |
|---|---|---|---|
| Direct MCQ | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `chai-pack`, `quiz-pack`, `scratch-card`, `trap-spotter`, `who-am-i`, `acronym-unpack`, `landmark-case`, `before-after`, `fill-the-gap`, `should-i-guess` |  |
| Negative stem | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `quiz-pack`, `trap-spotter`, `odd-one-out`, `two-truths` |  |
| Statements with codes | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `myth-card`, `two-truths`, `versus` | `statement-code` |
| Select the items (codes) | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `bucket-sort`, `union-state-list` | `statement-code` |
| How many statements are correct (since about 2023) | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `how-many-correct` |  |
| How many pairs are correctly matched (since about 2023) | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | (none before) | `pairs-count` |
| Statement I and Statement II (since about 2023 in this wording) | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `assertion-reason` |  |
| Statement I, II and III (since about 2024) | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | (none before) | `three-statements` |
| Match List I with List II | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `match-game`, `pair-up`, `committee-match` | `list-match` |
| Arrange in order | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `timeline`, `stamp-trail`, `assemble`, `rank-it`, `timeline-shuffle` |  |
| Location and map | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `map-card`, `postcard` |  |
| Current affairs on a static base | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `chai-pack`, `reel`, `scratch-card`, `radio`, `scheme-snapshot` |  |
| Numbers, reports and indices | Prelims GS Paper I (100 MCQs, 2 marks each, one-third negative marking) | `number-card`, `then-now`, `rank-it`, `index-card` | `data-interpretation` |
| Reading comprehension | Prelims CSAT, GS Paper II (qualifying, 33%; 80 MCQs) | `fact-or-opinion` | `csat-passage` |
| Basic numeracy | Prelims CSAT, GS Paper II (qualifying, 33%; 80 MCQs) | (none before) | `csat-quant` |
| Logical and analytical reasoning | Prelims CSAT, GS Paper II (qualifying, 33%; 80 MCQs) | (none before) | `csat-reasoning` |
| Data interpretation | Prelims CSAT, GS Paper II (qualifying, 33%; 80 MCQs) | (none before) | `data-interpretation` |
| Directive-word answer (10 and 15 marks) | Mains GS1: Indian heritage and culture, history, geography of the world and society, Mains GS2: governance, Constitution, polity, social justice, international relations, Mains GS3: technology, economy, environment, biodiversity, security, disaster management | `explainer`, `two-sides`, `chain`, `better-answer`, `fact-or-opinion`, `landmark-case`, `two-levels`, `answer-skeleton`, `versus`, `before-after`, `link-web` | `answer-diagram` |
| Reading the directive word | Mains GS1: Indian heritage and culture, history, geography of the world and society, Mains GS2: governance, Constitution, polity, social justice, international relations, Mains GS3: technology, economy, environment, biodiversity, security, disaster management, Mains GS4: ethics, integrity and aptitude | `directive-word`, `answer-skeleton` |  |
| Diagram, flowchart or map in an answer | Mains GS1: Indian heritage and culture, history, geography of the world and society, Mains GS3: technology, economy, environment, biodiversity, security, disaster management | `map-card`, `stamp-trail`, `chain` | `answer-diagram` |
| Both sides and way forward | Mains GS2: governance, Constitution, polity, social justice, international relations, Mains GS3: technology, economy, environment, biodiversity, security, disaster management | `two-sides` |  |
| Ethics concepts and thinkers | Mains GS4: ethics, integrity and aptitude | `word-bank`, `kautilya-lens`, `narrated-classic` |  |
| What does this quote mean to you? | Mains GS4: ethics, integrity and aptitude | `kautilya-lens` | `quote-meaning` |
| Case study | Mains GS4: ethics, integrity and aptitude | `ethics-dilemma` | `case-study` |
| Essay (philosophical or issue-based) | Mains Essay paper | `story-beats`, `link-web`, `story-spine` | `essay-planner` |
| Qualifying essay | Mains qualifying papers: Paper A (an Indian language) and Paper B (English) | `story-spine` | `essay-planner` |
| Précis | Mains qualifying papers: Paper A (an Indian language) and Paper B (English) | (none before) | `precis` |
| Comprehension | Mains qualifying papers: Paper A (an Indian language) and Paper B (English) | (none before) | `csat-passage` |
| Translation | Mains qualifying papers: Paper A (an Indian language) and Paper B (English) | `word-bank` | `translate-it` |
| Grammar and usage | Mains qualifying papers: Paper A (an Indian language) and Paper B (English) | `word-bank` | `usage-fix` |

Not covered on purpose: the interview (personality test) and the optional-subject papers, which need their own material.

**Tags.** Every template now carries `tags: {stage, papers, formats}`: stage is prelims, mains or revision; papers and formats use the ids in `templates/exam-formats.json`. The assembler copies them into each pack it builds, and all 72 existing packs in this folder were stamped by their schema id, so the app can filter by exam, paper or format. Each template's `brief.md` has an "Exam:" line.

**How the new types stay correct.** For statement-code and pairs-count the writer only marks each statement or pair true or false; the assembler builds the four coded options ("1 and 3 only") and the answer, so the code labels can't be wrong. For csat-quant and data-interpretation each question has an `answerExpr` (plain arithmetic) that the validator works out and compares with the right option. CSAT passages and the précis passage must be copied exactly from the source, and a précis must be about a third of the passage's length. CSAT numeracy and reasoning puzzles are marked `selfContained`, so their numbers aren't checked against a source text. None of the samples is a previous-year question.

Haiku test (`_generated/haiku-wave4/report.json`, jobs `jobs/jobs.wave4.jsonl`): 13 of 15 passed first time. One unit line was a word over its limit and was shortened by hand. One was flagged for Hindi words inside English usage notes in translate-it, which the rule now allows.

Still to do by people: a subject editor checks every statement, pair and answer, and the census figures; the Hindi editor checks every Hindi string, the translate-it items most of all; the précis sample runs a little long (93 words for 227) and is worth tightening; check the CSAT and Prelims format notes against the 2027 notice.


## Part 6: more languages (Telugu first)

Launch stays English and Hindi, written inside each pack. Every other language is a **translation file** next to the pack: `content/myths/x.json` gets `content/myths/x.te.json` (schema `upsc-pods/translation@1`, in `templates/languages/translation.schema.json`). Each translated string is keyed by the path of its English string and stores the English it was made from, so when an editor changes the English, the translation is flagged as stale. An editor for that language approves each file. The order is Telugu (pilot), then Marathi, Tamil, Bengali and Kannada as editors are found.

**How to add a language:**
1. Add it to `LANGS` in `tools/lib/pods-templates.js` (script, word factor, fixed phrases).
2. Write `templates/languages/<code>.md`, the style note with a glossary.
3. Run `node tools/translate.mjs <code> content/` to translate packs, or `--dry-run` to see the prompts.
4. Run `node tools/validate.mjs <file>.<code>.json` to check a file. Run `node tools/translate.mjs <code> content/ --stale` to list files whose English has changed.

The validator checks that each string is in its language's script (not Devanagari in a Telugu field, for example), that list lengths and answers still match the English, the word limits (the English limit times the language's factor), that every number survives, and the fixed phrases. Memory aids (mnemonics, memory hooks) are written fresh in each language, not translated. Acronyms stay as they are. The three qualifying-paper types (precis, translate-it, usage-fix) are never translated; they get a new pack in the other language.

**Two registers.** Primary content (facts, statements, options, exam-style questions, passages) is in the standard written language. Comments and instructions (the "why" explanation, tips, nudges, guided steps, questions to the reader) are colloquial, the way a friendly senior talks, with the everyday English words aspirants use. The library tags every string `content` or `chat` (`registerOf` in `tools/lib/pods-templates.js`), translation prompts pass the tag along, and the Hindi writer prompt follows the same rule. Hindi already written stays as it is until editor review.

An exam fact that shapes the style notes: the Prelims papers are set in English and Hindi only, while Mains answers and the interview can be in Telugu. So Prelims-style pieces in Telugu give the English term in brackets the first time it appears, and Mains-style pieces use the Telugu term alone.

There are seven Telugu samples, all by Claude Haiku and all valid: statement-code, timeline-shuffle (emergencies), the Chanakya myth pack, ethics-dilemma, data-interpretation, story-spine and mnemonic. The Studio has a తెలుగు switch that shows them. App labels are not translated yet, and the page loads Noto Telugu fonts.

`templates/bundle.json` is the whole template set in one file (prompts, registry, exam formats, languages, and every type's schema, fill schema, config and brief) for tools that can't read 70 folders.

## Part 7: Indian thinkers, routines and calm (C21 to C27)

From sections F and G of the great-minds playbook. Job list: `jobs/jobs.wave5.jsonl`. Haiku report: `_generated/haiku-wave5/report.json`.

| Item | What was built |
|---|---|
| C21 Thinker lens | New `thinker-lens` template, a general version of the Kautilya lens. It sticks to older, classical voices. Samples: Tirukkural 391, Dhammapada verse 1, Basavanna's "Kayakave Kailasa" and Patanjali's Yoga Sutra 1.12 |
| C22 Did they really say it? | `myths/did-they-say-it.json` covers the Buddha, Vivekananda and Kalam, and sits next to the existing Chanakya pack |
| C23 Quote bank | 8 Indian entries in `quotes/quotes.json`: Tirukkural, the Gita, the Dhammapada, Patanjali, Basavanna, Kabir, Tagore and Vivekananda. Each has a new `original` field holding the line in its own script (Tamil, Sanskrit, Pali, Kannada, Bengali, Hindi). All are unverified until an editor checks them |
| C24 Reform movements | `timeline-shuffle/social-reform-movements.json` (1848 to 1927), `story-beats/savitribai-phule-school.json`, `story-beats/narayana-guru-aruvippuram.json` and `story-beats/basavanna-anubhava-mantapa.json` |
| C25 Routine library | New `routine-card` template ("How they worked"). Samples: Benjamin Franklin (from his Autobiography) and Charles Darwin (from Francis Darwin's reminiscences), both public domain. Each card covers what to borrow and what not to copy |
| C26 Calm | New `calm-script` template. Samples: 3-minute slow breathing, a 1-minute double sigh, and 3-minute 5-4-3-2-1 grounding, each with the Tele-MANAS (14416) support line. The sound kit has six new 60-second loops: calm tones at 4, 6 and 8 Hz offsets on a 200 Hz carrier (stereo, headphones), pink noise, and a 6-breaths-a-minute breath pacer, generated by `tools/calm-sounds.cjs` |
| C27 Book Chai | `book-chai/atomic-habits.json`, `book-chai/power-of-habit.json` and `book-chai/daily-rituals.json` |

**Rules the validator now enforces:**
- Calm scripts may not make health claims (cure, heal, treat, therapy, proven, brainwaves and similar). Their steps must add up to the promised minutes, and slow breathing must come to 5 to 7 breaths a minute.
- A routine card may only quote words that appear in its source text.
- The new routine and calm types are tagged `wellbeing`.

**Not built, on purpose:**
- *Rich Routines* and *The Joy of Routines*: I couldn't confirm their authors and editions, so an editor should check them first.
- "Calm now" and "My Routine": these are app features that belong to the app thread.

**Still to do by people:**
- A subject editor checks every source text, since Claude wrote them from general knowledge.
- Verify each new quote against its edition, and the helpline number with the safety lead.
- Record the calm scripts with a human narrator.
- A Telugu editor reviews the seven Telugu files and the glossary.


Editorial choice (11 Oct): thinker and quote content uses older, classical Indian voices (Kautilya, Thiruvalluvar, the Buddha, Patanjali, the Bhakti and Sharana saints), not modern public figures. Exam history facts that name modern figures, such as the Dandi March or the Drafting Committee, stay in the history packs because Prelims asks about them.

## Part 8: GS2 Polity lane, mock paper, long reads and honest tools (12 Oct)

Job list: `jobs/jobs.wave6.jsonl` (sources in `jobs/sources6/`). Haiku report: `_generated/haiku-wave6/report.json`. Everything is `review.status: "draft"`.

| Item | Where |
|---|---|
| Syllabus map | `polity/syllabus-map.json`: the GS2 and Prelims Polity syllabus lines and 27 topic nodes. Each node lists its packs, long read, mock questions and (empty until imported) PYQs. 15 nodes have material, 6 are thin, and 6 are empty: union and territory, privileges, UTs and special provisions, separation of powers, pressure groups, official language |
| 14 Polity packs | Preamble (how-many-correct), citizenship (flashcards), President vs Governor (versus), Election Commission (statement-code), constitutional posts (who-am-i), anti-defection (assertion-reason), Supreme Court jurisdiction (list-match), Fifth or Sixth Schedule and constitutional, statutory or executive (bucket-sort), joint sitting (trap-spotter), Acts before 1947 (timeline-shuffle), borrowed features (pairs-count), Council of Ministers (three-statements), S.R. Bommai (landmark-case) |
| New `long-read` template | Five reads: basic structure, making the Constitution, the Governor, the anti-defection law, fiscal federalism. Each runs 3 to 5 minutes, because the source notes were short; longer sources give longer reads |
| New `mock-paper` template | `mock-paper/mock-paper-sample.json`: a 30-question GS2 Polity sectional paper in the real Prelims formats, with +2 / -0.66 marking. Answers are spread 8/7/7/8 across (a) to (d), and every key was re-checked by hand. The timer is off by default and only ever counts up |
| PYQ database | `pyq/` (schema, empty database, README) and `tools/pyq-import.mjs`. It fills only from official UPSC PDFs a person downloads; see `pyq/README.md` |
| Honest guide | `honest/five-source-maps.json` (16 subjects, 74 sources, 10 marked verify) and `honest/coaching-guide.json` (10 sections, with the CCPA coaching-ad guidelines and the consumer helpline). Markdown copies sit beside them |
| Reel render | `reels/out/chai-in-60-2026-10-10.en.mp4` and `.hi.mp4` (1080x1920, 58 s), made by `tools/render-reel.cjs` from the reel JSON. It skips TRAGIC cards and puts the bed at 0.55 with the motif at 52.4 s |
| Fact-check | `_generated/fact-check-2026-10-11/part1` and `part2` (.json and .md). Two clear errors are fixed: the rank-it area gap (540 sq km, not 4,500) and Darwin's 9.30 reading. Everything else waits for an editor, including the MGNREGA card (the scheme was replaced by a 2025 Act) and the My Path numbers |

**Rules the validator now enforces:**
- A mock paper has statements where its format needs them, the same number in Hindi, at most three right answers in a row with the same letter, and no letter on more than 40 percent of answers.
- A long read's minutes must match its word count at 150 words a minute.

**Book titles checked:** *Rich Routines* (Steve Houghton) exists, as a 2024 audiobook with a summary trail. I found no book called *The Joy of Routines*. The closest is Ashley Brown's *The Routine-Building Handbook* (Ulysses Press). Neither has a card yet.

**Safety and community drafts** live outside content, in `/community/`: crisis protocol, community rules, pod-lead playbook, and Hindi, Telugu and English distress-phrase lists. All are drafts for the safety lead, a mental-health professional and native speakers.
