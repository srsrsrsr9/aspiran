# AI spending: owner decisions, 22 Nov 2026

## Decided
1. **Budget:** about $15 per Plus student per year for model use. Never shown to students. Use above it is
   limited quietly. The real figure is revisited once there is usage data.
2. **Chotu on the phone is for Plus only.** Students are never told which model answers or where it runs, so the
   model can change later (a model fine-tuned for UPSC, for example).
3. **Phones too weak for the on-device model:** Plus members get the option anyway and work it out themselves.
4. **Daily study profile for Plus.** A large model updates each Plus student's profile every day, and the profile
   feeds the on-device Chotu. Costs get checked against real usage. Quality comes first for Plus.
5. **Chotu chats may come to our server** to help us help students. There is no "chats never leave the phone"
   promise, and no profile deletion button. Data is handled responsibly. Memory can live on the phone and on
   our side. The architecture is to be discussed separately.
6. **Jeetu uses high-quality online models only** and is for Plus.
7. **Free users and visitors get limited online AI** (Groq, OpenRouter and similar), counted as a marketing cost.
   Use is cut off for people abusing it. To be reviewed later.
8. **Groq is now paid, and its spend is watched separately** (runbook: `groq-paid-runbook-2026-11-22.md`).
9. **The on-device model will be chosen for quality, not just size.** The owner is researching it.

## Done on 22 Nov 2026
- Every model call is now logged with its group (visitor, free, plus, pod, institute, team), its provider and an
  estimated cost.
- Groq takes a separate key per group: `GROQ_API_KEY_FREE` (visitors, free members, pods) and `GROQ_API_KEY_PLUS`.
  A group without its own key falls back to `GROQ_API_KEY`.
- Admin → Helpers and usage shows this month's Groq spend by group, with the marketing total.
- The Android Chotu screen no longer says chats never leave the phone. This takes effect in the next Android build.

## Open, for the architecture discussion
- **Consent before chats are uploaded.** The current app tells users their chats stay on the phone, and cloud
  chats "aren't saved". Under India's DPDP Act, uploading or keeping chats needs a clear notice and consent first,
  plus an updated privacy policy. That change has to ship before any chat is uploaded.
- **Choosing the on-device model:** owner's research. Things to check: Hindi and Telugu quality, factual
  slips on UPSC topics, speed on a 6 GB phone, and how long a profile it can read.
- **Where the hidden $15 limit sits:** monthly or yearly, and the fallback order (cheaper model, then on-device).
- **Abuse signals for free users:** volume, scripted use, many accounts, off-topic use.

## Cost notes (Groq list prices per million tokens, 22 Nov 2026)
- Qwen 3.8 27B: $0.80 in, $4.00 out. It is Chotu's **first** choice in every language.
- gpt-oss-120b: $0.15 in, $0.60 out. That's about 5–7 times cheaper, and the owner's 15 Nov live test rated its
  Hindi and Telugu well.
- Llama 4 Scout (an answer-review fallback) no longer appears in Groq's model list. It is probably retired and
  should be checked.
