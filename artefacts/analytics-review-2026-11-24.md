# Admin analytics review, 24 Nov 2026

## Decisions for you (owner)

Owner said "go ahead" (24 Nov) to the recommendations:

1. **Daily roll-up table: yes, built.** See "Second round" below.
2. **Website lead → sign-up link: yes, handled by the marketing session** (branch `claude/marketing-crm-f8328b`):
   its nightly `mkt_daily` table counts website visit → lead → sign-up → Plus by source, and its people list matches a
   lead to a member when they sign up with the same contact. Not duplicated here.
3. **Per-person activity for support: no, for now.** The admin page promises "counts, never who".
4. **Merge the four analytics pages: later**, after a week or two with the new Home summary.

## Second round, 24 Nov: the nightly roll-up (built, not deployed)

- New table `stat_daily(day, metric, key, n)` (`server/src/stat.ts`, `migrations/0018_stat_daily.sql`, plus an index
  `events(day)`). At 01:00 IST the server counts yesterday's events once: active and studying members, use of each
  feature, opens and finishes per note/audio/video, practice answers and topics most wrong, review, sign-ups, demo,
  Plus page, paid. For each sign-up day it also records, once the window has passed: back next day, back in week 2,
  back a month on, and week-1 steps (onboarding, pod, first Chotu chat, a ritual). Counts only, no ids.
- The first nights fill in the last 40 days, 10 a night. Home says how many of the last 30 days are counted so far.
- **Home's "How it's going" now reads only this table** (a few hundred small rows), never the events table.
- **Insights and Growth are kept for an hour** after they're worked out, with a "Work it out now" button, so repeat
  visits don't re-count the events table. Moving them fully onto the roll-up is the next step if reads are still high.
- Staff can count a day by hand: `POST /admin/api/stats/roll {"day": "YYYY-MM-DD"}` (today if no day).
- Before deploy: run `migrations/0018_stat_daily.sql` on production (building the `events(day)` index reads the
  events table once). Migration 0017 is used by two sibling branches; 0018 is this one.
- Small differences from Insights: "Times" and opens are summed day by day, so someone who opens the same note on two
  days counts twice; features show "people on the busiest day" rather than distinct people over 30 days.
- Not tested end to end: the return and week-1 numbers need real days to pass. The test covers counting today and the
  summary reading it.

## Built on this branch (not deployed)

- **Home → "How it's going"**: three cards, Marketing, Product, Content, from data we already collect.
  Worked out at most once an hour on the server (with a "Work it out now" button), so opening Home stays cheap.
- **Members, in plain words**: "Person" (email, phone or @username), "Signs in with", "Uses" ("Website (aspiran.in)"
  or "Android app, version 0.5.0"), "Pod" ("In a pod" / "Not in a pod"), "joined" date. The two long codes are now
  folded under a "Codes" link with one sentence saying what they are.
- **History is now "Access log"**: titled with the person's name, says what it records, always shows when the account
  was made, uses plain words ("Access switched off", "Password reset"), and explains the empty case.
- **"Analytics" renamed "Daily counts"**, with a line pointing to where the real product numbers are.
- Test added (`server/test/insights.mjs`): the summary is staff-only, has all three groups, holds no emails, and the
  second look comes from the hour's copy. `npm run check` and the insights, metrics, auth and smoke suites pass.

## What the owner saw, explained

- **The long user ID** (`y8jYa1jf...`) is the sign-in code from Google/Firebase. It's how the server knows the account.
- **The long hex code** is the *member code*: a random code made at first sign-in. It ties the person's pod, practice,
  payments and data export together without using their email. Staff only need it to match a support request.
- **History** showed only staff actions on the account (switched off, restored, password reset, data deleted). Most
  accounts never have one, so it always said "No changes yet". It never showed study activity, and by design it
  shouldn't.

## Section by section

