# Model watch

A running log of new AI models and providers for the app. Chotu (the cloud helper) currently goes through Groq; on-phone AI is Gemma 4 E2B/E4B (see [models-and-content-plan.md](models-and-content-plan.md)).

Every candidate is judged on four things: how new and capable it is, how much it costs (free is best), how fast it runs, and how well it handles Hindi and Telugu. One extra rule: student chats can contain distress messages, so they never go to a free tier that keeps prompts for training.

Prices are per million tokens (input / output). Most figures come from third-party trackers, so check them against the provider's own console before switching anything.

---

## 2026-10-15: first check

### The two links from X

**Ultramarine 1 Flash (Paper Instruments).** This is GLM-5.3 Flash fine-tuned for finance, law and consulting work. It costs $0.15 / $0.50, the same as its base model. The weights are "coming soon", and it has no Indic or exam focus. **Skip it.** Its base model, GLM-5.3 Flash, is the useful find (see below).
Source: https://www.paperinstruments.com/ultramarine

**FineEnvs multilingual-multimodal-envs (Hugging Face).** This is a set of training environments, not a ready model: OCR in 22 languages and speech recognition in 102. It includes Gemma 4 E4B LoRA adapters trained for Kannada OCR and speech, with the recipe, scripts and logs. It's relevant later as the recipe for teaching our on-phone Gemma 4 E4B better Hindi or Telugu speech or OCR, if the pilot shows a gap. **Bookmark it; there's nothing to switch to.** Two caveats: the NayanaOCR corpus is CC BY-NC (non-commercial), and the page doesn't list the full set of 22 OCR languages.
Source: https://huggingface.co/collections/FineEnvs/multilingual-multimodal-envs

### Groq today

From the live model page (console.groq.com/docs/models):

| Model | Tier | Speed (tok/s) | Price |
|---|---|---|---|
| llama-3.1-8b-instant | production | 560 | contact sales |
| llama-3.3-70b-versatile | production | 280 | contact sales |
| openai/gpt-oss-120b | production | 500 | $0.15 / $0.60 |
| openai/gpt-oss-20b | production | 1000 | $0.075 / $0.30 |
| qwen/qwen3.8-27b | preview | 450 | $0.80 / $4.00 |
| minimaxai/minimax-m2.7 | preview | 260 | contact sales |

Groq is still the fastest per token, but its production list is stuck on Llama 3.x and gpt-oss. Preview models "may be discontinued at short notice".

### Alternatives

| Option | Newness | Cost | Speed | Notes |
|---|---|---|---|---|
| **OpenRouter** (router) | Has every new model, usually on day one | Pass-through pricing; ~12-16 rotating free models | Depends on the host | One OpenAI-compatible key, and switching models means changing a string. Free models change weekly, and some free ones train on your inputs. |
| **GLM-5.3 Flash** (Z.ai, open weights) | Aug 2026, 1M context, image and video input | $0.15 / $0.50 list; $0.06 / $0.20 batch on OpenRouter | ~67 tok/s on Z.ai, ~150 on Together, ~250 on some hosts | Best value-for-capability right now. Hindi and Telugu still need testing. |
| **Gemini 3.1 Flash-Lite** (Google) | 2026 | Free tier at about 15 RPM / 1,000 a day; paid $0.25 / $1.50; 2.5 Flash-Lite is $0.10 / $0.40 | Fast | Strongest Indic coverage among the cheap models. The free tier uses prompts for training, and Google's terms reportedly bar public production apps on it, so use the paid tier for students. Flash prices rise on 1 Jan 2027. |
| **Gemma 4 via Google AI Studio** | Same family as our on-phone model | Free | Variable | Reports of frequent 500 errors, and the same free-tier terms apply. Fine for content jobs and testing; not for Chotu. |
| **NVIDIA Nemotron 3.5 Lightning / 3 Ultra** | New | Free on OpenRouter | Varies | Good for free content drafting. Untested on Hindi. |
| **Sarvam** (India) | Sarvam 105B; Saaras v4 speech recognition for 22 Indian languages; Bulbul v4 voice | ₹29 / ₹73 for 105B; speech recognition ₹30 an hour; ₹100 free credit | Bulbul under 250 ms | Indian provider, built for Indic. The natural pick for voice input and Telugu if the phone's own speech recogniser falls short. |
| **Cerebras** | gpt-oss-120b, GLM-4.7 | The free tier was replaced by $5 trial credit (Jul-Aug 2026) | Fastest (~1,700-3,000 tok/s) | No longer free, and its catalogue is thin. Skip it. |
| **Mistral free tier** | Mistral models | Free, but requires opting in to training | n/a | The training opt-in rules it out for student chats. |

