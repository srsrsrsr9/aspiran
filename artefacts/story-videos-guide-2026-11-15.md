# Story videos: how to make illustrated story shorts for Aspiran

15 Nov 2026. For the owner. Written after you shared three screenshots of an illustrated Upanishad short
(`artefacts/video-styles-2026-11-15/`). This guide shows how to make our own videos in that spirit, in our own look,
with tools you already have, and suggests seven more formats.

## Decisions up front

- **Recommended route: the cheap route first** (section B1). Pictures from the free Gemini app, narration in English
  and Hindi from **Fish Audio** (paid with your startup credits; about ₹5 to ₹15 a video for both languages, retakes
  and the speech-to-text check included), slow camera moves and captions done by a script. **Cost: about ₹5 to ₹15 a
  video. Time: about 3 hours for the first, about 1.5 to 2 hours once you have the style and characters saved.**
- **Voices (updated 15 Nov, evening):** English "Shubh", Hindi "शांत और भावुक स्वर", both Fish Audio licensed voices.
  Samples of the worked example are in `artefacts/video-styles-2026-11-15/` (section V says how they tested).
- Move to the **better route** (B2) only once the first three videos have been watched in the app and you like them.
  It costs about ₹250 to ₹600 a video and saves about an hour.
- **First three videos to make:** (1) *The Monkey King's Bridge* (a Jataka story, GS4 and GS1), fully written in
  section C; (2) *The Village That Voted by Pot* (Uttaramerur inscription, GS1 and GS2); (3) *Case File: The Relief
  List* (a District Collector's choice, GS4).
- One thing Claude needs to build before the first import: a small assembly script (`build-story`, described in B1
  step 6). It is about an hour of Claude's work, uses ffmpeg, which is already on the Mac, and changes nothing live.
  Until it exists, CapCut (already installed) does the same job by hand.

---

## What makes the example work

Looked at in the three screenshots:

- **Framing.** Tall 9:16, one idea per picture. Wide shots set the place (a banyan with hanging roots, a thatched hut,
  a small fire), then the story moves in close: two faces almost touching the frame edges, looking at each other. The
  close-up is where the turn of the story happens. Characters stand in the middle third; the top and bottom are left
  quiet for the caption and the phone's buttons.
- **Character design.** Two characters only, each with one or two marks you can spot at a glance: the old sage's white
  topknot, long beard and sacred thread; the young man's shaved head with a tuft and his spotted cloth. Simple shapes,
  clean outlines, no fine detail. Because the marks are strong, the viewer accepts small changes between pictures.
- **Palette.** Few colours per picture: one big background colour (dusty blue, warm ochre, foliage green) and the
  characters in earth tones. Flat colour with soft shading, like a painted poster, not glossy 3D.
- **Caption.** One short line at a time (4 to 7 words), white bold sans-serif on a dark rounded box, placed in the
  upper-middle of the frame so it never fights the buttons. Each line lands with the voice.
- **Pacing.** A picture holds for 3 to 6 seconds, with a slow push-in or drift, so about 10 to 14 pictures in a
  minute. The story is told in the past tense by one narrator, with a quoted line from a character at the turn.
- **The hook.** The title promises a small human drama before any idea: "His father humbled him with a …". You want
  to see the humbling. The idea (the self, in that story) arrives only after you care.

What we take from this: story first, idea second; few characters with strong marks; one line on screen at a time;
slow movement. What we do not take: their characters, their palette, their caption box, their script or their
stories. Section D says how to keep our look our own.

---

## A. The format

| Item | Our rule |
|---|---|
| Name in the app | **Story minute** (kicker on the poster: "Story · GS4 · AI voice") |
| Length | 50 to 75 seconds. Never over 90. |
| Aspect | 9:16. Make pictures at 1080 × 1920 (or the nearest the tool gives); the app copy is 720 × 1280. |
| Words | 130 to 170 spoken words in English (about 150 a minute, calm pace). Hindi runs about 10% longer; that's fine. |
| Shots | 10 to 14 pictures. Each holds 3 to 7 seconds. |
| Characters | 2, at most 3, each with two fixed marks (hair, cloth, object). |
| Caption | One line, 3 to 7 words, at most 32 characters (English) or 28 (Hindi). Two lines only if a line can't be split. |
| Voice | One narrator, labelled "AI voice". A character may have a second voice for one or two lines. |
| Sound | Off until the viewer taps. Captions always on. No music by default (see B). |
| Motion | Slow push-ins and drifts only. With reduced motion on, the app shows the poster and captions; our script also makes a still version (see G). |

**The shape (always the same six parts):**

1. **Hook, 0 to 5 s.** One picture from the most striking moment, and a line that promises a human problem
   ("Eighty thousand monkeys. One way out.").
2. **Setting, 5 to 15 s.** Who, where, and the one rule or want that drives the story. Name the source here, in words
   ("A Buddhist Jataka tells…").
3. **Beats, 15 to 40 s.** Three or four events, each one picture. Each beat raises the stakes.
4. **The turn, 40 to 50 s.** The close-up. One character says the line the story is remembered for.
5. **UPSC takeaway, 50 to 62 s.** One sentence that names the idea in exam words (for example "servant leadership",
   "public interest over self-interest") and the paper. One line on where the story sits in our heritage.
6. **The end, last 3 to 5 s.** A quiet closing picture and a closing line. Then the video stops. No "follow for
   more", no cliffhanger. The app then shows three questions.

**Titles.** A promise of a small drama, not a topic: "The King Who Made Himself a Bridge", not "Mahakapi Jataka and
leadership". No clickbait about exams or results ("This story will get you selected" is out).

**Tone.** Most stories are NEUTRAL or SERIOUS. A story with a death (like the worked example) is SERIOUS: calm
voice, no music, no effects, the death told gently, nothing shown that hurts to look at. A real tragedy (a famine, a
massacre, a disaster) is TRAGIC: no sound at all beyond the voice, no motion, not shareable; we'd rather not make
those as story videos at all.

---

## B. How to make one, step by step

Both routes share steps 1, 2 and 6. They differ in where the pictures, voices and movement come from.

### B1. Cheap route (recommended to start)

**What it uses:** Claude (or the Claude Project you already write content in) for the script; the free Gemini app
(Nano Banana image model) for pictures; Fish Audio for the English and Hindi narration (section V); ffmpeg (already
installed) for movement, sound and captions. If Fish Audio's credits run out, the free Kokoro voices already in
`content/tools/kokoro-vo.py` are the English fallback.

**Cost per video:** about ₹5 to ₹15 (all of it voice). **Time:** about 3 hours for the first one; 1.5 to 2 hours
after that.

**Step 1. Write the script (20 min).** Paste this into Claude, with the story's source text pasted inside
`<source>` tags. Use the public-domain translation, not a modern retelling.

```text
You write "Story minute" scripts for Aspiran, a UPSC study app, in English and Hindi.
Use only events that are in the <source>. Do not add characters, names, dates or quotes that are not in it.
Where you put words in a character's mouth, keep to the meaning of the source and mark it "(retold)" in the shot list.
Tell the story neutrally and respectfully. It comes from a religious or historical text: say whose text it is
("a Buddhist Jataka tells…"), never present it as history unless it is history.

Shape: hook (1 shot), setting (1–2 shots, name the source in words), 3–4 beats, the turn (a close-up and the line the
story is remembered for), the UPSC takeaway (one sentence naming the idea in exam words and the GS paper, one line on
where this sits in Indian heritage), and an ending that ends. 130–170 spoken English words. 10–14 shots.

Output, in this order:
1. Title (a promise of a small drama, under 50 characters), in English and Hindi.
2. A shot table: shot number, seconds, what we see, English narration, Hindi narration.
3. Captions: the narration split into lines of 3–7 words (max 32 characters English, 28 Hindi), one per line, in order.
4. Three multiple-choice questions (4 options, the answer index, a one-line "why"), English and Hindi:
   one on the story, one on the exam idea, one on the heritage fact.
5. factsToCheck: every name, place, number and date you used, with where it is in the source.
Tone: warm, plain, short sentences. No emoji. No jokes about death or religion.
```

**Step 2. Check it (15 min).** Read the shot table against the source. Every event must be in the source. Give
`factsToCheck` to Claude in the repo for the usual check before import.

**Step 3. Make the style sheet and character sheets (30 min, once per series).** In the Gemini app, start a new chat
and paste the style-sheet prompt. Keep the picture you like and save it as `style.png`. Then one chat per character
with the character-sheet prompt, pasting `style.png` in as a reference. Save each as `char-<name>.png`. Keep all
three in a folder for the series; you reuse them in every video of that series.

*Style-sheet prompt (our house look: "Aspiran storybook"):*

```text
Create a style reference sheet for an illustrated educational short, portrait 9:16.
Look: flat gouache-and-paper-cut illustration. Shapes are simple and slightly rounded, like cut paper laid on paper.
Soft grain texture on every colour. No black outlines; edges are made by colour change and a thin light rim.
Palette (use only these): indigo night #2B2D5C, river teal #2F7F86, leaf green #5E8C4A, turmeric #E0A526,
terracotta #B8553A, cream paper #F2E6CF, warm grey #8C8279.
Lighting: one soft light source, gentle long shadows, no glow effects.
Show on one sheet: a riverbank with one large tree, a night version of the same place, a small palace terrace,
and a colour strip of the seven colours. No people, no text, no logos.
Leave the top fifth and bottom fifth of each frame calm and simple (captions and phone buttons go there).
```

*Character-sheet prompt (fill the brackets):*

```text
Using the attached style sheet exactly (same paper-cut look, same seven colours, no outlines),
draw a character turnaround sheet for [NAME], [ONE-LINE DESCRIPTION].
Fixed marks that must appear in every view: [MARK 1], [MARK 2].
Show: front view, side view, three-quarter view, a close-up of the face with a calm expression,
and a close-up with a worried expression. Plain cream background. No text, no logos.
Keep proportions simple so the character can be redrawn the same way in many scenes.
```

**Step 4. Make each shot (60 min for 12 shots).** In one Gemini chat per video, first paste the style sheet and the
character sheets and say "Use these references for every picture in this chat." Then paste the per-shot prompts one by
one. Regenerate a shot up to three times; if a character drifts, paste the character sheet again with "same character
as this sheet".

*Per-shot prompt template:*

```text
Shot [N] of [TOTAL]. Portrait 9:16. Same style sheet and same characters as the references.
We see: [WHAT HAPPENS, one sentence].
Camera: [wide / medium / close-up], [eye level / low / high].
Characters in frame: [names], [where they stand], [expression].
Time of day: [day / dusk / night]. Keep the top fifth and bottom fifth calm and plain.
No text, no letters, no logos, no borders on any map.
```

Save the shots as `01.png`, `02.png` and so on. The Gemini app adds a small visible mark in a corner. Leave it:
Google's terms don't allow removing it, and we label the video AI anyway.

**Step 5. Voice (15 min).** Hand Claude the script; it voices both languages with Fish Audio (section V) and checks
every take by speech-to-text, as the notes readings are. If you'd rather do it yourself, use Fish Audio's website
with the same two voices, or record your own: one MP3 per language.

*Narration file template (`script.en.txt` and `script.hi.txt`, one shot per block):*

```text
# 01 | 4.5
Eighty thousand monkeys. One way out.
# 02 | 6
...
```

The number after `|` is how long the picture should hold at least; the script stretches it to fit the voice.

**Step 6. Assemble (10 min with the script, 45 min in CapCut).**

- *With the script (to be built by Claude):* `build-story` reads the folder of shots and the script files, voices them,
  gives each picture a slow push-in or drift (ffmpeg's zoompan, about 4% over the shot), joins them with short
  cross-fades, times the captions from the voice, and writes the app files in section G (MP4, VTT captions, poster, a
  still version for reduced motion) plus a social cut with captions burned in. No music.
- *In CapCut (by hand):* new 9:16 project, drop in the pictures, set each picture's length to its line, add "Zoom in"
  keyframes at 100% → 104%, add the voice, then export 1080 × 1920, 30 fps. Use **no** CapCut music, stickers or
  templates (licence terms, and our no-music default). Captions: send Claude the MP4 and it writes the VTT; don't burn
  captions in the app copy.

*Caption file template (WebVTT, what the app reads):*

```text
WEBVTT

1
00:00:00.250 --> 00:00:02.100
Eighty thousand monkeys.

2
00:00:02.100 --> 00:00:03.900
One way out.
```

**Step 7. Hand over.** Put the folder in `content/motion/story/<nn>-<id>/` (or send it), and Claude checks, imports and
publishes it.

### B2. Better route (once the format proves itself)

**What changes:**

- **Pictures:** Nano Banana Pro (Gemini 3 Pro Image) through Google AI Studio or the Gemini API, or a Google AI paid
  plan. Better at keeping the same face across 10 shots and at taking several reference pictures at once, and no
  visible mark on the API route. About $0.03 to $0.15 a picture depending on size; 12 shots with retries ≈ 30
  pictures ≈ ₹100 to ₹350. (Ideogram Character is a fair second choice at a similar price.)
- **A few moving shots:** for 2 or 3 key moments (the leap, the bridge), turn the still into a 5-second clip with an
  image-to-video model: Veo 3.1 Lite or Fast ($0.05 to $0.10 a second at 720p), Kling 3.0 (about $0.03 to $0.11 a
  second, depending on where you buy it), or Hailuo (cheapest). 3 clips × 5 s ≈ ₹50 to ₹150. Prompt: "Keep the
  picture exactly as it is. Only [the bamboo sways / the monkey's tail moves / leaves drift]. Camera still. No new
  objects, no text." Everything else stays as slow push-ins: full motion on every shot looks busy and drifts off-model.
- **Voice:** still Fish Audio, same model and price. The step up is a voice of our own: Fish Audio's Voice Design
  ($0.01 a try) makes a new voice from a written description, so the series gets a narrator nobody else uses and no
  third party owns. Make one English and one Hindi narrator once, keep their IDs, and use them for every story.
  (Never clone a real person's voice, and never use the community voices that copy famous people.)
- **Light character motion without video models:** split one character onto its own layer (ask Gemini for "the same
  picture with the background only" and "the character alone on plain green") so the script can move the background
  and the character at different speeds (parallax). A blink is two pictures (eyes open, eyes closed) swapped for 0.15 s.
  Cheap and calm; use it on the close-ups.

**Cost per video:** about ₹250 to ₹600. **Time:** about 1 to 1.5 hours once the series sheets exist.

**Not recommended for us:** FLUX.1 Kontext [dev] (its free weights are non-commercial only); running big image models
on the Mac (slow, and Qwen-Image-Edit, the commercially open one, needs a lot of memory); Midjourney (no free tier,
and it has changed its character-reference feature).

---

## V. Voices: Fish Audio (both routes)

**Which voices.** Fish Audio has thousands of community voices. Use only these two kinds:

1. **Fish-licensed voices** (the library's "licensed" filter). Their owners have licensed them through Fish Audio.
2. **Voices we design ourselves** with Voice Design (B2).

Never use a community voice that isn't licensed: many are copies of film stars and politicians, which breaks our
"no living people" rule and their terms.

Picked on 15 Nov 2026 (all licensed, all tagged calm, narration and storytelling):

| Use | Voice | Fish ID | Notes |
|---|---|---|---|
| English narrator (first choice) | Shubh (male, middle-aged, warm, measured) | `e0ea460db14b4430afb6311708937b6d` | Clean in the test |
| English narrator (woman) | SHILPA (female, warm, clear) | `d96e903b57be4742b105dfb0d3e26d51` | Clean; said "Bharhut" a little soft |
| Hindi narrator | शांत और भावुक स्वर (male, young, soft, calm) | `24e7cbf4121745e7bb3b54d1a0d2be80` | Best Hindi of the two licensed Hindi voices |
| Hindi narrator (spare) | Hashtag agriculture hindi voice (male, deep, calm) | `18e8999c98b746bda58521980d817e8c` | More slips in the test |
| Same voice in both languages | शांत और भावुक स्वर reading English | `24e7cbf4121745e7bb3b54d1a0d2be80` | Clean in English too; use it if you want one narrator across both languages |

There are only two licensed Hindi voices today, both male. For a woman's Hindi narration, design one (B2).

**How to pick another voice.** In the Fish Audio library, filter language English (or Hindi), switch on "licensed",
sort by most used, and play the sample of anything tagged narration, calm and storytelling. A good narrator for us is
calm, unhurried, Indian in accent, and clear on names (test it with "Bharhut, Sanchi, Uttaramerur, Parantaka").
Claude can list the candidates through the API: `GET https://api.fish.audio/model?language=hi&licensed=true&sort_by=task_count&page_size=40`.

**The request** (Claude runs it with the key read from the Keychain, service `fish-audio-api-key`, account
`aspiran`; the key is never printed or saved):

```text
POST https://api.fish.audio/v1/tts
Authorization: Bearer <key from the Keychain>
Content-Type: application/json
model: s2.1-pro

{"text": "<the whole narration; one blank line between shots>",
 "reference_id": "e0ea460db14b4430afb6311708937b6d",
 "language": "en",                      ("hi" for Hindi)
 "format": "mp3", "mp3_bitrate": 128,
 "prosody": {"speed": 0.95},
 "normalize": true, "latency": "normal"}
```

The answer is the MP3 itself. Use the paid model `s2.1-pro`, not `s2.1-pro-free`: Fish Audio's terms limit free use to
personal, non-commercial use. The check afterwards uses Fish Audio's own speech-to-text (`POST /v1/asr` with the MP3
and `language`), $0.36 an hour of audio.

**Writing for the voice.** Write numbers as words in Hindi ("अस्सी हज़ार"). For paper names write "G-S-four" in
English and "जीएस फ़ोर", "जीएस वन" in Hindi; "जी-एस चार" came out garbled. One blank line between shots gives a natural
pause.

**Cost.** Fish Audio bills $15 per million bytes of text. One English minute is about 1,000 bytes; Hindi takes three
bytes a letter, so the same minute is about 2,400 bytes. Both languages together come to about $0.05 (≈ ₹4) a take;
with a retake or two and the check, ₹5 to ₹15 a video. Your startup credits cover thousands of videos.

**Terms for commercial use** (Fish Audio Terms of Use, effective 18 Aug 2024, read 15 Nov 2026): paid users "are
licensed to use the Services for commercial uses"; free users only for personal, non-commercial use. API credits are
paid use. The terms don't say outright who owns generated audio, and they forbid presenting AI content as made by a
person; we label every video "AI voice", which covers that. Re-read the terms if Fish Audio changes the startup
programme, and keep the plan or credit receipt with the artefacts.

**The test (15 Nov 2026).** The worked example's narration (section C) was voiced and checked by Fish Audio's
speech-to-text against the script:

| File in `artefacts/video-styles-2026-11-15/` | Length | Words heard as written | What to listen for |
|---|---|---|---|
| `monkey-king-bridge.en.fish-shubh.mp3` | 63 s | 100% | Nothing found |
| `monkey-king-bridge.en.fish-shant.mp3` (the Hindi voice in English) | 65 s | 100% | Nothing found |
| `monkey-king-bridge.hi.fish-shant.mp3` | 75 s | 95% | Most differences are spelling (वानर राज for वानरराज). Listen to: "बहकर" (heard as भयकर), "नहीं रहा", "सीख" (heard as सीट), and the "पर" before चींटियों |

The scripts are next to them (`monkey-king-bridge.narration.en.txt`, `.hi.txt`). Speech-to-text can't judge warmth
or accent: please listen to all three and say which narrator you want for the series. The test cost less than ₹1.

---

## C. Worked example, ready to make: *The King Who Made Himself a Bridge*

- **Source:** *Mahākapi Jātaka*, No. 407, in *The Jātaka, or Stories of the Buddha's Former Births*, ed. E. B. Cowell,
  Vol. III, translated by H. T. Francis and R. A. Neil (Cambridge University Press, 1897), p. 225. Public domain. Read
  it at sacred-texts.com (`/bud/j3/`) or ancient-buddhist-texts.net (`/English-Texts/Jataka/407.htm`).
- **Why this story:** GS4 (leadership as service, public interest over self, the duty of those in power, compassion);
  GS1 (Jataka tales, early Buddhist art: the story is carved at Bharhut and on Sanchi's western gateway).
- **Tone:** SERIOUS. A death, told gently. No music. No wound shown.
- **Characters:**
  - *The monkey king* (Kapi): a large grey langur with a cream face and a turmeric-coloured cloth band across the chest.
    Marks: the cloth band; a pale crescent of fur on the brow.
  - *The king of Benares*: a middle-aged king, plain indigo robe, simple terracotta turban, no crown. Marks: the
    terracotta turban; a small round ear-stud.
  - *The troop*: smaller langurs, no band.
- **Things to keep out:** no other named monkey (the source names the one who hurt him as Devadatta in an earlier
  life; we leave the name out to keep the telling neutral and simple); no gore; no map.

### Shot list, script and per-shot prompts

Every shot prompt starts with: *"Shot N of 13. Portrait 9:16. Same style sheet and characters as the references. Keep
the top fifth and bottom fifth calm. No text, letters or logos."*

| # | s | We see (prompt) | English | Hindi |
|---|---|---|---|---|
| 1 | 4 | Night. Wide. Across a dark river, a langur's body stretched from a branch to a bamboo cane; small monkey silhouettes crossing on his back. Seen from below, low angle. | Eighty thousand monkeys. One way out. | अस्सी हज़ार बंदर। निकलने का एक ही रास्ता। |
| 2 | 6 | Day. Wide. A huge mango tree on the bank of a wide river, one branch over the water; the troop in its branches. | A Buddhist Jataka tells of a monkey king, and his troop in a great mango tree by the Ganges. | एक बौद्ध जातक कथा एक वानरराज की है, जिसका दल गंगा किनारे एक विशाल आम के पेड़ पर रहता था। |
| 3 | 5 | Medium. The monkey king on a branch, pointing at the branch over the river; monkeys picking fruit off it. | He had one rule: let no mango fall into the river. | उसका एक ही नियम था: कोई आम नदी में न गिरे। |
| 4 | 4 | Close. One ripe mango hidden behind an ant nest on a branch, dropping towards the water. | One fruit, hidden by an ant nest, fell anyway. | पर चींटियों के घोंसले के पीछे छिपा एक आम गिर ही गया। |
| 5 | 6 | Medium. Downstream, the king of Benares on a river terrace holding the mango, fishermen with a net behind him. | It drifted down to the king of Benares. He tasted it, and wanted the tree. | वह बहकर काशी के राजा तक पहुँचा। राजा ने उसे चखा, और उस पेड़ को पाना चाहा। |
| 6 | 5 | Night. Wide. Torches and archers in a ring around the mango tree; the troop huddled in the branches. | At night, his archers surrounded it. | रात में राजा के धनुर्धरों ने पेड़ को घेर लिया। |
| 7 | 5 | Night. Wide, side view. The monkey king mid-leap across the river, a bamboo cane tied to his waist. | The monkey king leapt the river, tied a bamboo cane to his waist, and leapt back. | वानरराज ने नदी पार छलाँग लगाई, कमर में बाँस बाँधा, और लौट आया। |
| 8 | 6 | Night. Medium. The cane falls short; the monkey king grips a branch with both hands, his body stretched as the last stretch of the bridge. | The cane fell short. So he held on, and made his own body the bridge. | बाँस छोटा पड़ गया। तो उसने डाल पकड़ ली, और अपने शरीर को ही पुल बना दिया। |
| 9 | 6 | Night. Low angle. Monkeys crossing along his back, one by one; below, the king watching, torchlight on his face. | The whole troop crossed over him. One, who bore him ill will, jumped hard, and wounded him. | पूरा दल उसके ऊपर से पार हो गया। एक बंदर, जो उससे बैर रखता था, ज़ोर से कूदा, और उसे घायल कर गया। |
| 10 | 6 | Dawn. Medium. The king's men lowering the monkey king gently on a cloth; the king kneeling beside him. | The king had him lowered gently, and asked why a king would suffer for his subjects. | राजा ने उसे धीरे से नीचे उतरवाया, और पूछा कि एक राजा अपनी प्रजा के लिए यह कष्ट क्यों सहे। |
| 11 | 7 | Close-up, two faces: the monkey king lying calm, the king leaning close. Soft dawn light. | "Their safety was my duty," he said. "A ruler's first care is the people he leads." *(retold)* | "उनकी रक्षा मेरा कर्तव्य था," उसने कहा। "शासक की पहली चिंता उसकी प्रजा है।" |
| 12 | 6 | Day. Wide. The king alone at a small shrine by the river, the mango tree behind, flowers at the shrine. | The monkey king died. The king honoured him, and ruled by that lesson. | वानरराज नहीं रहा। राजा ने उसका सम्मान किया, और उसी सीख पर राज किया। |
| 13 | 8 | Day. A carved stone panel in our paper-cut style, showing the bridge scene as an old relief (a medallion), on cream. | For GS4: this is leadership as service. For GS1: the story is carved at Bharhut and Sanchi, over two thousand years ago. | GS4 के लिए: यह सेवा वाला नेतृत्व है। GS1 के लिए: यह कथा भरहुत और साँची में दो हज़ार साल से भी पहले पत्थर पर उकेरी गई। |
| (end) | 3 | Hold on shot 1, now at dawn: the empty bamboo bridge over a calm river. (Make as shot 14.) | Remember the bridge. | पुल को याद रखिए। |

About 160 English words, about 70 seconds.

**Title:** English: *The King Who Made Himself a Bridge*. Hindi: *वह राजा जो ख़ुद पुल बन गया*.

**Poster:** shot 8, with the title.

### Captions (English; Hindi is split the same way, max 28 characters a line)

```text
Eighty thousand monkeys.
One way out.
A Buddhist Jataka tells
of a monkey king,
and his troop
in a great mango tree
by the Ganges.
He had one rule:
let no mango fall
into the river.
One fruit,
hidden by an ant nest,
fell anyway.
It drifted down
to the king of Benares.
He tasted it,
and wanted the tree.
At night,
his archers surrounded it.
The monkey king leapt the river,
tied a bamboo cane to his waist,
and leapt back.
The cane fell short.
So he held on,
and made his own body the bridge.
The whole troop crossed over him.
One, who bore him ill will,
jumped hard, and wounded him.
The king had him lowered gently,
and asked why a king
would suffer for his subjects.
"Their safety was my duty,"
he said.
"A ruler's first care
is the people he leads."
The monkey king died.
The king honoured him,
and ruled by that lesson.
For GS4:
this is leadership as service.
For GS1: the story is carved
at Bharhut and Sanchi,
over two thousand years ago.
Remember the bridge.
```

### The three questions after the video

1. **Why did the monkey king make his body the bridge?**
   (a) The king of Benares ordered him to (b) **He saw the troop's safety as his duty** (c) He wanted the mango tree
   for himself (d) The bamboo cane broke.
   *Why:* In the Jataka he tells the king that the safety of those he led was his purpose. The cane fell short; it
   didn't break.
2. **Which GS4 idea does the story show best?**
   (a) Emotional intelligence as self-control (b) Rule of law over discretion (c) **Leadership as service, putting
   the public interest above self-interest** (d) Probity in financial matters.
   *Why:* The leader carries the cost so that those he leads are safe. That is the idea behind "servant leadership"
   and public service.
3. **Jataka tales are stories of…**
   (a) **the Buddha's earlier lives** (b) the lives of the Jain tirthankaras (c) Mauryan kings (d) the Vedic seers.
   *Why:* The Jatakas tell of the Bodhisatta's former births. Many are carved on early stupas such as Bharhut and
   Sanchi.

(Hindi versions: Claude writes them at import from the English, as for the syllabus videos.)

### Facts to check before import

- Story events against Cowell Vol. III, No. 407 (the mango tree by the Ganges, 80,000 monkeys, the ant nest, the king of
  Benares, archers at night, the bamboo shoot tied to his waist, the shortfall, the troop crossing, the injury, the
  king's care, the monkey king's words and death, the king's honours). Checked against the online text on 15 Nov 2026.
- Bharhut: the translators cite Cunningham, *The Stūpa of Bharhut*, plate xxxiii. Sanchi: the Mahakapi Jataka is on
  the western gateway of Stupa 1 (check in an ASI or museum source). "Over two thousand years ago" covers Bharhut
  (about 2nd century BCE) and Sanchi's gateways (about 1st century BCE to 1st century CE); keep the wording loose.
- Line 11 is a short retelling of the monkey king's verses, not the translation's words. The shot list marks it
  "(retold)" and the manifest note will say so.

---

## D. Originality and rights

- **Our own look.** Our house style is the "Aspiran storybook" paper-cut look in B1 (no outlines, our seven colours,
  grain texture). The example channel uses outlined vector characters on flat colour; we don't. Never paste their
  frames into an image tool as a reference, and never ask a tool for "in the style of" a channel, studio or artist.
- **Our own characters.** Made fresh from our character-sheet prompt. Keep the sheets in the repo
  (`content/illustrations/story/<series>/`) so every video uses the same ones.
- **Our own caption look.** Our app shows captions from the VTT in the app's own caption style; the social cut uses our
  brand font and colours, not a black rounded box.
- **Our own stories and scripts.** We don't retell the Uddalaka and Shvetaketu story they used, and we don't use their
  script or structure word for word. Stories come from public-domain texts (pre-1929 translations, inscriptions,
  government records), and the source is named in the video and in the manifest.
- **Tool licences (check before each new tool):**
  - Gemini app pictures: Google lets you use them, including commercially; the visible mark and the hidden SynthID
    mark stay. Re-read Google's Gemini Apps terms before the first publish.
  - Gemini API / Nano Banana Pro: paid use, commercial use allowed under Google's API terms.
  - Fish Audio: see section V. Paid use is licensed for commercial use; free use is not. Use only paid models and
    Fish-licensed voices or our own designed voices.
  - Kokoro voices (fallback): Apache 2.0 licence, commercial use allowed.
  - Image-to-video (Veo, Kling, Hailuo, Runway): paid outputs are generally usable commercially; read the plan's terms.
  - CapCut: free to edit; don't use its music, stickers, effects or templates in anything we publish.
  - FLUX.1 Kontext [dev]: non-commercial only. Don't use.

---

## E. Accuracy and sensitivity

- **A named source for every story**, in the narration ("a Buddhist Jataka tells…") and in `sources` in the manifest,
  with edition and page.
- **Say whose story it is.** A religious story is "told in" its text; never "this happened". A historical story says
  what the evidence is ("an inscription at Uttaramerur records…").
- **Neutral and respectful.** No mocking any faith, community, caste or region. No villain tied to a real community.
  Gods and revered figures are shown with dignity, or not shown (use a symbol, a lamp, an empty seat). Ask Claude to
  check the depiction before you make the pictures if a story has a deity, a prophet or a living tradition's founder.
- **No living people.** No politicians, officers, judges or celebrities who are alive. Case files use made-up names and
  say so.
- **Stick to the source.** No added drama, no invented dialogue presented as a quote. Retold lines are marked.
- **Clothes and objects:** keep them simple and of the period in broad strokes; don't add things that pin a story to a
  specific community unless the source does.
- **Maps:** schematic only, with no national borders, as in all our videos.
- **Labels:** "AI voice" on the poster kicker and in the opening caption area; pictures marked "Illustrated with AI"
  in the end line or description. Never say a human editor checked it.

---

## F. Seven more formats that add variety

| Format | What it is | Why it helps | How hard |
|---|---|---|---|
| **1. Case file** (GS4) | A made-up officer faces a real kind of dilemma (a relief list with a powerful name added; a friend's file). Three illustrated shots, then "What would you do?" with three options, then the principle (Nolan principles, 2nd ARC). | GS4 case studies are a whole section of the paper and hard to practise alone. | Easy. Same storybook tools, 2 characters, 8 shots. |
| **2. A day in the office** (GS2, GS4) | Seven choices in a District Collector's or BDO's day, each one picture and one law or rule (Section 144, the MGNREGA muster roll, a disaster cell). | Turns polity and governance into a lived job; helps interview prep too. | Medium. 12 shots, needs a careful source per choice. |
| **3. Map journey** (GS1 geography and history) | A line travels across a schematic India map: the monsoon's arrival, a river from source to sea, the Grand Trunk road, a pilgrim's route in Hiuen Tsang's account. No national borders, only coast, rivers and dots. | GS1 geography and the Chai GS1 gap; maps stick. | Medium. Our existing `map` shot in the motion engine already draws schematic maps; no new art. |
| **4. Object biography** (GS1 art and culture) | An object tells its own story in the first person: a Harappan seal, the Didarganj Yakshi, an Ashokan pillar capital, a Chola bronze. Drawn in our style, never a photo of the museum piece. | Art and culture is half memory; a voice for an object makes it stick. Fills the GS1 gap. | Easy. 6 to 8 shots, one object, a museum source. |
| **5. Two sides** (GS2, Essay) | One question (simultaneous elections; a uniform civil code; freebies), two characters, each gives the best case for one side, then "what the committees said". Never a verdict. | Mains answers need both sides; this trains it. | Easy to draw; careful to write (balance check before publish). |
| **6. Timeline scroll** (GS1, GS2) | A paper scroll unrolls: Regulating Act 1773 to Government of India Act 1935; or the Bhakti saints by century. One picture or icon per date. | Order of events is a common Prelims trap. | Easy. Our `timeline` shot already exists. |
| **7. Spot the error** (Mains) | A model answer with one hidden mistake (a wrong article, a missing dimension). The viewer guesses; the video shows the fix. | Teaches answer writing actively; quick to watch. | Easy. Text cards, no pictures needed. |
| **8. Thinker in a minute** (GS4, GS1) | A thinker or reformer (no one living): Savitribai Phule, Ambedkar, Gandhi, Vivekananda, Narayana Guru, Kautilya. One scene from their life (from their own writing or a standard biography), one idea, one quote with its source. | GS4 asks for thinkers' quotes; GS1 asks for reformers. | Easy to medium. Portraits need care: dignified, not caricature. |

**For the Chai GS1 gap:** formats 3, 4 and 8, plus story minutes from inscriptions and travellers' accounts, give
Chai a GS1 card with an Indian angle on days when the news is all economy and polity. A Chai card can point to the
matching video.

Also worth trying later: **"A past question in 45 seconds"** (one Prelims question from our PYQ bank, the trap
option, why it's wrong) on the existing cards template; no new art at all.

---

## G. What the app needs (so imports work first time)

The app plays videos through the current-affairs shelf format (`upsc-pods/ca-week@1`, checked in `server/src/ca.ts`).
Per video:

| File | What | Notes |
|---|---|---|
| `<nn>-<id>.mp4` | The app copy | 720 × 1280, H.264, 30 fps, AAC voice. **No burned-in captions** (the app shows them from the VTT). About 1 to 2 MB a minute is what our current videos weigh; keep under 5 MB. |
| `<nn>-<id>.vtt` | Captions | WebVTT, one line per cue, as in the template in B1. |
| `<nn>-<id>.jpg` | Poster | 720 × 1280 JPEG, the poster shot. Shown when sound is off and with reduced motion. |
| (optional) `<nn>-<id>.social.mp4` | Social cut | 1080 × 1920 with captions burned in. Stays on the Mac; the app doesn't use it. |

`<id>` uses only letters, numbers, `-`, `_` and `.` (up to 80 characters), for example `07-monkey-king-bridge`.

The manifest (Claude writes it) needs, per video: `n`, `id`, `title`, `durationSec`, `mp4`, `vtt`, `poster`,
`syllabusNodes` (a list), `gsPaper`, `sources` (a list, with edition and page), `quiz` (a list of questions, each with
`q`, `options`, `answerIndex`, `why`), `free` (true or false) and `review` (`status` "approved",
`checkedBy` "Aspiran (owner publish)").

What to send Claude for each video: the shots (`01.png`…), the shot table with English and Hindi narration, the three
questions, the sources, and (if you made it yourself) the MP4. Claude does the rest.

Two open points for Claude to settle when the first story is imported (not for you):

- **Hindi copies.** Every manifest today is `"lang": "en"`. A Hindi video will need its own manifest with
  `"lang": "hi"`; Claude checks how the app picks the language before the first Hindi import.
- **Where stories sit.** Either a new shelf ("Story minute") or inside the syllabus series folders (`2000-NN`). Claude
  decides with you at the first import.

---

## H. First batch: 10 videos, in order

| # | Title | Paper | Format | Source |
|---|---|---|---|---|
| 1 | The King Who Made Himself a Bridge | GS4, GS1 | Story minute | *Mahākapi Jātaka*, Cowell Vol. III, No. 407 (section C) |
| 2 | The Village That Voted by Pot | GS1, GS2 | Story minute | Uttaramerur inscriptions of Parantaka I (about 920 CE), on the *kudavolai* lot system; ASI and *South Indian Inscriptions* |
| 3 | Case File: The Relief List | GS4 | Case file | Made-up case; principles from the 2nd ARC 4th Report (*Ethics in Governance*, 2007) and the Nolan principles |
| 4 | The Monsoon's Journey | GS1 | Map journey | IMD onset dates and NCERT Class XI *India: Physical Environment* |
| 5 | I Am a Harappan Seal | GS1 | Object biography | ASI and National Museum descriptions; NCERT Class XII *Themes in Indian History* I |
| 6 | The Emperor Who Regretted a War | GS1, GS4 | Story minute | Ashoka's Rock Edict XIII (Hultzsch, *Corpus Inscriptionum Indicarum* Vol. I, 1925). SERIOUS tone; the war told in one line, no battle pictures |
| 7 | One Day as Collector | GS2, GS4 | A day in the office | State manuals, MGNREGA operational guidelines, Disaster Management Act 2005 |
| 8 | Savitribai Phule's First School | GS1 | Thinker in a minute | Her own poems and letters (*Kavya Phule*, 1854), a standard biography |
| 9 | Simultaneous Elections: Two Sides | GS2, Essay | Two sides | Law Commission and High-Level Committee reports; both sides from the reports' own text |
| 10 | Spot the Error: Inflation Answer | GS3 | Spot the error | RBI inflation-targeting framework (as in our syllabus video on the band) |

Make 1 to 3 first, watch them in the app, then tell Claude what to change before 4 to 10. Stories 1, 2 and 6 share
one style sheet, so the first one's setup time pays off three times.

**Sample stills:** not made for this guide. No image model runs on this Mac and using the free Gemini app needs your
Google sign-in, so the first real pictures will come from you at step 3.

---

## Sources (checked 15 Nov 2026)

- Mahākapi Jātaka text: sacred-texts.com/bud/j3/ (Cowell, Vol. III, 1897) and ancient-buddhist-texts.net/English-Texts/Jataka/407.htm
- Nano Banana and Gemini app pictures, prices and marks: chasejarvis.com/blog/nano-banana-pricing/; myarchitectai.com/blog/nano-banana-api-pricing; coverr.co/blog/nano-banana-pro-ai-image-character-consistency-2026; ai.zenken.co.jp/en/post/gemini-image-guide/
- Ideogram Character prices: higgsfield.ai/blog/best-ai-image-generators-2026; pricepertoken.com
- Midjourney changes: tooldirectory.ai/compare/midjourney-vs-nano-banana
- Image-to-video prices: invideo.io/blog/ai-video-model-pricing; developersdigest.tech/blog/image-video-generation-api-pricing-2026; aireiter.com/blog/cheapest-image-to-video-api; costbench.com/compare/kling-api-vs-runway-api/
- Fish Audio: API reference docs.fish.audio (text to speech `/v1/tts`, list models `/model`); prices
  docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits; Terms of Use fish.audio/terms/ (effective 18 Aug 2024)
- Licences: bfl.ai/blog/flux-1-kontext-dev (non-commercial); localaimaster.com/blog/local-image-model-licenses-commercial-use (Qwen-Image-Edit, Apache 2.0)

Prices move often and several of these are secondary sources; check the tool's own pricing page before paying.
