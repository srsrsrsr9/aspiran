# Analytics in the app and reports in Admin: scope (20 Nov 2026)

Owner's ask: analytics inside the app, then pull data from PostHog and show useful reports in Admin, for the owner and
for each organisation (coaching centre).

## What already exists

- **Two places record what people do.**
  - Our own `events` table in the database. It feeds Admin → Growth with installs by source, activation, return
    by signup week, ratings and the demo funnel.
  - **PostHog** in the web app and Android since 12 Nov. It records screen names, taps (without their words), errors
    and masked replays (web only). Private screens (pod, rooms, Chotu talk, Calm, Me) are never recorded. Anyone
    can switch it off in Me → Privacy. The website aspiran.in also sends to PostHog.
- **The gap is what gets recorded.** The web app sends about 12 named events and Android 6, mostly the demo,
  app open, Chai read and onboarding. Almost nothing records studying itself (notes, audio, videos, practice, mocks,
  answers, review), nor the steps to paying.
- **Organisations** already see per-student activity (days active, focus minutes, their question sets, doubts) and
  a CSV. The admin-ui session has just rebuilt that console.
- **Admin cannot read PostHog.** Reading it needs a PostHog *personal* API key, which is a secret only you can add.

## The design, in one line

**Owner reports use both sources; organisation reports use only our own database.**
- PostHog knows the website, the demo, screens and devices.
- Our database knows members, pods, institutes and payments.
- An organisation must only ever see its own students. Sending its questions to PostHog would add risk and give no
  benefit, so organisation reports never touch PostHog.

## Part 1: record the studying (web and Android, same names)

Each event carries small codes and numbers only, never text a person wrote:

| Area | Events |
|---|---|
| Learn | `note_open`, `note_done` (node, minutes), `audio_play`, `audio_done` (minutes, lang), `video_play`, `video_done` (series, seconds) |
| Practise | `practice_answer` (node, right/wrong, how sure), `mock_start`, `mock_done` (paper, score kept private), `pyq_open` |
| Write | `answer_submit` (paper), `answer_rewrite` |
| Remember | `review_done` (cards, kept), `flashcard_session` |
| Pods | `pod_message` (count only), `pod_session` |
| Money | `plus_view` (where from), `paywall_shown` (which moment), `checkout_started`, `paid` (server already) |
| Reach | `share` (what kind), `notification_open`, `search` (no query text), `install_referrer` |

- **Android:** brought up to the same list as the web app.
- **Your step:** update the Play Data safety form before the next Android upload (runbook provided).

## Part 2: owner reports in Admin → Insights (new tab)

Each report is a card with one sentence saying what it means and a 30-day trend.

1. **Today:** visitors, demo starts, sign-ups, active members, Plus checkouts and payments, against last week.
2. **Funnel:** website → demo → day-3 recall → sign-up → active in week 1 → Plus page → paid. Each step shows a
   count and where people drop.
3. **Where people come from:** source and campaign (Telegram, YouTube, posts, the books' QR codes,
   coaching-centre invites), with the sign-ups and payments each brought.
4. **Return:** day 1, 7 and 30 return by signup week (already in Growth, moved here).
5. **What gets used:** most-used features, and the notes, videos and audio people open and finish. It also shows
   what they start and drop (which piece loses people).
6. **Learning health:** questions answered per active member, how many review items are kept after 3 days, Mains
   answers written and rewritten, and the topics most often wrong.
7. **Where it breaks:** errors by screen, slow screens, crashes (PostHog), with a link to a masked replay.
8. **Organisations:** each centre's students, how many are active each week, answers checked, and Plus share
   earned.

**Sources**
- Cards 2, 3 and 7, and the website part of 1, come from PostHog's query API.
- The rest come from our own database.
- PostHog results are fetched at most once an hour and kept, so the page is fast and stays within PostHog's limits.
- Until you add the key, the PostHog cards say "not connected" and everything else works.

## Part 3: organisation reports (institute console → Reports)

Only that centre's students who have joined it, as they agreed when joining:

1. **This week, per batch:** active students, study minutes, questions answered, answers written, doubts
   asked and answered.
2. **Weak topics per batch:** the syllabus topics the batch gets wrong most, with how many students and a link to
   set a question set on it.
3. **Gone quiet:** students not active for 5+ days (this list already exists; it gains "last did").
4. **Answer checking:** copies submitted, checked, average time to check, rewrites made.
5. **Per student** (already there): adds topics covered, practice accuracy and answers written.
6. CSV export of all of it.

**Rules:**
- No class rankings, no leaderboards, no "top students" list.
- Batch figures show only when at least 5 students are in the batch, so nobody is singled out.
- Nothing from pods, Chotu, Calm or any private writing ever reaches an organisation.
- A student who leaves the centre drops out of its reports from that day.

## Not in this job (say if you want them)

- A private **"Your progress"** page for the aspirant (minutes, topics covered, recall kept), never public, no streaks.
- Email digests of the owner reports (weekly, Monday morning).

## What you need to do

1. Make a PostHog **personal API key**: PostHog → Settings → Personal API keys → read-only, scope "query", project 729724.
2. In Terminal: `cd ~/Documents/app/server`, then `npx wrangler secret put POSTHOG_PERSONAL_KEY --env production`, and
   paste it when asked. I never type keys.
3. Update the Play Data safety form before the next Android upload.

## Size and order

About one long session:
- Part 1 web and server
- Parts 2 and 3
- Part 1 Android
- tests and a privacy-page line ("what we count")
It can run alongside the deploy of everything else, or be built first and deployed with it.
