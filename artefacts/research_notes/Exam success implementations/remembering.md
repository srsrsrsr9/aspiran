# Remembering family: how RET, SPA and MNE are implemented in practice

Scope: Part 3 notes on implementation patterns for three Part 2 ideas. RET is retrieval practice, SPA is spacing and scheduled review, and MNE is memory techniques. These notes describe how each idea is built and what it costs. They do not judge effectiveness; Part 4 does that. Catalogue numbers (#n) refer to the Part 2 appendix in `artefacts/reports/Exam success central ideas.md`, abbreviated **[P2]**. The Part 1 catalogue is `artefacts/reports/Exam success tools and methods.md`, abbreviated **[P1]**. Codes in brackets after an entry are its Part 2 primary and secondary codes.

## Q1. What are the distinct implementation variants of RET (retrieval practice), and how does each work?

### Takeaway
Retrieval practice ships in about ten distinct forms. They differ on four design choices:
- **Recall or recognition:** a blank page or typed answer, against multiple choice or matching.
- **Who makes the questions:** the learner, a publisher or coach, a community, or AI.
- **Feedback timing:** instant per item, or checking at the end against the notes.
- **Unit size:** a single fact, a cloze line, an exam question, or a whole topic.

The cheapest forms (blank page, red sheet) cost nothing but discipline. Question banks and AI generators move the work of writing questions onto a vendor.

### Cited Findings

**V1. Basic two-sided flashcards (self-made or shared decks).**
- How it works: see the prompt, try to recall, flip, then grade yourself.
- Anki's four grading buttons are Again, Hard, Good and Easy. Again sends a card back to the first learning step. Hard repeats the current step. Good advances it. Easy graduates it at once. — [Anki manual, Deck Options](https://docs.ankiweb.net/deck-options.html)
- Anki deliberately cut SM-2's six grades to four, with one fail button instead of three, "since failures are a small share of reviews". — [Anki FAQ, What spaced repetition algorithm](https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm)
- Brainscape replaces right/wrong grading with a 1–5 confidence self-rating. A 1 means you would forget within minutes; a 5 means you are confident you won't forget. Low ratings bring a card back within a handful of cards. — [Wikipedia, Brainscape](https://en.wikipedia.org/wiki/Brainscape); [Brainscape Academy](https://brainscape.com/academy/science-never-forgetting-spaced-repetition)
- One review notes the confidence schedule is only as accurate as the learner's honest self-rating. — [Nibble blog on Brainscape](https://nibble-app.com/blog/brainscape) (competitor source)
- Catalogue carriers: Anki #1, AnKing deck #2 (community-vetted medical deck mapped to the exam syllabus), Quizlet #18, Cram.com #20, Brainscape #19, StudyStack #436, Mnemosyne #4, AnkiApp #6. — [P2]

**V2. Card-writing rules: the minimum information principle, cloze deletion and image occlusion.**
- SuperMemo's "20 rules of formulating knowledge" (Woźniak, 1999) is the reference design guide for card granularity. Key rules:
  - Do not learn what you do not understand.
  - Learn before you memorise.
  - Minimum information principle: short question, very short answer.
  - Cloze deletion, which turns sentences into fill-in-the-blanks.
  - Graphic deletion (image occlusion): hide part of a picture and name the hidden area.
  - Avoid sets and enumerations; split lists with overlapping clozes.
  - Combat interference between similar items.
  - Add sources and date stamps.
  — [SuperMemo, 20 rules](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge)
- Retain drafts three card types from uploads: Q&A, cloze and image occlusion, each with a source reference. — [P1, Retain profile, citing retain.cards](https://www.retain.cards/)
- Note-to-card tools make cloze and marked-line cards inside the learner's notes:
  - RemNote #8: notes and PDF highlights become cards.
  - Logseq #9: marked blocks become FSRS cards.
  - SiYuan #10: selected text becomes FSRS-5 cards.
  - Traverse #13: mind-map notes with cloze cards.
  - ZKMemo #17: Zettelkasten notes double as cards.
  - Mochi #5: Markdown notes become cards.
  — [P2]

**V3. Multiple-choice question banks with long explanations (recognition-format retrieval, feedback per item).**
- UWorld #74 (exam-realistic questions, each with a long explanation)
- AMBOSS #75 (bank linked to a reference library)
- Marrow #172, India (NEET-PG)
- PrepLadder #171
- Magoosh #80
- Testbook #178
- Examveda #446 and IndiaBIX #447 (free MCQ sites)
- UPSC-specific: YaadAI #47, SpacedRevision #45, UPSC Prep #48 (missed questions enter an SM-2 queue; mocks use negative marking)
— [P2]

**V4. Topic-sorted question books ("drill books").**
- China: 5·3 (*5 Years Gaokao, 3 Years Mocks*) #401 sorts real and mock exam questions by topic.
- India: Oswaal CBSE Question Banks #521 (chapter-wise solved and past board questions) and MTG *Objective NCERT at your Fingertips* #522 (MCQs drilling NCERT line by line).
- India, aptitude: R.S. Aggarwal's reasoning book #466 and Arun Sharma's CAT book #467, which uses three difficulty levels.
- China's volume variant is 刷题 / 题海战术 #400: drill very large numbers of past and mock questions until the patterns are automatic. It is criticised as rote. — [P1 row 400](../../reports/Exam%20success%20tools%20and%20methods.md); [P2]

**V5. Free recall: blank page, brain dump, blurting (UK) and 백지복습 (Korea).**
- Blurting: read a topic, close the book, write everything you recall, then fill the gaps in another colour. P1 found no inventor; it is a folk method of UK GCSE and A-level culture. — [P1 #327, citing Save My Exams](https://savemyexams.com/learning-hub/revision-tips/create-a-spaced-repetition-schedule-to-boost-memory)
- The Learning Scientists list six forms, all needing only "pen and paper":
  1. Practice questions without the book.
  2. Making your own questions, ideally traded with a study group.
  3. Flashcards: recall first, then flip.
  4. Writing everything you know on a blank sheet.
  5. Drawing from memory.
  6. Concept maps made from memory first.
  After each attempt, check the book to find errors and gaps, then retrieve again "a bit later on". — [Learning Scientists blog](https://www.learningscientists.org/blog/2016/6/23-1)
- Kate Jones's *Retrieval Practice* (#269) carries the same idea into UK classrooms as brain dumps, retrieval grids and low-stakes quizzes. — [P2]

**V6. Concealment on paper: Japan's red sheet, the Cornell cue column and SQ3R's recite step.**
- Red sheet (暗記ペン / 赤シート, #426): write key terms in orange or pink ink, and a red plastic sheet hides them for self-testing. P1 rates it very cheap and ubiquitous. — [P1 row 426]
- The sheet and ink colours are matched: Zebra's チェックペン comes in pink (hidden by the red sheet) and green (hidden by a green sheet). Japanese apps such as i-暗記シート now copy the red-sheet effect digitally on photos. — [rank-king.jp](https://rank-king.jp/article/14414); [App Store JP, i-暗記シート](https://apps.apple.com/jp/app/id803026043)
- Cornell notes #333 (cover the notes and answer the cue column) and SQ3R #330 ("Recite") are the same move built into a note-taking method. — [P2]

**V7. Classroom quiz games (live, teacher-run, usually multiple choice).**
- Kahoot! #438: live multiple-choice games with speed points and public leaderboards.
- Wayground (formerly Quizizz) #437.
- Blooket #439: arcade-style.
- Gimkit #440: in-game money for right answers; missed questions come back.
- Socrative #490 and Plickers #491: exit tickets; Plickers students hold up printed cards for the teacher's phone to scan.
- Edpuzzle #492: questions inserted at points in videos.
— [P1 rows](../../reports/Exam%20success%20tools%20and%20methods.md); [P2]

**V8. Adaptive study modes inside flashcard sites.**
- Quizlet Learn builds a "personalized study path" from goals and familiarity. Question types (written, matching, multiple choice, true/false) can be chosen, and third-party guides say it moves from easier formats towards written answers. — [Quizlet Help](https://help.quizlet.com/hc/articles/360030986971); [Purdue Online Teaching Hub](https://onlineteachinghub.education.purdue.edu/quizlet)
- A session ends when every term is answered correctly twice. — [Purdue Online Teaching Hub](https://onlineteachinghub.education.purdue.edu/quizlet)

**V9. AI-generated questions and cards (the material is made by AI).**
- Revisely #27, Wisdolia #28 (browser extension), Jungle AI #29 (MCQs from slides, PDFs and video)
- Knowt #22, Vaia #21, Gizmo #23, Retain #26
- Neural Consult #79 (AI-written USMLE questions)
— [P2]
- P2 counted 11 entries in the "AI material + retrieval + spacing" bundle: the AI writes the cards, and the app quizzes and schedules them. — [P2 Bundles]

**V10. Pretesting and generation.**
- Pretesting #308: attempt questions before studying, then get corrective feedback.
- Generation #309: fill blanks or produce answers instead of reading them.
— [P2]
- Orbit/Quantum Country #15 embeds review prompts inside essays as you read. P1 records 112 prompts. — [P1 row 15](https://notes.andymatuschak.org/zP8MVDmomB7UrTddVY34E1B)

**V11. Teach-back aloud.** This appears in the catalogue as the Feynman technique and under GRP (teaching others), not as a RET primary. — [P1 intro, "flavours" paragraph]

**Costs to the learner, where known.**
- Red sheet: very cheap. — [P1]
- Blank-page methods: free. — [Learning Scientists](https://www.learningscientists.org/blog/2016/6/23-1)
- Kahoot!, Gimkit and Baicizhan: freemium. — [P1]
- MCQ banks: subscription or course prices. P1 did not confirm most of them.
- Anki: free on desktop; P1 lists the iOS price as unconfirmed. — [P1 "Unverified facts"]

### Inferences
- The key design choices for each variant are summarised below. The cells are our synthesis of the cited descriptions.

| Variant | Recall or recognition | Who makes it | Feedback | Unit |
|---|---|---|---|---|
| Blank page / blurting | Free recall | Learner | Delayed, self-checked against notes | Whole topic |
| Red sheet | Cued recall | Learner (marks the textbook) | Immediate (lift the sheet) | Key term |
| Flashcards | Cued recall, self-graded | Learner, community or AI | Immediate | Fact or cloze |
| Question bank | Mostly recognition (MCQ) | Publisher or coach | Immediate, with explanation | Exam-style question |
| Drill book | Mixed | Publisher | End of set (answer key) | Question |
| Quiz game | Recognition, timed | Teacher | Immediate, public | MCQ |
| AI generator | Recall or recognition | AI | Immediate | Fact |

- Exam-specific banks (UWorld, Marrow, YaadAI) tie questions to an exam's format, so retrieval doubles as exam rehearsal (TST). Generic flashcards do not.
- Self-grading (Anki buttons, Brainscape confidence) puts the learner in charge of judging success. Every self-graded design shares the same weakness: the schedule is only as accurate as the self-report.

### Gaps
- I found no vendor documentation on how UWorld, Marrow or Testbook choose which questions to re-show; these are treated as unpublished.
- No primary source was checked for Korean 백지복습 practice details, beyond P2's naming.
- Current Anki image-occlusion details (built in since some version) were not verified this session.
- Prices for most question banks are unconfirmed (P1).

## Q2. What are the distinct implementation variants of SPA (spacing), with their parameters?

### Takeaway
Spacing is built in six main ways:
1. Fixed calendar rules (1-3-7-21, 2-3-5-7).
2. Physical boxes (Leitner).
3. Per-card ease formulas (SM-2 and Anki's variant).
4. Fitted memory models with a target retention (FSRS, HLR, SSP-MMC, SM-17/18).
5. Exam-date-aware overlays (RemNote Exam Scheduler, Retain, SATHEE).
6. Human revision cycles (successive relearning; UPSC "revise each book 3–5 times").

A light-touch seventh, Readwise, resurfaces highlights for re-reading rather than recall.

### Cited Findings

**S1. Fixed calendar rules.**
- 2-3-5-7: reviews on days 2, 3, 5 and 7 after first learning, or counted back from the exam. It is UK school guidance with no inventor found. — [P1 #328, BCU](https://bcu.ac.uk/exams-and-revision/best-ways-to-revise/spaced-repetition)
- 1-3-7-21: reviews after 1, 3, 7 and 21 days. It circulates among Indian aspirants; its origin was not found. — [P1 #329]
- A worked 30-day example from Save My Exams schedules reviews on days 1, 7, 16 and 25, with a final review 5 days before the exam. — [Save My Exams](https://savemyexams.com/learning-hub/revision-tips/create-a-spaced-repetition-schedule-to-boost-memory)
- SATHEE (Ministry of Education with IIT Kanpur) publishes a fixed ladder: 1 day, 3 days, 1 week, 2 weeks, 1 month, 3 months.
  - After that, intervals depend on how hard the learner rates the item: Easy up to 6 months, Medium 1–3 months, Hard 1–4 weeks. Wrong answers get an immediate re-review.
  - Inputs include the target exam and date, response time and self-rated confidence.
  - It claims "300% better long-term retention" without a source. — [SATHEE revision scheduler](https://sathee.iitk.ac.in/pyqs/bookmarking/revision-scheduler)

**S2. Leitner box (#317).**
- Leitner's original design (*So lernt man lernen*, 1972; some sources say 1973) used five compartments of increasing depth (1, 2, 5, 8 and 14 cm). The depth, not a calendar, set how often each box was reviewed: you reviewed cards when a compartment filled up. A right answer moves a card forward; a wrong one sends it back to box 1. — [Wikipedia, Leitner system](https://en.wikipedia.org/wiki/Leitner_system); [Brainscape Academy](https://www.brainscape.com/academy/leitner-method/)
- Modern versions swap the depths for fixed time intervals and often use five or six boxes. — [Brainscape Academy](https://www.brainscape.com/academy/leitner-method/)
- Duolingo's first version used Leitner. — [Duolingo blog](https://blog.duolingo.com/how-we-learn-how-you-learn)
- P2 notes a long tail of about 30 small apps on FSRS or Leitner (#44). — [P2]

**S3. SM-2 and Anki's legacy SM-2 variant (#318).**
- Original SM-2 uses fixed first intervals of 1 day, then 6 days. — [Anki FAQ](https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm)
- Anki instead uses configurable learning steps; the manual's examples use `1m 10m 1d`. — [Anki manual](https://docs.ankiweb.net/deck-options.html)
- Anki defaults:
  - Starting ease 2.50 (250%).
  - Easy bonus 1.30.
  - Hard interval 1.20.
  - Interval modifier 1.00.
  - New interval after a lapse: 0.00, so the interval resets.
  - Minimum interval 1 day.
  - Maximum interval 100 years.
  — [Anki manual](https://docs.ankiweb.net/deck-options.html)
- How ease changes on review cards:
  - Again: ease −20 points.
  - Hard: ease −15 points; interval × 1.2.
  - Good: interval × ease.
  - Easy: interval × ease × easy bonus; ease +15 points.
  - Ease never drops below 130%.
  - "In Anki, the initial acquisition process does not influence a card's ease."
  — [Anki FAQ](https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm)
- Leeches: by default a card that lapses 8 times is tagged a leech and suspended. Further warnings come every 4 lapses after that. The action can be set to tag-only instead. — [Anki manual, Leeches](https://docs.ankiweb.net/manual/leeches)
- Mnemosyne #4 and many small apps also use modified SM-2. — [P1 rows 4, 318]

**S4. Fitted memory models with a target retention.**
- FSRS (#320) tracks three numbers per card:
  - Difficulty.
  - Stability: days for recall to fall from 100% to 90%.
  - Retrievability: the current recall probability.
  — [ABC of FSRS](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS)
- The learner sets only one number, the desired retention:
  - Default 90%. — [Anki manual](https://docs.ankiweb.net/deck-options.html)
  - "Values between 70% and 97% are considered reasonable." — [ABC of FSRS](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS)
  - Anki warns that workload rises steeply above 90% and advises staying below 97%. — [Anki manual](https://docs.ankiweb.net/deck-options.html)
- FSRS-6 has 21 parameters, fitted to the user's own review history by machine learning. Users with too few reviews get defaults trained on "several hundred million reviews from ~10k users". — [ABC of FSRS](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS)
- The project's own simulation claims 20–30% fewer reviews than SM-2 for the same retention, and better handling of long breaks. — [ABC of FSRS](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS) (self-reported by the project)
- Anki added FSRS as a second scheduler in version 23.10. — [Anki FAQ](https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm)
- FSRS carriers: RemNote, Logseq, SiYuan, Rember, Avorio, StudyDaily, Markji (MMX variant), Chessbook (chess openings), LeetFlash (coding problems), and spacedrep (#43, driven by AI agents). — [P2]
- Half-Life Regression (Duolingo, #321): the predicted half-life is h = 2^(Θ·x) from practice features, and recall p = 2^(−Δ/h).
  - Trained on 13 million learning traces; code and data are public.
  - Duolingo says its error is nearly half that of the Leitner system it replaced.
  - A press interview quotes "a 12% boost in user engagement".
  — [Settles & Meeder, ACL 2016](https://preview.aclanthology.org/landing_page/P16-1174); [Duolingo blog](https://blog.duolingo.com/how-we-learn-how-you-learn); [VentureBeat](https://venturebeat.com/ai/how-duolingo-is-using-ai-to-humanize-virtual-language-lessons)
- SSP-MMC (MaiMemo, #324) uses optimal control to keep review cost lowest for a target retention. FSRS grew out of this work, and the FSRS wiki notes that MaiMemo employs core contributor Jarrett Ye. — [P1 rows 40, 324](https://github.com/open-spaced-repetition/fsrs4anki)

**S5. Exam-date-aware compression.**
- RemNote's Exam Scheduler is an overlay on SM-2 or FSRS, not a replacement. It has five parts:
  1. A learning period: a new card repeats until recalled twice.
  2. "Ensure Mastery": a missed card needs two successful recalls in a row.
  3. A final review of every card just before the exam.
  4. A Catch Up period that proposes "a temporary increase to your daily goal" instead of silently rearranging cards.
  5. A computed Exam Daily Goal.
  — [RemNote Help](https://help.remnote.com/en/articles/9102040-understanding-the-exam-scheduler)
- Retain schedules against the exam date with an unpublished algorithm it says draws on "220 million learning records". — [P1 Retain profile](https://www.retain.cards/)
- Vaia, Gizmo, Quizlet Learn and Brainscape's Confidence-Based Repetition (#325) also use unpublished vendor rules. — [P2]
- Backward planning from the exam date (#343) does the same by hand. — [P2]

**S6. Successive relearning and human revision cycles.**
- Successive relearning (#301), the research version:
  - Recall each item to a criterion, often three correct recalls, then relearn it in about three widely spaced sessions.
  - Rawson et al. (2018) found one correct recall in each of three spaced sessions beat three correct recalls in one session; the 2022 review reports 68% against 26% retention.
  - The benefit of a higher first-session criterion faded after three relearning sessions.
  — [Rawson & Dunlosky 2022, Current Directions](https://journals.sagepub.com/doi/full/10.1177/09637214221100484); [RetrievalPractice.org](https://www.retrievalpractice.org/archive/2018/successive-relearning)
- UPSC coaching version (#340): revise each subject 3–5 times from a few standard books. — [Legacy IAS via P1](https://www.legacyias.com/?p=174404)
- Single standard books revised repeatedly carry it, for example Spectrum #218 and Singhania #222. — [P2]

**S7. Resurfacing for re-reading, not recall.**
- Readwise #14 resurfaces collected highlights daily on a light spaced schedule. P2 codes it SPA + BAS because there is no recall step. Price: 30-day trial, then about $5.59–12.99 a month. — [P1 row 14](https://www.Readwise.io/pricing); [P2]
- Foliole #16 and SuperMemo's incremental reading schedule chunks of long texts. — [P2]

### Inferences
- The design choices that vary across spacing tools:
  - Who sets the interval: a fixed rule, the learner's own grade, a fitted model, or a coach.
  - Whether there is a retention target (FSRS, SSP-MMC) or a growth multiplier (SM-2).
  - Whether a deadline exists (RemNote, Retain, SATHEE, 2-3-5-7 counted back from the exam).
  - Daily caps on new cards and reviews (Anki exposes both).
  - Lapse handling: reset, partial reset, leech suspension, or "two in a row".
- The open FSRS formula has made scheduling something any app can add. Differentiation has moved to content (chess, code, UPSC questions) and to who writes the cards (AI).

### Gaps
- The Anki manual page fetched gives no defaults for new cards/day, maximum reviews/day, graduating interval or easy interval. They are probably 20, 200, 1 day and 4 days, but I did not verify this, so they should not be quoted.
- No minimum review count for FSRS personal optimisation was found on the wiki page.
- Retain, Vaia, Quizlet and Brainscape scheduling rules are unpublished.
- The 1-3-7-21 origin is still unknown.

## Q3. What are the distinct implementation variants of MNE (memory techniques)?

### Takeaway
Memory techniques reach learners mainly through books and memory-sport courses, plus a few vocabulary apps. The variants are:
- Spatial: the method of loci or journey.
- Number codes: major, Dominic, PAO.
- Pegs and story links.
- Verbal shortcuts: acronyms and acrostics.
- The keyword method for foreign words.
- Picture-word pairing apps (Baicizhan, Memrise).
- Root-word systems (*Word Power Made Easy*).

Setup cost is the main design parameter. Number systems need a 00–99 image list built in advance; acronyms need none.

### Cited Findings
- **Method of loci, memory palace or journey (#344):**
  - How it works: place vivid images along a familiar route, then walk it mentally to recall them. — [P2]
  - How-to books: Foer, *Moonwalking with Einstein* #272; O'Brien #470 and #471 (weekly journey-method exercises); Dellis, *Remember It!* #472; Horsley, *Unlimited Memory* #280. — [P2]
  - Background: Yates, *The Art of Memory* #474 (history). — [P2]
- **Major system (#345):**
  - Digits become consonant sounds, then words, then images. — [P2]
  - It is based on sound, not spelling, and extends from 00–99 to 00–999. — [Art of Memory forum](https://forum.artofmemory.com/t/do-you-use-major-or-dominic-system/31530) (practitioner forum)
- **Dominic system:**
  - Built by eight-time World Memory Champion Dominic O'Brien for competition.
  - Digits map to letters (0=O, 1=A, 2=B…), and the letter pairs become initials of people. — [Art of Memory forum](https://forum.artofmemory.com/t/confusion-between-pao-dominic-and-major/53957)
- **PAO (#347):**
  - Each number becomes a person-action-object image.
  - PAO is a way of placing images that sits on top of either the major or the Dominic code.
  - Practitioners disagree on which to learn first, and pre-made major-based PAO lists are scarce. — [Art of Memory forum](https://forum.artofmemory.com/t/confusion-between-pao-dominic-and-major/53957); [Magnetic Memory Method](https://magneticmemorymethod.com/pao-system) (course vendor)
- **Peg (#346) and link or story (#350):** attach items to pre-learned numbered pegs, or join list items into one vivid story. Lorayne and Lucas, *The Memory Book* #281. — [P2]
- **Acronyms and acrostics (#349):** first letters form a word or sentence as a recall cue. Chunking (#348) groups items into units. — [P2]
- **Keyword method (#312), Atkinson and Raugh:** two steps.
  1. Acoustic link: the foreign word is paired with a sound-alike English keyword.
  2. Imagery link: the keyword is linked to the English meaning by a mental image.
  - First used in a computer-run supplement to Stanford's second-year Russian course.
  - Secondary citations give 72% against 46% correct on the key test. — [Atkinson & Raugh 1974 report (DTIC)](https://apps.dtic.mil/sti/pdfs/AD0787843.pdf); [Stanford IMSSS report](https://suppescorpus.stanford.edu/sites/g/files/sbiybj32751/files/media/file/imsss_224.pdf)
  - SuperMemo's rules recommend mnemonics mainly for the small share of hard items. — [SuperMemo 20 rules](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge)
- **Baicizhan 百词斩 (#398, China):**
  - Freemium; used for CET-4/6, Gaokao and 考研 English. — [P1 row 398](https://www.baicizhan.com)
  - Each word is matched to a picture. The learner infers the meaning from a key word in an example sentence, then taps the matching image. — [Bilibili user guide](https://www.bilibili.com/opus/874234515752484921)
  - The App Store lists picture, rhyme and "deep" modes. — [App Store](https://apps.apple.com/us/app/-/id557545298)
  - Product analyses describe it as context memory with picture example sentences and pictographic hints. "Chopping" (斩) a word gives a sense of achievement. — [Woshipm analysis](https://www.woshipm.com/evaluating/1373089.html); [Woshipm analysis](https://www.woshipm.com/evaluating/4110348.html)
- **Memrise #24:** vocabulary on spaced review with mnemonics and native-speaker videos. P1 notes it has moved away from user-made courses. — [P1 row 24]
- **Word roots:** Norman Lewis, *Word Power Made Easy* #229 (1949) teaches vocabulary through Latin and Greek roots, with built-in self-tests. — [P2]
- **Ageing:** McDaniel and Einstein, *Memory Fitness* #248, apply memory strategies to healthy ageing. — [P2]
- **Commercial "quick fix" packaging:** Kwik Learning #293 and photographic-memory training #390 sell memory techniques. P2 codes them QFX, not MNE. — [P2]

### Inferences
- Setup cost by variant:
  - Acronyms and keywords: made per item; minutes.
  - Loci: needs one or more well-known routes; low.
  - Peg: a learned list of about 10–20 items.
  - Major, Dominic and PAO: a 100-image (or 1,000-image) code learned in advance; high. Payoff comes mainly for numbers, which matter in exams for dates and statistics.
- Who makes the material:
  - Books teach the learner to make their own images.
  - Baicizhan and Memrise supply pre-made images.
  - A pre-made image removes setup cost, but also removes the learner's own elaboration. That is a design trade-off, not a verdict on effectiveness.

### Gaps
- I found no authoritative source on how Baicizhan schedules reviews or decides that a word is "chopped".
- No sources were checked on how coaching institutes in India teach mnemonics (for example, UPSC acronym lists). P2 has no such entry.
- No current memory-sport rules or records were checked.

## Q4. What are the common pitfalls in implementations?

### Takeaway
The recurring pitfalls are:
- Recognising instead of recalling.
- Peeking or checking too soon.
- Review pile-ups and load spirals.
- Low-ease loops in SM-2 (the term "ease hell").
- Leeches.
- Over-large or list-like cards.
- Memorising what isn't understood.
- Gamified pressure (speed points, leaderboards, streaks).
- Over-trusting self-ratings or unpublished vendor claims.

### Cited Findings
- **Peeking, and retrieving before forgetting.** Flashcards only work if you truly try to recall first. "You need to forget the information at least a little in order for retrieval to be effective." — [Learning Scientists](https://www.learningscientists.org/blog/2016/6/23-1)
- **Recognition illusion in picture apps.** Analyses of Baicizhan say:
  - It works like a word-guessing game, which can create the false feeling that a word is already learned.
  - Users may remember the picture but not the meaning.
  - A user guide advises the picture mode for first exposure only, and the "deep" mode for review.
  — [Woshipm](https://www.woshipm.com/evaluating/1373089.html); [Woshipm](https://www.woshipm.com/evaluating/4110348.html); [Bilibili](https://www.bilibili.com/opus/874234515752484921)
- **Memorising without understanding.** SuperMemo's rules 1 and 2 are "do not learn if you do not understand" and "learn before you memorise". — [SuperMemo](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge)
- **Rote volume.** China's question-sea tactic is criticised as rote. — [P1 row 400]
- **Card design.**
  - Sets and enumerations are hard to recall, and similar items interfere with each other. — [SuperMemo](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge)
  - Anki suspends cards after 8 lapses (leeches). Some users lower the threshold to about 4 and use tag-only mode to find problem cards sooner. — [Anki manual, Leeches](https://docs.ankiweb.net/manual/leeches); [Better Anki Usage Guide](https://andrewzah.com/p/anki-usage-guide)
- **Low ease and low intervals in SM-2.**
  - Anki's FAQ describes a complaint that repeated failures trap cards in "low interval hell". Anki softens it by not lowering ease during learning, and SM-2 floors ease at 130%. — [Anki FAQ](https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm)
  - "Ease hell" itself is community vocabulary; the Anki FAQ did not use the term.
  - FSRS avoids the ease multiplier entirely, and the project claims it handles long breaks better. — [ABC of FSRS](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS)
- **Load spirals.**
  - Anki warns that FSRS workload rises steeply above 90% retention and can become overwhelming above 97%. — [Anki manual](https://docs.ankiweb.net/deck-options.html)
  - RemNote's Catch Up period exists because learners fall behind. It proposes a temporary higher daily goal instead of silently rearranging cards. — [RemNote Help](https://help.remnote.com/en/articles/9102040-understanding-the-exam-scheduler)
- **Copying schedules.** One vendor guide says most people fail with spacing because they copy someone else's intervals without regard to their own exam date and workload. — [iatroX academy](https://iatrox.com/academy/study/spacing-backwards-from-exam-day) (vendor source)
- **Self-rating dependence.** Confidence-based scheduling is only as good as honest ratings. — [Nibble blog](https://nibble-app.com/blog/brainscape) (competitor source)
- **Gamified pressure.**
  - Kahoot! uses speed points and public leaderboards. — [P1 row 438]
  - Duolingo uses streaks, points and leagues to drive daily practice; P2 codes its primary as HAB, with SPA secondary. — [P2 #25]
  - The same HLR model's reported production effect was framed as an "engagement" gain. — [VentureBeat](https://venturebeat.com/ai/how-duolingo-is-using-ai-to-humanize-virtual-language-lessons)
- **Unverified vendor claims.**
  - SATHEE claims "300% better long-term retention" and "85% improvement in exam performance" without method. — [SATHEE](https://sathee.iitk.ac.in/pyqs/bookmarking/revision-scheduler)
  - Retain claims a 20% time saving over Anki. — [P1](https://www.retain.cards/)
  - Brainscape claims "twice as efficient". — [Wikipedia](https://en.wikipedia.org/wiki/Brainscape)
  - All are self-reported.
- **Re-reading mistaken for retrieval.** Readwise resurfaces highlights to re-read with no recall step, which is why P2 coded it BAS secondary. — [P2 #14]

### Inferences
- For an exam-prep product, the pitfalls map onto design levers:
  - Recall-first formats (typed answers, blank page) rather than recognition only.
  - A delay before retrieval.
  - Visible caps on daily load.
  - Leech handling that sends the learner back to understanding, not more repetition.
  - No public speed scores.

### Gaps
- No quantitative source was found on how often learners abandon spaced-repetition apps because of review pile-ups. This is widely discussed but was not verified here.

## Q5. How does the same idea differ across product types and regions?

### Takeaway
- Apps carry spacing; question banks and books carry retrieval; books and memory-sport courses carry mnemonics.
- Regional forms are mostly low-tech retrieval and volume habits:
  - Japan: the red sheet.
  - China: 刷题 and topic-sorted gaokao books.
  - India: PYQ and NCERT MCQ books, UPSC "3–5 revisions".
  - UK: blurting and 2-3-5-7.
  - Korea: 백지복습.
- The algorithm layer is global and increasingly shared. FSRS, with Chinese roots in MaiMemo, now runs in apps worldwide.

### Cited Findings
- **Counts.**
  - RET is the most common idea in the catalogue: 40 primary, 176 any.
  - SPA is 43 primary, 91 any, and is "the biggest app cluster", with more than half of its entries apps.
  - MNE (19 primary) is "almost entirely books… only two apps".
  — [P2 Family 1](../../reports/Exam%20success%20central%20ideas.md)
- **Regional forms.**
  - Japan: red sheet #426.
  - China: 刷题 #400, 5·3 #401, Tianli 38 Sets #402, Baicizhan #398, MaiMemo #40, Markji #39.
  - UK: blurting #327, 2-3-5-7 #328, Seneca #66, Kate Jones #269.
  - India: 1-3-7-21 #329, multiple revision cycles #340, Oswaal #521, MTG #522, QuizCherry #457 (bilingual daily current-affairs quizzes with spaced revision), SATHEE (government; 12 languages per P2's access lens).
  - Korea: 백지복습 (named in P2).
  — [P2]
- **Coaching and classroom forms.**
  - UPSC coaching tells students to revise each standard book 3–5 times. — [Legacy IAS via P1](https://www.legacyias.com/?p=174404)
  - Classroom tools (Kahoot!, Socrative, Plickers) make retrieval a teacher-run, group and timed activity. — [P2]
- **Places.** No catalogue entry turns RET, SPA or MNE into a place. The memory palace is an imagined place. — [P2]

### Inferences
- Apps automate scheduling and grading but push card-making onto the learner, a community deck (AnKing) or AI.
- Books ship pre-made questions but leave the timing to the learner.
- Coaching supplies the calendar (revision cycles, test series) and the questions.
- Low-cost offline forms (red sheet, blank page, Leitner box, coaching revision cycles) dominate exam cultures where paid apps are less used. App-based spacing is strongest in medicine (AnKing, AMBOSS) and language vocabulary (MaiMemo, Baicizhan, Duolingo).

### Gaps
- No usage-share data by region was found, so the regional emphasis above comes from the catalogue's mix, not from measured adoption.
- No Korean or Japanese app-specific spacing products were checked this session.
