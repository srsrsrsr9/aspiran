# Content assignment, 22 Nov 2026: Binge shorts (20 videos, English and Hindi)

**What it's for.** The website now has a Binge section (on branch `claude/site-v5`, not live until you say go). It reads
the illustrated-shorts series from the app, so every short published there shows up on the site the next day. You
asked for shorts on popular, story-like topics, with Kesavananda Bharati as the example. These are those.

**How to run it.** Paste the whole of `artefacts/video-mega-prompt-2026-11-16.md` (the part between the tildes) into
the content account as before, then paste everything below the line here **after it**. Where the two disagree, this
one wins. Send the finished folders back as a zip, as usual; I check, import and publish them.

**Decisions up front**
- 20 shorts, each in English and Hindi (40 videos): 10 landmark judgments, 10 popular moments in Indian history.
- Pilot first: make **#1 Kesavananda Bharati** in both languages, then stop for your yes before the other 19.
- Costs as in the 16 Nov prompt, scaled to 20: pictures hard stop **US$1.00** on OpenRouter; narration on Fish Audio.
- Heads-up on keys: the long-video note in the 21 Nov zip said the Fish Audio and OpenRouter keys should be changed.
  Do that first, then give the content account the new ones.

---------------------------------------------------------------------------------------------------------------------

# Aspiran Binge shorts: 20 more illustrated shorts (overrides for this batch)

Everything in the prompt above still applies, except where this section changes it.

## A. What changes from the 100-shorts prompt

1. **No "AI" labels anywhere (replaces rule 8).** The owner decided on 17 Nov 2026: no "AI voice" kicker, no
   "Narration: AI voice" or "Illustrated with AI" on the end card. The end card says only "Aspiran" and the sources
   line. Never claim a person did something a model did.
