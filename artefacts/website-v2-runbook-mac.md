# Website v2 and website Chotu, Mac Terminal (zsh), 1 Nov 2026

What this does, in order:
1. **Server:** deploys the two new routes the website needs:
   - `/web/chotu`: Chotu chats on the site, with short replies, daily caps, quiet hours and the distress check;
   - `/web/lead`: saves what visitors tell Chotu, plus their phone or email if they tick the box.
   You can download the list as a spreadsheet from admin.
2. **Website:** publishes the new long homepage (17 "rooms", Chotu walking along) by merging the `homepage-v2` branch.
   **Merging publishes aspiran.in**, so look at the preview first.

Before you start:
- The new homepage is **English only** for now. A Hindi version follows.
- At night (23:30 to 07:00 IST) the scripted Chotu still guides visitors and saves their answers, but **AI replies
  are off** and he says it's late.
- The privacy page on the same branch now covers website chat and visitor details. Read it in the preview.

Checked on the Mac before this runbook:
- type check passes;
- the routes were tested locally (a lead saves, a contact needs the tick, chat replies, the distress check returns
  helplines, the CSV downloads);
- the homepage was checked on desktop and phone width;
- all 14 server test suites pass (1 Nov, on fresh local test servers).

How to run it: open **Terminal**, paste one line at a time, and wait for each to finish. If a step fails, stop and send
Claude the full output.

---

## Step 1. Check the server code

### 1a. Go to the server folder
```bash
cd ~/Documents/app/server
```
- Success: no output.

### 1b. Get the latest code
```bash
git pull
```
- Success: "Already up to date" or a list of changed files.

### 1c. Type check
```bash
npm run check
```
- Success: ends with no errors.

## Step 2. Deploy the server

You approve this deploy by running it.

### 2a. Deploy
```bash
npm run deploy
```
- Success: ends with "Deployed upsc-pods-production" and a list of triggers.
- Failure: send Claude the output. Nothing changes on the live server if the deploy fails.

### 2b. (Optional) Create the two new tables now

The server creates them itself the first time they're needed, so you can skip this. Running it just makes it explicit.
```bash
npx wrangler d1 execute upsc-pods --remote --env production --file=migrations/0008_web_leads.sql
```
- Success: "Executed ... commands".

## Step 3. Check the new routes are live

### 3a. Save a test visitor
```bash
curl -s -X POST https://upsc-pods-production.chotu-aec.workers.dev/web/lead -H "content-type: application/json" -d '{"visitorId":"runbook-test-0001","details":{"name":"Runbook test"}}'
```
- Success: `{"ok":true,"saved":1,"contact":false}`

### 3b. Ask Chotu one question
```bash
curl -s -X POST https://upsc-pods-production.chotu-aec.workers.dev/web/chotu -H "content-type: application/json" -d '{"visitorId":"runbook-test-0001","lang":"en","messages":[{"role":"user","content":"What is Aspiran?"}]}'
```
- Success (daytime): `{"reply":"...","ai":true}`, with a short reply.
- Success (23:30 to 07:00): `{"reply":"It's past 11:30 at night...","quiet":true,"ai":false}`
- Failure: `"offline":true` means no AI provider answered. Try again in a minute; if it repeats, send Claude the output.

## Step 4. Download the visitor list

### 4a. Put your admin key in this Terminal window only

This line asks for the key without showing it on screen, and doesn't save it anywhere.
```bash
read -s "TOKEN?Admin key: "
```
- Type or paste your `ADMIN_TOKEN` and press Return. Nothing shows; that's expected.

### 4b. Download the list
```bash
curl -s -H "authorization: Bearer $TOKEN" "https://upsc-pods-production.chotu-aec.workers.dev/admin/api/web/leads?format=csv" -o ~/Downloads/aspiran-web-leads.csv
```
- Success: no output. Open `aspiran-web-leads.csv` in Downloads. You'll see the "Runbook test" row.
- To list only people who left a phone or email, add `&contact=1` after `format=csv`.

## Step 5. Publish the new homepage

### 5a. Look at the preview first
```bash
cd ~/Documents/aspiran-web && git fetch && git checkout homepage-v2 && npm install && npm run build && npm run preview
```
- Success: it prints a local address (usually http://localhost:4321). Open it, scroll the whole page, chat with Chotu,
  and try it on your phone's width (browser developer tools). Press Control-C in Terminal when done.

### 5b. Open the pull request
Open https://github.com/srsrsrsr9/aspiran-web/pull/new/homepage-v2 in your browser, then click **Create pull request**.

### 5c. Merge it (this publishes aspiran.in)
On the pull request page, click **Merge pull request**, then **Confirm merge**.
- Success: in a few minutes the **Actions** tab shows a green tick, and https://aspiran.in shows "Light up the syllabus."
- Failure: a red cross in Actions. Send Claude the link. The old page stays live until a build succeeds.
- **To undo:** on the merged pull request, click **Revert**, then merge that revert. The old page comes back.

### 5d. Go back to the main branch locally
```bash
git checkout main && git pull
```

## Step 6. Before sharing the site widely

- **Privacy page:** updated on the same branch (website chat, visitor answers, contact only with the tick, AI
  providers). Read it at `/privacy` in the preview (step 5a) before merging. Retention period, legal name, address and
  grievance contact are still placeholders.
- **Hindi homepage:** to follow.
- **The ₹999 offer** on the site says "first 300 on the website". The web checkout (Cashfree) is still in sandbox, so
  the site's "Save my seat" only collects contacts for now. That's what it says, so nothing is promised that can't
  be delivered.
