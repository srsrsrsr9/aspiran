# Android and the web app: what matches (24 Nov 2026)

**In plain words.** Version 18 (0.6.0) brings Android level with the web app for students, apart from a few items listed below.

- **Now in 18:**
  - The coaching-centre student side: join, chat, doubts with a photo, plan, notes and sets, and progress. It shows only while the `institutes` flag is on.
  - Study walks on Listen.
  - The short note after a practice set or mock, now for free members too.
  - Everything that 17 already had and never reached Play: Jeetu's plan card, "Your week", three-card Chai, illustrated shorts, Hindi captions, "Free" wording and ₹3,999.
- **Not in 18, and why:**
  - The Listen button on Chotu's replies, and Chotu stepping aside while you work. Another session owns the Chotu files.
  - Invite links that open the app directly. These need the Play signing fingerprint from you.
  - Cashfree, receipts and gifts. Play rules keep these web-only.
  - The web's shorter first run. Android keeps its consent screen.
- **Checks:**
  - All 23 unit tests pass, 3 of them new.
  - The debug build compiles.
  - No phone or emulator walk-through was done. Both emulator system images on the Mac are incomplete (the main `system.img` file is missing), so no emulator can start. Step 3 of the runbook is that check on your phone.
- **Server:** no change needed.
- **Play Data safety:** one answer changes. Photos are now stored, not processed briefly. The ready-made file is `artefacts/play/data_safety_import-2026-11-24-v18.csv`.

## How this list was made

- Web app as on `main` at 2eab113 (24 Nov). Android as at versionCode 17 / 0.5.9 (commit dc5606e, 22 Nov).
- Web commits since dc5606e that touch `server/public/app/`: 9d8e227 (Chotu accountability, Jeetu plans), eaf6b91
  (study walks on Listen), 1679a72 (marketing in admin; nothing for students). Plus every item the status page says is
  "in the next Android release", and the owner's decisions of 24 Nov (`artefacts/decisions-2026-11-24.md`).
- "Already in 17" means the Android code had it before this work.

## The list

| # | Web feature or wording | Android before | Android 18 | Notes |
|---|---|---|---|---|
| 1 | "Your week" card: effort totals against your own last week, one win, one trend, Jeetu chip | Already in 17 | Same | Plus any day; everyone on Sundays (owner, 22 Nov; decisions 24 Nov point 2). |
| 2 | Two-line debrief after a practice set or a mock | Plus only | **Everyone** | Web shows it to everyone (counts only, no model cost). Android now does too. Never in a result week. |
| 3 | Jeetu's plan card: at most 3 items, "Use this plan", "Change it" | Already in 17 | Same | `data/JeetuPlan.kt`; Chotu's check-in asks about the next item. |
| 4 | Jeetu's lines in Review, Mains, the first run and Progress; "Ask Jeetu" page | Already in 17 | Same | |
| 5 | Jeetu's 14 days for new free members called a "taste", never a trial | Already in 17 | Same | |
| 6 | Free plan is free forever; "Everything free stays free. Always." | Already in 17 | Same | No "trial" wording for the free plan anywhere on Android. |
| 7 | Plus price ₹3,999 a year, no founding offer | Already in 17 | Same | The server's figure wins when it sends one. |
| 8 | Three-card Chai, "That's today's Chai. It ends." | Already in 17 | Same | The three cards are picked on the server (GS1 gets a place since 23 Nov); both apps show what it sends. |
| 9 | Illustrated shorts shelf, in the reader's language | Already in 17 | Same | Prep → Current affairs, "Illustrated shorts". |
| 10 | Hindi captions on the 257 syllabus and current-affairs videos | Already in 17 | Same | A Hindi reader gets Hindi captions when the scene has them. |
| 11 | Study walks (two-voice audio lectures) on Listen | **Missing** | **Added** | Listen now lists "Study walks" with notes and guided walks; totals include them. |
| 12 | Talk player no longer says "Recorded voice" | Already in 17 | Same | |
| 13 | Coaching centre, student side: join by code or link, centre's name, logo and colour, announcements and batch chat, doubts with a photo, plans with ticks, the centre's notes, practice sets and tests, your own progress, leave | **Missing** | **Added** | Behind the server's `institutes` flag (off until the owner switches it on). Uses the existing `/inst/...` routes; no server change. |
| 14 | "Listen" button on Chotu's and Jeetu's replies | Missing on Chotu's screen | Not in 18 | Chotu's screen belongs to the parallel Chotu session (`ui/ChotuScreen.kt`). The voice code (`data/Voice.kt`) is already on Android. |
| 15 | Chotu hides while you work, wanders back at 30 s, nudges at 45 s (web buddy) | Missing | Not in 18 | Same reason: Chotu's files are the other session's. |
| 16 | First run: two screens on the web (a question first, sign-in on the first screen) | Android has 4 short screens (welcome, sign-in, 18+ consent, meet your pod) | Same | Left as is: Android's consent screen is needed for Play's 18+ answer, and reshaping onboarding needs a phone walk-through first. |
| 17 | Centre invite links open straight in the app | Missing | Not in 18 | Needs `assetlinks.json` on app.aspiran.in with the Play signing fingerprint (owner, Play Console). In 18 a student pastes the link or types the code; the app takes either. |
| 18 | Web-only pages: payments by Cashfree, receipts, gifts | Not on Android | Same | Google Play's payments policy: Android sells Plus only through Play Billing (built, off). |
| 19 | Marketing in admin, wisdom shorts, newspaper reader | Admin or not live | n/a | Nothing student-facing. |

## Centre student side on Android (item 13), in detail

- **Where:** Me → "Coaching centre" (join or open), and a card at the top of the Adda once you're in one, in the
  centre's colour with its logo. With an invite still waiting, the Adda says "Finish joining your coaching centre".
- **Joining:** paste the invite link (`app.aspiran.in/#inst/KXR7M2PD`) or type the code. The app shows the centre's
  card (name, city, logo, colour, batch) from the code before you join. Name for the centre, "What your centre will
  and won't see", a tick, Join. Staff codes say "This is a staff invite: it opens in the centre's console."
- **Tabs:** Plan (tick items; "Open" goes to the piece), Chat (announcements pinned on top, batch chat, Report,
  new messages every 10 s while open), Doubts (text, optional topic, optional photo from the gallery, shrunk to a JPEG
  under 1.5 MB on the phone; replies; "This is cleared up"), Notes and sets (notes in English or Hindi, practice
  sets and one-go tests with answers and explanations after), Your progress (only yours), Leave.
- **Care:** a message or doubt the server holds (distress) shows the server's care message and the helplines with
  call buttons. Nothing goes to the centre (decisions point 6).
- **Wording:** the quick first answer shows "first answer" and "A quick first answer from Aspiran. Your teacher checks
  doubts too." Never "AI" (owner, 17 Nov).
- **Not on Android yet:** the centre's per-feature switches (decision 12) aren't in the server's `/inst/me` answer
  yet. The Android screen already hides a tab when `/inst/me` says that feature is off (`features: {chat: false, ...}`),
  so it will follow once the coaching-centre session adds that field.
