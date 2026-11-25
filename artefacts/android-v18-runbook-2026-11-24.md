# Android version 18 (0.6.0): build, upload to internal testing, Data safety (Mac)

24 Nov 2026. About 40 minutes. You build and sign in Android Studio; Claude never touches the key or its passwords.

**What's new in 18** (full list: `artefacts/android-parity-2026-11-24.md`):
- Coaching centres, the student side: join with a code or a pasted invite link, the centre's name, logo and colour,
  announcements and batch chat, doubts with a photo, the centre's plan, its notes and question sets, your own progress.
  It only appears while the server's `institutes` flag is on (still off; switching it on is yours).
- Study walks (the two-voice audio lectures) on Listen.
- The short "debrief" after a practice set or a mock now shows for free members too (counts only).
- Everything from 17 that never reached Play (Chotu keeps you to your own plan, Jeetu's plan card, "Your week",
  illustrated shorts, Hindi captions, ₹3,999).

**Before you start:** the project must be up to date with the merged work. The coordinating session merges this branch
into `master`; wait for its "merged" note.

---

## Step 1. Get the latest code
Open Terminal and run:

```bash
cd ~/Documents/app && git status --short | head
```
- Success: nothing printed, or only files you know about.
- Failure (files you didn't change): stop and ask Claude before going on.

```bash
cd ~/Documents/app && git log --oneline -1 && grep -n "versionCode\|versionName" android/app/build.gradle.kts
```
- Success: `versionCode = 18` and `versionName = "0.6.0"`.
- Failure (still 17): the branch isn't merged yet. Ask Claude to merge it, then repeat this step.

## Step 2. Open the project in Android Studio
File → Open → `~/Documents/app/android` → Open (or, if it's already open, File → Sync Project with Gradle Files).
- Success: "Gradle sync finished" at the bottom, no red errors in the Build panel.
- Failure "SDK 37 not installed": Tools → SDK Manager → tick Android API 37 → Apply, then sync again.

## Step 3. Quick check on your phone (10 minutes, recommended)
Plug in your phone (USB debugging on), pick it in the device list at the top, choose the **debug** variant, press Run ▶.
Check these five things:
1. Prep → Practice → **Listen**: "Study walks" appears as a group (once the walks are published on the server).
2. Do a short Prelims practice set: Chotu's two-line note appears at the end.
3. Me: no "Coaching centre" row yet (the flag is off). That's right.
4. Prep → Current affairs: illustrated shorts open; captions show; sound starts off.
5. Chotu tab: Chotu answers; Jeetu's chip shows on a plan question.
- Success: all five behave as above.
- Failure: note which one and what you saw, and tell Claude. Don't upload.

## Step 4. Build the signed bundle
1. Build → **Generate Signed App Bundle or APK…** → **Android App Bundle** → Next.
2. Key store path: `~/Documents/upsc-pods-keys/upload.jks`. Type the key store password, pick the alias, type the key
   password. Leave "Export encrypted key" unticked. Next.
3. Build variant: **release**. Create.
- Success: "App bundle(s) generated successfully". The file is `android/app/release/app-release.aab`, dated today.
- Failure "Sign-in is OFF in this release build": `android/local.properties` lost its Firebase lines. See
  `artefacts/android-aspiran-id-firebase-mac.md`, steps 2 to 4.
- Failure "versionCode 18 has already been used": someone uploaded 18 already. Ask Claude to bump to 19.

## Step 5. Upload to internal testing
1. Open https://play.google.com/console → Aspiran → **Test and release → Testing → Internal testing**.
2. **Create new release** → Upload → pick `android/app/release/app-release.aab`.
3. Release name: `18 (0.6.0)`. Release notes (English):
   ```
   Coaching centres: join yours with a code (when your centre uses Aspiran). Study walks on Listen. A short note after each practice set. Chotu keeps you to your own plan; Jeetu's plan card; "Your week" on Sundays. Illustrated shorts and Hindi captions.
   ```
4. Next → **Save and publish** (internal testing has no review).
- Success: the release shows "Available to internal testers" within a few minutes.
- Failure "You need to update your Data safety form" or a warning about photos: do Step 6 first, then come back.
- Failure about a permission: copy the exact message to Claude.
- Two yellow warnings are normal; press Save (or Next) anyway. They will come back on every release:
  - "no deobfuscation file": the app's code isn't scrambled (R8 is off), so there is nothing to upload.
  - "native code … debug symbols": the native parts come ready-made from libraries (the on-phone Chotu engine and two
    Android libraries) with no symbols to upload. Tried on 25 Nov; it can't be fixed from our side.

## Step 6. Data safety: one answer changes
Centre doubts can carry a photo, and the server keeps it so the teacher can see it. Version 17's form said photos are
"processed ephemerally". For 18 that becomes **No**. Nothing else changes (messages, name and app activity were
already declared).

Easiest way, with the ready file:
1. Play Console → **Policy and programs → App content → Data safety** → Manage (or Start).
2. **Import from CSV** → pick `~/Documents/app/artefacts/play/data_safety_import-2026-11-24-v18.csv`.
3. Check one screen: Data types → Photos and videos → Photos → "Is this data processed ephemerally?" shows **No**;
   "Collected" ticked, "Shared" not ticked; purpose "App functionality"; users can choose.
4. Save → Submit.
- Success: Data safety shows "In review" or the new date.
- Failure (import refused): do it by hand: Data types → Photos → edit → ephemerally: No → Save → Submit.

## Step 7. Install from Play on your phone
On the phone, open the internal-testing link (Play Console → Internal testing → Testers → "Copy link"), accept, then
update Aspiran from Play.
- Success: Settings → Apps → Aspiran shows version 0.6.0.
- Failure "app not available": the phone's Google account isn't in the testers list. Add it under Testers.

## Later (not needed for 18)
- **Centre invite links that open the app directly** need a small file on app.aspiran.in with the app's Play signing
  fingerprint (Play Console → Setup → App signing → SHA-256). When you want this, send Claude that fingerprint (it is not
  a secret) and Claude adds the file and the link handling for version 19. Until then, students paste the link or type
  the code in Me → Coaching centre.
- **Switching on coaching centres** (the `institutes` flag in Admin → Flags) is yours. Version 18 is ready for it.
