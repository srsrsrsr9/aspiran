# Android app id is now in.aspiran.app: your Firebase steps, Mac Terminal (zsh), 2 Nov 2026

What changed: the app's Play id is now `in.aspiran.app` (it was `com.upscpods.app`). Play and Firebase treat it as a
new app, so Google sign-in needs one new Firebase registration. The debug build is checked: it builds and carries the
new id. The server knows the new id (deployed 2 Nov).

Don't upload the old files in `android/app/release/`: they carry the old id. Build a fresh release after Step 3.

---

## Step 1. Get your key fingerprints (SHA-1)

You need three SHA-1 values: the **debug** key (for Run in Android Studio), your **upload** key (`upload.jks`), and
Google's **app signing** key (what Play installs on people's phones).

`./gradlew signingReport` prints the debug one, then stops with "Cannot query the value of this provider" at the
release block. That's expected: the build looks for the release key's passwords in
`~/Documents/upsc-pods-keys/keystore.properties`, which isn't on this Mac yet. Use the steps below instead.

### 1a. Move the key out of the docs folder
`docs/` is part of the project. Git ignores `.jks` files, but the key is safer in its own folder outside the project.
That's also where the build looks for it.
```bash
mkdir -p ~/Documents/upsc-pods-keys && mv ~/Documents/app/docs/upload.jks ~/Documents/upsc-pods-keys/
```
- Success: no output. `ls ~/Documents/upsc-pods-keys` shows `upload.jks`.

### 1b. The debug SHA-1 (you already have it)
From your `signingReport` output: `74:03:EC:AD:3D:6E:8B:6D:51:BC:94:68:00:B7:FA:6D:2E:03:13:5B`. It isn't secret.

### 1c. The upload key's SHA-1
```bash
keytool -list -v -keystore ~/Documents/upsc-pods-keys/upload.jks
```
- It asks for the keystore password. Type it (nothing shows) and press Return.
- Success: a block with `Alias name:` and a line starting `SHA1:`. Copy that SHA-1 and note the alias name.
- Failure: "keystore password was incorrect" means try again. "command not found: keytool" means use Android
  Studio's own copy:
  `"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" -list -v -keystore ~/Documents/upsc-pods-keys/upload.jks`

### 1d. Google's app signing SHA-1 (once the Play account is approved)
Play Console → your app → **Test and release → App integrity → App signing**. Copy the SHA-1 under
"App signing key certificate". Add it in Step 2 when you have it. Until then, sign-in works in your own builds,
but not in the copy installed from Play.

### 1e. (For release builds later) Let the build find the key
Create `~/Documents/upsc-pods-keys/keystore.properties` in TextEdit (Format → Make Plain Text) with these four lines,
filling in your own values:
```
storeFile=/Users/srinivasvedantam/Documents/upsc-pods-keys/upload.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=THE_ALIAS_FROM_1c
keyPassword=YOUR_KEY_PASSWORD
```
After that, `./gradlew signingReport` shows the release block too. This file stays outside the project, and I never
open it.

## Step 2. Register the new app in Firebase (browser)
1. Open https://console.firebase.google.com → project **upsc-pods** → Project settings → Your apps → **Add app → Android**.
2. Package name: `in.aspiran.app`. Nickname: Aspiran.
3. Add the debug and upload SHA-1 values (1b and 1c). Add Google's app signing SHA-1 (1d) when you have it: Project
   settings → the Aspiran app → **Add fingerprint**.
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
