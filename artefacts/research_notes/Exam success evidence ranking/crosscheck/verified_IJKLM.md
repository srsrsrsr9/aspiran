# Verification of cross-check answers I, J, K, L and M (1 November 2026)

What this is: a fact-check of five answers from free AI tools (I and J: Perplexity; K: ChatGPT; L and M: DeepSeek).
Each claim was checked against the paper, its abstract, a publisher or index record (Crossref, Europe PMC,
Semantic Scholar), or the paper's full text where it was open. Nothing below is from memory.

Tags:
- **V**: verified in the paper, its abstract, an index record, or the authors' own later paper.
- **WRONG**: the source says something different (the correct figure is given).
- **UNVERIFIED**: could not be checked (paywall, blocked page, or not in the abstract). Not used as evidence.

## Verdict per tool

| File | Tool | Accuracy | Main problems |
|---|---|---|---|
| I (memory and practice) | Perplexity | High. 8 of 10 checked items right. | Sana 2022 given the wrong journal (it is *Psychological Science*, not *Journal of Educational Psychology*). Chan et al. 2018 figures (d = 0.40, k = 192) could not be found; a published reanalysis gives the original pooled g as 0.44, and the paper is about learning *after* a test generally, not only pretesting. The 2023 prequestion meta-analysis is real but its print year is 2024 and "preregistered" was not confirmed. |
| J (feedback and planning) | Perplexity | Good. Every paper real; most headline numbers right. | Several precise numbers could not be confirmed: Samson's k (24 here, 23 in a 1991 reanalysis), the "five weeks or longer" moderator, Kulik 1990 d = .52 (may come from the 1986 Kulik analysis), Donker 2014 g = .66, and Richardson 2012's individual correlations. Its "not found" answers (error logs, MCII grades, certainty-based marking, commitment-device meta-analysis) were honest. |
| K (teaching and focus) | ChatGPT | Very good. All 16 papers checked are real; all headline numbers checked were right. | Kobayashi 2005 numbers (ES 0.22, 57 studies) not confirmed; another paper attributes d = 0.22 to Kobayashi's 2006 review. Cohen, Kulik & Kulik tutor effect (0.62) and the Li 2024 "6 of 25 interventions" count not confirmed. It flagged the Barcaui N-versus-df puzzle correctly; the answer is attrition (85 of 120 sat the retention test). |
| L (body and shortcuts) | DeepSeek | High. Every citation real; careful about what it could not see. | Under-claimed rather than over-claimed: it said Fawcett's g and Bosshard's N were unconfirmed (both are in the papers: g = 0.37; N = 5,638). It called Callender & McDaniel a review (design not confirmed). It reported the Bacopa network meta-analysis SMD of 2.03 correctly, but that number is implausibly large and should not be taken at face value. |
| M (secondary numbers) | DeepSeek | Mixed. 5 of 9 right; 1 wrong; 3 partly checked. | Dignath: the 0.61 is right but belongs to a companion paper (Dignath & Büttner 2008, *Metacognition and Learning*: 84 studies, 357 effect sizes, 0.61 is academic performance at primary level). Neither "74 studies" (our notes) nor "30 articles / 48 comparisons" (DeepSeek) was confirmed. Hattie "0.22" for test-taking was not found anywhere. Johnson 2000 "no overall 0.44": the copy we could open shows no 0.44, but the method range it gave (0.18–0.85) was not confirmed. It could not open Kates 2018 (r is −0.162). |

Overall: the three tools were reliable on whether a paper exists and on headline numbers in abstracts. Their errors
were mostly in fine detail (journal names, study counts, numbers that live only in full texts). None invented a paper.

## Per-item table

### I. Perplexity: memory and practice

