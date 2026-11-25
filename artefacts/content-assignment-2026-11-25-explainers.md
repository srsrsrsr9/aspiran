# Explainers 251–300: brief for the other Claude (25 Nov 2026)

**For the owner:** open a new Claude Code session on this Mac, in `/Users/srinivasvedantam/Documents/app`
(the main folder, not a worktree, so the finished videos land where the main Claude can publish them), and paste
everything below the line. It runs on its own; it may ask you to approve a few downloads. When it says it's done,
tell the main Claude "251–300 are ready".

---

You are making 50 short explainer videos (numbers 251–300) for Aspiran, a study app for UPSC aspirants. Another
Claude session is making 201–250 at the same time with the same tool, so stay inside your own files (listed below).

## Read first
1. `CLAUDE.md` (project rules) and `artefacts/explainers-100-list-2026-11-25.md` (your 50 titles, papers, formats,
   picture ideas: the table "The other Claude: 251–300").
2. The tool's header: `content/tools/story/explainer.py` (top docstring lists every field).
3. Three finished examples, one per format: `content/motion/footage-test/01-monsoon` (calm),
   `02-chandrayaan` (fast), `03-basic-structure` (photo). Their `out/contact.jpg` shows how each looks.
4. A finished manifest for the quiz and review style: `content/motion/shorts/2001-09/manifest.json`.

## Your files (touch nothing else)
- Videos: `content/motion/explainers/<NNN>-<id>/explainer.json` (one folder each, e.g. `251-fold-mountains`).
- Downloaded pictures: `content/motion/explainers/raw/251/…` (git ignores `raw/`, audio mp3s and `out/`).
- Licence ledger: `content/motion/explainers/LEDGER-251-300.md`.
- Packs: `content/motion/shorts/2001-25` … `2001-29`, ten videos each (251–260 in 2001-25, and so on).
- Don't edit `explainer.py`. If it truly blocks you, write what you need in your hand-back note and work around it.
- Don't import, deploy, publish or change the status page: the main Claude does that.

## The three formats (keep them distinct)
| | Calm | Fast | Photo |
|---|---|---|---|
| Pictures | nature/place footage + drawn diagrams | mission/tech footage, quick diagrams | stills with slow pan and zoom |
| Opening | a question or image | a hook in the first sentence (a number, a "first", a surprise) | a place or document |
| Captions/sound | set by `"format"`; don't override unless there's a reason | | |
| Typical diagrams | flow, compare, ring | cards, bars, flow | timeline, cards, numbers that count up |

## Consistency rules (every video)
- 45–75 seconds; 6–9 segments; last segment `{"end": true}` with an `endcard` credit line naming every picture
  source and licence.
- Narration: plain Indian English for a 20-year-old aspirant. One idea per segment, one or two sentences. Say numbers
  and years as words ("nineteen seventy-three") so the voice reads them right; put the digits on screen with
  `"numbers"`. No jargon without a plain gloss right after it.
- The last spoken line ties the topic to the exam: which paper it shows up in, or the one thing to remember.
- `"voice": "auto"` always. It uses ElevenLabs Sumeet while the month's characters last, then Fish Shilpa. Never
  set a voice by hand, never print or copy a key (they come from the macOS Keychain inside the tool).
- Captions come from the narration. Diagrams stay schematic: **no maps, no national borders**, no logos.
- No living people as subjects or faces (crowds from behind, hands, buildings are fine). No party symbols.
  Politically even: say what the law or the court said, not who was right.
- No "AI" anywhere, no claim that a person made or checked anything.
- Tone `NEUTRAL`, or `SERIOUS` for disasters and hard history. A topic centred on deaths is `TRAGIC`: calm format,
  `"bed": "none"`, no whooshes, no counting-up numbers, no emoji or jokes (the app won't let it be shared).

## Variety (so 50 videos don't feel like one)
- Vary the opening across the batch: question, number, scene, myth-then-fact, "what if". Don't open two videos in a
  row the same way.
- Use at least four different diagram types in each pack of ten; don't use the same one twice in a video unless
  it's a sequence.
- Mix stills and footage; use `crop`, `focus` and `fit: blur` to frame pictures well.
- Where a topic has a twist (a famous mistake, a close vote, a surprising number), lead with it.

## Pictures: licence rules
Allowed: NASA, NOAA, USGS, NIH/CDC and other US federal works (public domain); ISRO, PIB and Indian government
sites under GODL-India (commercial use allowed with attribution); Wikimedia Commons files marked public domain or
CC0 or CC BY (credit the author); Pexels and Pixabay (credit anyway). Avoid CC BY-SA unless nothing else exists, and
say so in the ledger. Never: news-agency photos, stock-site watermarks, YouTube rips, anything with no licence
stated. Check each Commons file's own page for its licence; use the original upload URL, not a thumbnail.
NASA/NOAA globe footage often shows national borders: crop to ocean or skip it.

Ledger row per file: `| video # | file | source page URL | author | licence | how used |`.

## Facts
- Every claim must come from a source you read in this session: official pages first (upsc.gov.in, ISRO, PIB,
  RBI, IMD, Supreme Court judgments, NCERT), then a standard text. List them in `"sources"` with what each supports.
- Write `"reviewNote"` like the existing manifests: what was checked against what, and anything that changes over
  time ("Moving facts: …").
- Quiz: three questions per video, four options each, answers spread across positions (not always the first),
  each with a one-line `"why"` that points back to the video.

## How to build
```
cd /Users/srinivasvedantam/Documents/app
python3 content/tools/story/explainer.py content/motion/explainers/251-fold-mountains
```
Bash network calls may need the hosts approved (api.elevenlabs.io, api.fish.audio, the picture sites). After each
build, look at `out/contact.jpg` and the voice scores in `audio/check.json` (every segment should be 0.9 or more;
if not, rewrite that line more simply, delete its mp3, and rebuild). Fix any picture that looks wrong, blank or has
burned-in text that clashes with the captions. A rebuild with `--no-voice` reuses the recorded voice.

When ten are done, make the pack:
```
python3 content/tools/story/explainer.py pack content/motion/shorts/2001-25 content/motion/explainers/25[1-9]-* content/motion/explainers/260-*
```

## Hand-back
- Commit your own files only (explainer.json files, ledger, pack manifests, VTTs, posters; videos stay local, git
  ignores them) with a message starting "Explainers 251–260:" and so on, after each pack. Pull first
  (`git pull origin main`), push with `git push origin master:main`. Git author is "Aspiran"; end the message with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Finish with a short note to the owner: what's built, anything skipped and why, which voice each pack used, any
  fact you were unsure of.
