# Aspiran go-live: what only you can do (14 Nov 2026)

Everything else is live: server version f5e87433 (14 Nov), 1,175 content items switched on, the free topic demo
working again, the daily fact watch running at 05:30 IST. These steps need your accounts, keys or phone.
Do them in order. Terminal steps are for macOS Terminal (zsh), one command at a time.

## 1. Rotate the Sarvam key and store the new one (5 min)

The Sarvam key was pasted into a chat, so treat it as seen.

1. On the Sarvam dashboard, delete that key and make a new one. Copy it.
2. In Terminal:

```
cd ~/Documents/app/server
```

```
npx wrangler secret put SARVAM_API_KEY --env production
```

Paste the new key when asked and press Return. Nothing shows while you paste.
- Success: `✨ Success! Uploaded secret SARVAM_API_KEY`.
- Failure "More than one account": you left out `--env production`. Run the command again with it.
- Failure "not logged in": run `npx wrangler login`, then repeat.

## 2. Payments: Plus is switched on, but Cashfree is still in test mode

Right now anyone can "buy" Plus with Cashfree's test cards and gets one day of Plus. No real money moves.
Choose one:

- **A. Not ready to take money yet (recommended until Cashfree approves the live account):** Admin → Flags →
  switch **plus** off. The Plus screens hide. Nothing else changes.
- **B. Cashfree live account is approved:** in the Cashfree dashboard, switch to Production and copy the App ID and
  Secret Key. Then in Terminal (in `~/Documents/app/server`):

```
npx wrangler secret put CASHFREE_APP_ID --env production
```

```
npx wrangler secret put CASHFREE_SECRET_KEY --env production
```

  Each one should end with `✨ Success!`. Then tell Claude "switch Cashfree to production". Claude changes
  `CASHFREE_ENV`, deploys, and checks a ₹1 test order with you.

## 3. Password sign-in is still on

You decided on 1 Nov to offer Google sign-in only. It is still on live. Go to Admin → Flags and switch
**password_login** off. Success: the app's sign-in screen shows only "Continue with Google".

## 4. Support contact: done

Set to hello@aspiran.in on 14 Nov and deployed. Make sure that inbox is read daily.

## 5. Android 0.5.3 (version code 11)

This version wraps the action buttons on small screens and has no helpline numbers: Need to talk and Close the day offer
only "Call Emergency 112" (your decision, 14 Nov).

1. Android Studio → Build → Generate Signed App Bundle → `release`, with your `upload.jks`.
2. Play Console → App content → **Data safety**: declare "App interactions" and "Crash logs" as collected for
   Analytics, processed by a service provider (PostHog), and that users can opt out (Me → Privacy). PostHog has been
   in the app since version 8, so the form must say this before you upload.
3. Play Console → Testing → Internal testing → Create release → upload the `.aab` → Roll out.
4. Install it from the testing link on your phone. Check that Need to talk shows only "Call Emergency 112", and that the
   buttons on a long note wrap instead of breaking into single letters.
5. When you're happy: Production → Create release → choose the same bundle.

## 6. Tomorrow after 05:30 IST: look at the fact watch (1 min)

Admin → Content → **Fact watch**. Each fact shows "same", "candidate" (a new value seen once; it changes the
notes only if it shows again the next day) or "needs a person". "Needs a person" usually means a source website
was down or changed. You also get an email only when something changes or needs you.

## Not urgent, still open

- A lawyer's read of analytics being on by default (opt-out, with notice) under the DPDP Act.
- 258 videos and 60 interactives are made but not in the app yet: next build work.
- More past papers: 2022 Prelims GS1 is now in (5 Prelims papers, 4 Mains). 2020 and 2024 need the same
  OCR and checking; UPSC's 2024 key wasn't found on its site yet.