| Item | Claim | Tag | What the source says | Link |
|---|---|---|---|---|
| Agarwal, Nunes & Blunt 2021 | 50 experiments, 49 effect sizes, N = 5,374; 57% medium or large; few non-WEIRD | V | Confirmed (authors' OSF page and abstract); 94% of experiments in the US and Western Europe. | [DOI 10.1007/s10648-021-09595-9](https://doi.org/10.1007/s10648-021-09595-9) |
| Adesope et al. 2017 | g = 0.51 vs restudy, 0.93 vs no activity; overall g, k not found | UNVERIFIED | Overall g and k still not seen in the paper. | [DOI 10.3102/0034654316689306](https://doi.org/10.3102/0034654316689306) |
| Latimier et al. 2021 | Spaced vs massed retrieval g = 0.74 (39 ES); expanding vs uniform g = 0.034 (54 ES), n.s. | V | Confirmed by two tools and the abstract summary. | [DOI 10.1007/s10648-020-09572-8](https://doi.org/10.1007/s10648-020-09572-8) |
| Chan, Meissner & Davis 2018 | d = 0.40 [0.31, 0.50], k = 192 | UNVERIFIED (likely wrong) | Abstract gives no numbers. Boustani & Shanks (2022) report Chan's pooled estimate as g = 0.44, k = 159 comparisons; after publication-bias correction the overall effect fell to about zero, but **pretesting designs kept a small, reliable effect** (g = 0.44 after removing outliers, no sign of publication bias). A 2020 erratum corrected the appendix and supplement. | [Chan 2018](https://doi.org/10.1037/bul0000166); [erratum](https://doi.org/10.1037/bul0000312); [Boustani & Shanks 2022](https://doi.org/10.1525/collabra.31996) |
| 2023 prequestion meta-analysis | g = 0.54 (k = 97) for pre-questioned content; g = 0.04 (k = 91) for other content | V (authors and year corrected) | St Hilaire, Chan & Ahn, *Psychonomic Bulletin & Review* 31(2), 411–441 (2024; online 2023). g values and k confirmed; "preregistered" and CIs not confirmed. | [DOI 10.3758/s13423-023-02353-8](https://doi.org/10.3758/s13423-023-02353-8) |
| Bertsch et al. 2007 | 86 studies, d = 0.40 | V | Confirmed (PubMed). | [PubMed 17645161](https://pubmed.ncbi.nlm.nih.gov/17645161/) |
| Donoghue & Hattie 2021 (keyword mnemonics) | d = 0.50, SE 0.104, 107 cases, N = 580, I² = 89% | V | Confirmed in Table 1. Same table: elaborative interrogation d = 0.56; rereading d = 0.47; practice testing 0.74; distributed practice 0.85. Caveats in paper: 93% surface-level outcomes, 74% tested within a day, most participants undergraduates. | [DOI 10.3389/feduc.2021.581216](https://doi.org/10.3389/feduc.2021.581216) |
| RCT of an SRS app on a real high-stakes exam | Not found | V (as a "not found") | No tool and no search found one. | — |
| 2026 SRS-app systematic review (PMC13657408) | Mostly small or observational studies, mixed results | Partly V | Paper exists: Luu & Severance, "A Systematic Review of Spaced Repetition, Retrieval Practice, and Academic Performance in Undergraduate Medical Students", *Cureus* 18(9), 2026. Its findings could not be read (no abstract in the index). | [PMC13657408](https://pmc.ncbi.nlm.nih.gov/articles/PMC13657408/) |
| Sana et al. 2022 (Rohrer replication) | *J Ed Psych*; N = 155, grades 9–12; interleaved vs blocked d = 0.35; vs no quiz d = 0.71; one month | **WRONG** journal; numbers V | Sana & Yan (2022), *Psychological Science* 33(5), 782–788. Numbers confirmed in the paper. Not preregistered. A conceptual, not direct, replication of Rohrer et al. | [DOI 10.1177/09567976211057507](https://doi.org/10.1177/09567976211057507) |
| Kang 2016 | Not verified | V (citation) | Kang, "Spaced Repetition Promotes Efficient and Effective Learning: Policy Implications for Instruction", *Policy Insights from the Behavioral and Brain Sciences* 3(1), 12–19. A policy review, no pooled effect. | [DOI 10.1177/2372732215624708](https://doi.org/10.1177/2372732215624708) |

### J. Perplexity: feedback and planning

| Item | Claim | Tag | What the source says | Link |
|---|---|---|---|---|
| Samson 1985 | ES = .33, k = 24; programmes ≥ 5 weeks larger; reanalysis .34 / .36 | ES V; k conflicting; 5-week claim UNVERIFIED | Citation confirmed (*J Educ Res* 78(5), 261–266). Hough & Hall (1991, ERIC ED339743) state Samson's synthesis had 23 studies and a Glass mean ES of .33; their reanalysis gave .34 (Glass) and .36 (Hunter–Schmidt). | [DOI 10.1080/00220671.1985.10885613](https://doi.org/10.1080/00220671.1985.10885613); [ERIC ED339743](https://files.eric.ed.gov/fulltext/ED339743.pdf) |
| Ma et al. 2014 | 107 ES, N = 14,321; g = .42 vs large-group, .57 vs other computer instruction, .35 vs textbooks, .05 vs small group, −.11 vs human tutors | V | Confirmed in the abstract. | [DOI 10.1037/a0037123](https://doi.org/10.1037/a0037123) |
| Kulik, Kulik & Bangert-Drowns 1990 | 108 evaluations; d = .52 on exams | 108 V; d UNVERIFIED | 108 controlled evaluations confirmed. The 0.52 figure appears for an earlier 1986 Kulik analysis; not confirmed for the 1990 paper. | [DOI 10.3102/00346543060002265](https://doi.org/10.3102/00346543060002265) |
| Hattie & Timperley 2007 | average d = .79 | V | 12 meta-analyses, 196 studies, 6,972 effect sizes, average 0.79; Wisniewski et al. (2020) later found 0.48 with a random-effects model. | [DOI 10.3102/003465430298487](https://doi.org/10.3102/003465430298487) |
| Error logs, mistake notebooks, exam wrappers | Not found | V (as "not found") | Consistent with our earlier search. | — |
| MCII / WOOP student grades | Not found | V (as "not found") | — | — |
| Richardson, Abraham & Bond 2012 | 241 data sets, 1,105 correlations, 50 correlates; effort regulation r = .32 etc. | Structure V; individual r values UNVERIFIED | Abstract confirms structure and that performance self-efficacy was the strongest correlate. | [DOI 10.1037/a0026838](https://doi.org/10.1037/a0026838) |
| Donker et al. 2014 | 58 studies, 95 interventions, g = .66 | Counts V; g UNVERIFIED | — | [DOI 10.1016/j.edurev.2013.11.002](https://doi.org/10.1016/j.edurev.2013.11.002) |
| Certainty-based marking on learning | Not found | V (as "not found") | — | — |
| Commitment-device meta-analysis for study | Not found | V (as "not found") | — | — |
| EEF metacognition | +8 months; 355 studies; updated May 2025 | V | Confirmed through EEF's own news pages. | [EEF toolkit strand](https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation); [EEF update news](https://educationendowmentfoundation.org.uk/news/updates-ten-strands-toolkit) |

### K. ChatGPT: teaching and focus

| Item | Claim | Tag | What the source says | Link |
|---|---|---|---|---|
| Misra & Trivedi 2026 (India private tutoring) | 7 studies, 15 data sets, N = 7,961, ES 0.24, random effects | V | *Journal of Indian Education* 50(4), 252–263 (NCERT). Authors at University of Lucknow. Small positive effect; authors call the overall contribution limited. | [NCERT journal page](https://ejournals.ncert.gov.in/index.php/jie/article/view/5089) |
| Kalam et al. 2025 | RCT, 33 of 198 invited; ChatGPT best on first quiz; one-week retention n.s. (p = .118) | V | Confirmed (Europe PMC abstract). | [DOI 10.7759/cureus.85767](https://doi.org/10.7759/cureus.85767) |
| Barcaui 2025 | RCT, N = 120; 45-day surprise test 57.5% vs 68.5%; t(83) = −3.19; d = 0.68 | V | Crossref confirms citation. 85 of 120 sat the 45-day test (attrition similar across groups), which explains df = 83. Business students; ChatGPT used as an open study aid, not a guided tutor. | [DOI 10.1016/j.ssaho.2025.102287](https://doi.org/10.1016/j.ssaho.2025.102287) |
| Wang et al. 2025 (custom GPT, *Medical Teacher*) | 103 students, no exam outcome | UNVERIFIED | Not checked; not used. | — |
| Nie et al. 2024 | RCT, 5,831 students, 146 countries; offering GPT-4 reduced exam participation; adopters scored higher | V | Confirmed (arXiv). The adopter gain is not a randomised comparison. | [arXiv 2407.09975](https://arxiv.org/abs/2407.09975) |
| Stockard 2018 | 328 studies; no single pooled effect in abstract | V | Matches our earlier note. | [DOI 10.3102/0034654317751919](https://doi.org/10.3102/0034654317751919) |
| Freeman 2014 | g = 0.47; exam vs concept inventory differ | V | Concept inventories 0.88; exam-only figure not confirmed. | [DOI 10.1073/pnas.1319030111](https://doi.org/10.1073/pnas.1319030111) |
| Kobayashi 2005 | 57 studies, 131 samples, weighted ES 0.22 | UNVERIFIED | Abstract not available; a 2022 paper attributes d = 0.22 to Kobayashi's 2006 review instead. | [DOI 10.1016/j.cedpsych.2004.10.001](https://doi.org/10.1016/j.cedpsych.2004.10.001) |
| Kobayashi 2006 | 33 studies; note-taking plus review helps | UNVERIFIED (citation V) | Citation confirmed; abstract not available. | [DOI 10.1080/01443410500342070](https://doi.org/10.1080/01443410500342070) |
| Cornell / Zettelkasten / second brain on exams | Not found | V (as "not found") | — | — |
| Böttger et al. 2023 | 22 studies, 43 ES; g = −0.14 [−0.24, −0.03]; memory −0.23, attention −0.07 n.s. | V | Confirmed in full text; I² = 62%; no formal bias test. | [DOI 10.3390/bs13090751](https://doi.org/10.3390/bs13090751) |
| Kates et al. 2018 | r = −0.16 [−0.20, −0.13]; k = 39; N = 148,883 | r V; k, N UNVERIFIED | Abstract: r = −0.162 [−0.196, −0.128], studies 2008–2017. | [DOI 10.1016/j.compedu.2018.08.012](https://doi.org/10.1016/j.compedu.2018.08.012) |
| Patterson 2018 | RCT, N = 657 MOOC students; commitment device +0.29 SD course grade, +24% time, 40% more completion; blocker and reminder null | V | Confirmed (abstract and working paper). Benefit concentrated in students who rated finishing as very important. | [DOI 10.1016/j.jebo.2018.06.017](https://doi.org/10.1016/j.jebo.2018.06.017) |
| Burnette et al. 2023 | 53 samples; achievement d = 0.14 [0.06, 0.22] in targeted, high-fidelity subsamples; prediction interval −0.08 to 0.35 | V | Confirmed (PubMed abstract). | [DOI 10.1037/bul0000368](https://doi.org/10.1037/bul0000368) |
| Cohen, Kulik & Kulik 1982 | 65 evaluations; tutees .40; tutors .62 | 65 and .40 V; .62 UNVERIFIED | — | [DOI 10.3102/00028312019002237](https://doi.org/10.3102/00028312019002237) |
| Li et al. 2024 leaderboards review | 20 articles, 22 studies, 29 interventions; design-dependent | V (full author list found) | Li, Liang, Fryer & Shum, *J Computer Assisted Learning* 40(6), 3406–3442. All higher education; about half one hour or shorter. "6 of 25 interventions improved performance" not confirmed. | [DOI 10.1111/jcal.13077](https://doi.org/10.1111/jcal.13077) |
| KCI badges/leaderboards meta | k = 37; SMD 0.39 overall; badges 0.33; leaderboards 0.27; both 0.48 | V (authors found) | Kim & Lee (2022), "Impacts of Badges and Leaderboards on Academic Performance: A Meta-Analysis", *Educational Technology International* 23(2), 207–237. Online learning; larger for K-12 and humanities. No DOI. | [KCI record](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002889489) |

### L. DeepSeek: body, nerves and shortcuts

| Item | Claim | Tag | What the source says | Link |
|---|---|---|---|---|
| Thacher 2008 | N = 120; 60% had pulled an all-nighter; linked to lower GPA; cross-sectional | V | Confirmed (Europe PMC). | [DOI 10.1080/15402000701796114](https://doi.org/10.1080/15402000701796114) |
| Niu et al. 2026 caffeine | 14 studies, N = 250, age ≤ 20; SMD 0.41 [0.28, 0.55] | V | *Frontiers in Nutrition* 13 (24 Sept 2026). 37 effect sizes; I² = 10%. Attention 0.55, psychomotor speed 0.50, executive function 0.34; memory not poolable (one study). No exam outcome. | [DOI 10.3389/fnut.2026.1888658](https://doi.org/10.3389/fnut.2026.1888658) |
| Pawson et al. 2013 | N = 447; drink in exam → higher marks after controlling coursework; d up to 0.82 | N and direction V; d values UNVERIFIED | Observational: students chose whether to bring water. | [DOI 10.53841/bpsptr.2013.19.1.57](https://doi.org/10.53841/bpsptr.2013.19.1.57) |
| Chard et al. 2019 | Crossover trial, Mali schoolchildren; cognition trend n.s. | V | Practice effect masked results. | [DOI 10.1371/journal.pone.0210568](https://doi.org/10.1371/journal.pone.0210568) |
| Curcio et al. 2006 | Narrative review; sleep loss harms learning | V | — | [DOI 10.1016/j.smrv.2005.11.001](https://doi.org/10.1016/j.smrv.2005.11.001) |
| Donnelly et al. 2016 | 64 + 73 studies; experiments on achievement mixed | V | — | [DOI 10.1249/MSS.0000000000000901](https://doi.org/10.1249/MSS.0000000000000901) |
| Bosshard & Gomez 2024 | 35 studies, 44 ES; d = 0.23 → 0.14 [0.04, 0.24] after trim-and-fill | V | N = 5,638. Cognitive written tasks (including real exams) d = 0.20; reappraisal alone d = 0.22. | [DOI 10.1038/s41598-024-58408-w](https://doi.org/10.1038/s41598-024-58408-w) |
| Brady, Hard & Gross 2018 | Reappraisal email raised first-year students' exam performance | V | Effect limited to first-year students. **Not raised by any tool:** a 2026 replication across 12 science courses at 7 institutions found no effect on anxiety or performance (Thormodsæter et al., *CBE—Life Sciences Education* 25(1), ar9). | [DOI 10.1037/edu0000219](https://doi.org/10.1037/edu0000219); [replication](https://doi.org/10.1187/cbe.25-04-0055) |
| CBT/breathing app with exam scores | Not found; Rosenberg 2021 (N = 34) measured anxiety only | "Not found" V; Rosenberg UNVERIFIED | Index lookup failed. | — |
| Callender & McDaniel 2009 | Rereading has limited benefits | V (title and citation) | Design not confirmed. | [DOI 10.1016/j.cedpsych.2008.07.001](https://doi.org/10.1016/j.cedpsych.2008.07.001) |
| Cuevas 2015 | Better-designed studies reject learning-style matching | V | Also found: Clinton-Lisell & Litzinger (2024) meta-analysis, 21 studies, g = 0.31 for matching, but only 26% of outcomes showed the crossover the hypothesis needs; authors say too small and infrequent to adopt. | [DOI 10.1177/1477878515606621](https://doi.org/10.1177/1477878515606621); [DOI 10.3389/fpsyg.2024.1428732](https://doi.org/10.3389/fpsyg.2024.1428732) |
| Fawcett 2013 | Small consistent production effect; g not confirmed | V (g found) | Abstract: g = 0.37 for recognition memory, between-subject designs. | [DOI 10.1016/j.actpsy.2012.10.001](https://doi.org/10.1016/j.actpsy.2012.10.001) |
| Bacopa/ginkgo network meta-analysis, *Phytomedicine* 2026 | 29 RCTs, N = 2,107; high-dose Brahmi vs placebo working memory SMD 2.03 [1.28, 2.78]; authors unknown | V as reported; **number not credible** | Authors: Tiemtad, Ingkaninan, Temkitthawon, Thimkorn, Rattanachaisit, Teaktong & Dhippayom; *Phytomedicine* 153, 157915; funded by the Thailand Research Fund. The 2.03 is in the abstract, but an SMD of 2 (about two standard deviations) is far above anything else in this field and much larger than the Kongkeaw meta-analysis. Likely driven by few small trials and indirect comparisons (the authors note no head-to-head trials). Not used to raise any grade. | [DOI 10.1016/j.phymed.2026.157915](https://doi.org/10.1016/j.phymed.2026.157915) |
| Kongkeaw et al. 2014 | 9 trials, N = 437; best evidence for speed of attention | V | 518 enrolled, 437 analysed. | [DOI 10.1016/j.jep.2013.11.008](https://doi.org/10.1016/j.jep.2013.11.008) |
| Photo-solver apps and later exams | Not found; Sloan-Lynch 2022 measured answer speed | V | 700 exercises, over 82 million submissions; answers got faster as photo apps spread. No learning outcome. | [DOI 10.1145/3506860.3506868](https://doi.org/10.1145/3506860.3506868) |
| Photomath Indonesian study 2025 | 36.25% gain | UNVERIFIED | Not used. | — |

### M. DeepSeek: secondary numbers

| # | Claim in our notes | DeepSeek's verdict | Our check | Link |
|---|---|---|---|---|
| 1 | Yeager 2019: +0.10 GPA for lower achievers | Right | **V**: B = 0.10 [0.04, 0.16], n = 6,320, 65 schools, standardised 0.11. | [DOI 10.1038/s41586-019-1466-y](https://doi.org/10.1038/s41586-019-1466-y) |
| 2 | Crouch & Mazur 2001: 0.49–0.74 vs 0.25 | Partly | **UNVERIFIED** (not re-checked); stays marked secondary. | [DOI 10.1119/1.1374249](https://doi.org/10.1119/1.1374249) |
| 3 | Johnson et al. 2000: overall 0.44 | Misattributed | **UNVERIFIED either way.** The copy we could open (164 studies, 8 methods) shows no 0.44. The report never used 0.44, so nothing to fix. | [Scribd copy](https://www.scribd.com/document/36554686/Cooperative-Learning-Methods) |
| 4 | Smith & Vela 2001: d ≈ 0.28 | Right | **V** (reported by Smith in later papers); 93 effects not confirmed. | [DOI 10.3758/BF03196157](https://doi.org/10.3758/BF03196157) |
| 5 | Dignath et al. 2008: 0.61 across 74 studies | 0.61 right; 30 articles/48 comparisons | **Both counts WRONG or unconfirmed.** The 0.61 is from Dignath & Büttner (2008), *Metacognition and Learning* 3, 231–264: 84 studies (49 primary, 35 secondary), 357 effect sizes, overall 0.69; academic performance 0.61 (primary) and 0.54 (secondary). | [DOI 10.1007/s11409-008-9029-x](https://doi.org/10.1007/s11409-008-9029-x) |
| 6 | Hattie test-taking d ≈ 0.27 | Right; also .22 | **0.27 V** ("teaching test-taking and coaching", 2012 list). **0.22 not found** for test-taking. | [Visible Learning for Teachers (2012) list](https://web.mst.edu/jthomas/classes/2210/grades/2013f/hattie.pdf) |
| 7 | Wu, Spreckelsen & Cohen 2021 | g = .15 threatened; .01 not threatened | **V**: 58 studies. | [DOI 10.1111/josi.12415](https://doi.org/10.1111/josi.12415) |
| 8 | Kates 2018 | Could not verify | **r = −0.162** (abstract). | [DOI 10.1016/j.compedu.2018.08.012](https://doi.org/10.1016/j.compedu.2018.08.012) |
| 9 | Latimier 2021: 0.74; 0.03 | Right | **V**: 0.74 and 0.034. | [DOI 10.1007/s10648-020-09572-8](https://doi.org/10.1007/s10648-020-09572-8) |

## Grade changes proposed

Applying `grading_scale.md` and the report's rule (research 4–5 with a mixed or near-zero effect → C "researched, mixed";
good studies showing 0 or harm → E). No central idea changes band, so the headline counts (2 / 15 / 4 / 2 / 3) stay.

| Sub-item | Old | New | Reason |
|---|---|---|---|
| Pretesting / prequestions (RET) | 2, +, C | **3, + (for pre-questioned material only), C** | Two meta-analyses: St Hilaire et al. 2024 (g = 0.54 for pre-questioned content, 0.04 for the rest) and Boustani & Shanks 2022 (pretesting effect survives bias correction). Mostly lab; the benefit is narrow, so it stays in C. |
| Keyword mnemonic (MNE) | 3, ±, C | **3, + short-term / ± long-term, C** | Donoghue & Hattie 2021: d = 0.50 but I² = 89% and 74% of outcomes tested within a day; earlier evidence of faster forgetting stands. |
| Test-taking strategy (TST) | 3, + small, C (provisional) | **3, + small, C** (no longer provisional) | Samson 1985 now verified (ES .33, about two dozen school studies); Hattie 0.27 verified. Old evidence, school achievement tests; no test of modern heuristics. |
| Commitment devices (HAB) | 3, + modest, C (provisional) | **3, + modest, C** (no longer provisional) | Patterson 2018 RCT: +0.29 SD on course grades. Still no meta-analysis. |
| Blocker and friction apps (FOC) | 2, n/a for learning, **D** | **2, 0 for grades (one trial), C** | Patterson 2018 is a randomised test of a site blocker with a learning outcome: no effect. One null trial is too little for E (needs research 3+). |
| Rank feedback and leaderboards (CMP) | 3, ±, C | **3, ± (small + online; harm risk for low-ranked), C** | Kim & Lee 2022 meta: leaderboards alone SMD 0.27 in online courses; Li et al. 2024 review: effect depends on design, mostly ≤ 1 hour, higher education only. No longer "no meta-analysis". |
| Cram schools / private tuition (TCH) | 3, ±, C | **3, + small (mostly observational), C** | Misra & Trivedi 2026: ES 0.24 across 7 Indian studies (N = 7,961). Underlying studies observational; no entrance-exam outcome. |
| Caffeine (LIF) | 2, + small, C | **3, + small, C** | Niu et al. 2026 meta (14 small studies): SMD 0.41 on attention and speed tasks; memory not poolable; no exam outcome. |
| Anxiety reappraisal (ANX) | 2–3, +, C | **4, ± (researched, mixed), C** | Bosshard & Gomez 2024: d = 0.23 falls to 0.14 after bias correction; Brady 2018 positive for first-years only; a 2026 12-course replication found nothing. |
| Hydration / water in the exam (LIF) | not graded | **2, ±, C** (new) | Pawson 2013 (observational, N = 447, higher marks) vs Chard 2019 crossover trial (no significant cognitive gain). |
| Herbal nootropics: Bacopa (Brahmi), ginkgo (QFX) | not graded | **3, ± (lab cognition only), C** (new) | Kongkeaw 2014 (9 trials): speed of attention. 2026 network meta reports an implausible SMD 2.03; no exam outcomes. Not recommended on this evidence. |
| Reading aloud (production effect) (MNE) | not graded | **3, + (lab word lists), C** (new) | Fawcett 2013: g = 0.37 between subjects, recognition memory only. |
| Photo-solver apps (OFF) | not graded | **1, n/a, D** (new) | Only Sloan-Lynch 2022 (faster answers as apps spread); no learning outcome. |

Not changed, but text updated: AI tutoring (C), answer-giving AI (E; Barcaui adds a 45-day retention harm), growth
mindset (C; Burnette d = 0.14), phone brain drain (C; Böttger g = −0.14, mostly memory), learning styles (E; Cuevas;
2024 meta g = 0.31 but no crossover in 74% of outcomes), rereading (E; Callender & McDaniel), interleaving (B; Sana &
Yan 2022 classroom study), intelligent tutoring (B; Ma 2014), feedback (B; Hattie & Timperley 0.79 vs Wisniewski 0.48),
self-regulated-learning training (B; Dignath & Büttner 0.61 / 0.54), peer tutoring (B; Cohen et al. tutees 0.40),
exercise (B; Donnelly 2016), sleep (B; Thacher, Curcio).

## Rejected or not used

- Phytomedicine 2026 SMD 2.03: real, but not credible as a size; reported only with a warning.
- Chan et al. 2018 d = 0.40, k = 192: not found; replaced by the g = 0.44 that the reanalysis reports.
- Kulik 1990 d = .52; Donker 2014 g = .66; Kobayashi 2005 ES 0.22; Cohen et al. tutors 0.62; Richardson's individual
  correlations; Pawson's d values; Li 2024 "6 of 25"; Hattie 0.22; Photomath 36.25%; Wang 2025; Rosenberg 2021: unverified.
- "30 articles / 48 comparisons" (Dignath): not supported.
- Sana et al. 2022 in *Journal of Educational Psychology*: wrong journal.
