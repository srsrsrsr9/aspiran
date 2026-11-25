# Android version 19 (0.7.0): the new first week. Build, check, upload (Mac)

25 Nov 2026. About 30 minutes. You build and sign in Android Studio; Claude never touches the key or its passwords.

**What's new in 19** (the plan: `artefacts/android-conversion-engine-2026-11-25.md`):
- **Try before you join (26 Nov, your call: "the web app is better").** A new install opens on a front door:
  "Federalism, in about 15 minutes" with "Start the tour", then "Join free" and "I already have an account".
  The tour is the same Federalism demo as on the website, inside the app, with no account and no setup. Its own
  "Join free" button hands over to the app's sign-up, which then skips the Preamble question.
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
Claude checked steps 1 to 3 on the Pixel 10a emulator on 26 Nov. The rest has only had your eyes.

1. On your phone or the emulator: Settings → Apps → Aspiran → Storage → **Clear storage** (so it starts as new).
2. In Android Studio pick your phone, choose the **debug** variant, press Run ▶.
3. Check, in order:
   1. Front door: "Remember what you read.", the Federalism card, "Start the tour", "Join free", "I already have an account".
   2. Start the tour: the Federalism demo opens (as on the website), with "✕ Close" above it. Try a chapter or two.
      Phone Back goes back inside the demo, then to the front door.
   3. In the demo, press its **Join free**: the app's own "Welcome in." screen opens (language, then Come in).
   4. Sign in, then **One last screen**: name box, "I'm 18 or older…" tick, "What we keep" opens and closes.
      The button stays grey until the tick.
   5. **Welcome, <name>.** with three numbered lines. Press "Start with today's Chai".
   6. Read the cards and close. Back on the Adda: a dark bar "✓ Read today's Chai · Next: …" with "Go".
      (Between 23:30 and 07:00 the big card says "It's late." with no button: that's Chotu's quiet hours, not a fault.)
   7. ⋮ at top right: "♡ Need to talk?" opens the Need to talk sheet (talk to someone you trust; call 112); "☾ Dark mode" switches the theme.
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
   Try a whole topic before you sign up. A new first week: your first five minutes, one clear next step on the Adda, and everything you've built in one place. Pick when your cards come back. Need to talk is in the ⋮ menu on every screen.
   ```
3. Next → **Save and publish**.
- Success: "Available to internal testers" within a few minutes.
- The two yellow warnings ("no deobfuscation file", "native code … debug symbols") are normal. Press Save anyway.
- Failure about anything else: copy the exact message to Claude.

## Step 6. Update from Play on your phone
Open the internal-testing link and update Aspiran.
- Success: Settings → Apps → Aspiran shows 0.7.0.
- If version 18 was never uploaded, that's fine: 19 includes everything in 18.
