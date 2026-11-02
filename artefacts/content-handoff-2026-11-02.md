# Content hand-off for the claude.ai Project (2 Nov 2026)

For the owner: paste **Message 1** into the content Project as it is. Videos need a different kind of chat (Message 2).

**Upload to the Project first:**
- `content/mocks/prelims-gs1-full-mock-1.json`, `-2.json`, `-3.json` (for B24)
- `content/csat/comprehension-set-1.json` (shows the CSAT format, for B23)

**For the video chat:** `upsc-pods-kit.zip`. It's inside `docs/content/files (1).zip`; unzip that first.

---

## Message 1: paste into the content Project

```text
Claude Code here (the Aspiran app side). I checked everything you made, B01 to B22, by code:

- All 25 zips open, every file is valid JSON, ids are unique, en and hi sit side by side, nothing is marked approved.
- The 60 answer skeletons line up with the real 2025 Mains questions.
- The 9 syllabus files have 70 notes of 580–815 words, and each Hindi version has the same sections.
- B06 has 40 thinkers and 60 terms. B09 has 8 term lists of 80 terms each.
- The optionals each have a syllabus map and nodes 1–5.
I'll handle the small format fixes on my side (subject codes for internal security and world history).
Thank you. What's left is below, in this order. Same rules as the brief (Parts C and E): drafts only, facts in
factsToCheck, en and hi side by side, run your own code checks before zipping, one zip per batch.

B23. CSAT full mocks (2 papers × 80 questions)
- File: mocks/prelims-csat-full-mock-<n>.json, the same shape as the uploaded GS mocks, with
  "paper": "prelims-csat", "minutes": 120, "marking": {"right": 2.5, "wrong": -0.83, "blank": 0}.
- Mix per paper, roughly like recent UPSC CSAT papers: about 26–30 comprehension questions (in passage sets, the
  passages original, like the uploaded comprehension set), with the rest split across basic numeracy, data
  interpretation, logical and analytical reasoning, and decision-making.
- Every numeracy and reasoning question needs a full worked "why". Check every answer by running code, not by reading.
- Put "hi" on each question with q, statements, ask, options and why in Hindi. Numbers and option order stay the
  same as the English.
- Original questions only. No past-paper question is copied or presented as one.

B24. Hindi for the three GS mocks (300 questions, uploaded)
- Add a "hi" object to each question: q, statements, ask, options, why. Change nothing in the English, the answers
  or the option order.
- Use the B09 term lists for standard terms (e.g. the names of constitutional bodies, as UPSC's Hindi papers write them).
- Add a "hiCheck" list at the file level for any term you weren't sure of.

B25 onwards. Optionals, the next nodes
- Before writing nodes, make optionals/<optional>/priority.json for each of the six: the 25 nodes that matter most,
  in order, each with one line on why.
- If you name past-paper years as the reason, every year goes in factsToCheck. If you aren't sure, say "often asked"
  without a year.
- Then make nodes in that priority order, 5 per batch, in this order of optionals: Sociology, PSIR, Anthropology,
  Geography, Public Administration, History.
- Same node format as B10, with practiceQuestions isPYQ: false.

When you're out of credits, stop at the end of a batch, zip what's done, and list where you stopped.
```

---

## Message 2: videos (a separate chat)

Videos need code. Open a new chat with **code execution and web search turned on** and upload `upsc-pods-kit.zip`.
The kit's README (section 7) has the full production prompt. This message points to it and fills in the batch. Send
it once per episode if the chat runs short.

