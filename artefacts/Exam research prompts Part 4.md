# Exam research: prompts for other AI tools (Part 4, evidence gaps)

Part 4 (`reports/Exam success evidence ranking.md`) grades 26 study ideas from "proven" (A) down to
"found not to work" (E). The research ran out of web searches partway, so some key papers were never
checked, and a few numbers were seen only second-hand. These prompts close those gaps. Each one stands on
its own: paste it as it is, then save the answer as a file and bring it back. I'll check every citation
before anything changes in the report.

Which tool gets which prompt:
- **Perplexity**: Prompts I and J (it links its sources, which matters most here).
- **ChatGPT** (with search on): Prompt K.
- **Gemini**: Prompt L. Gemini invented books last time, so this prompt insists on DOIs.
- **Any of them**: Prompt M, a short list of numbers to confirm from the original papers.

If a free account cuts the answer short, type "continue", or split the list in two and run each half
separately.

---

## Prompt I: Perplexity, memory and practice research

```
I am checking the research evidence for study techniques (any exam, any country). For each item
below, find the original study or meta-analysis and report what it actually found.

For each item give:
1. Full citation: authors, year, title, journal, volume and pages
2. A working link (DOI or the journal page; a PubMed or ERIC page is fine)
3. Design: meta-analysis, randomised trial, classroom study or lab study
4. Size: number of studies (k) and participants (N)
5. Main effect size with its measure (g, d, r, OR) and confidence interval if given
6. Who was studied (school, university, adults) and the outcome (lab recall, course exam,
   standardised test), and how long after learning it was tested
7. Any stated caveat: publication bias, failed replication, conflict of interest

Items:
a. Agarwal, Nunes & Blunt (2021), review of retrieval practice in classrooms
b. Adesope, Trevisan & Sundararajan (2017), meta-analysis of practice testing: the exact overall
   g and k
c. Latimier, Peyre & Ramus (2021), meta-analysis of spaced retrieval: spaced vs massed g, and
   expanding vs equal gaps
d. Any meta-analysis of pretesting (answering questions before studying), 2018 or later
e. Bertsch et al. (2007), the generation effect meta-analysis: confirm k and d
f. Any meta-analysis of the keyword mnemonic with a pooled effect size
g. Any randomised trial of a spaced-repetition app (Anki, Quizlet, Duolingo or similar) on a real
   high-stakes exam score
h. Any study that tried to replicate Rohrer et al. (2020), the interleaved maths classroom trial
i. Kang (2016), "Spaced repetition promotes efficient and effective learning"

If you cannot find an item, write "not found". Do not guess numbers. Only cite papers you can link to.
```

## Prompt J: Perplexity, feedback, exam practice and planning research

```
I am checking the research evidence for study techniques (any exam, any country). For each item
below, find the original study or meta-analysis and report what it actually found.

For each item give:
1. Full citation: authors, year, title, journal, volume and pages
2. A working link (DOI or the journal page; a PubMed or ERIC page is fine)
3. Design: meta-analysis, randomised trial, classroom study or lab study
4. Size: number of studies (k) and participants (N)
5. Main effect size with its measure (g, d, r, OR) and confidence interval if given
6. Who was studied and the outcome (course exam, standardised test, other)
7. Any stated caveat: publication bias, failed replication, conflict of interest

Items:
a. Samson (1985), "Effects of training in test-taking skills on achievement test performance",
   Journal of Educational Research 78(5): the effect size and number of studies
b. Any other meta-analysis of test-wiseness or test-taking-skills training
c. Ma, Adesope, Nesbit & Liu (2014), intelligent tutoring systems meta-analysis: the overall g
d. Kulik, Kulik & Bangert-Drowns (1990), mastery learning meta-analysis: the overall effect
e. Hattie & Timperley (2007), "The power of feedback": what it reports and its effect sizes
f. Any study or meta-analysis of error logs, mistake notebooks or exam wrappers on exam results
g. Duckworth and colleagues' trials of mental contrasting with implementation intentions (MCII,
   also called WOOP) with students: grades or exam outcomes
h. Richardson, Abraham & Bond (2012), correlates of university GPA: the main correlations
i. Donker et al. (2014), learning strategy instruction meta-analysis: the overall effect size
j. Any randomised trial or meta-analysis of certainty-based marking (confidence-weighted marking)
   on learning
k. Any meta-analysis of commitment devices or commitment contracts for studying or coursework
l. The Education Endowment Foundation's headline impact for "Metacognition and self-regulation"
   (months of progress), from its official site educationendowmentfoundation.org.uk

If you cannot find an item, write "not found". Do not guess numbers. Only cite papers you can link to.
```

