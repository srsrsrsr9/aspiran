# Coaching centres, website and marketing: what was done (24 Nov 2026)

From `artefacts/decisions-2026-11-24.md`. Nothing is live yet: it's all on branches, waiting to be merged and deployed.

## Where it is
- App and server: branch `claude/centres-site-8cad09`, commits 07d4405 (centres), aab7908 (Sunday "Your week"),
  5c10990 (K4 emails and pamphlets), plus this note.
- Website: repo `aspiran-web`, branch `claude/centres-free-faq` (worktree `~/Documents/aspiran-web-centres`), commit ca3592f.

## Coaching centres
- **Switches the centre controls.** In the centre console, under Branding and switches, the centre chooses what its students get:
  batch chat, doubts, the quick first answer on doubts, study plans, its own notes and question sets, and Aspiran pods.
  Pods are off by default for centre students; the quick first answer is off by default too. A switched-off part
  disappears for students on the web, and the server refuses it as well. With chat off, students still see announcements.
  The Android session has the API summary (shared notes, `centres-api-for-android.md`; full details in `server/README.md`).
- **Plus for centre students.** Free during the 30-day pilot, and while the centre is paid up. Students see "Plus is on for you"
  on their centre screen. It ends by itself when the pilot ends and nobody has paid.
- **Pricing recorded** in `artefacts/coaching-centres-plan-2026-11-14.md`: ₹1,200 a student a year, 25 students at least,
  after a free 30-day pilot. Not on the public site.
- **Admin → Coaching centres** shows each centre's plan (pilot, paid or ended), pilot end date and seats, with a Plan button
  to set seats, move the pilot end, or record "paid until".
- The doubt reply reads "A quick first answer from Aspiran. Your teacher checks doubts too." Nothing says "AI".

## Website (aspiran-web branch)
- For-coaching page, English and Hindi: "Students on the web now, Android coming soon", the centre chooses what students get,
  and the pilot includes Aspiran Plus free for every student in the batch.
- The free plan says "Free · free forever" (home page and short home page), and the FAQ says "free forever, not a trial".
- The 4 K3 FAQs are on the home page, English and Hindi.

## Pamphlets
- Student pamphlets: "Free trial" is now "Free, free forever, no card needed" (Hindi too).
- Centre pamphlet: "Web now, Android soon" instead of "Web and Android", and the pilot step mentions Plus for the batch.
- HTML and PDFs rebuilt; each is still 2 pages. Worth a glance before printing.

## K4: five short study emails after the demo
- Where the demo asks for an email (the day-3 questions), there's now a second box, never ticked for the visitor:
  "Also send me 5 short study emails over the next month". Only people who tick it get them.
- The five: day 0, day 3 (the existing questions email, which now says "the second of your five"), day 7, day 14, day 30.
  Your words from `K4/email.json`, with one fix: day 0 said the visitor "saw how an answer is marked", but the demo
  doesn't mark answers; it now says they "planned a Mains answer and kept a few cards" (Hindi too).
- Every email has a stop link that stops everything still to come. The address is deleted after day 30, or on stop.
  People who don't tick the box get exactly what they got before: one email, then their address is deleted.
- Please check one fact in the day-30 email: that every Plus feature it lists is really in Plus.

## Sunday "Your week"
Every member on the web app, free included, sees "Your week" on Sundays on Today and Adda. It stays quiet in result mode
and while paused, and "Seen it" hides it until next Sunday.

## Checks
`npm run check`, `npm run check:schema`, and the tests for institutes, site, try, insights, smoke, marketing and metrics all pass.

## What publishing needs (Claude can do all of it once merged)
1. Merge `claude/centres-site-8cad09` into main.
2. Apply the two new database changes to production, in order:
   `migrations/0020_institute_features.sql`, then `migrations/0021_try_series.sql`.
   (The AI-limits session uses 0019. If another session also made a 0021, renumber one before merging.)
3. `npm run check`, the tests, then `npm run deploy`, then look at the live demo form and Admin → Coaching centres.
4. Website: merge `claude/centres-free-faq` into `aspiran-web` main and push; GitHub Pages publishes it.
5. Update the status page (centres switches and Plus, K4 emails, website wording).
6. Pamphlets: print from `artefacts/pamphlets-2026-11-22/pdf/` when you're ready.

## Left for the owner
- Switch the `institutes` flag on when you want centres live. Until then none of the centre parts show, and centre Plus doesn't apply.
- Check the day-30 Plus fact above.
