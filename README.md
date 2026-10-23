# UPSC Pods content pack: preview, 10 Oct 2026

This folder holds the sample content from the content plan's preview, as plain files the app can load. Nothing here is editor-approved yet. Every item has `review.status: "draft"` and must not go live until an English and a Hindi editor have approved it. The app's existing news desk handles that approval.

Live preview of the same content: https://claude.ai/artifact/QXBZwcKkxR7TMixYHDU1Hu

## Files

| Path | What it is |
| --- | --- |
| `manifest.json` | Every file in the pack, with its size and SHA-256, so the app can check a download |
| `cards/chai-2026-10-10.json` | 3 Chai cards (GI tag, El Niño, Sendai Framework) in English and Hindi, using the app's six zones |
| `illustrations/*.svg` | One drawing per card, 320×200, using the illustration palette, 1.3-1.6 KB each |
| `share/<card>.<lang>.png` | Ready-made 1080×1920 "Chai of the Day" status cards, 6 in total |
| `explainers/article-200.json` | The Ek Minute explainer: 7 timed scenes, captions in both languages, element layout and states |
| `reels/chai-in-60-2026-10-10.json` | The "Chai in 60 seconds" timeline, which reuses the cards above |
| `audio/*.ogg`, `audio/*.m4a` | The chai motif (3 s), a music bed and two soundscapes (36 s seamless loops) |
| `audio/audio.json` | What each sound is for, plus the synthesis settings used to make it |
| `timelines/making-the-constitution.json` | Timeline story: 7 dated steps, 1946 to 1950, EN and HI |
| `games/match-the-article.json` | Match the Article: a pool of 14 Article-to-meaning pairs, 6 per round |
| `quizzes/quiz-night-week-41.json` | Friday quiz pack: 5 questions revising the week's samples |
| `maps/strait-of-hormuz.json` + `illustrations/hormuz-schematic.svg` | Map Chai: 4 tappable pins and a "Find it" target on a schematic base map |
| `numbers/sex-ratio-census-2011.json` | Number Sense: one figure, 4 bars (axis 800 to 1,100, reference line at 1,000), what it means, sources |
| `myths/forward-buster-constitution.json` | Myth vs Fact: 3 forwarded claims with verdicts (Fact, Myth, Half-true) and corrections |
| `debates/simultaneous-elections.json` | Two Sides: 3 points for, 3 against, and a 3-point answer outline |
| `winddown/lamp-off.json` | Lamp Off: a 2-minute wind-down after Close the Day; uses `audio/bed.ogg` |
| `tokens.json` | Colours (light, dark and after 20:00), how each tone tag changes the look, and fonts |

The whole pack is about 2.5 MB. Most of that is the share PNGs and the audio fallbacks. A normal daily pack would carry only the card JSON and SVGs, which come to under 20 KB.

## Newer types (added 10 Oct, from the UI/UX thread's ideas)

Map Chai, Number Sense, Myth vs Fact, Two Sides and Lamp Off came from the UI/UX research thread's list of 12. Each file has a `schema` name, `en` and `hi` text side by side, and the same draft `review` block as the cards. All of them follow the same rules: no timers, no score shown to anyone else, and a finished screen at the end. Lamp Off is never shareable.

The base map is a schematic with no national boundaries drawn. Keep it that way: an Indian map with borders would need the official Survey of India outline.

## Card format (`upsc-pods/chai-pack@1`)

Each card has `id`, `tone` (LIGHT, NEUTRAL, SERIOUS or TRAGIC), `illustration`, `shareCard`, `shareable`, `review`, and one block per language (`en`, `hi`) with:

- `lensChips`: up to 4 chips, zone 1
- `headline`: zone 2
- `summary`: zone 3
- `whyItMatters`: zone 4, 2-3 bullets
- `examCorner`: zone 5, an MCQ with `options`, `answerIndex` (0-based) and two feedback lines
- `chotuJoke`: present only on LIGHT cards; show it labelled "Chotu · AI"
- `takeaway`: the one line used by the reel and the share card

`pyq` is `null` on all three cards, so the card shows `pyqLabel` ("No direct PYQ"). The trust footer (zone 6) is built from `review` once an editor approves the card. Until then, use the `ui.trust` string, which says the card is a sample.

## Rules the app should follow

- TRAGIC cards: no illustration motion, no music, no emoji, no joke, and `shareable: false`. None of the three samples is tragic.
- Entry motion uses the time in `tokens.json` → `tone`. With the system's "remove animations" setting on, show everything still.
- Sound is off by default and never autoplays. The motif is never used as a notification sound.
- In data saver, skip the illustrations and audio. The text is complete without them.

## Notes for the build

