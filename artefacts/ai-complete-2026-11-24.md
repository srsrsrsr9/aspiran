# Chotu and Jeetu: the 24 Nov decisions, built (24 Nov 2026)

This carries out the six points in the AI section of `artefacts/decisions-2026-11-24.md`. All of it is on branch
`claude/ai-complete-88a629`. Nothing is merged, pushed or deployed yet.

## What was built

1. **Hidden monthly limit for Plus ($1.25 a month per member).** Every model call now records which member it was
   for. Before a Plus member's Chotu or Jeetu answer, the server adds up what their calls cost this month (India time,
   starting again on the 1st). Past $1.25, their answers quietly move to the cheaper gpt-oss-120b, then gpt-oss-20b.
   If those fail too, the phone's own Chotu answers (it already answers first when it's downloaded). The member never
   sees any of this. Plus given by you (staff) has no limit. *(server: `ai.ts`, `plus.ts`)*
2. **Day-long cut-offs for free members and visitors.** The daily allowance is unchanged. On top of it, Chotu rests
   for the rest of the day for anyone who sends more than 100 messages in a day, sends one every 2 seconds or faster for
   a minute, uses more than 3 accounts on one phone in a week, or sends 8 off-topic messages in a row. They see one
   calm line: "Chotu is resting for the rest of today. Your notes, practice and Chai are all still here, and Chotu is
   back tomorrow." (Hindi too.) This covers the app and the website's Chotu. Only counts, times and scrambled codes are
   kept, for 8 days. Admin counts: `ai_cutoff:volume`, `ai_cutoff:speed`, `ai_cutoff:accounts`, `ai_cutoff:offtopic`.
   *(new `guard.ts`)*
   - The free-limit line no longer says "It still works offline on your phone". It now says "That's all of today's
     Chotu chats. Chotu is back tomorrow morning." The Plus pitch says Plus gives 100 chats a day and Chotu on the phone.
3. **Chotu chats come to Aspiran and improve the app (your change, 24 Nov).** All chats (web app, online Chotu and
   Chotu on the phone) are kept for every member, with no opt-in and no opt-out. The law's part is done as a notice:
   - The privacy policy ("Your Chotu chats") and the terms ("Your Chotu chats") now say it plainly: kept securely for
     180 days, used to improve the app, never sold, never shown to coaching centres, distress follows the care steps.
   - Web sign-up says it on the sign-up screen, and agreeing there covers it.
   - Existing members (who were told chats stay on the phone) see a one-time notice above the Chotu chat with one OK
     button, on the web and on Android. Nothing of theirs is kept until they've seen it.
   - The server only keeps chats for a member once it has a record that they were shown the notice (stored like the
     other consents). Me → Privacy explains it, with no switch. Chats are in the member's data export and are deleted
     with their account. Distress messages are never kept as chats.
   - I first built a yes/no switch, then replaced it with this notice when your decision changed.
4. **Nightly study profile for Plus.** Between 01:30 and 04:00 India time (10 members per half hour, so about 60 a
   night), a strong model writes each Plus member a short profile (at most 8 lines) from their own counts (study facts
   their app sent and their usage counts) and their recent Chotu chats. The profile never mentions feelings,
   ranks, results or other people, and none is written on a result day. Chotu online, Chotu on the phone (it fetches the
   profile twice a day at most) and Jeetu read it as background. *(new `profile.ts`)*
5. **Retired model replaced.** Groq shut down Llama 4 Scout on 17 Jul 2026. Answer Studio's second marking model is
   now Qwen 3.8 27B on Groq. No other retired model was in any route; a test now checks this.
6. **On-phone model pick:** keep Gemma 4 E2B for 6 GB phones (E4B for 8 GB and up). This is **from published
   results, not our 303-case test**: this Mac has no way to run phone models. See
   `artefacts/on-device-model-pick-2026-11-24.md`.

## Checked

- `npm run check` and `npm run check:schema` pass.
- Android unit tests (`./gradlew testDebugUnitTest`) pass, including new tests for the profile trimming.
- New server tests: cut-offs, the off-topic marker, profile cleaning, the monthly limit's switch to cheaper models, no
  retired model, and live tests that chats aren't kept before the notice, are kept after it (never distress lines),
  show in the member's export, and that there is no opt-out. Seven suites pass: chotu, jeetu, coach, providers, smoke, site, auth.

## What to check (when it's live)

- Admin → counts: the `ai_cutoff:*` numbers should stay small. If `accounts` climbs, families sharing one phone may be
  hitting it; tell me and I'll raise the 3.
- Open Chotu on the web and on Android: the "Your Chotu chats now come to Aspiran" notice shows once, then never again.
- After the first night with Plus members: profiles appear (admin can see `study_profiles`).

## Limits to know about

- Only Groq calls have a price in our log. Calls that land on NVIDIA or Google count as $0 toward the $1.25, so the
  limit can let a little more through than planned. Groq is first in every Plus route, so most calls are counted.
- I couldn't confirm in Groq's own documents that Qwen 3.8 27B reads images (others' code says it does). Answer
  Studio's photo marking should be tried once after deploy. If it fails, the next model in the list takes over.
- When a Plus member is over the limit and both cheap models fail, the server tells the app to use the phone's Chotu.
  The app already uses the phone first when it can, so this rarely matters.

## What you need to do

1. **Nothing for secrets.** No new keys. (If you want Plus calls on a separate Groq account, the existing optional
   `GROQ_API_KEY_PLUS` still works.)
2. When this is merged, the deploy applies migration `0019_ai_limits_profiles.sql` first (I do that).
3. **Android:** the one-time chat notice arrives with your next Android build. Until then, phone chats from Android
   aren't uploaded. Android's sign-up screen (not my file) doesn't mention chats yet, so new Android members see the
   one-time notice in Chotu instead.
4. Before Plus launches: run the 303-case Chotu set on a real 6 GB phone (steps in the model-pick note).
