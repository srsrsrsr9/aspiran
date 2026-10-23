# 03 · Today Screen and Chai Cards: design research and build rules

*Slice owner: Today screen + Chai Cards (first build slice). Compiled 10 October 2026. Android-native (Kotlin + Jetpack Compose), bilingual Hindi + English, low-end Android.*

**How to read this.** Each topic has three parts: **(a) Principles** with sources, **(b) Implications** for *our* aspirants, and **(c) Build rules** numbered `T-xx` (Today) or `C-xx` (Chai Cards) so engineering and QA can point at them. Claims carry a source URL or are marked **[Inference]**. Each major rule names the persona(s) from the brief it mainly serves: **Arjun** (Hindi-medium, small-town, family money), **Meera** (urban English-medium, attempt 2, comparison), **Rahul** (working professional, 2-4 h/day), **Sana** (woman aspirant, extra social load), **Vikram** (repeater, attempt 4-6, identity fatigue), **Kavya** (online-only, Tier-3, misses "hub knowledge").

**Who we are designing for (stated once, applied everywhere).** People mostly in their 20s, on a multi-year grind, studying alone in a Delhi hub PG or back home. They carry loneliness, shame, fear of failure and family pressure, with money and age limits running out. Many are Hindi-medium or bilingual, on mid- or low-end Android with patchy data. 21:00-23:30 is the guilt-spiral window. After years of coaching marketing they distrust hype, and they bond over dark humour about aspirant life. A generic "engagement" app would design against them; this one has to design *for* them.

---

## 0. Executive summary (the 12 decisions)

