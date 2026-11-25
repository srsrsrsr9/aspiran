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
  - The older past papers (CSAT).
- **Live since 25 Nov:** the GS4 papers, Mains 2013–15, Prelims 2015 and two rounds of fact checks are imported and approved (see "Live" at the end).

Checked against `content/` and a read-only look at production on 24 Nov 2026.

| Gap | Size | Who fixes it | Status |
|---|---|---|---|
| **Hindi missing** | 40 past papers have no Hindi: Mains 2016–2023 (now including GS4) and all Prelims papers. Every note and all 12 CSAT notes have Hindi. | Claude, from UPSC's own Hindi text. It needs Hindi text recognition, which this Mac lacks (only English is installed). | Open |
| **Telugu** | 0 items. Telugu is the pilot language. | Owner (content), Claude checks | Open. In the assignment |
| **Unverified facts: notes** | 131 → **86** left in `content/syllabus` | Claude | 45 done today. 42 were checked against UPSC's 2026 notice and our past-paper file; 3 against PIB. The rest need primary sources opened. |
| **Unverified facts: topic paths** | 41 (Polity paths gs2-1, gs2-3 to gs2-7, pre-4) | Claude | Open |
| **Unverified facts: live copies** | 190 marks in production (72 reads, 12 mocks, 7 paths) | Claude | Drops when the notes are re-imported |
| **Past papers** | 83 papers in the file, all 83 live (2,611 questions). | Claude | GS4 2016–2023, Mains 2013–15 (all 15) and Prelims GS 2014, 2015 and 2016 with UPSC's keys **done** (25–26 Nov). CSAT 2016 **done** (26 Nov), the first CSAT paper. Still missing: CSAT 2014, 2015 and 2017–2026. UPSC's keys for Prelims 2014, 2015 and 2016 came from the Internet Archive (filed under odd names, e.g. `CSP_15_GS_I_AKy.pdf`). Mains has no answer key in any year: UPSC never publishes one. |
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

## Live (25 Nov 2026)

Imported to production on 25 Nov 2026 and approved as "Aspiran (owner publish)". This replaces the import commands above.

- **54 items written:**
  - The 8 GS4 papers, 2016–2023, approved in English. Hindi stays open.
  - 46 notes in 12 files: only their `factsToCheck` changed. They stay approved in English and Hindi, re-recorded as
    Aspiran (owner publish) on 25 Nov.
- **Recordings kept.** A full re-import would have dropped the recorded readings on 44 notes, so the rows were written
  straight to the database, the same way as on 21 Nov. Script: `artefacts/content-import-2026-11-25/live-import.py`.
- **Checked:** one history row per item. A dry run on a local copy and the live read-back both matched byte for byte
  (54 rows, 0 differences).
- **Live counts now:** 64 past papers (was 56), 150 notes, 1,371 library items (was 1,363).
- **Spot-checks on app.aspiran.in** (all load):
  - `/learn/papers/csm-2016-gs4`: all 18 questions; Q14 is 25 marks, 300 words.
  - `/learn/papers/csm-2018-gs4/12`: the Snowden case.
  - `/learn/papers/csm-2023-gs4/1a` and the `/learn/papers` list.
- **Undo point:** D1 bookmark `00000dd8-00000000-0000512e-4b57c11d0bb310cf730da4210421572c`, taken before the writes.

## Live (25 Nov 2026, part 2)

Written straight to the database the same way as part 1 and approved as "Aspiran (owner publish)". Script:
`artefacts/content-import-2026-11-25b/live-import.py`; read-back check: `verify.py` in the same folder.

- **Round 1 (70 items):**
  - The 15 Mains papers for 2013, 2014 and 2015: Essay and GS1–GS4. English approved, no answer key.
  - 47 notes and 7 topic paths. Only their `factsToCheck` changed. Recordings are kept.
  - Topic paths are larger than D1's 100 KB statement limit, so only `factsToCheck` was sent, using `json_set`.
  - A dry run on a local copy and the live read-back both matched byte for byte: 69 rows, 0 differences.
  - Undo point: bookmark `00000e27-00000000-0000512e-3d0991097b8b3fd2640379825a4d77aa`.
