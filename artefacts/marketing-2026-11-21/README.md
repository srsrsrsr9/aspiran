# Marketing batches K1 to K6 (content account, 21 Nov 2026): checked, cleaned, put to use

23 Nov 2026. Source zips: `docs/content/2026-11-21/aspiran-K1` … `K6` (not in git). Spec: Track K in
`artefacts/content-mega-prompt-v2-2026-11-20.md`.

## Decisions for you (owner)

1. **K4 email series: don't switch it on as written.** The demo promises visitors *one* email and deletes the address
   once it's sent (live since 20 Nov). Five emails over 30 days would break that promise. If you want the series, the
   demo needs a second, separate tick-box ("Send me 5 short emails over a month"), and we keep the address 30 days.
   Your yes or no.
2. **Free plan wording is split.** aspiran.in says "Free forever, not a trial"; the pamphlet was changed last night to
   "Free trial". The cleaned copy avoids both ("Join free, no card"). Which one is true?
3. **K3 website:** 4 new FAQs for the home page, as a diff (`K3-website-faq.diff`). Say yes and Claude applies it to
   the site.
4. **K5 Play listing:** yours to publish, 15 minutes: `K5-play-console-runbook.md`.
5. **Coaching-centre pricing** (decision 9) is still open, so K2 now offers the free 30-day pilot, like the site.

## What was checked

- **Never list** (toppers, ranks, guarantees, made-up numbers, urgency, founding offer, "AI", named competitors, price
  other than ₹3,999): a scan over every visible field of all six batches. Clean. The only hits are lines saying
  Aspiran *has no* ranks or leaderboards, kept on purpose.
- **K1 reels:** all 30 file names exist (28 of the 100 illustrated shorts, 2 of the 257 syllabus videos).
- **K1 answers:** all 30 recall questions checked by hand. All keys right; letters match the answer lines; the
  question is the same on all three channels each day.
- **Lengths:** K1 posts ≤ 600 characters (one was 605, fixed); Play short description ≤ 80, full ≤ 4,000, captions
  ≤ 30; YouTube titles ≤ 60, 12 tags, thumbnails ≤ 4 words.
- **Product claims** checked against the server and the live site (below).

## Fixes (41, all in `fixes.log`; `clean.py` remakes the cleaned copies)

| Batch | Fix | Why |
|---|---|---|
| K1, K3, K5 | "3 to 7 current-affairs cards" → "3" | Chai has been three cards a day since 15 Nov |
| K1 day 12 | "Each syllabus note has audio" → "Many" | 31 notes still have no audio |
| K1 day 3 | WhatsApp Hindi shortened | Was 605 characters |
| K2 | "Free partner plan + share of Plus" → "free 30-day pilot, then a price for your size" | Share isn't decided; this is what aspiran.in/for-coaching and the pamphlet say |
| K2 | Logo line says what's built (invite page in your logo and colour, your name in the app); contact via aspiran.in/for-coaching | The form there emails you each lead |
| K3 | Price FAQ: "free to join, no card; one payment, no auto-renewal, refund within 7 days" | There is a free plan, not only a demo |
| K3 | Plus page listed every feature under Plus → now lists what Plus adds (the site's own list) | Free already has revision, Chai, notes, PYQs, pods |
| K3 | "Facts carry a last-read date" → "watched every day and updated" | No visible date; the daily fact watch is live |
| K5 | Price line as K3; adds "independent app, not linked to UPSC" | Play expects it for government-exam apps |
| K6 | 1857: "past Prelims question" → "past Mains question"; "Prelims GS2" tag → "GS2" | The 1857 script uses Mains 2016 GS I; Prelims has no GS2 |

Not changed: K3 hero 5's "Coaching can cost ₹2 lakh" (the site already shows ₹1.75–2.1 lakh for Delhi classrooms).
K3's `preview.md` still shows the old Plus list; `web.json` is the right one.

## What went where

| Batch | Where | State |
|---|---|---|
| K1 | `artefacts/daily-posts-2026-11-20/launch-k1/`: calendar (23 Nov to 22 Dec) and 180 paste-ready files, one per day, channel and language | Ready. Telegram and WhatsApp 19:00, Instagram Reel 18:30 (takes the reels calendar's Instagram slot for 30 days; its YouTube Shorts carry on). Short 004 is only in split parts on this Mac: join it first |
| K2 | `K2/` (pitch, 60-second video script, 5 objection replies) | Ready to print or film |
| K3 | `K3/`, and `K3-website-faq.diff` for aspiran-web (`src/components/Home.astro`, applies cleanly) | Waiting for your yes. Hero options and "how it works" not proposed: the live home page is newer and does both |
| K4 | `K4/` | On hold (decision 1) |
| K5 | `K5/`, `K5-play-console-runbook.md` | Yours to publish. 8 captioned screenshots still to make |
| K6 | `K6/` | Waiting for the videos. Only Federalism (English) is rendered; chapter times come from each video's `chapters.json` at upload |

## K4: what exists for sending email

- **A sender exists:** `server/src/mail.ts` sends plain-text mail through Resend when `RESEND_API_KEY` and `MAIL_FROM`
  are set. It's used for password recovery and the demo's day-3 email (`server/src/try-recall.ts`, live 20 Nov), with
  one-click unsubscribe headers.
- **No series sender:** nothing schedules more than one email per person, keeps an address after sending, or fills
  `{{first_name}}` and `{{unsubscribe_url}}`. The demo also doesn't keep a first name.
- **K4's day 3 duplicates the live day-3 email**, which is better: it asks the visitor's own cards again and scores
  them privately. If you say yes to a series, use the live day 3 and add K4's days 0, 7, 14 and 30 behind the new tick-box.
- Whether the Resend key is set in production can't be seen from here (secrets are hidden); Admin → Try one topic
  shows whether day-3 emails are going out.

## Still to check before anything prints or posts

- K2: what a centre's students get without Plus, and the data wording (points to the partner agreement).
- K6: the three past questions came from memory (Prelims 2012 GS I, Prelims 2017 GS I, Mains 2016 GS I); check them
  against the UPSC papers before upload.
