# Showreel tour: build notes (22 Nov 2026)

Branch `claude/ecstatic-herschel-f72e35`. **Not merged, not deployed.**

## What it is
A fast, voiced sales tour for visitors, at **`/app/#tour/path-pol-federalism`** (Federalism first).
It plays like a short film: each scene shows one way Aspiran teaches, a one-line "How it helps in UPSC" strip,
and a warm narrator who praises each feature in side bubbles, with small sound effects and stamps, bursts and flips.
Visitors can tap along or just watch. It ends on Free vs Plus (₹3,999/yr) and one **Join free** button.

Runs about 6 minutes in English, a little over 6 in Hindi. Back, pause and Next are always at the bottom;
the top bar has 16 dots to jump to any scene, EN / हिं, and mute.

## Scenes (14 numbered + opening and close)
1. Opening: "One topic. Eleven ways to make it stick." Play with sound, or watch without.
2. Guess first: pick before reading; why that helps memory.
3. Read smart: the passage folds into key points, then a quick memory check.
4. Video: plays a real clip; the question asked matches what the clip says.
5. The Governor's desk: you choose; a stamp explains the rule (Article 200).
6. Sort the lists: Union / State / Concurrent, items fly into their bins.
7. GST Council: 31 seats, the vote meter fills to two-thirds, then BLOCKED.
8. Real PYQ (Prelims 2025): pick first, *then* "how sure?", the −⅓ shows, one more try.
9. Mains answers: the plan types itself out, each part tagged with why it scores.
10. The marking desk: explains itself with a joke, no upload asked; margin notes appear.
11. Essay: three quick cards on how an essay is built.
12. Memory cards: a card flips (question and answer), then its review dates.
13. Your pod: 6 to 8 aspirants, "No public scores. No ranks. Ever."
14. Chotu: the study buddy, quiet from 23:30 to 07:00.
15. Variety: everything at a glance.
16. Close: Free / Plus, Join free, Watch again, Try the topic yourself.

## Your feedback, and what changed
- More oomph, features shown like trophies: stamps, bursts, a gentle shake and badges on each win.
- Controls never get lost: fixed bar at the bottom, nothing below the fold (checked at 1366 px and 375 px).
- No "Back to the topic" detours, no feedback forms, one Join banner only (in the top bar and on the close).
- Sorting shows items moving into clearly labelled bins.
- PYQ asks "how sure?" only after an answer is picked.
- No Sarvam, no "AI" anywhere; the voice player says nothing about the voice.
- Ends by selling what was just shown. No made-up numbers or testimonials.

## The voice
ElevenLabs voice **Bhargav** (deep, warm, Indian, male), same voice in English and Hindi.
Auditions of three voices are in `artefacts/showreel/auditions/` if you'd like a different one.
92 clips (46 per language), 5.8 MB, in `server/public/app/demo-voice/showreel/`. Each clip was transcribed back
to check the words came out right.

Sound starts only when the visitor taps "Play the tour"; "Watch without sound" and the mute button both work.

**Please listen to:** `pods-1-hi.mp3`. The checker heard "Aspirants" instead of "Aspiran"; it is probably the checker,
but worth one listen. The brand is spelled "Aspi-raan" / "आस्पिरान" for the voice so it says it right.

To re-record a line after changing its words in `showreel.js` (owner runs this in Terminal, in `server/`):
```
ELEVENLABS_API_KEY=$(security find-generic-password -a aspiran -s elevenlabs-api-key -w) node scripts/showreel-voice.mjs --force pods-1-hi
```
Leave off `--force pods-1-hi` to record only lines that have no clip yet.

## Checks
- Every scene at 1366 px and 375 px in English, and the busiest scenes in Hindi: nothing cut off, no sideways scroll,
  no console errors (also with rapid skipping).
- `npm run check` passes. `npm run test:all`: 24 of 25 pass. `friends` fails only because it was run at 00:16 IST: the pod friends are quiet from 23:30 to 07:00, so its "cheer a study win" step gets no reply. Nothing in this change touches the server. Rerun after 07:00.
- Screenshots: `artefacts/showreel/screens/`.

## Not yet checked
- Reduced-motion setting in a real browser (the rule is in place: no shake, no flying, instant changes).
- Tapping Join free through to sign-up.
- Real phones (only checked in a phone-sized browser window).

## Files
- New: `server/public/app/showreel.js`, `server/scripts/showreel-voice.mjs`, the voice clips.
- Small edits: `try.js` (one hook), `app.js` (the `tour` route), `sw.js` (file list, cache v57).
- `showcase.js` untouched (another session owns it).
