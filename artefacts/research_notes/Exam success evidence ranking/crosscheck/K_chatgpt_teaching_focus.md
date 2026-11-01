# Research review: evidence for study techniques and exam performance

**User request**

Please search the web. I am checking the research evidence for study techniques (any exam, any country). For each item below, find the original study or meta-analysis and report what it found.

For each item give: full citation (authors, year, title, journal); a working DOI or journal link; design; number of studies (k) and participants (N); main effect size with its measure (g, d, r); who was studied and what outcome; and any caveat (publication bias, failed replication, conflict of interest).

Items:

a. Any meta-analysis or large study of cram schools or private tutoring centres (Japan juku, Korea hagwon, India coaching centres, China) on high-stakes exam results  
b. Any randomised trial of an AI or large-language-model tutor that measured long-term retention or a real high-stakes exam  
c. Stockard et al. (2018), Direct Instruction meta-analysis: the pooled effect size  
d. Freeman et al. (2014), active learning in STEM: the effect size for exams alone vs concept inventories  
e. Kobayashi (2005), meta-analysis of note-taking and reviewing: the effect sizes  
f. Any study testing Cornell notes, Zettelkasten or "second brain" note systems on exam results  
g. Böttger et al. (2023), meta-analysis of the "brain drain" effect of a nearby smartphone  
h. Kates, Wu & Coryn (2018), smartphone use and academic performance: pooled r and k  
i. Any randomised trial of website or app blockers (Freedom, Forest, Cold Turkey or similar) on grades or exam scores  
j. Burnette et al. (2023), growth-mindset intervention meta-analysis: pooled effects  
k. Cohen, Kulik & Kulik (1982), peer tutoring meta-analysis: effect sizes for tutees and tutors  
l. Any meta-analysis of leaderboards (not gamification in general) on learning

If you can't find an item, write "not found". Don't guess numbers or invent papers.

---

# Research review: evidence for study techniques and exam performance

I’ll distinguish between **evidence of improved learning**, **evidence of improved course grades**, and **evidence of improved performance on high-stakes examinations**. These are not interchangeable outcomes.

I’ll also distinguish reported effect sizes from estimates that cannot legitimately be recovered from an abstract. Where a paper reports several outcomes, I’ll identify the relevant one rather than presenting a single number as though it applied to everything.

## A. Results by study technique

### a. Cram schools and private tutoring centres

**Study 1: Indian private tutoring meta-analysis**

Misra, U., & Trivedi, T. (2026). *A Meta-Analysis of the Effect of Private Tutoring on the Academic Achievement of Secondary School Students in India.* Journal of Indian Education, 50(4), 252–263.

