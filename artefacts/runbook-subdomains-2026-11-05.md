# Runbook: app.aspiran.in and admin.aspiran.in (5 Nov 2026)

**Goal:**
- **app.aspiran.in** opens the web app, so the website can send visitors straight into it.
- **admin.aspiran.in** opens Admin; the Desk is at admin.aspiran.in/desk.
- The old workers.dev address keeps working, because the Android app uses it.

**Already done by Claude (deployed 5 Nov):** the server knows both names. Opening app.aspiran.in goes to the app, and
admin.aspiran.in goes to Admin. Anyone who opens /admin or /desk on app.aspiran.in is sent to admin.aspiran.in.

**Why you have to do this part:** aspiran.in's DNS is at GoDaddy. A Cloudflare Worker can only get a subdomain when
Cloudflare runs the domain's DNS. So aspiran.in moves to Cloudflare's free plan. The website, email and everything else
stay as they are, as long as every DNS record is copied over (steps 1–2).

Everything below is done in a browser. There's no Terminal, and it works from a phone or any computer.

## 1. Note down GoDaddy's DNS records (5 min)
GoDaddy → My Products → aspiran.in → **DNS**. Take a screenshot of every record. Today they include:
- 4 × **A** records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 (GitHub Pages: the website)
- **CNAME** `www` → srsrsrsr9.github.io
- **MX** `@` → my.mailbux.com (priority 10): your email
- **TXT** `@` → `v=spf1 include:msg25.com ~all`
- Possibly more for email (DKIM, DMARC) or domain verification (Google). Screenshot those too.

## 2. Add aspiran.in to Cloudflare (10 min)
1. dash.cloudflare.com (the same account the app is on) → **Add a domain** → `aspiran.in` → **Free** plan.
2. Cloudflare scans the DNS. Compare its list with your screenshots and **add anything missing**.
3. Set the 4 A records and the `www` CNAME to **DNS only** (a grey cloud, not orange). The website's own HTTPS
   needs that.
4. Cloudflare shows two **nameservers** (like `xxx.ns.cloudflare.com`). Keep that page open.
   - Success: Cloudflare lists all your records.

## 3. Point GoDaddy at Cloudflare (5 min, then a wait)
1. GoDaddy → aspiran.in → **DNS** → **Nameservers** → **Change nameservers** → "I'll use my own nameservers".
2. Enter the two Cloudflare nameservers. Save.
3. Wait for Cloudflare's email saying "aspiran.in is now active". It usually takes under an hour, and at most a day.
   - Success: aspiran.in still opens the website and email still arrives.
   - If the website breaks: check the 4 A records and `www` in Cloudflare (step 2.3).
   - If email stops: the MX or TXT records are missing. Add them in Cloudflare → DNS.

## 4. Give the app its two names (5 min)
1. Cloudflare → **Workers & Pages** → **upsc-pods-production** → **Settings** → **Domains & Routes** → **Add** →
   **Custom domain** → `app.aspiran.in` → Add.
2. Do the same for `admin.aspiran.in`.
   - Success: after a few minutes, https://app.aspiran.in opens the app and https://admin.aspiran.in opens Admin's sign-in.

## 5. Let sign-in work on the new names (2 min)
Firebase console → project **upsc-pods** → **Authentication** → **Settings** → **Authorized domains** → **Add domain**:
`app.aspiran.in`, then `admin.aspiran.in`.
- Success: "Continue with Google" works on app.aspiran.in.
- Failure: "unauthorized domain" means that step isn't saved yet.

## 6. Tell Claude "subdomains are live"
Claude then does these:
- Records both domains in the app's settings, so every deploy keeps them.
- Points payment returns and email links at app.aspiran.in.
- Changes the website's "open the app" links to app.aspiran.in.
- Checks both addresses.

Later, when Cashfree goes live, add `app.aspiran.in` as the website domain in Cashfree's dashboard.
