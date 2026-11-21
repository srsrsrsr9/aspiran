# Chotu's flashlight: a prototype on one chapter (21 Nov 2026)

You said the side comments still compete with the content. This tries your idea on **one chapter only: the GST vote**.
Built on branch `claude/chotu-flashlight-302497`. **Not deployed, not merged.** Screenshots are in `screens/`.

## What a visitor sees now (GST vote only)
1. **While they play, nobody talks.** The side guide (and the dock on phones) is gone from this chapter. The
   chamber takes the full width.
2. **Once the chapter is done** (all three findings, then the last question), they get about 2 seconds to read the
   answer. Then the screen dims except one part, lit with a soft warm edge. Chotu (the little kulhad) sits next to it
   with one short line, **in text and in his voice**.
3. **Five stops, one at a time.** The light glides from one to the next:
   1. The chamber: "This is the GST Council. 31 seats for the states, the Centre at the front. You just ran the vote."
   2. The meter: "This bar is the whole rule. The Centre counts for one-third, all the states together two-thirds. Under 75% nothing passes."
   3. The three findings: "These three you found yourself. The Centre can block alone. The states need twelve of them to do the same."
   4. "The point" box: "So neither side passes anything alone. You didn't memorise that. You voted your way to it."
   5. The pitch, with the light on the big bottom button: "The app has 60 interactives like this one. Next, we plan a real Mains answer."
   The Hindi lines say the same (in `server/public/app/flashlight.js`, next to the English).
4. **Controls:** Next, Skip (on the last stop: "Stay here" and "Go"), tap anywhere to go on, arrow key and Esc on a
   laptop. Tapping the lit button on the last stop goes to the next chapter.
5. **Seen it once?** A small "Chotu's tour of this screen" button under the chapter plays it again.
6. Reduced motion: the light jumps instead of gliding, and nothing animates. Works at phone width (375 px) and on a
   laptop (1366 px), in English and Hindi.

## Why the GST vote
It's the chapter with the most to point at: the chamber, the meter, the stamp, the three findings and the point. All
of it is on screen at once, so it's also where the old side comments crowded the most. The Mains plan was the other
option, but its lines already arrive one at a time with their reasons beside them, so it gains less.

## Chotu's voice (the audio-default change)
- **On by default, as you asked.** Browsers don't allow sound before a click, so the visitor's **first click anywhere in
  the demo** turns it on. Nothing ever plays before that.
- **One speaker switch:** the speaker at the top now shows "on". Tapping it turns everything off (voice and the small
  sound effects) and the demo remembers that. Chotu's card has the same switch.
- **Sound effects stay off by default.** Only the voice is on by default. Turning the speaker back on turns both on.
- This is an **exception to the project rule** "sound off by default", decided by you for the demo's guide only. It's
  written in the handover notes.
- The 10 recordings (5 lines × English and Hindi, 4 to 7 seconds each, about 400 KB in all) were made with **Chotu's own
  designed voice** (Fish Audio, the same voice and settings as Chotu's Listen button), cost a few cents, and ship with
  the app at `server/public/app/demo-voice/sim-gst/`. To redo them after changing a line:
  `node scripts/flash-voice.mjs sim-gst --force` (from `server/`, with the Fish Audio key in the environment).
- Checked by reading each file back with speech-to-text: all came back word for word (one Hindi word, बारह, was heard
  as "बारे", a normal slip). **I can't hear, so please listen** to two or three on the local demo.
- Nothing in the card mentions the voice, and there's no "AI" label anywhere. Chotu only describes the screen; he never
  comments on how the visitor did.

## Two things to know
- On a phone, the findings list is taller than the space left by Chotu's card, so on that one stop the card sits over
  the bottom of the third finding. Everything else fits without overlap.
- The tour starts about 2 seconds after the last answer. If that feels too soon or too late, it's one number.

## Rolling it out to all 10 chapters
About a day's work, mostly writing:
- **Lines:** 2 to 4 stops per chapter, about 35 lines in English and Hindi. These replace the side-guide lines, which
  were written to sit beside the content, not to point at it.
- **Recording:** about 70 short files with Chotu's voice; under a dollar; one command.
- **Code:** small per chapter (which parts to light). The chapters where the visitor watches or reads (video, Mains plan,
  essay) need a decision on when "done" is, because the light must not cut in while they're still reading.
- **The cover and the finale** probably want one Chotu greeting and one goodbye, not a tour.
- If you'd rather keep a little text during play, the side guide could come back as a single quiet line instead.

## How to try it yourself
From `server/`: `npm run dev`, import the Federalism topic, open `/app/#try/path-pol-federalism`, pick "The GST vote".
(Claude ran it this way on a local copy; nothing on aspiran.in changed.)