### Recommendation (2026-10-15)

1. Put Chotu behind an OpenAI-compatible switch: OpenRouter, or a tiny config of our own. Changing the model then becomes a setting rather than a code change. This fixes the "stuck on Groq" problem for good.
2. Run a short Hindi, Telugu and English test of about 30 real Chotu prompts on three candidates: GLM-5.3 Flash, Gemini 3.1 Flash-Lite (paid) and Groq gpt-oss-120b. Pick on quality first, then cost, then speed.
3. Keep Groq gpt-oss-20b (1,000 tok/s, $0.075 / $0.30) as the fast, cheap fallback.
4. Use free models (OpenRouter free, Gemma 4 on AI Studio) only for content drafting, never for student chats.
5. Sarvam is the go-to if voice input or Telugu needs more than the phone offers.

### Sources
- https://console.groq.com/docs/models
- https://openrouter.ai/collections/free-models
- https://artificialanalysis.ai/models/glm-5-3-flash
- https://openrouter.ai/z-ai/glm-5.3-flash
- https://benchlm.ai/google/api-pricing
- https://pecollective.com/tools/gemini-free-tier-guide/
- https://www.cloudzero.com/blog/gemini-pricing/
- https://www.morphllm.com/cerebras-pricing
- https://benchlm.ai/providers/sarvam
- https://aiproducts.in/blog/sarvam-ai-2026-what-indian-businesses-can-use/
- https://discuss.ai.google.dev/t/gemma-api-important-question-tos-does-this-violate-the-rules/137896
- https://openbenchmarks.com/inference/fastest-inference-provider

---

## 2026-10-15 (update): free stack, training on our data allowed

Edureka decided that letting providers train on our prompts is fine for now. That lifts the "no free tiers for student chats" rule until further notice.

### Free options worth using

| Role | Model / where | Free limit (third-party reports; check console) | Speed | Why |
|---|---|---|---|---|
| **Main Chotu brain** | Gemma 4 31B on the Gemini API (AI Studio key) | ~3,000 requests/day | Moderate; some reports of 500 errors | Best open model for Hindi on L3Cube-IndicQuest v2 (2026), and the same family as our on-phone Gemma 4. |
| **Indic accuracy / Telugu** | Gemini 3.1 Flash-Lite (same key) | 15 RPM, 500-1,000/day | Fast | Gemini leads the Telugu (TeluguEval 2026) and Indic knowledge benchmarks. |
| **Fast lane** | Groq gpt-oss-120b (current key) | 30 RPM, 1,000/day, but **200K tokens/day** and 8K tokens/min | ~500 tok/s, fastest | Instant replies. 2025 Hindi suite rated gpt-oss-120b the best large model. |
| **Hard questions** | NVIDIA Nemotron 3 Ultra, free on OpenRouter or build.nvidia.com | OpenRouter: 20 RPM, 50/day (1,000/day after a one-time $10 credit purchase). NVIDIA: 40 RPM | 300-400 tok/s at launch | Smartest free model: Artificial Analysis index ~48 vs Gemma 4 31B 39 and gpt-oss-120b 33. Hindi untested. |

Rough combined free capacity is ~5,000 requests/day, but Groq's 200K tokens/day cap limits that lane to ~300-500 chats. That's enough for a pilot, not for scale.

### Not worth it
- Gemini 3.5 Flash free: ~20 requests/day.
- Cerebras: no longer free ($5 trial credit only).
- Sarvam: ₹100 signup credit only; sarvam-m and sarvam-30b chat models are deprecated.
- Cloudflare Workers AI: 10K neurons/day shared across all models, which is tiny.
- OpenRouter's other free models (Laguna, Inkling, Dots): fine for drafting, but no reason to choose them over the four above.

### How to wire it
All four speak the OpenAI-compatible API. Set Chotu up with an ordered fallback list: Gemma 4 31B → Gemini 3.1 Flash-Lite → Groq gpt-oss-120b → Nemotron 3 Ultra. On a 429 or 5xx, move to the next one. Send short, quick-answer requests to Groq first. Test about 30 real prompts in Hindi, Telugu and English before going live.

Caveat: a Google forum reply says running a public production app on the free tier breaks Google's terms. It's fine for a pilot. Expect to move to the paid tier (or another route) at scale.

