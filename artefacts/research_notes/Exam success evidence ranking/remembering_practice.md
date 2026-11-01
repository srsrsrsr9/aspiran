# Part 4 evidence notes: remembering and practice (RET, SPA, MNE, MIX)

Researched 1 Nov 2026. Grades use `grading_scale.md` exactly. Search budget ran out partway (the shared web-search
limit for the session was reached after about 17 searches), so some candidate papers in the brief could not be
checked; they are listed under Gaps, not cited as findings. Where a number comes from a secondary source rather
than the paper itself, it is marked "(secondary)".

Summary of grades

| Idea | Research amount | Effect | Band |
|---|---|---|---|
| RET Retrieval practice (testing effect) | 5 | ++ | A. Proven |
| RET sub-idea: pretesting / prequestions | 2 | + | C. Promising but thin |
| SPA Spacing and scheduled review | 4 | ++ | A. Proven (idea); the *software brand* evidence is D-level |
| SPA sub-idea: spaced-repetition software (Anki etc.) and real exam scores | 1–2 | ± | D/C boundary |
| MNE Memory techniques (method of loci, keyword) | 3 | + (loci) / ± (keyword) | C. Promising but thin or mixed |
| MIX Interleaving and varied practice | 4 | + (conditional) | B. Well supported, with conditions |

---

## RET: Retrieval practice / testing effect (including pretesting)

### Takeaway
Practising pulling answers from memory beats rereading in hundreds of studies, and a large classroom-only
meta-analysis (222 studies, 48,478 students) finds a medium gain in real course achievement (g ≈ 0.50) with little
sign of publication bias. Grade: research 5, effect ++, band A. Pretesting (attempting questions before teaching) is
a promising but much thinner sub-idea (band C).

