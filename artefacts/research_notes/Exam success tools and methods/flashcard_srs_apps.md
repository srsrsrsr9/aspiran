# Flashcard, spaced-repetition and memory-retention apps (catalogue, late 2026)

Research date: 1 Nov 2026. Fifteen web searches and fetches. How to read the tags in the tables:
- **[V]**: verified this session from the source linked in the row.
- **[BK]**: background knowledge, not re-verified this session. The URL is the product's official site, given for reference; it was not fetched. Check prices and status before quoting them.

## Key question 1: Catalogue of tools (name, type, URL, platforms, price, what it does, core idea)

### Takeaway
The field splits into four groups:
- Classic algorithm-driven SRS: Anki, SuperMemo, Mnemosyne.
- Consumer study platforms with lighter scheduling: Quizlet, Brainscape, Cram, Vaia/StudySmarter, Knowt, Gizmo.
- AI-first "upload a PDF, get cards" apps: Retain, Revisely, Wisdolia, Noji, StudyCards AI, Revprep. Many of these are new and small.
- Note-taking tools with SRS built in: RemNote, Obsidian and Logseq plugins, Traverse, Orbit.

The open-source FSRS scheduler is now the de facto modern algorithm. Anki, RemNote, Mochi, Logseq and 50+ smaller apps use it.

### Cited findings: catalogue

**A. Classic and power-user SRS**

| # | Name | Type | URL | Platforms | Price | What it does | Core idea | Tag |
|---|---|---|---|---|---|---|---|---|
| 1 | Anki | App (open source) | https://apps.ankiweb.net/ | Win/Mac/Linux, AnkiWeb, AnkiDroid (Android), AnkiMobile (iOS) | Free; iOS app paid | Make-your-own and shared decks, add-on ecosystem | SM-2-derived scheduler, or FSRS as an option (since 23.10); FSRS-6 in 25.07 | FSRS details [V] [FSRS4Anki](https://github.com/open-spaced-repetition/fsrs4anki), [Anki 25.07 release](https://github.com/ankitects/anki/releases/tag/25.07); platforms and price [BK] |
| 2 | AnkiDroid | Android app | https://ankidroid.org/ | Android | Free | Android client for Anki | Same as Anki; 2.22.2 bundles Anki 25.07.4 with FSRS 6.0 | [V] [AnkiDroid changelog](https://ankidroid.org/changelog.html) |
| 3 | SuperMemo | Desktop and web | https://www.supermemo.com/ | Windows (SuperMemo 19), web and mobile (supermemo.com) | Paid | The original SRS (Piotr Wozniak, 1987); incremental reading | SM-x algorithms (SM-2 through SM-18); incremental reading | [BK]; SM-0/2/5/17 are listed in [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 4 | Mnemosyne | Desktop (open source) | https://mnemosyne-proj.org/ | Win/Mac/Linux, Android | Free | Simple SRS, also a research project that collects review data | Modified SM-2 | [BK]; status in 2026 not confirmed |
| 5 | Mochi Cards | App | https://mochi.cards/ | Web, desktop, mobile | Freemium | Markdown cards and notes | SRS with optional FSRS | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 6 | AnkiApp | App (not affiliated with Anki) | https://www.ankiapp.com/ | iOS, Android, desktop | Freemium | Flashcards with its own scheduler | Spaced repetition | [BK]; App Store listing seen in [search](https://apple.co/3kewSCe) |
| 7 | Noji (formerly "Anki Pro") | App (not affiliated with Anki) | https://noji.io/ | iOS, Android, web | Freemium | Flashcards with AI generation | SRS plus AI cards. Renamed from Anki Pro (reportedly 2 June 2025, after trademark pressure) | [V] secondary: [Mindomax](https://www.mindomax.com/anki-pro-vs-anki) |

**B. Note-taking and knowledge tools with SRS**