```text
Unzip upsc-pods-kit.zip into ./kit, read ./kit/README.md fully, run `bash kit/setup.sh`, then follow
"Prompt A: produce a batch of episodes" in README section 7 exactly, with the BATCH below. The product is now called
Aspiran (the README still says UPSC Pods); don't put either name on screen. Previous format in the pack: S (episode 9).
Make one episode at a time and give me each episode's dist/ files as a zip as soon as it passes QA.

BATCH (V1)
n | seed title | GS paper(s) | tone | quiz seed | notes
10 | India's carbon market has no cap | mains-gs3 | NEUTRAL | Intensity vs absolute target | CCTS under the Energy Conservation Act: intensity-based? which sectors are notified today; trading start and status
11 | Seats are frozen until a census, not a date | mains-gs2 | NEUTRAL | Which census the freeze depends on | Articles 81/82, 84th and 87th Amendments; current census schedule; no political claims
12 | A new GDP base year can change growth without changing output | mains-gs3 | LIGHT | What rebasing changes | which base year is in force today; any new MoSPI series and what changed; dated figures only
14 | A Money Bill and a Financial Bill are not the same thing | mains-gs2 | NEUTRAL | What the Rajya Sabha can do with a Money Bill | Articles 109, 110, 117; the Speaker's certificate; state only what the Constitution says
15 | An ordinance can't be renewed forever | mains-gs2 | NEUTRAL | What Krishna Kumar Singh held | Article 123; six weeks from reassembly; Krishna Kumar Singh (2017): bench and holding from the judgment
16 | Dissolving the Lok Sabha kills some bills, not all | mains-gs2 | NEUTRAL | Which bill does not lapse | Article 107(5) and 108; bills pending in the Rajya Sabha; joint sitting notified before dissolution
17 | Parliament can amend almost anything, but not the Constitution's identity | mains-gs2 | NEUTRAL | Which case set out basic structure | Kesavananda Bharati (1973): bench size and holding; later cases only if sourced
18 | Fundamental Duties can't be enforced by a court, yet courts use them | mains-gs2 | NEUTRAL | Which amendment added Article 51A | 42nd and 86th Amendments; how courts have used 51A (sourced cases only)

BATCH (V2, after V1)
19 | The deficit that matters most isn't the headline one | mains-gs3 | NEUTRAL | Primary vs fiscal deficit | FRBM anchor as it stands today; dated figures only
20 | India's inflation target is a band, not a number | mains-gs3 | NEUTRAL | The tolerance band | 4% ± 2%; the latest review and its outcome as of today
21 | After 2023, "forest" means something narrower on paper | mains-gs3 | SERIOUS | What Godavarman said a forest was | Forest (Conservation) Amendment Act 2023; any Supreme Court orders since; neutral
22 | Western disturbances bring winter rain the monsoon doesn't | prelims-gs | LIGHT | Where western disturbances come from | IMD sources only
23 | The WTO's peace clause shields India's grain stocks, for now | mains-gs3 | NEUTRAL | What the peace clause protects | Bali 2013 and the 2014 decision; India's use of it; status today
24 | Tribunals keep losing to the Supreme Court | mains-gs2 | NEUTRAL | What the Tribunals Reforms Act 2021 changed | the line of tribunal cases and the 2021 Act; each case's holding from the judgment
25 | India's data law gives you rights, and the rules decide when | mains-gs2 | NEUTRAL | Who is a Data Fiduciary | DPDP Act 2023; which rules are notified and in force today
26 | Project Cheetah started with a court's permission | mains-gs3 | NEUTRAL | Where the first cheetahs came from | the Supreme Court's 2020 order; counts only "as of <month year>"
27 | Governors now have a clock on assent, or do they? | mains-gs2 | SERIOUS | Which Article covers the Governor's assent | Article 200; the 2025 judgment and the Presidential reference outcome; strictly neutral
13 | The Indus Waters Treaty has no exit clause | mains-gs2 | SERIOUS | Which rivers go to India | Last. Treaty text and each side's formal statements with dates only. Skip if in doubt
```

After each episode, put the zip in `~/Downloads/aspiran-videos/` and tell Claude Code. Claude Code checks the files
and adds them to the app as drafts. Hindi versions wait until you choose a Hindi voice in ElevenLabs.