| Section | What it shows | Where the data comes from | What's missing or confusing |
|---|---|---|---|
| Home | Needs-you list, accounts, active today/week/month, pods, Plus, money, Chai, library, helpers, leads, centres | `accounts`, `pods`, `reports`, `payments`, `candidates`, `library`, `llm_calls`, `web_leads`, `institutes` | Had nothing on marketing sources, return or content use. **Fixed** with "How it's going". |
| Members | Sign-in accounts, pod merges, pod members | `accounts`, `members`, `account_audit` | Raw codes, "History" with no context. **Fixed** for sign-in accounts. Pod members table still lists by member code (fine for support; it's a safety tool). |
| Insights | Today vs last week, funnel, sources, return, what gets used, learning health, errors, centres | `events`, `installs`, `institutes`, PostHog (not connected) | Good content, but heavy: some 20 separate counts over `events` each time it opens. Website, campaigns and errors are blank until the PostHog read key is added. |
| Daily counts (was Analytics) | Bar charts per day: web app opens, downloads, pod messages, reports, safety alerts, consents; who approved content | `daily_counts`, `briefs`, `audit` | Name clashed with Insights; said "Nobody is tracked", which reads oddly next to Insights. **Renamed and re-worded.** |
| Growth | Pod test, installs by source, demo funnel, invite codes, activation, return by week, one-tap ratings, day-7 check-in, paid funnel | `events`, `installs`, `feedback` | Overlaps Insights (return, sources). Also scans `events` on every open. |
| Website leads | What visitors told Chotu, contacts left with consent, chats | `web_leads`, `web_chats` | No link to whether the visitor later signed up (decision 2). "Came from" is free text from the page. |
| Try one topic | Answers per question on the open sample, written answers (CARE first), contacts | `try_feedback`, `try_contacts`, `try_updates` | Loads every row (up to 10,000) and counts in the browser; fine now, slow later. Question keys are code names (e.g. `recall-did`). |
| Daily posts | Today's Telegram/WhatsApp post and send log | settings, R2 | Not analytics: no record of clicks back from posts beyond `?src=` on installs. |

## What we already collect (good news)

The server already has a careful events list (`server/src/metrics.ts`): codes and numbers only, never text, never a
mock score. It covers first open with source and invite, sign-up, onboarding, pod joined, first Chotu chat, rituals,
Chai read, notes, audio (Listen), videos, practice answers, mocks started/finished, past papers, Mains answers, daily
review, flashcards, pod time and messages (counts), search (no query), share, Plus page, checkout, paid, refunded, the
open demo and the day-3 email. One-tap ratings and the day-7 check-in are in `feedback`. So the gap is mostly
**presentation and cost**, not collection.

## Recommended analytics set

Kept small. Counts of people, never who. No public scores, streaks or timers anywhere members can see.

**Marketing**
- Sign-ups this week vs last week. *(Home, built)*
- Installs, sign-ups and payments by source (`?src=` links, Play referrer, invite codes, centres). *(built)*
- Demo → sign-up → paid, last 30 days. *(built)*
- Website visitors and campaigns. *(needs the PostHog read key: owner runs `npx wrangler secret put POSTHOG_PERSONAL_KEY --env production`)*
- Website lead → sign-up. *(decision 2)*

**Product**
- Week-1 activation: joined a pod, first Chotu chat, did a ritual. *(built)*
- Came back next day; back in week 2. *(built)*
- Feature use by people: pods, Chai, practice, mocks, Chotu, Listen, notes, videos, review. *(built)*
- Pod test (still active in week 4). *(Growth, exists)*

**Content**
- Most opened notes, audio, videos, with share finished; the ones losing people. *(built)*
- One-tap ratings by moment; share "Helpful". *(built)*
- Topics most often wrong in practice. *(built)*
- Chai: cards read per day. *(event exists; add to the summary when the roll-up lands)*
- Where people drop off inside a piece (step reached). *(exists for the demo only; for notes and audio it would need a
  new "got to section N" event: ask before adding)*

## Keeping database reads low

- The new Home summary is worked out at most once an hour (kept in memory and in R2), whatever the number of visits.
- Insights and Growth still count from scratch on each open. Decision 1 (a nightly roll-up into one small table) fixes
  that for good. Until then: open Insights and Growth only when needed; Home is the everyday view.
- The sibling session working on database reads may touch the same queries; this branch didn't change any of them.

## Not done here
- No new tracking. No changes to the Android app.
- Not looked at in a real browser yet (checked by the page syntax check and the server tests only).
