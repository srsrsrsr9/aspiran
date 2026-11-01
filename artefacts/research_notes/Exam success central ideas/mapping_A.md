# Mapping A: catalogue rows 1–135 (catalogue lines 49–287)

Scope: flashcard and spaced-repetition apps; AI tutors and practice platforms; focus, planning, note-taking and co-study tools.
Coded against `taxonomy_v0.md`. Neutral test-prep view. Codes describe what each product is built around, from its catalogue description only; nothing here says whether it works.

Proposed codes used below (not in v0, marked with `+`; see list 1):
- **+GEN**: AI makes the study material (cards, quizzes, notes, summaries) from the learner's own files or on request.
- **+INT**: integrity and anti-offloading guardrails (process records, authorship logs, recall checks against copying).

Tie-break rule for primary: when a row lists several ideas, the primary is the first idea named in its "Core idea" column, unless the "What it does" text clearly centres on another.

| # | Name | Type | Primary | Secondary | How it applies the idea |
|---|---|---|---|---|---|
| 1 | Anki (AnkiWeb, AnkiDroid, AnkiMobile) | app | S | R, G | Self-made or shared decks; SM-2 or FSRS schedules each card's next review |
| 2 | AnKing deck | course (shared deck) | C | S, R, G | Community-vetted medical deck mapped to exam syllabus, reviewed in Anki |
| 3 | SuperMemo | app | S | R, N | SM-family algorithm schedules cards; incremental reading slices texts into cards |
| 4 | Mnemosyne | app | S | R | Modified SM-2 schedules simple cards; review data shared for research |
| 5 | Mochi Cards | app | S | R, N | Markdown notes become cards; optional FSRS schedules reviews |
| 6 | AnkiApp | app | S | R | Flashcards with its own unpublished review scheduler |
| 7 | Noji (formerly Anki Pro) | app | S | R, +GEN | SRS flashcards; AI drafts cards for the user |
| 8 | RemNote | app | N | S, R, +GEN | Notes and PDF highlights turn into cards scheduled with FSRS-4.5 |
| 9 | Logseq | app | N | S, R | Outliner journal with backlinks; marked blocks become FSRS cards |
| 10 | SiYuan (riff cards) | app | N | S, R | Notes app; selected text becomes FSRS-5 cards |
| 11 | Org-fc and Org-srs | app | S | R, N | FSRS review queue built inside Emacs Org-mode notes |
| 12 | TiddlyWiki FSRS plugin | app | S | R, N | Plugin adds FSRS review of wiki entries |
| 13 | Traverse | app | N | U, R, S | Mind-map notes with cloze cards, reviewed on a spaced schedule |
| 14 | Readwise (with Reader) | app | S | N | Collected highlights resurface daily on a light spaced schedule (re-reading, not recall) |
| 15 | Orbit and Quantum Country | website | S | R, C | Review prompts embedded in essays, re-asked at growing intervals |
| 16 | Foliole | app | S | N, C | Long texts read in small chunks scheduled with FSRS (incremental reading) |
| 17 | ZKMemo | app | N | S, R | Zettelkasten notes double as FSRS-6 cards |
| 18 | Quizlet | website | R | A, G | Shared card sets; Learn and Test modes quiz and adapt rounds |
| 19 | Brainscape | website | S | R, P | Learner rates confidence 1–5; low-confidence cards return sooner |
| 20 | Cram.com | website | R | G | Shared flashcard library for self-testing |
| 21 | Vaia (StudySmarter) | app | ? (+GEN) | S, R, P | AI makes cards from uploads; SRS plus exam study plans |
| 22 | Knowt | website | R | S, +GEN | Quizlet-style self-testing; imports sets; AI turns notes into cards |
| 23 | Gizmo | app | ? (+GEN) | S, R, H | AI turns notes or links into cards, adaptive quizzes and games |
| 24 | Memrise | app | S | M, C | Vocabulary on spaced review; native-speaker videos and mnemonics |
| 25 | Duolingo | app | H | S, A | Streaks, points and leagues drive daily practice; HLR schedules review |
| 26 | Retain (retain.cards) | app | ? (+GEN) | S, P, R | AI drafts cards from uploads; own schedule targets the exam date |
| 27 | Revisely | website | ? (+GEN) | R | AI makes flashcards and quizzes from documents |
| 28 | Wisdolia | app | ? (+GEN) | R | Browser extension makes cards from any web page or PDF |
| 29 | Jungle AI | website | ? (+GEN) | R | AI writes multiple-choice questions and cards from slides, PDFs, video |
| 30 | StudyCards AI | website | ? (+GEN) | R, S | AI turns PDFs and lecture notes into cards; exports to Anki |
| 31 | Scholarly | website | ? (+GEN) | N, R | AI writes notes and flashcards from material |
| 32 | Mindomax | website | ? (+GEN) | S, R | AI flashcards with spaced review |
| 33 | YouLearn | website | ? (+GEN) | A, R | AI tutor makes cards and quizzes from content |
| 34 | Nibble | app | S | R | Flashcard app with spaced review |
| 35 | Acemate | website | ? (+GEN) | R | AI builds study material from the learner's lecture script |
| 36 | Rember | app | S | +GEN, R | AI helps write cards; FSRS-5 schedules them |
| 37 | Avorio | app | S | +GEN, R | AI-made cards reviewed on FSRS-5 or SM-2 |
| 38 | StudyDaily | app | S | R | Flashcards scheduled with FSRS-6 |
| 39 | Markji | app | S | R | Flashcards scheduled with MMX, an FSRS variant |
| 40 | MaiMemo | app | S | R | Vocabulary cards on an optimal-control (SSP-MMC) review schedule |
| 41 | Chessbook | app | S | R | Chess openings drilled on FSRS-4.5 schedule |
| 42 | LeetFlash | app | S | R | Coding-interview problems re-queued on a ts-fsrs schedule |
| 43 | spacedrep | app | S | R | FSRS review engine that AI agents can drive via MCP |
| 44 | Long tail of small FSRS apps (about 30) | app | S | R | Mostly vocabulary cards on FSRS or Leitner boxes |
| 45 | SpacedRevision: UPSC & Exams | app | S | R, P | Past-question cards and MCQs on spaced review, with analytics |
| 46 | Revprep (StudyBuddy) | app | ? (+GEN) | S, R | AI makes cards from notes and PDFs; spaced review for Indian exams |
| 47 | YaadAI | app | S | C, R | Curated Prelims questions re-asked on a spaced schedule |
| 48 | UPSC Prep (upscprep.duckdns.org) | website | S | X, F, R | Missed questions enter an SM-2 queue; mocks use negative marking |
| 49 | ChatGPT Study Mode | app | U | A | Chatbot asks guiding questions instead of giving answers |
| 50 | Gemini Guided Learning | app | U | A, C | Step-by-step scaffolded explanations on a learning-tuned model |
| 51 | Claude Learning Mode | app | U | A | Chatbot guides by questions rather than handing over answers |
| 52 | NotebookLM | app | ? (+GEN) | R, F, C | Answers, quizzes and audio overviews built only from uploaded sources; explains wrong answers |
| 53 | Khanmigo | app | U | A, F, +INT | AI tutor prompts reasoning and refuses to give answers |
| 54 | StudyFetch (Spark.E) | website | ? (+GEN) | R, A | Course files become notes, quizzes, cards; tutor answers from them |
| 55 | Turbo AI | app | ? (+GEN) | N, R | Lectures and documents become notes, quizzes and cards |
| 56 | Mindgrasp | website | ? (+GEN) | C, R | AI summaries and quizzes from documents and videos |
| 57 | Coconote | app | ? (+GEN) | N | Recorded lectures automatically become notes |
| 58 | Socratic by Google | app | O | U | Photo of a problem returns a worked explanation (now in Lens) |
| 59 | Squirrel AI (Yixue) | programme | A | R | Diagnoses gaps across fine-grained knowledge points; teaches to mastery |
| 60 | Photomath | app | O | U | Photo of a maths problem returns step-by-step solution |
| 61 | Gauth | app | O | — | Photo of a problem returns the answer |
| 62 | Brainly | website | O | G | Peers and AI answer posted homework questions |
| 63 | Chegg | website | O | C | Expert answers and textbook solutions on demand |
| 64 | ALEKS | website | A | S, R | Maps knowledge state, teaches ready-next topics, re-checks retention |
| 65 | Khan Academy | website | A | C, R | Mastery-based practice with video lessons; official free SAT practice |
| 66 | Seneca Learning | website | R | S, I, C | Short revision lessons that quiz, mix topics and return later |
| 67 | Sparx Maths | website | A | R, +INT | Personalised homework; "bookwork checks" make students recall their written answers |
| 68 | Save My Exams | website | R | X, C, F | Topic questions and past papers with notes; AI marks answers |
| 69 | Brilliant | website | U | R | Interactive problems teach concepts by doing |
| 70 | Up Learn | course | A | C, R | Structured A-level video courses with mastery practice; grade guarantee |
| 71 | Physics & Maths Tutor | website | R | X, F | Free past papers and topic questions with mark schemes |
| 72 | IXL | website | A | R, H | SmartScore raises or lowers difficulty as students answer |
| 73 | DeltaMath | website | A | R | Teacher-assigned maths practice that adapts problems |
| 74 | UWorld | website | R | F, X | Exam-realistic questions each with a long explanation; AI helper |
| 75 | AMBOSS | website | R | C, F | Question bank linked to a reference library; AI copilot links to Anki |
| 76 | Lecturio | course | C | R, U | Medical lectures plus questions and a Socratic AI tutor |
| 77 | Osmosis (Elsevier) | course | C | U, R | Medical explainer videos plus conversational AI companion |
| 78 | iatroX | website | A | R, F | AI tutoring with practice questions for medical exams |
| 79 | Neural Consult | website | R | +GEN, A | AI-written practice questions and tutoring for USMLE |
| 80 | Magoosh | course | R | C, F | Question practice with explanations plus video lessons |
| 81 | Kaplan | course | X | C, F | Full-length mocks plus courses and tutoring |
| 82 | The Princeton Review | course | X | C, F | Full-length mocks plus courses and tutoring |
| 83 | Barbri | course | P | F, C | Day-by-day study plan with graded practice essays |
| 84 | Themis | course | P | F, C | Day-by-day study plan with graded practice essays |
| 85 | Target Test Prep | course | A | R | Adaptive quant course for GMAT and GRE |
| 86 | Official practice tests (Bluebook, GMAT Official) | website | X | R | Full-length adaptive mocks on the real exam software |
| 87 | Zuoyebang | app | O | A | Photo homework answers plus AI tutoring |
| 88 | Yuanfudao | app | A | C, F | Tutoring app for K-12 and gaokao |
| 89 | Turnitin Clarity | website | ? (+INT) | F | Writing space records the writing process; optional AI assistant |
| 90 | Grammarly for Students / Authorship | app | F | +INT | Writing feedback plus a log of typed, pasted or AI text |
| 91 | Writable (HMH) | website | F | +INT | On-demand revision feedback; alerts on authorship |
| 92 | Studiosity | programme | F | G | Experts give feedback on student drafts |
| 93 | Forest | app | T | H | Virtual tree dies if you leave the app; Pomodoro-style sessions |
| 94 | Flora | app | T | H, G | Tree grows during focus; group pledges and habit tracker |
| 95 | Freedom | app | T | P | Scheduled blocks on sites and apps across all devices |
| 96 | Cold Turkey Blocker | app | T | — | Hard-to-undo desktop blocks, including full lockout |
| 97 | one sec | app | T | — | Forces a breathing pause before a chosen app opens |
| 98 | Opal | app | T | P | Scheduled app blocks plus focus reports |
| 99 | Focus To-Do | app | T | P | Pomodoro timer with task list and study-time statistics |
| 100 | Pomofocus | website | T | P | Simple browser Pomodoro timer with tasks |
| 101 | Session | app | T | P | Timed session starts with an intention, ends with a reflection |
| 102 | Be Focused | app | T | P | Focus intervals with breaks and progress tracking |
| 103 | YPT – Yeolpumta | app | G | P, T, H | Logs study hours, locks phone; groups compare daily hours |
| 104 | Brain.fm, Endel, Noisli | app | T | K | Ambient or "functional" audio to mask noise during study |
| 105 | Focusmate | website | G | P, T | Paired with a stranger on video; state goal, report back |
| 106 | StudyStream | website | G | T, E | Moderated live "study with me" rooms |
| 107 | Study Together (Discord) | website | G | H, T | Study on camera in a big server; leaderboards and badges |
| 108 | "Study with me" / gongbang videos | creator | G | T | Hours-long video of someone studying, often in Pomodoro blocks |
| 109 | Flow Club | website | G | P, T | Hosted group focus sessions with goal sharing and music |
| 110 | Caveday | programme | G | T, P | Facilitated group deep-work sprints with a set ritual |
| 111 | MyStudyLife | app | P | T | Timetable, tasks and exam dates as external memory; Pomodoro timer |
| 112 | Shovel | website | P | — | Compares study hours needed against hours available |
| 113 | Structured | app | P | T | Drag-and-drop timeline of the day with a timer |
| 114 | TickTick | app | P | H, T | Tasks, calendar, Eisenhower matrix, habit tracker, Pomodoro |
| 115 | Todoist | app | P | H | Task lists with dates; "karma" points |
| 116 | iStudiez Pro | app | P | — | Class schedule, assignments and grade calculator |
| 117 | Notion (student templates) | app | N | P | Flexible databases for notes, syllabus and revision tracking |
| 118 | Google Calendar and Apple Calendar | app | P | — | Study blocks placed on a calendar |
| 119 | Habitica | app | H | G, P | Habits and to-dos become a role-playing game with parties |
| 120 | Streaks | app | H | — | Daily habits tracked as unbroken streaks |
| 121 | Obsidian (with SRS plugins) | app | N | S, R | Linked Markdown notes; plugins add SM-2 or FSRS cards |
| 122 | Microsoft OneNote | app | N | — | Freeform digital notebooks with inking |
| 123 | GoodNotes | app | N | R | Handwritten notes on PDFs, Cornell templates, flashcards |
| 124 | Notability | app | N | — | Handwritten notes synced to lecture audio |
| 125 | Heptabase | app | N | U | Note cards arranged on spatial whiteboards |
| 126 | MindNode | app | N | U | Mind maps and outlines |
| 127 | XMind | app | N | U | Mind maps, fishbone and timeline diagrams |
| 128 | MindMeister and iMindMap | app | N | U | Online mind maps |
| 129 | Miro | app | N | G, U | Shared whiteboards and concept maps |
| 130 | Scrintal | app | N | U | Linked note cards laid out on a canvas |
| 131 | Roam Research and Zettlr | app | N | — | Networked, linked notes (Zettelkasten) |
| 132 | LiquidText | app | U | N | Pull PDF excerpts onto a workspace and link them while reading |
| 133 | Zotero | app | N | — | Captures citations and PDF notes; builds bibliographies |
| 134 | Finch | app | W | H | Care for a virtual pet by completing self-care goals |
| 135 | Sleep Cycle, BetterSleep, Rise | app | W | P | Smart alarms, sleep logs and soundscapes |