2. **Living people (tightens rule 10).** Many of these stories involve people who are alive: petitioners, judges,
   activists, officials. **Never draw, voice or quote a living person as a character.** A case may be named by its
   official name (it is the court's record), but say "the petitioner", not a personal story. Judges are never drawn
   as faces: show the bench as robes, empty high-backed chairs, a gavel-free courtroom (Indian courts don't use
   gavels), or the numbers (7–6). People who have died may appear as paper-cut figures as before, with care.
3. **Tone.** No TRAGIC videos in this batch (the website won't show them). Use SERIOUS where there was violence or
   injury, with the hard fact in one plain sentence and nothing painful shown. If a topic can't be told honestly
   without being TRAGIC, stop and tell the owner instead of making it.
4. **Hook in the first 3 seconds.** Open on the question or the turning point, not on background. Examples: "Thirteen
   judges. Sixty-eight days of hearings. One vote decided what Parliament can never change." Then tell it in order.
   The ending rule still holds: a quiet closing line, no "part 2", no "follow for more".
5. **Politically even.** The Emergency, Shah Bano, Operation Polo, Narmada and Indra Sawhney are still argued about.
   State what the record says (the Constitution, the judgment, the Act, the official report), give each side in its
   own best words when there are sides, and never take one. No party names as villains or heroes.
6. **Maps.** Shimla, Operation Polo, Bengal 1905 and Pokhran tempt a bordered map. Rule 7 stands: no national or
   state borders, no Line of Control, no outline of India. Use dots, rivers, coastlines and labels only. For the
   Bengal partition, show the two new provinces as two labelled groups of district dots, not shapes.
7. **Past questions.** If a short mentions a UPSC question, quote it only from the official paper in the app's
   past papers (`app.aspiran.in/learn/papers`) and give the year, paper and number. Never from memory.

## B. One new format for judgments

**F9. The courtroom minute** · 70 to 110 s · 3 pictures
1. The hook: the question the court had to answer, in one line (3 s).
2. How it reached the court: the facts, plainly (15 to 20 s).
3. Side one's best argument; side two's best argument (15 to 20 s each).
4. What the bench decided, and by how many (10 s).
5. What it changed: the rule we live with today, and where it sits in the syllabus (15 s).
6. Closing line: one sentence a student can write in an answer.
Pictures: the courtroom (no faces), an object that stands for the case (a land record, a passport, a
census sheet, a ration card), and the after-scene.

## C. The 20 topics

Use a range of formats; don't make all ten judgments in F9. Number the English ones 101 to 120 in
`content/motion/shorts/2001-10/` (101–110) and `2001-11/` (111–120); the Hindi ones the same numbers in `2002-10/`
and `2002-11/`. `series: "illustrated-shorts"`, `free: true`, a 2-question quiz each (one recall question, one
"use it in an answer" question), 1 or 2 `syllabusNodes`, and full sources as in the earlier prompt.

### Landmark judgments (gs2-1, gs2-4 unless said)

| # | Title (working) | Nodes | Format | Premise | Main sources |
|---|---|---|---|---|---|
| 101 | **Kesavananda Bharati: The Line Parliament Can't Cross** (pilot) | gs2-1, pre-4 | F9 · NEUTRAL | A Kerala math's land-reform challenge becomes the largest bench ever: 13 judges, 68 days, 7–6. Parliament may amend any part, but not the basic structure. | *Kesavananda Bharati v. State of Kerala*, (1973) 4 SCC 225; Constitution Art. 368 |
| 102 | Golaknath: Rights Parliament Couldn't Touch, for Six Years | gs2-1 | Timeline | 1967: 11 judges, 6–5, say amendments can't take away Fundamental Rights; the 24th Amendment answers; Kesavananda settles it. | *I.C. Golaknath v. State of Punjab*, AIR 1967 SC 1643; 24th Amendment Act, 1971 |
| 103 | Minerva Mills: Balance as Basic Structure | gs2-1 | Two sides | The 42nd Amendment's Section 55 (no limits on amending power) and the primacy of Directive Principles struck down; Rights and Directives must balance. | *Minerva Mills v. Union of India*, (1980) 3 SCC 625; 42nd Amendment Act, 1976 |
| 104 | Maneka Gandhi: The Word "Procedure" Grows Up | gs2-1 | F9 | An impounded passport, no reasons given: Article 21's "procedure established by law" must be fair, just and reasonable. The petitioner is not drawn. | *Maneka Gandhi v. Union of India*, (1978) 1 SCC 248; Art. 14, 19, 21 |
| 105 | Puttaswamy: Nine Judges on Privacy | gs2-1, gs3-5 | F9 | A retired judge questions Aadhaar; nine judges unanimously find privacy within Article 21, and set the test for limiting it. | *Justice K.S. Puttaswamy (Retd.) v. Union of India*, (2017) 10 SCC 1 |
| 106 | S.R. Bommai: When Can Delhi Dismiss a State? | gs2-2, gs2-1 | Idea cards | Article 356 under review: the floor of the House decides majority; secularism is basic structure; President's Rule is open to court. | *S.R. Bommai v. Union of India*, (1994) 3 SCC 1; Sarkaria Commission Report (1988), ch. 6 |
| 107 | Vishaka: Rules Before There Was a Law | gs1-6, gs2-1 | F9 · SERIOUS | An assault on a social worker (one plain sentence, nothing shown; she is alive and is never drawn or named as a character) leads the court to write workplace guidelines that stood until the 2013 Act. | *Vishaka v. State of Rajasthan*, (1997) 6 SCC 241; Sexual Harassment of Women at Workplace Act, 2013 |
| 108 | Shah Bano: One Judgment, Two Debates | gs1-6, gs2-1 | Two sides · SERIOUS | Maintenance under Section 125 CrPC, the 1986 Act that followed, and Danial Latifi (2001). Each side in its own words; no community painted as villain. | *Mohd. Ahmed Khan v. Shah Bano Begum*, (1985) 2 SCC 556; Muslim Women (Protection of Rights on Divorce) Act, 1986; *Danial Latifi v. Union of India*, (2001) 7 SCC 740 |
| 109 | Indra Sawhney: The 50% Line | gs2-1, gs2-8 | Idea cards | The Mandal judgment: 27% OBC reservation upheld, the creamy layer, the 50% ceiling, no reservation in promotion (later amended). | *Indra Sawhney v. Union of India*, 1992 Supp (3) SCC 217; Mandal Commission Report (1980) |
| 110 | Navtej Johar: Section 377 Read Down | gs1-6, gs2-1 | F9 | Five judges, unanimous: consensual adult relationships are not a crime; dignity, privacy and equality. Petitioners not drawn. | *Navtej Singh Johar v. Union of India*, (2018) 10 SCC 1; *Naz Foundation* (Delhi HC, 2009); *Suresh Kumar Koushal* (2013) |

### Popular moments (GS1 first)

| # | Title (working) | Nodes | Format | Premise | Main sources |
|---|---|---|---|---|---|
| 111 | The Emergency in the Constitution's Own Words | gs1-4, gs2-1 | Timeline · SERIOUS | June 1975 to March 1977 through the record only: Article 352, the 38th, 39th and 42nd Amendments, ADM Jabalpur, the 1977 election, and the 44th Amendment's safeguards. | Constitution Art. 352, 358, 359; 42nd and 44th Amendment Acts; *ADM Jabalpur v. Shivkant Shukla*, (1976) 2 SCC 521; Shah Commission interim reports (1978) |
| 112 | The Night India Pawned Its Gold | gs3-1, gs1-4 | Diary | 1991: reserves down to about two weeks of imports, gold flown out as collateral, then the July budget and the new industrial policy. Told by "the ledger", not by any living official. | RBI, *Report on Currency and Finance* 1991–92; Union Budget speech, 24 July 1991; Statement on Industrial Policy, 24 July 1991 |
| 113 | Pokhran: Two Tests, Two Messages | gs3-5, gs3-8 | Timeline | 1974's "peaceful nuclear explosion" and 1998's five tests; no-first-use and the doctrine that followed. Desert dots only, no map borders. | Government of India statements (18 May 1974; 11 and 13 May 1998); Draft Nuclear Doctrine (1999); official summary of the doctrine (4 Jan 2003) |
| 114 | 1905: A Province Cut in Two | gs1-2, gs1-3 | Map journey | Curzon's partition of Bengal, Swadeshi and boycott, and its reversal in 1911. Two groups of district dots, never shapes or borders. | NCERT Class VIII *Our Pasts III*, ch. 9; Bipan Chandra et al., *India's Struggle for Independence*, ch. 10 |
| 115 | Operation Polo: Hyderabad Joins the Union | gs1-4 | Idea cards · SERIOUS | September 1948: from the Standstill Agreement to the accession, in five days. The violence that followed in one plain sentence, citing the official inquiry; no community blamed. | V.P. Menon, *The Story of the Integration of the Indian States* (1956), chs. 17–18; Sundarlal Committee report (1948, released 2013) |
| 116 | Shimla, 1972: An Agreement Between Two | gs2-9, gs1-4 | Two sides | What the Simla Agreement says: settle differences bilaterally, respect the line of control resulting from the ceasefire of 17 Dec 1971. Text only; no map of any line. | Simla Agreement text, 2 July 1972 (MEA treaty database) |
| 117 | A Rocket on a Bicycle | gs3-5, pre-7 | Story | Thumba, 1963: a church becomes an office, rocket parts go by bicycle and bullock cart, and India's first sounding rocket flies. | ISRO, "Thumba Equatorial Rocket Launching Station" history pages; Vikram Sarabhai Space Centre history |
| 118 | Chipko: Hold the Tree | gs1-6, gs3-6 | Story | Reni, 1974: the village women, led by Gaura Devi (died 1991), stop the felling. No living person drawn; the women shown as a group. | Ramachandra Guha, *The Unquiet Woods* (1989); Centre for Science and Environment, *State of India's Environment* (1982) |
| 119 | Narmada: The Dam and the Valley | gs3-6, gs3-1 | Two sides | Water and power for drylands, against displacement and the people who lost land: each side in its best words; the 2000 judgment and the tribunal award. No living activist drawn. | Narmada Water Disputes Tribunal Award (1979); *Narmada Bachao Andolan v. Union of India*, (2000) 10 SCC 664 |
| 120 | Past Question: Basic Structure | gs2-1, pre-4 | Past question explained | A real UPSC question on the basic structure, chosen from the app's past papers, answered with Kesavananda, Minerva Mills and Bommai. | The official paper (year and number); the three judgments above |

## D. Hand-back

Same as the 16 Nov prompt: one folder per manifest with the MP4s, the social cut, the poster, `.vtt` captions in the
video's language, and `manifest.json` (schema `upsc-pods/ca-week@1`), plus the fact sheet and the ledger for each
video. Put "Binge batch, 22 Nov" in the zip's name.

---------------------------------------------------------------------------------------------------------------------

## For the owner: two more asks from the same note, which need no content from you

- **More GS1 in Chai.** The automatic Chai leans to GS3 because its sources are mostly economic (RBI and the like).
  This is a code job (adding culture, history and society sources and steering the pick toward GS1), so I've proposed
  it as its own session rather than asking you for content.
- **More video variety.** This batch adds a new format (the courtroom minute) and uses two-sides, diary and timeline
  more than before. The first 100 shorts were mostly idea cards and stories.
