# AI voices for Chotu and Jeetu (15 to 16 Nov 2026)

Chotu and Jeetu can now speak. A small **"Listen · AI voice"** button sits on their messages in the web app and the
Android app. Built on branch `claude/voices-fish`; not merged, not deployed. Nothing shows until the owner sets the
`FISH_AUDIO_API_KEY` secret (runbook: `artefacts/voices-2026-11-15/runbook-fish-audio-key.md`).

## Listen to them first
In this folder:
- `chotu-english.mp3`, `chotu-hindi.mp3`: Chotu explaining Article 200.
- `jeetu-english.mp3`, `jeetu-hindi.mp3`: Jeetu's review line ("You don't have a reading problem, beta…").
- `double-act-streak.mp3`: Chotu asks for a streak, Jeetu says no, Chotu protests.

## The two voices
Both were **made for Aspiran** with Fish Audio's Voice Design: you describe a voice in words and it makes one. They
are not copies of any person, nobody else uses them, and they are saved as private voices on your Fish Audio account.

| Who | Voice (Fish id) | Described as | Measured |
|---|---|---|---|
| Chotu | `cae60a8fbea3456c9c941161ce4e9d80` "Aspiran Chotu (designed)" | A cheerful young man of about twenty from Delhi: bright, light, a little cheeky, quick but clear | Pitch about 180 to 200 Hz |
| Jeetu | `edcdf002d20a4fc085bfc65842efdf9f` "Aspiran Jeetu (designed)", played at 0.95 speed | A retired teacher in his late sixties from North India: deep, warm, slightly gravelly, unhurried, dry humour | Pitch about 120 Hz |

Why designed voices and not ones from the library:
- Fish Audio has only **two** licensed Indian voices today, both young men, and the Hindi story videos already use one
  of them as their narrator. Neither sounds like an older mentor.
- The community library is full of copies of film stars and politicians. We never use those.
- A deep licensed English voice was tried for Jeetu: fine in English, but its Hindi was not understandable.

How they were checked: each sample was read back by Fish Audio's speech-to-text. English came back word for word.
Hindi came back right except one word in Jeetu's line ("भूलने" was heard as "भोले"), worth a listen in
`jeetu-hindi.mp3`. Telugu was tried on a licensed voice and worked; it has not been tried on these two.
Claude cannot hear: **the owner should listen to the five files** and say if either voice is wrong for the character.
Changing a voice is two lines in `server/src/voice.ts` (`VOICES`).

## What members get
- A "🔊 Listen · AI voice" button under each **cloud** reply from Chotu and each reply from Jeetu, on Jeetu's scripted
  lines (review, Mains, first run), and on the streak double act.
- Plays on a tap only. Nothing ever plays by itself. A second tap stops it. One voice at a time; leaving the screen stops it.
- Not there: on care or distress replies (always text with the care box), in result week, on Jeetu during his quiet
  hours (23:30 to 07:00 IST), on replies longer than 1,200 characters, for visitors who aren't signed in, and on
  Chotu's replies made on the phone itself (only the server's own words are ever spoken).
- Jeetu's weekly recall note has no voice (it is worked out on the device, so the server can't vouch for the words).

## How it's kept safe and cheap
- The server never reads out free text. It speaks either a scripted line (asked for by its key) or a reply it gave
  that same member, proved by a signature it attached to the reply. No chat is stored to do this.
- Each line is made once and kept (R2, `_cache/voice/`). A repeat costs nothing, for anyone.
- Limits: 40 new lines per member a day; 3,000 a day for everyone together; 1,200 characters a line.
- Admin → AI usage shows lines made, bytes, estimated cost and failures, and has a "Make the scripted lines now"
  button so the first member doesn't wait. Admin → Flags has a `voice` switch.

## Cost
Fish Audio charges **US$15 per million bytes of text** (model `s2.1-pro`).
- English: about **US$0.015 per 1,000 characters**. Hindi takes about three bytes a letter: about **US$0.04 per 1,000 characters**.
- A typical reply (300 characters): about half a US cent in English, a little over one cent in Hindi.
- **100 daily users**, each hearing 3 to 5 new replies a day: roughly **US$40 a month if mostly English, up to about
  US$170 if mostly Hindi**; call it US$70 to US$100 for a mix. Scripted lines cost a few cents once, ever.
- The worst case the limits allow is far higher (3,000 lines a day), so watch Admin → AI usage in the first weeks and
  lower the limits in `server/src/voice.ts` if needed.
- Designing the two voices cost a few cents in total.

## Terms (read 15 to 16 Nov 2026)
- Fish Audio's Terms of Use: paid users "are licensed to use the Services for commercial uses"; free use is personal
  and non-commercial only. API credits are paid use, and we use the paid model, not the free one.
- The terms forbid passing AI audio off as human. Every button says "AI voice", and Chotu and Jeetu are always labelled AI.
- The terms don't spell out who owns generated audio or designed voices. Re-read them if the startup credits
  programme changes, and keep the credits receipt with the artefacts.
- Stock voices: only Fish-licensed voices or our own designed ones. Never community clones.

## What's left
- Owner: listen to the samples; set the secret (runbook); then press "Make the scripted lines now" in Admin → AI usage.
- The Android button is compiled but not tried on a phone.
- Telugu has not been tried on the two designed voices.
- The old licensed-voice trial samples were not kept.