## Primary-code counts (135 rows)

S 26 · N 18 · ?(+GEN) 17 · T 11 · R 10 · A 10 · P 9 · G 7 · U 6 · O 6 · X 3 · F 3 · C 3 · H 3 · W 2 · ?(+INT) 1.
Not used as primary: I, M, E, B, K.

## 1. Ideas that don't fit v0

- **+GEN, AI-made study material** (17 primaries, 6 more as secondary): Vaia, Gizmo, Retain, Revisely, Wisdolia, Jungle AI, StudyCards AI, Scholarly, Mindomax, YouLearn, Acemate, Revprep, NotebookLM, StudyFetch, Turbo AI, Mindgrasp, Coconote; secondary in Noji, RemNote, Knowt, Rember, Avorio, Neural Consult. The output feeds R or N, but the product's selling point is that the learner no longer makes the cards or notes. It is neither C (no expert curates it) nor O (the student still studies). It probably needs its own code because it can remove the "generation effect" of making your own cards. Possible sub-split: "grounded in your own files" (NotebookLM, StudyFetch) vs "generic generation".
- **+INT, integrity and anti-offloading guardrails** (1 primary, 4 secondary): Turnitin Clarity, Grammarly Authorship, Writable, Sparx "bookwork checks", Khanmigo's refusal to give answers. This is the opposite of O: a design that stops the work being offloaded. Links to the catalogue's guardrailed-tutor study.
- **Socratic AI tutoring** (ChatGPT Study Mode, Gemini Guided Learning, Claude Learning Mode, Khanmigo, Lecturio's tutor): coded U plus A, but it sits awkwardly across both. Suggest splitting A into **A1 adaptive diagnosis and sequencing** (ALEKS, Squirrel AI, IXL, Khan) and **A2 conversational tutoring** (chatbot study modes, iatroX, Yuanfudao).
- **Split G** into at least three: **co-presence / body doubling** (Focusmate, StudyStream, study-with-me videos, Flow Club, Caveday); **public comparison and leaderboards** (YPT, Study Together, Duolingo leagues) — different mechanism and different risks (pressure, the "Yawns, Pains, and Tears" piece); **peer-made content and answers** (shared decks in Anki/Quizlet/Cram, AnKing, Brainly). Mentors and expert feedback (Studiosity) might sit better with F.
- **Split P**: planning and scheduling (Shovel, Structured, calendars, Barbri/Themis plans) vs **self-monitoring / time logging** (YPT hour logs, Opal reports, Focus To-Do statistics, Brainscape confidence ratings, Session reflections).
- **Passive re-exposure vs retrieval**: Readwise resurfaces highlights to re-read, not to recall. It is coded S, but S currently implies spaced *retrieval*. Suggest a note or a sub-code "spaced re-reading".
- **Precommitment / friction** (Cold Turkey, Freedom, one sec, Forest): fits T, but "friction before a habit cue" (one sec) and "locked commitment" (Cold Turkey) are distinct mechanisms from Pomodoro timing; consider T1 blocking/friction and T2 time-boxing.
- **Exam-date targeting** (Retain, Vaia exam plans, Shovel): scheduling backwards from the exam date links S and P; may deserve a named bundle rather than a code.
- **Minor, no code needed yet**: reference management (Zotero, put under N); ritual (Caveday); outcome guarantees (Up Learn's money-back guarantee) are a selling device, not a learning idea.
- **R vs X boundary**: past-paper sites (Save My Exams, Physics & Maths Tutor) were coded R with X secondary; full mocks (Kaplan, Princeton Review, Bluebook) were coded X. The scheme should state the cut-off (timed full-length paper = X).

## 2. Same idea, different names

- **FSRS card scheduler under many brands**: Anki (FSRS mode), Mochi, RemNote, Logseq, SiYuan, Org-fc, TiddlyWiki plugin, Foliole, ZKMemo, Rember, Avorio, StudyDaily, Markji (MMX), Chessbook, LeetFlash, spacedrep, Obsidian plugins, the ~30-app long tail. Same algorithm; the only difference is the content domain or host app.
- **Unpublished "adaptive" SRS**: AnkiApp, Brainscape (Confidence-Based Repetition), Quizlet Learn, Vaia, Gizmo, Retain, Duolingo (HLR). Same promise; scheduler not open.
- **Upload-a-file, get cards/quizzes**: Retain, Vaia, Gizmo, Knowt, Revisely, Wisdolia, Jungle AI, StudyCards AI, Scholarly, Mindomax, YouLearn, Acemate, Revprep, Noji. Practically interchangeable.
- **Lecture/document to notes**: Turbo AI, Coconote, Mindgrasp, StudyFetch, Scholarly.
- **Chatbot "study mode"**: ChatGPT Study Mode, Claude Learning Mode, Gemini Guided Learning, Khanmigo; the same Socratic instruction on different models.
- **Photo-to-answer**: Photomath, Gauth, Socratic by Google, Zuoyebang (Chegg and Brainly are the same idea with humans).
- **Adaptive skill practice**: IXL, DeltaMath, ALEKS, Target Test Prep, Sparx, Khan Academy, Squirrel AI.
- **Question bank with long explanations**: UWorld, AMBOSS, Magoosh, Neural Consult, Save My Exams.
- **Full-length mock plus course**: Kaplan, Princeton Review (identical rows), Official practice tests.
- **Bar-prep plan plus graded essays**: Barbri and Themis (identical rows).
- **Pomodoro timer**: Focus To-Do, Pomofocus, Be Focused, Session, and the timers inside TickTick and MyStudyLife.
- **Blocker**: Freedom, Cold Turkey, Opal (one sec is a lighter friction version).
- **Gamified focus tree**: Forest and Flora.
- **Body doubling**: Focusmate (1:1), Flow Club and Caveday (hosted group), StudyStream and Study Together (large rooms), study-with-me videos (one-way).
- **Mind-mapping**: MindNode, XMind, MindMeister/iMindMap, Heptabase, Scrintal, Miro.
- **Networked notes**: Obsidian, Roam/Zettlr, Logseq, ZKMemo, Notion.
- **Streak/game habit trackers**: Streaks, Habitica, Finch, Duolingo.

## 3. Bundles (rough counts across all codes, primary or secondary)

- **S + R** (spaced retrieval of cards): about 45 rows; the backbone of the first section.
- **+GEN + R** (AI makes quiz items): about 22; **+GEN + S + R** about 10.
- **N + S + R** (notes that become scheduled cards): about 10 (RemNote, Logseq, SiYuan, Mochi, ZKMemo, Traverse, Obsidian, SuperMemo, Org-fc, TiddlyWiki).
- **T + P** (focus timer plus tracking/intent): about 12 (Pomodoro apps, blockers with reports, planners with timers).
- **G + T (+P)** (co-study with focus and stated goals): 8 (the body-doubling group plus YPT).
- **R + F (+X)** (question bank or past papers with explanations or mark schemes): about 10.
- **X + C + F** (commercial test-prep course): 2 (Kaplan, Princeton Review); **P + F + C**: 2 (Barbri, Themis).
- **A + R** (adaptive practice): about 11.
- **U + A** (Socratic AI tutor): 5.
- **T + H** (gamified focus): 3 (Forest, Flora, Study Together); **H + P/G** (habit games): 4.
- **N + U** (mind-map and canvas tools): 7.
- **O + U** (answer apps that also show steps): 2 (Photomath, Socratic).
