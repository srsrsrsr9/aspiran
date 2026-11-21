# 21 Nov 2026 content zip: what went live, what didn't

Source: `docs/content/drive-download-20261121T175233Z-1-001.zip` (the content account's partial hand-back from the
v2 mega prompt). Unpacked in `docs/content/2026-11-21/`. Approvals recorded as "Aspiran (owner publish)".

## Live now (134 items written to the live database, each checked byte for byte)

| Batch | What | Notes |
|---|---|---|
| M1 + M2 | 91 syllabus notes updated in 14 files | M2 was built on M1, so M2's 13 files were used, plus M1's CSAT file. 30 notes that had no Hindi now have it. Sources are now `{name, url, opened, what}`; the packer shows them as text and keeps the list. |
| M1 | 12 CSAT practice sets | Hindi for all 180 worked questions and the passages. |
| Past papers | 4 new papers: Prelims 2024 and 2026, Mains GS4 2024 and 2026 | 56 papers, 1,797 questions now. Prelims answers from the keys read on 20 Nov (2024: Q20, 52, 57 dropped; 2026: provisional, Q64 dropped). Spot-checked 2024 Q1, 12, 41, 78. |
| Past papers | UPSC's Hindi text added to 13 Mains papers already live (2024–2026 GS1–GS4 and Essays) | English matched the live text in every question. |
| M6 | 71 Prelims 2025 explanations (why, why not each other option, the trap) | All 71 agree with UPSC's key, the question and the options. Shown on the public question pages (`/learn/papers/csp-2025-gs1/<n>`) under UPSC's answer. |
| M5 | 10 answer skeletons, Mains 2024 GS2 Q1–Q10 | New "What most answers miss" and "A recent Indian example" blocks on web and Android. |
| M4 | Federalism recorded-note walk (7 min, en + hi) | id `walk-federalism-centre-state`. |
| M3 | Hindi captions for all 257 videos | Timings match the English cue for cue. Uploaded to R2; a Hindi reader gets Hindi captions on web and Android (Android needs the next release). |

## Fixes made on the way
- Two Geography notes (atmosphere, oceans) came back with no source at all: the batch dropped the NCERT line because
  it had no link. The original source line was put back.
- Past-paper numbering normalised to the live style (`1a`, not `1(a)`; `1`, not `Q1`), so Hindi matched up.
- Video manifests: the old "AI voices" wording in their internal notes was removed (your 17 Nov rule).

## Kept, but worth knowing
- **33 recordings (about 3.3 hours) now read an older version of their note.** The note text changed a lot (sources,
  a past question, a recent example). The audio was kept because it reads the earlier, already-checked text. They
  should be re-recorded; the list is the notes whose text changed by more than 10%.
- The Prelims 2024 and 2026 answer-key links point to UPSC's answer-key page, not the PDF: UPSC's new site lists only
  its latest keys, and the PDF addresses weren't recorded on 20 Nov. The keys themselves are UPSC's.
- The M3 report lists English captions that look stale (coastline in video 143, RBI rates in 28, the 15th FC share
  in 24, and others). Not fixed yet.
- Some facts in the M2 notes are still marked unverified, each with a reason (see `checks/report-M2*.md`).

## Not imported here (proposed as their own sessions)
- **B1 Syllabus Companion and B2 Polity workbook**: need laying out as PDFs. B2's back matter isn't written.
- **K1–K6 marketing**: posts queue, website words, emails, Play listing, video packaging.
- **A1 (3) and A2 (4) audio scripts**: need recording.

## Not delivered yet (still with the content account)
M2: 7 note files (ethics, ethics-2, world history, ancient-medieval-culture, science-technology, society; CSAT done).
M5: GS2 Q11–20, GS1, GS3, GS4 of 2024; 2023–2016. M6: 29 of the 2025 questions; 2023, 2021, 2019, 2018.
M7, M9–M12. B2 back matter, B3 Ethics, B4–B11. A2 (199 episodes), A3, A4. Long videos: Monsoon, 1857 and
Federalism Hindi are made but not rendered; the Federalism English video is in the project files, not in this zip.

## Before anything uses them
The long-video note says its three past questions came from memory and must be checked against UPSC's papers, and
that the Fish Audio and OpenRouter keys should be rotated (your step).