## Prompt K: ChatGPT, teaching, tutoring, focus and group research

```
Please search the web. I am checking the research evidence for study techniques (any exam, any
country). For each item below, find the original study or meta-analysis and report what it found.

For each item give: full citation (authors, year, title, journal); a working DOI or journal link;
design; number of studies (k) and participants (N); main effect size with its measure (g, d, r);
who was studied and what outcome; and any caveat (publication bias, failed replication, conflict
of interest).

Items:
a. Any meta-analysis or large study of cram schools or private tutoring centres (Japan juku, Korea
   hagwon, India coaching centres, China) on high-stakes exam results
b. Any randomised trial of an AI or large-language-model tutor that measured long-term retention
   or a real high-stakes exam
c. Stockard et al. (2018), Direct Instruction meta-analysis: the pooled effect size
d. Freeman et al. (2014), active learning in STEM: the effect size for exams alone vs concept
   inventories
e. Kobayashi (2005), meta-analysis of note-taking and reviewing: the effect sizes
f. Any study testing Cornell notes, Zettelkasten or "second brain" note systems on exam results
g. Böttger et al. (2023), meta-analysis of the "brain drain" effect of a nearby smartphone
h. Kates, Wu & Coryn (2018), smartphone use and academic performance: pooled r and k
i. Any randomised trial of website or app blockers (Freedom, Forest, Cold Turkey or similar) on
   grades or exam scores
j. Burnette et al. (2023), growth-mindset intervention meta-analysis: pooled effects
k. Cohen, Kulik & Kulik (1982), peer tutoring meta-analysis: effect sizes for tutees and tutors
l. Any meta-analysis of leaderboards (not gamification in general) on learning

If you can't find an item, write "not found". Don't guess numbers or invent papers.
```

## Prompt L: Gemini, sleep, nerves and shortcuts research

```
I am checking the research evidence on health, exam nerves and study shortcuts (any exam, any
country). For each item below, find the original study or meta-analysis.

For each item give: full citation (authors, year, title, journal); its DOI (required: if you
cannot give a DOI or journal link, say "no DOI" and mark the item unconfirmed); design; number of
studies (k) and participants (N); main effect size with its measure; who was studied and what
outcome; and any caveat.

Items:
a. Thacher (2008), all-nighters and university GPA
b. Any meta-analysis of caffeine on memory or learning in students
c. Any study of hydration (drinking water) on exam performance
d. Curcio, Ferrara & De Gennaro (2006), sleep loss and learning: what it reports
e. Donnelly et al. (2016), physical activity and academic achievement position stand: main
   conclusions
f. Any meta-analysis of reappraisal ("reframing nerves as excitement") on test performance,
   2018 or later
g. Any trial of a CBT or breathing-exercise app for test anxiety that also measured exam scores
h. Callender & McDaniel (2009), the limited benefits of rereading
i. Cuevas (2015), "Is learning styles-based instruction effective?"
j. Fawcett (2013), the production effect (reading aloud) meta-analysis: confirm g
k. Any meta-analysis of non-prescription "nootropic" supplements (for example Bacopa / Brahmi,
   ginkgo) on memory in healthy young adults
l. Any study of photo-solver apps (Photomath, Gauthmath, Zuoyebang, QANDA or similar) on
   later exam scores

Only include papers you can link to. Do not invent papers, authors or numbers; write "not found"
instead.
```

## Prompt M: any tool, confirm second-hand numbers

```
Below are numbers I have seen quoted only in secondary sources. For each, find the original paper,
give its DOI or journal link, and say whether the number is right. If it is wrong, give the
correct number and where it appears in the paper (table or page).

1. Yeager et al. (2019, Nature), national growth-mindset study: about +0.10 GPA points for
   lower-achieving students
2. Crouch & Mazur (2001), Peer Instruction: Force Concept Inventory normalised gains of 0.49 to
   0.74, vs 0.25 for traditional lectures
3. Johnson, Johnson & Stanne (2000), cooperative learning methods: overall effect about 0.44
4. Smith & Vela (2001), environmental context-dependent memory meta-analysis: overall d about 0.28
5. Dignath, Buettner & Langfeldt (2008), self-regulated learning training: overall effect about
   0.61 across 74 studies
6. Hattie's figure for test-taking / test-wiseness training: d about 0.27
7. Wu, Spreckelsen & Cohen (2021), self-affirmation in education meta-analysis: overall g
8. Kates et al. (2018), smartphone use and grades: r about -0.12
9. Latimier et al. (2021): spaced vs massed retrieval g about 0.74; expanding vs equal gaps
   g about 0.03

Don't guess. If you can't open the paper, say so.
```