### Sources
- https://inferenceapis.com/reference/rate-limits
- https://klymentiev.com/blog/groq-pricing
- https://openrouter.ai/docs/api-reference/limits
- https://artificialanalysis.ai/articles/nvidia-nemotron-3-ultra-released
- https://yangmao.ai/en/providers/nvidia-build/free-tier/
- https://aiplug.work/en/blog/gemini-free-tier-limits
- https://www.memetik.ai/guides/gemini-api-free-tier-limits
- https://en.kocpc.com.tw/?p=3753
- https://arxiv.org/pdf/2608.15535
- https://aclanthology.org/2026.loreslm-1.20/
- https://arxiv.org/html/2508.19831v2
- https://docs.sarvam.ai/changelog
- https://costbench.com/software/llm-api-providers/cloudflare-workers-ai/free-plan/

---

## 2026-10-15 (update 2): route by the aspirant's chosen language

Edureka wants the newest, best model as the default (not Gemma for its own sake), and wants Chotu to route by the language each aspirant picks, so no single provider carries everything.

### What's newest right now
- **Gemini 4 Argon** (Google flagship, public 13 Oct 2026): **no free tier**. $2 / $10 until 30 Nov, then $4 / $20 from 1 Dec. It's the only Gemini 4 model so far. Source: ai.google.dev/gemini-api/docs/pricing
- **Gemini 3.8 Flash** is Google's newest and "most intelligent Flash", and **it is on the free tier**. Free daily quota isn't published. Third-party reports for recent Flash models range from ~20 to ~250 requests/day, so check AI Studio. Paid: $0.75 / $3.75, doubling on 1 Jan 2027.
- Gemini 3.5 Flash-Lite is the newest Flash-Lite (free tier).
- Top open-weight models (Artificial Analysis, Oct 2026): MiMo-V2.6-Pro 46, GLM-5.3 45, Kimi K3 44. **None is free** (MiMo-V2.6-Pro is $0.43 / $0.87 on OpenRouter). Nemotron 3 Ultra is the strongest free open model (scored ~48 at its June launch, on an earlier index version).
- The overall leaders are Claude Opus 5.5 / Sonnet 5.5, which are paid only.

### Routing plan (all free)

| Aspirant picks | Primary | Fallback (on 429/5xx) | Provider load | Why |
|---|---|---|---|---|
| **English** | Nemotron 3 Ultra (NVIDIA build or OpenRouter free) | Groq gpt-oss-120b | NVIDIA / OpenRouter / Groq | Smartest free model, 300-400 tok/s. Groq for speed when it's busy. |
| **हिन्दी** | Gemini 3.8 Flash (free) | Gemma 4 31B (Google, ~3,000/day) | Google, two separate model quotas | Newest Gemini for quality. Gemma 4 31B is the best open model on Hindi (IndicQuest v2), so it's a strong backstop with a big quota. |
| **తెలుగు** | Gemini 3.8 Flash (free) | Gemini 3.5 Flash-Lite | Google | Telugu is where English-first models fall apart (TeluguEval 2026). Gemini holds up. |

Notes:
- If Gemini 3.8 Flash's free quota turns out tiny (~20/day), make Gemma 4 31B the Hindi primary and keep 3.8 Flash for Telugu only.
- **Upgrade path, once there's budget:** Gemini 4 Argon as primary for all three, or for Telugu only, since that's where it adds the most. Lock prices before 1 Dec.
- Paid Indic alternative: Sarvam 105B (open, Apache 2.0, ₹29 / ₹73). Its Indic win rates are self-reported, and it scores 18 on Artificial Analysis.
- Keep the router config as a simple table (language → ordered model list), so the weekly check can swap one lane without touching the others.

### Sources
- https://ai.google.dev/gemini-api/docs/pricing
- https://artificialanalysis.ai/leaderboards/models
- https://blog.margrop.net/en/post/aa-intelligence-index-october-2026-leaderboard-deep-dive-and-model-selection-guide/
- https://openrouter.ai/xiaomi/mimo-v2.6-pro
- https://artificialanalysis.ai/articles/sarvam-105b-Sarvam-30b-everything-you-need-to-know
- https://aclanthology.org/2026.loreslm-1.20/
- https://arxiv.org/pdf/2608.15535

---

## 2026-10-15 (update 3): live tests with the owner's keys

These are one-question tests on Article 200 in English, Hindi and Telugu, through NVIDIA's free API. Google couldn't be called from the cloud session, but the key is valid: its model list includes gemini-3.8-flash and gemini-4-argon.

| Model (NVIDIA free) | English | Hindi | Telugu | Speed |
|---|---|---|---|---|
| Nemotron 3 Ultra | correct | correct | **broken**: mixes in Hindi, Korean and other scripts, and has wrong words | 5-14 s |
| Kimi K3 | correct | correct | **correct, natural** | ~50 s |
| GLM-5.3 Flash | correct | correct | correct | 30-57 s |
| GLM-5.3 | spends its whole budget on reasoning, so it returns empty or times out | | | 60 s+ |
| Gemma 4 31B | timed out | timed out | correct | ~55 s |
| Nemotron 3.5 Lightning | correct | correct | empty | ~10 s |
| DeepSeek V4.1 Flash | timed out | | | |

