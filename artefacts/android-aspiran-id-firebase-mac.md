# Android app id is now in.aspiran.app: your Firebase steps, Mac Terminal (zsh), 2 Nov 2026

What changed: the app's Play id is now `in.aspiran.app` (it was `com.upscpods.app`). Play and Firebase treat it as a
new app, so Google sign-in needs one new Firebase registration. The debug build is checked: it builds and carries the
new id. The server knows the new id (deployed 2 Nov).

Don't upload the old files in `android/app/release/`: they carry the old id. Build a fresh release after Step 3.

---

## Step 1. Get your key fingerprints (SHA-1)
### 1a. Go to the Android folder
```bash
cd ~/Documents/app/android
```
### 1b. Print the fingerprints
```bash
./gradlew signingReport
```
- Success: a block for `debug` and one for `release`, each with a line starting `SHA1:`. Copy both SHA-1 values.
- If the release block says it has no config, Android Studio's Build → Generate Signed Bundle uses your `upload.jks`.
  You can also run `keytool -list -v -keystore <path to upload.jks>` and type the password yourself.

## Step 2. Register the new app in Firebase (browser)
1. Open https://console.firebase.google.com → project **upsc-pods** → Project settings → Your apps → **Add app → Android**.
2. Package name: `in.aspiran.app`. Nickname: Aspiran.
3. Add **both** SHA-1 values (debug and release).
4. Finish. You can skip the `google-services.json` download, because the app doesn't use that file.
5. Copy the new app's **App ID**. It looks like `1:751265224545:android:…`.

## Step 3. Put the new App ID in your local settings
Open `android/local.properties` in Android Studio, change the line `firebase.appId=` to the new App ID, and save.
Leave the other `firebase.` lines as they are. (I never open this file.)

## Step 4. Try it on your phone
1. Uninstall the old "UPSC Pods" app from the phone. The new id installs as a separate app.
2. In Android Studio, press Run.
- Success: "Continue with Google" signs you in.
- Failure: if it says "developer error" or closes at once, the SHA-1 for that build is missing in Step 2. Add it, wait
  5 minutes, and try again.

When sign-in works on the phone, tell me. Then it's time for the first release build for Play.
