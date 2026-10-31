# Owner and editor actions after slice 3 (2026-10-24)

Only the owner or an editor can do these. Nothing here was done by me: I don't deploy, push, type passwords, or approve content.

## Owner

### Deploy
- Slice 2 is live: the room board and the Plus lock answer on production.
- Next, follow `artefacts/deploy-slice-3-runbook-powershell.md` (PowerShell, one line at a time). It covers the backup, migrations 0006 and 0007, the optional mail secrets, the deploy, the content upload (step 5), smoke checks and the release APK.
- Check that the R2 backstop for room photos from slice 2, step 4, is in place:
  `npx wrangler r2 bucket lifecycle list upsc-pods-media`

### Keys and accounts (typed by you, never into files or chat)
- **Mail provider (Resend), for email password recovery.** Make a Resend account and verify a domain you own. Then set two secrets: `RESEND_API_KEY` and `MAIL_FROM`, for example `UPSC Pods <no-reply@your-domain>` (runbook step 3). Without them, recovery stays off. The apps then tell members to write to support, and staff resets still work.
- **SARVAM_API_KEY:** only needed when building a Hindi current-affairs week with Sarvam Bulbul voice-overs (`content/tools/motion-vo.cjs`). Set it in the shell before running `build-ca-week.cjs`. It's not a Worker secret.
- **Play service account**, only when you switch on Play Billing:
  1. In Google Cloud, create a service account and enable the **Google Play Android Developer API** for that project.
  2. In Play Console → Users and permissions, invite the service account's email with "View financial data" and "Manage orders and subscriptions".
  3. Download its JSON key, then run:
     `Get-Content -Raw "<path to the .json>" | npx wrangler secret put PLAY_SERVICE_ACCOUNT_JSON --env production`
  4. Delete the downloaded JSON afterwards. Never put it in the app folder.

### Play Console and the Play account
- **Decide first: may the app sell Plus?** The app's rule today is that it never sells Plus or points to where it's sold, and the web Cashfree flow is the only way to pay. Play Billing is built but off, so turning it on changes that rule. It's your call.
- If yes:
  - Create a one-time in-app product (not a subscription) with the id `plus_yearly`, priced at ₹9,999 for a year of Plus, and activate it.
  - Add yourself and testers under Settings → License testing, so test purchases aren't charged.
  - Build with `-Pupsc.playBilling=true` and switch on the `play_billing` flag on the desk.
  - Handle refunds by hand in Play Console. A refund doesn't take Plus away by itself yet.
- Keep using your existing `upload.jks` for release builds. The Billing Library adds the `BILLING` permission even with the flag off, which Play accepts.
- Update the store listing and the Data safety form if room photos stay in. Photos are opt-in, kept 7 days, seen only by that room, and deleted on account erasure. If you set up email recovery, add "email address (optional, for account recovery)" too.

### Legal
- Fill in **[Legal entity name]** (8 places) in `artefacts/Legal pages (draft, placeholders)/` before the pages go live.
- If recovery email goes live, the privacy page should name Resend as a processor.

### People
- **Editors:** at least one each for English and Hindi, signed up on the desk. Nothing below ships without them.
- **Moderators:** a named roster with hours, plus the crisis protocol (who answers a "care" flag, how fast, which helplines). Rooms are open channels now, so this matters more.
- **Native-speaker check** of the Hindi and Telugu strings. That covers:
  - the day-2 chat lines (`android/.../data/StagedProfile.kt` and `ui/AddaScreen.kt`)
  - the Hindi room-quiz and pinned-question text in `server/src/community.ts`
  - the Hindi voice-over scripts, before any Sarvam render
  - the new recovery and offline strings

### Claims to fix
- **The Launch Kit** (`artefacts/UPSC Pods Launch Kit.html`, lines 367, 393 and 449) still says cards are "checked by a human editor". That's only true once editors are approving. Until then, soften it, as was done on the website.

### Live check (when you want it)
- `server/scripts/live-answer-check.mjs` runs one typed and one photo Answer Studio review against production. It needs:
  - your own sign-in token and member id, typed into the shell
  - a JPEG of a handwritten answer

  Each run uses two of that member's free reviews for the week. I haven't run it.

## Editors (on the desk)

### Content awaiting approval (all drafts; release builds show none of it until approved)
- **PYQ:** the official UPSC CSE Mains 2025 papers GS1–GS4 (no Essay yet), as text with syllabus nodes. Check each paper against the upsc.gov.in PDF the desk links to, then approve.
  - **Mains 2025 is English only.** No Hindi text was found to transcribe.
  - **No links were made** from PYQs to Chai cards. Add them by hand if wanted.
- **Prelims answer keys:** not found yet. UPSC publishes the official key after the final result. When it's out:
  1. An editor downloads it from upsc.gov.in.
  2. They save it with one `<n>,<a|b|c|d|dropped>` per line.
  3. They run `node scripts/pyq.mjs key <paper id> <key.csv> <upsc.gov.in key url>`.
  4. They pack and import again.

  Use UPSC's own key only, never a coaching key.
- **The slice-3 content drafts** (uploaded in runbook step 5). All of it is English only, with no Hindi yet:
  - **30 syllabus notes:**
    - Economy: 8
    - Environment: 6
    - Modern History: 8
    - Geography: 8
  - **CSAT:** `comprehension-set-1`, with 3 passages and 15 questions.
  - **3 full Prelims GS1 mocks** (`pre-gs1-full-mock-1` to `-3`), with 100 questions each and syllabus nodes on every question.
  - **The syllabus map**, extended to five optionals (PSIR, Sociology, Geography, Anthropology, History; papers 1 and 2), the compulsory Indian language paper and English. Members see the optional papers for their chosen optional.
- **What to check before approving:**
  - **Every figure and date** against the source named on each item. The notes and mocks were written as drafts from general knowledge, not copied from any book.
  - **Date-sensitive mock questions:** recent schemes, indices, rankings and "as of" figures. Fix or drop any that have moved.
  - **Answer positions:** spot-check a few questions in each mock, and make sure the right answers don't cluster on one letter.
  - **Overlaps** with existing reads. Keep one of each pair, or link them:
    - `his-syl-gandhian` and `his-gandhian-mass-movements`
    - `geo-syl-monsoon` and `geo-indian-monsoon-mechanism`
  - **Syllabus headings** for the optionals and language papers were written from memory. Check them against the UPSC CSE notification.
- **Room pinned questions** come from this week's published Chai and the existing question bank, so nothing new needs approving. Look over the first few in the rooms anyway.

### Current affairs
- Sarvam Hindi voice-overs have no word timings. Captions are spaced by word length, so check the caption sync on every Hindi scene before approving it.

## Merged and ready (not deployed)
Both formerly paused branches are now merged into local `master`, built and tested. They go out with the slice-3 runbook.
- **Email recovery and the offline gate** (was `wip/email-offline`): recovery stays off until the mail secrets are set. The app stays readable offline.
- **Play Billing** (was `wip/play-billing`): it's behind the `play_billing` flag and the `-Pupsc.playBilling=true` build switch, and both are off. The server refuses with 503 until the service account is set.
