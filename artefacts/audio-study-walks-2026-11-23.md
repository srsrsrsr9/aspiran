# Study walks recorded (Track A, 23 Nov 2026)

**Done: all 7 episodes recorded in English and Hindi** (14 files, 2.5 hours), two voices, every part checked by
speech-to-text. **Not live yet:** the Cloudflare sign-in on this Mac has expired, so nothing could be uploaded.
One `wrangler login` by the owner (steps at the end), then one command puts them on Listen.
**Fish credit used: $19.90** ($148.24 → $128.34).

## Decisions for the owner
- **Give the Hindi friend a listen.** Fish has no licensed female Hindi voice, so the friend is SHILPA (licensed,
  female, Indian English) reading Hindi. The checker heard her Hindi cleanly; accent and warmth need your ear.
- Nothing else. The episodes go in as approved, "Aspiran (owner publish)", per your standing rule.

## What was made
| Episode | Paper | English | Hindi |
|---|---|---|---|
| A1 · Inflation targeting | GS3 Economy | 12.4 min | 14.8 min |
| A1 · The Phules and social reform | GS1 History | 11.6 min | 13.9 min |
| A1 · The basic structure | GS2 Polity | 13.0 min | 14.9 min |
| A2-01 · Historical underpinnings | GS2 Polity | 8.7 min | 9.8 min |
| A2-01 · Evolution of the Constitution | GS2 Polity | 8.8 min | 9.1 min |
| A2-01 · Basic structure | GS2 Polity | 8.7 min | 9.8 min |
| A2-01 · Comparison with other constitutions | GS2 Polity | 8.4 min | 9.2 min |
| **Total** | | **71.6 min** | **81.5 min** |

Voices (all Fish-licensed, model `s2.1-pro`): narrator **Shubh** (English) and **शांत और भावुक स्वर** (Hindi); friend
**SHILPA** in both. Pauses as marked (4 s before each answer). Loudness −16.4 to −16.7 LUFS, mono MP3 96 kbps.
Nothing spoken or shown names the voice or says "AI". The stored data keeps provider, model and voice for our records only.

**Where they appear:** as Audio lectures (web `#talks`, Android "Audio lectures"), each with read-along text in four
parts (the story, three things to keep, three questions, to close; the speakers named "Narrator" and "Friend"), and the
three recall questions as quick checks. And, after the next deploy, on **Listen** under a new "Study walks" group.

## How each file was checked
Each spoken line (long lines split at about 900 characters; 900 requests in all) transcribed back by Deepgram nova-3 and
compared with the script (bar 0.88 English, 0.80 Hindi; 0.12 lower under 120 characters), up to 3 takes; Fish's own
speech-to-text as the second opinion. **Re-recorded lines:** 6 needed a second take; 1 passed on the second opinion.
One three-word Hindi friend line in the polity pilot ("किस तर्क पर?") failed three takes and passed on a fresh fourth.
Nothing that failed is in a file.

## Fact checks before recording
- Checked against today's sources: the RBI's 5 to 7 October 2026 hike to 5.50% (6-0, "calibrated tightening", SDF 5.25%,
  MSF 5.75%, next meeting 2 to 4 December) and October 2026 CPI 6.09% (food 8.94%, onion +116%).
- The 16 + 12 flagged facts: the scripts already leave out what the writer couldn't source (7:6 split, Brahmo Sabha
  1828, Gazette date and so on). What they do say matches the standard record.
- **Two lines changed** (both languages): the simultaneous-elections Bill now says it "was sent to a Joint
  Parliamentary Committee for detailed study" (its status in November 2026 couldn't be confirmed), and the Union
  Constitution Committee "reported in July 1947" (exact day dropped).
- Numbers all in words; no "AI"; nothing about the voice. Kit checker: 0 problems (its past-paper lookup file wasn't in the kit).

## Not done from the spec
- No VTT caption files and no Opus copies: the app shows the full text beside the player and plays MP3.
- Spec asked for 128 kbps MP3; these are 96 kbps mono (speech, about 7 MB for 15 minutes on mobile data).

## Cost ledger (Fish balance from the API)
| When | Balance | Note |
|---|---|---|
| 22 Nov, start | $148.24 | |
| 23 Nov, end | $128.34 | 14 recordings, a voice test, retakes, and requests cut off when Fish stalled |
| **Used** | **$19.90** | About $0.13 a minute. Half went on stalled requests that are still billed (Fish dropped many connections this run) |

## To put them live (owner, macOS Terminal)
1. Sign in to Cloudflare (a browser window opens; approve it there):

       cd ~/Documents/app/server && npx wrangler login

   Success: "Successfully logged in". Failure: if the browser doesn't open, copy the link it prints into Safari.
2. Tell Claude "logged in". Claude runs `python3 content/tools/cartesia/walks_publish.py` (uploads to R2
   `upsc-pods-media/audio-ai/2026-11/study-walk/`, adds the 7 entries as approved) and deploys the Listen change.

## Files
- Scripts as recorded: `content/study-walks/A1/`, `content/study-walks/A2-01/` (kit in `content/study-walks/kit/`).
- Tools: `content/tools/cartesia/walks.py` (record and check), `walks_publish.py` (upload and add).
- Audio (git-ignored): `content/audio/cartesia/walks/`.
- App: `server/public/app/app.js` (Listen lists study walks), `brief.js` and Android `SheetsTalks.kt` (the talk player
  no longer says "Recorded voice").
