# First Play Store release: build in Android Studio, test on your phone (Mac)

3 Nov 2026. The code is ready for Play. This takes about an hour the first time, mostly in Play Console. You build the app
bundle yourself in Android Studio; I never touch the key or its passwords.

**Plan:** internal testing first (you plus up to 100 testers you name, live in minutes, no review), then closed testing,
then production. Everything to paste into Play Console is in `artefacts/play/store-listing.md`. The icon and feature
graphic are in `artefacts/play/`.

**What's different in the Play build:** Focus blocks can't close other apps yet. That feature needs Google's
accessibility review, so it's left out of this first version, and the Focus screen says so. Plus purchases stay off
until the `plus_yearly` product exists. Everything else is the same as your review copy.

---

## Before you start (check, 5 minutes)
1. **Sign-in works in Android Studio's Run.** If you haven't done Steps 2–4 of `artefacts/android-aspiran-id-firebase-mac.md`
   (register `in.aspiran.app` in Firebase, put its App ID in `android/local.properties`), do them now. Without them the
   build has no sign-in, and the app can't load any content.
2. **One Chai is published.** Approve and publish today's Chai in the Desk, so Today isn't empty when you open the app.
3. **The upload key** is at `~/Documents/upsc-pods-keys/upload.jks`, and you know its password and alias.

## Step 1. Open the project in Android Studio
File → Open → `~/Documents/app/android` → Open. Wait for "Gradle sync finished" at the bottom.
- Success: no red errors in the Build panel.
- Failure "SDK 37 not installed": Tools → SDK Manager → tick Android API 37 → Apply, then File → Sync Project with Gradle Files.

## Step 2. Remove the old bundle
In Finder, open `~/Documents/app/android/app/release/` and move everything in it to the Bin. Those files are from before
the app id changed, and Play would reject them.

## Step 3. Build the signed app bundle
1. Build → **Generate Signed App Bundle or APK…** → choose **Android App Bundle** → Next.
2. Key store path: `~/Documents/upsc-pods-keys/upload.jks`. Type the key store password, pick the key alias and type the
   key password. Leave "Export encrypted key" unticked. Next.
3. Build variant: **release** (not review, not debug). Create.
- Success: a pop-up "Generate Signed Bundle: App bundle(s) generated successfully", with a **locate** link. The file is
  `android/app/release/app-release.aab`, about 20–40 MB, dated today.
- Failure "Sign-in is OFF in this release build" in the Build output: the Firebase values are missing. Go back to "Before
  you start", item 1.
- Failure "keystore password was incorrect": type it again; the alias and the key password may differ from the store password.

## Step 4. Create the app in Play Console
https://play.google.com/console → **Create app**.
- App name: `Aspiran: UPSC prep, together`. Default language: English (India) – en-IN. App or game: **App**. Free or
  paid: **Free** (Plus is an in-app purchase, which is allowed in a free app).
- Package name: `in.aspiran.app` (it can never be changed after this). Press "Check availability".
- Leave "automatic protection" on.
- Tick all three declarations (Developer Program Policies, Play App Signing, US export laws) → Create app.

## Step 5. Internal testing release
1. Left menu: Test and release → Testing → **Internal testing** → Testers tab → Create email list. Name it "Aspiran
   team", add your Gmail (and Pooja's) → Save changes.
2. Releases tab → **Create new release**.
3. App signing: choose **Use Google-generated key** (Play App Signing, the default) → Continue.
4. Upload `app-release.aab` from Step 3. Release name fills in itself ("1 (0.1.0)"). Release notes: `First test build.`
5. Next → **Save and publish** (or Review release → Start rollout).
- Success: the release shows "Available to internal testers".
- Failure about "missing declarations" or "privacy policy": fill in the App content items Play lists (Step 7) and come back.
- Failure about the "foreground service" or "accessibility": paste the foreground-service answer from `store-listing.md`.
  If it mentions accessibility, tell me. The Play build shouldn't declare it.

## Step 6. Make sign-in work for the Play copy (important)
Play re-signs the app with Google's own key, so Firebase has to know that key too, or "Continue with Google" fails.
1. Play Console → **Protected with Play** (left menu; App integrity moved there in 2026) → App signing. Copy the **SHA-1**
   and the **SHA-256** under "App signing key certificate". The page appears once the first release is uploaded.
2. Firebase console → project upsc-pods → Project settings → the Aspiran Android app (`in.aspiran.app`) → **Add
   fingerprint** → paste the SHA-1 → Save. Do the same for the SHA-256.
3. Wait 10 minutes.

## Step 7. App content (Policy → App content)
Answer each item from the "App content" and "Data safety" tables in `artefacts/play/store-listing.md`. Play shows these
as a checklist on the Dashboard; some may be needed before testers can install.

## Step 8. Install it on your phone
1. Internal testing → Testers tab → copy the **opt-in link** ("Join on the web").
2. On your phone, signed in to the same Gmail you added in Step 5, open the link → **Become a tester** → "download it on
   Google Play".
3. Uninstall any review copy of Aspiran first (it has a different key), then press Install in Play.
- Success: Aspiran installs from Play, "Continue with Google" signs you in, Today shows the Chai.
- Failure "app not available": the link can take up to an hour the first time. Make sure the phone's Play Store uses the
  tester Gmail (Play Store → your picture → switch account).
- Failure: sign-in says "developer error" or closes. Step 6 isn't done yet, or the 10 minutes haven't passed.

## Step 9. Store listing (needed before closed testing)
Grow → Store presence → **Main store listing**: paste the name, descriptions, icon, feature graphic and 4–6
screenshots from your phone (see `store-listing.md`). Store settings: category Education, email hello@aspiran.in.

## After that
- **Each new version needs a higher number.** Tell me before you build again, and I'll raise `versionCode` in
  `android/app/build.gradle.kts`.
- **Personal or organisation account?** If the Play developer account is a *personal* account made after November
  2023, Google needs a **closed test with at least 12 testers, opted in for 14 days in a row**, before you can apply for
  production. An *organisation* account (SnapSkill LLP, with a D-U-N-S number) skips that. Start the closed test early:
  Testing → Closed testing → the same bundle → a list of 12+ Gmail addresses.
- **Plus in the app** comes later: create the `plus_yearly` subscription in Monetize, then tell me and I'll switch it on.
- **Focus closing apps** comes later too, through Play's accessibility declaration with a short video.
- **Account deletion requests by email** (hello@aspiran.in): delete them in Admin → Privacy with the member id, within 7 days.
