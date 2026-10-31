# Android Studio on the Mac: first build (31 Oct 2026)

For the owner. One step at a time. Debug builds need no signing key; only Play uploads need `upload.jks`.

## Already done by Claude
- `android/local.properties`: the SDK line now points at the Mac SDK (`/Users/srinivasvedantam/Library/Android/sdk`).
  Only that line was changed; your Firebase lines were left as they were.
- Added the Gradle wrapper (`gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`, Gradle 9.8.1). It was missing.
- A command-line debug build was tried: see "Build result" at the end.

## Step 1. Open the project
1. Open Android Studio. Choose **Open**, pick the folder `Documents/app/android` (the `android` folder, not `app`), click **Open**.
2. If asked "Trust project?", choose **Trust Project**.
- Success: the bottom bar says "Gradle sync" and finishes with no red errors (first time can take 5 to 15 minutes; it downloads libraries).
- Failure "SDK Platform 37 not installed" (or a link "Install missing SDK package"): click the link, accept, let it download, then
  **File > Sync Project with Gradle Files**. This app compiles against Android 37; the Mac only has 36.1 so far.
- Failure about "Gradle JDK" or "toolchain 25": **Settings > Build, Execution, Deployment > Build Tools > Gradle >
  Gradle JDK**, choose **jbr-25** (Android Studio's own Java), then sync again.
- Failure with Windows paths (`C:\...`) in the message: quit Android Studio, then in Terminal run step 1b, then open again.

### Step 1b (only if Windows paths cause trouble)
Moves Android Studio's old Windows settings aside; it rebuilds them.
```bash
mv ~/Documents/app/android/.idea ~/Documents/app/android/.idea-windows-old
```
- Success: no output.

## Step 2. Build and run the debug app
1. Plug in your phone (USB debugging on) or start an emulator (**Device Manager**).
2. Pick the **app** configuration at the top, press the green **Run** button.
- Success: the app opens on the phone. In debug builds you type the server address in Me > Settings.
- Failure: copy the first red error line from the **Build** window and send it to Claude.

## Build result (Claude, 31 Oct)
Not finished from Claude's side. Claude's sandbox blocks Java from reaching the internet, so Gradle 9.8.1 and the
libraries couldn't download. That's a limit of Claude's sandbox, not of the project. Android Studio on your Mac has
no such block, so Step 1 does the first real download and build. The `app-debug.apk` in `app/build` is the old one
from the Windows PC (24 Oct).

## Step 3. Find `upload.jks` (needed only for Play uploads)
It is not on this Mac (a search found no `.jks` file). It is probably on the old Windows PC, in a folder
`upsc-pods-keys` next to the `app` folder, with `keystore.properties` beside it.
1. Copy the whole `upsc-pods-keys` folder from the old PC (USB stick, not email or cloud chat) to `Documents`, so you have
   `~/Documents/upsc-pods-keys/upload.jks`.
2. Open `~/Documents/upsc-pods-keys/keystore.properties` in TextEdit and change the `storeFile=` line to:
   `storeFile=/Users/srinivasvedantam/Documents/upsc-pods-keys/upload.jks` (the passwords stay as they were). Save.
3. Check it is there:
```bash
ls ~/Documents/upsc-pods-keys
```
- Success: shows `keystore.properties` and `upload.jks`.
- Important: if `upload.jks` is lost and the app was already uploaded to Play with it, Play can reset the upload key
  (Play Console > App integrity). If nothing has been uploaded yet, a new key can simply be made. Tell Claude which.
- Note: if you rename the package to `in.aspiran.app` (pending item 9), do it before the first Play upload.
