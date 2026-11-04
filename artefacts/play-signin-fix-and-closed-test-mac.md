# Play: fix "Account reauth failed", then start the closed test (4 Nov 2026)

For the owner. Nothing here needs Terminal. It all happens in the browser: Play Console, Firebase and Google Cloud.

## What the error means
`[16] Account reauth failed` from the Play copy of the app almost always means **Google doesn't recognise the key
the app is signed with**. Play re-signs every app with Google's own key ("app signing key"). That key's fingerprints
have to be in Firebase. The ones from your Mac's upload key are not enough.

## Part A. Fix sign-in (about 15 minutes, then a 10-minute wait)

### A1. Copy Play's fingerprints
Play Console → Aspiran → **Protected with Play** (or Test and release → **App integrity**) → **App signing**.
Under **App signing key certificate** (not "Upload key certificate"), copy the **SHA-1** and the **SHA-256**.
- Failure: no App signing page. A release hasn't finished processing yet. Wait an hour and look again.

### A2. Add them to Firebase
Firebase console → project **upsc-pods** → ⚙ Project settings → Your apps → the Android app **in.aspiran.app** →
**Add fingerprint** → paste the SHA-1 → Save. Do it again for the SHA-256.
- Success: the app now lists at least 3 fingerprints: your upload SHA-1, Play's SHA-1 and Play's SHA-256.
- Failure: no `in.aspiran.app` app in Firebase. Add it (Add app → Android → package `in.aspiran.app`), then tell me,
  because the app needs the new `google-services.json`.

### A3. Check Google Cloud made the Android sign-in client
console.cloud.google.com → choose the **upsc-pods** project → APIs and services → **Credentials** → under "OAuth 2.0
Client IDs" there should be an **Android** client for `in.aspiran.app` with Play's SHA-1.
- Failure: there isn't one. Create credentials → OAuth client ID → Android → package `in.aspiran.app` → Play's SHA-1.

### A4. Check the sign-in screen is open to everyone
Same place → **OAuth consent screen** (Google Auth Platform → Audience). The publishing status should be
**In production**.
- Failure: it says **Testing**. Then only the listed test users can sign in. Press **Publish app** (basic profile
  and email need no Google review), or add each tester's Gmail as a test user.

### A5. Try again on the phone
Wait 10 minutes. Then go to Settings → Apps → Aspiran → Storage → **Clear storage**, open the app and press "Continue
with Google".
- Success: you're in, and Today shows.
- Failure: the same error again. Send me a screenshot of the Firebase fingerprints list and the Credentials page,
  with the keys hidden.

## Part B. Closed testing: yes, start it now
You don't have to wait for internal testing. The closed test is separate, and the 14-day clock only starts once 12
testers have opted in, so starting early saves time. **But do Part A first**, or every tester will hit the same
sign-in error and drop out.

### B1. What Play needs before a closed test (all on the Dashboard)
- Store listing complete: text and images from `artefacts/play/store-listing.md` and `artefacts/play/`
- App content: privacy policy, ads (none), app access, content rating, target audience, data safety, government app
  (no), financial features (none), health (none)
- **App access**: choose "All or some functionality is restricted" and write: *"Sign in with any Google account.
  No special access needed."* Google's reviewers must be able to get in.

### B2. Create it
Test and release → Testing → **Closed testing** → Create track (or use "Alpha") → **Testers**: create an email list
with 12 or more Gmail addresses → Save → **Create new release** → **Add from library** → pick the bundle already in
internal testing (version 2) → release notes → Next → **Start rollout to Closed testing**.
- Success: the status shows "In review". The first review can take a few hours to a few days.
- Failure: "complete the following" → it lists the missing Dashboard items from B1.

### B3. Get testers in
Testers tab → copy the **opt-in link** → send it to the 12. Each one opens it signed in to that Gmail → Become a
tester → installs from Play. They need to stay opted in for **14 days in a row**. Ask them to open the app now and
then, because Google asks about tester engagement when you apply for production.
