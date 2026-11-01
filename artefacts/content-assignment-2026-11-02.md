# Your content work, from 2 November 2026

## Decide first (two answers, then everything below can run)
1. **Optionals, and in what order.** The other chat suggested starting with the first 5 nodes of each optional
   (Sociology, Geography, PSIR, Anthropology, History, Public Administration) so every one has a working start.
   I recommend that. Say yes, or give your own order.
2. **Video topics.** Approve or change the 18 topics in Part 4. You build the videos too (owner, 2 Nov).

---

## Part 1. What the B01 paste had (checked by code on 2 Nov)

Saved in `content/brief/aspiran-content/` (47 files, all drafts). All 47 are valid JSON with every required field.
Every English line has Hindi, and every word limit is met. There are no banned words, and no emoji outside light moments.

| Batch | In the paste | Brief asks | State |
|---|---|---|---|
| B01 pause lines + Chotu voice | 50 lines, voice sheet with 30 examples | same | **Done.** Good quality; feelings replies follow the crisis rule |
| B09 term lists | Society (79), International relations (80) | 8 subjects × 80 | **6 lists missing** from the paste |
| B10a Sociology | nodes 3, 4, 5 | | Done. Nodes 1–2 and the syllabus file are not in the paste |
| B10c Geography | nodes 3, 4 | | In progress. Nodes 1–2, 5 and the syllabus file are missing |
| B11 interview | 5 personas, 300 questions (no repeats, no banned topics) | same | **Done** |
| B12 essays | 24 topics (12 abstract, 12 issue) | same | **Done** |
| B02–B08, B13 | none | | Not started |

**If the other chat has earlier replies** (the six term lists, B10, the syllabus files, Geography nodes 1–2), save
them too. Its B09 manifest says all 8 lists were made, so they are probably higher up in that chat.

## Part 2. Fixes to paste into the next chat
Paste this as it is:
```text
Fixes from Claude Code's check of B01, B09, B10a, B10c:
1. terms/society.json has 79 terms; add one so it has 80.
2. Six examples have an empty "source": soc-p1-03, soc-p1-04, soc-p1-05 (one each), geo-p1-03 (two), geo-p1-04 (one).
   Give each a real source, or move the claim into factsToCheck.
3. Sociology recall cards lean on "define" (6 or 7 of 12, only 1 "compare"). Rebalance to about 3 of each kind.
Answers to your open questions:
- Journal: true as written. Journal text stays on the phone and never reaches the server or Chotu.
- Chotu's "who" at 56 words is fine: 60 is a cap.
- Interview bank in three files is fine; Claude Code merges it. The extra "group" and "id" fields are fine.
- Term-list slug "science-technology" is fine.
- Optionals order: [your answer from "Decide first"].
```

## Part 3. The rest of the brief (one chat per batch)
**How to run it:** use one claude.ai Project, following `artefacts/content-project-how-to.md`. It replaces the
incognito steps and the per-batch prompts in `artefacts/content-prompts/`. The batch list and order are in the
Project's `02-status.md`; the table below is the overview.

| Order | Batch | What | Chats |
|---|---|---|---|
| 1 | B10c | Geography node 5 (finish) | 1 |
| 2 | B02, B03, B04 | Mains skeletons for the 2025 GS1, GS2 and GS3 papers (60) | 3 |
| 3 | B05 | GS4 ethics cases (24) | 1 |
| 4 | B06 | GS4 thinkers (40) and terms (60) | 1 |
| 5 | B07 | CSAT printable sets (8 weeks) | 1 |
| 6 | B08 | Walk-mode audio scripts (20) | 1 |
| 7 | B13 | Welcome-back scripts (12) | 1 |
| 8 | **B14–B22 (new)** | **Syllabus notes for the gaps** (see below) | 9 |
| 9 | B10 onwards | Optionals, in the order you choose | 3–6 per optional |

**Why B14–B22 matter most.** The app's Prep tab has notes for only four subjects (Economy, Environment, Geography,
Modern history: 30 notes). Polity, governance, IR, culture, world history, society, science, internal security and
all of Ethics have none. These nine batches add about 70 notes, in English and Hindi. They are now in the brief:
upload the new version, `artefacts/Aspiran content brief for Claude.md`, to the Project and replace the old file.

## Part 4. Videos (yours)
Episodes 4–9 (`docs/content/`) plus 1–3 from your pack are good drafts: claims checked, honest review notes. They're
English only, use a placeholder voice and aren't in the app yet.

**How to build the next ones:** videos need code, so use a chat with **code execution and web search turned on** (Claude
Sonnet), upload `upsc-pods-kit.zip`, and paste **Prompt A** from the kit's README with a batch of rows from below. Ask
for one episode at a time if it runs out of room. Record the narration in ElevenLabs from each `.elevenlabs.txt`.
Put the finished episode folders in `~/Downloads/aspiran-videos/`. I check the files and add them to the app as drafts.

**V1 (8 episodes, mostly Polity, the biggest gap):** 10 India's carbon market · 11 Seats frozen until a census ·
12 GDP base year · 14 Money Bill vs Financial Bill · 15 Ordinances and re-promulgation · 16 Why a bill lapses ·
17 Basic structure · 18 Fundamental Duties.

**V2 (10 episodes):** 19 Deficits and the FRBM anchor · 20 Inflation targeting · 21 Forest (Conservation) Amendment
2023 · 22 Western disturbances vs the monsoon · 23 WTO peace clause and MSP · 24 Tribunals and independence ·
25 DPDP Act 2023 · 26 Project Cheetah · 27 Governor's assent timelines · 13 Indus Waters Treaty (SERIOUS and contested;
last, strictly neutral, and only if you're comfortable).

**Later:** choose a Hindi voice so every episode also gets a Hindi version.

## What happens to everything
Every file comes to me. I check it with code, fix the format, and import it as **drafts**. Making content is your
work; mine is the app, the website, pedagogy, marketing and the quality of the whole journey. Nothing shows as checked
until an English and a Hindi editor approve it.
