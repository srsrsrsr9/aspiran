# Admin and coaching-centre console: new look (20 Nov 2026)

Branch `claude/admin-ui-70082c`. Not deployed. The `institutes` flag stays off; no live flag was touched.
Screenshots here are from a local server with made-up data ("Vidya IAS Academy", 12 students).
`before-*` is how it looked, `after-*` is now (desktop 1280 wide, and `*-phone` at 375 wide).

## What changed

**One shared look for staff pages.** `server/src/console-kit.html` holds the styles (the app's palette, light and
dark, Martel headings) and the building blocks: tiles with a small trend line, cards, tables with search, sort,
filters and CSV download, empty states, dialogs, a grouped side rail that turns into a strip on phones. The server
pastes it into Admin and the console. The News desk takes the same palette and heading font only (its layout is
unchanged).

**Coaching-centre console (`/institute`), rebuilt:**
- Sign-in and join screens: one clear card each; "Not open yet" when the flag is off, with a pointer for Aspiran staff.
- Dashboard: getting-started checklist (only steps not yet done), tiles (students, active in 14 days with a trend,
  doubts waiting with the oldest's age, gone quiet, teachers), doubts waiting longest with an Answer button,
  students active each day, every batch at a glance, and what happened lately.
- Batches and invites: a card per batch with its live code; one "Invite people" dialog that gives the code, the link
  and a ready WhatsApp message. Codes table with status and role filters.
- People: search, role, batch and "gone quiet" filters, CSV; change role or batch in place; remove asks first.
- Chat and announcements: batch tabs, reported messages on top, announcements beside the chat.
- Doubts: Waiting / Answered / Resolved with counts, search, batch filter; oldest waiting flagged.
- Study plans, Notes and tests (searchable table, editor, quiz-pack import), Analytics (tiles, by paper, weak topics,
  tests, a searchable student table with CSV plus the full server CSV), Branding with a live preview of what students see.
- New server route `GET /inst/admin/dashboard` (teachers and up, own institute only, names only, never emails).

**Aspiran Admin (`/admin`):**
- Same shell: side rail grouped into Look after people, Content, Growth, Money, Running Aspiran, Team, with red
  counts for open safety alerts, reports and incidents.
- New **Home**: "Needs you" first (safety, reports, incidents, backups, Chai cards waiting), then accounts, activity,
  pods, Plus, money (only for roles that see Payments), today's Chai, the library, helper usage, website leads (with
  the latest coaching-centre enquiries) and coaching centres. New route `GET /admin/api/dashboard`, counts only.
- New **Coaching centres** section: list with search and CSV, make a centre (gives the owner code), new owner code,
  pause or resume (asks first). Shows a notice while the flag is off.
- **Feature flags** are switches now: each asks before changing and saves only that one flag.
- **Website leads**: a searchable table with a coaching-centre filter and a contact filter; chats table searchable.
- All other sections keep working as before in the new look.

**No "AI" labels.** "AI usage" is now "Helpers and usage"; "Chotu · AI" is "Chotu"; flag names for Jeetu, voices and
pod friends no longer say AI (pod friends are "study helpers"); doubt replies from the helper show "study helper".

## Checks
- `npm run check` passes. It now also parses the scripts inside the staff pages (`scripts/check-pages.mjs`).
- `npm run test:all`: all 23 suites pass. (On this Mac, Node 22.14, five suites that import .ts files need `NODE_OPTIONS=--experimental-strip-types`; that is the machine, not this change.) `test/institutes.mjs` has new checks for both dashboards
  (role limits, one institute can't see another's, no emails, staff key needed for the Admin one).

## Not done / for later
- Desk only got the palette and font, not the new shell.
- Older Admin sections (content, members, payments and the rest) use the new styles but keep their own layouts and
  plain tables; they could move to the searchable table one by one.
