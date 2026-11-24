# Database reads review (24 Nov 2026)

## Decision
**Move to Cloudflare Workers Paid ($5 a month) before the first 500 students join. This week is fine.** The fixes on
this branch cut today's reads by about 90%, so there's no emergency once they're deployed. But on the free plan, one
heavy admin page, a crawler wave or a big content import can still push the account over the daily cap, and then
every student's request fails until 05:30 IST. $5 a month removes that risk with about 160 times the headroom.
How to upgrade: `artefacts/runbook-workers-paid-2026-11-24.md`.

Could we stay free with 500 students? For the student app alone, yes: about 10% of the free cap after these fixes. Not
safely, though: the admin analytics pages (see "Still to fix") would use more than half the cap by themselves at
around 500 active members.

## What happened
Cloudflare emailed on Sun 22 Nov: the account had used 94% of the free plan's 5,000,000 database rows read that day.
A "row read" is every row the database looks at, even ones it doesn't return. Over the last 7 days the account read
11.8 million rows, about 1.7 million a day on average and 4.7 million at the peak. Almost none of it came from students.

| What | Share of reads (7 days) | Rows per call | Calls a day |
|---|---|---|---|
| "Has the library changed?" check before serving the library | **84%** (9.9M) | 1,344 (the whole library) | ~1,050 |
| Rebuilding the whole library after a change, and hourly | 10% (1.2M) | 2,667 | ~60 |
| Reading a few kinds of library item (website, Try one topic, shelf) | 4% (0.5M) | ~1,350 to return ~10 | ~55 |
| Everything else | 2% | | |

The "has it changed?" check ran on every public topic and past-paper page under `/learn` that wasn't already cached
nearby. Search engines crawl those pages, so the crawl drove the reads, not students. Production numbers come from
`wrangler d1 insights` (7-day and 1-day windows).

## What I changed (branch `claude/d1-row-reads-61d050`)
| Fix | Before | After |
|---|---|---|
| A one-row "library changed" counter, kept up to date by the database itself on every insert, update or delete (`migrations/0017_read_savings.sql`) | 1,344 rows per check | 1 row |
| An index on library kind and status | ~1,350 rows to return ~10 | only the matching rows |
| A few-kinds library answer is kept in memory until the library changes | read on every request | read once per change, per Worker |
| Sign-up count (read on every app open) and room member counts (every rooms list) kept for 5 minutes | every account or membership, on every call | once per 5 minutes per Worker |
| Daily AI cap and voice cap use running daily totals | every call made that day (up to 3,000 voice lines) | 1 or 2 rows |
| Season total (index on counter name and day) | every counter ever kept | that counter's days only |

Checked on a local copy with 1,360 library items, 500 accounts and 1,500 room memberships: the query plans moved from
full-table scans to index lookups as above, and the counter went up correctly on insert, update and delete. Before
the migration is applied the server falls back to the old check, so the deploy order doesn't matter, but **apply the
migration first** to get the savings.

**Expected now:** about 0.2 million rows a day at today's traffic (4% of the free cap), down from 1.7 million.

## Projection after the fixes
Assumptions: half of students open the app on a given day, an active student causes about 300 rows read a day (app
opens, Chai, practice, rooms, Chotu, events), shared work (cron, backups, library rebuilds, crawlers) is about 0.3
million a day, plus 20 rows per student for the cron's pod checks. The 300 is an estimate; check it with
`wrangler d1 insights` a week after launch.

| Students | Student app and cron | % of free cap (5M/day) | Admin analytics as they are today, 3 views a day | On Workers Paid |
|---|---|---|---|---|
| 500 | ~0.4M a day | ~8% | +2.7M (total ~60%) | far below the 25 billion a month included |
| 2,000 | ~0.7M a day | ~14% | +11M (**over the cap**) | still included |
| 10,000 | ~2.6M a day | ~52% | +54M (**over the cap**) | ~1.7 billion a month, still included |

If students turn out to read 3 times what I assumed, 10,000 students alone would pass the free cap. On Workers Paid
every row in this table fits inside the $5 a month (25 billion reads and 50 million writes a month included).

## Still to fix (not on this branch)
1. **Admin analytics** (`src/insights.ts`, `src/metrics.ts`) scan the whole `events` table five or more times per page
   view. Events grow with members and are never pruned. The fix is a daily summary table filled by the cron and read by
   the admin pages. That's the analytics session's area; I left them a note.
2. **Mock score bands** count everyone who shared that paper on each share. Fine now; at 10,000 students with a popular
   mock, up to ~0.6 million a day. A small score-count table would fix it.
3. **Pod rooms (Durable Objects)** keep their own small databases. Those have their own free daily limits too, which
   Workers Paid also covers.

## Alarm
Cloudflare already emails at high D1 use (that's how we found this). After the upgrade, add a billing alert in the
dashboard (runbook step 5). I'll re-run `wrangler d1 insights` after each big launch step.

## For the main session
- Apply `server/migrations/0017_read_savings.sql` to production, then deploy.
- Check after deploy: `SELECT n FROM library_rev` returns a row, and `/learn` pages still load.
- Test results and the check results are in the commit message.
