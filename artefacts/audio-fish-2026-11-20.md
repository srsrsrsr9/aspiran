# Recorded notes with Fish Audio (20 Nov 2026)

**Done: 61 more readings (42 notes, 6.8 hours) are live.** The Listen page now totals about **27.2 hours** (was 20.4).
**Left: 31 notes (61 readings, about 441,000 characters).** Stopped on the main session's request, not for credits.
**Fish credit used: $20.52** of $170.91 ($150.39 left). Finishing the rest needs about $27 more.

## Decisions for the owner
- None needed to finish. To record the last 31 notes, a session runs the two commands at the end; credits are enough.
- Worth knowing: the older 188 readings (made 14–15 Nov) still *say* "read by an AI voice" in their spoken opening.
  The new ones don't (the opening is now just "An Aspiran note."). Re-recording those openings is a follow-up.

## What was made
Voices (both Fish-licensed, Indian, calm): **Shubh** for English, **शांत और भावुक स्वर** for Hindi, model `s2.1-pro`
(the paid model, licensed for commercial use). One voice per language for every reading. Nothing in the app names
the voice or says anything about it; the stored data keeps provider, model and voice for our records only.

| Paper | Subject | Notes | English min | Hindi min |
|---|---|---|---|---|
| GS1 | Ancient, medieval and culture | 4 | 25 | 28 |
| GS1 | Geography | 7 | 40 | 0 |
| GS1 | Indian society | 1 | 7 | 8 |
| GS1 | Modern history | 4 | 22 | 0 |
| GS2 | Governance and social justice | 1 | 7 | 8 |
| GS2 | Polity | 8 | 58 | 58 |
| GS3 | Economy | 7 | 42 | 0 |
| GS3 | Environment | 4 | 24 | 0 |
| GS3 | Internal security | 1 | 7 | 8 |
| GS3 | Science and technology | 4 | 24 | 29 |
| GS4 | Ethics: concepts | 1 | 6 | 7 |
| **Total** | | **42** | **261** | **145** |

61 readings: 42 English, 19 Hindi, 407 minutes, 335,356 characters kept. Geography, Modern history, Environment and
part of Economy have no Hindi text yet, so English only. (Six notes listed as Hindi-ready have no Hindi sections;
nothing to record there.)

## How each reading was checked
Same as before: every part (about 900 characters) transcribed back by Deepgram nova-3 and compared with its script
(bar 0.88 English, 0.80 Hindi; 0.12 lower for lines under 120 characters), up to 3 takes. A part still under the bar
got a second opinion from Fish Audio's own speech-to-text; 4 parts passed that way. Nothing that failed both is live.

## Still to record (31 notes)
| Paper | Subject | Notes | English | Hindi | Characters |
|---|---|---|---|---|---|
| GS1 | Ancient, medieval and culture | 2 | 2 | 2 | 29,499 |
| GS1 | Indian society | 1 | 1 | 1 | 15,542 |
| GS2 | Governance and social justice | 1 | 1 | 1 | 10,943 |
| GS2 | International relations | 2 | 2 | 2 | 30,040 |
| GS2 | Polity | 11 | 10 | 11 | 148,326 |
| GS3 | Economy | 5 | 5 | 5 | 69,579 |
| GS3 | Science and technology | 2 | 2 | 2 | 30,695 |
| GS4 | Ethics: concepts | 1 | 1 | 1 | 17,301 |
| GS4 | Ethics: thinkers and cases | 4 | 4 | 4 | 62,046 |
| Prelims | CSAT | 2 | 2 | 2 | 27,085 |
| **Total** | | **31** | **30** | **31** | **441,056** |

## Cost ledger (Fish credit balance, read from the API)
| When | Balance | Note |
|---|---|---|
| 20 Nov 10:15 | $170.91 | Start |
| 20 Nov 21:06 | $150.39 | 61 readings, plus tests, retakes and cut-off requests |
| **Used** | **$20.52** | About $0.06 a minute of audio; Fish bills about $30 per million bytes of text here (Hindi is 3 bytes a letter) |

## What went wrong and was fixed
- Fish over IPv6 hangs from this network: the tools now use IPv4 only.
- Fish sometimes sends the start of a reply and then trickles for many minutes. A request now stops when audio arrives
  slower than real time, and is retried.
- Fish allows only a few requests at once (HTTP 429): at most 8 in flight (`FISH_SLOTS`), 429s are waited out.
- Deepgram uploads and R2 uploads time out now and then: retried (408 added; `publish.py` retries uploads).

## How to finish
From `content/tools/cartesia/` in this branch's folder (resumes; skips anything done):

    FISH_SLOTS=8 python3 build.py --missing --workers 16 --parallel 4 --skip cartesia,inworld,smallest,chariot
    python3 publish.py

`--missing` reads `content/audio/cartesia/missing.json` (built from production: each note and language with text but
no audio). About 2 hours. Audio stays out of git (`content/audio/cartesia/`).
