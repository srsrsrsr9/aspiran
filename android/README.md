# UPSC Pods (Android)

Kotlin + Jetpack Compose. Android only.

## Slice 1 (follows ../ux-guide.md)
- Onboarding: a 3-screen tour with real examples, consent and an 18+ check, then 6 short persona questions and a persona reveal. Saved on the phone only; edit or delete it from My Path.
- 5 tabs: Today, Practice, Pod, Chotu, My Path. "Need to talk?" sits in the ⋮ menu and My Path.
- Today: greeting, Today's 3 with a segmented bar, pod strip (sample), and Close the Day. Close the Day moves to the top after 20:00. No countdown or streak.
- Today's Chai: one card per screen with 6 zones, a trust footer, Save for revision, and an end card.
- Close the Day: four optional inputs, words-not-emoji mood, an inline support line for Heavy mood or distress phrases, and a choice of who hears about low moods.
- The mascot name lives in `Brand.kt`, so it's easy to rename after the user test.

## Slice 2
- Saved on the phone (Room, journal encrypted with a key in Android Keystore). Martel font for Hindi; each Chai card can switch language and shows its own editor's check.
- Practice: 5 Prelims questions a day (missed ones return in 3 days), a Mains answer with autosave and a 150-word guide, saved cards and the archive.
- Pod: live chat, chai pings, a shared 25/50-minute study room, report by long-press. Needs the pod server (../server/README.md); set its address in My Path.
- Chotu: on-device AI chat (quiet mode) and "Explain simpler" on Chai cards. The phone's RAM and space decide: Gemma 4 E2B (2.6 GB) on the phone at 5 GB RAM or more (Gemma 4 E4B, 3.7 GB, is also listed for 7.5 GB phones but E2B is offered first); below that, or without the space, there's no offline model and Chotu answers online (the server's /chotu router). There is no Lite model any more. Downloads only after the person agrees, on Wi-Fi only, from a pinned Hugging Face commit, checked by SHA-256. Distress phrases are caught on the phone before the model sees them.
- Admin switches (`data/AppConfig.kt`): on every open the app reads the server's `/config` and keeps the last answer for offline. Live announcements show as one closable banner under the top bar ("Read more" opens https links only). When pod chat or joining is switched off, the Pod tab says so plainly instead of retrying. Reviewed distress phrases for other languages are added to the on-phone check.
- Not yet built: buddy and pod-lead messages in Need to talk, push notifications for rituals, release signing.

## Content from the editors
- Chai cards can carry a drawing, lens chips, a takeaway and "Written by our editors". Shareable, non-tragic cards get "Share this card", which draws a 1080×1920 status image on the phone in the reading language.
- Practice → Learn and play: Ek Minute explainers, Timeline story, Match the Article, Quiz night, Map Chai, Number Sense, Myth vs Fact and Two Sides. A Chai card shows "Watch: 1 minute" when an explainer covers its chips.
- Pod → Study room: soundscapes, off until picked. Close the Day → Lamp off after the day is closed.
- All of it comes from the pod server's `/library` and appears only after an editor approves it (Hindi after a Hindi editor). Cached for offline; drawings and sounds are skipped in data saver. Sound never autoplays, and "remove animations" shows still frames.

The 30 template types play on nine engine players (`ui/EngineScreens.kt`), reading the `play` shape
the server prepares. All are tap-only, play to an end, and a wrong pick gets a soft word and the
reason, never a score. The ethics dilemma has no right answer.

The playful kinds (scratch, stamp trail, radio, snap together, dominoes, then and now, postcards) play
sound effects only after the member taps "Sound off" to turn them on, never on tragic items and never
in data saver. With the phone's "remove animations" setting on, scratching becomes one tap, the
postcard swaps instead of flipping, and text appears at once.

## Great-minds playbook, Section A (../great-minds-playbook.md)
Everything below stays on the phone (SharedPreferences; the WOOP is encrypted like the journal).
- Today (A1, A2, A6): tasks show minutes, not output, with a "Just 5 minutes" start and a pill that says
  "You started, and that counts" at zero. Last night's "After X, I'll Y for 5 minutes" is the first row.
  Ticking a task gets a quiet "N done. You did that." No streaks.
- Close the Day (A2, A5, A11): "One thing I can say from memory", tomorrow's if-then first step with cue
  chips, and kind wording after a slipped day.
- Recall (A5): yesterday's Exam Corner question opens Chai; Friday puts the week's misses first in
  Prelims; "Remember these?" brings back packs from 25 to 40 days ago (`data/Recall.kt`).
- Monday WOOP and the planning mirror (A3, A4, `data/Week.kt`): wish, outcome, obstacle, plan, shareable
  as one line to the pod. After 4 or more logged days the mirror says how much of a plan usually gets done
  and offers to size next week's target. Paused days are skipped.
- One nudge (A12, `data/Nudge.kt`): at the chai time picked in onboarding or My Path, only if Chai isn't done,
  and it stops after two ignored days. The Pod tab has no unread badge.
- Peak-end (A7): Prelims names one question they got right.
- Chotu at night (A9): after 23:00 the model is told it's late, and the rules cover rumination,
  catastrophising, rest and giving the user the credit. The distress check still runs first.
- My Path (A10, A14): honest numbers as "of every 1,000", a two-sided Plan B that never recommends,
  and "Know the paper, know yourself" from the topics they miss most.
- Pod (A13, A15): Ask a favour, Offer help, Ask the lead privately, and a solo 25/5 focus block.
- "Why this works", Standing on their shoulders and the reading shelf (A16, A18, `data/Guide.kt`).
- Quotes (A17): from the desk's quote bank only, at most one per screen, on one day in three, and never
  after a heavy mood.

Waiting on content or data:
- The numbers on My Path are a draft (`Guide.NUMBERS_CHECKED = false`) until checked against upsc.gov.in; the screen says so.
- Weak topics aren't weighted by PYQ frequency yet: there's no PYQ data source.
- A8 (mock scores as a range) waits until there are mocks.
- Portraits show initials until our own illustrations are drawn. Never web photos, never an AI voice.
- The shelf's "start with" chapters and any Hindi editions need an editor's check.
- No quotes are seeded. Each one is unverified until an editor checks it against the named edition and approves it.

## Focus (Regain-style)
My Path → Focus. Start a 25, 50 or 90-minute block that closes the apps you pick, and set daily limits per app.
- When a closed app opens, a calm screen shows instead. It offers "Back to studying" and, after a short pause, "Open for 5 minutes".
- Stopping a block early also asks for a short pause first. Focused minutes are logged for you only, with no targets or streaks.
- How it detects apps: an accessibility service (`data/Focus.kt`, `FocusGuard`) that only receives
  window-change events with package names. `canRetrieveWindowContent` is false, so it can't read the screen.
  The app explains this before sending the person to Settings to turn it on.
- Usage for limits is counted by the same service, so there's no usage-access permission.
- Before a Play release: the Accessibility API declaration form and a prominent in-app disclosure (the dialog
  is in `ui/FocusScreen.kt`) are required. Google may ask for a demo video.
- The desktop version is the `../focus-extension` browser extension, used with the web app (`../server/README.md`).

## Run it
1. Install Android Studio (it bundles Java and the Android SDK).
2. File > Open and pick this `android` folder. Let it sync; accept if it offers to create the Gradle wrapper.
3. Run on an emulator or a phone with USB debugging.

## Server address
- Debug builds have no preset server: type it in Me → My Path (http is fine for a local server).
- Release builds use `DEFAULT_SERVER` in `app/build.gradle.kts` (now the
  live address `https://upsc-pods-production.chotu-aec.workers.dev`; change that one line for a custom domain).
  Release builds accept https only;
  a typed http address is refused.

## Release signing (APK and AAB)
The keystore and its passwords never go in this repo. `.gitignore` covers `*.jks`, `*.keystore`,
`keystore.properties` and `local.properties`.

1. Create a keystore yourself, outside the repo, for example in `../../upsc-pods-keys/` (a folder next to
   `app`): `keytool -genkeypair -v -keystore upload.jks -keyalg RSA -keysize 4096 -validity 10000 -alias upload`.
   Keep a backup somewhere safe; Play App Signing holds the app signing key, this is the upload key.
2. Next to it, create `keystore.properties`:
   ```
   storeFile=C:/path/to/upsc-pods-keys/upload.jks
   storePassword=...
   keyAlias=upload
   keyPassword=...
   ```
   Or point at another file with `-PkeystoreProperties=/path/to/keystore.properties`, or set the env vars
   `UPSC_KEYSTORE_FILE`, `UPSC_KEYSTORE_PASSWORD`, `UPSC_KEY_ALIAS`, `UPSC_KEY_PASSWORD`
   (or `UPSC_KEYSTORE_PROPERTIES` for the file path).
3. Build: `gradle :app:assembleRelease` (APK) or `gradle :app:bundleRelease` (AAB for Play).

If anything is missing, the release build stops before compiling and names what's missing. Debug builds
never need signing details.
