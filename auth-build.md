# Sign-in and access control: build notes

Why: the app can't go to people without sign-up, login and a way to switch someone's access off after they install it.

Firebase Authentication proves who someone is: phone OTP, or Google. Our own D1 `accounts` table decides whether they
may use the app. The admin console's **Members** page suspends and restores accounts.

## Where things stand (15 Oct 2026)

| Part | State |
|---|---|
| Server | Done and tested. Firebase ID-token check, `accounts` / `account_audit` / `account_tombstones`, `POST /auth/session`, `GET /me/status`, member-route gate, admin Members suspend/restore with history, `AUTH_MODE=dev`, `sign_in_required` flag. |
| Web app | Done and tested. Sign-in, access gate, suspended screen, 72-hour offline grace. |
| Android | Code done. Builds in debug and release. Not yet tested on the emulator: it was frozen, then taken by another session, and the PC had no memory for a second one. See "Android tests still to run". |
| Firebase project | **Not created yet.** Until it exists, sign-in is off everywhere and the apps behave as they did before. |
| Production | **Deployed 15 Oct 2026** (version 5f8c3737). `sign_in_required` saved OFF, migration applied, dev tokens refused, sign-in unconfigured. |

## How sign-in switches on

Sign-in is on for a client only when both are true:

1. **The client can sign in.**
   - Android: the build has the Firebase values (below), or it's a debug build talking to a local `AUTH_MODE=dev` server.
   - Web: the server's `/config` carries the Firebase web config (`FIREBASE_PROJECT_ID` + `FIREBASE_WEB_API_KEY`).
2. **The server asks for it.** The `sign_in_required` flag in Admin → Flags. With it off, calls without a sign-in work
   as before. Suspended accounts are refused either way.

**Android release builds without Firebase values still build.** Sign-in is turned off in that build: no sign-in
screen, no gate, the same app as today. Gradle prints:

```
WARNING: Sign-in is OFF in this release build (no Firebase settings). Missing: ...
```

Add the values and rebuild, and sign-in turns on. In code: `Auth.enabled` in `data/Auth.kt`, used by `authOptional`
in `MainActivity.kt`; the warning is in `app/build.gradle.kts`.

### Android values: where they go

In `android/local.properties`. This file is never committed. The values are public identifiers, not secrets.

```
firebase.apiKey=<Web API key, from Project settings → General>
firebase.appId=<the Android app's App ID, 1:…:android:…>
firebase.projectId=<project id>
firebase.webClientId=<OAuth "Web client" ID, …apps.googleusercontent.com, from Authentication → Sign-in method → Google → Web SDK configuration>
```

You can also pass them as `-Pupsc.firebase.<key>=...` or set env vars `UPSC_FIREBASE_API_KEY`, `UPSC_FIREBASE_APP_ID`,
`UPSC_FIREBASE_PROJECT_ID` and `UPSC_GOOGLE_WEB_CLIENT_ID`. We don't use `google-services.json`.

If only `webClientId` is missing, the build offers phone sign-in and no Google sign-in. Gradle warns about this too.

### Server values: where they go

These are Worker vars in `server/wrangler.jsonc` → `env.production.vars`. They're public, so they're not secrets.

- `FIREBASE_PROJECT_ID`: empty for now. While it's empty, every sign-in gets `503 auth_unconfigured`, `/config` says
  `mode: "unconfigured"`, and nothing else changes.
- `FIREBASE_WEB_API_KEY`, `FIREBASE_WEB_APP_ID`: from the Web app in Project settings. The web app needs these.
- `SUPPORT_CONTACT`: shown on the "your access has been switched off" screen.

`AUTH_MODE` is never set in production. Dev tokens (`dev:…`) are accepted only when `AUTH_MODE=dev` **and** the request
is plain http to localhost, 127.0.0.1 or 10.0.2.2, so a deployed Worker refuses them even if the var were set by
mistake. Checked on a production-like local server: `401 auth_invalid`.

## Founder: Firebase setup (once)

1. **Create the project.** At console.firebase.google.com, choose Add project (e.g. `upsc-pods`). Analytics isn't needed.
2. **Upgrade to the Blaze plan.** Phone sign-in sends SMS, and SMS needs Blaze (pay as you go). Set a budget alert
   under Billing. In Authentication → Settings → SMS region policy, allow India only.
3. **Turn on the providers.** In Authentication → Sign-in method:
   - Enable **Phone**.
   - Enable **Google** and pick the support email. Open "Web SDK configuration" and copy the **Web client ID**: that's `firebase.webClientId`.
4. **Add the Android app.** In Project settings → Your apps, choose Add app → Android, with package `com.upscpods.app`.
   - Add all four fingerprints: SHA-1 and SHA-256 for both the upload key and the debug key.
   - Phone sign-in (Play Integrity / SafetyNet) and Google sign-in both check them.
   - Run these yourself. keytool asks for the store password; type it there, never into chat or a file:

   ```
   "C:\Program Files\Android\Android Studio\jbr\bin\keytool" -list -v -keystore "<path to upload.jks>" -alias <your key alias>
   "C:\Program Files\Android\Android Studio\jbr\bin\keytool" -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey
   ```

   Copy the `SHA1:` and `SHA256:` lines from each. Once the app is on Play with Play App Signing, also add the
   **app signing key** fingerprints from Play Console → Setup → App signing.
   - Copy the Android **App ID** (`1:…:android:…`) to `firebase.appId`, the project's **Web API key** to `firebase.apiKey`, and the **Project ID** to `firebase.projectId`.
