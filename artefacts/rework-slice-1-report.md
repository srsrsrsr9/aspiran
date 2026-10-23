# Rework slice 1: build report (2026-10-23)

Local branch `rework/slice-1` (commits 386a94c, e0576d4, 7c762cb on top of the baseline commit 530aa16 on master). Nothing was pushed, deployed or published. keys/, .dev.vars and local wrangler state are git-ignored and were not committed.

## W3 Open pods
- Server: `server/src/rooms.ts` defines 17 rooms.
  - Language: Hindi medium, English medium, Telugu.
  - Attempt: First attempt, Repeaters, Working aspirants.
  - Goal: Prelims 2027 sprint, Mains answer writing.
  - Optionals: PSIR, Sociology, Geography, Anthropology, History.
  - Regions: North, South, East & Northeast, West & Central.
  - Routes: /rooms/list (real member counts, unread, latest line, online now), /rooms/join, /rooms/leave, /rooms/<id>/ws. A member can join several rooms.
- Each room runs on the existing PodRoom Durable Object.
  - Rooms have no lead.
  - There is a new /activity endpoint.
  - Chotu's rituals and the AI study friends (still labelled AI) run in rooms through the cron. Friends stay at full level so a room never feels empty.
- Gate: the setting "growth" sets signupThreshold (default 500) against total accounts. /config now carries `pods: {mode, signups, threshold}`.
  - Below the threshold, /pods/join returns 409 for anyone not already in a pod. Existing pods keep working.
  - At or above it, matched pods switch on and the rooms stay.
- Admin route: GET/POST /admin/api/growth/threshold.
- Android:
  - In open mode the Pod tab is the room list: counts, who's here, latest line, one-tap Join, unread badges.
  - A room opens as the normal pod chat.
  - With a matched pod there's an "Open rooms" link.
  - The Pod tab icon has an unread badge, which reverses A12.
- Copy removed or changed:
  - "We never use fake members" is gone from the website FAQ (artefacts/UPSC Pods Website/index.html), in English and Hindi, and from the community.ts comment.
  - The Adda and Tour "matched every Monday" lines are changed.
  - The Guide "No unread counts" line is gone.

## W5 Answer Studio
- Server: `POST /answers/evaluate` in answers.ts and rubric.ts.
  - Takes a photo (JPEG/PNG/WebP, max about 4 MB) or text, and sends it through ai.ts to vision models: Gemini 3.8 Flash, then Gemma 4 31B on NVIDIA, then Llama 4 Scout on Groq.
  - Returns five areas (directive, structure, content, examples, conclusion). Each has a band (below / at / above a typical scoring answer), a note and one fix. Also a word count, a model-answer skeleton and a summary.
  - Checks for distress first; on a match the model is never called.
  - The photo is never stored. A new "evaluate" AI switch sits in admin LLM controls.
  - Allowance: 3 a week free, unlimited on Plus. A review counts only after feedback is actually given. This is enforced even with the plus flag off.
- Android: Practice → Answer Studio.
  - Question picker: today's Mains question plus the samples.
  - Countdown: 150 words = 7 min, 250 words = 11 min.
  - Optional Focus mode (Focus.start/stop).
  - Photo via the camera app, through a FileProvider cache file that is deleted after grading, or a typed fallback.
  - Feedback view, a local attempt log (started / finished / abandoned / over time), Chotu's line from the log, and Send to pod (any joined room, Mains answer writing first, or the matched pod).

## Onboarding
Unchanged. The TODO hook is `StagedProfile.dayTwoAskDue`, for Chotu's day-2 rubric and persona questions.

## Results
- `npm run check` (tsc --noEmit): clean.
- Tests against a local wrangler dev on port 8790, with a fresh DB and AUTH_MODE=dev:
  - Passed: new test/rooms.mjs, smoke, community, friends, auth, password, metrics, mocks, languages, roadmap.
  - Not run: payments. It needs a CF_SECRET test value the server wasn't started with.
  - Not run: chotu and models, because they call live models.
- `gradle :app:assembleDebug`: BUILD SUCCESSFUL. Output: android/app/build/outputs/apk/debug/app-debug.apk. The project has no Android unit tests.

## Guesses and gaps
- At or above 500 sign-ups, free members still get 3 reviews a week. The brief only covered the period below 500.
- The vision model ids are my picks. The Groq Llama 4 Scout id is a guess.
- No live model call was tested. The evaluate tests cover validation, distress and the AI switch only.
- Send to pod posts text only. For a photo, it says "written by hand, I can share the photo"; chat has no image upload yet.
- The web app only shows a friendly note in open mode. The room list is Android-only for now.
- Not built from the plan doc's W3 extras: a pinned daily question per room. Rooms do get the existing answer hour and quiz night.
- "No fake members" still appears in historical docs (strategy/community-first-spec.md, project-status.md, the Buyer Review). I left those alone.
- Gradle needed `-Djdk.net.unixdomain.tmpdir=C:\gtmp` on this PC ("Unable to establish loopback connection" otherwise).
