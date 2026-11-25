# Scan tools for UPSC papers

UPSC's papers are scans. These turn them into the transcript TSV that `server/scripts/pyq.mjs add` reads.
Needs `tesseract`, `poppler` (pdftoppm, pdfinfo), `imagemagick`, and eng/hin/osd `tessdata_fast` files in `$TESSDIR`.

Mains:
1. `ocr.sh paper.pdf ocr/<id>`: one text file per page (English and Hindi).
2. `python3 -I msplit.py ocr/<id> > draft.json`: English lines only, split into questions.
3. `python3 -I review.py draft.json`: each question, odd words in [[ ]], to check against the PDF.
4. Write a fix list (see `content/pyq/sources/mains-fixes/` and the top of `build.py`): syllabus node per question,
   every correction, or the full text where the reader garbled it.
5. `python3 -I build.py <id> draft.json fixes.txt > <id>.tsv`, then `node server/scripts/pyq.mjs add <id> <id>.tsv <url>`.

Prelims: `pocr.sh paper.pdf pocr/<id>` (English pages, each column separately), then `../ocr-parse.py` and
`../ocr-clean.py`. Check that question numbers line up with UPSC's key: the parser merges questions that run across
columns. Keys go in as `n,a|b|c|d|dropped` CSVs, copied from UPSC's key for the same booklet series as the paper.

CSAT (GS Paper II): comprehension questions share a passage. In the transcript TSV a passage is its own line,
`P<TAB><id><TAB><text>` (ids p1, p2 … in printed order, "\n" for a new paragraph), and each question that reads it adds
the id as a tenth column after option (d). `pyq.mjs check` fails a question that names a missing passage and a passage
no question reads. Questions built on a figure or table that text cannot carry are left out and listed in the paper's
`how` note.