### Cited Findings
**Meta-analyses**
- Yang, Luo, Vadillo, Yu & Shanks (2021), *Psychological Bulletin* 147(4), 399–435, DOI 10.1037/bul0000309: classroom
  studies only; 48,478 students, 222 independent studies; overall g = 0.499 on academic achievement — [Yang et al. 2021 (PDF)](https://gwern.net/docs/spacedrepetition/2021-yang.pdf); [HKBU record](https://scholars.hkbu.edu.hk/en/publications/testing-quizzing-boosts-classroom-learning-a-systematic-and-meta-/)
- Yang et al. 2021, comparisons: vs no/filler activity g = 0.610; vs restudying g = 0.330; vs other elaborative
  strategies (concept mapping, note-taking, summarising) g = 0.095, not a significant advantage — [Yang et al. 2021](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)
- Yang et al. 2021, publication bias: PEESE-corrected g = 0.475 [0.329, 0.620]; funnel plot not asymmetric; five bias
  tools found no noteworthy bias; p-curve supports a real effect. Data and code open at osf.io/ewrsd — [Yang et al. 2021](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)
- Yang et al. 2021, moderators: corrective feedback g = 0.537 vs no feedback g = 0.374; more quiz repetitions → larger
  effect; consistent quiz/exam format g = 0.531 vs mismatched format g = 0.399 (still positive, i.e. transfers across
  formats); untested but related knowledge also benefits (g = 0.321 vs 0.512 for tested knowledge) — [Yang et al. 2021](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)
- Yang et al. 2021, age: elementary g = 0.328, middle school g = 0.597, high school g = 0.655, university g = 0.486;
  continuing/adult education g = 0.314, not significant (only k = 6) — [Yang et al. 2021](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)
- Yang et al. 2021 also report that low-stakes quizzes had minimal effect on test anxiety in the studies they review,
  and that lower working-memory students benefit as much or more — [Yang et al. 2021](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)
- Rowland (2014), *Psychological Bulletin* 140(6), 1432–1463, DOI 10.1037/a0037559: testing vs restudy, lab-dominated;
  with feedback g = 0.73, without feedback g = 0.39 (as quoted in Yang et al. 2021). Overall g ≈ 0.50 (secondary) —
  [Rowland 2014 PDF](https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf); [Yang et al. 2021](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)
- Rowland's sample is not exam-like: 81% of effects used word pairs/lists, 88% used cued or free recall tests, 67%
  gave no feedback (Yang et al.'s description) — [Yang et al. 2021](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)
- Adesope, Trevisan & Sundararajan (2017), *Review of Educational Research* 87(3), 659–701, DOI 10.3102/0034654316689306:
  practice tests beat restudying and all other comparison conditions; vs restudy g = 0.51, vs filler/no activity
  g = 0.93; feedback did not moderate (with g = 0.63, without g = 0.60) (figures as quoted in Yang et al. 2021);
  about 118 studies (secondary) — [SAGE](https://journals.sagepub.com/doi/10.3102/0034654316689306); [Learning Scientists summary](https://www.learningscientists.org/blog/2017/2/9-1); [Yang et al. 2021](https://gwern.net/docs/spacedrepetition/2021-yang.pdf)
- Pan & Rickard (2018), *Psychological Bulletin* 144(7), 710–756, DOI 10.1037/bul0000151: transfer of test-enhanced
  learning; 192 effect sizes, 122 experiments, 67 articles, N = 10,382; d = 0.40 [0.31, 0.50] vs restudy. Transfer
  stronger across test formats, to application and inference questions and to medical diagnosis problems; weaker to
  rearranged items, untested material and worked-example problems; depends strongly on initial test success and
  elaborated retrieval. After PET-PEESE bias correction, intercepts dropped "often to no positive transfer when none of
  the key moderators were present" — [PubMed 29733621](https://pubmed.ncbi.nlm.nih.gov/29733621/)
- Dunlosky, Rawson, Marsh, Nathan & Willingham (2013), *Psychological Science in the Public Interest*, DOI
  10.1177/1529100612453266: practice testing rated one of only two "high utility" techniques (with distributed practice),
  across ages, abilities and criterion tasks — [APS release](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html); [CiteDrive record](https://www.citedrive.com/en/discovery/improving-students-learning-with-effective-learning-techniques)

**Pretesting / prequestions**
- Pan & Carpenter (2023), "Prequestioning and pretesting effects: a review of empirical research, theoretical
  perspectives, and implications for educational practice", *Educational Psychology Review* 35(4):97. A narrative
  review; I could not confirm whether it pools effect sizes — [citation in arXiv paper](https://arxiv.org/pdf/2504.10249)
- Classroom examples summarised by a teacher-researcher blog: Beckman (2008) aerospace course, pretested students
  scored 9–12% higher on unit tests; Janelli & Lipnevich (2021) online course, prequestions linked to higher dropout;
  Kliegl et al. (2022) benefit largest at a 1-week delay; students rate pretesting as less effective than it is
  (secondary, single studies) — [Ollie Lovell summary](https://www.ollielovell.com/?p=4841)

### Inferences
- RET meets band A comfortably: several large meta-analyses, one restricted to real classrooms with bias checks, across
  primary school to university. The classroom effect vs *restudying* (g ≈ 0.33) is smaller than the headline 0.50,
  which is inflated by "no activity" controls; the fair comparison for a student choosing how to revise is ≈ 0.3–0.5.
- Quizzing is not clearly better than other active strategies like summarising or concept mapping in classrooms
  (g = 0.095, n.s.), so its advantage is mainly over passive rereading.
- For exams with new questions (e.g. application MCQs), transfer is real but conditional: it needs feedback, decent
  initial success and questions that ask for application rather than verbatim recall.
- Adults outside formal schooling (most competitive-exam aspirants) are under-studied in the classroom literature (k = 6).
- Pretesting: research 2, effect +, band C until a pooled estimate is found.

### Gaps
- Agarwal, Nunes & Blunt (2021) classroom review, and van Gog & Sweller (2015) on complex materials: not verified (search budget exhausted).
- Pretesting meta-analysis with pooled effect sizes: not found.
- The generation effect (listed under RET in the taxonomy) was not researched.
- Exact overall g and k for Adesope et al. 2017 not confirmed from the paper itself (SAGE page returned 403).

---

## SPA: Spacing / distributed practice, spaced-repetition scheduling, successive relearning

### Takeaway
Spreading study over time beats cramming in a very large literature, and the best gap grows with how long you need
to remember (about 5–10% of the time to the exam for a year away). Combining spacing with retrieval (successive
relearning) raised real course-exam grades by about a letter grade. Grade: research 4, effect ++, band A. Evidence for
specific apps and for "expanding" schedules over even ones is weak.

### Cited Findings
- Cepeda, Pashler, Vul, Wixted & Rohrer (2006), *Psychological Bulletin* 132(3), 354–380, DOI 10.1037/0033-2909.132.3.354:
  839 assessments, 317 experiments, 184 articles, verbal recall tasks; optimal gap grows with retention interval —
  [Cepeda et al. 2006 PDF](https://www.evullab.org/pdf/CepedaPashlerVulWixtedRohrer-PB-2006.pdf); [PubMed](https://pubmed.ncbi.nlm.nih.gov/16719566/)
- Cepeda et al. 2006: spaced beat massed "markedly"; even at retention intervals under 1 minute spacing improved recall
  by 9 percentage points; but 80% of comparisons used a retention interval under 1 day and only 4% used long intervals.
  Only accuracy differences reported because of insufficient effect-size data — [Cepeda et al. 2006](https://www.evullab.org/pdf/CepedaPashlerVulWixtedRohrer-PB-2006.pdf)
- Cepeda et al. 2006, expanding vs fixed gaps: expanding looked better overall but "large between-study variability"
  made conclusions "necessarily tentative"; individual researchers found expanding better, fixed better, or no
  difference — [Cepeda et al. 2006](https://www.evullab.org/pdf/CepedaPashlerVulWixtedRohrer-PB-2006.pdf)
- Cepeda, Vul, Rohrer, Wixted & Pashler (2008), *Psychological Science* 19(11), 1095–1102: over 1,350 people, review
  gaps up to 3.5 months, final tests up to 1 year later; optimal gap ≈ 20–40% of a 1-week delay but ≈ 5–10% of a 1-year
  delay; too-short and too-long gaps both cost — [PubMed 19076480](https://pubmed.ncbi.nlm.nih.gov/19076480/); [PDF](https://www.evullab.org/pdf/CepedaVulRohrerWixtedPashler-PS-2008.pdf)
- Latimier, Peyre & Ramus (2021), *Educational Psychology Review* 33, 959–987, DOI 10.1007/s10648-020-09572-8: 29
  studies on spacing out retrieval practice; spaced vs massed retrieval g = 0.74; expanding vs uniform schedules
  g ≈ 0.03, i.e. no reliable difference (both figures secondary; journal page not reachable) — [ACU summary](https://inspire.acu.edu.au/articles/spaced-practice); [StudyCardsAI stats page (secondary)](https://studycardsai.com/blog/spaced-repetition-statistics)
- Dunlosky et al. (2013) rated distributed practice "high utility" — [APS release](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html)
- Successive relearning (Rawson, Dunlosky & Sciartelli 2013, *Educational Psychology Review*): in an introductory
  psychology course, computer flashcard retrieval to criterion, repeated across spaced sessions, raised course-exam
  performance by about a letter grade (C to B) vs spaced restudy and baseline; a month later the advantage was larger.
  When students controlled their own flashcard decisions, the exam benefit disappeared (secondary summaries) —
  [Rawson & Dunlosky 2022, *Current Directions in Psych. Science*](https://journals.sagepub.com/doi/full/10.1177/09637214221100484); [Dunlosky et al. classroom guide (UNH)](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-successive-relearning-dunlosky-greve-badali-wissman-rawson.pdf)
- Higham et al. (2022, *J. Educational Psychology*): weekly relearning sessions in a large introductory psychology course
  beat restudying on end-of-semester recall — [Southampton eprint](https://eprints.soton.ac.uk/449677/1/Higham_et_al._in_press_JEdPsych.pdf)

**Spaced-repetition software in real courses (brand-level, observational)**
- Deng, Gluckstein & Larsen (2015), *Perspectives on Medical Education*, DOI 10.1007/s40037-015-0220-x: 72 students at
  one school; roughly 1 extra USMLE Step 1 point per ~1,700 flashcards (Anki/Firecracker) after controls; observational —
  [journal record](https://reference-global.com/article/10.1007/S40037-015-0220-X); [NVMO record](https://nvmo.nl/journal-article/student-directed-retrieval-practice-is-a-predictor-of-medical-licensing-examination-performance)
- Lu et al. (2021): survey linking Anki use to higher Step 1 scores — only seen as cited in a 2023 paper (secondary) — [PMC10176558](https://pmc.ncbi.nlm.nih.gov/articles/PMC10176558)
- Wothe et al. (2023): 165 students; daily Anki use correlated with Step 1 (P = .039) but not Step 2. Cooper et al. (2023)
  retrospective cohort: Step 1 means 223.71 vs 222.58, no significant correlation (secondary) — [IJMS article](https://ijms.pitt.edu/IJMS/article/view/1549); [PMC10403443](https://pmc.ncbi.nlm.nih.gov/articles/PMC10403443)
- Settles & Meeder (2016), ACL, Duolingo half-life regression: evaluated by *prediction* error (45%+ lower than
  baselines) and an operational test showing +12% daily student engagement. No learning or exam outcome measured;
  company-authored — [ACL Anthology PDF](https://aclanthology.org/P16-1174.pdf)

### Inferences
- The spacing *idea* is band A: very large literature, a 1,350-person long-delay study, and classroom exam gains when
  combined with retrieval. The weakest link is that most of Cepeda 2006's data are short-interval lab word learning.
- Spacing and retrieval are best treated as a pair: the strongest classroom result (successive relearning) uses both.
- "Expanding intervals" (the core of most SRS apps, 2-3-5-7 schedules etc.) are not shown to beat evenly spaced review.
  What matters is that review happens and the gaps are a sensible fraction of the time to the exam.
- App evidence (Anki, Duolingo) is observational or engagement-only, with self-selection; it says little beyond the idea
  itself. FSRS-type benchmarks measure recall prediction, not learning, as the brief notes.
- Self-managed flashcards may lose the benefit (students stop too early), which matters for unsupervised aspirants.

### Gaps
- Kang (2016) review: not verified (search budget). Latimier et al. effect sizes not confirmed from the paper itself.
- No randomised trial of Anki or any SRS app on a real high-stakes exam found. Lu 2021 original not located.
- No pooled effect size from a classroom-only spacing meta-analysis found.

---

## MNE: Memory techniques (method of loci, keyword mnemonic, other mnemonics)

### Takeaway
The method of loci helps recall of lists in short-term lab tests (meta g = 0.65 in 13 small RCTs), but a larger 2025
review rates the evidence low to very low quality with publication bias. The keyword method boosts immediate recall of
vocabulary but is forgotten faster than rote learning at a delay. Grade: research 3, effect + (loci) / ± (keyword),
band C.

### Cited Findings
- Twomey & Kroneisen (2021), *Quarterly Journal of Experimental Psychology* 74(8), 1317–1326, DOI 10.1177/1747021821993457:
  13 RCTs mostly in universities; g = 0.65 [0.45, 0.85], I² = 45.5%; robust to bias adjustments; but high risk of
  bias because most studies did not report randomisation or allocation concealment (from abstract summaries) —
  [SAGE](https://journals.sagepub.com/doi/10.1177/1747021821993457); [RLP Forschung record](https://www.rlp-forschung.de/public/facilities/21/publications/136933)
- Ondřej (2025), *British Journal of Psychology* 116(4), 930–986, DOI 10.1111/bjop.12799: 83 eligible studies, 68 in
  main analyses; young adults (936 in meta-analysis) immediate serial recall vs rehearsal d = 0.42 [0.00, 0.80];
  abstract reports d = 0.88 [0.47, 1.25] for adult immediate serial recall; 89% of young-adult experiments at high risk
  of bias; evidence of publication bias and small-study effects; GRADE certainty very low for effectiveness in young and
  older adults. No pooled delayed-recall estimate seen. Classroom examples cited are single studies (McCabe 2015;
  Qureshi et al. 2014 in medical MCQs) — [PMC12514325](https://pmc.ncbi.nlm.nih.gov/articles/PMC12514325/)
- Dunlosky et al. (2013) rated the keyword mnemonic "low utility" — [APS release](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html); [ScienceDaily](https://www.sciencedaily.com/releases/2013/01/130110111734.htm)
- Wang, Thomas & Ouellette (1992), *Journal of Educational Psychology* 84(4), 520–528: four experiments; "long-term
  forgetting was greater" for keyword learners than for rote rehearsal — [UCF record](https://stars.library.ucf.edu/facultybib1990/601)
- Wang & Thomas (1995): after 2 days, a reversal, with semantic-context learning ahead of keyword learning; repeated
  reviews narrowed the gap (secondary) — [Memory-key summary](https://archive.memory-key.com/research/Wang95); [UCF record](https://stars.library.ucf.edu/facultybib1990/1498)
- A Spanish-language systematic review of keyword mnemonic studies since 1975 found no uniform result on long-term
  recall, attributed to heterogeneity — [Goñi-Artola & González, REIPE](https://revistas.udc.gal/index.php/reipe/article/download/reipe.2017.0.01.2685/pdf/9948)

### Inferences
- Memory techniques work for what they were designed for (ordered lists, names, foreign words) in the short term. Exam
  syllabi are mostly connected concepts, where these tools cover only a slice (e.g. lists of articles, dates, sequences).
- The pooled loci effect is moderate, but study quality is poor, samples small, and long-delay or real-exam outcomes are
  almost absent, so research amount is 3 at best and the effect is conditional (+).
- Keyword method: real immediate benefit but faster forgetting unless reviewed; combine with spaced retrieval.
- Band C (research 3, + / ±). Not E: nothing shows harm, only fragile or short-lived gains.

### Gaps
- Wammes and other keyword-mnemonic meta-analyses with pooled effect sizes: not found.
- Major/peg/PAO systems, acronyms and chunking: no controlled exam-outcome studies found (not searched in depth).
- Pooled delayed-recall effect for loci: not found.

---

## MIX: Interleaving and varied practice

### Takeaway
Mixing problem types helps when the learner must tell similar categories or methods apart: a meta-analysis finds a
moderate average effect (g = 0.42) that reverses for word lists, and a preregistered classroom RCT in 7th-grade
maths found a large gain a month later (d = 0.83). Grade: research 4, effect + (conditional), band B.

### Cited Findings
- Brunmair & Richter (2019), *Psychological Bulletin* 145, 1029–1052, DOI 10.1037/bul0000209: 59 studies, 238 effect
  sizes, 158 samples; overall g = 0.42. Paintings/visual categories g = 0.67; words g = −0.39 (blocking better).
  Larger effects when categories are similar to each other, items within a category vary, and material is complex.
  Authors advise caution for expository texts and words — [Würzburg author PDF](https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf); [X-MOL abstract](https://www.x-mol.com/paper/1213055298318831616)
- Brunmair & Richter, maths: an earlier version showed no effect for maths; after adding studies, a small positive effect
  on procedural knowledge (one mirror gives g = 0.34, unconfirmed) — [Frontiers correction note](https://frontiersin.org/articles/10.3389/fpsyg.2019.02296/full)
- Rohrer, Dedrick, Hartwig & Cheung (2020; online 2019), *Journal of Educational Psychology* 112(1), 40–52, DOI
  10.1037/edu0000367: preregistered cluster RCT, 54 seventh-grade maths classes (787 students, one district), 4 months of
  interleaved vs blocked assignments; unannounced test one month later 61% vs 38%, d = 0.83; teachers needed no training —
  [Rohrer et al. PDF](https://Www.Gwern.net/doc/psychology/spaced-repetition/2019-rohrer.pdf); [IES summary](https://ies.ed.gov/ncee/wwc/Study/88770)
- The What Works Clearinghouse rated the Rohrer trial "meets standards without reservations"; teachers reported
  interleaved assignments took more time — [WWC](https://ies.ed.gov/ncee/wwc/Study/88770)
- Dunlosky et al. (2013) rated interleaved practice "moderate utility" (at that time evidence was mostly maths and lab
  category learning) — [APS release](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html)

### Inferences
- Interleaving fits exams where a question does not announce which method or concept it needs (maths, physics,
  reasoning, mixed-topic MCQ papers). It does not help memorising word lists and may hurt there.
- One large preregistered classroom trial plus one meta-analysis gives research 4, but the classroom evidence is
  concentrated in school maths in the US. The effect is conditional, so +, band B.
- In the Rohrer trial interleaving was confounded with spacing (mixed assignments revisit earlier topics), so part of
  the gain may be a spacing effect; the authors flag "important caveats".

### Gaps
- Interleaving evidence for adults preparing for large written exams (e.g. essay-type papers): not found.
- Replication of the Rohrer RCT in another country or subject: not found in the searches run.
- Exact maths-subset effect in Brunmair & Richter not confirmed from the paper.