| # | Name | Type | URL | Platforms | Price | What it does | Core idea | Tag |
|---|---|---|---|---|---|---|---|---|
| 8 | RemNote | App | https://www.remnote.com/ | Web, desktop, mobile | Freemium | Notes that become flashcards; PDF annotation; AI | Notes-to-cards plus FSRS-4.5 | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 9 | Logseq | Outliner (open source) | https://logseq.com/ | Desktop, mobile | Free | Notes with built-in cards | FSRS (cljc-fsrs) in the database version | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 10 | Obsidian SR plugins (obsidian-spaced-repetition, -recall, HiNote, LearnKit, True Recall) | Plugins | https://obsidian.md/ | Desktop, mobile | Free | Flashcards in Markdown notes | SM-2 variants and FSRS-6 | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 11 | SiYuan (riff) | Notes app | https://github.com/siyuan-note/siyuan | Desktop, mobile | Free/freemium | Notes with flashcards | FSRS-5 | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 12 | Org-fc / Org-srs | Emacs packages | https://github.com/l3kn/org-fc | Emacs | Free | SRS in Org-mode | FSRS (experimental) | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 13 | TiddlyWiki FSRS plugin | Plugin | https://github.com/TiddlyWiki/TiddlyWiki5 | Web | Free | SRS in a wiki | FSRS | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 14 | Traverse | App | https://traverse.link/ | Web, iOS, Android | Freemium [BK] | Mind maps and notes with cloze flashcards | Visual learning, active recall, spaced repetition. Founder Dom Zijlstra | [V] [Traverse](https://traverse.link/), [Ness Labs](https://nesslabs.com/traverse-featured-tool) |
| 15 | Readwise | App | https://readwise.io/ | Web, iOS, Android | Paid | Resurfaces book and article highlights daily | Spaced resurfacing of highlights (light SRS) | [BK] |
| 16 | Orbit / Quantum Country | Web (open source) | https://quantum.country/ ; https://withorbit.com/ | Web | Free | Essays with embedded review prompts. Quantum Country has 112 questions | "Mnemonic medium": SRS woven into the reading | [V] [Goodreads repost of the essay](https://www.goodreads.com/author_blog_posts/19121247-andy-matuschak-and-michael-nielsen-how-can-we-develop-tr), [Matuschak notes](https://notes.andymatuschak.org/zP8MVDmomB7UrTddVY34E1B). Orbit's 2026 status unknown |
| 17 | Foliole | Incremental reading | https://github.com/campfirium/foliole | Desktop | Free | Incremental reading tool | Incremental reading plus FSRS | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 18 | ZKMemo | App | https://zkmemo.com | not stated | not stated | Zettelkasten-style notes plus SRS | FSRS-6 | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |

**C. Mass-market study platforms**

| # | Name | Type | URL | Platforms | Price | What it does | Core idea | Tag |
|---|---|---|---|---|---|---|---|---|
| 19 | Quizlet | Web and app | https://quizlet.com/ | Web, iOS, Android | Freemium. Plus about US$35.99/yr or $7.99/mo; Plus Unlimited about $44.99/yr | Huge library of shared sets; Learn and Test modes; AI | Active recall, adaptive "Learn" mode. Free Learn and Test rounds are rate-limited | [V] secondary: [Neurako](https://www.neurako.com/blog/is-quizlet-free-2026), [Recurdash](https://recurdash.com/subscription-pricing/quizlet-plus) |
| 20 | Brainscape | Web and app | https://www.brainscape.com/ | Web, iOS, Android | Freemium. Pro about $7.99/mo on the yearly plan (Sep 2026 check); other sources differ | Shared and "Certified" expert decks; AI card creation in Pro | Confidence-Based Repetition (CBR): rate 1 to 5, low-confidence cards come back more often | [V] [Wikipedia](https://en.wikipedia.org/wiki/Brainscape), [Brainscape research](https://brainscape.com/research), [Mindomax](https://www.mindomax.com/brainscape-vs-anki) |
| 21 | Cram.com | Web | https://www.cram.com/ | Web, mobile | Free, ad-supported [BK] | Shared flashcard library | Basic flashcards and memorize mode | [BK] |
| 22 | Vaia (StudySmarter in DACH) | App | https://www.vaia.com/ ; https://www.studysmarter.de/ | Web, iOS, Android | Freemium | AI flashcards from your documents, shared content, exam plans | AI generation plus SRS. Renamed Vaia in the US, Spain and other markets; still StudySmarter in Germany, Austria and Switzerland | [V] [StudySmarter press release](https://www.studysmarter.co.uk/newsroom/studysmarter-announces-new-us-name-vaia/), [Okti](https://okti.app/en/blog/studysmarter-alternative-2026-en/) |
| 23 | Knowt | Web and app | https://knowt.com/ | Web, iOS, Android | Free tier with unlimited Learn, tests and SRS (ads); paid tier [BK] | Quizlet-like; imports Quizlet sets; AI notes-to-cards | Active recall, SRS, AI generation | [V] secondary: [Neurako](https://www.neurako.com/blog/is-quizlet-free-2026) |
| 24 | Gizmo | App | https://gizmo.ai/ | iOS, Android, web | Freemium [BK] | Upload notes, docs or links to get flashcards, adaptive quizzes and gamified challenges | AI generation, SRS, gamification. London-based; 13M+ learners in 120+ countries; $22M Series A in Apr 2026 (Shine Capital) after a $3.5M seed in 2023 (NFX) | [V] [Tech.eu](https://tech.eu/2026/04/15/gizmo-secures-22m-series-a-to-advance-ai-powered-education/), [TechCrunch](https://techcrunch.com/2023/09/21/ai-startup-gizmo-funding-gamified-quizzes-flashcards-make-learning-fun/) |
| 25 | Memrise | App | https://www.memrise.com/ | iOS, Android, web | Freemium/subscription | Language learning with video clips of native speakers and AI chat | SRS for vocabulary, mnemonics. It has moved away from user-made courses | [BK]; listed as the language pick in the [StudyCards roundup](https://studycardsai.com/best-flashcard-apps-2026) |
| 26 | Duolingo | App | https://www.duolingo.com/ | iOS, Android, web | Freemium | Gamified language learning | Half-Life Regression (HLR) for vocabulary practice | HLR [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs); app [BK] |