NVIDIA's free API also hosts Kimi K3, GLM-5.3 and DeepSeek V4.1 Flash. That's not in the OpenRouter free list, but most of them are too slow there for chat.

The code is now built with the routes in server/src/ai.ts (CHAT_ROUTES):
- English: Nemotron 3 Ultra → Groq gpt-oss-120b → gpt-oss-20b
- Hindi: Gemini 3.8 Flash → Nemotron 3 Ultra → Gemma 4 31B → Groq gpt-oss-120b
- Telugu: Gemini 3.8 Flash → Gemini 3.5 Flash-Lite → Gemma 4 31B → Kimi K3 (slow, last resort)

---

## 2026-10-19: weekly check

**Verdict: nothing beats a live lane yet, and no free tier we rely on shrank.** These are the live routes being checked (version 33fcc18c):
- English: Nemotron 3 Ultra (NVIDIA), then Groq Qwen 3.8 27B, then gpt-oss-120b, then gpt-oss-20b.
- Hindi and Telugu: Gemini first. Gemini returns 402 until billing is on, so Hindi is answered by Nemotron 3 Ultra and Telugu by NVIDIA Gemma 4 31B. If those fail, the Telugu answer comes in English.

### New this week
| Model | What it is | Free for us? | Lane impact |
|---|---|---|---|
| **Nemotron 3.5 Super VL** (NVIDIA, 15 Oct) | 120B MoE, 12B active, multimodal, 1M context | **Yes**, on NVIDIA build (`nvidia/nemotron-3.5-super-vl-120b-a12b`) and OpenRouter `:free` | Newer than Ultra but smaller, so it's unlikely to beat Ultra for English. Its Telugu is untested. A live test is queued on the owner's PC, which is offline right now. |
| **Muse Spark Open** (Meta, 15 Oct) | 816B MoE, 42B active, open weights, about 350 tok/s on Groq | **No.** Groq lists it as a limited "Enterprise" preview where you contact sales. | If Groq opens it to the free tier, it would be the best new candidate for the English fallback. Watch it. |
| **DeepSeek V4.1 Flash 1017** (17 Oct, MIT) | Minor update to V4.1 Flash, with better reasoning and shorter outputs | No provider serves it yet. NVIDIA still has the September V4.1 Flash, which timed out in our tests. | None for now. |
| **Mistral Large 4** (preview since 6 Oct) | About 1T params, 49B active | **No.** It's paid at $0.68 / $2.09, and free keys get "not available in your tier". Open weights are due around 31 Oct. | None. |
| **Beam** (Reflection, 16 Oct, Apache 2.0) | 501B MoE | No hosted free endpoint | None. |
| **Xing4.0-29B-A4B** (China Telecom, 16 Oct) | Small MoE, OpenRouter `:free` | Yes | Too small to compete with Ultra. No Indic evidence. |

### Unchanged
- **Gemini:** there is still no Gemini 4 Flash, only an unconfirmed SDK reference. Manifold puts it at about 29% by 13 Nov. Gemini 4 Argon is still paid-only. Gemini 3.8 Flash and 3.5 Flash-Lite are still on the free tier. The Gemini *app* (not the API) moved its free plan to Flash-Lite-only on 9 Oct, which doesn't affect us.
- **Groq:** no announced limit changes. Samples are still 30 RPM and 1,000 RPD for gpt-oss-120b and Qwen 3.8 27B.
- **GLM, Kimi, Qwen and MiMo:** nothing new since GLM-5.3 Fast (7 Oct). MiMo-V2.6-Pro is still the top open model and is still paid.
- **Sarvam:** only Saaras V4, a speech-to-text model (late Sept). No new LLM.
- **NVIDIA catalog:** 81 models. `moonshotai/kimi-k3` is no longer in the public list (only k2.6). It isn't in any live route, so it doesn't affect us.

### Sources
- https://console.groq.com/docs/model/meta-models/muse-spark-open
- https://www.tun.com/home/meta-muse-spark-open-is-now-on-groqcloud-free-for-devs/
- https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017
- https://openrouter.ai/api/v1/models (free list pulled 19 Oct)
- https://integrate.api.nvidia.com/v1/models (pulled 19 Oct)
- https://www.aifreeapi.com/en/posts/mistral-api-free-tier
- https://manifold.markets/Terminator2/will-google-release-a-model-officia
- https://dev.to/felipe0liveira/open-weights-go-frontier-class-a-501b-base-model-a-816b-meta-moe-and-gemini-4-argon-land-in-one-4b3b
