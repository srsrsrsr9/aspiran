# Draft content inventory and go-live, 15 Nov 2026

The owner asked on 15 Nov to "go live with all draft content". This note lists every piece of content that was made,
says whether it was live, and says what was done.

## Result

- **Before:** 1,237 items live, all approved.
- **After:** 1,300 items live. 63 new items went live, and 4 live items were updated to their newer version.
- **Held back:** nothing. Two quiz items in the sample mock were rewritten first (see "Fixes before publishing").
- **Videos:** 257 in the manifests, all already live. No change.
- Approvals were recorded as "Aspiran (owner publish)", in English and Hindi. This is not an editor check.

## How it was checked

Each pack went through the real importer (`npm run import`, `syllabus.mjs`, `pyq.mjs`, `import:brief`) on a clean
local copy of the server. Then every imported row was compared with the live row.

Then the 67 rows going live were checked:

- **Facts:** numbers, dates, Article numbers, answer keys and office-holders were spot-checked.
- **Hindi:** present on all 67.
- **Tone:** none is TRAGIC.
- **Timers:** none is on by default. The mock's timer is off and only counts up if a member switches it on.
- **Scores and streaks:** no streaks and no public scores.
- **Maps:** the Strait of Hormuz map draws coastlines only, with no national borders.
- **Sound:** sound stays off by default, and nothing plays by itself (the app's own rule).

## Inventory

| Source | Kind | Count | State before | What I did |
|---|---|---|---|---|
| `content/brief/aspiran-content` (all batches) | 46 kinds of practice games, notes, mocks, skeletons, essays, GS4, CSAT, walks, printables, talks | 1,073 | Live, same | Nothing |
| `content/brief/aspiran-content`: reads and mocks | read 134, mock 18 | 152 | Live. The disk copy differs only in the file's creation date | Nothing |
| `content/brief/aspiran-content`: topic paths | topic-path | 8 | Live version is **newer** (featured flag, layout, media date) | Nothing. The newer live version was kept |
| `content/brief/aspiran-content`: trap spotters | trap-spotter | 4 | Live in an **older** version (20 Oct). The disk version adds the Hindi tag label and fixes a capital letter | **Updated live** (env-laws-reserves-and-treaties, pol-parliament-and-offices-traps, ir-borders-and-boundary-lines, sci-health-and-disease-traps) |
| `content/interactives/syllabus-interactives-2026-11-14` | interactive | 60 | Live, same | Nothing |
| Syllabus (`scripts/syllabus.mjs pack`) | read, mock, terms and others | 160 | Live, same | Nothing |
| Past papers (`scripts/pyq.mjs pack`) | pyq | 11 | Live, same | Nothing |
| `server/content/prep-content-2026-10-20` and `-20b` | practice games, flashcards, optional notes | 149 | Live, same | Nothing |
| `server/content/syllabus-2026-11-14` | old syllabus export | (n/a) | Fails the manifest check. A fresh export is above and is live | Nothing. Stale copy |
| **`server/content/preview-2026-10-10`** | 28 practice games (one per kind), 6 Hidden Why, 1 Ek Minute explainer, timeline, match, quiz night, map, number sense, Two Sides debate, Lamp Off wind-down; 2 each of myth vs fact, scratch and reveal, stamp trail, chai stall radio, snap together, domino chain, then and now, postcard, ambient sound | 62 | **Not live** (never published) | Fixed (see below), then **published**, with its 42 media files (sound effects, two ambient beds, 8 drawings) |
| **`server/content/mock-sample-2026-10-12`** | mock (GS2 Polity sectional, 30 questions) | 1 | **Not live** | Two items rewritten (see below), then **published** |
| `content/mock-paper-sample.json` | template sample | 1 | Not a pack. Never meant for the app | Nothing |
| Videos (`content/motion/*/*/manifest.json`) | video | 257 | Live, all approved | Nothing |
| Audio (`content/audio/recordings`) | recorded talks and readings | 231 mp3 files in 32 folders | Live through the audio-lecture, read and walk rows | Nothing. The AI-voice pipeline output folder (`content/audio/cartesia`) is not on disk. That work is paused at 19.9 hours |
| `docs/content/*.zip` (15 archives) and `artefacts/*.zip` (6 archives) | older copies of batches, assignment 8, episodes, audio, kit examples and specs | (n/a) | Each was opened in its own empty folder and compared. All content in them is an older copy of what is now in `content/` and live, or is a template or spec, not app content | Nothing |
| Chai drafts for 15 Nov | chai card | 9 | Drafts | Left for the automatic Chai, as asked |

## Fixes before publishing

`server/content/preview-2026-10-10` (12 files, and the manifest hashes):

- Old brand: "Ek Minute · UPSC Pods" and "Article 200, in one minute. UPSC Pods." now say Aspiran, in English and Hindi.
- Removed sentences that point to things that do not exist in the app ("From this week's Ek Minute explainer", "From this
  week's Chai cards").
- Removed "Sample, awaiting editor check" from the sex-ratio card's source line.
- Wrong figure: the two national parks in the scratch card are about **540** square kilometres apart, not 4,500.
- MGNREGA acronym card: MGNREGA was repealed from 1 July 2026, when the VB-G RAM G Act, 2025 replaced it. The card is
  now in the past tense, titled "What MGNREGA stood for, and what replaced it", and says to know both Acts.
- Five model-made cards had a placeholder source. Each now names a real source (Ramsar and the Chilika Development
  Authority; NCERT Class 7 *Our Pasts II*; CAQM, ICAR-IARI and the Ministry of Agriculture; Constitution Articles 83,
  89, 109 and 110; the UNESCO list and the Kerala Forest Department).

`server/content/mock-sample-2026-10-12`:

- Questions 12 and 18 relied on "a Governor cannot pardon a death sentence". The Supreme Court held otherwise in 2021
  (State of Haryana v Raj Kumar), so the point is disputed. Q12's option (d) is now "The Governor must belong to the
  state they are appointed to". Q18's item 3 is now "Appoint the judges of the state's High Court" (the President does,
  under Article 217). The answer keys are unchanged. Hindi was changed to match.

## For the owner

- **Live MGNREGA card:** `scheme-snapshot:eco-mgnrega` (already live before this) still describes MGNREGA as a current
  scheme. It should say it was replaced by the VB-G RAM G Act from 1 July 2026. Please send a fresh version, or say
  the word and Claude will rewrite it.
- **Mock note:** all 35 mocks say "Practice paper written by our editors". This is kept as it is, but it is close to
  claiming an editor check. Consider "Practice paper made by Aspiran".
- Nothing else needs you. No content was held back.

## How it was published

1. A clean copy of the server (HEAD) ran locally on port 8797, and every pack was imported into it through the real
   importer.
2. The 67 rows (63 new, 4 newer versions) were written to live D1 with
   `npx wrangler d1 execute upsc-pods --remote --env production --file …`.
   - Rows were written with `status='approved'` and "Aspiran (owner publish)" as the English and Hindi editor.
   - Each statement was kept under 12 KB. The long mock was written in pieces and checked byte for byte in a dry run
     first.
   - One `content_versions` row was added per item.
3. The 42 media files went to R2 `upsc-pods-media` under `preview-2026-10-10/`.
4. No server code was changed, nothing was deployed, and no flag was changed.
