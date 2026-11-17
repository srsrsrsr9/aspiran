# Switch Plus payments to real money (Cashfree production), 17 Nov 2026

Price is already live: **₹3,999 a year**, no founding offer. Today payments run in Cashfree **sandbox** (no money moves;
a sandbox payment gives one day of Plus). This switches to real payments.

You do Parts A and B (they involve your Cashfree login and the keys). Then tell Claude "Cashfree keys are in", and
Claude switches the server to production and deploys (Part C). Between B and C, checkout won't work for a few
minutes. Nobody is buying yet, so that's fine.

## Part A. In the Cashfree dashboard (Chrome)

1. Top of the dashboard: switch from **Test** to **Production** (Live).
   - Success: you see the live dashboard with no "test mode" banner.
   - Failure: it says your account isn't activated. Finish KYC / activation first; nothing else here works until then.
2. **Developers → Whitelisting** (or "Domain whitelisting"): add `app.aspiran.in` for Payment Gateway.
   - Success: the domain shows as approved (Cashfree may take up to a day to approve).
   - Failure: if live checkout later says "domain not whitelisted", this is the step.
3. **Developers → Webhooks**: add `https://app.aspiran.in/payments/cashfree/webhook` for payment events
   (Payment Success, Failed, User Dropped). Version: the latest offered.
   - Our server also sends this address with every order, so this is a backup.
4. **Developers → API Keys**: generate production keys. Keep the page open. **Don't paste the keys into chat or any file.**

## Part B. In Terminal (zsh), one command at a time

```bash
cd ~/Documents/app/server
```

```bash
npx wrangler secret put CASHFREE_APP_ID --env production
```
Paste the **App ID** when it asks, then Enter.
- Success: "✨ Success! Uploaded secret CASHFREE_APP_ID".
- Failure "not logged in": run `npx wrangler login`, then repeat.

```bash
npx wrangler secret put CASHFREE_SECRET_KEY --env production
```
Paste the **Secret Key**, then Enter. Same success message.

Then tell Claude: **"Cashfree keys are in."**

## Part C. Claude

Sets `CASHFREE_ENV` to `production` in `server/wrangler.jsonc`, deploys, and checks Admin → Payments says
"Cashfree is set up, in PRODUCTION mode".

## Part D. One real test payment (you)

To test without paying ₹3,999:
1. Admin → Payments → price: set the yearly price to **₹1**, founding off. Save.
2. In the web app, signed in with your own account: Me → Plus → Get Plus. Pay ₹1 by UPI.
   - Success: you come back to the app and Plus is on; Admin → Payments shows the order as paid, mode production.
   - Failure: send Claude the order id from Admin → Payments.
3. Admin → Payments: refund that ₹1 order (Plus ends for that account).
4. Set the yearly price back to **₹3,999**. Save. Check the Plus page shows ₹3,999.