- [Journal article](https://ejournals.ncert.gov.in/index.php/jie/article/view/5089)
- **Design:** Meta-analysis, random-effects model.
- **k:** 7 studies, 15 datasets.
- **N:** 7,961 students.
- **Effect size:** 0.24 (reported as a standardized effect size; the abstract does not specify g or d).
- **Population:** Indian secondary-school students receiving private tutoring.
- **Outcome:** Academic achievement.
- **Finding:** Small positive effect. Private tutoring was associated with improved academic performance, but the effect was considerably smaller than popular perceptions of coaching effectiveness might suggest.
- **Caveat:** Only seven studies. This is not specifically a meta-analysis of JEE/NEET coaching centres or high-stakes entrance examination outcomes. The underlying studies span 2000–2024.

**Study 2: International tutoring evidence**

Nickow, A., Oreopoulos, P., & Quan, V. (2020). *The Impressive Effects of Tutoring on PreK-12 Learning: A Systematic Review and Meta-Analysis of the Experimental Evidence.* NBER Working Paper 27476.

- [NBER paper](https://www.nber.org/papers/w27476)
- **Design:** Systematic review and meta-analysis of experimental tutoring studies.
- **k / N:** The working-paper abstract does not provide the total counts.
- **Effect size:** 0.37 SD.
- **Population:** PreK–12 students, across tutoring programmes involving teachers, paraprofessionals, volunteers and parents.
- **Outcome:** Reading and mathematics learning.
- **Finding:** Tutoring produced substantial positive learning effects. Teacher and paraprofessional tutoring generally performed better than parent and nonprofessional tutoring. In-school tutoring generally outperformed after-school tutoring.
- **Caveat:** This is evidence for structured tutoring interventions, not necessarily commercial cram schools or high-stakes examination coaching.

**Verdict:** Evidence supports tutoring as an educational intervention. However, the causal effect of commercial coaching-centre attendance on JEE, NEET, Japanese university entrance examinations or Korean CSAT scores remains a distinct research question. The 0.37 estimate should not be used as evidence that commercial coaching centres improve high-stakes examination results by that amount.

### b. Randomised trials of AI / LLM tutors

**Study 1: ChatGPT and medical student retention**

Kalam, K. A., Masoud, F. D., Muntaser, A., Ranga, R., Geng, X., & Goyal, M. (2025). *ChatGPT as a Learning Tool for Medical Students: Results From a Randomized Controlled Trial.* Cureus, 17(6), e85767.

- [DOI: 10.7759/cureus.85767](https://doi.org/10.7759/cureus.85767)
- **Design:** Prospective, single-centre, three-arm RCT.
- **k:** 3 groups.
- **N:** 33 medical students, randomly assigned:
  - ChatGPT-4: 10
  - External online resources: 12
  - Institutional resources: 11
- **Effect size:** No standardised g or d reported in the abstract.
- **Population:** First-year medical students at Georgetown University.
- **Outcome:** Initial quiz and repeat quiz one week later.
- **Results:**

| Group | Initial score | Retention score |
|---|---:|---:|
| ChatGPT | 9.60 | 6.20 |
| External resources | 9.08 | 5.58 |
| Institutional resources | 6.64 | 4.36 |

The initial quiz favoured ChatGPT and external resources. However, the retention differences were not statistically significant (p = 0.118).

- **Caveats:** Only 33 participants enrolled out of 198 invited. Very short follow-up. The same quiz was repeated, potentially introducing testing effects. This is not a high-stakes licensing examination.

**Study 2: ChatGPT and long-term knowledge retention**

Barcaui, A. (2025). *ChatGPT as a cognitive crutch: Evidence from a randomized controlled trial on knowledge retention.* Social Sciences & Humanities Open, 12, 102287.

- [DOI: 10.1016/j.ssaho.2025.102287](https://doi.org/10.1016/j.ssaho.2025.102287)
- **Design:** Randomised controlled trial.
- **k:** 2 groups.
- **N:** 120.
- **Effect size:** Cohen's d = 0.68.
- **Population:** University students learning about AI.
- **Outcome:** Surprise knowledge-retention test 45 days after learning.
- **Results:**
  - ChatGPT-assisted group: 57.5% correct.
  - Traditional study group: 68.5% correct.
  - t(83) = −3.19, p = .002.
  - Reported d = 0.68, favouring traditional study.
- **Finding:** Students who used ChatGPT as a study aid performed worse on the delayed retention test.
- **Caveat:** This tests a particular way of using ChatGPT, not a carefully designed pedagogical AI tutor. The abstract's reported N of 120 and test statistic degrees of freedom of 83 warrant checking against the full participant-flow and analysis sections before interpreting the effect size.

**Study 3: Custom GPT tutor for medical students**

Wang, S., Yi, Z., Zou, B., Liu, G., Zhou, J., Zheng, Y., Zhang, Z., Yuan, L., & Ren, F. (2025). *Enhancing self-directed learning with custom GPT AI facilitation among medical students: A randomized controlled trial.* Medical Teacher, 47(7), 1126–1133.

- [DOI: 10.1080/0142159X.2024.2413023](https://doi.org/10.1080/0142159X.2024.2413023)
- **Design:** 14-week RCT, with 12 weeks of intervention.
- **k:** 2 groups.
- **N:** 103 medical students.
- **Effect size:** Not available in the retrieved abstract.
- **Population:** Medical students in China.
- **Outcome:** Self-directed learning, critical thinking and flow, with follow-up.
- **Finding:** Evaluated a specialised ChatGPT-based tool, LearnGuide, alongside problem-based learning.
- **Caveat:** The reported outcomes are not equivalent to long-term retention or a high-stakes examination score. A relevant exam effect could not be established from the available results.

**Study 4: Large-scale LLM experiment in coding education**

Nie, A., Chandak, Y., Suzara, M., Malik, A., Woodrow, J., Peng, M., Sahami, M., Brunskill, E., & Piech, C. (2024). *The GPT Surprise: Offering Large Language Model Chat in a Massive Coding Class Reduced Engagement but Increased Adopters Exam Performances.*

- [Stanford SCALE research record](https://scale.stanford.edu/publications/gpt-surprise-offering-large)
- **Design:** Large-scale randomised controlled experiment.
- **k:** 2 experimental conditions.
- **N:** 5,831 students from 146 countries.
- **Effect size:** No pooled standardised effect reported in the retrieved record.
- **Population:** Students in an online coding class.
- **Outcome:** Exam participation, exam performance and course engagement.
- **Finding:** Students who adopted GPT-4 showed positive examination-performance benefits. However, offering access to GPT-4 reduced overall examination participation and other engagement measures.
- **Caveat:** The effect among adopters is not the same as the intention-to-treat effect. The decline in participation complicates interpretation. It is not a delayed-retention study.

**Assessment of item b:** Randomised trials exist, including trials with delayed retention. The evidence does not support a blanket statement that AI tutors improve long-term retention. The distinction between an unrestricted chatbot, a structured AI tutor and AI-assisted retrieval practice is important.

### c. Stockard et al. (2018): Direct Instruction

Stockard, J., Wood, T. W., Coughlin, C., & Rasplica Khoury, C. (2018). *The Effectiveness of Direct Instruction Curricula: A Meta-Analysis of a Half Century of Research.* Review of Educational Research, 88(4), 479–507.

- [DOI: 10.3102/0034654317751919](https://doi.org/10.3102/0034654317751919)
- **Design:** Meta-analysis using quantitative mixed-effects models.
- **k:** 328 studies, 413 study designs.
- **N:** Almost 4,000 effect estimates; a single overall participant count is not supplied in the abstract.
- **Effect size:** The article reports multiple effect estimates across different outcomes. The abstract does not give one overall pooled g or d.
- **Population:** Students exposed to Direct Instruction curricula, covering reading, mathematics, language, spelling and other academic subjects.
- **Outcome:** Academic achievement, ability, affective outcomes and teacher/parent views.
- **Finding:** All estimated effects were positive and statistically significant, except metaregressions involving affective outcomes. Effects showed little decline during maintenance, and academic effects were greater with greater exposure to the programmes.
- **Caveats:** This is a broad synthesis of a particular instructional curriculum, not a meta-analysis of exam-preparation techniques. It combines different subject areas, outcomes and designs. Reporting one grand pooled effect without specifying the outcome would be misleading.

**Numerical qualification:** The number of studies and overall conclusions could be verified, but not a single defensible grand-mean effect size from the accessible abstract. The numerical pooled effect should be left blank rather than substituted with an effect from one subject category.

### d. Freeman et al. (2014): Active learning in STEM

Freeman, S., Eddy, S. L., McDonough, M., Smith, M. K., Okoroafor, N., Jordt, H., & Wenderoth, M. P. (2014). *Active learning increases student performance in science, engineering, and mathematics.* Proceedings of the National Academy of Sciences, 111(23), 8410–8415.

- [DOI: 10.1073/pnas.1319030111](https://doi.org/10.1073/pnas.1319030111)
- **Design:** Meta-analysis comparing traditional lecturing with active learning.
- **k:** 225 studies overall; 158 studies for examination and concept-inventory performance; 67 for failure rates.
- **N:** Not reported as one aggregate participant count in the abstract.
- **Population:** Undergraduate STEM students.
- **Outcomes:** Course examinations, concept inventories and failure rates.

**Effect sizes**

| Outcome | Result |
|---|---:|
| Exams and concept inventories combined | Hedges' g = 0.47 |
| Failure | OR = 1.95, favouring active learning |

The distinction between assessment types is important:

- Active learning had a larger effect on concept inventories than on instructor-written examinations.
- The authors found a statistically significant difference between assessment types (Q = 6.726, df = 2, p = 0.035).

The paper's abstract does not give a simple, universally applicable exam-only versus concept-inventory-only pooled g. Its supplementary analysis is required to recover the precise subgroup estimates.

**Finding:** Active learning improved examination performance by approximately 6% on average. Traditional lecture students were approximately 1.5 times as likely to fail.

**Caveats:** The authors conducted trim-and-fill and fail-safe N analyses and found no evidence that publication bias explained the overall results. However, the studies varied substantially in their implementations of active learning and their assessments. Volunteer instructors and implementation quality may affect generalisability.

### e. Kobayashi (2005): Note-taking and reviewing

The 2005 paper:

Kobayashi, K. (2005). *What Limits the Encoding Effect of Note-Taking? A Meta-Analytic Examination.* Contemporary Educational Psychology, 30(2), 242–262.

- [DOI: 10.1016/j.cedpsych.2004.10.001](https://doi.org/10.1016/j.cedpsych.2004.10.001)
- **Design:** Meta-analysis.
- **k:** 57 studies.
- **Independent samples:** 131.
- **Effect sizes:** 306.
- **N:** Not reported as a single aggregate number in the retrieved abstract.
- **Population:** Students across different educational levels.
- **Outcome:** Learning performance following note-taking compared with no note-taking.

**Overall effect:**

- Weighted mean ES = 0.22.
- Unweighted mean ES = 0.29.

| Test type | Weighted ES |
|---|---:|
| Free recall | 0.55 |
| Cued recall | 0.47 |
| Recognition | 0.18 |
| Higher-order performance | 0.26 |

**Finding:** Note-taking had a modest positive encoding effect, particularly for recall-based assessments.

**Caveats:**
- The effect varied significantly across studies.
- Visual presentation of material interfered with the note-taking process.
- Publication year and source contributed to variation.
- The effect was smaller on recognition and higher-order tests than on recall tests.

**The separate note-taking AND reviewing paper**

Kobayashi, K. (2006). *Combined Effects of Note-Taking/-Reviewing on Learning and the Enhancement through Interventions: A Meta-Analytic Review.* Educational Psychology, 26(3), 459–477.

- [DOI: 10.1080/01443410500342070](https://doi.org/10.1080/01443410500342070)
- **Design:** Meta-analysis.
- **k:** 33 studies.
- **Effect size:** The abstract describes the overall effects as substantial, but does not supply the numerical pooled estimate.
- **Finding:** Note-taking combined with reviewing improved learning. Interventions that provided frameworks or instructor notes were more effective than pre-training or verbal instruction alone.
- **Caveat:** The intervention effect varied by the availability of provided notes and the academic level of participants.

The 2005 paper is principally about the encoding effect of note-taking; the 2006 paper is the more appropriate citation for the combined note-taking/reviewing question.

### f. Cornell notes, Zettelkasten and Second Brain

**Not found — direct exam-outcome evidence.**

I could not establish a reliable experimental or meta-analytic study that directly tests Cornell notes, Zettelkasten or the modern Second Brain system against a control group using examination results as the outcome.

There is relevant adjacent evidence:

- Kobayashi's note-taking meta-analysis supports a modest average benefit of taking notes.
- The note-taking/reviewing meta-analysis supports combining notes with reviewing.
- Neither establishes that a particular branded note-taking system produces superior examination scores.

**Verdict:** Not found for direct Cornell/Zettelkasten/Second Brain exam-score comparisons. The general note-taking evidence should not be presented as proof of these specific systems.

### g. Böttger et al. (2023): The smartphone brain-drain effect

Böttger, T., Poschik, M., & Zierer, K. (2023). *Does the Brain Drain Effect Really Exist? A Meta-Analysis.* Behavioral Sciences, 13(9), 751.

- [DOI: 10.3390/bs13090751](https://doi.org/10.3390/bs13090751)
- [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC10525686/)
- **Design:** Meta-analysis.
- **k:** 22 studies, 43 relevant effect estimates.
- **N:** Not reported as a single aggregate participant count in the accessible article abstract.
- **Effect size:** Hedges' g = −0.14 (95% CI −0.24 to −0.03).
- **Population:** Participants in experiments examining smartphone presence or use and cognitive performance.
- **Outcomes:** Memory, attention and general cognitive performance.

**Subgroup results**

| Cognitive outcome | Hedges' g | Interpretation |
|---|---:|---|
| Memory | −0.23 | Significant negative effect |
| Attention | −0.07 | Not statistically significant |
| General cognitive performance | +0.10 | Not statistically significant |

The overall heterogeneity was substantial:

- Q(42) = 110.06
- I² = 61.84%

**Finding:** There was a small overall negative effect associated with smartphone presence/use. The effect was more convincing for memory than for attention or general cognitive performance.

**Caveats:**
- Significant heterogeneity.
- Only 22 studies.
- The effect is not uniform across cognitive domains.
- The meta-analysis combines different smartphone manipulations and cognitive tests.
- It does not directly demonstrate that keeping a phone away improves examination scores.

**Interpretation:** The brain-drain hypothesis has some empirical support, but the effect is small. It is not evidence that a smartphone necessarily reduces exam performance by a meaningful amount.

### h. Kates, Wu & Coryn (2018): Smartphone use and academic performance

Kates, A. W., Wu, H., & Coryn, C. L. S. (2018). *The Effects of Mobile Phone Use on Academic Performance: A Meta-Analysis.* Computers & Education, 127, 107–112.

- [DOI: 10.1016/j.compedu.2018.08.012](https://doi.org/10.1016/j.compedu.2018.08.012)
- **Design:** Meta-analysis of studies published between 2008 and 2017.
- **k:** 39 studies.
- **Effect sizes:** 40.
- **N:** 148,883 students.
- **Effect size:** r = −0.16 (95% CI −0.20 to −0.13).
- **Population:** K–12 and university students across 14 countries and regions.
  - K–12: 135,131.
  - University: 13,752.
- **Outcome:** Academic achievement in relation to mobile-phone use.

**Finding:** Mobile-phone use was negatively associated with academic performance.

Thirty-six of the 39 studies reported a negative relationship; three reported a positive relationship.

**Caveats:**
- This is primarily evidence of association, not causation.
- Mobile-phone use included multiple constructs: time spent, messages, calls and problematic/addictive use.
- The studies differed in their measurement of smartphone exposure.
- The result does not isolate the effect of merely having a phone nearby.

**Important distinction:** This is a substantially larger evidence base than the Böttger brain-drain meta-analysis, but they investigate different questions.

| Feature | Böttger et al. | Kates et al. |
|---|---|---|
| Question | Does phone presence/use affect cognition? | Is phone use associated with academic achievement? |
| Studies | 22 | 39 |
| Participants | Not established as aggregate N | 148,883 |
| Effect | g = −0.14 | r = −0.16 |
| Main outcome | Cognitive performance | Academic performance |

The two effect sizes should not be compared directly because they measure different constructs and use different statistical metrics.

### i. Website/app blockers and examination performance

**Mixed evidence — one relevant RCT.**

Patterson, R. W. (2018). *Can Behavioral Tools Improve Online Student Outcomes? Experimental Evidence from a Massive Open Online Course.* Journal of Economic Behavior & Organization, 153, 293–321.

- [DOI: 10.1016/j.jebo.2018.06.017](https://doi.org/10.1016/j.jebo.2018.06.017)
- [Cornell research record](https://ecommons.cornell.edu/entities/publication/0ccc8fbd-c323-4536-b4a3-dd587b4f643c)
- **Design:** Randomised controlled experiment.
- **k:** 4 conditions (control plus three interventions).
- **N:** 657.
- **Effect size:** The commitment-device intervention produced a course-grade effect of d = 0.29. No significant effect was found for the distraction-blocking intervention.
- **Population:** Participants in a Stanford-hosted massive open online course.
- **Outcome:** Time spent studying, course grades and course completion.

Three interventions were tested:

1. Commitment device: Students precommitted to time limits on distracting websites.
2. Reminder: Students received alerts triggered by time spent on distracting websites.
3. Focusing tool: Students could block distracting sites while accessing the course website.

**Results**

| Intervention | Result |
|---|---|
| Commitment device | 24% more course time; grade improvement d = 0.29; 40% greater likelihood of completion |
| Reminder | No statistically significant improvement |
| Distraction blocker | No statistically significant improvement |

**Finding:** A commitment mechanism improved course performance, but simply providing a website-blocking tool did not.

**Caveats:**
- One MOOC experiment, not a high-stakes examination study.
- The intervention was not a commercial Forest, Freedom or Cold Turkey product.
- The study does not establish that app blockers are ineffective in all contexts.
- The positive result belongs to the commitment-device condition, not the blocking condition.

**Verdict:** There is experimental evidence that behavioural commitment devices can improve online learning outcomes. I did not find a convincing RCT demonstrating that commercial app blockers themselves improve examination scores.

### j. Burnette et al. (2023): Growth-mindset interventions

Burnette, J. L., Billingsley, J., Banks, G. C., Knouse, L. E., Hoyt, C. L., Pollack, J. M., & Simon, S. (2023). *A Systematic Review and Meta-Analysis of Growth Mindset Interventions: For Whom, How, and Why Might Such Interventions Work?* Psychological Bulletin, 149(3–4), 174–205.

- [DOI: 10.1037/bul0000368](https://doi.org/10.1037/bul0000368)
- [PubMed record](https://pubmed.ncbi.nlm.nih.gov/36227318/)
- **Design:** Systematic review and meta-analysis restricted to randomised studies.
- **k:** 53 independent samples testing distinct interventions.
- **N:** No single aggregate participant count established from the retrieved abstract.
- **Effect size:** Academic achievement d = 0.14 (95% CI 0.06–0.22), for targeted subsamples with high implementation fidelity.
- **Population:** Participants in growth-mindset intervention studies, across different educational and other contexts.
- **Outcomes:** Academic achievement, mental health and social functioning.

**Main results**

| Outcome | Effect size | 95% CI |
|---|---:|---|
| Academic achievement | d = 0.14 | 0.06–0.22 |
| Mental health | d = 0.32 | 0.10–0.54 |
| Social functioning | d = 0.36 | 0.03–0.68 |

The academic achievement prediction interval was −0.08 to 0.35.

**Finding:** Growth-mindset interventions had a small positive average effect on academic achievement in targeted samples with high implementation fidelity.

**Caveats:**
- Considerable variation in intervention effectiveness.
- The academic achievement prediction interval includes zero.
- Results depend on who receives the intervention and how faithfully it is implemented.
- The 0.14 result is not a universal effect for every student or every growth-mindset programme.

**Interpretation:** Growth mindset is not a high-impact standalone exam-preparation technique. The effect is small and conditional.

### k. Cohen, Kulik & Kulik (1982): Peer tutoring

Cohen, P. A., Kulik, J. A., & Kulik, C.-L. C. (1982). *Educational Outcomes of Tutoring: A Meta-Analysis of Findings.* American Educational Research Journal, 19(2), 237–248.

- [DOI: 10.3102/00028312019002237](https://doi.org/10.3102/00028312019002237)
- [ERIC record](https://eric.ed.gov/?id=EJ272101)
- **Design:** Meta-analysis of school tutoring programmes.
- **k:** 65 independent evaluations overall.
- **Effect size for tutees:** d/ES = 0.40.
- **Number of tutee studies:** 52.
- **Effect size for tutors:** ES = 0.62.
- **Number of tutor studies:** 11.
- **N:** No single aggregate participant count established from the retrieved sources.
- **Population:** Schoolchildren participating in tutoring programmes, including those receiving tutoring and those serving as tutors.
- **Outcomes:** Academic achievement, attitudes towards the subject and self-concept.

**Results**

| Group | Effect size | Interpretation |
|---|---:|---|
| Tutees | 0.40 | Modest positive achievement effect |
| Tutors | 0.62 | Larger positive learning effect |

The tutee effect of 0.40 means the average tutored student performed at approximately the 66th percentile relative to the control group.

The tutor effect is particularly interesting: teaching someone else may strengthen the tutor's own subject understanding.

**Caveats:**
- The studies covered a variety of tutoring formats, subjects and ages.
- Some interventions were highly structured; others were less structured.
- Tutor effects came from a smaller set of studies.
- The findings are not exclusively about exam preparation.

**Verdict:** Peer tutoring has a reasonably strong historical evidence base. It appears beneficial to both the learner and the person doing the teaching.

### l. Leaderboards: Meta-analysis

**Study 1: Leaderboard-specific systematic review**

Li, (2024). *The Use of Leaderboards in Education: A Systematic Review of Empirical Evidence in Higher Education.* Journal of Computer Assisted Learning, 40(6), 3406–3442.

- [DOI: 10.1111/jcal.13077](https://doi.org/10.1111/jcal.13077)
- **Design:** Systematic review of empirical studies.
- **k:** 22 studies across 20 articles; 29 interventions.
- **N:** No single aggregate participant count established from the retrieved abstract.
- **Effect size:** No pooled g or d reported.
- **Population:** Higher-education students.
- **Outcomes:** Learning performance, motivation and engagement.

**Finding:** Leaderboards can improve learning performance, motivation and engagement, but their effectiveness depends heavily on design.

Of particular importance:

- 19 studies, covering 25 interventions, examined academic performance.
- Six interventions reported improvements relative to non-gamified learning.
- Around half of the included studies lasted one hour or less.
- All included studies were conducted in higher education.

**Caveats:**
- This is a systematic review, not a quantitative meta-analysis.
- Evidence is mixed.
- Most studies are short-term.
- Longitudinal evidence is limited.
- Leaderboard design matters considerably.

**Study 2: Meta-analysis of badges and leaderboards**

*Impacts of Badges and Leaderboards on Academic Performance: A Meta-Analysis.*

- [Korean Citation Index record](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002889489)
- **Design:** Meta-analysis of online educational interventions.
- **k:** 37 studies for the combined badges/leaderboards evidence base.
- **N:** Not established from the available abstract.
- **Effect size:** Standardised mean difference (SMD).

| Intervention | SMD |
|---|---:|
| Badges and leaderboards combined | 0.39 |
| Badges only | 0.33 |
| Leaderboards only | 0.27 |
| Combined interventions | 0.48 |

**Population:** Online learners, including K–12 and university students.

**Outcome:** Academic performance.

**Finding:** Leaderboard-only interventions had a positive pooled effect of 0.27. The combination of badges and leaderboards had a larger reported effect.

**Caveats:**
- The 0.39 overall result must not be attributed to leaderboards alone.
- The review combines different gamification elements.
- The evidence includes pandemic-era online learning studies.
- It does not establish a specific improvement in high-stakes examination scores.

**Verdict:** Leaderboards have some positive evidence, but the evidence is not strong enough to claim that simply adding a ranking table will improve examination performance.

---

## B. Consolidated evidence table

| Item | Technique | Main result | Evidence quality / limitation |
|---|---|---|---|
| a | Private tutoring | d/ES 0.24 in Indian meta-analysis | Small evidence base; not specifically entrance coaching |
| b | AI tutors | Mixed; retention advantage not established | RCTs exist, but small samples and varied interventions |
| c | Direct Instruction | 328 studies; positive effects | No single verified overall pooled estimate |
| d | Active learning | g = 0.47 combined | Strong meta-analysis; exams and concept inventories differ |
| e | Note-taking | ES = 0.22 | Modest; larger for recall |
| f | Cornell / Zettelkasten | Not found | No direct exam-outcome evidence established |
| g | Smartphone brain drain | g = −0.14 | Small effect; significant heterogeneity |
| h | Smartphone use | r = −0.16 | Large meta-analysis; largely correlational |
| i | App/website blockers | Blocking intervention not significant | One relevant RCT; commitment device did work |
| j | Growth mindset | d = 0.14 | Small, conditional achievement effect |
| k | Peer tutoring | 0.40 tutees; 0.62 tutors | Positive historical meta-analysis |
| l | Leaderboards | SMD = 0.27 leaderboard-only | Positive but mixed and short-term |

## C. What the evidence suggests

**1. Techniques with comparatively strong evidence**

- Active learning.
- Structured tutoring and peer tutoring.
- Direct Instruction.

These have substantial research histories and positive academic achievement findings.

**2. Techniques with positive but modest evidence**

- Note-taking.
- Growth mindset interventions.
- Private tutoring.
- Leaderboards.

The effects are either relatively small or depend on how the technique is implemented.

**3. Techniques with negative or mixed evidence**

- Smartphone use and academic performance.
- Smartphone presence and cognitive performance.
- Unstructured AI-assisted studying.
- Website distraction blockers.

There is evidence of negative associations or mixed experimental results, but the causal mechanisms and generalisability differ.

**4. Techniques where direct exam evidence is missing**

- Cornell notes.
- Zettelkasten.
- Second Brain.
- Commercial app blockers such as Forest, Freedom and Cold Turkey.

The absence of direct evidence does not establish ineffectiveness. It means claims about their examination benefits need to be treated as hypotheses.

## D. Important research gaps

For a research project comparing study techniques across countries and examination systems, these gaps deserve priority:

1. **Commercial coaching centres:** Do they improve performance after controlling for family income, prior academic achievement, selection effects and student motivation?
2. **AI tutors:** Do students retain more knowledge after 30, 60 or 90 days, and do they perform better on independent examinations without AI access?
3. **Note-taking systems:** Does Cornell note-taking outperform ordinary notes, handwritten summaries and retrieval-practice-based notes?
4. **Digital distraction:** Do blockers improve actual examination results, rather than merely increasing time spent studying?
5. **Leaderboards:** Do leaderboards improve durable learning, or only short-term participation and motivation?
6. **Cross-cultural validity:** Do techniques that work in US university courses also work in Indian competitive examinations, Chinese entrance examinations, Korean CSAT preparation and Japanese university entrance examinations?

## E. Recommended interpretation

One important methodological point: **effect size alone is not a ranking of study techniques.**

For example:

- The smartphone result of r = −0.16 is a correlation.
- The active-learning result of g = 0.47 is a standardised difference between instructional conditions.
- The growth-mindset result of d = 0.14 comes from targeted, high-fidelity intervention samples.
- The tutoring result of 0.40 comes from a different historical population and intervention design.

These cannot be ranked as if they came from one head-to-head experiment.

For a credible evidence database, retain separate fields for:

- Causal versus correlational evidence.
- Short-term versus delayed outcomes.
- Course grades versus standardised examination scores.
- Randomised versus observational designs.
- Overall effect versus subgroup effect.
- Publication bias and replication concerns.

**Overall conclusion:** Active learning and structured tutoring currently have some of the strongest evidence in this collection. Note-taking and growth mindset have smaller effects. AI tutoring is promising but needs better delayed-retention and independent-examination evidence. Several popular productivity systems still lack direct experimental evidence of improved exam performance.

*Research qualification:* This is a literature search, not an exhaustive systematic review. In particular, the exact Freeman assessment-subgroup estimates, Stockard grand pooled estimate, and several aggregate participant counts remain unresolved. They should not be treated as verified until the relevant full-text tables and supplementary materials have been checked.
