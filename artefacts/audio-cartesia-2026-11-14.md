# AI-voice readings: final report (14–15 Nov 2026)

**Live now: 20.4 hours, 98 notes and walks, 188 readings (English and Hindi), all on production.** Every reading passed a speech-to-text check.
The owner's goal of 10 hours is met twice over, spread across all six papers in English and Hindi.
**Left: 72 notes (122 readings, about 840,000 characters).** Every voice account with Indian voices is out of credits.

## Decisions for the owner
1. **Top up one account to finish the last 72 notes.** Best choice: **Smallest (about 900,000 characters)**. It made
   most of the library, so the remaining notes keep the same voices (Aditi in English, Kunal in Hindi). Chariot is the
   second choice (1 credit per character, so about 900,000 credits); its Neha and Darshan voices tested well.
2. **Rotate the Cartesia key** in the Cartesia dashboard. It was used in this work and shared between sessions.

## What listeners get
- A **Listen** card on the note or walk page (web and Android): Play/Pause, Back 10 s, Parts (jump to a section).
- It always says **AI voice** and the voice's name, and: "Read by an AI voice, not a person. The full text is on this page."
- Nothing plays until the listener presses Play. No music or effects. SERIOUS and TRAGIC notes are read in a calm voice.
- Each reading ends: notes close with "Test yourself" questions (with pauses) and "That's the end of this note";
  walks end with "Now say your answer aloud, once. Then walk on."
- The web app's `#listen` page lists every note and walk that has audio.
- If a note's text changes later, its audio is dropped automatically for that language (it no longer matches).

## Live by paper and subject (minutes)
| Paper | Subject | Pieces | English | Hindi | Total |
|---|---|---|---|---|---|
| Essay | Essay | 4 | 34 | 34 | 68 |
| GS1 | Ancient, medieval and culture | 6 | 31 | 31 | 63 |
| GS1 | Geography | 5 | 27 | 24 | 50 |
| GS1 | Indian society | 5 | 28 | 29 | 57 |
| GS1 | Modern history | 6 | 36 | 14 | 50 |
| GS1 | World history | 4 | 29 | 26 | 54 |
| GS2 | Governance and social justice | 6 | 42 | 41 | 83 |
| GS2 | International relations | 7 | 50 | 44 | 94 |
| GS2 | Polity | 7 | 40 | 41 | 81 |
| GS3 | Economy | 7 | 45 | 40 | 85 |
| GS3 | Environment | 6 | 39 | 29 | 69 |
| GS3 | Internal security | 5 | 33 | 30 | 64 |
| GS3 | Science and technology | 6 | 31 | 34 | 65 |
| GS4 | Ethics | 2 | 9 | 11 | 19 |
| GS4 | Ethics: concepts | 7 | 42 | 41 | 83 |
| GS4 | Ethics: thinkers and cases | 5 | 42 | 40 | 82 |
| Prelims | CSAT | 10 | 81 | 76 | 157 |

| Paper | Minutes |
|---|---|
| Essay | 68 |
| GS1 | 275 |
| GS2 | 259 |
| GS3 | 283 |
| GS4 | 184 |
| Prelims | 157 |
| **Total** | **1,226 (20.4 hours)** |

Some notes have no approved Hindi text yet, so they have English audio only (mostly GS1 Modern history and Geography).

## Voices and providers
| Provider and model | Voice | Used for | Minutes |
|---|---|---|---|
| Smallest lightning-v3.1 | Aditi | Notes, English | 520 |
| Smallest lightning-v3.1 | Kunal | Notes, Hindi | 472 |
| Smallest lightning-v3.1 | Siddharth | Walks, English | 86 |
| Smallest lightning-v3.1 | Meera | Walks, Hindi | 104 |
| Inworld inworld-tts-1.5-max | Saanvi | Notes, English | 19 |
| Inworld inworld-tts-1.5-max | Manoj | Notes, Hindi | 11 |
| Chariot chariot-multilingual-v1 | Neha | Notes, English | 13 |

All are Indian voices. Each reading stores its provider, model and voice. Fish Audio was not used (kept for Chotu, Jeetu and videos).

## Characters and credits
| Provider | Characters sent (all takes) | Characters kept | State on 15 Nov |
|---|---|---|---|
| Smallest | 1,140,079 | 1,067,524 | Out of credits |
| Inworld | 27,186 | 22,876 | Out of credits |
| Chariot | about 8,700 (plus about 600 for test lines and second checks) | 8,710 | 618 credits left |
| Cartesia | about 25,000 (first test runs; none of it is live) | 0 | Out of credits (402) |
| Sarvam | 0 | 0 | Out of credits (402) |
| ElevenLabs | 0 | 0 | 10,000 free, but its free voices are American, British or Australian; not used |
| Gradium | 0 | 0 | Credits left, but no Hindi and no Indian voices; not used |
| Deepgram | speech-to-text only (about 19 hours of audio checked) | | Still working |

Money: each account's own dashboard shows the charge; no top-ups were made in this work.

## How each reading was checked
Every part (about 900 characters) was transcribed back by Deepgram nova-3 and compared with its script. The bar is 0.88 for
English and 0.80 for Hindi (0.12 lower for lines under 120 characters). A part under the bar was voiced again, up to 3 times.
Five parts that still failed were checked again by Chariot's own speech-to-text: four passed clearly (0.885 to 1.0); one
short question ("What do silsila, khanqah and urs mean?") scored 0.75 against 0.76 because both checkers heard the
same pronunciation of the rare words. It was accepted. Nothing that failed both checks is live.

## Still to voice (72 notes)
| Paper | Subject | Notes | English | Hindi | Characters |
|---|---|---|---|---|---|
| GS1 | Ancient, medieval and culture | 6 | 6 | 6 | 75,755 |
| GS1 | Geography | 7 | 7 | 0 | 34,827 |
| GS1 | Indian society | 2 | 2 | 2 | 29,681 |
| GS1 | Modern history | 4 | 4 | 0 | 17,876 |
| GS2 | Governance and social justice | 2 | 2 | 2 | 25,385 |
| GS2 | International relations | 2 | 2 | 2 | 34,055 |
| GS2 | Polity | 18 | 18 | 18 | 266,438 |
| GS3 | Economy | 12 | 12 | 5 | 114,799 |
| GS3 | Environment | 4 | 4 | 0 | 19,869 |
| GS3 | Internal security | 1 | 1 | 1 | 12,257 |
| GS3 | Science and technology | 6 | 6 | 6 | 78,877 |
| GS4 | Ethics: concepts | 2 | 2 | 2 | 30,904 |
| GS4 | Ethics: thinkers and cases | 4 | 4 | 4 | 69,218 |
| Prelims | CSAT | 2 | 2 | 2 | 30,513 |
| **Total** | | **72** | **70** | **52** | **840,454** (478,313 English, 362,141 Hindi) |

Allow about 7% more for retakes: **about 900,000 characters** in all. Polity is the biggest gap (18 notes).

## How to finish when credits are back
From the repo root (the pipeline resumes and skips anything already done):

    python3 content/tools/cartesia/build.py --plan rest --workers 4 --skip cartesia,inworld
    python3 content/tools/cartesia/publish.py

`--skip` names providers to leave out; with Smallest topped up, the remaining notes keep the Aditi and Kunal voices.
`python3 content/tools/cartesia/report.py` prints the tables above. Generated audio stays out of git (`content/audio/cartesia/`).
Tools and notes: `content/tools/cartesia/README.md`.
