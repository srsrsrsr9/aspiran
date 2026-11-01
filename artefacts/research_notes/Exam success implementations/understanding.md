# How the "understanding" ideas are implemented: TCH, TUT, ELA, EXM, NOT

Part 3 notes (1 November 2026). Scope: implementation patterns only, no effectiveness verdicts (Part 4). Catalogue numbers (#) refer to the Part 1 master list; mappings and one-line mechanisms come from the Part 2 appendix.

Local sources used throughout:
- [Part 2 report, appendix](../../reports/Exam%20success%20central%20ideas.md) (codes and mechanisms for all 527 entries), cited below as "P2".
- [Part 1 catalogue](../../reports/Exam%20success%20tools%20and%20methods.md) (prices, verification notes), cited below as "P1".
- [Taxonomy v1](../Exam%20success%20central%20ideas/taxonomy_v1.md) (definitions).

Counts from P2: TCH 68 primary / 114 any; TUT 13 / 27; ELA 19 / 75; EXM 8 / 22; NOT 29 / 51.

---

## Q1. TCH (expert teaching and curated content): implementation patterns

### Takeaway
TCH appears in seven patterns: (1) live star-teacher classes, in halls or online; (2) recorded star-teacher video sold as passes; (3) free state-run lectures; (4) classroom coaching as a place; (5) "few sources", the standard-book canon; (6) digests and compilations; (7) audio or text-to-speech delivery. The design choices that separate them are live vs recorded, who picks the content (a star teacher, the state or the exam setter), pacing (batch vs self-paced), and how much practice is built in. Most commercial models pair TCH with tests (TST) or a question bank.

### Cited Findings

**Pattern 1: live star-teacher classes (in halls or streamed)**
- Steps: the learner enrols in a batch; a named teacher lectures to a large live audience on a fixed schedule; support staff or "tutors" handle doubts and homework; tests are given regularly. Examples: Gaotu (#395, "large live classes led by one star teacher, with support tutors"), New Oriental (#397, "star teachers lecture large halls for IELTS, GRE, 考研"), Vedantu (#183, live interactive online classes), Unacademy (#170, star-educator live and recorded classes). — P2
- Gaotu's K-12 subject tutoring stopped under China's Double Reduction policy (2021); it now offers adult and non-academic courses. — P1 (row for Gaotu, "BK" = background knowledge, not web-verified)
- Korea's top lecturers are called *ilta* ("No. 1 star"). Their pay comes from several streams: up-front exclusive retainers, a share of lecture revenue, and textbook sales. — [Korea JoongAng Daily](https://www.koreajoongangdaily.com/lifestyle/star-instructors-teach-thousands-earn-millions/11728762); [Korea Herald](https://www.koreaherald.com/article/3059340)
- The Korea Herald reports that star instructor Lee Ji-young disclosed annual income of over ₩10bn in salary alone (2020). Other income figures in the press are estimates from "industry insiders" and vary. — [Korea Herald](https://www.koreaherald.com/article/3059340); [Tenasia on Jeong Seung-je](https://www.tenasia.com/tv/2023090679754)
- Korean private-education spending was ₩27.5tn in 2025 (Statistics Korea and the Ministry of Education, as reported in search results; the original release was not fetched). — [Korea Herald](https://www.koreaherald.com/article/3059340)

**Pattern 2: recorded star-teacher video sold as passes or subscriptions**
- Steps: lectures are recorded once and sold to many learners, either per course or as all-you-can-watch passes; the learner sets the pace; question drills are often bundled. Examples: Megastudy (#408) and Etoos (#409) for the Suneung; Gongdangi (#412, "unlimited-viewing lecture passes for civil-service exams"); Hackers (#413, lectures plus question-pattern drills); Study Sapuri (#419, "cheap flat-rate video lessons from star teachers"); Outlier.org (#292, US, high-production lectures); PhysicsWallah (#173, "low-fee courses fed by mass free YouTube lectures"). — P2
- Hybrid place and video model: Toshin High School (#421) broadcasts star teachers' video lectures to franchise centres, so the learner watches recorded lectures inside a supervised physical centre. — P2; P1
- Study Sapuri is reported at ¥2,178 a month including tax (about ¥1,815 a month if paid for 12 months), with a 14-day free trial. Its lessons are short: about 10 minutes at high-school level, about 5 at middle school and 15 at primary. Source: comparison sites that may carry advertising. — [coeteco.jp](https://coeteco.jp/articles/12896); [study-search.jp](https://study-search.jp/columns/116)
- Economics of recording: once a star instructor records a course, the platform can sell it to a near-unlimited audience at almost no extra cost per learner. This claim comes from seoulz.com, an unverified site. — [seoulz.com](https://www.seoulz.com/korea-star-teachers/amp/)
- Market concentration: Korea's Fair Trade Commission blocked Megastudy's purchase of ST Unitas (Gongdangi's owner) on 21 March 2024. — P1 (citing Daum/Yonhap)
- Free-to-paid funnel (India): StudyIQ (#180) and the UPSC YouTube channels (#232) run "free mass lectures" that "funnel viewers to paid courses". — P2

**Pattern 3: free state-run lectures**
- EBSi (#410, Korea) offers free state-broadcaster lectures tied to the EBS Suneung workbooks (#411). The design lever is exam linkage: the setters draw a share of questions from EBS material. — P2; P1
- The linkage rate was cut from about 70% to 50% and made indirect from the 2022 Suneung. In the June 2026 mock it held at about 50% by question count (English 55.6%, Korean 53.3%). — [Herald Biz](https://biz.heraldcorp.com/article/10776287); [Herald Biz, difficulty explanation](https://biz.heraldcorp.com/article/10776117)
- India: SATHEE (#460, IIT Kanpur) offers free lectures, quizzes, mocks and NCERT notes in 12 languages. SWAYAM (#525) and NPTEL (#462) are free university courses with proctored certificate exams. IIT-PAL (#461) has IIT professors' lectures for classes 11 and 12. DIKSHA (#458) has textbook-linked videos. ePathshala (#459) has free NCERT e-textbooks with read-aloud. — P2; P1

**Pattern 4: classroom coaching as a place**
- Steps: daily in-person classes in a batch, with regular test series and a peer environment. Examples: Aakash (#184), Allen (#185, "Kota-model intensive classroom drilling plus tests"), Vajiram & Ravi (#201), Kawaijuku and Sundai (#422, full-time rōnin courses plus national mocks), SAPIX and Yotsuya Otsuka (#423, students grouped by ability), Huatu (#393) and Offcn (#394, China; Offcn's "protocol classes" refund the fee if you fail). Coaching districts such as Mukherjee Nagar, Old Rajinder Nagar, Kota (#235) and Noryangjin (#415) turn TCH into an immersive place (SPC). — P2

**Pattern 5: "few sources", the standard-book canon**
- Steps: the learner picks one standard book per subject and revises it many times. Examples: NCERT textbooks (#216, "foundation texts read first"), Laxmikanth (#217), Spectrum (#218), Nitin Singhania (#222), Wren & Martin (#230), Lucent GK (#524). The method entry "Multiple revision cycles with limited sources" (#340) says: revise each subject 3 to 5 times from a few standard books. — P2
- *Concepts of Physics* by H C Verma (#523) mixes theory with many worked and practice problems; it is coded ELA with EXM as a secondary. — P2

**Pattern 6: digests, compilations and daily news**
- Monthly current-affairs compilations (#215: Vision, Drishti, Insights, Rau's Compass, StudyIQ) "compress current affairs for revision". Others: Pratiyogita Darpan (#453), GKToday (#452), *Bharat* yearbook (#527), PIB (#214, primary-source releases), The Hindu and Indian Express "UPSC Essentials" (#212, #213). — P2
- Design choice: the digest is pre-made notes written by someone else, so it overlaps with NOT (#215 lists NOT and SPA as secondaries). — P2

**Pattern 7: audio and text-to-speech delivery**
- Speechify (#493) and NaturalReader (#494) read documents aloud. P2 codes them as BAS (default habit: passive re-reading), with TCH as a secondary. ePathshala (#459) has read-aloud for NCERT books. — P2

**Pattern 8: teaching principles that shape instruction**
- Rosenshine's *Principles of Instruction* (#242): small steps, guided practice, daily and weekly review. CAST UDL Guidelines (#241): multiple means of engagement and representation. — P2

**Cost range**
- Free (EBSi, SATHEE, SWAYAM, NPTEL, YouTube), low flat-rate (Study Sapuri about ¥2,178 a month), course fees (Indian coaching), premium passes (Korean ingang). — P1; [coeteco.jp](https://coeteco.jp/articles/12896)

### Inferences
- The main design axis is not live vs recorded but who controls pace and selection. Live batches set the pace for the learner. Recorded passes hand pace to the learner, and with it the risk of binge-watching or falling behind. Toshin's centre model puts back the supervision that pure video loses.
- The state and commercial versions converge: both use recorded lectures, but the state version gains its pull from an exam link (EBS) or from free access and language coverage (SATHEE), not from teacher celebrity.
- "Few sources" and digests are TCH as curation: the value is someone else deciding what is enough. This links TCH to TGT (exam targeting).

### Gaps
- I did not verify current prices of Megastudy or Etoos passes, or Indian classroom coaching fees, this round.
- I found no reliable source on how much of a recorded course learners actually finish, for any platform.
- OpenAI, Google and others' AI "audio overview" lecture formats (e.g. NotebookLM, #52, coded GEN) were not researched here.

---

## Q2. TUT (tutoring and mentoring, human or AI): implementation patterns

### Takeaway
There are six patterns: (1) Socratic AI study modes in general chatbots; (2) purpose-built AI tutors that refuse answers; (3) AI teachers that explain and then check; (4) human one-to-one tuition; (5) on-demand doubt-solving with a human, matched in seconds; (6) mentorship programmes, including near-peer mentors. The key design parameter is when, or whether, the answer is revealed. The general chatbots can be switched off by the student at will. Purpose-built tutors such as Khanmigo build the refusal into the product.

### Cited Findings

**Pattern 1: Socratic study modes in general chatbots (free tier, toggled by the user)**
- ChatGPT Study Mode (#49) launched on 29 July 2025. It is "powered by custom system instructions" written with teachers, scientists and pedagogy experts. OpenAI chose this approach so it could learn quickly from student feedback, accepting some inconsistency, and plans to build the behaviour into its core models later. Users can toggle it on and off during a conversation. — [Tom's Guide](https://www.tomsguide.com/ai/chatgpt-just-added-a-powerful-new-study-mode-heres-how-it-can-help-you-learn-faster); [Geekflare](https://geekflare.com/news/chatgpt-gets-a-study-mode-key-things-to-know) (the OpenAI page itself returned 403 when fetched)
- There are no admin or parent controls to lock students into Study Mode. — [implicator.ai](https://www.implicator.ai/openai-unveils-study-mode-to-curb-cheating-and-reclaim-trust-in-the-classroom/)
- Gemini Guided Learning (#50) launched on 6 August 2025. Its design: probing, open-ended questions; problems broken into steps; explanations adapted to the learner; images, diagrams, videos and interactive quizzes. It is built on LearnLM, Google's education-tuned models, now in Gemini 2.5. Google says it found that "better prompting alone" did not make a meaningful learning tool, which led it to a model-level approach. Teachers can share a dedicated link in Google Classroom. — [Google blog](https://blog.google/outreach-initiatives/education/guided-learning/)
- Reviewers' criticisms of Guided Learning: it relies too heavily on questions, which limits deeper exploration, and it sometimes loses track of the conversation. — [TechCrunch](https://techcrunch.com/2025/08/06/google-takes-on-chatgpts-study-mode-with-new-guided-learning-tool-in-gemini/); [Tom's Guide](https://www.tomsguide.com/ai/google-gemini/google-geminis-guided-learning-feature-makes-ai-actually-check-if-you-understand-heres-how-it-works)
- Claude Learning mode (#51) launched on 2 April 2025 inside Claude for Education Projects. It asks "How would you approach this problem?" and "What evidence supports your conclusion?", emphasises core concepts and offers templates for research papers, study guides and outlines. Launch partners: Northeastern (50,000 users), LSE, Champlain College; Canvas integration through Instructure. — [Anthropic](https://www.anthropic.com/news/introducing-claude-for-education)
- A later report says learning mode became available to all users through a dropdown, and that Claude Code's "Learn" mode pauses and asks the user to complete "#TODO" sections. This is a secondary report not checked against Anthropic. — [hyper.ai](https://hyper.ai/en/stories/680c57a611325d75521fb2267efa9a0a)

**Pattern 2: purpose-built AI tutors that refuse answers**
- Khanmigo (#53) uses Socratic questions and hints and withholds final answers by design. — [khanmigo.ai learners page](https://khanmigo.ai/learners); [kidsaitools review](https://www.kidsaitools.com/en/articles/review-khan-academy-khanmigo)
- Price: about $4 a month or $44 a year for learners (US only, per a Khan support page). Free for teachers in eligible countries (philanthropy-funded). District plans are reported at $10 to $15 per student per year (sources disagree). — [softwarefinder](https://softwarefinder.com/artificial-intelligence/khanmigo-ai); [Khan support (fr)](https://support.khanacademy.org/hc/fr/articles/25921448458893)
- Usage problem: Khan Academy leaders have acknowledged low use. One summary attributes this to students not knowing what to ask, and to the Socratic design needing some prior knowledge. — [guyonai substack, "After Khanmigo"](https://guyonai.substack.com/p/after-khanmigo) (a blog, so treat with caution)
- India: NDLI-FERMI AI Tutor (#463, IIT Kharagpur) gives guided Socratic hints instead of answers, with "Scan & Ask" for physics, chemistry, maths and biology. It is free for registered NDLI users. — P1 (citing Careers360)
- Medical: Lecturio (#76) adds a Socratic AI tutor to its lectures; Osmosis (#77) has a conversational AI companion; iatroX (#78) offers AI tutoring with practice questions. — P2

**Pattern 3: AI teacher that explains, then checks (explanation-first)**
- JEET AI (#464, Extramarks, India): an AI teacher explains on a virtual board, asks check questions and adapts; from ₹1,499 a month. — P1 (Outlook Business press release, Oct 2026)
- PadhAI (#188, UPSC): AI tutor plus news summaries and Prelims questions. — P2
- Contrast: photo-solvers give the full worked answer at once. Photomath (#60), QANDA (#407) and Zuoyebang (#87) are coded OFF (answer lookup), with TUT or ELA only as secondaries. — P2

**Pattern 4: human one-to-one tuition**
- OneSmart (#406, China): premium one-to-one tutoring adjusted to each student. Yuanfudao (#88, China): tutoring app for K-12 and the gaokao. Kaplan and The Princeton Review (#81, #82) bundle tutoring with mocks. — P2

**Pattern 5: on-demand doubt-solving with human tutors**
- Filo: the student photographs or types a question and is matched with a tutor, which the company says takes 60 seconds. Matching reportedly weighs about 25 parameters (language, topic, difficulty, location). Tutors join through screening tests. These are company-sourced claims, and pricing descriptions conflict. — [Google Cloud customer story](https://cloud.google.com/customers/filo); [Entrepreneur India](https://india.entrepreneur.com/news-and-trends/building-real-time-connections/429840)
- Xueba Jun (#405, China) began as photo-search and later added one-to-one tutoring. — P2

**Pattern 6: mentorship programmes and near-peer mentors**
- Edukemy (#192, India): mentorship plus courses and AI answer evaluation. CivilsDaily (#194): mentor-led Telegram study groups. Vaidra (#456): "AI mentor" plus Mains evaluator and study plans. — P2
- Gongsin (#432, Korea): study-method videos and mentoring by top-university students; founded by Kang Sung-tae; a social enterprise since 2008. — P1 (citing DH News)
- Studyplus for School (#431, Japan): teachers see students' study logs and message them, a light-touch mentoring channel. — P2
- Apprenticeship as a model: Greene's *Mastery* (#284). — P2

### Inferences
- The answer-withholding gradient runs from "never gives the final answer" (Khanmigo, FERMI), through "guides by default but the student can switch it off" (ChatGPT, Gemini, Claude), to "explains first, then checks" (JEET AI), to "gives the full solution" (photo-solvers, OFF). Withholding is enforced only where the product, not the student, controls the mode.
- The general-chatbot modes made Socratic AI tutoring free. Paid AI tutors therefore differentiate on syllabus grounding (exam-specific content), language, or human backup.
- Human mentoring in exam markets is mostly about strategy and accountability (what to read, a weekly plan, answer reviews), not concept tutoring. Concept tutoring is where AI substitution is most direct.

### Gaps
- I could not fetch OpenAI's own study-mode page (403), so the details come from secondary coverage of the launch.
- I found no primary source describing how any study mode decides when to finally reveal an answer after repeated student attempts.
- Human tuition prices in India, Korea and Japan were not researched.

---

## Q3. ELA (understanding and elaboration): implementation patterns

### Takeaway
ELA mostly exists as named methods that the learner runs alone. There are six families: (1) question-asking prompts (elaborative interrogation, QFT); (2) explaining steps (self-explanation, Feynman, teach-back); (3) concrete examples and dual coding; (4) concept maps; (5) structured reading frameworks (SQ3R, PQ4R, PQRST, THIEVES, KWL, Adler); (6) interactive explorables and visual tools. Products rarely implement ELA as the main feature. It shows up inside AI study modes (the "why" questions), explorable maths sites, and textbooks.

### Cited Findings

**Pattern 1: question-asking prompts**
- Elaborative interrogation (#303): ask "why is this true?" and link the idea to prior knowledge. — P2
- The Learning Scientists' advice: connect new material to what you know, apply it to your own experiences, and describe how two concepts are similar and different. Explaining, describing and outlining are distinct tasks. — [Learning Scientists podcast ep. 15](https://www.learningscientists.org/learning-scientists-podcast/2018/3/21/episode-15-how-students-can-use-interleaving-elaboration-dual-coding-and-concrete-examples)
- Question Formulation Technique (#508): learners produce, improve and rank their own questions. — P2

**Pattern 2: explaining steps to yourself or to an imagined learner**
- Self-explanation (#304): explain each step of a text or a solved problem to yourself. — P2
- Feynman technique (#326): explain simply to an imagined beginner, find where you get stuck, return to the source, simplify. The name came from Scott H. Young's blog (September 2011) and was spread by Farnam Street; Feynman never set out the steps. Untested as a named system. — P1 (citing learning.subwiki)
- Teach-back (#359) and reciprocal teaching (#361) put the explaining step into a group (GRP). — P2

**Pattern 3: concrete examples and dual coding**
- Concrete examples (#305): tie an abstract idea to several varied examples. Dual coding (#306): pair words with meaningful visuals such as timelines and flowcharts. — P2
- Learning Scientists' formats for dual coding: infographics, timelines, cartoon strips, diagrams, graphic organisers. The benefit is said to come from the learner actively connecting images and text. — [Learning Scientists podcast ep. 15](https://www.learningscientists.org/learning-scientists-podcast/2018/3/21/episode-15-how-students-can-use-interleaving-elaboration-dual-coding-and-concrete-examples); [Edinburgh blog summary](https://blogs.ed.ac.uk/pameladocherty/2019/02/18/six-effective-learning-strategies-from-the-science-of-learning/)

**Pattern 4: concept maps**
- Concept mapping (#336): nodes joined by labelled links make relationships explicit. It differs from a mind map (#335, NOT), which uses radial keyword branches. Tools that carry both: Miro (#129), Heptabase (#125), Scrintal (#130), LiquidText (#132, which links PDF excerpts while reading). — P2

**Pattern 5: structured reading frameworks (step sequences)**
- SQ3R (#330): Survey, Question, Read, Recite, Review. Headings become questions and you recite from memory. SQ4R and PQ4R (#331) add a Reflect step that links to prior knowledge. PQRST (#332): Preview, Question, Read, Summarise, Test. — P2
- THIEVES (#507): preview Title, Headings, Introduction, Every first sentence, Visuals and vocabulary, End questions, Summary. Suzanne Liff Manz, *The Reading Teacher*, 2002. — P1
- KWL (#506): Know, Want to know, Learned columns. Donna Ogle, *The Reading Teacher*, 1986, drawing on schema theory. Variants: K-W-L Plus (Carr and Ogle 1987, adds summarising) and KWHL ("How will I find out?"). — [Wikipedia, KWL table](https://www.wikipedia.org/wiki/KWL_table); [Creately guide](https://creately.com/guides/kwl-graphic-organizer/) (secondary sources; the 1986 citation volume and issue are given as 36(6) in one source, which I could not check)
- *How to Read a Book* (#497): four levels of reading; question the book and pin down its argument. — P2
- Note: the "R" (Recite) and "T" (Test) steps in these frameworks are retrieval (RET). P1 calls them "flavours" of retrieval and spacing. — P1 line 550

**Pattern 6: interactive explorables and visual tools**
- GeoGebra (#443) and Desmos (#444) make graphs and geometry you can manipulate. Mathigon (#489) has interactive explorable courses. Brilliant (#69) teaches concepts through interactive problems. — P2
- AI study modes count ELA as their main secondary (#49 to #51, #53, #463). — P2

**Pattern 7: ELA built into textbooks**
- H C Verma (#523): theory plus worked and practice problems. G.C. Leong (#221): concept base for physical geography. Mrunal.org (#209): plain-language economy explainers. — P2

**Cost**: methods are free; explorables are mostly free (GeoGebra, Desmos); Brilliant is a subscription (price not checked here). — P1

### Inferences
- ELA has no single dominant product form because it is an activity of the learner's own mind. Products can only prompt it (questions, blank fields, manipulables). AI study modes are now the most widespread prompt for it.
- The reading frameworks differ mainly in where they put the question step (before reading in SQ3R and KWL, as a preview in THIEVES) and whether they end with a self-test (PQRST) or a reflection (PQ4R).

### Gaps
- I did not find usage data for any ELA method or tool.
- I found no product that prompts self-explanation inside a video lecture or a PDF reader, apart from AI chat. Edpuzzle (#492) inserts questions into videos but is coded RET.

---

## Q4. EXM (worked examples and model answers): implementation patterns

### Takeaway
EXM has four patterns: (1) problem-type-to-method books (수학의 정석, チャート式, R.S. Aggarwal) in which every problem type has a solved model; (2) faded worked examples, where solution steps are removed one at a time; (3) topper answer copies and model answers for essay-type exams; (4) topper strategy books and interviews. The key design parameter is when the learner tries the problem: before seeing the model (attempt then compare) or after (study then imitate). P2 notes that no app is built around EXM; books carry it.

### Cited Findings

**Pattern 1: problem-type-to-method books**
- 수학의 정석 (*The Art of Mathematics*, #417, Korea): exhaustive problem types, each with a worked method. First edition 31 August 1966; estimates of 37 to 45 million copies sold. — P1 (citing Asia Today)
- チャート式 (Chart-shiki, #424, Japan): colour-coded levels (white, yellow, blue, red) map each problem type to its method. The January 2026 edition adds explanation videos. — P1
- R.S. Aggarwal *Quantitative Aptitude* (#465): solved examples, then exercises per topic. Its *Reasoning* book (#466) is coded RET with EXM as a secondary. — P2
- Typical steps: read the solved example for a type, try the matching exercises, look up the method by recognising the problem type.

**Pattern 2: worked examples with fading**
- Worked examples and cognitive load theory (#307): study a solved problem, attempt a similar one, fade the support. — P2
- Backward fading: start with a fully worked example, then leave out the last step, then the last two, and so on, until the learner solves the whole problem. Renkl, Atkinson, Maier and Staley (2002) compared forward and backward fading. — [Renkl & Atkinson, Exp Rev (ASU)](https://faculty.engineering.asu.edu/mre/wp-content/uploads/sites/31/2020/02/Exp_Rev_LI06.pdf); [structural-learning.com](https://www.structural-learning.com/post/worked-examples)
- Adaptive fading removes steps according to the student's performance, not on a fixed schedule. — [ASU paper](https://faculty.engineering.asu.edu/mre/wp-content/uploads/sites/31/2020/02/MoRO09.pdf) (cited in search summary; full text not read)
- The IES practice guide (#243) includes worked examples among its seven recommendations. — P2

**Pattern 3: topper copies and model answers (essay-type exams)**
- theiashub (#195) has a library of toppers' answer copies to imitate; it keeps year-by-year pages for 2023 to 2025. — P2; [theiashub 2025](https://theiashub.com/toppers/upsc/2025)
- "Daily answer writing with feedback (modelled on topper copies)" (#341): write an answer daily, compare it with toppers' copies, get it evaluated. — P2
- Recommended routine from coaching blogs: attempt the same question yourself first without looking; compare to find gaps, not phrases to copy; study structure, diagrams and examples; rewrite your weakest part; keep a log of recurring errors. — [NEXT IAS blog](https://www.nextias.com/blog/how-to-use-upsc-toppers-copies-effectively/); [CivilsDaily](https://www.civilsdaily.com/what-i-learned-after-reading-100-topper-copies/) (coaching sources, not UPSC)
- Coaching institutes host their own topper-copy pages (Vajirao, Shankar IAS, SPM IAS), which also act as marketing. — [Vajirao](https://vajiraoinstitute.com/toppers-answer-copy.aspx); [SPM IAS](https://spmiasacademy.com/upsc-topper-answer-copies/)
- ForumIAS (#199) and Vajiram & Ravi (#201) list EXM as a secondary through topper-strategy pages. — P2

**Pattern 4: topper strategy books and interviews**
- *The Secret Code of UPSC Toppers* (#224), *UPSC Files* (#225, "explicitly no shortcuts"), *How to Top UPSC Civil Services* (#227), *Mission IAS* (#228). Mrunal's free topper-interview PDFs (#209). Gongsin (#432) top-student mentors. Reddit officer AMAs (#233). — P2

**Cost**: books are cheap paperbacks; topper copies are free online (often on coaching sites); evaluation programmes cost course fees. — P1

### Inferences
- In maths, EXM is about procedure (type, then method). In essay exams, it is about format and coverage (structure, demand words, diagrams). The second is harder to imitate well, because the topper's reasoning is not visible in the final copy.
- "Attempt first, then compare" turns a model answer into feedback (FBK), while "read first, then imitate" stays pure EXM. Coaching advice for UPSC pushes the attempt-first order.

### Gaps
- I found no app built around faded worked examples for exam prep, which confirms P2's note but is not proof of absence.
- I did not verify whether topper copies are published with UPSC's or the candidates' permission, or how complete they are.

---

## Q5. NOT (note-making and organising knowledge): implementation patterns

### Takeaway
NOT has eight patterns: (1) page-format systems (Cornell, outline, charting, boxing); (2) mind maps; (3) linked atomic notes (Zettelkasten, Roam, Obsidian, Logseq); (4) folder or project systems (PARA, second brain, progressive summarisation); (5) condensed final-revision notes; (6) digital handwriting notebooks; (7) notes that become flashcards; (8) shared or bought notes, and AI note-takers. The key parameters are who writes the notes (you, a peer, a coach, an AI), the unit (page, card, map, folder), whether a self-test step is built in, and whether the notes link to each other.

### Cited Findings

**Pattern 1: page-format systems**
- Cornell notes (#333): split the page into a cue column (left), a notes area (right) and a summary strip (bottom). Developed by Walter Pauk at Cornell in the 1950s, in *How to Study in College* (1962). Sources differ on timing: write cues during class, or leave the column empty and fill it soon after. Review routine: cover the notes column, recite from the cues in your own words, then check. — [UW–Eau Claire](https://www.uwec.edu/sites/default/files/documents/Cornell-System-Overview.pdf); [College of the Desert](https://www.collegeofthedesert.edu/_web-items/documents/pdf-files/academic-skills-center/cornell-notes.pdf); [Univ. of Cincinnati](https://www.uc.edu/campus-life/learning-commons/learning-resources/notetaking-resources/cornell-method-notes.html)
- Cornell templates exist in GoodNotes, Notion and on paper (#333, #123). Other formats: outline, charting, boxing, sentence, flow and mapping (#334). — P2

**Pattern 2: mind maps**
- Mind mapping (#335, Tony Buzan, *Use Your Head*, BBC 1974): radial keyword branches from a centre; the strongest version is redrawn from memory. Apps: XMind (#127), MindNode (#126), MindMeister (#128), Traverse (#13, mind-map notes with cloze cards on a spaced schedule). iCanStudy (#288) uses mind maps for first-pass encoding. — P2

**Pattern 3: linked atomic notes (Zettelkasten family)**
- Zettelkasten (#337, Sönke Ahrens, *How to Take Smart Notes*, 2017): atomic notes in your own words, with IDs, linked to related notes. — P2
- Ahrens's note types are fleeting, permanent and project notes. Fleeting notes are meant to be rewritten as permanent notes within a day or two and then discarded. Literature notes sit ambiguously, often in a reference manager such as Zotero. — [Zettelkasten forum](https://forum.zettelkasten.de/discussion/comment/14188/)
- Apps: Obsidian (#121, with SM-2 or FSRS plugins), Logseq (#9, outliner with backlinks; marked blocks become FSRS cards), Roam and Zettlr (#131), ZKMemo (#17), SiYuan (#10), Heptabase (#125), Scrintal (#130). — P2

**Pattern 4: folder or project systems and progressive summarisation**
- *Building a Second Brain* (#283, Tiago Forte, 2022): the CODE workflow, PARA folders (Projects, Areas, Resources, Archives) and progressive summarisation. — P2; [toolfinder](https://toolfinder.com/stacks/tiago-forte)
- Progressive summarisation works in layers: the captured note, then bolded passages, then highlighted passages within those, then an executive summary. Not every note needs every layer. — [Forte Labs guidelines](https://fortelabs.com/blog/progressive-summarization-iii-guidelines-and-principles/); [web-highlights](https://web-highlights.com/blog/the-art-of-summarization-tiago-fortes-progressive-highlighting-2-0-technique-in-action/)
- Notion (#117) holds notes alongside syllabus and revision-tracking databases. *The Organized Mind* (#499) argues for offloading information to external systems. Google Keep (#448) is used for quick notes. — P2

**Pattern 5: condensed final-revision notes**
- Note compression (#342, UPSC topper method): cut notes from about 100 pages to 25 or 30 before the exam. — P1 (citing Edukemy AIR 32 blog)
- Summarisation (#314): write condensed summaries of what was read. — P2
- Japan's memorisation pen and red sheet (#426): key terms are written in orange ink that vanishes under a red sheet for self-testing. It is coded RET with NOT as a secondary, so the notes double as a quiz. — P2

**Pattern 6: digital handwriting notebooks**
- GoodNotes (#123: handwriting on PDFs, Cornell templates, flashcards), Notability (#124: handwritten notes synced to lecture audio), OneNote (#122). Handwriting vs typing (#379): hand notes force paraphrase over verbatim transcription. — P2

**Pattern 7: notes that become flashcards**
- RemNote (#8): notes and PDF highlights become FSRS-scheduled cards. Mochi (#5): Markdown notes become cards. SuperMemo (#3): incremental reading. P2 counts 11 entries where NOT travels with SPA and RET. — P2

**Pattern 8: notes written by others, and AI note-takers**
- Clearnote (#433, Japan, free): students post photos of their handwritten notes, browse others' and ask questions. — P1
- Coaching notes and compilations: CivilsDaily (#194, "XFactor Notes"), monthly CA compilations (#215), Anthroholic optional notes (#191). — P2
- AI note-takers: Coconote (#57: recorded lectures become notes automatically), Turbo AI (#55), Scholarly (#31), StudyFetch (#54). All are coded GEN, with NOT as a secondary. — P2

### Inferences
- The patterns split on one question: is the note a product (something to keep and organise, as in PARA and Notion) or a process (something whose writing is the learning, as in Cornell cues, own-words Zettelkasten and redrawing mind maps from memory)? Exam-oriented variants (Cornell, red sheet, note compression, notes-to-cards) build in a self-test or a shrinking step. Knowledge-management variants (PARA, second brain) do not.
- AI note-takers and bought notes move authorship away from the learner. That is the same shift OFF and GEN describe.

### Gaps
- I did not fetch Forte's own PARA article or Ahrens's book text; the definitions above come from Forte Labs posts and forum or secondary summaries.
- No usage or adoption data for Cornell or Zettelkasten among exam candidates was found.

---

## Q6. Common implementation pitfalls

### Takeaway
Each idea has a known failure mode, and they share a root: the activity feels like learning while the learner's own thinking is skipped. The failure modes are passive watching with a fluency illusion (TCH), AI that gives answers or is switched off (TUT), questions without your own construction (ELA), copying a model's format without its reasoning (EXM), and collecting or over-organising instead of studying (NOT).

### Cited Findings
- **Fluency illusion in lectures (TCH).** In Carpenter, Wilford, Kornell and Mullaney (2013), students who watched a fluent instructor predicted they would remember more than those who watched a halting one, but recall did not differ significantly. Carpenter warned this does not mean lecture style is unimportant. — [Princeton record](https://collaborate.princeton.edu/en/publications/instructor-fluency-leads-to-higher-confidence-in-learning-but-not/); [BPS Research Digest](https://digest.bps.org.uk/2013/05/14/engaging-lecturers-can-breed-overconfidence/); [Chronicle](https://www.chronicle.com/article/smooth-lectures-foster-only-the-illusion-of-learning-study-finds/)
- **Funnel content (TCH).** Free YouTube lectures are designed to "funnel viewers to paid courses" (#180, #232). — P2
- **Text-to-speech as passive re-reading (TCH).** P2 codes Speechify (#493) and NaturalReader (#494) as BAS (default habit). — P2
- **AI tutors that give answers, or can be switched off (TUT).** ChatGPT Study Mode can be toggled off at will and has no admin lock. — [implicator.ai](https://www.implicator.ai/openai-unveils-study-mode-to-curb-cheating-and-reclaim-trust-in-the-classroom/). Photo-solvers deliver full worked steps (#58, #60, #407, #488; Mathway's steps are paywalled). — P2
- **The opposite failure: Socratic friction and low uptake (TUT).** Khanmigo had low usage; students did not know what to ask, and the design assumes some prior knowledge. — [guyonai substack](https://guyonai.substack.com/p/after-khanmigo). Guided Learning is criticised for over-questioning and losing track of the conversation. — [TechCrunch](https://techcrunch.com/2025/08/06/google-takes-on-chatgpts-study-mode-with-new-guided-learning-tool-in-gemini/)
- **OpenAI accepts inconsistency (TUT).** Using system instructions rather than training means behaviour may vary. — [Geekflare](https://geekflare.com/news/chatgpt-gets-a-study-mode-key-things-to-know)
- **Pictures or questions supplied rather than built (ELA).** Dual coding works through the learner's own process of connecting images and text, and the student has to construct their own interrogation. — [Learning Scientists podcast ep. 15](https://www.learningscientists.org/learning-scientists-podcast/2018/3/21/episode-15-how-students-can-use-interleaving-elaboration-dual-coding-and-concrete-examples)
- **Untested branding (ELA).** The Feynman technique was named in 2011 and is untested as a named system. — P1
- **Imitating topper answers without understanding (EXM).** Coaching sources call copying format without understanding the reasoning "the biggest mistake". They also warn against memorising toppers' intros and conclusions as templates, and say topper copies are a reference, not a full strategy. — [NEXT IAS](https://www.nextias.com/blog/how-to-use-upsc-toppers-copies-effectively/); [SuperKalam](https://blog.superkalam.com/blog/crack-upsc-with-toppers-notes-and-answer-copies-a-complete-guide)
- **Collector's fallacy (NOT).** Gathering material feels rewarding in itself, but knowing *about* a text is not knowing it. — [zettelkasten.de](https://zettelkasten.de/posts/collectors-fallacy/)
- **Highlighting as pseudo-note-making (NOT).** Highlighting (#316) is coded BAS: "selection without retrieval or reorganising". Readwise (#14) resurfaces highlights for re-reading, not recall. — P2
- **Verbatim transcription (NOT).** Typed notes allow verbatim copying, while hand notes force paraphrase (#379). — P2
- **Over-organising (NOT).** I found no primary source quantifying "productivity procrastination" in note systems. Forte's own guidance that not every note needs every summarising layer is the nearest designer-side warning. — [Forte Labs](https://fortelabs.com/blog/progressive-summarization-iii-guidelines-and-principles/)

### Inferences
- The design remedies products use mirror the pitfalls. Against passive watching: questions inserted into videos (Edpuzzle, #492) and bundled tests. Against answer-giving: refusal modes and hint ladders. Against copying model answers: "attempt first" routines and evaluation. Against note hoarding: compression and notes-to-cards.

### Gaps
- No independent data on how often students switch off AI study modes.
- No data on binge or completion behaviour for unlimited lecture passes.

---

## Q7. Differences across product types and regions

### Takeaway
East Asia turns TCH into an industry of celebrity lecturers and long-lived problem-type books. India runs TCH through coaching hubs, a standard-book canon, a free state layer and free-YouTube-to-paid funnels, and builds EXM around topper copies for essay exams. The US and UK lean on learning-science methods (ELA), AI tutors (TUT) and networked-note apps (NOT). AI tutoring became a free commodity worldwide in 2025.

### Cited Findings
- **Korea:** ilta star lecturers, unlimited-pass platforms, a free state alternative (EBSi) with about 50% exam linkage, and the 1966 수학의 정석 still central. Near-peer mentoring (Gongsin). — P1; [Herald Biz](https://biz.heraldcorp.com/article/10776287); [Korea JoongAng Daily](https://www.koreajoongangdaily.com/lifestyle/star-instructors-teach-thousands-earn-millions/11728762)
- **Japan:** video lectures broadcast into franchise centres (Toshin); low flat-rate apps (Study Sapuri); colour-coded Chart-shiki; rōnin-year yobikō (Kawaijuku, Sundai); shared handwritten notes (Clearnote); the red-sheet note-quiz. — P1; P2
- **China:** star-teacher big live classes (Gaotu, New Oriental), now restricted for K-12 by Double Reduction; premium one-to-one tutoring (OneSmart); civil-service chains with refund-if-you-fail "protocol classes" (Offcn). — P1; P2
- **India:** coaching hubs (Kota, Mukherjee Nagar); the "few sources" canon (NCERT, Laxmikanth); monthly compilations; a free state layer (SATHEE in 12 languages, SWAYAM, NPTEL, DIKSHA); free AI tutors from IITs (FERMI); topper copies and strategy books as EXM; mentorship sold for strategy and accountability. Paid UPSC products compete on feedback and structure because the free tier is huge. — P1 (line 353); P2
- **US and UK:** mastery video platforms (Khan Academy #65, Up Learn #70), purpose-built AI tutors (Khanmigo), named learning-science methods spread through The Learning Scientists (#237) and university learning centres (Cornell guides), networked-note apps. — P2
- **AI chatbots (global):** ChatGPT, Gemini and Claude all launched Socratic modes between April and August 2025. Google built its mode at the model level (LearnLM), OpenAI through system instructions. — [Google blog](https://blog.google/outreach-initiatives/education/guided-learning/); [Geekflare](https://geekflare.com/news/chatgpt-gets-a-study-mode-key-things-to-know); [Anthropic](https://www.anthropic.com/news/introducing-claude-for-education)
- **By product type (from P2):** TCH is spread across courses, websites, books and places. TUT is mostly apps plus mentoring programmes. ELA is mostly named methods plus a few interactive maths sites. EXM is books above all, with no app built around it. NOT is dominated by apps. — [P2 idea sections](../../reports/Exam%20success%20central%20ideas.md)

### Inferences
- Celebrity teaching is a product only where one high-stakes national exam concentrates demand (Suneung, gaokao, JEE and NEET, UPSC). In markets with many smaller exams, such as the US, video teaching is more often a mastery platform without a star.
- EXM's form follows the exam format: problem-type books where exams are calculation-heavy (Korea and Japan maths, Indian aptitude), and topper copies where exams are descriptive (UPSC Mains).

### Gaps
- Taiwan, Southeast Asia, Europe beyond the UK, Latin America and Africa were not covered here (nor in Part 1, per its limitations section).
- Hindi- and Telugu-language implementations of these five ideas were not researched.
