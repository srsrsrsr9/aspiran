# UPSC past papers: what's in, what's missing (20 Nov 2026)

Step 2 of the sales build order: every UPSC Civil Services paper as free public pages, mapped to the syllabus.
Branch `claude/past-papers-4635a3`. Nothing is deployed or imported yet: the main session merges, imports and deploys.

## The short version

- **Now in `content/pyq/pyq.json`: 52 papers, 1,559 questions** (was 11 papers and 779 questions). Added in this
  round: 41 papers, 780 questions: 30 Mains GS papers, 10 Essay papers and Prelims GS 2017 with UPSC's key.
- **Public pages are built** (`server/src/learn.ts`): `/learn/papers` (all papers by year), one page per paper,
  one page per question (with UPSC's answer where UPSC published a key), "Asked N times by UPSC" on every syllabus
  topic with the years and links, and all of it in `/learn/sitemap.xml`. Only approved papers appear.
- **Text files for the content prompt**: `content/pyq/text/pyq-mains-2016.txt` to `pyq-mains-2024.txt` (batch M5) and
  `pyq-prelims-2017.txt` (batch M6). Regenerate with `node content/pyq/tools/pyq-text.mjs`.
- **Still to do** (see the tables): GS4 for every year, Mains 2013 to 2015, Prelims GS 2014, 2015, 2024 and 2026,
  and all CSAT papers. Nothing was guessed: where a question or key could not be read for certain, the paper waits.

## Where the papers came from

- UPSC rebuilt upsc.gov.in this year. Its archive now lists **only 2016 to 2026** (question papers, no answer keys).
  Every old `/sites/default/files/...` address returns "not found", including the ones on the 11 papers already live;
  those now point to the new addresses where UPSC has one (11 papers updated).
- Older papers and **all answer keys** came from **UPSC's own files saved by the Internet Archive** (web.archive.org).
  The `source.url` is UPSC's original address and `source.how` says it is the archived copy. This applies to Prelims
  2017 (paper and key) and Mains 2019 GS1 (UPSC's new copy is a broken file). Worth a yes from the owner that
  archived UPSC files count as "from upsc.gov.in".
- Prelims 1995 to 2013 and CSAT 2011 to 2013: **not available from UPSC** anywhere, so not done.

## Mains

| Year | GS1 | GS2 | GS3 | GS4 | Essay |
|---|---|---|---|---|---|
| 2013–2015 | – | – | – | – | – |
| 2016 | done | done | done | to do | not on UPSC's list |
| 2017 | done | done | done | to do | done |
| 2018 | done | done | done | to do | done |
| 2019 | done (archived copy) | done | done | to do | done |
| 2020 | done | done | done | to do | done |
| 2021 | done | done | done | to do | done |
| 2022 | done | done | done | to do | done |
| 2023 | done | done | done | to do | done |
| 2024 | done | done | done | to do | done |
| 2025 | live already | live already | live already | live already | done |
| 2026 | done | done | done | to do | done |

- **2013–2015**: the Internet Archive has old Mains files under names without years (`GS1.pdf`, `GS11.pdf`, `GS111.pdf`,
  `GENERAL_STUDIES-IV.pdf` and others). Each needs its year confirmed from the paper itself (question count and
  marks differ: 2013 has 25 questions of 10 marks, 2014 25 of 12.5, 2015 20 of 12.5) before it can go in.
- **GS4**: sub-parts (1a, 1b), quotations and long case studies that run across pages. The text reader drops names
  and splits passages, so each case study needs checking line by line against the page. Not started, to avoid errors.
- Marks and word limits are UPSC's: 10 marks/150 words and 15 marks/250 words from 2017; 12.5 marks/200 words in 2016;
  Essay 125 marks, about 1,000 to 1,200 words.

## Prelims GS Paper I

| Year | Paper | UPSC key | Status |
|---|---|---|---|
| 1995–2013 | not available from UPSC | – | skipped |
| 2014 | archived copy | **no key found** | not done |
| 2015 | archived copy | archived key | to do |
| 2016 | on UPSC's site | **UPSC never published one that survives** | not done (would have no answers) |
| 2017 | archived copy | archived key, none dropped | **done** |
| 2018–2023 | – | – | live already |
| 2024 | on UPSC's site | archived key read (Q20, Q52 and Q57 dropped), in `content/pyq/sources/key-csp-2024-gs1.csv` | text to do |
| 2025 | – | – | live already |
| 2026 | on UPSC's site | **provisional** key read (Q64 dropped), in `content/pyq/sources/key-csp-2026-gs1.csv` | text to do |

## CSAT (GS Paper II)

None done. Papers on UPSC's site: 2016 and 2018 to 2026. Archived keys: 2015, 2017 to 2024, 2026 (provisional).
CSAT has reading passages shared by several questions; the transcript format needs a passage field first.

## How to carry on

- Tools: `content/pyq/tools/scan/` (`ocr.sh` Mains pages, `pocr.sh` Prelims columns, `msplit.py` splits Mains text
  into questions, `review.py` flags odd words, `build.py` applies a fix list and writes the transcript). Needs
  `tesseract`, `poppler`, `imagemagick` and the eng/hin `tessdata_fast` files in `$TESSDIR`.
- Per-paper fix lists (nodes and every text correction): `content/pyq/sources/mains-fixes/`. Prelims 2017's
  corrections are in its transcript.
- Prelims: `content/pyq/tools/ocr-parse.py` then `ocr-clean.py`, then check every question against the page images.
  The parser loses questions where one runs across a column; check that question numbers line up with the key
  (2017 had four such spots).
- Every paper is a draft in `pyq.json`. Import with `node server/scripts/pyq.mjs pack <folder>` then
  `npm run import -- <folder>`, and approve as usual ("Aspiran (owner publish)").
