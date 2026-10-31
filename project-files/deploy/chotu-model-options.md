# Smaller models for Chotu: options and recommendation

Checked 12 Oct 2026. Chotu today offers three on-phone files (`server/src/chotu.ts`): Gemma 4 E4B (3.66 GB), Gemma 4 E2B (2.59 GB) and Qwen3 0.6B (0.50 GB).

## Recommendation

**Ship one on-phone model, Gemma 4 E2B, and drop E4B. Keep cloud Chotu for phones that can't run E2B.**

- What people download drops from up to 3.7 GB to 2.6 GB, and you host 2.6 GB in R2 instead of 6.7 GB.
- E2B is the smallest model here that handles Hindi, Telugu and Hinglish reasonably well. Gemma 4 is trained on 140+ languages, while the smaller alternatives below are mostly English-first.
- It needs less RAM than the README assumes. Google's own numbers (Samsung S26 Ultra) show about 1.7 GB of memory on CPU and about 0.7 GB on GPU, and text-only use can go as low as about 0.8 GB because Chotu never loads the image and audio parts. So it may well run on 4 GB phones. **Test this on one real 4 GB phone before deciding.** If it runs, the Qwen 0.6B Lite option can go too.
- It's Apache 2.0, from Google's official `litert-community` repo, and safety-tuned. Never use the "uncensored" or "abliterated" E2B builds on Hugging Face: they have had the safety training removed.

## Options looked at

| Option | Download | Hindi / Telugu / Hinglish | Safety and licence | Verdict |
|---|---|---|---|---|
| Gemma 4 E4B | 3.66 GB | best of these | Apache 2.0, Google | Drop: 1 GB more for a gain few aspirants' phones can use |
| **Gemma 4 E2B** (current file) | **2.59 GB** | good | Apache 2.0, Google | **Keep as the one model** |
| Gemma 4 E2B `-gpu` file in the same repo | 2.01 GB | same model | same | Worth testing: 0.6 GB smaller. The repo doesn't document it, so check it runs through LiteRT-LM on CPU as well as GPU, and on a mid-range phone, before switching |
| Gemma 4 QAT (June 2026) | not yet published as a `.litertlm` | slightly better than plain 4-bit | same | Watch: if Google ships an E2B QAT `.litertlm`, it may be smaller and better. Re-check before launch |
| Qwen3 1.7B (`litert-community`) | 2.1 GB | weaker than Gemma in Indian languages | Apache 2.0 | No: about the same size as E2B, worse for your languages |
| Qwen3 0.6B (current Lite) | 0.50 GB | weak; Hindi often garbled, Telugu poor | Apache 2.0 | Fallback only, or drop if E2B runs on 4 GB phones |
| Gemma 3 1B (`litert-community`) | 0.53 GB | mainly English | Gemma licence | No for Hindi/Telugu |
| Sarvam-1 (2B, Indic-focused) | no phone build exists | strong Indic base | base model, not chat-tuned or safety-tuned | No for now: you'd have to convert and fine-tune it yourself |

The Hindi/Telugu judgements for Qwen 0.6B, Gemma 3 1B and Qwen 1.7B are inferred from their model cards and general benchmarks, not from a test on Chotu's prompts. The safety net is the same for every model: distress phrases are caught on the phone before any model sees them, and again on the server.

## Unsloth and other teams that shrink models (checked 12 Oct)

**Unsloth's Gemma 4 E2B files aren't smaller than Google's own file at the same quality.** From their [E2B GGUF repo](https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/tree/main) and [Gemma 4 QAT page](https://unsloth.ai/docs/models/gemma-4/qat):

| E2B file | Size | Quality vs the original (Unsloth's own numbers) |
|---|---|---|
| Unsloth QAT int4 (UD-Q4_K_XL) | 2.62 GB | 98.2% of next-word picks match |
| Unsloth "mobile mix" (UD-Q2_K_XL) | 2.19 GB | 97.8% match |
| Unsloth smallest (UD-IQ2_M) | 2.29 GB | not published |
| Google `.litertlm` (current) | 2.59 GB | Google's own mobile mix of 2, 4 and 8 bit |
| Google `-gpu.litertlm` | 2.01 GB | not published |

These files can't get much smaller because about half of E2B is a large table of per-layer word embeddings, which compresses poorly. Every quantizer hits the same floor, at roughly 2 GB.

There's a bigger catch: Unsloth ships **GGUF** files, which run on llama.cpp. Chotu runs on Google's **LiteRT-LM** (the `litertlm` library in `android/app/build.gradle.kts`), which loads only `.litertlm` files. Using Unsloth's files would mean swapping the phone's AI engine, a real code change, and Google's 2.01 GB file is already smaller than the best Unsloth file. **So stay on Google's files.**

Where Unsloth *is* useful: if you later fine-tune Chotu on your own tone or Hindi/Telugu examples, Unsloth is the cheapest way to do it (free Colab notebooks). Its accuracy figures also support QAT 4-bit: about 98% agreement with the full model. Converting a fine-tuned Gemma 4 back to `.litertlm` is still rough; one developer [reported needing fixes](https://medium.com/@amanie.elhajj/how-i-got-a-fine-tuned-gemma-4-working-on-android-51484e6369ed).

**Others in this space:**

| Who | What they do | Useful for Chotu? |
|---|---|---|
| Google `litert-community` | official phone builds (`.litertlm`) of Gemma, Qwen and others | **yes, this is the source to use** |
| bartowski, ggml-org, LM Studio community | GGUF quantizations of most open models | no, GGUF only (llama.cpp) |
| MLC LLM | its own Android runtime and 4-bit builds | only if you switch runtimes |
| Qualcomm AI Hub | builds tuned to Snapdragon chips | Google already publishes Snapdragon E2B builds, but they're larger (3.0 to 3.3 GB) |
| Multiverse Computing (CompactifAI) | claims up to 95% compression; tiny 0.3B "LittleLamb" models; a [mobile app](https://multiversecomputing.com/resources/introducing-compactifai-app-bringing-offline-ai-to-edge-devices) | not yet: vendor claims, no Hindi/Telugu evidence, no `.litertlm` |
| Liquid AI (LFM2.5, 350M to 1.2B) | small models built for phones | no: listed languages don't include Hindi or Telugu |
| Sarvam | Indian-language models; [Sarvam Edge](https://www.sarvam.ai/blogs/sarvam-edge) is on-device *speech* (about 60 MB) | text models are 24B+, too big for phones. Edge is worth a look for voice later |

## How to decide in an afternoon

1. On one 4 GB phone and one 6 GB phone, load E2B and ask 10 typical Chotu questions: 4 in Hindi, 3 in Telugu, 3 in Hinglish.
2. Note whether it loads, the first-reply wait, and whether the answers read naturally.
3. Try the same with the 2.01 GB `-gpu` file.
4. Keep the smallest file that passes on both phones. Ask the build thread to update the model list in `server/src/chotu.ts` and the phone's RAM thresholds to match.

Sources: [litert-community Gemma 4 E2B](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm) (file list and benchmarks), [Google's Gemma 4 QAT post](https://blog.google/innovation-and-ai/technology/developers-tools/quantization-aware-training-gemma-4/), [litert-community Qwen3 1.7B](https://huggingface.co/litert-community/Qwen3-1.7B), [litert-community Gemma 3 1B](https://huggingface.co/litert-community/Gemma3-1B-IT).
