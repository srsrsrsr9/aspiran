# How five exam-prep ideas are implemented: MIX, ADP, FBK, TST, TGT

Part 3 notes (1 Nov 2026). Scope: implementation patterns only (how each idea becomes an app feature, book method, coaching routine or habit), with design parameters, examples, cost and known pitfalls. No effectiveness judgements (Part 4 does those). About 17 web searches plus the Part 1 catalogue and the Part 2 report.

Local references used throughout:
- P1 = Part 1 catalogue, `artefacts/reports/Exam success tools and methods.md` (entry numbers as #N). [P1](../../reports/Exam%20success%20tools%20and%20methods.md)
- P2 = Part 2 report, `artefacts/reports/Exam success central ideas.md` (sections and appendix). [P2](../../reports/Exam%20success%20central%20ideas.md)

Source-quality note: much of what is online about these products is the vendors' own help pages or marketing. Where a claim is from a vendor, a competitor or a coaching blog, this is flagged. Prices in P1 are often marked "not checked".

---

## MIX (interleaving and varied practice): distinct variants, how they work, parameters, examples, cost

### Takeaway
MIX shows up in four forms: mixed problem sets (worksheets and homework), mixed review inside revision apps, cumulative quizzes and mixed mocks, and "problem-type atlases" in books that make the learner choose a method. It is the rarest idea in products (2 primary, 13 any in P2). Most commercial question banks allow mixing only as a filter setting ("random", "all subjects") rather than a designed sequence.

### Cited Findings
**Variant M1. Mixed (interleaved) problem sets in homework or worksheets.**
- How it works: a new problem type is first introduced in a block, then its later practice problems are spread across subsequent assignments mixed with other types. In Rohrer, Dedrick and Burgess, "the first four practice problems appeared in one assignment, and the remaining eight were distributed across the remaining assignments" — [Learning Scientists summary](https://www.learningscientists.org/blog/2021/10/28-1)
- Classroom-scale implementation: 54 Grade 7 maths classes (787 learners, 15 teachers, five Florida schools) were randomly given mixed or blocked worksheets over four months — [Learning Scientists](https://www.learningscientists.org/blog/2021/10/28-1) (numbers only for context; effect size is Part 4's job).
- The design gap it fills: across the textbooks Rohrer and Hartwig analysed, 78% of practice problems were blocked, 11% interleaved, 11% hard to classify; they recommend that most practice problems in a course be interleaved — [Rohrer and Hartwig, UNH resource](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-spaced-and-interleaved-mathematics-practice-rohrer-hartwig.pdf)
- Design parameters: blocked introduction first, then interleaved review; spacing (one problem type over time) is distinct from interleaving (many types mixed) — [Rohrer and Hartwig](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-spaced-and-interleaved-mathematics-practice-rohrer-hartwig.pdf); [Learning Scientists](https://www.learningscientists.org/blog/2021/10/28-1)
- Cost of the design: authors note interleaving "probably takes (a little) more time than blocking" — [Rohrer and Hartwig](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-spaced-and-interleaved-mathematics-practice-rohrer-hartwig.pdf)

**Variant M2. Mixed review in revision apps.** Seneca Learning (UK) is the only platform in the catalogue described as quizzing, mixing topics and returning to them later; free with a premium tier — [P1 #66](../../reports/Exam%20success%20tools%20and%20methods.md); vendor framing from [Seneca blog](https://senecalearning.com/en-GB/blog/what-is-the-best-way-to-revise/).

**Variant M3. Cumulative quizzes and mixed-subject mocks / Q-bank "random" blocks.** UWorld lets users build blocks and switch between Tutor and Timed modes; mixing is a block-creation choice — [UWorld features](https://medical.uworld.com/usmle/features/). Full-length mocks are by nature mixed (all subjects in exam order); see TST.

**Variant M4. Problem-type atlases in books.** *The Art of Mathematics* 수학의 정석 (Korea, #417) and Chart-shiki チャート式 (Japan, #424) map every problem type to its method; P2 tags them MIX as secondary — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md). China's 5·3 (#401) sorts real and mock questions by topic (blocked), which is the opposite design choice — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md).

**Variant M5. Books and teacher guides that teach the idea.** *Make It Stick* (#247), *How We Learn* (#249), *Powerful Teaching* (#253), *Small Teaching* (#254), *Range* (#263, primary MIX), Dunlosky et al. 2013 (#236), RetrievalPractice.org (#238) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md). Cost: book price or free.

### Inferences
- In software, interleaving is usually a side effect (random shuffle, "all topics" filter, full mock) rather than an intentional schedule that first blocks then mixes. No catalogue product was found that implements Rohrer's "block first, then spread later problems across later sessions" rule explicitly.
- Topic-sorted books (5·3, PYQ-by-topic compilations, Oswaal chapter-wise banks) are the dominant format in China and India; they are blocked by design, so MIX has to come from the learner or a mock.
- Key design parameters for a MIX feature: when mixing starts (after first exposure), mix ratio (how many old types per new set), whether problem-type labels are hidden (labels defeat the "choose the method" step), and whether the mix spans subjects or stays within one.

### Gaps
- Did not verify whether any large Indian test-prep app (Testbook, Oliveboard, Unacademy) offers a deliberate interleaved review mode beyond "random" or "mixed" quiz options.
- No sourced pitfall list specific to MIX in products beyond "takes more time"; learner perception that mixing "feels harder" is commonly cited in the literature but not sourced here.

---

## ADP (working on weak spots): adaptive engines, mastery gates, adaptive tests, diagnostics, analytics, deliberate practice

### Takeaway
ADP has six distinct implementation patterns: (1) knowledge-space / knowledge-graph engines (ALEKS, Squirrel AI, Embibe), (2) score-based mastery gates (Khan Academy, IXL SmartScore), (3) item-response-theory adaptive tests used as the exam itself (GRE, GMAT, Duolingo English Test, digital SAT), (4) diagnostic test then personalised plan (PrepScholar), (5) question-bank analytics by topic that leave the choosing to the learner (UWorld, AMBOSS, Indian test series), and (6) human deliberate-practice drills (coach or self). They differ mainly in who detects the weak spot (algorithm, score threshold, or the learner reading a report) and in what happens next (forced path, gate, or advice).

### Cited Findings
**A1. Knowledge-space / knowledge-graph engines.**
- ALEKS = "Assessment and LEarning in Knowledge Spaces", based on Knowledge Space Theory — [ALEKS orientation, McGraw Hill](https://www.mheducation.com/unitas/highered/explore/schools/ancora/aleks-student-orientation-ancora.pdf)
- Step 1: an initial adaptive Knowledge Check of roughly 20–30 questions, each chosen from all previous answers; can take 30–90 minutes — [UCSD ALEKS guide](https://summer.ucsd.edu/_files/SSP/CHEM6A%20ALEKS%20Assessment%20Guide.pdf); [ALEKS orientation](https://www.mheducation.com/unitas/highered/explore/schools/ancora/aleks-student-orientation-ancora.pdf)
- Step 2: results shown as a "pie" per topic area (dark = mastered on a check, light = learned in Learning Mode, grey = not yet) — [ALEKS orientation](https://www.mheducation.com/unitas/highered/explore/schools/ancora/aleks-student-orientation-ancora.pdf)
- Step 3: the learner may pick topics, but only from those they are "ready to learn" (prerequisites met) — [ALEKS brochure](https://www.mheducation.com/unitas/school/program/aleks/aleks-brochure.pdf)
- Step 4: periodic reassessments check retention — [ALEKS brochure](https://www.mheducation.com/unitas/school/program/aleks/aleks-brochure.pdf). Outcome claims in these brochures are vendor marketing.
- Cost: paid via institutions — [P1 #64](../../reports/Exam%20success%20tools%20and%20methods.md)
- Same pattern elsewhere: Squirrel AI (China, fine-grained "knowledge points", price not verified, #59); Embibe (India, knowledge-graph engine, freemium, #182); Xueersi learning tablets (China, #396) — [P1](../../reports/Exam%20success%20tools%20and%20methods.md); [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**A2. Score-based mastery gates.**
- Khan Academy: four levels per skill (Attempted, Familiar, Proficient, Mastered) worth 0/50/80/100 mastery points. Proficient needs all questions on that skill right in an exercise, quiz, test or challenge; Mastered needs all right on a Unit Test or Course Challenge, starting from Proficient. A wrong answer on a quiz or unit test can drop a level — [Khan Academy help](https://support.khanacademy.org/hc/tr/articles/5548760867853); [Khan Academy course and unit mastery](https://support.khanacademy.org/hc/en-us/articles/115002552631)
- Course Challenge samples skills from the whole course (a cumulative, mixed check) — [Khan Academy help](https://support.khanacademy.org/hc/en-us/articles/115002552631). Thresholds have changed over time (2018 beta used 70%+ for Familiar) — [Khan community post](https://support.khanacademy.org/hc/nl/community/posts/115001845151/comments/360001808051)
- IXL SmartScore: score rises on correct answers and falls on wrong ones, weighted by difficulty, recency and consistency; in the 90–100 "Challenge Zone" gains are 1–2 points and losses 3–8; reaching 100 can take up to 10 correct in a row — [IXL SmartScore Guide (vendor)](https://www.ixl.com/materials/SmartScore_Guide.pdf). Users report larger drops; a competitor criticises the mechanic as punishing — [Boddle (competitor)](https://www.boddlelearning.com/article/ixl-punishes-wrong-answers)
- Cost: Khan Academy free; IXL subscription; Sparx Maths and DeltaMath via school licence; Up Learn paid course — [P1 #65, #67, #70, #72, #73](../../reports/Exam%20success%20tools%20and%20methods.md)
- The method behind it: Bloom's mastery learning (reach a standard per unit before moving on, with corrective loops) — [P2 appendix #363](../../reports/Exam%20success%20central%20ideas.md)

**A3. IRT adaptive tests (the exam itself adapts).**
- GRE General: Verbal and Quant are section-level adaptive; the second section of each measure is chosen from performance on the first — [ETS, understand scores](https://www.ets.org/content/ets-org/ca/en/gre/test-takers/general-test/scores/understand-scores.html)
- GMAT Focus: question-level adaptive, described by third parties as IRT-based with the ability estimate updated after every answer; sections scored 60–90, total 205–805 — [test-ninjas (third party, not GMAC)](https://test-ninjas.com/gmat-adaptive-testing-explained)
- Duolingo English Test: Rasch-style item model in the original design — [Settles et al., TACL 2020 (Duolingo authors)](https://research.duolingo.com/papers/settles.tacl20.pdf); newer pipeline calibrates items with explanatory IRT models and item embeddings, administers via Thompson sampling, scores with a fully Bayesian approach — [NeurIPS 2024 abstract](https://neurips.cc/virtual/2024/107597); score reflects proficiency "after accounting for item difficulty" — [DET blog](https://blog.englishtest.duolingo.com/how-is-the-duoling-english-test-scored/)
- Prep implication: official practice tests on the real adaptive software (College Board Bluebook, GMAT Official Practice) — [P1 #86](../../reports/Exam%20success%20tools%20and%20methods.md); Target Test Prep runs an adaptive quant course (#85) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**A4. Diagnostic test, then personalised plan.** PrepScholar starts SAT/ACT/GRE prep with a diagnostic test and builds a study plan from it; paid; advertises a score guarantee — [P1, PrepScholar row](../../reports/Exam%20success%20tools%20and%20methods.md). Coaching "foundation tests" and app onboarding quizzes follow the same pattern (inference; see below).

**A5. Q-bank analytics by topic (learner chooses what to fix).**
- UWorld's Performance area shows Overall, Reports by subject, system and topic, and Graphs; shows the share of users picking each option, percentile rank, and average time per question vs others — [UWorld features](https://medical.uworld.com/usmle/features/)
- AMBOSS tags each question with a 1–5 "hammer" difficulty and offers a High-Yield filter — [AMBOSS features](https://www.amboss.com/us/features)
- Oliveboard: mocks with percentile analytics for 50+ exams, freemium plus subscription — [P1 #181](../../reports/Exam%20success%20tools%20and%20methods.md)
- Fenbi app (teacher-exam version) says it generates a data report from practice records and a "predicted score" — [App Store, Fenbi Teacher](https://apps.apple.com/cn/app/%E7%B2%89%E7%AC%94%E6%95%99%E5%B8%88-%E6%95%99%E5%B8%88%E8%B5%84%E6%A0%BC%E8%AF%81%E6%95%99%E5%B8%88%E6%8B%9B%E8%81%98%E5%A4%87%E8%80%83%E7%A5%9E%E5%99%A8/id1071050365)
- Zuoyebang Miaomiaoji / Huawei mistake notebooks push variant questions from wrong ones (adaptive follow-up from the error log; see FBK) — [Huawei support](https://consumer.huawei.com/cn/support/content/zh-cn16028630)

**A6. Deliberate practice (human version).** Effortful practice aimed at specific weaknesses, with feedback — [P2 appendix #364, *Peak* #262](../../reports/Exam%20success%20central%20ideas.md); *Ultralearning* "drill" principle (#273); Japanese and Korean cram schools that group children by ability (Yotsuya Otsuka, SAPIX, #423); one-to-one tutoring adjusted to the student (OneSmart, #406) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md). Cost: free (self) to premium (tutoring).

**Adjacent: adaptive spacing schedulers** (FSRS, SM-2, HLR, Brainscape confidence-based repetition) carry ADP as a secondary: they adapt timing per item, not topic choice — [P2 appendix #318–325](../../reports/Exam%20success%20central%20ideas.md).

### Inferences
- Key design parameters across ADP variants: (a) unit of weakness (knowledge point, skill, topic tag, question type); (b) detection signal (correct/incorrect only, plus time, plus confidence, plus IRT difficulty); (c) adaptivity rule (prerequisite graph, point threshold, IRT ability estimate, or none — a report only); (d) what the learner is allowed to choose (ALEKS restricts to "ready to learn"; UWorld leaves it all to the learner); (e) whether mastery can decay (Khan and IXL can drop levels; ALEKS reassesses).
- Product types split cleanly: K-12 school products force a path (gates); adult high-stakes Q-banks give analytics and leave choice to the learner; national exam bodies use IRT for measurement, not for teaching.
- Indian test-prep apps mostly sit in A5 (topic-wise accuracy, percentile, time per question), with a few A1-style claims (Embibe). The gap between "report shows weak topics" and "system makes you practise them" is the main design choice.

### Gaps
- GMAC's own documentation of GMAT Focus item selection was not found; details rely on a third party.
- Squirrel AI's real adaptivity rules and pricing were not verified in this round.
- No independent source describing how Indian apps (Testbook, Oliveboard, Embibe) compute "weak topic" flags.

---

## FBK (feedback and error correction): worked explanations, human and AI evaluation, error logs, exam wrappers, peer marking

### Takeaway
FBK splits into: (1) instant worked-solution explanations in Q-banks, (2) human marking of written answers (correspondence courses, test series, mentors), (3) AI answer graders (mostly Indian civil-service Mains, a minute or less per answer), (4) self-marking with official mark schemes, (5) error logs and mistake notebooks, including hardware printers and apps that turn mistakes into variant questions (China, Korea), (6) exam wrappers (post-test reflection forms), and (7) peer review. The design choices that matter are feedback timing, detail (score only vs why each option is wrong), who marks, and whether the loop forces a re-attempt.

### Cited Findings
**F1. Worked-solution explanations in Q-banks.**
- UWorld: Tutor mode shows the explanation after each question; Timed mode is exam-like (explanations at block end) — [UWorld features](https://medical.uworld.com/usmle/features/)
- AMBOSS: explanations for every answer choice, links to its peer-reviewed Library, and an "Attending Tip" giving an experienced physician's reasoning — [AMBOSS features](https://www.amboss.com/us/features); a third-party blog describes Attending Tip as a hint when stuck — [Elite Medical Prep](https://elitemedicalprep.com/getting-the-most-out-of-amboss-for-step-2-ck-prep/)
- NTA Abhyas (India, free, official): question-wise analysis with explanation and solution after each test — [Careers360](https://news.careers360.com/neet-jee-main-how-nta-national-test-abhyas-app-helps-prepare-for-exams)
- Fenbi lists detailed solution explanations and "intelligent marking" by exam scoring rules in its 考研 mocks — [App Store, Fenbi Kaoyan](https://apps.apple.com/us/app/%E7%B2%89%E7%AC%94%E8%80%83%E7%A0%94-%E5%A4%A7%E5%AD%A6%E7%94%9F%E5%8F%8A%E5%9C%A8%E8%81%8C%E8%80%83%E7%A0%94%E5%A4%87%E8%80%83%E5%AD%A6%E4%B9%A0%E5%B9%B3%E5%8F%B0/id656497536?l=fr-FR)
- Other carriers: Magoosh (#80), Marrow (#172), PrepLadder (#171), Physics & Maths Tutor (free papers with mark schemes, #71) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**F2. Human evaluation of written answers.**
- Z-kai (Japan, since 1931): hard problems with hand-marked written answers by correspondence, paid monthly — [P1, Z-kai row](../../reports/Exam%20success%20tools%20and%20methods.md)
- Indian Mains test series: providers advertise mentor calls or video discussion after each test, model or framework answers, and some advertise 24-hour feedback — [UPSCprep Mains test series](https://upscprep.com/mains-test-series-upsc-2024); [Civils Daily](https://www.civilsdaily.com/?p=143396). Vision IAS runs an all-India test series and "Parikshan" Mains simulation with offline centres — [Vision IAS Parikshan](https://visionias.in/parikshan); its evaluation turnaround and model-answer policy were not confirmed.
- Insights IAS: free daily Mains answer writing with peer and mentor review; paid tests — [P1 #198](../../reports/Exam%20success%20tools%20and%20methods.md)
- US bar prep: Barbri and Themis give graded practice essays inside day-by-day plans (#83, #84) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)
- Writing feedback services: Studiosity (experts on drafts, #92), Busuu (native speakers correct exercises, #435) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)
- Known human-marking issues admitted even by AI vendors: two evaluators can give significantly different marks; evaluator fatigue; slow and costly — [AnswerWriting.com (AI vendor)](https://answerwriting.anthroholic.com/ai-answer-evaluation-vs-human-evaluation); [CollectorBabu (vendor)](https://collectorbabu.com/upsc-mains-evaluation-platforms-comparison.html)

**F3. AI answer graders.**
- How it works (typical): photograph or upload a handwritten answer, the system scores it against a rubric and returns structured comments plus a model answer in about a minute. SuperKalam grades handwritten Mains answers in under 60 seconds, freemium, plan about ₹4,799 (unverified) — [P1 #187](../../reports/Exam%20success%20tools%20and%20methods.md); UPSC AI "grades Mains answers in 60 seconds" (#455); PrepAiro "sixty-second" feedback (#190); CollectorBabu AI plus human graders (#189); Vaidra, Anthroholic/AnswerWriting.com, Edukemy, PW OnlyIAS — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)
- PrepAiro says it calibrated against 10,000+ human-evaluated answers for GS 1–4 but publishes no accuracy figures — [PrepAiro](https://prepairo.ai/upsc/llms/upsc-ai-mains-evaluation/)
- A vendor concedes AI can be "consistently wrong in the same direction" and approximates qualities like argument structure poorly — [AnswerWriting.com](https://answerwriting.anthroholic.com/ai-answer-evaluation-vs-human-evaluation)
- No independent or peer-reviewed study comparing AI and human UPSC Mains marks was found (search finding).
- Outside India: Save My Exams (UK/IB) has AI marking of answers (#68); Grammarly and Writable give on-demand writing feedback (#90, #91) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**F4. Self-marking with official mark schemes.** CBSE sample papers plus marking schemes (#519); Physics & Maths Tutor papers with mark schemes (#71); Akahon includes answers (#425) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md). Cost: free or book price.

**F5. Error logs and mistake notebooks (错题本 / 오답노트 / error log).**
- Method: log each wrong answer with its cause and the correct principle; re-test before the next mock; free; widely used in JEE, UPSC, GMAT and CAT coaching; no named-system study found — [P1 #141](../../reports/Exam%20success%20tools%20and%20methods.md)
- App loop (China): photograph the wrong question, auto-remove handwriting, sort by subject, then complete system-pushed review papers which are marked online to update the error data, repeating — [App Store, 错题plus](https://apps.apple.com/cn/app/id1476015217)
- Printer pattern: printers and apps that erase handwriting to restore a blank paper for repeated practice — [App Store, 错题打印机](https://apps.apple.com/cn/app/%E9%94%99%E9%A2%98%E6%89%93%E5%8D%B0%E6%9C%BA-%E8%87%AA%E5%8A%A8%E6%B8%85%E9%99%A4%E6%89%8B%E5%86%99%E7%AC%94%E8%BF%B9-%E8%AF%95%E5%8D%B7%E9%94%99%E9%A2%98%E6%95%B4%E7%90%86/id1598835335); Zuoyebang Miaomiaoji pocket thermal printer, about ¥200–600 (not checked) — [P1 #391](../../reports/Exam%20success%20tools%20and%20methods.md)
- "举一反三" (variant questions): Huawei's mistake notebook recommends up to 6 similar questions per mistake by knowledge point, maths only, done on paper with answers hidden until after — [Huawei support](https://consumer.huawei.com/cn/support/content/zh-cn16028630)
- Spaced-repetition version: a UPSC prep site puts missed questions into an SM-2 queue (#48) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**F6. Exam wrappers.**
- Short handouts completed when a graded exam is returned; prompt students to (a) identify strengths and weaknesses, (b) judge whether preparation time and strategies were adequate, (c) characterise their errors to find patterns — [CMU Eberly Center](https://www.cmu.edu/teaching/designteach/teach/examwrappers/)
- Timing example (physics): completed in recitation when exam 1 returned; instructor collected them and handed them back just before the next exam as a reminder — [CMU Eberly Center](https://www.cmu.edu/teaching/designteach/teach/examwrappers/)
- Templates exist for physics, biology, chemistry, maths; can be used before and after exams — [UVM CTL](https://www.uvm.edu/ctl/exam-wrappers); credited to Marsha Lovett and colleagues — [Univ. of Waterloo CTE](https://uwaterloo.ca/centre-for-teaching-excellence/node/4521)
- The problem it targets: students focus only on the score — [CMU Eberly Center](https://www.cmu.edu/teaching/designteach/teach/examwrappers/)

**F7. Peer marking and peer review.** Insights IAS peer/mentor review (#198), ForumIAS peer Q&A (#199), peer instruction (concept question, vote, discuss, revote, #360) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md). Self- vs mentor-evaluation trade-offs are discussed by a vendor — [AnswerWriting.com](https://answerwriting.anthroholic.com/self-evaluation-vs-mentor-evaluation-in-mains)

### Inferences
- Design parameters for FBK features: timing (immediate per item, end of block, days later for human marking); depth (score only, correct option, why each option is wrong, model answer, rubric line-by-line); marker (machine key, AI, human expert, peer, self with scheme); and closure (does the system force a re-attempt or variant question, or stop at the explanation?).
- The East Asian error-notebook products are the only common products that close the loop automatically (capture → classify → reprint/variant → re-mark). Western Q-banks mostly stop at the explanation plus a "flag/mark question" option; Indian test series stop at explanation plus percentile.
- Exam wrappers are the coarse-grained version of the error log (whole-test, about strategy and time), and are almost absent from commercial products; they exist as free university templates.

### Gaps
- No independent accuracy data for any AI answer grader (India or elsewhere).
- Vision IAS / Forum IAS evaluation turnaround and pricing not confirmed.
- Korean 오답노트 apps and services not individually searched this round.

---

## TST (exam rehearsal and technique): mocks, national ranked mocks, CBT simulators, past-paper books, in-exam strategy, answer structures

### Takeaway
TST implementations fall into: (1) full-length timed mocks (self-run with past papers or vendor mocks), (2) national ranked mock series that give a rank, percentile or "pass likelihood" grade (Kawaijuku/Sundai, Fenbi, Indian all-India test series, CAT SimCAT/AIMCAT), (3) official interface simulators (NTA Abhyas, Bluebook, GMAT Official Practice), (4) past-paper compilations organised per institution, per year or per topic (Akahon, Tianli 38 Sets, 5·3, PYQ books), (5) timed Q-bank blocks, and (6) taught in-exam strategy (question order, elimination, negative-marking rules, answer frameworks like PEEL). Key parameters are realism (interface, timing, adaptivity), frequency, how scores are presented (raw, percentile, rank, pass-likelihood band), and whether a review step follows.

### Cited Findings
**T1. Full-length timed mocks.** Method: full timed papers build stamina and timing (#339); Kaplan and Princeton Review sell full-length mocks with courses (#81, #82) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md). Indian mass test series: Testbook (freemium plus Pass, FY24 revenue ₹136.7 crore), Oliveboard, Adda247, BYJU'S Exam Prep — [P1 #177–181](../../reports/Exam%20success%20tools%20and%20methods.md)

**T2. National ranked mocks with percentile or pass-likelihood.**
- Kawaijuku's national mocks grade each target university A–E; secondary Japanese articles give A ≈ 80%+, B 65%, C 50% (borderline), D 35%, E ≤20% chance of passing, computed from past entrance results and applicant trends; about 15% of A-grade students still fail and about 15% of E-grade pass; grades are not comparable across mock providers — [bestjuku](https://bestjuku.com/shingaku/s-article/53563/); [Passnavi (Obunsha)](https://passnavi.obunsha.co.jp/article/keisetsu_jidai/2509/02/?p=2) (exact current Kawaijuku definitions not verified on its official site)
- Fenbi: "mock contests" roughly every two weeks (teacher-exam app), compare with other candidates and find weak spots; predicted score from practice records — [App Store, Fenbi Teacher](https://apps.apple.com/cn/app/%E7%B2%89%E7%AC%94%E6%95%99%E5%B8%88-%E6%95%99%E5%B8%88%E8%B5%84%E6%A0%BC%E8%AF%81%E6%95%99%E5%B8%88%E6%8B%9B%E8%81%98%E5%A4%87%E8%80%83%E7%A5%9E%E5%99%A8/id1071050365). How the national rank is computed was not found.
- India: IMS, TIME, Career Launcher CAT mock series with national percentiles (#186, course plus mock fees); Vision IAS all-India test series (#196; CCPA fines ₹3 lakh Jan 2025 and ₹11 lakh Dec 2025 for misleading topper claims) — [P1](../../reports/Exam%20success%20tools%20and%20methods.md)
- UWorld shows percentile rank against other users; third-party guides warn that percent correct and percentile measure different things and that timed-mode scores run lower than tutor-mode — [UWorld features](https://medical.uworld.com/usmle/features/); [iatroX blog (competitor)](https://www.iatrox.com/blog/what-is-a-good-uworld-percentage)

**T3. Official CBT interface simulators.**
- NTA National Test Abhyas: free computer-based mock tests for JEE Main and NEET on phone or tablet, launched 2020 to familiarise candidates with NTA's CBT; score and rank report after reconnecting, question-wise analysis — [PIB](https://pib.gov.in/PressReleasePage.aspx?PRID=1625181); [Careers360](https://news.careers360.com/neet-jee-main-how-nta-national-test-abhyas-app-helps-prepare-for-exams). Hindi tests added Dec 2025 — [Ministry of Education](https://education.gov.in/node/20438). One App Store user reported an unresponsive backend — [App Store](https://apps.apple.com/in/app/national-test-abhyas/id1521249409)
- NTA mock portal on the same interface (#518); College Board Bluebook and GMAT Official Practice run full adaptive mocks on the real software (#86) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**T4. Past-paper compilations.**
- Akahon 赤本 (Japan): one book per university of past entrance exams with answers; first issued 1954 — [P1 #425](../../reports/Exam%20success%20tools%20and%20methods.md)
- Tianli 38 Sets 天利38套 (China): about 38 full mock and past papers per subject, often by province — [P1 #402](../../reports/Exam%20success%20tools%20and%20methods.md)
- 5·3 (China): real and mock questions sorted by topic (#401); Oswaal CBSE question banks chapter-wise with past board questions (#521); UPSC official past papers free (#454) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)
- Organising choice: per institution (Akahon), per full paper (Tianli), per topic (5·3, Oswaal, PYQ-by-topic books). Only the full-paper format is a rehearsal; topic-sorted books serve retrieval and targeting.

**T5. Timed Q-bank blocks.** UWorld Timed mode — [UWorld features](https://medical.uworld.com/usmle/features/); third-party advice to move from tutor to timed mode by mid-way through dedicated study — [Elite Medical Prep](https://elitemedicalprep.com/uworld-mastery-a-roadmap-for-step-1-success/)

**T6. In-exam strategy.**
- Generic: read the paper, answer known items first, keep checking time, breathe slowly (#142) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)
- Negative-marking rules (UPSC Prelims): one-third of the question's marks deducted per wrong answer (≈0.67 on a 2-mark GS question; ≈0.83 on a 2.5-mark CSAT question) — [Vajiram & Ravi](https://vajiramandravi.com/upsc-exam/negative-marking-in-upsc/). Coaching advice: guess only after eliminating options; blind guessing among four has zero expected value — [Edukemy](https://edukemy.com/blog/how-to-tackle-negative-marking-in-upsc-prelims/); question-order strategy — [IASGyan](https://www.iasgyan.in/blogs/which-questions-to-attempt-first-in-upsc-prelims-2025). Arithmetic check (own): with a one-third penalty and four options, break-even probability is 25%; a 50-50 guess has positive expected value (+0.67 marks on a 2-mark item).
- Answer structures: PEEL (Point, Evidence, Explanation, Link, #510); Disha's *Mastering Essay & Answer Writing* (#226); topper copies to imitate (#195) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

### Inferences
- Design parameters: realism (paper vs exact CBT interface; fixed vs adaptive), length (sectional vs full), frequency (Fenbi about fortnightly; Indian test series typically a fixed schedule of N tests), score display (raw, percentile, all-India rank, pass-likelihood band), and review support (solutions, discussion video, mentor call).
- National ranked mocks are a shared product type in Japan, China and India; Japan alone converts the rank into a per-target-school probability band. India mostly shows rank and percentile; China shows rank and predicted score.
- Official, free simulators exist where a single body runs a CBT (NTA, College Board, GMAC); for UPSC there is no official mock, only past papers.

### Gaps
- Exact rank/percentile computation for Fenbi, Indian test series and NTA Abhyas not documented publicly.
- No source found giving typical Indian test-series mock frequency in a neutral way (only brochures).
- Three-pass method as a named technique not separately sourced this round.

---

## TGT (exam targeting): PYQ frequency analysis, syllabus mapping, setter-linked materials, "few sources", 80/20

### Takeaway
TGT is rarely a product on its own (3 primary, 19 any in P2); it lives inside past-paper books, Q-banks, strategy books and coaching advice. Patterns: (1) PYQ topic-frequency analysis and trend charts, (2) syllabus mapping (tagging every source and question to a syllabus line), (3) setter-linked materials, strongest in Korea where about half of Suneung items are linked to EBS books, (4) "few standard sources, many revisions", and (5) 80/20 prioritisation of topics by marks yield. Also institution-specific targeting (Akahon per university).

### Cited Findings
**G1. PYQ frequency and trend analysis.** Past-paper/PYQ method: solve past papers timed, map the syllabus by topic frequency, analyse errors (#338); *Mission IAS* (Disha) gives exam-trend analysis (#228); Testbook tags TGT secondary (#178); SuperKalam pairs AI grading with PYQ practice (#187); NEET YouTube strategy built on PYQs (#484) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**G2. Syllabus mapping.** AnKing medical deck is mapped to the exam syllabus (#2); *Indian Express* UPSC Essentials maps explainers to the syllabus (#213) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**G3. Setter-linked materials (Korea).**
- EBS–Suneung linkage was cut from 70% to 50% (by item count, per subject area) from the 2022 exam, with a shift to indirect linkage; English linked items all indirect — [Daehak News](https://www.dhnews.co.kr/news/view/179522943035001)
- Indirect linkage means same theme or material rather than reused passages; sources differ on whether direct linkage was abolished entirely — [Daehak News](https://www.dhnews.co.kr/news/view/179522943035001); [Kyunghyang](https://www.khan.co.kr/article/202411141125001)
- EBSi lectures are free; EBS 수능특강 workbooks are low-price — [P1 EBS rows](../../reports/Exam%20success%20tools%20and%20methods.md)
- Board-made model papers: CBSE sample papers plus marking schemes (#519) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**G4. "Few sources, many revisions" and "foundation first".** Revise each subject 3–5 times from a few standard books (#340); NCERT read first (#216); Laxmikanth as a single standard source revised many times (#217) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md)

**G5. 80/20 prioritisation.** Prioritise topics bringing most marks, judged by PYQ frequency (#356) — [P2 appendix](../../reports/Exam%20success%20central%20ideas.md). AMBOSS "High-Yield" mode filters the most exam-relevant facts — [AMBOSS features](https://www.amboss.com/us/features)

**G6. Institution-specific targeting.** Akahon (one book per university) and Kawaijuku pass-likelihood grades per target school — [P1](../../reports/Exam%20success%20tools%20and%20methods.md); [bestjuku](https://bestjuku.com/shingaku/s-article/53563/)

### Inferences
- Design parameters: granularity of tagging (paper, section, syllabus line, micro-topic), years of history used, whether frequency is weighted by marks, and whether new or emerging topics are flagged separately.
- Korea's linkage policy shows that targeting can be built into the exam system itself; when the linkage changed (70% to 50%, direct to indirect), the targeting value of the materials changed with it.

### Gaps
- No neutral source on how Indian apps compute PYQ "frequency" tags or trend charts.
- No sourced documentation of cases where over-targeting on PYQs failed (e.g. UPSC years with unusual papers); widely discussed in coaching circles but not verified here.

---

## Common pitfalls across the five ideas

### Takeaway
Recorded pitfalls cluster into: feedback that stops at a score; numbers with false precision (AI grades, percentiles, pass-likelihood bands); harsh or gameable mastery mechanics; mock-score focus over review; and targeting that depends on the setter keeping the same pattern. Several pitfalls are admitted by the vendors themselves.

### Cited Findings
- Score-only focus: exam wrappers exist because students focus only on their score — [CMU Eberly Center](https://www.cmu.edu/teaching/designteach/teach/examwrappers/)
- AI grader false precision: AI can be consistently wrong in the same direction; consistency is real, accuracy may not be — [AnswerWriting.com (AI vendor)](https://answerwriting.anthroholic.com/ai-answer-evaluation-vs-human-evaluation); calibration claims without published accuracy figures — [PrepAiro](https://prepairo.ai/upsc/llms/upsc-ai-mains-evaluation/)
- Human-marker inconsistency and fatigue — [AnswerWriting.com](https://answerwriting.anthroholic.com/ai-answer-evaluation-vs-human-evaluation); [CollectorBabu](https://collectorbabu.com/upsc-mains-evaluation-platforms-comparison.html)
- Percentile vs percent-correct confusion and tutor-mode inflation in Q-banks — [iatroX (competitor blog)](https://www.iatrox.com/blog/what-is-a-good-uworld-percentage)
- Pass-likelihood bands are probabilistic (≈15% of A-grade fail; ≈15% of E-grade pass) and not comparable across mock providers — [bestjuku](https://bestjuku.com/shingaku/s-article/53563/)
- Mastery mechanics felt as punitive: IXL Challenge Zone (+1–2 / −3–8) — [IXL guide](https://www.ixl.com/materials/SmartScore_Guide.pdf); user reports of bigger drops and a competitor's critique — [Boddle](https://www.boddlelearning.com/article/ixl-punishes-wrong-answers). Khan Academy levels can drop on quizzes and unit tests — [Khan help](https://support.khanacademy.org/hc/tr/articles/5548760867853)
- Setter-linkage risk: Korea's change from 70% direct-heavy to 50% indirect linkage — [Daehak News](https://www.dhnews.co.kr/news/view/179522943035001)
- Misleading results marketing in test series: Vision IAS fined by CCPA twice — [P1 #196](../../reports/Exam%20success%20tools%20and%20methods.md)
- Official tool reliability: NTA Abhyas user report of unresponsive backend — [App Store](https://apps.apple.com/in/app/national-test-abhyas/id1521249409)
- Error notebook apps: subscription and auto-renewal flags; vendor claims unverified — [App Store, 错题plus](https://apps.apple.com/cn/app/id1476015217)
- Interleaving takes more time — [Rohrer and Hartwig](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-spaced-and-interleaved-mathematics-practice-rohrer-hartwig.pdf)

### Inferences
- Error logs nobody revisits: the CMU physics routine (collect wrappers, hand back before the next exam) and the Chinese printer/variant-question loop are both designed answers to this; plain notebooks have no built-in return trigger.
- Mock fatigue and chasing percentiles: the more frequent and ranked the mocks (fortnightly Fenbi contests, all-India test series), the more the design needs a protected review step; most products put the rank first and the review second.
- Over-targeting: frequency-based prioritisation looks backwards; any targeting feature needs a way to flag new question types.

### Gaps
- No primary or independent source found on "mock fatigue" as a measured phenomenon, nor on how often error logs are actually revisited.
- No published audit of any AI grader's agreement with official marks.

---

## Differences across product types and regions

### Takeaway
East Asia turns feedback and rehearsal habits into products (mistake-notebook printers and apps, national mock contests, per-university past-paper books, setter-linked state workbooks). India's market centres on mass mock test series with ranks and, since about 2024, AI Mains graders. US/UK products centre on adaptive K-12 practice with mastery gates and on high-stakes Q-banks with rich explanations; IRT adaptivity is used most where the exam itself is adaptive.

### Cited Findings
- East Asian exam culture turns habits that Indian and global tools leave to the student into products; Zuoyebang sells a printer for the wrong-answer notebook — [P1 regional note](../../reports/Exam%20success%20tools%20and%20methods.md)
- Korea: free state lectures and low-price workbooks tied to the exam (EBSi, 수능특강) — [P1](../../reports/Exam%20success%20tools%20and%20methods.md); [Daehak News](https://www.dhnews.co.kr/news/view/179522943035001)
- Japan: Kawaijuku/Sundai national mocks with per-school pass-likelihood grades; Z-kai correspondence hand marking; Akahon — [P1](../../reports/Exam%20success%20tools%20and%20methods.md)
- China: Fenbi mock contests and predicted scores; error-notebook apps with variant questions — [Fenbi App Store](https://apps.apple.com/cn/app/%E7%B2%89%E7%AC%94%E6%95%99%E5%B8%88-%E6%95%99%E5%B8%88%E8%B5%84%E6%A0%BC%E8%AF%81%E6%95%99%E5%B8%88%E6%8B%9B%E8%81%98%E5%A4%87%E8%80%83%E7%A5%9E%E5%99%A8/id1071050365); [Huawei](https://consumer.huawei.com/cn/support/content/zh-cn16028630)
- India: free official CBT simulator (NTA Abhyas); mass mock apps (Testbook, Oliveboard, Adda247); AI Mains graders (SuperKalam, UPSC AI, PrepAiro, CollectorBabu, Vaidra); free daily answer writing (Insights IAS) — [P1](../../reports/Exam%20success%20tools%20and%20methods.md); [PIB](https://pib.gov.in/PressReleasePage.aspx?PRID=1625181)
- US/UK: ALEKS, Khan Academy, IXL, Sparx, DeltaMath (school-licensed adaptive/mastery); UWorld, AMBOSS (medical Q-banks); GRE/GMAT/DET adaptive tests — sources as cited above.
- P2 type counts: FBK is carried mostly by websites; ADP by apps and websites plus methods; TST spread evenly across apps, websites, courses, books, methods; MIX almost only by books — [P2 section counts](../../reports/Exam%20success%20central%20ideas.md)

### Inferences
- Product type predicts design: school-licensed tools enforce paths (teachers want completion data); adult self-paying exam products give choice plus analytics; books carry MIX and TGT because they need no software; human marking survives where answers are written (UPSC Mains, bar exams, Japanese entrance essays).
- Cost bands (from P1, many unverified): free (NTA Abhyas, Khan Academy, EBSi, exam wrapper templates, error log, official past papers); low (books: Akahon, 5·3, Tianli, EBS workbooks, PYQ books); freemium subscriptions (Testbook, Oliveboard, Fenbi, SuperKalam); institutional licences (ALEKS, Sparx, IXL); premium (Q-banks, test series with human evaluation, full-time cram schools, one-to-one tutoring).

### Gaps
- Regional price comparisons are weak: most prices in P1 are marked unverified.
- Korean 오답노트 products, Japanese Benesse/Sundai mock score displays, and Chinese national rank calculations were not individually verified.
