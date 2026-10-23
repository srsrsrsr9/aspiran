# Free, local AI for the pod app: recommended stack (v2)

*v2, 10 October 2026. This version folds in your decisions (a visible mascot instead of bots posing as members, local models only, Android only) and a fact-check of the Kimi brainstorm. Facts carry a source. **[Infer]** marks my own reasoning, and **[Unverified]** marks claims I couldn't confirm.*

## 1. Verdict

It's practical. The design rests on four points:

1. **EmbeddingGemma 2 can't talk.** It turns text into vectors for matching, memory, search and decisions. A small generative model is the voice, and scripted rituals (daily three tasks, close the day, wins of the week) are the spine. Liveliness comes from the rituals and content packs as much as from the model.
2. **The mascot is visibly AI.** It's a named, badged pod host (Kimi's "Chotu the chai-wallah" is a good example), and it never poses as a member. This keeps the honesty wedge from your research file and satisfies the labelling duty under India's 2026 IT Rules amendment.
3. **Free, local, always-on and shared: pick three. [Infer]** Phone agents are free, local and always with the user, but they only see that user. Pod-level agents need one shared machine. Your PC is free but not always on. A rented server is always on but costs money every month.
4. **Humans own distress.** The AI detects distress and escalates it to a human and the helpline. It never comforts someone and moves on.

## 2. Phone stack (Android)