- `gi.svg` and `nino.svg` include `<text>` labels ("GI", "INDIA", "PACIFIC"). Android Studio's Vector Asset import drops text. Either draw those labels in Compose over the image, or render the SVGs with an SVG library. `sendai.svg` has no text and imports cleanly.
- `.ogg` files are Opus, which the platform player supports from Android 10. Use the `.m4a` files on older phones.
- The audio is a code-generated stand-in, mixed quietly (peaks at about -9 to -16 dBFS). The real recordings will replace these files under the same names.
- The explainer has no narration yet (`audio.narration: null`). It is designed to work on captions alone.
- `explainers/article-200.json` gives positions on a 360×400 canvas. Scale them to the screen width.

## Part 2: seven new types with sound effects and motion

| Type | Schema | Sample | What it does |
|---|---|---|---|
| Scratch and reveal | `scratch-card@1` | `scratch/three-quick-facts.json` | Guess, then scratch a chai stain off the card. The scrape follows finger speed; a chime plays at 55% cleared. |
| Stamp trail | `stamp-trail@1` | `journeys/bill-to-act.json` | A process as a journey. Each station stamps the item (thud, 200 ms squash), then it slides on (whoosh, 350 ms). |
| Chai stall radio | `radio@1` | `radio/monsoon-desk.json` | Drag a transistor dial through static to 2 to 4 bulletins that type out; the chai motif ends the show. |
| Snap together | `assemble@1` | `assemble/preamble-snap.json` | Tap tiles into order. They spring into slots with a wooden snap; a wrong one wobbles with a soft nudge. |
| Domino effect | `chain@1` | `chains/el-nino-to-your-plate.json` | Cause and effect as dominoes, with clicks rising in pitch, ending on "where can policy break the chain?" |
| Then and now | `then-now@1` | `thennow/literacy-1951-2011.json` | A slider between two census years, with ticks at each tenth. It shows only the two real data points, never estimates. |
| Postcard from a place | `postcard@1` | `postcards/sundarbans.json` | A card with a soundscape (waves, rain, wind, market, forest) that flips over (400 ms) and gets a postmark. |

Rules for all of them: sound stays off until the member turns it on; TRAGIC tone plays no sound; with motion off, every piece still works (scratch becomes one tap, the flip becomes a swap, text appears at once); every piece ends.

Sound files are in `audio/sfx/`: 12 effects and 6 looping beds, in Opus `.ogg` with AAC `.m4a` fallback. `audio/sfx/sfx.json` gives each file's length, whether it loops, and the gain to play it at.

## Templates: making a lot of content with a small model

`templates/` has one folder per content type, all 18 of them:

- `schema.json` is the full pack. Fields marked `"x-from": "config"` (geometry, timings, sound ids, review state) are never written by the model.
- `fill.schema.json` is only what a writer or model fills, with word limits.
- `config.json` holds knobs and defaults (recipes, map anchors, sound choices).
- `brief.md` has the instructions for that type. `example.json` is a valid pack.
- `SYSTEM_PROMPT.md` is shared by every type: facts only from the source, tone rules, banned phrases, and Hindi style.

`tools/` (Node 18+, no dependencies except the SDK for generation):

```
node tools/validate.mjs content/chains/*.json            # schema + house rules
node tools/validate.mjs --source story.txt pack.json     # also flags numbers not in the source
node tools/selftest.mjs                                  # every template rebuilds its example from fill + config
npm install @anthropic-ai/sdk
node tools/generate.mjs jobs/jobs.example.jsonl --dry-run   # see the prompts
node tools/generate.mjs jobs/jobs.example.jsonl             # Claude Haiku 5.5 fills, then assemble + validate
node tools/generate.mjs jobs/jobs.example.jsonl --batch     # same, through the Batches API at half price
```

A job is one line: `{"type": "chain", "sourceFile": "sources/x.txt", "config": {...}}`. The generator sends the fill schema as a structured output, checks the reply, gives the model one repair turn listing any errors, assembles the pack, and writes it to `content/_generated/` as `review.status: "draft"` with a `provenance` block. Nothing is published, and an editor still approves EN and HI.

House rules the validator enforces: word limits; English and Hindi with the same list lengths, fields and answers; Devanagari in every Hindi field; jokes only on LIGHT; no emoji outside LIGHT; no sound and no sharing on TRAGIC; no urgency, streaks or promises; and a warning for any number in the English that is not in the source text.

Test run: `content/_generated/haiku-test/` has eight packs that Claude Haiku wrote from fresh source texts in `jobs/sources/`. Seven passed on the first try and one passed after the repair turn; no number was missing from its source. The first run caught a real bug (the schema tool dropped any field named `title`), which is fixed. This run went through a Claude agent with the same prompts, not through `generate.mjs`, because this environment has no API key.

Geometry-heavy types (explainer, map) never ask the model for coordinates. The explainer fills captions and labels into a fixed recipe, and the map picks pins from named anchors in `config.json`.
