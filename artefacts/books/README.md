# Aspiran Workbooks: the idea, the purpose, how it works

Written 17 November 2026. Status: an idea with a working sample. Nothing is printed or listed yet.

## In one paragraph

Aspiran publishes printed **workbooks** for UPSC subjects: books that aspirants write in, colour in, solve,
and add to until exam day. A textbook is worth the same on exam day as the day it was bought. A
workbook is worth more every week, because it slowly fills with the owner's own notes, mistakes and
examples. The main goal is to **make the Aspiran name visible** (on desks, in libraries, in Telegram
groups, on Amazon), not to make money. Every chapter carries a QR code back into the app.

## Why

- **Visibility.** Books are seen and shared in places an app never reaches: library desks in Mukherjee
  Nagar and Old Rajinder Nagar, "my prelims shelf" photos, Telegram PDFs, Amazon search results for "UPSC notes".
- **A gap nobody fills.** Every UPSC book is meant to be read. Notes books (PMF IAS, Vision, Disha) are
  still finished notes. Almost no one sells a book the aspirant **completes**.
- **The research supports it.** Recalling from memory, spacing revisits and producing your own answer
  ("retrieval practice", "spacing", "the generation effect") beat rereading. The app already teaches
  this way; the workbook does it on paper.
- **It's hard to copy.** A pirated PDF of a workbook is still a workbook to print and fill in, and it
  still carries the Aspiran name and QR codes. Piracy spreads the brand.
- **It doesn't fight Laxmikanth.** Every chapter starts with "read your main book first". The workbook
  sits next to whatever book the aspirant already trusts.

## What makes it a workbook (design rules)

1. **The reader finishes the notes.** Fill-in notes with numbered gaps: read the main book, close it,
   fill in pencil, check the key, go over in ink.
2. **Blank diagrams, not finished ones.** Diagrams to fill, maps to colour, timelines with a word bank,
   "draw it again from memory" spaces with a date line.
3. **Help that fades.** The first rows of a table are written in; the rest are blank.
4. **Explain, don't just tick.** Every statement in a UPSC-style question gets a "because…" line.
5. **One Mains answer per chapter,** with a planning box, a short self-check and "rewrote it on" dates.
6. **Pages that keep growing until the exam:** news log per chapter (with a clipping space), mistake
   log, PYQ tracker, "things I keep forgetting", the reader's own index, their own night-before sheet.
7. **It becomes theirs.** "This workbook belongs to", their own highlighter colour code, margin marks
   (★ past paper, ? doubt, ! keep forgetting, N in the news, ↔ link, ✓ sorted).
8. **Before and after.** Each chapter opens with "write what you already know" and ends by sending the
   reader back to that page.
9. **Private confidence, never scores.** A per-chapter confidence chart (shade a circle on each pass).
   No streaks, no timers, no public scores, the same as the app.
10. **English and Hindi.** The full book puts both side by side. The sample has one Hindi page.
11. **Facts from primary sources only:** the Constitution, amendment Acts, Supreme Court judgments,
    government reports. No other book's wording or structure.
