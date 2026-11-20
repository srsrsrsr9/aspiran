# The day-3 payoff, and a faster first open (20 Nov 2026)

Sales build order step 1 (`artefacts/sales-build-order-2026-11-19.md`). Built on branch `claude/demo-day3-de3bbc`.
Not deployed: the main session merges and deploys.

## What a visitor sees

1. They try a topic with no account (`01-demo-cover.png`) and keep its cards.
2. Under the kept cards, and again on the finish screen: **"We'll ask you 5 of these again on Monday."** An email box,
   a consent tick ("Email me these questions once, on Monday.") and the privacy line: *We use your address for this
   one email and delete it as soon as it's sent. No newsletter, never shared. You can cancel here until then.*
   (`02-keep-day3-offer.png`, `03-consent-needed.png`, Hindi: `12-finish-offer-hindi.png`)
3. After sending: "Look for an email from Aspiran on Monday, 23 November", with **Cancel it** (`04-signed-up.png`).
4. Day 3, late morning: one plain email (`06-email-day3.txt`) with one link to answer and one link to stop.
   The address is deleted as soon as it's sent.
5. The link opens a page that works on any phone, no account: the 5 questions one at a time, the right answer and why
   after each (`07`, `08`, `09`), then privately **"You kept 4 of 5 after 3 days."** (`10-day3-kept-4-of-5.png`).
6. **Keep these cards** → "Join free, keep your cards" → the usual sign-up, which already says "Your 5 Federalism cards
   are in this browser" (`11-join-step.png`). Answering put the 5 cards in that browser's review, so they come along
   even if the email was opened on a different device from the demo.

Which 5: the visitor's own kept cards first, filled up from the topic's other Keep cards (Express keeps 3, so 2 come
from the whole topic). No timers, no public score; the result is only on their screen.

## The rules it keeps
- One email, ever, for each sign-up; asking again after it went doesn't send another.
- The address is deleted when the email is sent, when they cancel, after two failed sends, or a week past due.
- One stop link in the email, plus the List-Unsubscribe header so Gmail shows its own Unsubscribe.
- "Delete what I sent" on the demo also deletes the day-3 sign-up.
- Sent between 09:00 and 17:00 IST (cron slots 09:00, 09:30, 10:00, 11:00, 12:00, 17:00), at most 40 a run.
- No "AI" wording anywhere.

## Funnel (PostHog and our own events)
`try_day3_offer` (where: keep/finish) → `try_day3_signup` → `try_day3_sent` (server) → `try_day3_open` →
`try_day3_done` (kept, of) → `try_day3_join`, plus `try_day3_cancel`. Admin API `GET /admin/api/try/recall` gives
the same funnel in counts (no addresses).

## First open: measured before and after
The demo's first open showed "Loading…" for seconds. Cause: the app waited for sign-in setup and an account check
before drawing anything, even for a visitor; the topic only started downloading after all the app's code had
arrived; and the offline copy of the whole app (about the same size again) downloaded at the same time.

Fixes: the page starts downloading the topic straight away and preloads the app's code; a visitor's open page is drawn
before sign-in setup; the offline copy waits 8 seconds; a redraw no longer downloads the topic again.

Cold first open of `#try/path-pol-federalism` until the topic's title shows, headless Chrome with its own network
throttling, 5 runs each, median (locally, files uncompressed, so live numbers are lower for both):

| Connection | Before | After |
|---|---|---|
| Slow phone (300 ms, 750 kbit/s) | 7.7 s | 4.9 s |
| 4G (150 ms, 1.6 Mbit/s) | 3.8 s | 2.4 s |

What's left is mostly the size of the app's code (about 250 KB compressed, all loaded up front). A smaller start just
for the demo would cut it further; that's a bigger change, left for later.

## Owner: nothing to do before deploy
Resend is already set up. The new table is created on first use (migration `0015_try_recall.sql` records it).

To measure again: start a local server with the Federalism path approved, then
`node artefacts/demo-day3-2026-11-20/measure-first-open.mjs measure "http://127.0.0.1:8787/app/#try/path-pol-federalism" 5 300 750`
(needs Google Chrome; each run is a fresh browser).
