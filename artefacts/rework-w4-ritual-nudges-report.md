# W4 ritual nudges: build report

Branch `rework/slice-1`, committed locally only. Nothing was pushed or deployed. The design follows plan doc https://claude.ai/artifact/R8HNtGgA8GDs1kqqAXCJXb.

## What's built

All of it runs on local notifications (WorkManager), so no push keys are needed. A single `RitualWorker` wakes at the earliest next slot, sends whatever is due, and reschedules itself.

| Ritual | When | Push copy | Opens |
|---|---|---|---|
| Morning Chai | The person's chai time, daily (Sunday only once it drops to weekly) | "Chai's ready." with today's card count; skipped if Chai is already done | Today's Chai |
| Monday goal | Mon 8:00 | "Fresh week. *n* people in *room* are starting it too. Set one goal for the week." The count is the real member count of the biggest joined room (or the pod), and it's left out if older than 8 days | Prep → Today (WOOP card) |
| Answer hour | Wed and Sat, 15 min before 7 pm (Sat only once weekly) | "Answer hour in 15 min. Today's question is on *topic*. Pen and paper ready?" | Answer Studio with the room's question preselected and a banner |
| Quiz night | Fri, 15 min before 8 pm, pod members only | "Quiz night at 8. Five questions, one pod score, up against your pod's own last week." | Pod tab |
| Sunday CA | Sun 10:00 | Built but hidden (`available = false`) until W7 | n/a |
| Comeback | 6 pm after 3+ quiet days, once per quiet spell | "Your room's still here. One 7-minute answer and you're back." | Answer Studio with a "Welcome back" banner |

## Rules

- At most 2 pushes a day. Comeback goes last.
- Nothing after 22:30 or before 06:00.
- Also quiet during a pause, on result days (staged result mode or the admin config's `resultNow`), within 24h of a care check-in, and when notification permission is missing.
- A ritual ignored 3 times in a row drops to weekly. Opening the app within 3h of a push resets its count.
- Every push deep-links into its action.
- Finishing the action (an answer written, the WOOP saved, Chai read, every quiz question answered, or coming back) shows Chotu's reward dialog once a day and awards a stamp the first time. The new stamps are Morning Chai, Fresh-week goal and Answer hour.
- The picker lives in Chotu's day-2 card in the Adda (`StagedProfile.dayTwoAskDue`), not in onboarding. Answer hour is preselected. "Not now" marks the card as asked. My Path has the same picker and saves live. The old "Morning chai nudge" setting now just toggles the Chai ritual, and the old `NudgeWorker` hands over to the rituals.

## Per-question timing (for the W6 lucky card)

- Each mock question now records the time spent on it, plus when its answer was picked within the current visit.
- A right answer counts as lucky if it was marked "Not sure", or if it was picked within 15 s of coming back to a passed question.
- The lucky card's copy now says this.

## Server

The plan says answer hour is Wed/Sat, but the server ran it on Tue/Thu. I aligned the server to Wed/Sat:

- `ANSWER_DAYS` in friends.ts drives both Chotu's host schedule and Meera's posts.
- The web app copy is updated.
- Tests are updated.

## Files

- Android:
  - new: `data/Rituals.kt`
  - changed: `data/Nudge.kt`, `data/StagedProfile.kt`, `data/Mocks.kt`, `ui/NudgeUi.kt`, `ui/AddaScreen.kt`, `ui/OtherTabs.kt`, `ui/AnswerStudio.kt`, `ui/MockScreens.kt`, `ui/MockIntelScreen.kt`, `MainActivity.kt`
- Server: `src/friends.ts`, `src/community.ts`, `src/index.ts`, `public/app/app.js`, `test/friends.mjs`

## Checks

- Debug APK built clean.
- Server `npm run check` is clean.
- All 11 suites pass: smoke, friends, community, rooms, mocks, languages, auth, password, metrics, roadmap, payments.

Emulator run (screenshots in `w4-screens/`):

1. The day-2 ritual card in the Adda.
2. Chai ticked, with its time chips.
3. Monday goal and Comeback ticked.
4. Saving stored the picks and queued the worker for the next slot (07:00). A forced run at 21:09 correctly sent nothing and re-queued itself.
5. The My Path picker.
6. Three debug previews in the notification shade.
7. Tapping Answer hour opened Answer Studio with the banner and the room's question picked.
8. Cold-starting from the Monday goal push opened Prep → Today.

## Caveats and follow-ups

- **Room vs room quiz doesn't exist on the server.** Pod quizzes compare against the pod's own last week, so the push says that. A real room-vs-room board is server work.
- The Sunday CA ritual stays hidden until W7.
- The rubric and persona questions for the day-2 chat are still a TODO. Only the ritual picker is in it.
- I softened the comeback copy from "missed you" to "Your room's still here."
- "Try" preview buttons on My Path exist in debug builds only.
- On result days the app goes quiet based on the last cached admin config, so it only knows once the app has fetched it.
- I didn't trigger the reward dialog on the emulator. Cold start of the on-device model starved the emulator's CPU and caused ANRs, which is not related to this change. The reward is wired on every action listed above.
