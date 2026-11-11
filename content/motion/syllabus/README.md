# Syllabus in a minute (video series)

228 short videos, one for every topic in the UPSC syllabus map (`server/public/app/syllabus.js`, the same node ids as
Android's `Syllabus.kt`): Prelims, CSAT, GS1 to GS4, Essay, both qualifying language papers, and the five optionals in
the app (PSIR, Sociology, Geography, Anthropology, History). Made 8 Nov 2026 by Claude. **All drafts:** nothing here has
been checked by a subject or Hindi editor.

## What each video is

- The current-affairs template (`ca-scene`, `content/tools/shots-ca.js`): opener with an illustration, then timeline,
  stat, quote, chips or map shots, and a quiz hand-off. 35 to 50 seconds, 720x1280, no captions burned in (a `.vtt` sits
  beside each video), poster `.jpg`.
- Two hosts per video, like a short podcast, voiced locally with Kokoro's four Indian voices (women: `hf_alpha`,
  `hf_beta`; men: `hm_omega`, `hm_psi`). The pairs rotate across the series. The opener's kicker says "AI voices".
- Every episode has one quiz question (in the manifest), its sources, and a review note saying what to check.
- Sound follows tone rules: SERIOUS episodes have no music bed. No TRAGIC episodes.

## Folders

| Folder | Papers | Episodes |
|---|---|---|
| `2000-01` | Prelims GS I, CSAT | 1–13 |
| `2000-02` | GS1 | 14–22 |
| `2000-03` | GS2 | 23–33 |
| `2000-04` | GS3 | 34–41 |
| `2000-05` | GS4, Essay | 42–49 |
| `2000-06` | Paper A (Indian language), Paper B (English) | 50–59 |
| `2000-07` | PSIR I and II | 60–99 |
| `2000-08` | Sociology I and II | 100–124 |
| `2000-09` | Geography I and II | 125–144 |
| `2000-10` | Anthropology I and II | 145–177 |
| `2000-11` | History I | 178–201 |
| `2000-12` | History II | 202–228 |

Each folder is a `upsc-pods/ca-week@1` manifest, so the existing tool uploads it unchanged:
`npm run import:ca -- ../content/motion/syllabus/2000-03` (from `server/`). The `2000-NN` "weeks" are reserved ids that
sort below every real current-affairs week, so they never collide with or replace the weekly Chai videos. Each episode
also carries `syllabusNodes` (e.g. `gs2-4`) and `series: "syllabus-in-a-minute"`, so a syllabus shelf or the Your sky
map can link a topic straight to its video. That screen doesn't exist yet: today these would show in the Videos tab as
extra "weeks".

GS episodes avoid the 26 topics already covered by current-affairs episodes 10–35 (Preamble, basic structure, money
bills, El Niño and so on).

## Making or changing them

- Scripts: `src/b01_prelims_csat.py` … `src/b12_history2.py`, written in the short form in `src/dsl.py`
  (`"A: … | B: …"` lines per shot). `python3 src/lint.py src/b*.py` flags quiz options too long for the screen,
  long kickers and cue words the hosts never say (the builder also re-points those automatically).
- Set up once: `bash content/tools/syllabus-setup.sh` (Kokoro and its models from GitHub, render root in `~/syllabus-root`).
- Render one batch: `bash content/tools/syllabus-batch.sh b03_gs2 2000-03`. Unchanged videos are skipped, so edit a
  script and re-run to remake only what changed. About 2 minutes per video on 4 cores.
- `stories/<nn>-<id>/` keeps each story and its timing, for re-rendering or for the Hindi versions.
- To switch to the Sarvam or ElevenLabs voices later, set `voice.provider` in a story and use `motion-vo.cjs`
  (one voice per beat) or extend it for two speakers.

## Known limits

- Captions are timed by sentence (exact) and by word length within a sentence (close, not exact). Check sync while reviewing.
- Kokoro pronounces most Indian names well but not all (e.g. Bommai, Attirampakkam). Listen for names during review.
- Facts were written from standard sources (NCERT, Laxmikanth, primary documents) and are listed per episode, but no
  editor has checked them. Episodes with moving facts (BRICS members, remittance ranking, peacekeeping rank, Finance
  Commission share) say so in their review note.
- English only. Hindi needs translated scripts and a Hindi voice; the stories are ready to translate.
