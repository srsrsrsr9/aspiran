# Android version 19 (0.7.0): the new first week. Build, check, upload (Mac)

25 Nov 2026. About 30 minutes. You build and sign in Android Studio; Claude never touches the key or its passwords.

**What's new in 19** (the plan: `artefacts/android-conversion-engine-2026-11-25.md`):
- A shorter welcome: one question and your language, sign in, then one last screen (name, 18+, what we keep).
- "Your first five minutes" right after it, instead of the tour of the tabs. One button opens today's Chai.
- The Adda opens on one **Next up** card, a "Your first week" path of 8 steps, and "What you've built so far".
- A tick and "Next: …" after each step. At most 3 first-week steps a day.
- The chai-time question now comes when there are cards to bring back. The morning nudge says how many came back.
- Day 5: "Your first week", in the person's own numbers. Free members also see what Plus would add, with
  "Keep going free" beside "See Plus". No price on that screen. Never in result week or after a distress check.
- "Need to talk?" moved from the top bar into the ⋮ menu on every screen. Light/dark moved there too.
- Chotu's "How's it going? Good / Okay-ish / Rough day" is gone. Chotu doesn't respond to feelings (standing rule).

Data safety: **no change**. The new count says only which step and which day, under "App activity", which is already declared.

---

## Step 1. Get the latest code
```bash
cd ~/Documents/app && git log --oneline -1 && grep -n "versionCode\|versionName" android/app/build.gradle.kts
```
- Success: `versionCode = 19` and `versionName = "0.7.0"`.
- Failure (still 18): the work isn't on this copy yet. Ask Claude.

## Step 2. Open the project in Android Studio
File → Open → `~/Documents/app/android` (or File → Sync Project with Gradle Files if it's open).
- Success: "Gradle sync finished", no red errors.
- Failure "SDK 37 not installed": Tools → SDK Manager → tick Android API 37 → Apply, sync again.

## Step 3. Walk through it as a new person (15 minutes, please do this one)
No emulator works on this Mac, so this phone check is the only one the new screens have had.

1. On your phone: Settings → Apps → Aspiran → Storage → **Clear storage** (so it starts as new).
2. In Android Studio pick your phone, choose the **debug** variant, press Run ▶.
3. Check, in order:
   1. Welcome: the Preamble question, the language chips, "Come in".
   2. Sign in, then **One last screen**: name box, "I'm 18 or older…" tick, "What we keep" opens and closes.
      The button stays grey until the tick.
   3. **Welcome, <name>.** with three numbered lines. Press "Start with today's Chai".
   4. Read the cards and close. Back on the Adda: a dark bar "✓ Read today's Chai · Next: pick when…" with "Go".
   5. The big card now says "Pick when your cards come back". Press it, pick 8 am, allow notifications, Done.
   6. Next it says "Meet your pod". Press it: the Pod tab opens. Go back: 3 of 8 ticked.
   7. The big card now says "That's a good day." (three steps is the day's limit).
   8. ⋮ at top right: "♡ Need to talk?" opens the Need to talk sheet (talk to someone you trust; call 112); "☾ Dark mode" switches the theme.
- Success: all of the above.
- Failure: note the step number and what you saw, tell Claude, don't upload.

## Step 4. Build the signed bundle
1. Build → **Generate Signed App Bundle or APK…** → **Android App Bundle** → Next.
2. Key store `~/Documents/upsc-pods-keys/upload.jks`, your passwords, the alias. Next.
3. Variant **release** → Create.
- Success: "App bundle(s) generated successfully"; `android/app/release/app-release.aab` dated today.
- Failure "Sign-in is OFF in this release build": see `artefacts/android-aspiran-id-firebase-mac.md`, steps 2 to 4.
- Failure "versionCode 19 has already been used": ask Claude to bump to 20.

## Step 5. Upload to internal testing
1. https://play.google.com/console → Aspiran → **Test and release → Testing → Internal testing** → **Create new release**.
2. Upload `android/app/release/app-release.aab`. Release name `19 (0.7.0)`. Notes:
   ```
   A new first week: your first five minutes, one clear next step on the Adda, and everything you've built in one place. Pick when your cards come back. Need to talk is in the ⋮ menu on every screen.
   ```
3. Next → **Save and publish**.
- Success: "Available to internal testers" within a few minutes.
- The two yellow warnings ("no deobfuscation file", "native code … debug symbols") are normal. Press Save anyway.
- Failure about anything else: copy the exact message to Claude.

## Step 6. Update from Play on your phone
Open the internal-testing link and update Aspiran.
- Success: Settings → Apps → Aspiran shows 0.7.0.
- If version 18 was never uploaded, that's fine: 19 includes everything in 18.
