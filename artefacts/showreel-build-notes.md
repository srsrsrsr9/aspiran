# Showreel tour: build notes (22 Nov 2026)

Branch `claude/ecstatic-herschel-f72e35`. Deployed to production on 22 Nov 2026 (owner's go).

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
**22 Nov (afternoon): re-voiced with Sumeet** (ElevenLabs, a confident Indian narrator), the owner's pick after
"robotic in places, a bit too young, awkward pauses" on the first voice (Bhargav). Samples and the full list of causes
and fixes: `artefacts/showreel/voice-samples-2026-11-22/README.md`. In short: the script is now whole, flowing sentences;
each clip is recorded knowing the lines around it; calmer settings; every clip trimmed, with no pause inside over 0.35 s;
the player waits 0.12 s between clips (was 0.25 s) and 1.9 s at the two "your turn" moments (was 2.4 to 2.6 s).
After the re-record no clip has a pause of half a second or more (19 had before).

92 clips (46 per language) in `server/public/app/demo-voice/showreel/`, each transcribed back to check the words.
Sound starts only when the visitor taps "Play the tour"; "Watch without sound" and the mute button both work.

**Please listen to:** the brand name in `intro-1-hi.mp3` and `pods-1-hi.mp3`. The checker hears "Aspirant" (and once
"आज फिरान"); the English pod line now comes back as "Aspiran". Only a human ear can settle it.

To re-record a line after changing its words in `showreel.js` (in Terminal, in `server/`):
```
ELEVENLABS_API_KEY=$(security find-generic-password -a aspiran -s elevenlabs-api-key -w) node scripts/showreel-voice.mjs --force pods-1
```
Leave off `--force pods-1` to record only lines that have no clip yet. Sumeet is the default voice (`--voice=` picks another).

## Checks
- Every scene at 1366 px and 375 px in English, and the busiest scenes in Hindi: nothing cut off, no sideways scroll,
  no console errors (also with rapid skipping).
- `npm run check` passes. `npm run test:all`: all 25 suites pass (22 Nov, 09:38 IST, after rebasing on main). An earlier run at 00:16 IST failed `friends` only because pod friends are quiet from 23:30 to 07:00.
- Screenshots: `artefacts/showreel/screens/`.

## Not yet checked
- Reduced-motion setting in a real browser (the rule is in place: no shake, no flying, instant changes).
- Tapping Join free through to sign-up.
- Real phones (only checked in a phone-sized browser window).

## Files
- New: `server/public/app/showreel.js`, `server/scripts/showreel-voice.mjs`, the voice clips.
- Small edits: `try.js` (one hook), `app.js` (the `tour` route), `sw.js` (file list, cache v57).
- `showcase.js` untouched (another session owns it).
