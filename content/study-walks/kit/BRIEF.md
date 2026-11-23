# Aspiran Track A: how to write an audio episode (read all of this first)

Aspiran (aspiran.in) is a study app for India's UPSC Civil Services exam. Listeners are aspirants aged 21 to 32, half
studying in Hindi, many in small towns, many on a second or third attempt, studying 8 to 10 hours a day. They listen
while walking. Everything is recorded as written (Fish Audio text to speech) and played as is, so it must be right,
plain, warm and complete. Today is 21 November 2026.

Kit folder (read-only reference): `/tmp/claude-0/-home-user/bd0b5b15-874e-57cb-9ef9-a74e9896ca50/scratchpad/kit/`
- `RULES.md`: the general content rules (facts, voice, tone, Hindi). Where this brief differs, this brief wins.
- `notes/*.json`: the app's existing syllabus notes, with node ids. Use them to see what the app already teaches and
  for leads to sources. They are not themselves a source, and some facts in them are stale (see "Known changes").
- `pyq.json`: official UPSC past papers (Mains 2025 GS1 to GS4; Prelims 2025, 2023, 2021, 2019, 2018), each question
  tagged with syllabus `nodes`. The ONLY past questions you may cite. Cite as e.g. "UPSC Mains twenty twenty-five,
  General Studies Paper Two, question seven". Never invent or paraphrase a past question as if it were real.
- `a2-lines.json`: every GS syllabus line (node, topic, lineIndex, line).
- `check_audio.py`: run it on your output folder before you finish: `python3 -I <kit>/check_audio.py <folder>`.
  Fix everything it flags.

## The voice

A calm senior who cleared Prelims and remembers how it felt: plain, precise, kind, never preachy, never hype.
Sentences of 20 words or fewer on average, often much shorter (this is spoken). One idea at a time. Point first, then
the reason. Examples first from India: name states, districts, schemes, judgments, years.

Two voices: `N:` the narrator, and `F:` a curious friend who asks what a listener would ask ("Wait, so who decides
that?", "Isn't that the same as...?"). F asks real questions, sometimes gets a thing slightly wrong so N can fix the
usual mistake. F is not Chotu and not a pod friend; F has no name. Neither voice talks about feelings, ranks, results,
marks they got, or toppers. Neither voice mentions itself as a voice, a recording, or how it was made.

## Structure of a study-walk episode (A1 and A2)

1. **Open with a question** a listener can chew on while walking (one or two lines). No "welcome to episode X".
2. **The topic as a story**: a real Indian moment (a judgment, a session of Parliament, a district, a scheme), then
   the concept underneath, then why it matters for the exam. Name **one real past question** from `pyq.json` by year,
   paper and number if a relevant one exists (search by node and by keyword; if none fits, say nothing about past
   questions; never invent). Give **one Indian example from the last three years (2024 to 2026)**, checked today
   against an opened source. Name **the mistake aspirants usually make** on this topic ("here's the trap").
   If a point is contested (in courts or among scholars), teach it as contested and give both sides fairly.
   Political topics: both sides fairly; never tell the listener what to think about a party, government or person.
3. **Three things to keep**, said as "First... Second... Third...".
4. **Three recall questions.** Each is asked by N with three short spoken options ("Is it... or... or...?"), then a
   line on its own: `[pause 4s]`, then N gives the answer and one line of why. Recall questions test only settled
   facts, never a contested point.
5. **A proper ending**: a calm close that finishes the episode. It may point to something the app really has
   (the syllabus note on this topic, practice questions, flashcards, Mains answer writing, Daily Chai, topic paths).
   No cliffhanger, no "next time", no "keep listening", no "subscribe".

## Spoken-script rules (hard)

- Every line in the `.txt` starts with `N: ` or `F: `, except `[pause 4s]`, which sits on a line of its own. Blank
  line between turns. No headings, no stage directions, no other markup, no brackets, no bullet points, no tables.
- **No digits at all** in the scripts. Every number, year, article and amount is said in words: "Article three
  hundred and sixty-eight", "nineteen seventy-three", "twenty twenty-five", "four per cent", "rupees three thousand
  crore". In Hindi: "अनुच्छेद तीन सौ अड़सठ", "उन्नीस सौ तिहत्तर", "चार प्रतिशत". (Captions with digits are made later
  from the recording.) Only the pause marker contains a digit.
- Abbreviations spelt out the first time: "the Reserve Bank of India, the RBI". After that the short form is fine.
  Write acronyms the way they are spoken (RBI, GST, NITI Aayog, UPSC).
