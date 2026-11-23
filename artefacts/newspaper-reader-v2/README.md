# Morning Paper (newspaper reader, v2): sample edition

Owner picked direction A on 24 Nov 2026 ("A seems to be best so far. Build a sample and close it.").

- Sample (20 Nov 2026 Chai): https://claude.ai/artifact/6m4A2vUAsvzj1zMx8SfknU (`morning-paper.html`)
- The three directions shown to the owner: https://claude.ai/artifact/QAEadz4AVkGFDtMLWHJUGn (`reader-directions.html`)

## What it is
A real front page you read, with pencil marks in it: the number to remember circled, key lines underlined or
highlighted, short margin notes, and red "Asked before" stamps that open the real UPSC question (Prelims shows UPSC's
official key after you pick an option; nothing is scored or kept). Every paragraph and every linked question has a
"✂ Cut" button; cuttings go to the cutting file. English and Hindi. Ends with "That's today's Chai. It ends."
No sound, no timers, no streaks. Pencil marks draw in once as you reach a story, and are simply there with reduced motion.

## Files
- `edition-2026-11-20.json`: the edition as data. This is the only thing that changes each day.
- `paper-template.html`: the renderer. Stays put.
- `build.py`: joins the two and copies each linked past question word for word from `content/pyq/pyq.json`
  (Prelims only with an official key). `python3 artefacts/newspaper-reader-v2/build.py artefacts/newspaper-reader-v2/edition-2026-11-20.json`

## How it would arrive daily with no app update
The 05:00 Chai drafting already writes the three stories. It would also write this edition shape: paragraphs with
`[[c|...]]` circle, `[[u|...]]` underline and `[[h|...]]` highlight marks, a margin note per paragraph where useful, one
visual (`split` bar or `chain`), and `pyq` refs into the bank. The server serves it with the brief; the web app renders
it the day the server ships; Android needs one release to add the renderer, then never again.

## Not covered by the sample
- Cuttings live only in this browser. In the app they would join the existing FSRS revision queue (that is what
  "comes back in revision" promises).
- No server or app code yet: no edition field in `briefs`, no desk check screen, no Android renderer.
- The Panchayat story has no Hindi (the published Hindi is garbled); the page says so and shows English.
- Pencil notes and stamp links were written by hand for this edition. Daily, the drafting step must write them and the
  desk must check them; a PYQ link should be left out when there is no real match.
- Only the newest Chai (20 Nov) was used; no Chai has published since.