12. **Maps are schematic with no national borders** (the app's rule, and the legal safe ground in print).

## Anatomy of a chapter (about 9 to 10 A4 pages)

| Page | What the reader does |
|---|---|
| Opener | What you'll be able to do; "before you read": write what you already know |
| Fill-in notes | Complete numbered gaps; a margin column for their own notes |
| Build it | Blank diagram(s), matching, colouring |
| In your own words | Explain key terms, add an example |
| Timeline / sort | Place cases or events; sort statements |
| Practise | Recall questions, then UPSC-style with reasons; QR to check and go further |
| Mains | Plan and write one answer |
| News log | Keep adding until the exam; go back to the opener page |

Back of each book: cut-out flashcards (some blank), night-before sheet, mistake log, PYQ tracker,
"things I keep forgetting", own index, full answer key.

## The link to the app

Each chapter has a QR code (`aspiran.in/?src=wb-<subject>-ch<n>`). Scanning it should open that
chapter in the app: check the fill-ins, more questions based on what they missed, the chapter's audio,
a pod revising the same topic. **Not built yet:** today the codes just open aspiran.in with a tag we can
count. The `src` tag lets us measure installs and sign-ups from each book.

## One book for the whole syllabus, or a series?

**A series.** One workbook for the whole syllabus would be too big to use:

- Polity alone is about 12 chapters × 10 pages = **120 to 150 pages**. The whole GS syllabus
  (GS1 to GS4, plus CSAT) is 12 to 15 subjects, so a single book would run **1,500 pages or more**.
- Print-on-demand partners cap a paperback at roughly 700 to 800 pages. A workbook also has to lie
  open on a desk and be carried around.
- A huge book would take the owner a year or more to finish. A series can launch with one book and
  learn from it.

**What one book can cover instead: the "Syllabus Companion".** A thin (about 120 pages) workbook for
the whole syllabus that holds no notes, only the structure: the full syllabus as a map with a confidence
chart per topic, one PYQ tracker, one mistake log, a news log by paper, Mains answer planning pages,
and a revision calendar the reader fills in. It's quick to make, it's useful to every aspirant whatever
books they use, and it puts the Aspiran name on the desk from day one.

**Suggested order:**

1. **Polity** (sample done). Most read subject, clear structure, best for showing the format.
2. **Syllabus Companion** (whole syllabus, no notes). Fast to make; widest reach.
3. **Ethics (GS4).** Case studies and "write your own example" fit the workbook format best, and
   few good GS4 books exist.
4. **Economy**, then **Environment**, **Modern History**, **Geography**, **Art and Culture**,
   **Science and Tech**, **International Relations**, **Society and Governance**.

## How it gets made

- **Content:** the owner makes the content (standing rule). Claude formats it, builds the pages,
  checks facts against primary sources, and writes the answer key. The workbook can reuse the app's
  content packs (they already hold English and Hindi side by side).
- **Pages:** one HTML file per book, printed to PDF with Chrome. The sample shows the method.
- **Checking:** every fact checked before print. Don't claim "checked by a human editor" until it is.
  Print-on-demand means a fix reaches the next copy printed.

## How it gets printed and sold

- **Print on demand.** Indian partners such as Notion Press, Pothi or BlueRose list on Amazon.in and
  Flipkart. Amazon KDP may also print for India. Terms not yet checked.
- **ISBN:** free in India from the Raja Rammohun Roy National Agency for ISBN, or through the partner.
- **Paper and binding:** thicker paper (at least 80 gsm) so highlighters don't bleed. Spiral binding is
  ideal for a workbook but many print-on-demand partners only offer perfect binding: check first.
- **Price:** priced to be easy to buy, about cost plus a small margin (to be worked out with the
  partner's cost sheet). The aim is reach, not profit.
- **Free printable PDF** of chapter 1 of each book on aspiran.in, to spread the format.

## How we'll know it works

- Scans and installs per book (the QR `src` tags).
- Amazon reviews and rank in "UPSC" searches.
- Photos of filled-in pages posted by aspirants (ask for them; feature them on the website).
- Pod joins that come from a book.

## Risks

| Risk | What we do |
|---|---|
| A wrong fact in print | Primary sources only; full check before print; reprint fixes quickly |
| The owner's time | Series, one book at a time; reuse the app's content packs |
| Copyright | Never rework another book's wording or structure |
| Maps | Schematic, no national borders |
| QR promises the app can't keep yet | Build the chapter landing screens before the first print run |
| Notes-book market is crowded | The edge is the workbook format, the app link and two languages |

## Decisions for the owner

1. Go ahead with the Polity workbook as book one?
2. Make the Syllabus Companion second?
3. Which print-on-demand partner (Claude can compare current terms)?
4. Printed price.
5. When to build the chapter screens the QR codes open.

## Files here

- `polity-revision-sample/polity-workbook-sample.pdf` (and `.html`): the workbook sample, 29 A4 pages,
  Preamble and Fundamental Rights chapters. **This is the current direction.**
- `polity-revision-sample/polity-revision-notes-sample.pdf` (and `.html`): the first idea, a read-only
  A5 revision-notes book. Kept for comparison.
- `syllabus-companion/syllabus-companion-{en,hi}.pdf` (and `.html`, `workbook.json`): the Syllabus Companion,
  99 A4 pages each, laid out 23 Nov 2026 from the 21 Nov content delivery.
- `polity-workbook/polity-workbook-{en,hi}.pdf` (and `.html`, `workbook.json`): the full Polity workbook,
  12 chapters, 154 pages (English) and 152 (Hindi). Back matter still to come.
- `NOTES-2026-11-21-B1-B2.md`: what was checked and fixed in those two books, what's missing, and how to rebuild.
- `tools/`: the check, fix, build and print scripts. `fonts/`: the local fonts the books use.

To rebuild a PDF from its HTML (macOS):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --virtual-time-budget=15000 --print-to-pdf="$PWD/out.pdf" "file://$PWD/polity-workbook-sample.html"
```
