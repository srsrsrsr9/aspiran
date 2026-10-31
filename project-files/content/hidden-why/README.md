# The Hidden Why (`upsc-pods/hidden-why@1`), proposal and samples, 14 Oct

A picture-story format inspired by the Deepstash ads (cobra effect, hospital rankings) and by Freakonomics. Each story starts with a claim that sounds wrong, explains it in 5 to 7 captions over one illustration, names the idea in the last frame, and ends with three cards: **Say it smart** (a line for the interview or an answer opening), **Careful** plus **If they ask next**, and **Use it in** plus sources.

Live preview: see the "The Hidden Why" artifact linked in the project thread "Deepstash-style insight stories".

All six packs here are `review.status: "draft"`. Sources marked `"verify": true` need a subject editor; every Hindi string needs the Hindi editor.

| File | Idea it names | Papers |
|---|---|---|
| `cobra-effect-hanoi-rats.json` | Cobra effect (Hanoi 1902 rat bounty; the Delhi cobra story flagged as unrecorded) | GS2, GS4, Essay |
| `goodharts-law-report-cards.json` | Goodhart's law (New York surgery report cards; ASER enrolment vs reading) | GS2, Essay |
| `fine-is-a-price.json` | Crowding out (Gneezy and Rustichini, Haifa day-care fine) | GS4, GS2, Essay |
| `punjab-water-and-smoke.json` | Second-order effects (2009 subsoil water Act and stubble fires) | GS3, GS2, Essay |
| `women-pradhans-natural-experiment.json` | Natural experiment (Chattopadhyay and Duflo, 73rd Amendment reservation) | GS2, GS1, Essay |
| `survivorship-bias-toppers.json` | Survivorship bias (Wald's bombers; topper talks) | CSAT, GS4, Essay |

## Pack shape

- `frames[]`: 5 to 8 items, each `{en, hi, focus: [x, y, zoom]}`. `focus` is a point on a 360×640 illustration that the camera pans to. The first frame is the hook; the last frame names the idea.
- `scene`: illustration key (one tall illustration per story).
- `named`, `sayItSmart` (about 40 words), `careful`, `followUp: {q, hint}`, `useItIn[]: {paper, en, hi}`, `linkedPacks[]`, `sources[]: {label, verify}`.
- `tags.stage` and `tags.formats` include `interview`, which `templates/exam-formats.json` does not have yet.

## To add it to the app

1. A `templates/hidden-why/` folder (schema, fill schema, config, brief, example) and a registry entry. It runs on the existing Step-through engine with a full-screen pan-and-caption look; with motion off each frame is a still crop.
2. Validator rules: captions of 16 words or fewer, last frame names the idea, `careful` and at least one source required, numbers checked against the source.
3. An `interview` entry in `exam-formats.json`.
4. One illustration per story. The preview's SVG drawings are stand-ins; an illustrator would set the etched house style for launch.