**D. AI-first flashcard generators**

| # | Name | Type | URL | Platforms | Price | What it does | Core idea | Tag |
|---|---|---|---|---|---|---|---|---|
| 27 | Retain (retain.cards) | App | https://www.retain.cards/ | iOS, Android, desktop, iPad; 9 interface languages | Free with in-app purchases | Turns PDFs, images, handwriting and YouTube into cards; builds an exam-date study plan | AI generation plus its own adaptive SRS (see key question 2) | [V] [Retain](https://www.retain.cards/), [App Store](https://apps.apple.com/us/app/-/id6745344282) |
| 28 | Revisely | Web | https://www.revisely.com/ | Web | Freemium [BK] | AI flashcard and quiz generator from documents | AI generation | [BK] |
| 29 | Wisdolia | Chrome extension and web | https://www.wisdolia.com/ | Chrome, web | Freemium [BK] | Generated cards from any web page or PDF | AI generation. One comparison says Jungle AI now hosts its offering; status unclear | [V] secondary: [Scholarly](https://scholarly.so/blog/10-free-anki-alternatives) |
| 30 | Jungle AI | Web | https://jungleai.com/ | Web | Freemium [BK] | AI MCQs and flashcards from slides, PDFs and video | AI generation | [BK] |
| 31 | StudyCards AI | Web | https://studycardsai.com/ | Web | Freemium [BK] | PDFs and lecture notes to cards; exports to Anki | AI generation plus Anki export | [V] [StudyCards](https://studycardsai.com/blog/best-ai-flashcard-tools) |
| 32 | Scholarly | Web | https://scholarly.so/ | Web | Freemium [BK] | AI notes and flashcards | AI generation | [BK] |
| 33 | Mindomax | Web | https://www.mindomax.com/ | Web | not verified | AI flashcard app, also publishes comparison pages | AI generation plus SRS | [V] the site exists ([Mindomax](https://www.mindomax.com/flashcard-app-with-ai-2026)); details [BK] |
| 34 | YouLearn | Web | https://www.youlearn.ai/ | Web | Freemium [BK] | AI tutor; flashcards and quizzes from content | AI generation | [V] the site exists ([YouLearn](https://www.youlearn.ai/blogs/best-ai-flashcard-makers-quiz-generators-studying)) |
| 35 | Nibble | App | https://nibble-app.com/ | not verified | not verified | Flashcard app that publishes comparisons | SRS | [V] the site exists ([Nibble](https://nibble-app.com/blog/brainscape)) |
| 36 | Acemate | Web | https://acemate.ai/ | Web | not verified | AI study from your own lecture script | AI generation | [V] the site exists ([Acemate](https://acemate.ai/en/blog/acemate-vs-studysmarter/)) |
| 37 | Rember | App | https://www.rember.com/ | not stated | not stated | AI-assisted SRS | FSRS-5 | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 38 | Avorio | App | https://avorio.ai/ | macOS, iPhone | not stated | AI plus SRS | FSRS-5 or SM-2 | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 39 | StudyDaily | App | https://www.studydaily.app/en | iOS, Mac, Android, Windows, web | not stated | Flashcards | FSRS-6 | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 40 | Markji | App (China) | https://www.markji.com/ | not stated | not stated | Flashcards | MMX, an FSRS variant | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 41 | MaiMemo (墨墨背单词) | App (China) | https://www.maimemo.com/ | iOS, Android | Freemium [BK] | Vocabulary memorisation | SSP-MMC algorithms. MaiMemo employed and supported FSRS author Jarrett Ye | [V] [FSRS4Anki](https://github.com/open-spaced-repetition/fsrs4anki), [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 42 | Chessbook | App | https://chessbook.com/ | Mobile, web | not stated | Chess opening memorisation | FSRS-4.5 (shows SRS spreading beyond exams) | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 43 | LeetFlash | Chrome extension | https://leetflash.com/ | Chrome, web | not stated | SRS for coding-interview problems | ts-fsrs | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| 44 | spacedrep | CLI and MCP server | https://github.com/wpwilson10/spacedrep | CLI, PyPI | Free | SRS that AI agents can drive | py-fsrs | [V] [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |

