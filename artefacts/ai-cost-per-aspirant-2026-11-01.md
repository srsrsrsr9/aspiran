# AI cost per full-time aspirant: a calculated guess

1 November 2026. **A guess, not a quote.** It's meant to guide the price, not to set a budget.

## Answer first

- **Text AI is cheap.** Chat, explanations and marking cost about **₹200 to ₹450 a month** for a heavy user, even
  when marking uses a strong model.
- **Live two-way voice ("duplex", like a phone call with Chotu) is the only thing that can break the price.** Ten
  minutes a day costs between **₹600 and ₹3,600 a month**, depending on the provider.
- **₹9,999 a year works**, if live voice is capped outside the interview phase. Use cheaper "press to talk" voice for
  daily practice.
- **₹999 for the first 300 loses money.** We keep about ₹830 of it, so a heavy user on the recommended setup costs
  us ₹4,000 to ₹7,500 a year more than they pay. Treat it as a marketing cost: about ₹2.5 to ₹6 lakh in the first
  year if most of the 300 are average users, and up to ₹23 lakh if all are heavy.

## Assumptions

- **Exchange rate:** ₹88 to the US dollar.
- **The user:** a full-time aspirant, 8 hours a day, 30 days a month, using everything. The *average* paying user
  will use perhaps a third of this.
- **Claude prices** (Anthropic's list, per million tokens):
  - Sonnet 5.5: $2 in, $10 out; cached input $0.20.
  - Haiku 5.5: $0.10 in, $0.50 out.
  - The Batch API halves prices but answers within hours, so it suits content checks, not live marking.
- **Other prices** (DeepSeek, Gemini, Groq, voice providers) are my rough figures. **Check them before deciding.**
- **The app today** uses free tiers (Groq, Gemini, NVIDIA). Those won't last at thousands of users, so this note
  prices paid use.
- **Shared content** (Chai cards, notes, audio, PYQ explanations) is made once for everyone, so its cost per user is
  close to zero.

## One heavy user, one month

| What | How much | Strong model (Sonnet 5.5) | Cheap model (Haiku 5.5 / DeepSeek class) |
|---|---|---|---|
| **Chotu text chat** | 20 turns a day; about 3,000 tokens (roughly 2,000 words) of context in and 250 out per turn (most input cached) | ₹250 | ₹25 |
| **Answer marking** (photo of a handwritten answer → mark → check the rewrite) | 45 answers a month, two passes each | ₹140 | ₹15 (not good enough; see below) |
| **Essay three snaps** | 4 essays a month, 3 photos each, plus feedback | ₹20 | ₹3 |
| **OCR for photographed notes** (a separate reader for Devanagari, if needed) | 100 pages | ₹15 | ₹15 |
| **Dictation** (speech to text for notes) | 15 minutes a day | ₹25 to ₹240 depending on provider | same |
| **Live two-way voice** (talk to Chotu like a call) | 10 minutes a day | ₹600 (cheap tier, about ₹2 a minute) to ₹3,600 (premium, about ₹12 a minute) | same |
| **"Press to talk" voice** (speech to text, then a text model, then text to speech) | 10 minutes a day | about ₹150 to ₹300 | about ₹60 to ₹150 |

### Totals per month

| Setup | Month | Year |
|---|---|---|
| **Lean**: cheap chat, Sonnet marking, no live voice | about ₹200 to ₹450 | ₹2,400 to ₹5,400 |
| **Recommended**: cheap chat, Sonnet marking, press-to-talk voice, live voice capped at 1 hour a month (cheap tier) | about ₹400 to ₹700 | ₹4,800 to ₹8,400 |
| **Uncapped**: everything, live voice 10 minutes a day | ₹800 to ₹4,000 | ₹10,000 to ₹48,000 |

## What we actually keep from ₹9,999

| Route | After GST (18%) | After fees | Left per year |
|---|---|---|---|
| Website (Cashfree, about 2%) | ₹8,474 | about ₹170 | **about ₹8,300** |
| Google Play subscription (15% fee) | ₹8,474 | about ₹1,270 | **about ₹7,200** |

So the **recommended setup** fits within the Play price even for a heavy user, and an average user (a third of the
heavy figures) leaves a healthy margin for servers, editors and support.

## What this means for the product

1. **Use a strong model for marking.** It's only ₹140 a month and it's the product's core. Cheap models misread
   handwriting and give vague feedback. Test the Hindi marking on Devanagari before choosing.
2. **Use a cheap, fast model for everyday chat.** The website already does this (Groq first).
3. **Press-to-talk voice by default; live voice as a treat.** For example, Plus includes 60 minutes of live voice a
   month, and **unlimited during the interview phase** (few people, high value).
4. **Free users:** cheap model only, a daily chat cap (like the website's 15 replies), 2 marked answers a week.
   That costs under ₹30 a month per free user.
5. **Batch the content checks.** AI-vets-AI on new content runs overnight at half price.
6. **Log real usage from day one** (tokens and minutes per user, per feature) and redo this note after the first
   month of Plus users. Real behaviour will beat this guess.
