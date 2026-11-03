# Put the Aspiran test app on your phone over USB (Mac)

3 Nov 2026. About 10 minutes the first time, 1 minute after that.

**Why:** Play Protect blocked the app ("App blocked to protect your device"). In India, Google blocks apps that use an
*accessibility service* when they're installed from WhatsApp, a browser or a file manager. Aspiran uses one for
Focus blocks: it's how the app notices a distracting app opening and shows the "back to work" screen. The app is fine.
Installing from your Mac over a USB cable is not blocked this way. When the app comes from Google Play, this goes away.

Open Terminal (zsh). Run one command at a time.

## Step 1. Turn on USB debugging on the phone (once)
On the phone:
1. Settings → About phone → tap **Build number** 7 times. It says "You are now a developer".
2. Settings → System → Developer options → turn on **USB debugging**.
- Failure: no "Build number"? Some phones put it under About phone → Software information.

## Step 2. Connect the phone
Plug the phone into the Mac with a USB cable that carries data. On the phone, a box asks "Allow USB debugging?".
Tick "Always allow from this computer" and tap **Allow**.

## Step 3. Check the Mac sees the phone
```bash
~/Library/Android/sdk/platform-tools/adb devices
```
- Success: a line with a serial number and the word `device`.
- Failure `unauthorized`: look at the phone and tap Allow, then run Step 3 again.
- Failure: an empty list. Try another cable (some only charge), or pull down the phone's notification shade and set
  USB to "File transfer". Then run Step 3 again.

## Step 4. Install the app
```bash
~/Library/Android/sdk/platform-tools/adb install -r ~/Documents/app/android/app/release/release/app-release.apk
```
- Success: `Success`. Aspiran is in the app drawer.
- If the phone shows a Play Protect box during the install, choose **Install anyway**. Don't tap "Scan app" or OK.
- Failure `INSTALL_FAILED_UPDATE_INCOMPATIBLE`: an old copy is still there. Run Step 5, then Step 4 again.
- Failure `no devices`: go back to Step 3.

## Step 5. Only if Step 4 says UPDATE_INCOMPATIBLE: remove the old copy
```bash
~/Library/Android/sdk/platform-tools/adb uninstall in.aspiran.app
```
- Success: `Success`.

## Step 6. Afterwards (optional)
You can turn USB debugging off again in Developer options. Leave it on if you'll install new builds often.

## Next builds
Once you've rebuilt the app in Android Studio, run Step 4 again. With the phone plugged in, Android Studio's green
▶ Run button does the same thing.
