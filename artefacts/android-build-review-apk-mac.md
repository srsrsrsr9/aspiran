# Build the Aspiran test copy yourself (Android Studio, Mac)

3 Nov 2026. About 10 minutes.

**Why:** Google sign-in failed on the copy Claude built ("[16] Account reauth failed"). That copy was signed with
Android Studio's debug key, and Google sign-in is fussy about which key signed the app. If you build the same test
copy and sign it with **your own Aspiran key**, the key Firebase already knows from the earlier runbook, sign-in should work.

The test copy ("review") is the normal app minus the part that closes other apps during Focus blocks, so Play
Protect lets it install from WhatsApp or Drive.

## Before you start (1 minute)
In the Firebase console → Project settings → Your apps, open the Android app **in.aspiran.app** (not
com.upscpods.app). Check that your Aspiran key's SHA-1 is listed there. It's the one from Step 1 of
`artefacts/android-aspiran-id-firebase-mac.md`. If it isn't listed, add it and wait 5 minutes.

## Step 1. Open the project
Open Android Studio → File → Open → `~/Documents/app/android` → Open. Wait until the bar at the bottom stops
("Gradle sync finished").
- Failure "sync failed": File → Sync Project with Gradle Files, then wait again.

## Step 2. Start a signed build
Menu: **Build → Generate Signed App Bundle or APK…** → choose **APK** → Next.

## Step 3. Pick your key
- Key store path: your Aspiran keystore file (the one you moved out of `docs/`).
- Type the key store password, pick the key alias, type the key password. Android Studio can remember them.
- Next.
- Failure "Keystore was tampered with, or password was incorrect": the store password is wrong. Type it again.

## Step 4. Pick the test copy
- Build variant: **review** (not release, not debug).
- Destination folder: leave it as it is.
- Create.
- Success: a small box at the bottom right says "APK(s) generated successfully". Click **locate**.
  Finder opens a folder (likely `android/app/release/review/`) with the file `app-review.apk` in it.
- Failure: copy the red text from the Build window and send it to Claude.

## Step 5. Put it on the phone
1. On the phone, uninstall Aspiran (the copy that failed to sign in).
2. Send `app-review.apk` to yourself on WhatsApp or Drive, open it on the phone and install.
3. Sign in with Google.
- If sign-in still fails with "[16]": send Claude a screenshot of the Firebase page from "Before you start",
  with the SHA-1 lines visible. SHA-1s aren't secret.

## Next time
Steps 1 to 5 again. Android Studio remembers the key, so it takes about 2 minutes.
