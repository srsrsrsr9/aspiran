# Username and password sign-in (20 Oct 2026)

This is a stop-gap sign-in that works next to "Continue with Google" until Google sign-in is fixed on Android. It runs on our own server, so nothing needs changing in Firebase.

## What it does
- **Accounts:**
  - Sign up, sign in, sign out and change password.
  - Usernames are 3–30 characters of `a-z 0-9 _ .` (stored lower-case).
  - Passwords must be at least 8 characters.
- **Password storage:** passwords are stored as PBKDF2-SHA256 hashes, with 100,000 iterations (the most Cloudflare Workers allows) and a salt for each user. Checks are constant-time.
- **Limits and errors:**
  - After 5 wrong tries, a username is locked for 15 minutes.
  - Each IP gets 30 failed sign-ins and 10 sign-ups per 15 minutes. IPs are kept only as hashes.
  - A wrong username and a wrong password give the same error message.
- **Session tokens:**
  - The server signs its own session token (HMAC, valid for 30 days). Member routes and pod sockets accept it the same way as a Google token.
  - In the accounts table the provider is `password`.
  - Changing or resetting a password signs out every other device.
- **Forgotten passwords:** there's no email, so there's no self-service reset. In admin → Members → Sign-in accounts, find the person by username and click **Reset password…**. That shows a one-time temporary password, and the app makes them choose a new one at their next sign-in.
- **Same as Google accounts:** suspend, restore, data export and erasure all work the same way. A suspended username that erases its data stays suspended if it signs up again.
- **Flag `password_login`** (on by default): switching it off stops new sign-ups and sign-ins. People already signed in stay signed in.
- **Web and Android:** the sign-in screen has a "Use username and password" link under "Continue with Google". Me → Account has "Change password".

## Files
- **Server:**
  - `src/password.ts` and `src/password-hash.ts` (new)
  - Changes to `src/auth.ts`, `index.ts`, `admin.ts`, `admin.html`, `privacy.ts`, `staff.ts` and `shared.ts`
  - `migrations/0004_password_login.sql`, and the same tables in `schema.sql` and `schema-console.sql`
- **Tests:** `test/password.mjs` (new; run with `npm run test:password`)
- **Web:** `public/app/auth.js`, `app.js` and `index.html`; the service worker is now `upsc-shell-v14`
- **Android:** `data/Auth.kt`, `data/AppConfig.kt`, `data/Community.kt`, `ui/SignIn.kt`, `ui/MeScreens.kt` and `MainActivity.kt`

## Google sign-in on Android: what I found
- **Google errors now show their real cause.** They include the Credential Manager or Firebase error type and code, and there's a **Copy error details** button. The same text is logged under the tag `UpscAuth`.
- **Wrong app ID in the Android settings.** `android/local.properties` has `firebase.appId` set to the Firebase **web** app ID (`1:751265224545:web:…`), not an Android app ID (`1:751265224545:android:…`). That points to the Android app not being registered in Firebase with its SHA-1s.
  - Without that registration, Google has no Android OAuth client for `com.upscpods.app` plus the signing key.
  - Credential Manager then typically fails straight after you pick an account, which is the "closed before you finished" symptom.
- **The web client ID is from the right project.** `firebase.webClientId` belongs to project 751265224545 (upsc-pods), so it's no longer the other project's Desktop client. Its format alone doesn't tell whether it's the *Web* client; check in the console.
- **Signing keys of the latest APKs:**
  - `app-release.apk` (19 Oct, 12:54) is signed with the upload key `CN=upsc`, SHA-1 `8A:41:F5:07:C7:B6:41:03:94:29:4C:0D:4F:D5:4F:BE:CE:DF:70:B4`.
  - `app-debug.apk` is signed with the debug key, SHA-1 `DB:A8:EA:8D:5F:5E:4B:E2:8E:36:C8:C3:73:2F:DE:02:B8:C7:7E:33`.
- **No phone was connected**, so I couldn't check which build is installed.

### To fix Google sign-in
1. In Firebase console → upsc-pods → Project settings → Your apps → **Add app → Android**, with package `com.upscpods.app`. Add both SHA-1s above, and Play's app-signing SHA-1 if you install from Play.
2. Put the new Android **App ID** (`1:751265224545:android:…`) in `android/local.properties` as `firebase.appId`.
3. Check that `firebase.webClientId` is the **Web client (auto created by Google Service)** shown under Authentication → Sign-in method → Google → Web SDK configuration.
4. Rebuild the APK. If it still fails, send the "Copy error details" text.

## Update, 20 Oct 2026
- Google sign-in on Android works now. The owner added the right SHA-1 in Firebase.
- I deployed on the owner's go-ahead. The live version is a7744786. The live `/config` shows `auth.password: true`, and the service worker is `upsc-shell-v14`.
- If you publish on Play, copy the **App signing key certificate** SHA-1 from Play Console (Test and release → App integrity → App signing) and add it in Firebase → Project settings → the Android app → Add fingerprint.
