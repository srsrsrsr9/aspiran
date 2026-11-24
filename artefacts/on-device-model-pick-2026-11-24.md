# On-phone Chotu: which model (24 Nov 2026)

**Pick: keep Gemma 4 E2B ("Chotu Standard") for phones with 6 GB.** Gemma 4 E4B ("Chotu Large") stays for phones with
8 GB or more, as the app does now. No change to the Android app is needed for this.

## Important: these scores are from published results, not our test set

I could not run our 303-case Chotu test set (`content/eval/chotu/`) here. This Mac has no model runner (no Ollama,
llama.cpp or MLX) and no model files (`server/models/` holds only a README). Running the set means downloading
several GB per model. So the pick below is made from published numbers and what we know about the app. **Before Plus
launches, run the set on a real 6 GB Android phone** (steps at the end). If the result disagrees with this note, the
test set wins.

The test set's own checker works: `python3 tools/chotu_eval.py selftest` scored 30 of 30 sample replies as expected today.

## The candidates that fit a 6 GB phone

On a 6 GB phone, Android and other apps already use about 3 GB, so the model has to run in about 2.5 to 3 GB.

| Model | Size that runs on the phone | What's published | Fit for Chotu |
|---|---|---|---|
| **Gemma 4 E2B** (current) | 2.3B "effective" (5.1B with lookup tables that don't all need memory at once); fits in about 3 GB | Multilingual test (MMMLU) about 60 to 67%, general knowledge (MMLU-Pro) 60%. Trained on 140+ languages, made for phones. | **Best fit.** Runs through Google's phone runtime (LiteRT-LM), which the app already uses. Hindi is good; Telugu is weaker but usable. |
| Gemma 4 E4B | 4.5B effective; needs about 5 GB free | MMMLU about 69 to 77%, MMLU-Pro 69% | Clearly better, but too big for a 6 GB phone. Keep it for 8 GB phones (the app's 7.5 GB rule). |
| Qwen3.5-2B | 2B; about 4 GB suggested | Released Mar 2026. Strong on English reasoning tests, but no non-English scores published. A ranking site reports high made-up-answer rates for this family on its "does it know" test (about 80% for the 4B). | Worth a test, not a switch. A phone build (LiteRT) exists, but the app runs only Gemma today, so switching means real Android work. Made-up facts are the worst failure for Chotu. |
| Qwen3.5-4B | 4B; about 8 GB suggested | MMLU-Pro 79 (maker's own number) | Too big for 6 GB. |
| Older small models (Llama 3.2 3B, Phi-4-mini, Gemma 3n) | | Older and weaker in Hindi than Gemma 4 | No reason to move. |

Notes on the numbers: Google's two pages give different MMMLU figures for the same models, so treat these as
rough. Nobody publishes Hindi- or Telugu-only scores for these models.

## Why Gemma 4 E2B

1. **It fits.** It is the only strong candidate that runs comfortably in the memory a 6 GB phone has left.
2. **Languages.** Chotu's test set is 46% English, 39% Hindi and 16% Telugu. Gemma 4 is trained for 140+
   languages, and Qwen publishes nothing on Hindi or Telugu.
3. **Facts.** Chotu must use the app's numbers exactly and say when a note doesn't cover something. The reported
   high made-up-answer rate for small Qwen models is a risk we can't take without testing.
4. **Already built.** The app downloads, checks and runs Gemma 4 through LiteRT-LM today. Any other model needs new
   Android work.
5. **Safety does not depend on the model.** Distress, quiet hours, ranks and feelings are handled by the app's own
   checks before any model is asked, so a small model can't get those wrong.

## What to watch with E2B

- Telugu answers: the 47 Telugu cases all need a native reader anyway (`review: "needs native review"`).
- Markers (`[JEETU]`, `[CARE]`, `[PERSON]`, `[UNSURE]`): small models forget them. The app already treats a missing
  marker safely (no button), and the care path never relies on the model.
- Numbers: the "numbers from input only" check is the one to look at first in the results.

## How to run the test set on a phone (for the owner or a later session)

From `content/eval/chotu/`:

```bash
python3 tools/chotu_eval.py prompts > prompts.jsonl
```

Run each line through Gemma 4 E2B on a 6 GB phone (system plus user, at the setting we ship), save one
`{"id": "...", "reply": "..."}` per line as `replies-gemma4-e2b.jsonl`, then:

```bash
python3 tools/chotu_eval.py score replies-gemma4-e2b.jsonl --out results-gemma4-e2b.jsonl
```

Do the same for Qwen3.5-2B if we want a second opinion. A model that scores below about 80% on English and Hindi,
or that changes numbers in more than a few cases, should not ship as Chotu.

## Sources

- [Gemma 4 E2B model card (Hugging Face)](https://huggingface.co/google/gemma-4-E2B)
- [Gemma 4 E4B instruction model card](https://huggingface.co/google/gemma-4-E4B-IT)
- [Gemma 4 model card (Google)](https://ai.google.dev/gemma/docs/core/model_card_4)
- [Gemma 4 (Google DeepMind)](https://deepmind.google/models/gemma/gemma-4/)
- [Qwen 3.5 small models (NYU Shanghai RITS)](https://rits.shanghai.nyu.edu/ai/qwen-3-5-small-models-9b-parameters-that-beat-120b/)
- [Qwen3.5 small models (Artificial Analysis)](https://artificialanalysis.ai/es/articles/qwen3-5-small-models)
- [Qwen3.5-2B phone build (LiteRT community)](https://huggingface.co/litert-community/Qwen3.5-2B)