5. **Add a Web app** (for the web app at `/app/`). Under Project settings → Your apps, choose Add app → Web. Its `apiKey` and
   `appId` become `FIREBASE_WEB_API_KEY` and `FIREBASE_WEB_APP_ID`.
   - In Authentication → Settings → Authorized domains, add `upsc-pods-production.chotu-aec.workers.dev`, plus your own domain later.
6. **Set the Worker vars.** In `server/wrangler.jsonc` → `env.production.vars`, set `FIREBASE_PROJECT_ID`,
   `FIREBASE_WEB_API_KEY`, `FIREBASE_WEB_APP_ID` and `SUPPORT_CONTACT`, then run `npm run deploy` in `server/`.
7. **Build the Android release** with the values in `local.properties` (see "Android release").
8. **Turn `sign_in_required` on only when all of these are true:**
   - steps 1–7 are done;
   - you've signed in on a real phone with both phone and Google, and on the web app;
   - a suspend/restore from Members has worked on a test account;
   - the members you have are on an app version with sign-in (older Android builds have no sign-in screen, so they lose pods and Chotu online once the flag is on).

   Until then leave it **off**: suspensions still work for anyone who has signed in.

## Deploy (production)

Done on this PC on 15 Oct:

- `tsc --noEmit` / `npm run check`: pass.
- These suites pass against a fresh local server: smoke, community, chotu, languages, mocks, auth and models-hf.
- A production-like local server (no `AUTH_MODE`, empty `FIREBASE_PROJECT_ID`, flag off) behaves correctly:
  - `/config` gives `auth.mode: "unconfigured"` and `required: false`;
  - dev tokens get `401`;
  - member routes work without a token;
  - `/`, `/app/` and the Members API (with a staff key) give `200`.
- `npx wrangler whoami`: logged in, account `chotu`.

Done on 15 Oct, after the founder's go-ahead, in this order from `server/`. Keep this order for any fresh database:
the flag must be saved OFF before the deploy, otherwise `sign_in_required` defaults to ON and locks everyone out of
pods and Chotu online.

```
npx wrangler d1 execute upsc-pods --remote --env production --command "INSERT INTO settings (key, json, updated_at, updated_by) VALUES ('flags', '{\"sign_in_required\":false}', datetime('now'), 'deploy: sign-in rollout') ON CONFLICT(key) DO UPDATE SET json = json_set(json, '$.sign_in_required', json('false'))"
npx wrangler d1 execute upsc-pods --remote --env production --file=migrations/0001_accounts.sql
npm run deploy
```

This ships the Hidden Why thread's server changes too: the picture engine, content.ts, desk.html, the templates and the
`content/preview-2026-10-10` drafts. The drafts stay unpublished until they're approved in the desk.

Live smoke test, 15 Oct: all of the below pass. `/brief/latest` is 404 only because no brief is published yet.
The Members page loads, but the admin API answers "Set ADMIN_TOKEN…" because no staff key is set in production.
The founder runs `npx wrangler secret put ADMIN_TOKEN --env production` (types the value there) to use it.

Smoke-test `https://upsc-pods-production.chotu-aec.workers.dev`:

- `/` and `/app/`: the welcome page loads.
- `/config`: `"sign_in_required":false` and `"mode":"unconfigured"`.
- The Free Shelf opens in `/app/`.
- `/me/status` with no token: `401 auth_required`. With `Authorization: Bearer dev:x`: `401 auth_invalid`.
- `/admin`: the Members page loads (staff key).
- No Hidden Why titles appear in the member content lists.

## Android release

The signed release needs `keystore.properties`, which this PC doesn't have in the default place
(`Documents/upsc-pods-keys/keystore.properties`). There are two ways:

- Android Studio: Build → Generate Signed App Bundle / APK, with `upload.jks`.
- Terminal, from `android/`, with keystore.properties in place or `-PkeystoreProperties=<path>`:

  ```
  set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
  set JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\gsock
  "%USERPROFILE%\.gradle\wrapper\dists\gradle-9.8.1-bin\a2l6ltp3k1vth6lwipzm5p2jp\gradle-9.8.1\bin\gradle.bat" :app:assembleRelease -PkeystoreProperties="<path to keystore.properties>"
  ```

  The APK lands in `android/app/build/outputs/apk/release/app-release.apk`. Without Firebase values it has sign-in off,
  and prints the warning above.

`data/Chotu.kt` already sends the sign-in token: `.addInterceptor(AuthInterceptor)` at `data/Chotu.kt:161`, imported at `:64`.

## Android tests still to run (debug build, local `AUTH_MODE=dev` server, emulator)

Server: `npx wrangler dev --ip 0.0.0.0 --port 8787 --var AUTH_MODE:dev --var EDITOR_TOKEN:<any local value>`. In the app:
Me → Settings → server `http://10.0.2.2:8787`.

1. **Fresh install.** Onboarding shows the sign-in step. Dev sign-in with any number makes an account, and the member appears in Admin → Members.
2. **Existing install** (onboarded before sign-in). One sign-in screen appears. After sign-in the same member id, pod and saved data are there.
3. **Suspend** in Members, then background and reopen the app (force the check: wait 6 h or clear `lastOk`). The "access switched off" screen shows, and the pod socket closes.
4. **Restore**, then "Sign in again". The app works.
5. **Offline within 72 h** (airplane mode). The app works.
6. **Offline past 72 h** (set the emulator clock ahead 73 h, airplane mode). The "Connect to the internet" gate shows. Online again plus Try again unlocks it.
7. **Release build without Firebase.** No sign-in screen and no gate. Pods and Chotu work against a server with the flag off.
