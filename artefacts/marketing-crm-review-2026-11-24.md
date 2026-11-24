# Marketing in admin: review and what's built (24 Nov 2026)

Branch `claude/marketing-crm-f8328b`. Not deployed; no migration applied to production. The main session merges and deploys.

## Decisions for the owner (up front)

1. **Deploy, then press "Count now" once** under Admin → Marketing → Lead magnets. After that it counts by itself every night at 00:30.
2. **Members on the People list:** new sign-ups join the list by themselves each night. To add everyone who signed up before today, press **"Add every member now"** on the empty People page (one-time; reads every account once).
3. **Website page views:** the website (repo `aspiran-web`) needs one small addition so free pages count as "Seen" (snippet below). Until then, "Seen" only counts the open demo (Try one topic).
4. **Tag your links.** Any link you share: add `?utm_source=whatsapp&utm_medium=group&utm_campaign=pyq` (source = where you posted it, campaign = the lead magnet's short name). The daily Telegram and WhatsApp posts already do this.
5. **Existing automatic emails (not changed, your call):** two emails already go out by themselves, both with the person's yes: the "your seat is saved" email when someone leaves an email on aspiran.in (and the reply to coaching centres), and the one day-3 email in Try one topic. Everything new in Marketing is a draft only. Say if you want the two existing ones to become drafts too.

## What I found (review)

| Area | What exists | Gap |
|---|---|---|
| Website leads (`web.ts`, admin "Website leads") | What visitors tell website Chotu; contact only with a ticked yes (`consent_at`); source = `utm_source/medium/campaign` or the referring site; CSV | No stage, notes, tags or follow-up date; no way to delete one person on request from admin |
| Try one topic (`try.ts`, admin "Try one topic") | Answers by session; contacts with the consent text; visitor can delete their own | Contacts are a bare table; not joined to anything else |
| Growth (`metrics.ts`) | Installs by source (`?src=` or `utm_source:utm_medium`), demo funnel, paid funnel | Web `first_open` dropped `utm_campaign`, so a link couldn't name its lead magnet; reads `events` heavily on each load (the D1 review covers this) |
| Daily posts (`posts.ts`) | Telegram post sent automatically to the channel; WhatsApp text and picture to forward by hand; links tagged `utm_source=telegram|whatsapp`, `utm_medium=chai|pyq` | Fine. Results now show under Lead magnets (Sample Chai, Free PYQ sets) |
| Coaching centres | Centres are made by hand; leads come in through Website leads (`details.centre`) and the owner gets an email | No pipeline for centres that asked but aren't set up |
| Sign-up source | `installs.source` + `installs.member_id` once the install signs in | No index on `installs.member_id`; nothing tied a sign-up to the lead who left the same email |
| Follow-up | Two automatic emails with consent (above). No WhatsApp sending anywhere (good) | No list of who to follow up with, or when |
| Page views on aspiran.in | None on our server (the site is static on GitHub Pages) | Lead magnets had no "seen" number |

## What's built

Admin gets a new **Marketing** group with three pages.

**Lead magnets** (anyone with "analytics"): one line per magnet (Free PYQ sets, Sample Chai, Newspaper reader sample, For coaching centres, Try one topic, Chotu on the website, and "Not from a lead magnet") with Seen → Opened the app → Left a contact → Signed up → Plus, and sign-ups per app visit. 7, 30 or 90 days. Admins can edit the list (name, short name, link, words that mark it). A card explains how to tag links.

**Sign-ups** (analytics): sign-ups a day (chart), sign-ups by channel day by day (Website, Telegram, WhatsApp, Invite code…), a table by source, and the website path: page views → opened the app → left a contact → signed up → Plus. Steps are counted separately (we don't follow people from the website into the app), and the page says so.

**People** (admins only, because it shows contacts): one list of leads, coaching centres and members, with stage (Lead, Signed up, Active, Plus, Gone quiet), type (student, coaching centre, other), where they came from, language, tags, notes and next follow-up date. Views: Due today, All follow-ups, Everyone, or one stage; type filter; search; spreadsheet (CSV). Per person: **Message** (a draft in English or Hindi from four templates: welcome, nudge, coaching-centre call, a gentle word about Plus; Copy, Open in WhatsApp, Open in email; nothing is sent by the server; then "I sent it" notes the day and sets the next follow-up), **Edit**, and **Delete everywhere** (for data requests). "Add a person" for people met offline.

How people arrive: every night, website leads and Try one topic contacts that came with a yes, and new sign-ups. A sign-up whose sign-in email or phone matches a lead joins that lead's row. Members' stages follow the app (Plus if paid, Signed up in the first 7 days, Active if seen in the last 14 days, else Gone quiet) unless the owner sets one by hand.

### Privacy
- A lead's contact is on the list only with their yes; the consent words and time are kept and shown. Adding by hand with a contact requires writing how they agreed.
- Members show **without** phone or email (those were given for signing in, not marketing), unless they first left it as a lead with their yes. The message window says to reach them in the app instead.
- Every draft ends with "Reply STOP and we won't message again" (except the centre call request).
- Delete everywhere removes the row and what they left on the website (lead, chats) or in Try one topic (answers, contact, day-3 email), by visitor, session and contact; a hash is kept in `privacy_requests` (`lead_delete`). A member's account is erased under Data requests, which now also removes them from the list; "Delete what I sent" in Try one topic does too. A member's data export now includes their row.
- Not in backups (on purpose: backups hold no lead contacts today).

### Database reads (near the 5M/day free cap)
- Pages read the small rollup tables only (`mkt_daily`, `mkt_hits`), never `events`. A 30-day page reads roughly a few hundred rows.
- The nightly count (00:30 IST) reads only yesterday through indexes: `events(name, day)`, `web_leads(last_seen)`, new `installs(member_id)`, new `try_contacts(at)`.
- The People list reads one page (up to 300) through an index; counts per stage are kept in one settings row. Search and the full spreadsheet read the whole list, only when asked.
- The nightly stage refresh reads about three rows per member on the list. At 2,000 members that's about 6,000 rows a night.
- Each website page view is one counter write (plus one for the per-network cap of 200 a day). The website sends it once per browser per page per day.

### Files
- `server/src/marketing.ts` (new): tables, rollup, reports, the list, admin routes, `POST /web/hit`.
- `server/migrations/0017_marketing.sql` (new): the same tables and indexes. Optional to run; the server makes them on first use.
- `server/src/admin.html`: the Marketing group and its three pages (one block before Payments).
- Small hooks: `admin.ts` (one line registers the routes), `web.ts` (`/web/hit`), `index.ts` (00:30 nightly), `privacy.ts` (erase and export), `try.ts` ("Delete what I sent").
- `server/public/app/metrics.js`: the web app's first visit now keeps `utm_campaign` (as the referrer, utm keys only).
- `server/test/marketing.mjs` (new suite, in `npm run test:all`).

### Checks
`npm run check` passes. `npm run check:schema` passes. `npm run test:all` passed 27 of 28 suites; `friends` failed once while the local server reloaded mid-run (an admin page edit landed during the run) and passes on its own re-run. The new `marketing` suite passes.

## For the website session: count page views

On each free page (PYQ sets, sample Chai, newspaper reader sample, for-coaching, home), once per browser per page per day:

```js
const k = 'aspiran-hit:' + MAGNET + ':' + new Date().toISOString().slice(0, 10);
try { if (!localStorage.getItem(k)) { localStorage.setItem(k, '1');
  fetch('https://app.aspiran.in/web/hit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ magnet: MAGNET }), keepalive: true }); } } catch {}
```

`MAGNET` is the short name: `pyq`, `chai`, `newspaper`, `coaching`, `try`, or `site` for the home page. Also add `utm_campaign=<short name>` to each page's links into the app.

## Not done / next
- Website snippet above (other repo).
- People who left a contact before the sync window: the first sync reaches back 90 days.
- Plus bought on Play shows under "Plus" from the `paid` event, same as web.
- No WhatsApp Business API or bulk email: deliberately not built (no automatic sending).
