# Content gaps, 24 Nov 2026

**In short.**
- Live content: 1,363 library items, all approved, with no topic left empty.
- **What I fixed today (branch `claude/content-gaps-271fb5`):**
  - 8 GS4 (Ethics) Mains papers, 2016–2023: 151 questions in English, taken from UPSC's own PDFs.
  - 45 facts in the notes are now checked against a source.
  - 5 time-sensitive facts are updated to today.
- **Biggest gaps left:**
  - Telugu: nothing exists yet.
  - Chai: no approved card is GS1, GS2 or GS4.
  - 33 recordings and 3 videos say outdated things. These need your recordings or re-renders.
  - The older past papers (Mains 2013–15, CSAT).
- **Not done yet:** nothing is imported or deployed. The commands to do that are at the end.

Checked against `content/` and a read-only look at production on 24 Nov 2026.

| Gap | Size | Who fixes it | Status |
|---|---|---|---|
| **Hindi missing** | 40 past papers have no Hindi: Mains 2016–2023 (now including GS4) and all Prelims papers. Every note and all 12 CSAT notes have Hindi. | Claude, from UPSC's own Hindi text. It needs Hindi text recognition, which this Mac lacks (only English is installed). | Open |
| **Telugu** | 0 items. Telugu is the pilot language. | Owner (content), Claude checks | Open. In the assignment |
| **Unverified facts: notes** | 131 → **86** left in `content/syllabus` | Claude | 45 done today. 42 were checked against UPSC's 2026 notice and our past-paper file; 3 against PIB. The rest need primary sources opened. |
| **Unverified facts: topic paths** | 41 (Polity paths gs2-1, gs2-3 to gs2-7, pre-4) | Claude | Open |
| **Unverified facts: live copies** | 190 marks in production (72 reads, 12 mocks, 7 paths) | Claude | Drops when the notes are re-imported |
| **Past papers** | 64 papers in the file. 56 are live; the 8 GS4 papers are new drafts. | Claude | GS4 2016–2023 **done**. Still missing: Mains 2013–15 (all papers), Prelims GS 2014, 2015 and 2016 (UPSC has no surviving key for 2014 or 2016), and all CSAT papers (these need a passage field in the format first). |
| **Audio** | 33 recordings (about 3.3 hours) now read an older version of their note | Owner, when voice work resumes | Paused (wisdom shorts are paused over pronunciation) |
| **Video captions** | Videos 143 (coastline 7,516.6 km, re-measured 11,098.81 km), 28 (RBI corridor rates), 24 (15th Finance Commission, no "as of" date), 25 (consent managers, in the future tense), 14 (Article 117(3) should be 117(1)) | Owner (re-render) | **Not changed, on purpose.** Each caption follows the spoken voice, so editing the caption alone would make it disagree with the audio. The fix is new narration plus a re-render, and then the captions follow. |
| **Video facts not yet checked** | 10 dated claims in the 2026-45 and 2026-46 videos (for example GDP base year, Cheetahs, balance of payments) | Claude | Open |
| **Thin syllabus topics** | Post-independence India 11 items, world history 12, diaspora 12, earthquakes 13, Essay topics 13, neighbourhood 16, disaster management 18 | Owner (content) | In the assignment |
| **Chai cards by paper** | All 110 approved cards are GS3. GS1 has 14 cards (11 draft, 3 auto), none approved. GS2 has 11 (9 draft, 2 auto). GS4 has none. | Owner (sources and cards), Claude checks and publishes | In the assignment |
| **Long-video past questions** | Written from memory, not taken from UPSC's papers | Claude, against `pyq.json` | Open |

## What changed today (3 commits)

| Commit | What it does |
|---|---|
| `0169855` | Adds GS4 papers 2016–2023 to `content/pyq/pyq.json`, as drafts like every paper before them. Each paper adds up to 250 marks. Doubtful words were checked against the page images. UPSC's own typos are kept as printed (for example "keep quite" in 2016 and "relentness" in 2021). |
| `c805f40` | Marks 42 note facts verified. The syllabus wording and negative marking were checked against UPSC's CSE 2026 notice. Every past question that a note names was checked in `pyq.json`, against UPSC's key where there is one. |
| `0bffa2d` | Rechecks the time-sensitive facts. Verified from PIB: SHANTI Act assent and the 1 Feb 2026 tobacco and pan masala levy. Updated to today but still marked unverified, because only news reports were found: the Lok Sabha 131st Amendment Bill defeat, the Ganga treaty (no renewal as of today; it expires 12 Dec), the seismic map rollback, and COP31. |

## Import (for the coordinating session)

Run these from the main checkout after merging `refs/heads/claude/content-gaps-271fb5`. Then approve the new items as
"Aspiran (owner publish)", the same way as before.

```bash
node server/scripts/pyq.mjs check
node server/scripts/pyq.mjs pack ~/Documents/app-packs/pyq-2026-11-24
cd server && npm run import -- ~/Documents/app-packs/pyq-2026-11-24
node scripts/syllabus.mjs check
node scripts/syllabus.mjs pack ~/Documents/app-packs/syllabus-2026-11-24
npm run import -- ~/Documents/app-packs/syllabus-2026-11-24
```

Both checks passed on the branch.
- **Past papers:** 64 papers and 1,948 questions. The 8 GS4 papers are new; the rest import unchanged.
- **Syllabus:** only the `factsToCheck` lines changed, in 12 note files.