- Lists are said as "first... second... third...". Short sentences. No parentheses (they can't be heard).
- Never: the word "AI" (or "artificial intelligence" except where it is genuinely the syllabus topic, and then only
  in gs3-5 lines; if so say it in full and never about how this content was made), "UPSC Pods", "editor check",
  "placeholder", "hurry", "last chance", "guaranteed", "selection guaranteed", "topper", "rank", "streak", "timer",
  "you should have", countdowns, urgency, scolding. No emoji. No jokes on SERIOUS items.
- The brand is Aspiran. Mention only these app features, and only as things that exist: Daily Chai (three to seven
  current-affairs cards a day), syllabus notes with audio, practice questions and mocks, past papers with UPSC's keys,
  Mains answer writing with marking and rewrite, guided walks, topic paths, interactives, illustrated shorts,
  flashcards, pods (small study groups), Focus blocks. Never promise anything else ("your pod will discuss this",
  "see the map in the app" are not allowed). No price talk.
- Maps: describe places in words only; no national borders.

## English and Hindi

Two separate scripts, each written natively for its listener, NOT translated line by line. Same facts, same three
things to keep, same three recall questions with the same options in the same order and the same answer; the story
and phrasing may differ. Hindi: natural Hindi of a Hindi-medium topper, not Sanskritised and not Hinglish. Use UPSC's
own Hindi terms (अनुच्छेद, संशोधन, मौलिक अधिकार, नीति निदेशक तत्व, संघवाद, लोकसभा, राज्यसभा, धन विधेयक,
मुद्रास्फीति, राजकोषीय घाटा...). Where UPSC's Hindi paper keeps an English term, say it once naturally, without
brackets. Talk to the listener as आप, gender-free. Numbers in words in Hindi too.

## Facts (the most important section)

- Facts come only from primary sources: the Constitution, Acts, Supreme Court judgments, the Gazette, PIB, ministry,
  RBI, Election Commission and UN pages, Economic Survey, Budget documents, NCERT, PRS Legislative Research for bill
  status. No coaching notes, no other book's wording.
- **Any number, law, office-holder or scheme is checked as of today (November 2026)**, and where it can change the
  script says "as of November twenty twenty-six". Open the source today (WebFetch / curl). If you cannot open a
  source for a fact today, the fact does not go in the script: leave it out, and add it to `factsToCheck`.
- Stable textbook facts (Kesavananda Bharati was decided in nineteen seventy-three; Article three hundred and
  sixty-eight is the amending power) still need a source object, but it can be the Constitution text or the judgment
  page you opened.
- Known changes the owner has told us about (use them, don't contradict them): MGNREGA was repealed on 1 July 2026
  and replaced by the VB-G RAM G Act; the Supreme Court's sanctioned strength is 38 judges since 16 May 2026 (not 34);
  the four labour codes are in force from 21 November 2025. The Governor's power to pardon a death sentence is
  disputed since 2021: teach as contested, never as a recall answer.
- Never invent a quotation, statistic, survey, court case, past question or story about a real aspirant. Paraphrase
  rather than quote unless you have the exact words from the source you opened.

## Files you write (per episode, into the folder you are given)

- `<id>.en.txt` and `<id>.hi.txt`: the scripts (UTF-8).
- `<id>.json`, exactly these fields (2-space indent, UTF-8, `ensure_ascii=False`):

```json
{
  "id": "a2-01-gs2-1-4-amendments",
  "version": 1,
  "batch": "A2-01",
  "kind": "audio-study-walk",
  "title": {"en": "...", "hi": "..."},
  "node": "gs2-1",
  "line": {"index": 4, "en": "Amendments", "hi": "संशोधन"},
  "minutes": 9.5,
  "words": {"en": 1320, "hi": 1450},
  "tone": "NEUTRAL",
  "speakers": {"N": "narrator", "F": "friend"},
  "pastQuestions": [{"paper": "csm-2025-gs2", "n": "3"}],
  "sources": [{"name": "Constitution of India, Article 368 (Legislative Department, as on date)", "url": "https://...", "opened": "2026-11-20", "what": "Parliament's power to amend and the procedure"}],
  "recall": [
    {"q": {"en": "...", "hi": "..."}, "options": {"en": ["...", "...", "..."], "hi": ["...", "...", "..."]}, "answerIndex": 1, "why": {"en": "...", "hi": "..."}}
  ],
  "factsToCheck": [],
  "notes": "",
  "review": {"status": "draft"}
}
```

- `kind` is `audio-study-walk` (A1, A2) or `audio-answer-writing` (A4). `line` is null for A1 and A4.
- `tone`: `NEUTRAL` (most polity, economy, geography), `HOPEFUL` (reform, progress, achievement), `SERIOUS`
  (security, disasters, health crises, violence), `TRAGIC` (loss of life at the centre). **Do not make an audio
  episode for a TRAGIC topic**: if a line can only be taught around mass loss of life, skip it and say so in your
  report. Usually you can teach the line as SERIOUS (institutions, causes, lessons) without dwelling on deaths.
- `minutes` = English words / 140 + 0.2 per pause, one decimal. `words` counted with code.
- `sources`: every source an object with a real URL you opened today (`opened` = the date you actually opened it, UTC, YYYY-MM-DD); `what` = the fact it
  supports. 3 to 8 sources per episode is normal.
- `recall.answerIndex` is 0, 1 or 2; spread answers across positions within the batch. Hindi options in the same order.
- `factsToCheck`: strings, each a fact you wanted but could not open a source for (and so left out of the script),
  or a fact in the script you are less than sure of. Empty is fine if everything was opened.
- `notes`: anything the importer or a reviewer should know (e.g. "teaches X as contested").

## Lengths

- A1 pilots: 12 to 15 minutes: English 1,650 to 2,050 words; Hindi about the same speaking time (1,750 to 2,400 words).
- A2 episodes: 8 to 10 minutes: English 1,100 to 1,380 words; Hindi 1,150 to 1,650 words.
- A4 answer-writing: 10 to 12 minutes: English 1,350 to 1,650 words; Hindi 1,400 to 1,950 words.
Count with code. The checker enforces these ranges.

## Your report

When done, write `_report-<your id range>.md` in your output folder: per episode, one line on what it covers, the
past question used (or "none fits"), the recent Indian example, anything contested and how it was handled, every
fact you left out because you couldn't open a source, and any line you skipped as TRAGIC. Also list anything in the
existing notes you found to be stale or wrong (with the source). Keep it short and factual. Do not write "AI" in it.

Work fast: research a topic, write en, write hi, write json, then the next one. Don't re-read files you just wrote
except through the checker. Do not touch any other folder.
