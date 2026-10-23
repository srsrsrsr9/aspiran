# Daily content plan (news first)

Host: option A on Cloudflare. Phones run the private AI. Cloudflare runs chat, schedules and the news pipeline. Workers AI writes **public** content only.

## 1. The daily rhythm (IST)

| Time | What lands in every pod | Made by |
|---|---|---|
| 05:30 | Pipeline fetches and drafts the news | Cloudflare cron + Workers AI |
| 06:30 | Editor approves the brief (5 to 10 min) | A human, on a simple admin page |
| 07:00 | **Morning Brief**: 5 to 7 items, each tagged to the syllabus | Chotu posts it |
| 13:00 | **Noon Quiz**: 5 MCQs built only from the morning items | Workers AI, checked at approval |
| 18:00 | **Mains Prompt**: one 150-word question from the day's top item | Workers AI, checked at approval |
| 21:30 | **Close the Day**: mood and what you studied | On the phone only, never uploaded |

Weekly: Sunday revision digest (the week's items plus a 15-question quiz). Monthly: a compilation members can save offline.

## 1b. News as the flagship: the "Chai Card"

Every news item is served as one card with fixed layers, read top to bottom in about a minute. The lenses are what make it UPSC content rather than plain news.

1. **What happened**: one or two sentences a 15-year-old could follow. No jargon. Any term that must stay is explained inline.
2. **Why it matters to you**: the real-life effect (prices, jobs, rights, your state).
3. **The UPSC lens**: only the 2 or 3 lenses that genuinely fit, each one or two lines.
   - **Law and Polity**: the Article, Act, or landmark case behind it.
   - **History**: where this started (a committee, a movement, an old dispute).
   - **Economy**: the concept underneath (inflation, fiscal deficit, MSP).
   - **Geography and Environment**: the place, the river, the ecosystem.
   - **Ethics and Governance**: the dilemma, for GS4 and the essay paper.
   - **International Relations**: who else is involved, and why India cares.
4. **Exam corner**: one Prelims trap ("don't confuse X with Y"), one Mains question, and 3 to 5 keywords to use in answers.
5. **Chotu's take**: one light line, only when the tone rules allow it (see below).
6. **Source**: the link, always.

Toggles on the phone: "Explain simpler", "In Hindi", and "Go deeper" (opens the linked background notes).

**Sample card (format only, check facts before use)**
> **What happened:** The Supreme Court said a Governor can't sit on a bill passed by the state assembly forever.
> **Why it matters:** Laws your state votes for can't be stuck in limbo indefinitely.
> **Law:** Article 200 lets the Governor assent, withhold assent, return the bill, or reserve it for the President. It sets no deadline. **History:** the Sarkaria and Punchhi Commissions both flagged Governor–state friction.
> **Exam corner:** Prelims trap: Article 200 (Governor) vs Article 111 (President). Mains: "Discuss the discretionary powers of the Governor in light of recent judgments." Keywords: cooperative federalism, constitutional morality.
> **Chotu:** "Even bills need a deadline. Unlike your revision plan, apparently."

### Humour rules

Each item gets a tone label when it's drafted, and the label decides what's allowed:

| Tone | Examples | Humour |
|---|---|---|
| **Light** | schemes, budgets, science, space, sports, odd facts | Yes: wordplay, aspirant-life jokes |
| **Neutral** | politics, elections, courts, foreign policy | Only about the concept or the exam, never about people or parties |
| **Serious** | deaths, disasters, violence, crimes, communal or caste issues, war, health crises, suicide | **None.** Plain, respectful tone; a helpline line where relevant |

The jokes are always about the idea or about aspirant life (chai, mock tests, revision), never about a person, party, religion, caste, region, gender, or a victim. When in doubt, the item is treated as Serious. The editor sees the tone label and can strip the joke with one tap. Members can flag a joke, and flagged jokes feed the style guide. Chotu's voice comes from a style guide of about 50 approved example lines that are fed to the model with each draft.

### Where the context comes from

The lenses must be right, so the model doesn't invent them. It looks them up in a **UPSC context library** that we curate: short notes on Articles, Acts, landmark cases, committees, historical events and economic concepts, written in our own words. Bare Acts and the Constitution can be quoted directly. NCERT and coaching notes cannot. The pipeline finds the relevant notes with embeddings and passes them to the model, and every lens on the card links to the note it came from. The library grows a little every day as approved cards add new entries, which is part of how the product gets better over time.

### Model note

The card format, humour and lenses ask more of the drafting model than plain summaries do. In Phase 1, the bake-off should compare Workers AI's larger free models on 20 real cards. If quality falls short, this public, non-sensitive drafting step is the first candidate for the paid online model manager. Private data is never involved.

## 2. Sources (allow-list only)

The pipeline reads only these. Nothing is scraped from social media.

- **Primary, reusable:** PIB press releases (RSS), PRS Legislative Research, RBI, Supreme Court judgments, ministry and NITI Aayog releases, Sansad TV.
- **Monthly:** Yojana, Kurukshetra, Economic Survey and Budget documents when released.
- **Newspapers (The Hindu, Indian Express, Down To Earth):** headline, link and **our own summary** only. We never copy their text or editorials. That keeps us clear of copyright.

The source list sits in the server config, so adding or dropping one needs no app update.

## 3. The news pipeline

1. **Fetch** the allow-listed feeds at 05:30 (a Cloudflare cron trigger).
2. **Dedupe and cluster** stories about the same event, using embeddings, so one event becomes one item.
3. **Score for UPSC relevance**: syllabus match, government source, exam-repeat topics. Keep the top 10 to 12 as candidates.
4. **Draft each item** with Workers AI as a Chai Card (section 1b): tone label first, then the layers, with lenses filled from the context library, plus the GS paper and syllabus tag (for example "GS2: Polity, Federalism").
5. **Check the draft automatically:**
   - Every number, name and date in the summary must appear in the source text, or the item is flagged.
   - Political items get a neutrality check: no adjectives about parties or people, and the government and opposition positions are stated plainly.
   - Llama Guard screens the output.
6. **Human approval**: the editor sees the candidates ranked, ticks 5 to 7, fixes any flags, and publishes. Nothing reaches pods unapproved.
7. **Publish**: the brief is stored once (D1 database), and each pod's Durable Object posts it as Chotu at 07:00. Phones cache it for offline reading.

**If Workers AI's free daily allowance runs out** (or a model is retired), the brief goes out as headlines, links and editor-written one-liners. The app never fails silently.

## 4. Personalisation stays on the phone

Every member gets the same brief from the server. The phone reorders it using its own embeddings and what the member chose or struggled with (optional subject, weak GS papers, quiz misses). None of that leaves the phone. A member can also ask Chotu on-device to "explain this simpler" or "in Hindi".

## 5. Who does what

| Role | Daily effort | Job |
|---|---|---|
| Editor (you, at first) | 10 min | Approve the brief, quiz and mains prompt |
| Workers AI | automatic | Drafts, tags, quiz questions |
| Phone AI | automatic | Ranking, simpler explanations, Hindi, the private journal |
| Guardian | automatic | Watches pod chat for distress; unrelated to news |

Later, trusted members can be invited as rotating editors, credited in the post.

## 6. Rollout

1. **Pod test (weeks 1 to 4): manual.** The editor writes the 07:00 brief by hand from PIB and the papers. This tests whether members read it before we automate anything.
2. **Phase 1: automated drafts plus human approval** (sections 3 and 5).
3. **Phase 2: on-phone personalisation**, the weekly digest and the monthly compilation.
4. **Phase 3: Hindi brief** drafted alongside English, approved the same way.

## 7. What we measure

- Share of members who open the brief by 09:00.
- Quiz attempts and scores per pod.
- Editor time per day, with a target of under 10 minutes.
- Corrections needed after publishing, with a target of zero.
- Free allowance used per day, to know when a paid tier is needed.

## Open points (to check during build)

- How many items fit in the free Workers AI allowance per day. Measure in Phase 1 rather than trust published figures.
- Whether Llama Guard is available on Workers AI, or runs as a separate step.
- PIB RSS feed stability, with ministry pages as the fallback.
