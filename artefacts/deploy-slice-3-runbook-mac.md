# Deploy slice 3 to production, Mac Terminal (zsh), 31 Oct 2026

Replaces `deploy-slice-3-runbook-powershell.md` (written for the old Windows PC). You approved this deploy on 31 Oct.

What this adds:
- **Email password recovery** for username accounts. It stays off until the mail secrets are in (step 3).
- **A softer offline gate:** the app stays readable offline.
- **Play Billing for Plus:** built, but the `play_billing` flag stays off.
- **The content drafts:** 30 syllabus notes, 3 CSAT passages, 3 full Prelims GS1 mocks, and the syllabus map for the
  optionals and language papers. They arrive as drafts; nothing is public until an editor approves it.

How to run it:
- Open **Terminal** (Applications > Utilities). Paste one line at a time and wait for it to finish.
- If a step fails, stop and send Claude the full output.

## Step 0. One-time Mac set-up

### 0a. Go to the server folder
```bash
cd ~/Documents/app/server
```
- Success: no output.

### 0b. Make sure the server tools are installed
```bash
npm install
```
- Success: ends with "added ... packages" or "up to date". Warnings are fine.

### 0c. Sign in to Cloudflare (first time on this Mac)
```bash
npx wrangler login
```
- Success: your browser opens a Cloudflare page. Click **Allow**. Terminal then says "Successfully logged in".
- Failure: if the browser doesn't open, copy the link Terminal prints into your browser.

### 0d. Check it's the right account
```bash
npx wrangler whoami
```
- Success: shows your Cloudflare email and the account that owns `upsc-pods`.

### 0e. Make the backup and pack folders
```bash
mkdir -p ~/Documents/app-backups ~/Documents/app-packs
```
- Success: no output.

## Step 1. Back up the live database
```bash
npx wrangler d1 export upsc-pods --env production --remote --output="$HOME/Documents/app-backups/upsc-pods-2026-10-31-slice3.sql"
```
- Success: wrangler says the export is done. Then check the file isn't empty:
```bash
ls -lh ~/Documents/app-backups
```
- Failure: stop here. If the error mentions login, repeat step 0c.

## Step 2. New tables (two migrations, one line each)
```bash
npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0006_password_recovery.sql
```
```bash
npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0007_play_purchases.sql
```
- Success: wrangler reports the queries ran. Both use `IF NOT EXISTS`, so repeating them is harmless.
- Failure: stop. Nothing has changed, and your backup is in place.

## Step 3. Mail secrets (skip today unless Resend shows aspiran.in as "Verified")
Without them, recovery simply stays off and the apps say to write to support.
Type each value when asked. Never put it in a file or a chat.
```bash
npx wrangler secret put RESEND_API_KEY --env production
```
```bash
npx wrangler secret put MAIL_FROM --env production
```
- For MAIL_FROM type: `Aspiran <no-reply@aspiran.in>`
- Success: each prints "Success! Uploaded secret".

## Step 4. Deploy the Worker
```bash
npm run deploy
```
- Success: ends with `https://upsc-pods-production.chotu-aec.workers.dev` and a "Current Version ID" line.
- Failure: the old version keeps running, so the live app is unaffected. Send Claude the output.

## Step 5. Upload the content drafts (after step 4)
### 5a. Go to the app folder and check the syllabus files
```bash
cd ~/Documents/app
```
```bash
node server/scripts/syllabus.mjs check
```
- Success: lists the three mocks at 100 questions each, no problems.

### 5b. Build the pack
```bash
node server/scripts/syllabus.mjs pack ~/Documents/app-packs/syllabus-2026-10-31
```
- Success: says `30 reads, 4 mocks`.

### 5c. Enter the editor token (it won't show as you type; press Return after)
```bash
cd ~/Documents/app/server
```
```bash
read -rs "EDITOR_TOKEN?Production editor token: " && export EDITOR_TOKEN && echo
```
```bash
export BASE="https://upsc-pods-production.chotu-aec.workers.dev"
```

### 5d. Import
```bash
npm run import -- ~/Documents/app-packs/syllabus-2026-10-31
```
- Success: ends with `Imported. Approve on the desk`.
- If it says 401: the token is wrong. Repeat the `read` line in 5c.
- If a file fails to upload: run the import line again. Repeats are safe.

## Step 6. Smoke checks (same Terminal window, after step 5)
```bash
B=https://upsc-pods-production.chotu-aec.workers.dev
```
```bash
curl -s "$B/health"; echo
```
- Success: shows `"ok":true`.
```bash
curl -s "$B/config" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const c=JSON.parse(s);console.log("play_billing:",c.flags.play_billing,"recovery:",c.auth.recovery)})'
```
- Success: `play_billing: false`. `recovery:` is `false` if you skipped step 3, `true` if you set both mail secrets.
```bash
curl -s "$B/library" | grep -c full-mock
```
- Success: prints `0` (drafts are not public). Anything else: a mock was approved; check the desk.
```bash
curl -s -H "authorization: Bearer $EDITOR_TOKEN" "$B/desk/api/library" | grep -c pre-gs1-full-mock-1
```
- Success: prints `1` or more (the mock is on the desk).
```bash
curl -s -o /dev/null -w "%{http_code}\n" "$B/media/ca/2026-41/02-el-nino.mp4"
```
- Success: prints `403` (the Plus lock still holds).

## Step 7. Look at the desk
Open https://upsc-pods-production.chotu-aec.workers.dev/desk, paste the editor token into **Editor token**, then click
**Library**. You should see the new drafts. (An empty Library with "Wrong or missing key." at the top right means the
token box is empty or wrong.)

## Notes
- The release APK for Play waits for `upload.jks` (see `android-studio-first-build-mac.md`, step 3) and your Play account.
- The Play Billing library adds the `com.android.vending.BILLING` permission even with the flag off. That's normal.
- The web app caches its shell for offline use; visitors get the new version next time they open it online.
