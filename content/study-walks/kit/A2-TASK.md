# A2 task: five study-walk episodes, one per syllabus line

1. Read `BRIEF.md` in this kit folder in full and follow it. A2 length: 8 to 10 minutes; English 1,100 to 1,380
   words, Hindi 1,150 to 1,650 words. kind `audio-study-walk`, `line` = {index, en (the line text as given), hi
   (your Hindi for it)}, `node` as given, `batch` as given.
2. For the format and quality bar, read ONE approved pilot script:
   `/tmp/claude-0/-home-user/bd0b5b15-874e-57cb-9ef9-a74e9896ca50/scratchpad/out/A1/a1-polity-basic-structure.en.txt`
   (and glance at its .json). Yours are shorter but built the same way.
3. Each episode teaches its own syllabus line, not the whole topic. Neighbouring lines of the same topic are being
   written by other writers, so stay inside your line and don't retell the neighbours' material at length.
4. Usage is tight. Keep research focused: 3 to 6 sources per episode, opened today. Use `pyq.json` (filter by node
   and keywords) for a past question and the kit `notes/` for leads. Prefer pages that load quickly
   (indiankanoon.org, prsindia.org, pib.gov.in, rbi.org.in, eci.gov.in, mea.gov.in, ncert.nic.in, sansad.in,
   legislative.gov.in, ministries). If a source won't load in two tries, move on and use factsToCheck.
5. Work one episode at a time and **save its three files before starting the next** (en.txt, hi.txt, json), so
   nothing is lost if work stops. Then append that episode's section to your `_report-<first id>.md`.
6. After all five, run `python3 -I <kit>/check_audio.py <your batch folder>` and fix every problem in YOUR files
   (ignore other writers' files in the same folder).
7. Reply with at most 8 lines: per episode the word counts and the number of factsToCheck; anything skipped as
   TRAGIC; anything contested.