**E. India- and UPSC-specific**

| # | Name | Type | URL | Platforms | Price | What it does | Core idea | Tag |
|---|---|---|---|---|---|---|---|---|
| 45 | SpacedRevision: UPSC & Exams | iOS app | https://mwm.ai/apps/spacedrevision-upsc-exams/6755098751 | iOS | Paid premium | Flashcards and MCQs from past papers (PYQs); analytics | Active recall plus SRS | [V] listing via [search](https://mwm.ai/apps/spacedrevision-upsc-exams/6755098751) |
| 46 | Revprep (StudyBuddy) | Android app | https://play.google.com/store/apps/details?id=com.studyrev | Android, sync | not verified | AI flashcards from notes and PDFs, for UPSC, JEE and NEET | AI generation plus SRS | [V] [Google Play](https://play.google.com/store/apps/details?id=com.studyrev) |
| 47 | YaadAI | Android app | (FileHippo listing only) | Android | not verified | Curated UPSC Prelims questions | SRS | [V] weak source: [FileHippo](https://filehippo.com/android/download_yaadai/) |
| 48 | UPSC Prep (web) | Web | https://upscprep.duckdns.org/ | Web | Free with paid upgrades | PYQs, mocks with negative marking, SM-2 queue of missed questions | SM-2 | [V] hobby-grade domain, low confidence |

The [Awesome FSRS list](https://github.com/open-spaced-repetition/awesome-fsrs) names about 30 more small FSRS apps: Azri, Discito, Dushed, Etude, Flipnem, Klappa, Loudwalk, MySummaries, Origa, Quanta, Revu, SpacedCards, Terminus, CuaderNote, Smort, Verbamor, WordVault, BrioVocab, KaChiKa, Lexkite, Lexpad, LinGoat, MemPro, Ordkort, Gnoseed, Jolito, Read Frog and others. They can pad the catalogue, but most are tiny indie products.

### Cited findings: scheduling algorithms

| Algorithm | Notes | Source |
|---|---|---|
| **Leitner system** | Physical or virtual boxes. A card moves up a box when answered right and back to box 1 when wrong. Lexpad uses 5 boxes by default | [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| **SM-2** (SuperMemo 2, 1987) | Ease factor per card. Anki's legacy default; also used by Mnemosyne, Obsidian SR and many small apps. Anki's FSRS option replaces it | [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs); history [BK] |
| **SM-17/SM-18** | SuperMemo's later two-component (stability/retrievability) models, used in SuperMemo 18/19 | [BK]; SM-17 linked in [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| **FSRS** (Free Spaced Repetition Scheduler; v4.5, 5, 6, 7) | Open source (Jarrett Ye and contributors). Models difficulty, stability and retrievability, and machine-learning-fits parameters to each user's review history. In Anki since 23.10; FSRS-6 since 25.07. Ported to many languages (ts-fsrs, py-fsrs, fsrs-rs, swift, dart, go) | [FSRS4Anki](https://github.com/open-spaced-repetition/fsrs4anki), [Anki 25.07](https://github.com/ankitects/anki/releases/tag/25.07) |
| **HLR** (Half-Life Regression) | Duolingo's model for second-language vocabulary | [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| **Ebisu, DASH, ACT-R, SSP-MMC** | Bayesian (Ebisu), psychology-derived (ACT-R, DASH) and MaiMemo's optimal-control models | [srs-benchmark](https://github.com/open-spaced-repetition/srs-benchmark), [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs) |
| **Confidence-Based Repetition** | Brainscape's 1-to-5 self-rating. No published benchmark against SM-2 or FSRS | [Mindomax](https://www.mindomax.com/brainscape-vs-anki) |
| **Proprietary "adaptive" schedulers** | Retain, Vaia, Gizmo, Quizlet Learn. Black boxes | Vendor pages |

Benchmark of the open algorithms ([srs-benchmark](https://github.com/open-spaced-repetition/srs-benchmark); about 10k Anki users and about 350M evaluation reviews; log loss, lower is better):
- Without same-day reviews: RWKV neural model 0.2773, GRU 0.3328, FSRS-7 (recency, 100 epochs) 0.3363, FSRS-6 0.3460, FSRS-5 0.3561, FSRS v4 0.3726, HLR 0.4694, Ebisu v2 0.4989.
- SM-2 and SuperMemo's algorithms are not in the main table; they are compared in separate repositories.

### Inferences
- FSRS is the "standard" modern scheduler. Any new app, Aspiran included, can adopt an open, benchmarked algorithm instead of inventing one. ts-fsrs suits a TypeScript Worker.
- Mainstream consumer apps (Quizlet, Brainscape, Gizmo, Vaia) put content libraries, AI generation and gamification ahead of scheduling accuracy.
- The AI-generator group is crowded with small, look-alike products. Many of the "best of 2026" lists are written by competing vendors, so they are marketing, not evidence.

### Gaps
- Current prices and platforms for Anki/AnkiMobile, SuperMemo, Mnemosyne, Cram, Readwise, Memrise, Revisely, Jungle AI and Knowt's paid tier were not re-verified this session ([BK] rows).
- Whether Mnemosyne and Orbit are still maintained in 2026 is unknown. Wisdolia's status is unclear: one blog says it moved into Jungle AI, with no primary source.
- Anki's ownership and governance change (a reported 2025 handover to AnkiHub) did not show up in my searches; unverified.
- Whether FSRS is now the default in a new Anki profile (rather than opt-in) was not confirmed. Sources conflict.

## Key question 2: What exactly is retain.cards and how does it work?

### Takeaway
Retain is an AI flashcard and exam-planning app from **Retain Labs GmbH** (Germany). You upload study material, it generates editable exam-style cards, and it then schedules reviews against your exam date with its own adaptive spaced-repetition algorithm. It is pitched as a smarter, faster alternative to Anki.

### Cited findings
- It calls itself a "science-based flashcard app" that combines AI models with learning-science research to build personalised study plans — [Retain](https://www.retain.cards/)
- Workflow: (1) upload a PDF, PNG or JPEG and choose one of three quiz depths; (2) the AI generates cards, which you review and edit; (3) set a goal or exam, and it computes a learning plan; (4) study to the plan while it tracks proficiency — [Retain](https://www.retain.cards/)
- Handles text, maths formulas, images and handwritten notes; imports from Notion, GoodNotes and Anki — [Retain](https://www.retain.cards/)
- The App Store listing (Retain Labs GmbH) says it makes cards from PDFs, videos and images and gives daily review plans. A reviewer made a deck from a pasted YouTube link — [App Store](https://apps.apple.com/us/app/-/id6745344282)
- Card types: Q&A, cloze, image occlusion, custom Anki-style. Decks can be shared by link. Each card carries a source reference — [Retain](https://www.retain.cards/), [Retain blog](https://www.retain.cards/blog/anki-vs-retain)
- Scheduling: its own adaptive SRS, positioned against Anki's SM-2. It is said to model how well you will know each card *by the exam date*, and uses "predictive algorithms and insights from 220 million learning records" — [Retain](https://www.retain.cards/), [Retain blog](https://www.retain.cards/blog/create-flashcards-in-seconds)
- Platforms: iOS, Android, desktop, iPad; 9 interface languages. Free with in-app purchases. Exact limits are not visible on the site — [Retain](https://www.retain.cards/), [App Store](https://apps.apple.com/us/app/-/id6745344282)
- Self-reported traction: "1,000,000+" students; logos of MIT, Yale, TUM and LMU; backed by an ElevenLabs startup grant; has a creator programme and a schools/business offer — [Retain](https://www.retain.cards/)
- Ratings: about 4.4 on the App Store from about 87 ratings. JustUseApp's review-analysis "safety score" is low (39.5/100), which is a weak signal — [search summary](https://justuseapp.com/en/app/6745344282/retain-cards-ai-flashcards/reviews)
- Name confusion: a different "Retain: AI Flashcards" iOS app by Paul Evans exists (id6469217518) and is unrelated — [App Store](https://apps.apple.com/app/id6469217518)

### Inferences
- Retain's distinctive features are exam-date-targeted planning plus AI generation with source references. Its scheduler is not published or benchmarked. Its "1M+ students" sits oddly beside about 87 US App Store ratings; the user base may be mostly German or European.

### Gaps
- No published description of its algorithm, and no exact pricing tiers were found.
- No India-specific content and no Hindi interface found. The 9 languages were not listed.

## Key question 3: Evidence and studies that vendors cite

### Takeaway
Vendors mostly cite the general spacing-effect and forgetting-curve research, not studies of their own product. The only large, open, reproducible evidence on scheduler quality is the FSRS srs-benchmark. The best-documented outcome literature is on Anki use among medical students, and it is correlational.

### Cited findings
- Retain cites Yuan (2022, *Cureus*) on the spacing effect, Murre & Dros (2015, *PLoS ONE*) replicating Ebbinghaus's forgetting curve, and "150 years of learning science". It claims 20% time savings over Anki. All of this is self-reported — [Retain](https://www.retain.cards/)
- Brainscape has a "research" page on spaced repetition and CBR. Reviewers found no independent benchmark of CBR — [Brainscape research](https://brainscape.com/research), [Mindomax](https://www.mindomax.com/brainscape-vs-anki)
- FSRS: open benchmark on about 10k Anki users and about 350M to 727M reviews. FSRS-6 and FSRS-7 beat HLR and Ebisu on log loss; neural RWKV beats them all — [srs-benchmark](https://github.com/open-spaced-repetition/srs-benchmark)
- FSRS research grew out of MaiMemo's published papers (SSP-MMC) — [FSRS4Anki](https://github.com/open-spaced-repetition/fsrs4anki)
- The mnemonic medium: Matuschak and Nielsen's essay "How can we develop transformative tools for thought?" (2019) reports Quantum Country's design with 112 embedded questions. Their later notes discuss application prompts in *Quantum Mechanics Distilled* — [Goodreads repost](https://www.goodreads.com/author_blog_posts/19121247-andy-matuschak-and-michael-nielsen-how-can-we-develop-tr), [Matuschak notes](https://notes.andymatuschak.org/z6Y8xDS2AJyE1d34X99y14Sk1A7YCNas5kFjA)
- Medical-education literature on Anki is collected in PMC articles: [PMC8651966](https://pmc.ncbi.nlm.nih.gov/articles/PMC8651966), [PMC10176558](https://pmc.ncbi.nlm.nih.gov/articles/PMC10176558), [PMC9045547](https://pmc.ncbi.nlm.nih.gov/articles/PMC9045547); also the [International Journal of Medical Students (2023)](https://doaj.org/article/863fbc9e60ba4cb8af6597e94b9d1bbb) and a [University of Hawaii study](https://scholarspace.manoa.hawaii.edu/items/afe392ed-8555-4816-9410-a0a89b77a91e). Not read in full here; for the later validation stage.
- Gizmo's pitch is AI plus gamification. Its funding news cites usage (13M learners), not learning outcomes — [Tech.eu](https://tech.eu/2026/04/15/gizmo-secures-22m-series-a-to-advance-ai-powered-education/)

### Inferences
- Phrases like "science-based" or "proven" mean the general spacing effect, not trials of the app. Aspiran should cite the general research honestly and avoid outcome claims for its own scheduler.

### Gaps
- No randomised trial of any named commercial app (Retain, Quizlet, Brainscape, Gizmo) was found.
- Quizlet's and Vaia's published research claims were not checked.

## Key question 4: Which tools are popular with medical, law, language and Indian competitive-exam students?

### Takeaway
- **Medicine:** Anki dominates, about two-thirds of US medical students, often with the AnKing deck alongside UWorld question banks.
- **Language:** Anki, Memrise, Duolingo, plus many small FSRS vocabulary apps; MaiMemo in China.
- **UPSC and Indian exams:** Anki is the most cited general tool. A handful of small, new UPSC/JEE/NEET SRS apps exist, but no product clearly leads.
- **Law:** no good data found.

### Cited findings
- **Medicine:**
  - About 68.3% of US medical students use Anki, averaging 17.8 h/week (Halperin et al., 2024, as summarised by a vendor blog; check the paper) — [StudyCards AI](https://studycardsai.com/blog/medical-student-anki-statistics)
  - At UNC, 66% (132 of 201) used Anki significantly before Step 1 (surveyed March 2020) — [search summary](https://studycardsai.com/blog/medical-student-anki-statistics)
  - In a 165-student survey, 56% were daily Anki users — [PMC8651966](https://pmc.ncbi.nlm.nih.gov/articles/PMC8651966)
  - AnKing is the most-used premade deck for USMLE Step 1 and 2 — [AnKing guide](https://studycardsai.com/blog/anking-deck-guide)
- **Language:**
  - Memrise is the usual language pick in roundups — [StudyCards AI](https://studycardsai.com/best-flashcard-apps-2026)
  - Duolingo's HLR model was built for second-language vocabulary — [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs)
  - At least 15 language-specific FSRS apps exist (BrioVocab, KaChiKa, LinGoat, Ordkort, AI Japanese Tutor, and others) — [Awesome FSRS](https://github.com/open-spaced-repetition/awesome-fsrs)
- **UPSC:**
  - Anki is widely cited in aspirant forums for atomic facts (polity, geography, environment, schemes). A secondary blog argues SRS is weak for analytical, answer-writing skill and should be paired with PYQs and answer practice — [Bharatnotes](https://bharatnotes.com/faq/revision/anki-vs-quizlet-vs-remnote-upsc-2026/), [Bharatnotes](https://bharatnotes.com/faq/revision/flashcards-anki-upsc-pros-cons/)
  - Brainscape has user-made UPSC decks of a few hundred cards each, of variable quality — [Brainscape UPSC pack](https://www.brainscape.com/packs/upsc-prep-19905184)
  - UPSC/Indian-exam SRS apps: SpacedRevision (iOS, paid), Revprep (Android, AI, UPSC/JEE/NEET), YaadAI, upscprep web (SM-2) — see section E above.
  - The [EaseMyPrep 2026 list](https://easemyprep.in/blog/best-mobile-apps-upsc-preparation-2026) covers mainstream UPSC apps (not read in full).

### Inferences
- In India, spaced repetition is still a niche, self-assembled habit (Anki plus personal decks). No dominant bilingual (English/Hindi) UPSC SRS product turned up. That gap matches Aspiran's daily Chai cards plus practice.
- The medical pattern (shared community deck plus question bank plus SRS) is the most proven model of "community deck" use, and the closest analogue to pods sharing vetted decks.

### Gaps
- No reliable usage figures for law students: no searches surfaced law-specific SRS data. Quizlet and Anki for the bar exam are commonly assumed [BK].
- No survey data on SRS use among UPSC, JEE, NEET or CA aspirants. Indian forum (r/UPSC) sentiment was not sampled.
- No reliable usage share for UWorld or the AnKing deck.
