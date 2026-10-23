# Build report and launch steps (18 Oct 2026)

Everything below was built and tested locally. Nothing was deployed, no live flag was changed, and no real secret was used. (The folder isn't a git repo, so there are no commits.)

## What's done, per step

1. **Google-only accounts.** Sign-in is Google only, through the Firebase project `upsc-pods`, on the web and on Android. The `sign_in_required` flag stays off until you say so.
2. **Metrics, Growth page and pod-test thresholds.** The app sends events, and the admin console has a Growth page with funnels and pod-test thresholds. Migration: `0002_growth.sql`.
3. **AI pod friends.** Four friends, each labelled "· AI":
   - They're quiet from 23:30 to 07:00.
   - Their posting level drops as more real people join: full, then light, then rituals only.
   - They cheer plain study wins only. They never respond to feelings, ranks or results.
   - They're never counted, never thanked and never shown as online.
   - They're behind the `pod_friends` flag.
4. **Free roadmap builder.**
   - The input is the exam year, hours per day, attempt, optional subject and weak papers.
   - The output is phases, subject order and hours, three checks before Prelims, and a weekly plan that adapts to last week.
   - You can tick units off and share the roadmap as an image.
   - It's on the web (Prep → Plan → Roadmap) and on Android (Prep → Plan), with a link from Chotu's plan mode. Nothing is stored on the server.
5. **Cashfree Plus (web only).**
   - Pricing: a one-time yearly payment of ₹2,499, with a founding price of ₹999 for the first 300 buyers. You can change both in admin → Payments.
   - Payment flow:
     - The server creates the order.
     - Cashfree checkout takes the payment.
     - Cashfree's webhook is checked with HMAC and a 15-minute freshness window, which grants one year exactly once.
     - There's also a return-page check.
   - Users get receipts. Refunds are done from admin, need the order id typed in, and end Plus.
   - The keys are `wrangler secret` values, and a sandbox/production switch is included.
   - Draft Privacy, Terms, Refund and Contact pages are at `/legal/`, with yellow placeholders to fill in.
   - Migration: `0003_payments.sql`. No Play Billing.

## Test results

- `tsc --noEmit`: clean.
- Server suites, all passing: auth, smoke, metrics, roadmap, community, mocks, languages, friends and payments (8 checks, run against a stand-in Cashfree).
- The friends test was flaky because of leftover posts from earlier pods. I fixed it, and it then passed twice in a row.
- Android: `assembleDebug` passes, built 18 Oct at 20:17 into `android/app/build/outputs/apk/debug/app-debug.apk` (69 MB). Without the Firebase values, sign-in in this build stays off.

## Your steps

### Firebase (console → project upsc-pods)
1. Go to Project settings → Your apps → Add app → **Web**. Copy the `apiKey` and `appId` into `server/wrangler.jsonc` → `env.production.vars` → `FIREBASE_WEB_API_KEY` and `FIREBASE_WEB_APP_ID`.
2. Go to Add app → **Android**, with package `com.upscpods.app`. Add the SHA-1 of your release key, and your debug key too if you test debug builds. You can get it with `keytool -list -v -keystore <your.jks>`.
3. Go to Authentication → Sign-in method → Google, open it, and copy the **Web client ID** (the client Firebase created, which ends in `.apps.googleusercontent.com`).
   - The Desktop client you sent (585886815849-…) belongs to a different Google Cloud project, so it won't work here. Use the upsc-pods Web client.
4. Go to Authentication → Settings → Authorized domains. Add your `*.workers.dev` domain and any custom domain.
5. In `android/local.properties`, add:
   ```
   firebase.apiKey=...
   firebase.appId=...        (the Android app id from step 2)
   firebase.projectId=upsc-pods
   firebase.webClientId=...  (from step 3)
   ```

### Cashfree
1. Run these in `server/`. Each one asks you to paste the key. Don't put the keys in chat or in files.
   ```
   npx wrangler secret put CASHFREE_APP_ID --env production
   npx wrangler secret put CASHFREE_SECRET_KEY --env production
   ```
   Start with the **sandbox** keys.
2. In `wrangler.jsonc` → production vars:
   - Set `PUBLIC_BASE_URL` to your site address, for example `https://upsc-pods.<you>.workers.dev`.
   - Keep `CASHFREE_ENV` as `"sandbox"` until a test payment works, then change it to `"production"` and put in the production keys.
3. In the Cashfree dashboard → Developers → Webhooks, add `<PUBLIC_BASE_URL>/payments/cashfree/webhook`, on the 2023-08-01 API version.
4. In admin → Payments, fill in the business details. Also replace the yellow placeholders in `server/public/legal/*.html`:
   - entity name
   - address
   - support email
   - grievance officer
   - city
   - date
5. Turn on the `plus` flag only once you're happy.

### Database (optional, because the worker creates these tables itself)
```
npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0002_growth.sql
npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0003_payments.sql
```

### Deploy and APK
- Server: `npm run deploy` in `server/`, once you give the go-ahead.
- APK: after `local.properties` has the four Firebase values, use Android Studio → Build → Generate Signed App Bundle / APK with your release key. Or run `gradlew :app:assembleRelease` with signing set up.
- Turn on `sign_in_required` after you've signed in successfully on both the web and the app.
