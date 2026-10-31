# Models, daily content and audio/video: recommendation

11 Oct 2026. Builds on two earlier decisions: the on-device stack in `ai-stack-recommendation.md` (Gemma 4 E2B/E4B, EmbeddingGemma 2, Llama Guard 3 1B) and the content pipeline in `content/README.md` (Haiku fills templates, validator checks, editors approve EN and HI).

## 1. Fine-tuned, trained, quantized or distilled models

**Short answer: keep quantized off-the-shelf models ready; train only small classifiers now; fine-tune one model later, if the pilot shows a gap. Don't train or distill anything big.**

| Option | Verdict | Why |
|---|---|---|
| Quantized (int4/int8) | **Yes, now** | Gemma 4 E2B/E4B, EmbeddingGemma and Llama Guard already ship as quantized on-device builds. Pin one version of each, host the files on your own server, and let the app download the right one for the phone's RAM. This is "kept ready". |
| Small classifiers on embeddings | **Yes, now** | Distress check, topic/syllabus tagging, pod matching and "is this spam" as tiny heads on EmbeddingGemma vectors. A few KB each, train in minutes on a PC, and improve with every moderator or editor decision. This is where your own data pays off. |
| Fine-tune (LoRA) Gemma for Chotu | **Later, maybe** | Only if the pod pilot shows the base model's Hindi or tone is not good enough. By then the editor desk will have produced a few thousand approved EN/HI items, which is the training set. Fine-tuning before that means training on guesses. |
| Distil a big model into a small one | **No** | Content is written server-side and approved by people, so there is nothing a phone needs to generate that a distilled model would help with. |
| Train from scratch | **No** | Cost and data you don't have, and no gain over open models. |

Rule worth keeping: no model writes anything a member sees as fact without an editor approving it. On-device models only do chat (labelled AI), sorting and safety checks.

## 2. Content creation

Keep the existing pipeline (source text, model fills template, validator, editor desk). Add two lanes and one limit.

**Daily lane (current affairs).**
- A scheduled job each early morning pulls from primary sources only (PIB, PRS, RBI, Gazette, ministry sites, Supreme Court judgments), picks the day's 5-8 UPSC-relevant items, and writes a short source text per item.
- Haiku fills the Chai cards plus 2-3 interactive types per item through the Batches API (half price), validator runs, drafts land on the desk by about 7 am.
- Friday quiz and the 1/7/30-day recall reuse the week's approved items, so they cost nothing extra.

**Subject lane (evergreen GS1-4, CSAT, Essay, Ethics).**
- Build a syllabus map once (topic → subtopic → which template types fit). Fill it in batches, a subject at a time, from public primary texts (Constitution, Acts, reports, census, Economic Survey).
- NCERTs and coaching notes can be read for facts but not copied; the source text you feed the model should be your own summary or a public document.
- Use Haiku for the bulk (flashcards, sort, match, MCQ types). Use a larger Claude model (Sonnet) for the hard types where reasoning matters: answer skeleton, ethics dilemma, better answer, assertion-reason, two sides. Add a second-model check pass that only answers "is every claim supported by the source?" before the editor sees it.

**The limit: editor time, not model cost.** Generation is cheap; two editors approving EN and HI is the bottleneck. Set the daily output to what they can approve (start with about 5 cards and 10 interactive items a day) and let the subject lane fill gaps in quiet weeks. Track approval rate per template; a template that editors keep rejecting gets its brief fixed, not more volume.

## 3. Audio and video models

| Use | Recommendation | Changes an earlier decision? |
|---|---|---|
| Narrated classics, quotes, Lamp Off, anything in a named person's voice | **Human-recorded only** | No, keeps it |
| "Read this card aloud" (accessibility, listen while commuting) | **Phone's built-in text-to-speech** (Android TextToSpeech; Google's engine has offline Hindi and English). No model to ship, free, works offline. Label it "device voice". | **Yes.** Today there is no AI voice at all. This adds a generic, clearly labelled machine voice for reading text only. Your call. |
| Daily audio bulletin (Chai stall radio as a real 3-minute listen) | Later, if listening proves popular: a hosted Indian-language TTS (for example Sarvam's or Google Cloud's Hindi voices) rendered once per day on the server, from approved text only. | Yes, same as above |
| Voice input (speak a question, voice journal) | Phone's built-in speech recogniser, on-device mode. No Whisper needed. | No |
| Reels and explainers | **No generative video.** Render from the JSON timelines you already have: the app animates them live, and for Shorts/Instagram a server renders MP4 from the same JSON (ffmpeg or Remotion). Exact text, correct maps, no invented faces. | No |
| Illustrations | Keep hand-made SVGs in the palette. Skip image models: they draw wrong maps and borders, which is a legal problem for Indian maps. | No |
| Music and sound effects | Keep the code-generated beds and effects until real recordings replace them. | No |

## What to do next, in order

1. Pin and host the quantized model files; add the RAM-based download choice.
2. Train the first classifier (distress) on EmbeddingGemma with labelled examples, always routing positives to a human.
3. Set up the daily lane as a scheduled job feeding the desk, capped at the editors' daily capacity.
4. Draw the syllabus map and start the subject lane with one paper (GS2 Polity is the easiest to source).
5. Decide on the device voice for "read aloud".
