# Runbook: move the Cloudflare account to Workers Paid ($5 a month)

Why: see `artefacts/d1-usage-review-2026-11-24.md`. On the free plan the database stops answering for the rest of the
day once it reads 5 million rows. Workers Paid includes 25 billion rows read and 50 million written a month, plus more
for Workers and Durable Objects, for a flat $5 a month at our size.

You do this in the browser. Nothing in Terminal, no code change, no redeploy. About 5 minutes.

1. **Sign in** at https://dash.cloudflare.com and pick the account named **chotu**.
   - Success: you see the account home with Workers and D1 in the left menu.
   - If you see a different account name: use the account switcher at the top left.

2. **Open the Workers plans page.** Left menu: **Compute (Workers)** → **Workers & Pages** → **Plans**.
   (If the menu looks different: search "Workers plans" in the dashboard search bar.)
   - Success: you see "Free" marked as current and "Paid" at $5/month.

3. **Choose Paid** → **Purchase Workers Paid** (wording may differ slightly). Pay with your card.
   - Success: the page now shows "Workers Paid" as current, and you get a Cloudflare receipt email.
   - If the card is declined: try another card. Nothing changes on the site while you sort it out.

4. **Check nothing else changed.** Open https://aspiran.in and the app. Both should work as before.
   - The upgrade takes effect at once. No redeploy needed.

5. **Add a spending alert** (so a surprise bill can't happen). Left menu: **Manage account** → **Notifications** →
   **Add** → **Usage Based Billing**. Pick **D1** (and **Workers**), set a threshold (for example 1 billion rows read),
   and use your email.
   - Success: the alert shows in the Notifications list.
   - If you can't find "Usage Based Billing": skip it and tell Claude. The included amounts are far above what we use.

6. **Tell Claude it's done.** Claude will note it on the status page and check usage a few days later.

Cost: $5 a month. Extra is charged only past the included amounts ($0.001 per million rows read after 25 billion), which
we're nowhere near, even at 10,000 students.
