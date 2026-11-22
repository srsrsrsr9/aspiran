# Groq on a paid plan, with spend watched by group (owner runbook, 22 Nov 2026)

**What this does:** puts Groq on a paid plan with a monthly cap. Groq then shows three bills side by side:
free users and visitors (the marketing cost), Plus members, and our own jobs.
**Who runs it:** you. The payment and the keys are yours to type. Claude never sees them.
**Time:** about 15 minutes.

The server is already built for this. Until a new key is added, every group keeps using the current key, so
nothing breaks if you stop halfway.

## Part A: in the browser (console.groq.com)

1. **Sign in** at https://console.groq.com with the account that owns the current Aspiran key.
   - Success: you see the dashboard.
   - Failure: if you're unsure which account holds the key, check Settings → API Keys for a key used on
     22 Nov 2026 or before.

2. **Add a payment method:** Settings → Billing → upgrade to the paid plan, and add your card.
   - Success: Billing shows a paid plan.
   - Failure: if the card is refused, try another card or contact Groq support. Nothing in the app changes meanwhile.

3. **Set the monthly cap:** Settings → Billing → Limits. Suggested starting cap: **$50 a month**, with alerts at
   50%, 75% and 90%.
   - Success: the limit shows on the page.
   - Note: the cap covers the whole account, not each project. When it's reached, Groq stops answering. Chotu then
     falls back to the other providers (NVIDIA, Google), so it slows down but doesn't stop.

4. **Make two projects:** use the project menu at the top → Create project. Name them `aspiran-free` and
   `aspiran-plus`. The existing default project stays for our own jobs.
   - Success: three projects show in the project menu.

5. **Make one key in each new project:** switch to `aspiran-free` → API Keys → Create. Name it `aspiran-free`
   and copy it. Keep the browser tab open; you'll paste it in Part B. Then do the same for `aspiran-plus`.
   - Failure: if you lose a key before pasting it, delete it and make a new one.

## Part B: in Terminal (zsh), one command at a time

6. Go to the server folder:

```bash
cd ~/Documents/app/server
```

   - Success: no output.

7. Add the free-users key. When it asks, paste the `aspiran-free` key and press Return:

```bash
npx wrangler secret put GROQ_API_KEY_FREE --env production
```

   - Success: `✨ Success! Uploaded secret GROQ_API_KEY_FREE`.
   - Failure: if it says you're not logged in, run `npx wrangler login`, then repeat this step.

8. Add the Plus key the same way, pasting the `aspiran-plus` key:

```bash
npx wrangler secret put GROQ_API_KEY_PLUS --env production
```

   - Success: `✨ Success! Uploaded secret GROQ_API_KEY_PLUS`.

9. **Check:** open Admin → Helpers and usage. Under "Groq spend this month", all three keys show ✓.
   Groq's console shows usage under each project within about 15 minutes of the first chats.

## What goes where

| Group | Key | Groq project |
|---|---|---|
| Website visitors, free members, pod chats | GROQ_API_KEY_FREE | aspiran-free (marketing cost) |
| Plus members | GROQ_API_KEY_PLUS | aspiran-plus |
| Drafting, checks, fact watch, institutes | GROQ_API_KEY (current) | default |

## Undo

To send a group back to the current key, delete its secret:
`npx wrangler secret delete GROQ_API_KEY_FREE --env production` (or `_PLUS`).