1. **Today is a finite checklist, not a feed.** At most three tasks, one of which is "Today's Chai" (5 cards), ending in a real "done for today" state. (Hick's law, calm tech, news-fatigue data.)
2. **Vertical scroll inside a finite stack, with tap controls.** Not Tinder swipes or Inshorts-style infinite swiping. Swipe is an optional shortcut and is never required (WCAG 2.5.1).
3. **5 Chai Cards a day, 60-90 words each, about 6-8 minutes in total.** Every card has the same 6 zones, so the eye learns where to look (consistency heuristic, F/layer-cake scanning).
4. **The UPSC lens is the hero, not the news.** Each card leads with "Why this matters for UPSC" chips: GS paper, syllabus topic, Prelims/Mains, and a link to the static topic. This is what separates us from Inshorts and Google News.
5. **Exam Corner facts come only from a verified database.** Questions and PYQ links are drawn from human-checked stores; the AI never invents a PYQ. Editorial review is shown as a visible "Checked by" stamp.
6. **AI labelling is honest, specific and placed at the card foot**, saying what the AI did, why, and who checked it. Generic "AI-generated" badges fail (Trusting News 2025).
7. **The countdown is hidden by default** and becomes an opt-in, neutral "weeks to Prelims" chip in My Path. It never sits in the Today header.
8. **The streak is private, forgiving and small.** It lives in the Close the Day sheet, not as a fire emoji in the header.
9. **The home screen adapts to time of day.** Morning shows the tasks plus Chai. After 20:00 the Close the Day card rises to the top. After 23:00 there is a "sleep is part of prep" variant.
10. **Bilingual by medium preference, not side-by-side.** One language per card, a one-tap per-card switch, and Hindi in simple Hindustani, not Sanskritised *sarkari* Hindi.
11. **Chotu jokes only on stories tagged LIGHT by a human,** never on SERIOUS or TRAGIC ones, and never at the expense of the reader's situation.
12. **Measure finished days, not minutes.** North star: "days closed" and "Chai stacks finished". Avoid time-in-app, scroll depth and DAU/MAU as goals.

---

## 1. Today: home/dashboard design for a daily-habit app

### 1(a) Principles

- **Scanning.** NN/g's eyetracking (2006, re-confirmed in 2017 on desktop *and mobile*) shows users default to an F-pattern when nothing guides the eye. Other patterns include **layer-cake** (reading only headings) and **spotted** (hunting for a number or link). The fixes are to front-load key words, make headings that start with information-bearing words, and group related items visually. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- **Progressive disclosure.** "The very fact that something appears on the initial display tells users that it's important." Keep the initial display short, make the path to more obvious, and limit depth to about two levels. https://www.nngroup.com/articles/progressive-disclosure/
- **Hick's law.** Decision time grows with the number and complexity of choices (log₂(n+1)). https://en.wikipedia.org/wiki/Hick%27s_law; NN/g applies it to menus: https://www.nngroup.com/videos/hicks-law-long-menus/
- **Working memory (Miller → Cowan).** Miller's "7±2" is often over-applied; later work puts usable working memory nearer 4 chunks. That is the reason for capping visible tasks at 3 and visible modules at about 4. [Inference, from the well-known Cowan 2001 revision.]
- **Cognitive load (Sweller).** Reduce *extraneous* load (layout noise, decisions) so the *intrinsic* load (understanding federalism) gets the brain. [Inference, standard CLT framing.]
- **Duolingo's path redesign** moved to "a clear path to follow" because learners weren't sure they were using the app "the 'correct' or 'best' way". Practice is built into the path, so users don't decide when to review. https://blog.duolingo.com/new-duolingo-home-screen-design/
- **Calm technology** principles: "Require the smallest possible amount of attention", "Inform and create calm", "Make use of the periphery". https://calmtech.institute/calm-tech-principles
- **Empty states** should communicate system status, teach, and offer a direct path to action. https://www.nngroup.com/videos/empty-states-in-application-design-guidelines/
- **Streaks cut both ways.** Silverman & Barasch (*Journal of Consumer Research*, 2023) found streaks motivate, but **broken streaks reduce motivation** to continue (about 66% vs about 58% continued in one study), and people pay costs to "repair" them. https://www.psychologytoday.com/us/blog/ulterior-motives/202306/how-broken-streaks-sap-motivation
- **Fear-based countdowns.** The brief explicitly lists "countdown banners ('only 227 days left!')" under *Avoid* (brief §4.1) and "no countdown scarcity" (§ Visual direction).
- **The Finch critique** (Pratt IXD, 2025): the home screen's shop, journeys, community and premium prompts "compete with the core daily checklist", widening the gulf of execution. https://ixd.prattsi.org/2025/09/design-critique-finch-ios-app-2/

### 1(b) Implications for our users

- The brief's mockup header ("Good morning, Meera ☀️ 🔥12 · 227 days to Prelims 2027") puts **two anxiety objects** in the most-fixated spot on the screen, the first line of the F. For **Vikram** (attempt 5) a day count is a reminder of age limits. For **Meera** a 🔥 number invites comparison the moment she screenshots it. **Recommendation: remove both from the header.** [Inference grounded in brief §4.1 and §4.7]
- Aspirants already live in a resource-overload trap (brief §4.3). A home screen with eight modules recreates the coaching-site sidebar. Three tasks is the antidote: no decision about *what* to do, only *whether* to start.
- **Rahul** opens the app at 07:10 on a bus and at 22:30 after work. The first screen must be finishable in his two windows, so the three tasks should sum to 30-45 minutes, with Chai alone at 6-8 minutes.
- The emotional peak is at night (brief §3.3: 21:00 call home, 23:30 guilt spiral). The home screen should change *what is on top* by time of day, so the right ritual is one tap away.

### 1(c) Build rules: Today

| # | Rule | Persona |
|---|---|---|
| **T-01** | **Fixed vertical order (morning):** Greeting line → Today's 3 (with Chai as one of the 3) → Pod strip → Live room (only if one is live) → Close the Day (collapsed). At most 4 blocks above the bottom nav on a 360×640 dp screen without scrolling past the tasks. | All; Rahul especially |
| **T-02** | **Exactly 3 tasks.** Default set: ① Today's Chai (5 cards, ~7 min) ② 5 Prelims questions (~5 min) ③ 1 Mains answer, 150 words (~20 min). Users can *swap* a task (one tap, from a 3-item list) but cannot add a 4th. Rahul's "part-time" mode swaps ③ for "1 Mains outline (5 min)". | Rahul, Arjun |
| **T-03** | Each task row is a single tap target (≥48 dp tall; Android guidance https://support.google.com/accessibility/android/answer/7101858) showing a **verb-first label + time estimate + state**. No secondary buttons on the row. | All |
| **T-04** | **Progress as fraction, not percentage.** "1 of 3 done", with a calm segmented bar in the accent colour. No red, ever. | Meera, Vikram |
| **T-05** | **No countdown in Today by default.** My Path offers an opt-in "Show Prelims countdown on Today", shown as **weeks** ("31 weeks to Prelims") in the neutral text colour, with a hide control in the chip menu. Automatically suppressed on result days and for 14 days after a Prelims non-qualification. | Vikram, Arjun |
| **T-06** | **No streak in the header.** The streak appears inside the Close the Day sheet as "Days you showed up this month: 18". It is a **monthly count, not a consecutive chain**, so one missed day doesn't zero it (counters the broken-streak effect). Optional, opt-in "freeze" days (2/month) for illness, family events and travel. | Vikram, Sana, Meera |
| **T-07** | **Time-of-day adaptive top slot** (device local time): 05:00-11:59 tasks first; 12:00-19:59 tasks first with the pod strip promoted if the pod has new activity; **20:00-02:00 the Close the Day card moves to position 1** and expands; 23:00-02:00 it adds a sleep line (see §7). Tasks are never hidden, only reordered. | All; Arjun and Vikram at night |
| **T-08** | **Completed state** when 3/3 are done: the task block collapses into one line ("Today's 3: done ✓") and a calm "You're done for today" panel appears with exactly two optional actions: *Close the day* and *Join a room*. No "Do more!" suggestions or extra quizzes. | Meera (over-doer), Arjun |
| **T-09** | **Partial-day framing at night:** if 1/3 or 2/3 are done at 20:00+, show "2 of 3 is a real day" and move the unfinished task to "carry to tomorrow?" (one tap). Never "You missed…" | Vikram, Rahul |
| **T-10** | **Pod strip = presence, not performance:** avatars + one line ("Aman posted an answer · 9:12"). No counts of who finished. The "Nudge" button sends a pre-written friendly ping, max 1 per day per pod. | Kavya, Meera |
| **T-11** | **No upsell surface on Today**, matching the brief's rules. The only commercial line in the app lives in Practice feedback. | All |
| **T-12** | The greeting **uses the user's chosen name and plain words**, with an emoji only in the morning variant. The greeting is not a link (avoids a dead tap target). | All |

---

## 2. Competitive teardown: card and home UX

Ratings are qualitative. Items without a URL are based on product observation and marked [Inference].

| Product | What it does well (steal) | What to avoid | Source |
|---|---|---|---|
| **Inshorts** | ~60 words per story. The CEO's rationale: readers decide in two sentences of 20-30 words. Headline and image are scanned first. Ruthless brevity suits Rahul's bus ride. | Infinite stream of 70-120 stories a day; no "done" point; general news with no exam lens; swipe-only navigation. | https://www.exchange4media.com/digital-news/news-in-shorts-cuts-the-clutter-for-the-new-generation-news-reader-60818.html |
| **Google News / Discover** | Per-card controls ("more/less like this") give users agency; source logo on every card. | Algorithmic, endless and engagement-optimised; clickbait headlines leak in. [Inference] | https://www.androidcentral.com/apps-software/google-news-customizable-following-feed |
| **Apple News (Today)** | Human-curated "Top Stories" with a visible editorial voice; a clear masthead per story. [Inference] | Still a feed with no end state; paywalled cards mixed in. [Inference] | — |
| **Axios Smart Brevity** | A fixed "atomic unit" (headline + 2 short paragraphs, the second introduced by a bold axiom such as **"Why it matters"**), rotating axioms ("By the numbers", "The other side"). Designed for a ~26-second read. | US news voice; the punchy tone can feel glib on tragic stories. | https://journalism.co.uk/news/how-axios-is-reinventing-text-journalism-with-smart-brevity-/s2/a966845 |
| **Morning Brew** | Friendly, witty voice that makes dry business news feel human; a finite daily email. | Puns on serious stories; heavy ads. [Inference] | https://voices.media/thursday-15th-september-why-tone-of-voice-is-vital-to-morning-brews-newsletter-success/ |
| **The Hindu / Indian Express (UPSC use)** | The Hindu is called the "bible" by aspirants; IE's "Explained" simplifies complex policy and is "more reader-friendly… suits beginners". Steal the **explainer shape**. | Long, dense, not mapped to the syllabus; aspirants must do the mapping themselves. | https://www.pw.live/exams/upsc/best-newspaper-for-upsc-exam/ |
| **Drishti IAS daily news** | "Bulletised and tagged" items; EN/हिंदी toggle (crucial for Arjun). | Pages heavy with course banners, test-series promos and "Pay Now" links: exactly the coaching-ad feel our users distrust. | https://www.drishtiias.com/daily-news-analysis |
| **Anantam / Vision-style daily digests** | Strong template: "Why in News?" → **UPSC Relevance box (GS paper, sub-topic, Prelims keywords, Mains themes)** → body → PYQ/practice. | 25-35 min for 4 items (6-9 min each). Too long for a daily habit; it reads like a PDF chapter. | https://anantamias.com/current-affairs/18-may-2026/ ; https://visionias.in/blog/current-affairs/introducing-vision-ias-digital-current-affairs-2-smarter-faster-more-personalized |
| **SuperKalam** | Daily analysis framed around "Linkage with GS subjects", "Key highlights", "Key concepts", plus daily MCQs. Free. | Daily leaderboard (per brief §Devil's advocate); AI-mentor positioning may over-promise. | https://superkalam.com/current-affairs/daily-news-analysis |
| **InsightsIAS, Unacademy, Testbook, PW Only IAS** | Daily quiz habit; Hindi-medium batches; PYQ banks with year tags. [Inference] | Live-class funnels, red "LIVE" urgency, discount countdowns, rank lists. [Inference] | — |
| **Duolingo home** | One clear path, practice built into the path, no "what should I do?" decision. | Streak anxiety mechanics, guilt notifications, leagues. | https://blog.duolingo.com/new-duolingo-home-screen-design/ |
| **Headspace Today** | A single daily session framed by time of day; calm visual language. [Inference, product observation] | Upsell gates on many sessions. [Inference] | — |
| **Finch** | Small daily tasks; gentle, encouraging feedback ("Your Finch feels calmer"). A low-stakes mascot model for Chotu. | Home clutter (shop, journeys, premium) competes with the checklist; core wellness behind a paywall. | https://ixd.prattsi.org/2025/09/design-critique-finch-ios-app-2/ |

**Synthesis: what Chai Cards should be.** *Inshorts length × Axios structure × Anantam's UPSC Relevance box × Duolingo's finite path × Finch's gentleness, minus every coaching-site banner.* [Inference]

---

## 3. Chai Card anatomy

### 3(a) Principles

- **Mobile comprehension costs more.** On a phone-sized screen, comprehension of difficult text fell to about 48% of desktop (Cloze 18.9% vs 39.2%). The 2016 follow-up found short, simple text is understood equally well on both. Recommendation: shorten, and move secondary information out of the way. https://www.nngroup.com/articles/mobile-content-is-twice-as-difficult-2011/
- **Front-loading and fixed structure** support F and layer-cake scanning (NN/g, above). Axios's fixed axioms teach readers where meaning lives (journalism.co.uk, above).
- **Carousels and swipe.** Users "rarely click through the slides of carousels". Advancement shows "exponential rate of decay" unless the carousel is tied to the user's task. Swipes overshoot; provide prev/next buttons, a partial peek of the next item, and no auto-advance. https://www.smashingmagazine.com/2022/04/designing-better-carousel-ux
- **WCAG 2.2 SC 2.5.1 Pointer Gestures:** any path-based gesture (swipe) must also be operable "with a single pointer without a path-based gesture". This protects people with motor impairments and people with cognitive disabilities who "may not discover or remember custom gestures". https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures
- **Collapsed sections** are a "safe" pattern if used consistently with clear titles. Content behind a sub-page gets missed by a subgroup of users who assume the main page is everything. https://baymard.com/research-articles/avoid-using-subpages
- **Retrieval practice and spacing.** Testing beats re-reading for long-term retention (Roediger & Karpicke 2006, *Psychological Science*, https://doi.org/10.1111/j.1467-9280.2006.01693.x). The optimal gap between reviews grows with the retention interval (Cepeda et al. 2006 meta-analysis, 317 experiments, https://pubmed.ncbi.nlm.nih.gov/16719566/).
- **News fatigue.** 40% of people across markets sometimes or often avoid news (DNR 2025), and under-35s more often find news hard to follow. https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary. In 2024, 39% felt "worn out" by the amount of news, up from 28% in 2019. https://pressgazette.co.uk/media-audience-and-business-data/news-avoidance-at-record-levels-as-four-in-ten-worn-out-by-news/
- **India-specific.** The DNR 2025 India sample (English-speaking, online, not nationally representative) relies on YouTube (55%) and WhatsApp (46%) for news. 53% name WhatsApp as the biggest misinformation threat, the highest of any market, and there is a "strong preference for smartphones". https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/india

### 3(b) Implications

- **Finite beats infinite for this audience.** Aspirants carry a "have I read enough?" anxiety (brief §4.2-4.3). An endless feed turns that into a bottomless pit; a finite stack of 5 turns it into a completable task. Five cards × about 80 words is about 400 words, roughly 2 minutes of raw reading plus lens chips and one question each, for **6-8 minutes**. [Inference: arithmetic at ~200 wpm for second-language readers]
- **The lens is the value; the news is the trigger.** Inshorts and Google already give everyone the news. Our differentiator, for **Kavya** especially, is the "corridor knowledge" a Mukherjee Nagar senior gives you for free: *"This one's GS2 federalism. Connect it to Art. 200. Prelims will ask the article number; Mains will ask the balance."*
- **Swipe-deck metaphors (Tinder, Inshorts) imply disposability:** swipe away, never see again. Revision content needs the opposite metaphor: keep, return, connect. [Inference]
- **WhatsApp distrust is our opening.** Our users swim in forwarded "current affairs PDFs". Visible sources and a "checked by" stamp make a Chai Card the opposite of a WhatsApp forward. [Inference from DNR India]

### 3(c) Recommended structure (6 zones, fixed order)

```
┌────────────────────────────────────────┐
│ ZONE 0 · Stack header                  │  "Today's Chai · 2 of 5"  ●●○○○
├────────────────────────────────────────┤
│ ZONE 1 · Lens chips (the hero)         │  [GS2] [Polity: Centre-State]
│                                        │  [Prelims + Mains] [Static: Art. 200]
│ ZONE 2 · Headline (≤ 12 words, plain)  │  Verb-led, no clickbait, no "!"
│ ZONE 3 · Plain summary (60-90 words)   │  3 short paras / ≤ 20 words per
│                                        │  sentence; jargon is dotted-underline
│                                        │  → tap for glossary sheet
│ ZONE 4 · "Why it matters for UPSC"     │  2-3 bullets, ≤ 15 words each
│   (Axios-style axiom, bold)            │  Static link → "Revise: Governor's
│                                        │  powers (Laxmikanth ch. 26)"
├────────────────────────────────────────┤
│ ZONE 5 · Exam Corner (collapsed by     │  ▸ Try 1 question  (MCQ or Mains
│   default, 1 tap to expand)            │    prompt) · Key facts (3) · PYQ link
├────────────────────────────────────────┤
│ ZONE 6 · Trust footer                  │  Sources: PIB · The Hindu · SC order
│                                        │  Summary by AI · Checked by editor ✓
│                                        │  [Report a mistake]   2 min read
├────────────────────────────────────────┤
│  [🔖 Save for revision]   [ Next card → ] │  ← tap targets ≥ 48dp
└────────────────────────────────────────┘
```

### Build rules: Chai Cards

| # | Rule | Persona |
|---|---|---|
| **C-01** | **Exactly 5 cards per day** (editorial range 4-6 on a heavy news day, never more). The daily mix target is ≥2 GS2/GS3, ≥1 static-heavy (history, geography, environment), ≤1 international, ≤1 LIGHT story. | All |
| **C-02** | **Navigation:** a single card per screen, scrolling vertically *within* the card (long cards scroll). Moving between cards uses a **"Next card →" button** (primary) and a **progress dot row** (tappable). Horizontal swipe is an *optional accelerator*, never the only way (WCAG 2.5.1). No auto-advance. | All; accessibility |
| **C-03** | **Overview mode:** the stack header has a "See all 5" toggle that shows 5 compact rows (chips + headline). This allows jumping straight to GS3 if that's what you need, and supports spotted scanning. | Meera, Rahul |
| **C-04** | **Headline:** ≤12 words (English) or ≤14 words (Hindi), verb-led, no question headlines, no "!", no "SHOCKING/BIG". | All (anti-hype) |
| **C-05** | **Summary:** 60-90 words. First sentence = what happened and who did it. Second = the number or decision. Third = what changes. Sentences ≤20 words. Active voice. | Arjun, Rahul |
| **C-06** | **Lens chips (Zone 1):** max 4, in this order: GS paper · syllabus topic (from the official syllabus taxonomy) · exam stage (Prelims / Mains / Both) · static link. Chips are tappable filters into the Practice topic page. | Kavya, Meera |
| **C-07** | **"Why it matters for UPSC" (Zone 4)** is required on every card, 2-3 bullets, and at least one bullet must name a static concept (article, act, scheme, map location). This is the static-to-current bridge. | Kavya, Vikram |
| **C-08** | **Exam Corner (Zone 5) collapsed by default.** Expanded, it shows ① 1 MCQ (4 options, instant feedback, 1-line explanation) *or* 1 Mains prompt with "Outline in 3 points" scaffold; ② 3 key facts; ③ PYQ link(s) to the verified PYQ bank (see §6). Answering the MCQ is **never required** to go next. | Arjun (safe-to-fail), Vikram |
| **C-09** | **Save for revision 🔖** on every card (≥48 dp). Saved cards land in Practice → "My Chai deck" grouped by GS paper. Saving offers an optional "Remind me" at 1 / 7 / 30 days (spacing). | Vikram, Meera |
| **C-10** | **Spaced-repetition hook:** each card's MCQ re-enters Practice at expanding intervals (day 3, day 10, day 30, adjusted by correctness). Questions answered wrong come back sooner. The resurfaced items appear as task ② "5 Prelims questions" (mixing new and old), not as a new task. | All |
| **C-11** | **End state** after card 5: a full-screen "That's today's Chai ☕" panel listing what was covered (5 chips), the number saved, and two actions: "Back to Today" and "Discuss in pod". **No "load more" and no "yesterday's cards" promotion.** An archive exists under Practice → Chai archive for deliberate catch-up. | Meera, Arjun |
| **C-12** | **Resume:** the stack remembers position. Re-entering opens on the next unread card with "Welcome back, 3 to go." | Rahul |
| **C-13** | **Read time** is shown per card and per stack, computed at 180 wpm for Hindi and 200 wpm for English plus 30 s per expanded Exam Corner. [Inference] | Rahul |
| **C-14** | **Image policy:** default no photo (data saving, low-end devices). Use a small topic icon or map thumbnail only when it carries information (location stories). Photos load on tap only. | Arjun, Kavya (data) |

---

## 4. Plain language and bilingual content design

### 4(a) Principles

- **GOV.UK content design** writes for a reading age of about 9, because people read online by scanning, and because even specialists prefer plain English. Its guidance covers front-loading, short sentences (about 25 words max), active voice, and avoiding jargon. https://www.gov.uk/guidance/content-design/writing-for-gov-uk (now redirects to https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/)
- **US Federal Plain Language Guidelines:** short sentences, everyday words, active voice, "you". https://webarchive.library.unt.edu/web/20121006190813mp_/http:/www.plainlanguage.gov/howto/guidelines/FederalPLGuidelines/TOC.cfm
- **India audience demand:** in DNR 2025, **adapting text to different reading levels was the most popular AI news feature in India**, and audiences globally expect AI to make news "easier to understand" (net +7). https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary
- **Hindi register, an official precedent.** As early as 1958 Nehru wrote on the "Use of Simple Hindi in Official Work" (https://nehruarchive.in/documents/use-of-simple-hindi-in-official-work-12-march-1958-823q2). In December 2011 the Government of India (MHA, Official Language) asked officers to replace difficult Hindi words with commonly used (including English-origin) terms to make material easier to understand. https://deccanherald.com/india/prefer-hinglish-words-over-pure-2459817
- **Devanagari typography** needs more vertical space because matras sit above and below the line: line-height 150-170% for body text. Tight leading causes "matras overlap". https://indiafont.com/blog/indian-typography-tips
- **Mobile comprehension** (NN/g, above): simplicity removes the mobile penalty.

### 4(b) Implications

- UPSC *requires* technical vocabulary (e.g., "Article 200", "money bill", "repo rate"). Plain language here does not mean avoiding terms. It means **explain each term once, in place**, and keep the surrounding sentence simple. [Inference]
- **Arjun's real Hindi problem** is not translation but *register*. Coaching translations often produce "राज्यपाल द्वारा विधेयक पर अनुमति प्रदान किए जाने हेतु समय-सीमा का निर्धारण", which is grammatical but heavy. Arjun reads, writes and speaks Hindustani, but he must *also* recognise the formal exam term (UPSC's Hindi papers use *sarkari* terminology). So we write **simple Hindustani prose with the official term shown once in brackets**: "राज्यपाल बिल पर कितने दिन तक फ़ैसला रोक सकते हैं? (अनुच्छेद 200, 'अनुमति')". [Inference]
- **Side-by-side bilingual display doubles the text length**, which is the mobile comprehension penalty again, and halves the screen budget. A toggle is better. Bilingual users (Meera with Hindi-speaking parents, Arjun learning English terms) benefit from a **glossary that always shows both terms**. [Inference]

### 4(c) Build rules

| # | Rule | Persona |
|---|---|---|
| **C-15** | **Reading targets:** English summary at about CEFR B1 / Flesch Reading Ease ≥ 55 (about grade 8-9) for prose; terms exempt. Hindi: no validated readability formula is in wide production use (research exists, e.g. ACL W14-5134, https://preview.aclanthology.org/fix_video/W14-5134.pdf), so use a **checklist**: sentences ≤ 18 words, ≤ 1 conjunct-heavy *tatsama* word per sentence outside the bracketed official term, and everyday verbs (करना, होना, रखना) over nominalised forms (… किया जाना). [Inference: thresholds are our editorial choice] | Arjun |
| **C-16** | **Language follows onboarding preference** (English / हिंदी / Both). "Both" users get their *primary* language per card with a **per-card toggle "हिंदी में पढ़ें / Read in English"** in the card overflow (top-right), plus a global setting. Never show the two languages side by side in the summary. | Arjun, Meera |
| **C-17** | **Glossary tooltips:** a term with a dotted underline opens a **bottom sheet** (not a hover tooltip; there is no hover on touch) with: plain meaning (≤25 words), the term in the *other* language, the static source chapter, and "Save term". Max 3 glossary terms per card. | Arjun, Kavya |
| **C-18** | **Hindi house style:** simple Hindustani; Urdu-origin and English-origin everyday words allowed (फ़ैसला, बिल, कोर्ट); official term shown once in brackets; numerals in international digits (1, 2, 3) for exam-number fluency; ₹ symbol; "लाख/करोड़". | Arjun |
| **C-19** | **Hindi is written natively by Hindi editors (or AI-drafted in Hindi and edited by them), not machine-translated from English at publish time.** Each Hindi card carries its own "Checked by" stamp. | Arjun |
| **C-20** | **Typography (Compose):** Noto Sans / Noto Serif Devanagari bundled (subset), body 16 sp min (17 sp for Hindi), line-height 1.6 for Hindi and 1.5 for English; respects system font scale up to 200% without truncating chips (chips wrap). | Arjun, Vikram (late-night eyes) |

---

## 5. Humour rules (Chotu)

### 5(a) Principles

- **Benign violation theory** (McGraw et al., *Psychological Science*): humour about misfortune works only with the right mix of severity and distance. Serious events become funny only when distant; minor ones are funny when close; a friend's big misfortune is less funny than a stranger's. https://www.livescience.com/23062-joke-tragedy.html
- **Humour aids recall and sharing of news:** young adults (18-34) remembered more political information from clips ending in jokes, and were likelier to share them (Coronel et al., reported secondhand; details limited). https://www.rarejob.com/dna/2021/03/05/humor-can-help-people-remember-political-news-research-finds
- **Instructional humour:** a 2025 review of five decades of research (PMC11814177, https://pmc.ncbi.nlm.nih.gov/articles/PMC11814177/; full text not retrieved here) synthesises a well-established pattern: **content-related** humour supports attention and retention, while **unrelated, aggressive or disparaging** humour harms learning and the teacher-learner relationship. [Pattern attributed from the wider literature, e.g. Banas et al. 2011; verify against the full text]
- **The brief:** aspirants bond over shared absurdity ("insiders", changing optionals, chai) (§4.9). Humour "sustains it for years" [Infer]. Chotu must be "clearly labelled AI, never presented as a person" (agreed decisions).

### 5(b) Implications

- Chotu's humour should **punch at shared absurdities of aspirant life and at bureaucratic absurdity**, never at the reader's attempt count, age, money, family or failure (Vikram's wounds). The distance principle means a joke about "the 47th optional-switch debate" lands; a joke about Prelims cut-offs in results week does not.
- **Humour on news must be about the story's light side, and must also teach** (related humour). A joke that carries the fact ("A GI tag for a sweet: finally, a geography topic you can eat") helps recall; a random pun doesn't.
- An AI that jokes on a tragic story would be a trust catastrophe on screenshot-happy Instagram and Reddit. Tone classification must be **human-confirmed**.

### 5(c) Tone classification and decision table

**Story tone tags (set by AI draft, confirmed by an editor before publish):**

| Tag | Definition | Examples |
|---|---|---|
| **LIGHT** | No death, injury, loss, violence, discrimination or distress; positive or quirky | GI tags, a new species named, a record harvest, a space mission milestone, a quirky old law repealed |
| **NEUTRAL** | Policy, institutional, economic or diplomatic news without human harm | RBI rate decision, SC constitutional opinion, a new treaty, budget numbers |
| **SERIOUS** | Conflict, disease, economic distress, communal or caste issues, environmental damage, crime | Floods with displacement, a border clash, a heatwave, a data breach |
| **TRAGIC** | Deaths, disasters, violence against people, suicides (including aspirant deaths, e.g. the ORN basement flooding in the brief §3.1) | Any story with a fatality count in the headline |

**When may Chotu joke?**

| Situation | Chotu humour? | What Chotu does instead |
|---|---|---|
| LIGHT story, joke is related to the exam fact | ✅ One line max, in Zone 4 or the end panel, labelled "Chotu (AI)" | — |
| LIGHT story, joke unrelated to content | ❌ | Skip |
| NEUTRAL story | ⚠️ Only on aspirant-life absurdity, *not* about the policy or people affected (e.g. "Yes, another committee. Note its name for Prelims.") | Plain lens |
| SERIOUS story | ❌ | Calm, factual. Chotu absent |
| TRAGIC story | ❌ and the stack header drops all emoji that day | Factual card; optional "If this is hard to read, it's okay to skip" line; skip button |
| Any card on a **results day** (Prelims/Mains) or app-wide "quiet mode" | ❌ globally | Chotu off |
| User has logged 3+ low moods in 7 days (private signal) | ❌ for that user | Chotu stays gentle and non-comic [Inference; ties to brief's pod-lead check-in] |
| Joke targets: the reader's attempt, age, money, family, gender, caste, region, language medium, body | ❌ always | — |
| Joke targets: chai, library seats, optional-switch debates, Laxmikanth's weight, the syllabus's length, bureaucratic jargon | ✅ on LIGHT, ⚠️ on NEUTRAL | — |

**Examples (illustrative):**

- ✅ LIGHT (GI tag for a regional sweet): *"Chotu (AI): Geography you can eat. Remember: a GI tag protects the name, not the recipe. That's Prelims bait."* / *"छोटू (AI): ये भूगोल है जो खाया जा सकता है। याद रखो: GI टैग नाम बचाता है, रेसिपी नहीं। ये Prelims का पसंदीदा जाल है।"*
- ✅ Aspirant-life (end panel, any non-tragic day): *"Done before your chai went cold. Rare. Respect."* / *"चाय ठंडी होने से पहले ख़त्म। ऐसा कम होता है। सलाम।"*
- ❌ (never): a joke on a stampede, flood, exam-paper leak affecting candidates, or a coaching-centre fire.
- ❌ (never): *"Attempt 5? Chotu believes in you, unlike your relatives."* It targets the reader's wound, however affectionate it sounds.

**Build rules**

| # | Rule | Persona |
|---|---|---|
| **C-21** | `tone` is a required field on every card (`LIGHT/NEUTRAL/SERIOUS/TRAGIC`). A card can't publish until an editor confirms it. A Chotu line is a separate optional field, renderable only when `tone == LIGHT` (or the NEUTRAL aspirant-life whitelist). | All |
| **C-22** | Chotu lines are always prefixed by the visual label "Chotu (AI)" / "छोटू (AI)" with the mascot icon, never a human avatar. Max 1 Chotu line per card and 2 per stack. | All |
| **C-23** | Global "Chotu humour" switch in settings (default ON), plus automatic OFF on results days and in quiet mode. | Vikram, Sana |

---

## 6. AI-generated content trust UX

### 6(a) Principles

- **PAIR Guidebook, Explainability + Trust:** help users learn "when to trust the system's predictions and when to apply their own judgement". "Data sources have to be part of your explanations." Skip confidence displays that don't change decisions; avoid falsely high confidence. "Communicate the product's capabilities and limitations clearly… and do this early." Partial explanations are often best. https://pair.withgoogle.com/chapter/explainability-trust/
- **Trusting News (2025):** after seeing an AI disclosure, 42% said they were *less* likely to trust a story and 30% *more*. **Detailed labels (how and why AI was used, and human review) generated more trust than "AI was used" alone.** 91.5% rated human review very important. Placement matters: 80%+ noticed labels at the bottom or in a sidebar, but only 44% noticed hover labels. https://trustingnews.org/new-research-how-ai-disclosures-in-news-help-and-also-hurt-trust-with-audiences/
- **MJC/Poynter (US, 2025, n=1,128):** the vast majority want AI disclosure; about 40% might use a news chatbot *if the news organisation verified responses*. https://hsjmc.umn.edu/news/2025-04-24-report-newsrooms-look-innovate-ai-americans-remain-skeptical-and-distrusting
- **India is more AI-receptive:** comfort with automatically generated news is **44% in India vs 11% in the UK**, and weekly chatbot use for news is 18% in India. Globally, people expect AI news to be *less* trustworthy (net −18) and less accurate (net −8). https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary
- **The brief's own warning:** AI is sycophantic, Hindi output is likely weaker, and the market is primed to distrust inflated claims (CCPA actions on coaching ads; brief §4.3 and Devil's advocate §4b).

### 6(b) Implications

- Our users are *more* open to AI than Western users, but they punish *wrong facts in an exam context* far harder than a news reader would. One hallucinated PYQ year screenshot on r/UPSC could undo months of trust. **The Exam Corner is the highest-risk zone.** [Inference]
- The honest-brand position (brief §7.2) requires that AI help is disclosed specifically, never hidden or over-claimed. "Checked by a human" is a differentiator coaching PDFs don't offer.

### 6(c) Build rules

| # | Rule | Persona |
|---|---|---|
| **C-24** | **Trust footer on every card (Zone 6), always visible, never behind hover or tap:** "Sources: [2-3 named sources with links] · Summary drafted by AI from these sources · Checked by [editor first name] [date] ✓". The Hindi version carries its own checker. | Meera, Kavya |
| **C-25** | **Pipeline (human-in-the-loop):** ① editor selects stories from primary sources (PIB, PRS, SC/HC orders, RBI, Gazette, The Hindu/IE) → ② LLM drafts summary, lenses, glossary *grounded only in attached source text* (retrieval, with the citation for each sentence stored) → ③ automated checks: every number and named entity in the summary must appear in a source; syllabus tag must match the taxonomy; reading checklist → ④ human editor approves EN, Hindi editor approves HI → ⑤ publish. **No card publishes without ④.** | All |
| **C-26** | **Exam Corner facts and questions:** "Key facts" must each link to a source sentence. **PYQ links come only from a curated PYQ database** (year, paper, question ID, official text). The model may *suggest* a match, but only an editor-confirmed ID renders. If no confirmed PYQ exists, show "No direct PYQ: related topic: [link]". Never show a fabricated year. | Vikram, Arjun |
| **C-27** | **MCQs:** AI may draft; an editor must verify the key, and distractors may not be factually ambiguous. Each MCQ stores `verified_by`. Unverified MCQs never ship. | All |
| **C-28** | **No numeric confidence scores** (PAIR: they don't change decisions here and imply false precision). Instead use a categorical **"Developing story: details may change"** tag when a story is <24 h old or contested, with "Updated [time]" on edits. | All |
| **C-29** | **Report a mistake:** a text link in the footer opens a bottom sheet with 4 reasons (Wrong fact · Wrong syllabus tag · Hindi unclear · Something else) plus an optional note. Reply SLA: acknowledgement instantly ("Thanks, an editor will check this by tomorrow evening"); correction applied within 24 h. | Meera, Arjun |
| **C-30** | **Corrections are visible:** a corrected card shows "Corrected [date]: [what changed]" at the top of Zone 6, and anyone who saved it gets a quiet in-app note (no push). There is a public corrections log in Settings → About Chai Cards. | All |
| **C-31** | **About Chai Cards page** (linked from the stack header ⓘ): what AI does, what humans check, what sources we use, what we don't do (no coaching partnerships in story selection, no paid placement), and how to report errors. This is the PAIR "set expectations early" point, shown once at first open as a 3-line intro sheet. | Meera, Kavya |

---

## 7. Microcopy: Today screen and Chai Cards (EN + HI)

**Voice: "friend, not coach".** A senior in the library who has been through it: brief, warm, a little wry, never preachy, never hype. No "Let's crush it!", no "Only X days left!", no "You missed…". Hindi is spoken Hindustani with तुम (warm, peer). Settings offer आप for users who prefer it. [Inference: test तुम vs आप with Hindi-medium participants; see §8]

### 7.1 Greeting (time-of-day)

| Slot | English | हिंदी |
|---|---|---|
| 05:00-11:59 | Good morning, Arjun. Chai first, then 3 small things. | सुप्रभात अर्जुन। पहले चाय, फिर 3 छोटे काम। |
| 12:00-16:59 | Afternoon, Meera. Halfway is still a way. | नमस्ते मीरा। आधा रास्ता भी रास्ता है। |
| 17:00-19:59 | Evening, Rahul. Long day? 20 minutes still counts. | शाम हो गई राहुल। थका दिन? 20 मिनट भी गिनते हैं। |
| 20:00-22:59 | Hey Vikram. Let's close the day kindly. | विक्रम, चलो आज का दिन आराम से समेटें। |
| 23:00-02:00 | Still up, Sana? Sleep is part of the prep too. | सना, अभी भी जाग रही हो? नींद भी तैयारी का हिस्सा है। |

### 7.2 Today's 3

| Element | English | हिंदी |
|---|---|---|
| Block title | Today's 3 · about 32 min | आज के 3 · लगभग 32 मिनट |
| Task ① | Today's Chai: 5 stories, 7 min | आज की चाय: 5 ख़बरें, 7 मिनट |
| Task ② | 5 Prelims questions · 5 min | Prelims के 5 सवाल · 5 मिनट |
| Task ③ | 1 Mains answer, 150 words · 20 min | Mains का 1 उत्तर, 150 शब्द · 20 मिनट |
| Swap link | Not today? Swap it | आज नहीं? बदल लो |
| Progress | 1 of 3 done | 3 में से 1 हो गया |
| Carry over (night) | Move "Mains answer" to tomorrow? | "Mains उत्तर" कल पर रखें? |
| Partial-day line | 2 of 3 is a real day. | 3 में से 2 भी पूरा दिन है। |

### 7.3 Pod strip

| Element | English | हिंदी |
|---|---|---|
| Header | Your pod · Night Owls · 5 around today | तुम्हारा पॉड · Night Owls · आज 5 लोग आए |
| Activity | Aman shared an answer · 9:12 | अमन ने एक उत्तर शेयर किया · 9:12 |
| Quiet pod | Pod's quiet today. Say hi? | आज पॉड में सन्नाटा है। हाय बोल दो? |
| Nudge button | Send a chai ping ☕ | चाय-पिंग भेजो ☕ |
| Nudge sent | Ping sent. No pressure on anyone. | पिंग चला गया। किसी पर कोई दबाव नहीं। |

### 7.4 Chai stack header and cards

| Element | English | हिंदी |
|---|---|---|
| Stack header | Today's Chai · 2 of 5 | आज की चाय · 5 में से 2 |
| First-open intro (once) | 5 stories a day, each tied to your syllabus. AI drafts, our editors check. Then you're done. | रोज़ 5 ख़बरें, हर एक सिलेबस से जुड़ी। AI लिखता है, हमारे एडिटर जाँचते हैं। बस, इतना ही। |
| Lens heading | Why this matters for UPSC | UPSC के लिए क्यों ज़रूरी |
| Exam corner (collapsed) | Try 1 question · 30 sec | 1 सवाल आज़माओ · 30 सेकंड |
| MCQ right | Right. Here's why: … | सही। वजह ये है: … |
| MCQ wrong | Not this one. Good to find out here, not in May. | ये नहीं। अच्छा हुआ यहाँ पता चला, मई में नहीं। |
| Save | Save for revision | रिवीज़न के लिए रखो |
| Saved toast | Saved. We'll bring it back in a week. | रख लिया। एक हफ़्ते बाद फिर दिखाएँगे। |
| Trust footer | Summary drafted by AI from these sources · Checked by Priya, 10 Oct ✓ | सारांश AI ने इन स्रोतों से बनाया · जाँचा: प्रिया, 10 अक्टूबर ✓ |
| Report | Spot a mistake? Tell us | कोई ग़लती दिखी? बताओ |
| Developing tag | Developing story: details may change | ख़बर अभी बदल रही है: जानकारी बदल सकती है |
| Tragic-day line | This one is heavy. It's okay to skip it. | ये ख़बर भारी है। छोड़ना चाहो तो ठीक है। |

### 7.5 Completion states

| State | English | हिंदी |
|---|---|---|
| Chai done | That's today's Chai ☕ GS2, GS3 ×2, Environment, IR. 2 saved for revision. | आज की चाय ख़त्म ☕ GS2, GS3 ×2, पर्यावरण, IR। 2 रिवीज़न के लिए रखीं। |
| Chai done, CTA | Back to Today · Talk about it in pod | Today पर लौटो · पॉड में बात करो |
| All 3 done | You're done for today. Really. The rest of the evening is yours. | आज का काम पूरा। सच में। बाक़ी शाम तुम्हारी। |
| No "more" upsell | (intentionally blank: no "Do 10 more questions!") | — |

### 7.6 Close the Day entry

| State | English | हिंदी |
|---|---|---|
| Daytime (collapsed) | Close the day · tonight | आज का दिन समेटो · रात को |
| 20:00+ (promoted) | 3 lines, 2 minutes: what got done, what slipped, one thing for tomorrow. | 3 लाइनें, 2 मिनट: क्या हुआ, क्या छूटा, कल की एक बात। |
| CTA | Close my day | मेरा दिन समेटो |
| After closing | Day closed. You showed up. That counts. | दिन पूरा हुआ। तुम आए, यही मायने रखता है। |
| Showed-up count (inside sheet) | Days you showed up this month: 18 | इस महीने तुम 18 दिन आए |
| 23:00+ variant | Close the day and put the phone down. Tomorrow-you will thank you. | दिन समेटो और फ़ोन रख दो। कल वाला तुम शुक्रिया कहेगा। |

**Why these land with the personas.** "2 of 3 is a real day" is for Vikram and Rahul, who measure themselves against impossible days. "Good to find out here, not in May" reframes a wrong answer as safe-to-fail practice for Arjun (brief §4.1). "No pressure on anyone" protects Sana and the quieter pod members from guilt-pings. "AI drafts, our editors check" speaks to Meera's and Kavya's distrust of hype. [Inference; validate in testing]

---

## 8. Measurement and usability testing

### 8(a) Principles

- **Calm tech** "requires the smallest possible amount of attention" (calmtech.institute, above). Attention metrics (time-in-app) are therefore the wrong goal by definition.
- **Broken-streak effect** (Silverman & Barasch 2023, above): measuring "consecutive days" as a KPI will push the team toward guilt mechanics.
- **Brief §10.3:** "Avoid vanity metrics (total members) as your headline measure." Its suggested signals include the 14-day first-submission rate and Close the Day frequency ≥3×/week.
- **NN/g:** about 5 users per round uncover most usability problems in qualitative testing; run several small iterative rounds rather than one large one. https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/

### 8(b) Metric set for the Today slice

| Type | Metric | Target (initial, [Inference]) | Why it fits |
|---|---|---|---|
| **North star** | **Days closed per active user per week** (Close the Day submitted) | ≥3 | Finishing, not consuming |
| Task success | % of opened Chai stacks finished (5/5) | ≥60% | Validates a finite stack is finishable |
| Task success | Median time to finish a stack | 5-9 min | If >12 min, cards are too long |
| Learning | Exam Corner opens per card; MCQ accuracy at first try vs at the day-10 resurface | Accuracy rises at resurface | Evidence of retention, not just reads |
| Revision | % of users with ≥1 saved card revisited within 14 days | ≥30% | Saved means used |
| Habit | D7 / D30 retention, **counted as "showed up on ≥3 of the last 7 days"**, not strictly consecutive | D30 ≥25% | Forgiving retention |
| Trust | Mistake reports per 100 cards; % resolved <24 h; corrections per week | <1 per 100; 95% | Quality signal |
| Trust | "I trust Chai Card facts" (5-point survey, monthly) | ≥4.0 | Direct |
| Wellbeing | "After using Today I feel… calmer / same / more anxious" (monthly, 1 question) | Calmer ≥ more anxious ×3 | Guards the product's soul |
| Language | Hindi vs English completion parity | Within 10 pts | Hindi isn't second-class |

**Avoid (vanity or harmful):** time in app, sessions per day, scroll depth, cards viewed (unbounded), longest streak, notification CTR as a goal, total installs as a headline, DAU/MAU without a finishing signal, leaderboard engagement.

### 8(c) Usability test plan: Today + Chai slice

**Method:** moderated, think-aloud, **on participants' own phones** (to capture low-end performance, font scale and data conditions), with a clickable Compose prototype as an APK, or a Figma prototype for round 1. Three rounds of 5 participants, iterating between rounds.

**Recruit (per round of 5):** 2 Hindi-medium (≥1 from a non-hub town; Arjun/Kavya), 1 English-medium attempt 2+ (Meera), 1 working professional (Rahul), 1 repeater attempt 4+ (Vikram). At least 2 women per round (Sana). At least 2 devices under ₹12,000 or ≥3 years old. Paid incentive (brief §11). Moderator fluent in Hindi for Hindi sessions; Hindi-medium sessions run entirely in Hindi.

**Tasks and success criteria:**

| # | Task (scenario-framed, no UI words) | Success criterion |
|---|---|---|
| 1 | "It's 7 am, you have 15 minutes before leaving. Show me what you'd do." | Opens Chai or a task within 10 s without help; correctly states that 3 tasks are expected today |
| 2 | "Go through today's news." | Finishes 5/5 cards; uses Next button or swipe; ≤1 navigation error; can describe the end state ("I'm done") unprompted |
| 3 | "Which exam paper is story 3 useful for, and what old topic does it connect to?" | Names the GS paper and the static link within 15 s (lens-chip findability) |
| 4 | "Keep story 2 for revision, then find it again." | Saves in ≤2 taps; locates it in Practice → My Chai deck in ≤30 s |
| 5 | "You think a date in story 4 is wrong. What would you do?" | Finds "Report a mistake" in ≤20 s |
| 6 | "Who wrote this summary? Would you trust it in your notes?" | Correctly says AI drafted + human checked; trust rating captured (1-5) with reasons |
| 7 (Hindi/bilingual) | "Read story 1 in the other language." / "What does [glossary term] mean?" | Finds per-card toggle ≤20 s; opens glossary sheet; restates the meaning in their own words |
| 8 | (Time set to 22:30) "You're winding down. What does the app suggest?" | Identifies Close the Day as the top action; reports emotional tone (calm / guilty / neutral) |
| 9 | "Swap the Mains task for something smaller." | Completes swap ≤3 taps |

**Also capture:** SUS score (target ≥75); a 3-word emotion pick before and after (from a calm↔anxious list); comprehension check (participant explains one card's story in their own words, rated by a rubric; target ≥4/5 cards correct); a register check for Hindi users ("Does this sound like how you talk, how newspapers talk, or how government notices talk?"); reactions to Chotu's lines on LIGHT and NEUTRAL cards ("Funny? Annoying? Inappropriate?"); whether anyone *wanted* a countdown (decides T-05's default).

**Ethics:** informed consent; any distress → stop and offer support resources (brief §11 rules of conduct); no recording of faces unless consented.

---

## 9. Day-in-the-life journey map (Today screen) with per-persona variation

Built on brief §3.3. Stage emotions are [Inference] from the brief's emotional map, to be validated in research.

| Stage | Time | Touchpoint | Doing | Thinking / feeling | Today's design response |
|---|---|---|---|---|---|
| **Wake** | 06:00-07:30 | Push (opt-in, 1/day) → Today | Opens Today with chai | "What do I *have* to do?" Mild dread, or fresh resolve | Greeting + 3 tasks + Chai first (T-01, T-02); no countdown (T-05) |
| **Chai** | 07:00-08:30 | Chai stack | Reads 5 cards, answers 1-2 MCQs | Satisfaction if finite; anxiety if endless | 5 cards, end state (C-01, C-11) |
| **Study block** | 09:00-13:00 | Rooms (from Today) | Library or room | Focused or lonely | Live room chip only when live (T-01) |
| **Comparison scroll** | 13:30 | Instagram/Telegram (outside the app) | Sees topper posts | Shame, "I'm behind" | Today shows the *pod*, not rankings (T-10); 2-of-3 framing |
| **Afternoon slump** | 14:30-18:00 | Practice | Mains answer | Avoidance, fear of writing | Small, swappable task (T-02) |
| **Call home** | 21:00 | — | "What's the plan?" | Pressure, guilt | Close the Day promoted at 20:00 (T-07) |
| **Wind-down** | 22:00-23:30 | Close the Day | 3 lines + mood (private) | Relief or spiral | Partial-day framing, forgiving monthly count (T-06, T-09) |
| **Late night** | 23:30+ | Today (if opened) | Doom-scroll risk | Guilt | Sleep line, no new content suggested (T-07) |

**Where the personas differ:**

- **Arjun (Hindi-medium, Mukherjee Nagar):** reads Chai at the tea stall on 4G with a weak signal. Needs Hindi cards that are **already downloaded overnight** (see states) and a glossary for English terms he'll see in English sources. His peak emotion is the 21:00 call home about family money, so Close the Day must never show anything paid.
- **Meera (English, attempt 2):** tends to over-consume ("one more PDF"). The end state matters most for her. She is also the most likely to screenshot, so nothing comparable (streak numbers, ranks) should be on Today.
- **Rahul (working):** two windows, 07:10 bus and 22:30. Chai must finish in one bus ride. Part-time task mode (T-02). He may never do Rooms, so don't punish that.
- **Sana:** late-night library hours are a safety issue (brief §2.4). Today should never nudge "go to the library room tonight". Pod pings are capped (T-10). Chotu humour avoids male-coded banter.
- **Vikram (attempt 5):** dates and counts hurt. Countdown off, monthly not consecutive count, no "you missed". The static links in Chai are where he feels expert, so give him "Discuss in pod" to explain to juniors (brief §4.10, contribution ladder).
- **Kavya (Tier-3, online-only):** Chai's UPSC lens is her "corridor knowledge". The Pod strip is her only peer contact, so make it warm even when quiet ("Say hi?").

---

## 10. Annotated wireframes

### 10.1 Today screen: morning (360 dp wide)

```
┌──────────────────────────────────────────┐
│ ① Good morning, Arjun.                   │ ① Greeting: first F-bar, plain words.
│   Chai first, then 3 small things.       │   No streak, no countdown (T-05, T-06)
├──────────────────────────────────────────┤
│ ② TODAY'S 3 · about 32 min     1 of 3 ▰▱▱│ ② Fraction + segmented bar, accent
│                                          │   colour, never red (T-04)
│ ┌──────────────────────────────────────┐ │
│ │ ☕ Today's Chai           7 min    ›  │ │ ③ Chai is task #1 every morning,
│ │   5 stories · GS2 GS3 Env            │ │   chip preview of today's papers
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ ✓ 5 Prelims questions     5 min      │ │ ④ Done state: check + muted text,
│ └──────────────────────────────────────┘ │   stays visible (no disappearing)
│ ┌──────────────────────────────────────┐ │
│ │ ✎ 1 Mains answer (150w)  20 min   ›  │ │ ⑤ Each row = one 48dp+ tap target
│ └──────────────────────────────────────┘ │
│   Not today? Swap it                     │ ⑥ Swap, never add (T-02)
├──────────────────────────────────────────┤
│ ⑦ YOUR POD · Night Owls · 5 around       │ ⑦ Presence only, no counts of
│   (A)(P)(R)(S)(K)  Aman shared an answer │   who finished (T-10)
│   [ Send a chai ping ☕ ]     Open pod ›  │
├──────────────────────────────────────────┤
│ ⑧ 🎧 Silent study room · 14 inside  Join │ ⑧ Shown only when live
├──────────────────────────────────────────┤
│ ⑨ 🌙 Close the day · tonight          ›  │ ⑨ Collapsed in the morning,
│                                          │   promoted to the top after 20:00 (T-07)
├──────────────────────────────────────────┤
│  Today    Pod    Practice   Rooms  My Path│ Bottom nav: M3 NavigationBar,
└──────────────────────────────────────────┘ 5 destinations, label always shown
```

### 10.2 Today screen: night (after 20:00, 2 of 3 done)

```
┌──────────────────────────────────────────┐
│ Hey Vikram. Let's close the day kindly.  │
├──────────────────────────────────────────┤
│ 🌙 CLOSE THE DAY                         │ Promoted to position 1 (T-07)
│ 3 lines, 2 minutes: what got done, what  │
│ slipped, one thing for tomorrow.         │
│ [        Close my day        ]           │ Primary filled button
├──────────────────────────────────────────┤
│ TODAY'S 3 · 2 of 3 is a real day.  ▰▰▱   │ Partial-day framing (T-09)
│ ✓ Today's Chai   ✓ 5 Prelims questions   │ Collapsed done rows
│ ✎ 1 Mains answer  [Move to tomorrow?]    │ Carry-over, not "missed"
├──────────────────────────────────────────┤
│ YOUR POD · Priya closed her day · 21:40  │
└──────────────────────────────────────────┘
```

### 10.3 One Chai Card (expanded Exam Corner)

```
┌──────────────────────────────────────────┐
│ ← Today's Chai · 2 of 5   ●●○○○  ⓘ  ⋮    │ Header: back, progress dots
│                                          │ (tappable), ⓘ About, ⋮ language
├──────────────────────────────────────────┤
│ [GS2] [Polity · Centre-State] [Both]     │ Zone 1 lens chips: hero, top-left,
│ [Static: Art. 200-201]                   │ first F-bar (C-06)
│                                          │
│ Supreme Court: no fixed deadline for     │ Zone 2 headline ≤12 words,
│ Governors on state bills                 │ verb-led (C-04)
│                                          │
│ 3 short paragraphs, 60-90 words,         │ Zone 3 summary; dotted words
│ ┄┄┄┄┄┄ dotted = glossary tap ┄┄┄┄┄┄     │ open glossary sheet (C-17)
│                                          │
│ WHY THIS MATTERS FOR UPSC                │ Zone 4 axiom (bold, Axios-style)
│ • Mains: federalism, Governor's role     │ 2-3 bullets; ≥1 static link (C-07)
│ • Prelims: Art. 200 options, Art. 143    │
│ • Revise: Governor (Laxmikanth) ›        │
├──────────────────────────────────────────┤
│ ▾ EXAM CORNER                            │ Zone 5 (collapsed by default,
│  Q. Under Art. 200, which is NOT an      │ shown expanded here) (C-08)
│     option for a Governor? (a)…(d)       │ MCQ answer optional
│  Key facts (3) · PYQ: GS2 2022 Q… ›      │ PYQ only from verified DB (C-26)
├──────────────────────────────────────────┤
│ Sources: SC opinion · PIB · The Hindu    │ Zone 6 trust footer, always
│ Summary drafted by AI from these sources │ visible (C-24)
│ · Checked by Priya, 10 Oct ✓             │
│ Spot a mistake? Tell us    · 2 min read  │ (C-29)
├──────────────────────────────────────────┤
│ [ 🔖 Save for revision ]  [ Next card → ]│ Sticky action bar, ≥48dp (C-02, C-09)
└──────────────────────────────────────────┘
```

---

## 11. States list (Today + Chai)

| State | Today behaviour | Chai behaviour | Copy (EN / HI) |
|---|---|---|---|
| **First run** (day 0) | 3 tasks preset from onboarding; pod strip shows "Your pod is forming" if unmatched | 3-line intro sheet once (C-31) | "Your pod is being matched. Meanwhile, today's Chai is ready." / "तुम्हारा पॉड बन रहा है। तब तक आज की चाय तैयार है।" |
| **Loading** | Skeleton rows (static grey blocks, no shimmer animation on low-end devices to save GPU and battery) | Skeleton card in zone layout | — (no spinner text) |
| **Offline, content cached** | Full function; small "Offline · synced 06:02" chip in neutral colour | Cards readable; MCQ answers queued; Save works locally | "Offline. Today's Chai was saved earlier." / "ऑफ़लाइन हो। आज की चाय पहले से सेव है।" |
| **Offline, nothing cached** | Tasks ② and ③ still usable if their question packs are cached; Chai row says unavailable | Empty card with retry | "No internet, and today's Chai hasn't downloaded yet. We'll fetch it as soon as you're back online." / "इंटरनेट नहीं है और आज की चाय अभी डाउनलोड नहीं हुई। नेट आते ही ले आएँगे।" |
| **Slow/2G** | Text-first; images off; Hindi fonts bundled (no web-font fetch) | Card text ≤ 3 KB each; whole stack ≤ 25 KB compressed JSON [Inference] | — |
| **Not yet published** (before ~05:30) | Chai row shows ETA | — | "Today's Chai is brewing. Ready by 6 am." / "आज की चाय बन रही है। सुबह 6 बजे तक तैयार।" |
| **Empty** (no news day / holiday) | Chai becomes "Revision Chai" (5 saved or high-yield static cards) | Same layout, `type=revision` | "Quiet news day. Here are 5 from your saved deck instead." / "आज ख़बरें कम हैं। तुम्हारे सेव किए कार्ड में से 5 लो।" |
| **In progress** | Row shows "3 of 5 read" | Resumes at next unread (C-12) | "Welcome back, 3 to go." / "वापसी पर स्वागत, 3 बाक़ी।" |
| **Chai done** | Row ✓ | End panel (C-11) | See §7.5 |
| **All 3 done** | Task block collapses; "done for today" panel (T-08) | — | See §7.5 |
| **Night** | Close the Day promoted (T-07) | — | See §7.6 |
| **Card corrected** | — | "Corrected" line in Zone 6 (C-30) | "Corrected 11 Oct: date of order fixed." / "सुधार 11 अक्टूबर: आदेश की तारीख़ ठीक की।" |
| **Tragic story in stack** | Stack chip shows no emoji | Skip line shown; Chotu off (C-21) | See §7.4 |
| **Results day / quiet mode** | Tasks reduced to 1 optional; Chotu off; pod strip shows "Waiting room" | Chai optional, no MCQs | "Big day. Nothing is due today." / "आज बड़ा दिन है। आज कुछ भी ज़रूरी नहीं।" |
| **Error (server)** | Cached tasks remain; Chai retry | Retry button, no blame | "Something broke on our side. Trying again." / "गड़बड़ हमारी तरफ़ से है। फिर कोशिश कर रहे हैं।" |

**Engineering note [Inference]:** prefetch the next day's stack via WorkManager at night on unmetered or charging conditions, with a fallback to the first app open. Store it in Room. Bundle subsetted Noto Devanagari. Keep Today usable on 2 GB RAM devices with Compose baseline profiles. Counterpoint notes India's entry tier (<₹15k) is "under pressure" but premium is only 22% of 2025 shipments, so most users are on non-premium devices. https://www.fonearena.com/blog/474743/india-smartphone-market-2025-counterpoint.html

---

## 12. Sample Chai Card (ILLUSTRATIVE: verify every fact before publishing)

> ⚠️ **Illustrative only.** This card models a real-style story (the Supreme Court's November 2025 advisory opinion on the Presidential Reference about Governors' timelines for assenting to state bills). Facts are given as the author recalls them and **must be verified by an editor against the opinion text** before any real use. The PYQ shown is a related-topic example and must be confirmed in the PYQ database.

**English**

- **Chips:** `GS2` · `Polity: Centre-State relations` · `Prelims + Mains` · `Static: Art. 200, 201, 143`
- **Tone:** NEUTRAL (no Chotu line)
- **Headline:** Supreme Court: no fixed deadline for Governors on state bills
- **Summary (≈80 words):**
  The Supreme Court gave its opinion on a question the President sent it under Article 143. It said courts cannot set fixed time limits for Governors, or the President, to act on bills passed by state assemblies.
  The Court also said a Governor cannot sit on a bill forever. Long, unexplained delay can be examined by courts in a limited way.
  It rejected the idea of "deemed assent", where a bill becomes law automatically after a deadline.
- **Why this matters for UPSC**
  - **Mains (GS2):** a live example of cooperative vs confrontational federalism and the Governor's discretion.
  - **Prelims:** know the Governor's options under Art. 200 (assent, withhold, return, reserve for President) and what Art. 143 does.
  - **Revise:** Governor's powers · Centre-State legislative relations ›
- **Exam Corner** (collapsed)
  - **MCQ:** *Under Article 200, which of the following is NOT an option available to a Governor when a state bill is presented?* (a) Give assent (b) Withhold assent (c) Reserve it for the President (d) **Refer it directly to the Supreme Court for an opinion** → Answer (d). Only the President can seek the Court's opinion, under Art. 143.
  - **Key facts:** ① Advisory opinion under Art. 143 (five-judge bench) ② No court-imposed timelines; no "deemed assent" ③ Limited judicial review of prolonged inaction.
  - **PYQ:** Related topic: Governor's legislative powers, GS2 Mains [editor to attach verified PYQ ID, e.g. 2022 question on Governor's ordinance powers, pending confirmation]
- **Glossary:** *Advisory opinion*: the Court's view given to the President on a legal question; it is not a judgment between two parties. / *सलाहकारी राय*
- **Footer:** Sources: Supreme Court opinion (Presidential Reference No. 1 of 2025) · PIB · The Hindu · Summary drafted by AI from these sources · Checked by [editor], [date] ✓ · Spot a mistake? Tell us · 2 min read

**हिंदी (same card, native Hindustani register)**

- **चिप्स:** `GS2` · `राजव्यवस्था: केंद्र-राज्य संबंध` · `Prelims + Mains` · `स्थैतिक: अनुच्छेद 200, 201, 143`
- **शीर्षक:** सुप्रीम कोर्ट: राज्य के बिलों पर राज्यपाल के लिए कोई तय समय-सीमा नहीं
- **सारांश:**
  राष्ट्रपति ने अनुच्छेद 143 के तहत सुप्रीम कोर्ट से राय माँगी थी। कोर्ट ने कहा कि अदालतें राज्यपाल या राष्ट्रपति के लिए विधानसभा से पास बिलों पर फ़ैसले की तय समय-सीमा नहीं बाँध सकतीं।
  साथ ही कोर्ट ने कहा कि राज्यपाल किसी बिल को हमेशा के लिए रोककर नहीं बैठ सकते। लंबी और बिना वजह की देरी की अदालत सीमित जाँच कर सकती है।
  "मानी गई अनुमति" (deemed assent) का विचार, यानी समय-सीमा के बाद बिल अपने-आप क़ानून बन जाए, कोर्ट ने नहीं माना।
- **UPSC के लिए क्यों ज़रूरी**
  - **Mains (GS2):** संघवाद और राज्यपाल के विवेक का ताज़ा उदाहरण।
  - **Prelims:** अनुच्छेद 200 में राज्यपाल के विकल्प (अनुमति देना, रोकना, लौटाना, राष्ट्रपति के लिए आरक्षित करना) और अनुच्छेद 143 क्या है।
  - **दोहराओ:** राज्यपाल की शक्तियाँ ›
- **फ़ुटर:** स्रोत: सुप्रीम कोर्ट की राय · PIB · The Hindu · सारांश AI ने इन स्रोतों से बनाया · जाँचा: [हिंदी एडिटर], [तारीख़] ✓ · कोई ग़लती दिखी? बताओ

**LIGHT companion example (for Chotu, illustrative):** *"Odisha's [sweet] gets a GI tag"* → chips `GS1 Culture` · `GS3 IPR` · `Prelims`; Chotu (AI): "Geography you can eat. GI protects the name, not the recipe: classic Prelims trap."

---

## 13. Mapping build rules to the IxDF canon (named principles)

| Principle (IxDF/NN/g canon) | Where it shows up | Rules |
|---|---|---|
| **Design thinking** (empathise → define → ideate → prototype → test) | Personas from brief → journey map (§9) → competitive teardown (§2) → wireframes (§10) → 3×5 test rounds (§8) | whole doc |
| **User journey mapping** | Day-in-the-life map with emotions per stage and per-persona deltas | §9, T-07 |
| **Nielsen #1 Visibility of system status** | Progress fraction, stack dots, offline chip, "Checked by", correction lines | T-04, C-02, C-24, C-30, states |
| **#2 Match with the real world** | "Chai", "Close the day", Hindustani register, Indian number terms | C-18, §7 |
| **#3 User control and freedom** | Swap task, skip tragic card, carry to tomorrow, Chotu off, countdown opt-in | T-02, T-05, T-09, C-23 |
| **#4 Consistency and standards** | Fixed 6-zone card; M3 NavigationBar; same task row pattern | §3(c), T-03 |
| **#5 Error prevention** | Verified PYQ DB; no publish without human check; MCQ key verification | C-25-C-27 |
| **#6 Recognition rather than recall** | Lens chips, glossary sheet, static-link chips, resume position | C-06, C-12, C-17 |
| **#7 Flexibility and efficiency** | Swipe as accelerator; "See all 5" overview; part-time mode | C-02, C-03, T-02 |
| **#8 Aesthetic and minimalist design** | 3 tasks; no header badges; no images by default | T-01, T-06, C-14 |
| **#9 Help users recover from errors** | Report-a-mistake flow; kind wrong-answer copy; retry states | C-29, §7.4, states |
| **#10 Help and documentation** | About Chai Cards; first-open intro; glossary | C-31, C-17 |
| **Information architecture / card sorting** | GS-paper taxonomy for chips and saved deck. **Run an open card sort** with 15-20 aspirants (Hindi and English) on where saved cards and the archive should live (Practice vs a separate tab) and on chip labels ("Static" vs "Basics" vs "मूल विषय") [Inference] | C-06, C-09 |
| **Progressive disclosure** | Exam Corner collapsed; glossary on tap; overview toggle; 2 levels max | C-08, C-17, C-03 |
| **Hick's law** | 3 tasks, swap-from-3, 2 end-state actions | T-02, T-08, C-11 |
| **Miller / Cowan (working memory)** | ≤4 lens chips; ≤3 bullets; ≤3 key facts; ≤4 home blocks | C-06, C-07, C-08, T-01 |
| **Sweller (cognitive load)** | Extraneous load cut (no images, no ads, fixed layout); intrinsic load scaffolded (glossary, static link) | C-14, C-17, C-07 |
| **Gestalt: proximity / common region / similarity** | Each card zone in its own region; chips share shape and colour by type (GS paper = filled, topic = outlined); task rows share a container | §10 wireframes |
| **F-pattern / layer-cake scanning** | Lens chips + headline on the first two "bars"; bold axiom heading; front-loaded summary sentences | C-04-C-07 |
| **Mental models** | "Deck you keep" (save, revise) rather than "feed you throw away"; Close the Day as a diary, not a scoreboard | C-09, C-11, T-06 |
| **Usability testing methods** | Moderated think-aloud, 5 per round × 3, own devices, Hindi-led sessions, SUS + comprehension rubric | §8(c) |
| **Calm technology** | No red, no countdown, end states, forgiving counts | T-04-T-09 |
| **Accessibility (WCAG 2.2, Android)** | Single-pointer alternatives to swipe; 48 dp targets; font scale 200% | C-02, T-03, C-20 |

---

## 14. Open questions to validate

1. Does anyone in Hindi-medium sessions *want* the countdown? (It decides the T-05 default.)
2. Is 5 cards enough for aspirants used to 4 dense items of 6-9 minutes each? Test 5 vs 7 for perceived completeness against the finish rate.
3. तुम vs आप for the Hindi voice.
4. Does "Checked by [first name]" increase trust over "Checked by our editors"? (Trusting News suggests specificity helps; confirm locally.)
5. Chotu reception on NEUTRAL aspirant-life lines: delight or eye-roll?
6. Editorial capacity: 5 EN + 5 HI cards per day at about 20-30 minutes of human review per card means roughly 4-5 editor-hours a day [Inference]. Confirm staffing before launch (ties to brief Devil's advocate §4).

---

### Sources (consolidated)

- NN/g: F-pattern https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ · Progressive disclosure https://www.nngroup.com/articles/progressive-disclosure/ · Mobile content difficulty https://www.nngroup.com/articles/mobile-content-is-twice-as-difficult-2011/ · Empty states https://www.nngroup.com/videos/empty-states-in-application-design-guidelines/ · Hick's law https://www.nngroup.com/videos/hicks-law-long-menus/ · 10 heuristics https://www.nngroup.com/articles/ten-usability-heuristics/ · 5 users https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
- Reuters Institute DNR 2025: India https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/india · Executive summary https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary · Press Gazette on DNR 2024 https://pressgazette.co.uk/media-audience-and-business-data/news-avoidance-at-record-levels-as-four-in-ten-worn-out-by-news/
- Google PAIR https://pair.withgoogle.com/chapter/explainability-trust/
- Trusting News 2025 https://trustingnews.org/new-research-how-ai-disclosures-in-news-help-and-also-hurt-trust-with-audiences/ · MJC/Poynter 2025 https://hsjmc.umn.edu/news/2025-04-24-report-newsrooms-look-innovate-ai-americans-remain-skeptical-and-distrusting
- W3C WCAG 2.2 SC 2.5.1 https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures · Android touch targets https://support.google.com/accessibility/android/answer/7101858
- Smashing (carousels, citing NN/g) https://www.smashingmagazine.com/2022/04/designing-better-carousel-ux · Baymard subpages and collapsed sections https://baymard.com/research-articles/avoid-using-subpages
- GOV.UK writing guidance https://www.gov.uk/guidance/content-design/writing-for-gov-uk · Federal Plain Language Guidelines (archived) https://webarchive.library.unt.edu/web/20121006190813mp_/http:/www.plainlanguage.gov/howto/guidelines/FederalPLGuidelines/TOC.cfm
- Hindi register: Deccan Herald (PTI) 2011 https://deccanherald.com/india/prefer-hinglish-words-over-pure-2459817 · Nehru Archive 1958 https://nehruarchive.in/documents/use-of-simple-hindi-in-official-work-12-march-1958-823q2 · Devanagari typography https://indiafont.com/blog/indian-typography-tips · Hindi readability research (ACL) https://preview.aclanthology.org/fix_video/W14-5134.pdf
- Humour: McGraw et al. https://www.livescience.com/23062-joke-tragedy.html · Coronel et al. (secondary) https://www.rarejob.com/dna/2021/03/05/humor-can-help-people-remember-political-news-research-finds · Instructional humour review https://pmc.ncbi.nlm.nih.gov/articles/PMC11814177/
- Learning science: Cepeda et al. 2006 https://pubmed.ncbi.nlm.nih.gov/16719566/ · Roediger & Karpicke 2006 https://doi.org/10.1111/j.1467-9280.2006.01693.x
- Habit and streaks: Silverman & Barasch 2023 https://www.psychologytoday.com/us/blog/ulterior-motives/202306/how-broken-streaks-sap-motivation · Calm tech https://calmtech.institute/calm-tech-principles · Duolingo https://blog.duolingo.com/new-duolingo-home-screen-design/ · Finch critique https://ixd.prattsi.org/2025/09/design-critique-finch-ios-app-2/
- Competitors: Inshorts https://www.exchange4media.com/digital-news/news-in-shorts-cuts-the-clutter-for-the-new-generation-news-reader-60818.html · Axios https://journalism.co.uk/news/how-axios-is-reinventing-text-journalism-with-smart-brevity-/s2/a966845 · Morning Brew https://voices.media/thursday-15th-september-why-tone-of-voice-is-vital-to-morning-brews-newsletter-success/ · Google News https://www.androidcentral.com/apps-software/google-news-customizable-following-feed · Drishti https://www.drishtiias.com/daily-news-analysis · Anantam https://anantamias.com/current-affairs/18-may-2026/ · Vision IAS https://visionias.in/blog/current-affairs/introducing-vision-ias-digital-current-affairs-2-smarter-faster-more-personalized · SuperKalam https://superkalam.com/current-affairs/daily-news-analysis · Newspapers for UPSC (PW) https://www.pw.live/exams/upsc/best-newspaper-for-upsc-exam/
- Market: Counterpoint via FoneArena https://www.fonearena.com/blog/474743/india-smartphone-market-2025-counterpoint.html
- Product brief: `scratchpad/research/brief.md` (personas §2, day-in-life §3.3, emotions §4, Today mockup and visual direction)