| Job | Pick | Size | Notes |
| --- | --- | --- | --- |
| Mascot voice, 8 GB+ phones | **Qwen3.5-4B** vs **Gemma 4 E4B** (bake-off) | Qwen lists ~5B params including the vision encoder | Qwen3.5 small models (0.8B/2B/4B/9B) launched 2 March 2026 under Apache 2.0, with 201 languages and dialects listed. Hindi isn't named, so verify it ([Qwen3.5-2B card](https://huggingface.co/Qwen/Qwen3.5-2B), [Qwen on X](https://x.com/Alibaba_Qwen/status/2028460046510965160)). Gemma 4 lists 140+ languages and runs natively on LiteRT-LM ([LiteRT-LM](https://ai.google.dev/edge/litert-lm/overview)) |
| Mascot voice, 6 GB phones | **Qwen3.5-2B** vs **Gemma 4 E2B** | ~2B | The Qwen3.5-2B card warns its thinking mode can loop, so run it in non-thinking mode |
| Floor, 4 GB phones | **No generation**: rituals, content packs and retrieval | — | Qwen3.5-0.8B is an option if the eval shows it's good enough |
| Meaning, memory, matching | **EmbeddingGemma 2** (text-only) | ~191 MB RAM | Apache 2.0, released 6 Oct 2026 ([Google](https://blog.google/innovation-and-ai/technology/developers-tools/embeddinggemma-2/)). Add Qwen3-Embedding-0.6B to the Hindi bake-off |
| Typed decisions | **Laya-multilingual** to start, then tiny heads on embeddings | 322M | See section 5 |
| Safety screen | **Llama Guard 3-1B-INT4** | ~440 MB | The smallest proven on-device guard ([paper](https://arxiv.org/pdf/2411.17713)). Not evaluated on Indian self-harm language |
| Runtime | **LiteRT-LM** for Gemma, **llama.cpp** for Qwen, behind one interface | — | iOS is out of scope now that you've chosen Android only |

**Dropped from v1 or from Kimi's list:**
- **MiniCPM5-2B / 1B.** They're real, Apache 2.0, with GGUF and LiteRT-LM builds, but both model cards list only **English and Chinese** ([2B](https://huggingface.co/openbmb/MiniCPM5-2B), [1B](https://huggingface.co/openbmb/MiniCPM5-1B)). That makes them a poor pick for a Hindi/Hinglish mascot. Kimi ranked the 2B first for 6 GB phones, and I disagree.
- **Qwen3-4B / 1.7B and Phi-4-mini.** Qwen3.5 supersedes the first two, and Phi-4-mini is English-first.
- **Sarvam Edge.** It's speech-only, and voice notes aren't needed in the pilot.

## 3a. Update: laptop ruled out as host. Options for the shared "pod brain"

| Option | Free? | AI local? | Always on? | Notes |
| --- | --- | --- | --- | --- |
| **A. Phones only + plain chat backend** (recommended) | Yes, within free quotas | Yes | Yes | The backend stores chat and schedules ritual posts and content packs, with no model involved. **The poster's phone answers its own post**: it screens the post, runs the decisions and writes the labelled mascot reply before sending. Low-end phones fall back to templates. Content packs are pre-written weekly in a free notebook. Firebase's free Spark tier can't run scheduled functions; Blaze keeps the free quotas but needs a billing account ([back4app](https://blog.back4app.com/firebase-pricing/), [crontap](https://crontap.com/blog/firebase-scheduled-functions-without-blaze)) |
| B. Free cloud CPU running the open models | Yes | No (your cloud box) | Partly | HF Spaces CPU Basic: 2 vCPU/16 GB, sleeps after 48 h idle, no persistent disk ([HF docs](https://huggingface.co/docs/hub/spaces-overview)). Oracle Always Free was cut to 2 OCPU/12 GB in mid-2026, and capacity is often unavailable ([Linuxiac](https://linuxiac.com/oracle-quietly-cuts-free-tier-ampere-a1-resources-in-half/)) |
| C. Spare phone or mini PC at home | One-time cost | Yes | Mostly (power cuts) | Cheap, but you maintain it |
| D. Small paid server | Monthly cost | No (your server) | Yes | The natural home once paid tiers exist |
| E. Rotating member phone as host | Yes | Yes | No | Phones doze and drop off. Not recommended |

**Serverless hosts (Vercel and others).** They can't run the LLM itself: functions are short-lived, memory is capped (about 2 GB on Vercel Hobby), and there's no GPU. They work well as the plain backend in option A.
- **Cloudflare (best fit for A).** Workers' free plan includes SQLite-backed Durable Objects (one per pod as a chat room with WebSockets) and cron triggers for ritual posts. **Workers AI** gives 10,000 free "neurons" a day on open models such as Gemma 3 12B and Qwen3-30B-A3B. That's a free cloud voice for **non-sensitive** pod posts like news and daily tasks, but it isn't local, and models get retired ([pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [aggregator](https://agentdeals.dev/vendor/cloudflare-workers); free-plan counts from secondary sources).
- **Vercel Hobby.** Free but **personal and non-commercial use only**, with limited cron (reports say about once a day). Fine for a prototype, not the product ([Vercel limits](https://vercel.com/docs/limits)).
- **Supabase free.** Postgres, realtime chat and edge functions, but projects **pause after 7 days without activity** ([jetadmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)).

The bake-off can run in a free Kaggle or Colab GPU notebook instead of the laptop.

## 3. Pod-host machine (original plan, superseded by 3a)

**Your laptop:** Core i5-13420H, 16 GB RAM, integrated Intel UHD graphics, so every model runs on the CPU. The 4B and 9B models and Gemma 4 12B fit (tightly). **Sarvam-30B (~18 GB at 4-bit) doesn't fit** and waits for a 32 GB+ machine. **[Infer: sizes approximate, speeds to be measured in the bake-off]**

| Job | Pick | Notes |
| --- | --- | --- |
| Mascot + News Desk (16 GB RAM) | **Qwen3.5-9B** or **Gemma 4 12B** | Same model families as the phones, so one eval set covers both |
| Best Hindi (32 GB+ RAM) | **Sarvam-30B** | Apache 2.0, with 22 Indian languages listed. It's mixture-of-experts: about 32B total parameters but only **2.4B active**, and quantized builds exist ([model card](https://huggingface.co/sarvamai/sarvam-30b)). Because so few parameters are active, it should run on a 32 GB+ RAM PC **without** the ₹1–1.5 lakh GPU box Kimi priced **[Infer, test it]** |
| Larger option | Qwen3.8-27B | Reported released 17 Aug 2026 under Apache 2.0 ([eWeek](https://www.eweek.com/news/alibaba-qwen3-8-27b-license-apac-china/)). I didn't see the LICENSE file myself **[Unverified]** |
| Handwritten answers | **MiniCPM-V 4.6** on the host | 1.3B, Apache 2.0, released 11 May 2026, built on Qwen3.5-0.8B, with Android demo apps ([HF](https://huggingface.co/openbmb/MiniCPM-V-4.6), [GitHub](https://github.com/OpenBMB/MiniCPM-V)). Kimi's claims about handwriting quality, a "4× OCR mode" and speed versus Qwen are **[Unverified]**, and Hindi handwriting is untested |

**Not local, contrary to Kimi:** Sarvam Vision (3B). Sarvam's docs describe it as an **API product**, also sold on AWS Marketplace. I found no open weights or Apache license ([Sarvam docs](https://docs.sarvam.ai/api/getting-started/models/sarvam-vision)). It's useful only as an optional paid online service (section 8).

## 4. Mascot agents (agent manifest)

Every agent is labelled AI. This table plays the same role for agents that the human rules in research §8.6 play for people.

| Agent | Runs on | Sees | Never does |
| --- | --- | --- | --- |
| **Mascot / Pod Host** | Host | Pod posts, ritual status | Pose as a member, handle distress alone, upsell |
| **Chai Buddy** (personal) | Phone | That user's goals, close-the-day entries, memory | Send data off the phone, give answer-quality praise (it routes to Practice instead), act as a therapist |
| **News Desk** | Host | A curated feed only | Write news from model memory |
| **Guardian** (silent) | Phone + host | Every message | Reply to distress itself. It alerts a human and shows the helpline (Tele-MANAS 14416, verify before launch) |
| **Matchmaker** (silent) | Host | Profile fields, activity | Use mood data for matching without consent |

**Tone rules:** warm, short (2–4 sentences), specific and honest. No sycophancy: half-finished answers aren't praised as fine.

## 5. Typed decisions: Jev, Laya, and a local layer

**Jev (TypeSafe AI)** is hosted only, metered and waitlisted ([TypeSafe](https://typesafe.ai/blog/introducing-system-one-models-and-jev)). It doesn't fit the local constraint.

**Laya is the local counterpart, and the best new find.** It's an open-weight decision model from Convai Innovations under **Apache 2.0**. It doesn't generate text. You define typed questions (choice, score or yes/no) and it scores the answers. The **multilingual checkpoint (322M, mmBERT-base) covers 100+ languages and includes a Hindi example**. Reported latency is ~33 ms on a T4 GPU and roughly 0.2–0.5 s on CPU ([HF card](https://huggingface.co/convaiinnovations/laya), [LiteLLM](https://docs.litellm.ai/blog/laya-nimble-classifiers)). It ships for Python with an ONNX option. Running it on a phone would mean exporting it to ONNX Runtime Mobile **[Infer, untested]**.

**Plan:**
1. **Day 1 (no training data):** Laya-multilingual answers the typed questions zero-shot on the host: distress? scam? should the mascot speak now? which support card fits? This solves the cold-start problem Kimi raised.
2. **As labels accumulate:** every moderator decision becomes a label. At a few hundred examples per question, distill into tiny heads on EmbeddingGemma vectors that run on the phone in milliseconds.
3. **Safety:** set conservative distress thresholds, use Llama Guard as a second opinion, and always route distress to a human.

## 6. Small install, models on demand

The core design is Kimi's, checked against Play's rules.
- The app ships **no models**. Play caps the base module at **200 MB** (compressed), with asset packs up to 1.5 GB each and 4 GB cumulative for on-demand packs ([Play Console help](https://support.google.com/googleplay/android-developer/answer/9859372)). Downloading from your own source into app storage avoids those caps.
- **Download from Hugging Face directly** rather than your own CDN, so there's no bandwidth bill **[Infer; check HF's terms for app-scale traffic]**.
- **Device probe → tier → download:** check RAM, free space and Wi-Fi. Download embedding + Laya/heads + Llama Guard first, and the mascot model overnight on Wi-Fi as an opt-in. A server-driven JSON config holds the tier table and model URLs, so you can swap models without an app release.
- Keep one LLM loaded at a time and cap context at about 8K on phones.

## 7. Getting better over time

1. **Personal memory** on the phone, through retrieval rather than training.
2. **Weekly content packs.** A free RSS scrape plus summarisation on the host does most of the work, but someone still has to curate the feed list. That's a recurring human cost.
3. **Quarterly style fine-tunes:** teacher-generated, human-filtered house-style data, then a LoRA via Unsloth on a free GPU, merged and quantised to GGUF. Optionally distil the result down to the smaller tier. Fine-tuning changes tone and behaviour, not knowledge.
4. **Gate every release** on the Hindi/Hinglish/English eval set plus a safety eval. Collect training labels from thumbs on mascot replies, **not** from emotional disclosures, and only with DPDP consent.

## 8. Online model manager (later, for paid tiers)

**My view:** it's a good idea for paid tiers and non-personal work, as long as there's a hard privacy wall.

**Never leaves the phone (or the host):** mood taps, close-the-day text, distress messages, pod chat, Plan B, and attempt/age details. These stay local whatever the tier.

**Can go online, with consent, to zero-data-retention providers only:**
- Generating content packs from public news
- Question generation and PYQ tagging
- **Paid** deep answer feedback (the answer text is about polity, not feelings)
- Handwriting OCR for paid users

**How it would work [Infer]:**
1. Run the open-source **LiteLLM proxy** on the host. It already supports routing, fallbacks and cost tracking, and its Auto Router can use **Laya** as a self-hosted classifier to pick a tier per request ([LiteLLM](https://docs.litellm.ai/blog/laya-nimble-classifiers)). That gives you the "model manager" without Jev.
2. A **registry job** refreshes the model lists daily (OpenRouter's models API, OpenCode's `/zen/v1/models`) along with prices and data policies.
3. A new or free model enters rotation only after it **auto-passes your eval set**. When a free model disappears, the router falls back down the chain, ending at the local model, so nothing breaks.
4. **Allow-list by data policy, not price.** Exclude any model whose free tier trains on your prompts.

**The services you named:**

| Service | Real? | Fit |
| --- | --- | --- |
| **OpenRouter** | Yes. It's an aggregator and lists Jev too ([listing](https://openrouter.ai/models/typesafe/jev-1.13)) | Good main gateway. Data policy varies by underlying provider, so filter on it |
| **Hugging Face** | Yes. It hosts model weights and inference providers | Best for **downloading** local models. Fine for inference too |
| **Sail Research** | Yes. Hosted open-model inference with **zero data retention by default**. $5/month credits need a card, and Pro is $250/month ([site](https://www.sailresearch.com/)) | Good for paid-tier jobs that need privacy. Models include Gemma 4 and Qwen3.6 |
| **OpenCode Zen free models** | Yes. The current free list includes Big Pickle and DeepSeek V4 Flash Free ([docs](https://opencode.ai/docs/zen)) | **Avoid for user data.** Free models rotate, Big Pickle may use your data for training, and it's built for a coding agent, so check its terms before using it as an app backend |
| **Jev** | Yes, hosted | Optional for non-sensitive routing. Laya covers this locally |
| **Laya** | Yes, open weights | **Use**, as the local decision model and router classifier |

**Cross-border data:** India's DPDP rules allow transfers abroad except to countries the government restricts. Consent and notice still apply, so check before enabling any online path **[Infer; verify with counsel]**.

## 9. Next step

Run the **bake-off on your PC** before any Android code: Qwen3.5-4B/2B vs Gemma 4 E4B/E2B (plus Sarvam-30B if your RAM allows) on a 50–100 prompt Hindi/Hinglish/English set covering encouragement, close-the-day replies, news summaries, and Laya's distress and "speak now" decisions. The results decide the voice layer and de-risk bilingual support, the biggest unknown in your research.

---

### Appendix: fact-check of the Kimi brainstorm

| Kimi claim | Verdict |
| --- | --- |
| EmbeddingGemma can't run agents; it's the "nervous system" | **Right** |
| Bots posing as members break the honesty wedge; use a mascot | **Right**, and you've adopted it |
| Free + local + always-on + shared is impossible | **Right** (VPS price of ₹300–800/month **[Unverified]**) |
| Content packs carry a human cost; fine-tunes need an eval gate; DPDP consent | **Right** |
| Cold start for classifiers | **Right.** Laya now solves it |
| Agent manifest; anti-sycophancy | **Right**, added above |
| Qwen3-4B / 1.7B as mascot | **Outdated.** Qwen3.5 (Mar 2026) supersedes them |
| MiniCPM5-2B is real, Apache, on-device | **Right.** But it's English/Chinese only, so I wouldn't use it for a Hindi mascot |
| MiniCPM5-2B released 7 Sept 2026 | Plausible (covered by [Artificial Analysis](https://artificialanalysis.ai/articles/openbmb-releases-minicpm5-2b)); the date isn't on the model card |
| MiniCPM-V 4.6: 1.3B, Apache, Qwen3.5-0.8B base, Android | **Right** |
| MiniCPM-V 4.6: handwriting demo, 4× OCR mode, 1.5× speed | **[Unverified]** |
| Sarvam-30B Apache 2.0 with strong Indic claims | **Right** on the license. The win-rate figure is unverified |
| Sarvam-30B needs a ₹1–1.5 lakh GPU box | **Probably wrong.** 2.4B active parameters suggests a high-RAM CPU is enough **[Infer]** |
| Sarvam Vision 3B Apache 2.0, runs on host | **Not confirmed.** Sarvam documents it as an API |
| Qwen3.8 27B exists | Reported (Aug 2026, Apache). License file not checked |
| Play 200 MB limit | **Right** (base module, compressed) |
| EmbeddingGemma ~370 MB | Google says ~191 MB RAM text-only; disk size will differ |
| GPT-6.1, Gemini 4 and similar frontier launches | Not checked. Irrelevant to a local stack |