- **Round 2 (1 item):**
  - Prelims 2015 GS Paper I, all 100 questions, from booklet series A. UPSC's own file came from the Internet Archive.
  - Published first without answers. UPSC's key was then found in the archive as `CSP_15_GS_I_AKy.pdf` and added the
    same day (round 3).
  - Live read-back matched byte for byte, with one history row.
  - The local dry run did not run because of a shell slip. The insert is the same form that passed its dry run in round 1.
  - Undo point: bookmark `00000e2a-00000000-0000512e-9a16ff419baff121b866b8c94ea86a58`.
- **Round 3 (1 item):** Prelims 2015's answers from UPSC's official key (series A, no questions dropped). The script is `key-update.py`.
  Seven answers were spot-checked against the questions. A dry run and the live read-back both matched byte for byte.
  Undo point: bookmark `00000e36-00000000-0000512e-02ac5efa3d0a2bc4a44d68f460eef31c`.
- **Live counts now:** 80 past papers (2,331 questions), 1,387 library items, all approved.
- **Spot-checks** on app.aspiran.in all load:
  - `/learn/papers/csp-2015-gs1`
  - `/learn/papers/csp-2015-gs1/66`: UPSC's own printed "30° N and 60° S" is kept as printed.
  - `/learn/papers/csm-2015-gs4/1a`
  - The `/learn/papers` list can take up to an hour to show new papers, because of the edge cache.

## Live (26 Nov 2026)

- **Prelims 2016 GS Paper I:** all 100 questions, booklet series A (B-APM-P-CKB/65A), with UPSC's official key.
  - Both are UPSC's own files from the Internet Archive: the paper is `GENERAL_STUDIES_PAPER-I.pdf` and the key is
    `CSP_16_GS_Paper_I.pdf`. No questions were dropped.
  - Ten answers were spot-checked against the questions.
  - A dry run on a local copy and the live read-back both matched byte for byte, with one history row.
  - Undo point: bookmark `00000e4b-00000000-0000512e-c5a2c6b1b64e94ed26a3548b0e1366db`.
- **Prelims 2014 GS Paper I:** all 100 questions, booklet series A (B-FVS-N-IVUA/58A), with UPSC's official key.
  - Both are UPSC's own files from the Internet Archive: the paper is `General studies-I.pdf` and the key is
    `CSP_14_Gen_Study_I0001.pdf`. No questions were dropped.
  - About twenty answers were spot-checked against the questions.
  - A dry run on a local copy and the live read-back both matched byte for byte, with one history row.
  - Undo point: bookmark `00000e4d-00000000-0000512e-6ee3ef3dde18f7a57480fc1d6bb8a8ce`.
- **CSAT 2016 (GS Paper II), 26 Nov:** all 80 questions, booklet series A, with UPSC's official key. The first CSAT paper.
  - Both are UPSC's own files from the Internet Archive: the paper is `GENERAL_STUDIES_PAPER-II.pdf` and the key is
    `CSP_16_GS_Paper_II.pdf`. No questions were dropped.
  - 20 reading passages, each printed once and shared by its questions (the puzzle "directions" sets count as passages too).
  - Every maths and reasoning answer was worked out and matches the key. No question needed a figure.
  - The daily post now skips passage questions (deployed). The Android app shows a "Read the passage" button;
    that needs the owner's next Android build. The web pages already show passages.
  - A dry run on a local copy and the live read-back both matched byte for byte, with one history row.
  - Undo point: bookmark `00000e59-00000000-0000512e-1952e5f8e488feeaf16527a27cb6155c`.
- **Live counts now:** 83 past papers (2,611 questions).
- **Next:** CSAT 2017–2024 (UPSC's keys found in the Internet Archive), then 2014 and 2015. Keys for 2019, 2025 and 2026
  are still to find. Questions built on a figure will be left out and listed, never guessed.
