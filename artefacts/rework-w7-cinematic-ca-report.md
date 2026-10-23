# W7 Cinematic current affairs: build report (2026-10-23)

Branch `rework/slice-1`, committed locally. Nothing pushed or deployed.

## What's in
- **Contract** `upsc-pods/ca-week@1` at `content/motion/ca/<yyyy-ww>/manifest.json`. The real week 2026-41 is in, minus the `.social.mp4` cuts.
- **Server** (`server/src/ca.ts`):
  - `GET /ca` lists the weeks; `GET /ca/<week>` returns one week.
  - Only approved scenes go out. Drafts show only with `?drafts=1` on a local dev server.
  - Desk upload is `PUT /desk/api/ca/<week>/files/<path>`: the manifest first (it is validated), then only the files it names.
  - `/media` now serves video in byte ranges, and `.vtt` and `.jpg` with the right types.
  - `npm run import:ca -- <week folder>` uploads a whole week.
- **App**:
  - "This week in N scenes" card on Prep → Today, with a shelf of earlier weeks.
  - Media3 vertical player with:
    - a CC toggle
    - swipe to the next scene
    - the quiz after each scene, with the why shown after you answer
    - Prelims GS / Mains GS3 chips that open the Syllabus, and a Sources list
  - Plus scenes are blurred behind the pill, with ₹9,999 a year and the WhatsApp free-trial line. It stays quiet after 10:30 pm and in pause, care and result weeks.
  - DRAFT tags show in debug builds only. Release builds filter out drafts as well.
  - Offline: "⤓ Save" stores the week's scenes in a 600 MB cache.
  - The Sunday 10am ritual "The week in scenes" is unhidden and opens the latest week.
  - Fixed: a ritual nudge tapped while the app is already open now opens its screen. Before, onNewIntent dropped it, for every ritual.

## Checks
- `gradle :app:assembleDebug`: clean, with no new Kotlin warnings.
- `npm run check` (tsc) passes.
- These suites pass against a local dev server: smoke, ca, community, friends, rooms, mocks, languages, auth, password, metrics and roadmap.
- Not run: payments, which needs its own server setup.

## Emulator (partial, stopped early at the owner's request)
Screenshots are in `artefacts/w7-screens/`. Checked:
- the Today card
- scene 1 playing with captions
- the quiz and its why
- the Plus lock on scene 2 with the price and WhatsApp line
- swiping between scenes
- the Sunday deep link with the app open

After those checks I made two more changes. Neither has been seen on a device yet:
1. Captions are now drawn by the app just above the title. Before, they overlapped the title (see `02-scene1-play.png`).
2. The locked-scene scrim is darker.

Also not checked on any device:
- the CC toggle turning captions off
- the chips opening the Syllabus
- the Sunday link from a cold start
- offline replay
- scene 3's lock (it's the same code as scene 2)

## Caveats
- The paywall is in the app only. A Plus mp4 can still be fetched from `/media` by anyone who knows its path.
- `week.mp4` is uploaded but the app doesn't use it.
- The real manifest's shapes differ from the contract (gsPaper is a list, sources are strings, voice is an object). The app accepts both.
- All three scenes are drafts. Release builds will show nothing until they're approved.

APK: `artefacts/apk/upsc-pods-debug-2026-10-23.apk`. It's a debug build, kept out of git by `*.apk`.

## Testing on a phone
The debug build has no preset server, and the live server has no `/ca` yet. The week is also all drafts. So the phone needs the local server:
1. In `server/`, run `npx wrangler dev --ip 0.0.0.0 --port 8790 --persist-to .wrangler-test/w7app --var AUTH_MODE:dev --var EDITOR_TOKEN:suite-test-token`. The week is already stored in that folder.
2. On the phone (same Wi-Fi), go to Me → Settings → server and enter `http://192.168.0.16:8790`. Then use Dev sign-in with any made-up email.
