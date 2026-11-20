# Content mega prompt, 20 Nov 2026: everything left to make

**For the owner.** One prompt covers every open content need. Paste everything below the line into your content
account (Claude Opus, a project or Claude Code folder) and attach `artefacts/content-reference-part10.zip`. It works
batch by batch (M1, M2, …) and hands back one zip per batch, `aspiran-M<n>.zip`. Drop each zip in
`docs/content/` and tell Claude here "import the M zips". They go live as soon as they pass the checks (your rule since
14 Nov).

Order: M1 to M4 first (they fill gaps people can already see), then the volume batches M5 to M9, then M10 to M12.
Part S at the end is for the **shorts machine** (the Claude Code folder that made the 100 shorts), not the content account.

---

# Aspiran content: everything left to make (batches M1 to M12)

You are making study content for **Aspiran** (aspiran.in), a study app for India's UPSC Civil Services exam.
Readers are aspirants aged 21 to 32, half of them studying in Hindi. Everything you make is shown in the app as is, so
it must be right, plain and complete.

## Read first (in the attached zip)

- `RULES.md`: the rules for facts, voice, tone labels, Hindi and files. They bind every batch. The short version:
  every fact has an opened source (name, URL, the date you opened it); a fact you can't open goes in `factsToCheck`,
  never guessed; plain sentences; English and Hindi side by side in the same file (`en` and `hi`); a `tone` on every
  item; no "AI" anywhere in the text; never say a person checked something.
- `notes/*.json`: the current syllabus notes, in the exact format to copy.
- `topic-paths/*.json`: the 8 Polity topic paths, the format for path steps.
- `part8/`: earlier batches as examples of every other format (cases, skeletons, mocks, games).
- `captions-en/<set>/*.vtt`: the English captions of the 257 videos already in the app.

## How to hand back each batch

- One zip per batch: `aspiran-M<n>.zip`, with the files in the same folders and formats as the examples, plus
  `checks/manifest-M<n>.json` listing every file with its kind, and `checks/report-M<n>.md` (what you made, what you
  could not verify, anything you changed in existing items and why).
- Before zipping, check your own work with code: every JSON parses, every item has `en` and `hi`, every MCQ's
  `answerIndex` points at an option, no duplicate ids, every source has a URL and an opened date, no "AI" in any text.
- If a usage limit stops you mid-batch, say where you stopped; next time continue from there.

## M1. Hindi for what has none (do first)

- 30 notes have no Hindi: all 8 Economy notes (`eco-syl-*` in `notes/economy.json`), 6 Environment, 8 Geography,
  8 Modern History. Add `hi` exactly as the other notes have it.
- The 12 CSAT notes' `worked` questions and `passages` have no Hindi. Add `hi` to each (`{q, options, solution}` and
  `{text}`), with the terms UPSC's own Hindi CSAT paper uses.
- Ten Polity notes had their English corrected on 14 Nov. Compare `en` and `hi` in `notes/polity-*.json` and make
  every Hindi say what the English says.

## M2. Open the sources for the unverified facts

- 182 facts in the notes are `"status": "unverified"`. Open the primary source for each and either fill `source`,
  `url`, `opened` and set `"status": "verified"`, or correct the fact (in both languages) and say so in the report.
- Start with the nine notes that have no opened source at all: electoral reforms; IMF, World Bank and WTO; other
  countries' policies; budget process; deficits and FRBM; fiscal federalism; industrial policy; infrastructure sectors;
  infrastructure investment models. Time-sensitive facts first: 2025 US tariffs, CBAM dates, the labour codes in force
  from 21 Nov 2025, MSME limits from April 2025, the 129th Amendment Bill.
- Hand back only the changed notes, whole.

## M3. Hindi captions for every video

- For every file in `captions-en/`, make the Hindi caption file: same cue timings, same number of cues, Hindi text
  that fits the time (about 15 Hindi words per 5 seconds; shorter is better), UPSC's Hindi terms.
- Name each `<same name>.hi.vtt` in the same folder. Check with code that the cue timings match the English file
  exactly.

## M4. Cover-video captions and the Federalism recorded note

- Hindi captions for the 8 Polity topic cover videos: these are among the files in `captions-en/` whose names match
  a topic in `topic-paths/` (`flex` names the video). List the 8 you found in the report.
- A recorded-note script for Federalism (`topic-paths/federalism.json`): 6 to 8 minutes read aloud, in `en` and
  `hi`, in the walk-script format from `part8/` (short sentences, no tables, every number said in words once).

## M5. Mains model answers from past papers (volume: 600+ answers)

- Claude here sends you the Mains GS1 to GS4 questions of 2013 to 2024 as text files (`pyq-mains-<year>.txt`, from
  UPSC's own papers). One batch per year: M5-2024, M5-2023, … down to M5-2013.
- For each question, a model answer skeleton in the `mains-skeleton` format from `part8/` (the 2025 ones): what the
  question asks, the structure, the points with sources, an example or case, a way to end, and the word limit UPSC set.
  English and Hindi.
- Use the question **word for word**, with year, paper and number. Never write a question that isn't in the file.

## M6. Prelims explanations from past papers (volume: 30 years)

- Claude here sends the Prelims GS questions of 1995 to 2017 as text with UPSC's keys (`pyq-prelims-<year>.txt`).
  One batch per year: M6-2017 down to M6-1995.
- For each question: why the keyed answer is right, why each other option is wrong (one line each), the syllabus leaf
  (`syllabusNodes`, ids from `notes/`), what trap the question set, and a source. English and Hindi.
- If you believe UPSC's key is wrong, keep the key, explain both views, and list it in the report. If a fact has
  changed since that year (a law repealed, a number revised), say what was true then and what is true now.

## M7. One-page revision sheets (smart notes)

- One sheet per syllabus note in `notes/` (about 300): the 8 to 12 things to remember, one diagram described in
  words (Claude here draws it), the 3 mistakes aspirants make, the past questions it links to (by year and number,
  only from the files Claude sends), and the sources. In `en` and `hi`.
- Format: a new kind `revision-sheet`, fields `{id, node, title, keep[], diagram, mistakes[], pyqs[], sources[], tone}`
  each in `en`/`hi`. Batches by subject: M7-polity, M7-economy, M7-history, M7-geography, M7-environment,
  M7-ethics, M7-science, M7-society, M7-ir, M7-security, M7-csat.

## M8. Subject workbooks (eBooks and print)

- The Polity sample workbook is the model (chapter anatomy: fill-in notes, blank diagrams, sorts, Mains pages, news,
  mistake and past-question logs, flashcards, answer key). Make the content for 8 more, in this order: Syllabus
  Companion (the whole syllabus, thin), Economy, Modern History, Geography, Environment, Ethics, Art and Culture,
  Science and Technology.
- One batch per workbook (M8-companion, M8-economy, …): a `workbook.json` with chapters, each chapter's blocks in
  `en` and `hi`, an answer key, and the sources. Claude here lays out the PDF and builds the QR screens.

## M9. Quizzes for every syllabus line

- For each note in `notes/` that has fewer than 10 practice questions, write enough to reach 10: 4 options, one
  right, `why`, a source, `syllabusNodes`. In the question format from `part8/`. UPSC style (statements, pairs,
  "how many of the above"), never a past question copied.
- Batches by subject, like M7.

## M10. Indian stories for GS1 (Chai and shorts)

- Daily Chai cards for GS1 are mostly about other countries, because the feeds lack Indian art, culture and society
  news. Make 60 evergreen GS1 cards (art, architecture, festivals, crafts, GI tags, social reformers, heritage
  sites, society) in the Chai card format from `part8/`, each tied to a syllabus node, `en` and `hi`.
- Also 30 story ideas for future illustrated shorts: title, format (story, map journey, case file, timeline, two
  sides, past question, biography), 6 to 8 beats, sources.

## M11. Interviews, Mains 2024, games, Telugu (assignments 6 and 7)

- Assignment 7 as written: interview questions by state, stream and hobby; Mains 2024 skeletons (if M5-2024 is done,
  skip those); the first Telugu content.
- Assignment 6: the practice-game topics marked thin.

## M12. Mocks and the book map (assignment 8, G4 and G8)

- As written in assignment 8: G4, the book map; G8, the mocks. Not started yet.

---

## Part S. For the shorts machine (paste in the Claude Code folder that made the 100 shorts)

```text
Two gaps in the delivered shorts:
1. Shorts 31 to 40 (English and Hindi) came without their manifest.json. Rebuild deliver/ for that batch
   with its manifest, exactly as section 9 says, under the new week ids given below.
   Videos, captions and posters are already with Aspiran; only the two manifests are needed. The week ids must not
   clash with these, which are already live: 2001-01 (1-5), 2001-02 (11-20), 2001-03 (21-30), 2001-04 (41-50),
   2001-05 (51-60), 2001-06 (61-70), 2001-07 (71-80), 2001-08 (81-90), 2001-09 (91-100), and 2002-01 to 2002-09
   for the same Hindi sets. Use 2001-10 for English 31-40 and 2002-10 for Hindi 31-40.
2. Shorts 6 to 10 were never delivered. Finish them (queue.json shows where they stopped) and deliver them as
   week 2001-11 (English) and 2002-11 (Hindi).
In every manifest, leave voice.note empty and never write "AI" in any text or on screen.
Zip each as aspiran-shorts-fix.zip and hand it back.
```
