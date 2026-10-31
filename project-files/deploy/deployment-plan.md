# UPSC Pods: deployment plan

Written 12 Oct 2026 from the code in `C:\Users\Srinivas Vedantham\Documents\Personal\app`. You carry this out yourself; each step says where things go and what to check before moving on. Nothing here changes app code.

## What actually gets deployed

The whole service is **one Cloudflare Worker** (`server/`, named `upsc-pods`). It serves:

| Piece | Where it lives in the code | Deployed as |
|---|---|---|
| API, pods chat, Commons rooms, crons | `server/src/*.ts` | the Worker, with two Durable Objects (`POD`, `COMMONS`) |
| Web app | `server/public/app/` | static assets of the same Worker, at `/app/` |
| Desktop app | the same web app | nothing extra: people install it from Chrome or Edge (PWA). There's no separate desktop codebase |
| Admin console, editor desk | `server/src/admin.html`, `desk.html` | routes `/admin` and `/desk` on the Worker |
| Status page | `server/src/status.ts` | `/status` and `/status.json` on the Worker |
| Database | `server/schema.sql` | Cloudflare D1, database `upsc-pods` |
| Media, content packs, Chotu's model files | | R2 bucket `upsc-pods-media` (model files under `models/`) |
| Backups | `server/src/backups.ts` | R2 bucket `upsc-pods-backups` (never served) |
| News drafting | `env.AI` | Workers AI binding (public news only) |
| Cloud Chotu | `server/src/chotu.ts` | calls Groq with `GROQ_API_KEY` |
| Android app | `android/` | Play Store, `com.upscpods.app`, target SDK 36 |
| Focus extension | `focus-extension/` | loaded unpacked for now; Chrome Web Store later |

So there's one deploy command (`npm run deploy` in `server/`) for everything except the Android app and the extension.

## Monthly cost at launch (rough)

| Item | Cost |
|---|---|
| Cloudflare Workers Paid plan (recommended, see step 2) | US$5 a month, about ₹450 |
| D1, R2, Durable Objects, Workers AI | inside the included allowances at launch scale; R2 has no download fees, so model downloads cost nothing extra |
| Domain | about ₹700 to ₹1,000 a year |
| Groq (cloud Chotu) | pay as you go; set a spend limit (step 2) |
| Play developer account | US$25 once |
| Uptime monitor, Cloudflare Access | free tiers |

Expect roughly **₹500 to ₹1,000 a month** plus Groq usage, until real traffic arrives.

---

## Step 0. Before anything else

1. **Rotate the leaked Cloudflare API token and R2 keys** (the ones pasted in the 10 Oct chat). In the Cloudflare dashboard: My Profile → API Tokens → roll or delete the token; R2 → Manage R2 API Tokens → delete those keys. Then delete them from that chat message. This is the one open security risk, and deploying with them still live would be a mistake.
2. **Wait for the "Community-first repositioning" thread to finish.** It's editing `server/` right now. When it's done, run in `server/`:
   ```
   npm install
   npm run check
   npm test            (with the local server running and EDITOR_TOKEN set)
   npm run test:community
   npm run test:chotu
   ```
   All green before you deploy. Run tests **only locally**: they create pods and messages, so never point them at production.
3. **Snapshot the folder** in a local git repo (`git init`, `git add .`, `git commit`). Check that `.dev.vars`, `local.properties`, keystores and `server/models/*.litertlm` are git-ignored first. This gives you something to roll back to.
4. **Settle the name before buying a domain.** "Can UPSC be in the name?" is still on the lawyer list. A domain and Play listing are awkward to change later, so book that call first. You can do steps 1 to 6 on the free `*.workers.dev` address meanwhile.

## Step 1. Accounts (start the slow ones today)

1. **Google Play developer account** (US$25): https://play.google.com/console/signup. Start now: ID verification takes days, and a personal account needs a **closed test with 12+ testers for 14 days** before going public. That clock is the longest pole in this whole plan.
2. **Cloudflare account** with a workers.dev subdomain (you may already have this).
3. **Groq account** at console.groq.com: make an API key, and under Billing set a **monthly spend limit** (start low, for example US$10).
4. A **support email** address for the store listing and the status page (a free Zoho Mail or Gmail is fine).

## Step 2. Cloudflare plan

Upgrade to **Workers Paid (US$5/month)**: Workers & Pages → Plans. Reasons from the code: the daily backup reads every table and every pod's chat in one run, and the 05:30 job fetches feeds and drafts cards. Those can exceed the free plan's 10 ms CPU limit as pods grow, and a failed backup is silent. Paid also lifts the 100,000 requests a day cap and gives D1 Time Travel 30 days instead of 7.

Then set a **billing notification**: Manage Account → Notifications → add "Usage-based billing" alerts.

## Step 3. Create the database and buckets

In `server/` on your PC:

```
npx wrangler login
npx wrangler d1 create upsc-pods
npx wrangler r2 bucket create upsc-pods-media
npx wrangler r2 bucket create upsc-pods-backups
```

`d1 create` prints a `database_id`. Open `server/wrangler.jsonc` and paste it into the **`env.production` → `d1_databases`** entry, replacing `00000000-0000-0000-0000-000000000000`. (The top-level one is for local dev and can stay.) Do this after the community-first thread is done, since it owns that file today.

Load the schema:

```
npx wrangler d1 execute upsc-pods --remote --env production --file=schema.sql
```

Do **not** make either R2 bucket public. The Worker serves media through `/media/` and model files through `/models/files/`, and the backups bucket must stay private.

## Step 4. Secrets: where each one goes

Every secret goes into Cloudflare with `wrangler secret put`, which prompts you to type the value. Never in a file in the repo, never in chat, never in the Android or web app.

| Secret | Needed? | Command (in `server/`) |
|---|---|---|
| `ADMIN_TOKEN` | yes, owner key for /admin | `npx wrangler secret put ADMIN_TOKEN --env production` |
| `EDITOR_TOKEN` | yes, shared editor key | `npx wrangler secret put EDITOR_TOKEN --env production` |
| `MOD_TOKEN` | yes, shared moderator key | `npx wrangler secret put MOD_TOKEN --env production` |
| `GROQ_API_KEY` | only if cloud Chotu is on at launch | `npx wrangler secret put GROQ_API_KEY --env production` |
| `ANTHROPIC_API_KEY` | optional, the desk's Generate button | `npx wrangler secret put ANTHROPIC_API_KEY --env production` |
| `MODEL_FILES_URL` | **don't set in production** (dev only; production reads R2) | none |

Make each token a fresh long random value, different from your local `.dev.vars`:
```
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```
Keep them in a password manager (Bitwarden free is fine). After launch, staff should use **personal keys** from /admin → Staff, and the shared `EDITOR_TOKEN` and `MOD_TOKEN` can be rotated and kept as break-glass only.

**ElevenLabs:** the server code doesn't use an ElevenLabs key (no `ELEVENLABS` anywhere in `server/src`). It's only for making audio files on your PC, which then ship inside content packs. Keep that key on your PC and out of Cloudflare.

## Step 5. First deploy (on workers.dev)

```
npm run deploy
```

It prints an address like `https://upsc-pods.<you>.workers.dev`. Check, in a browser:

1. `/health` returns `{"ok":true,...}`.
2. `/status` shows every component, with "Today's brief comes out at 7:00 IST" or similar.
3. `/app/` loads the web app; Chrome shows the Install icon.
4. `/admin` signs in with `ADMIN_TOKEN`.
5. `/desk` signs in with `EDITOR_TOKEN`.
6. `npx wrangler tail --env production` streams logs. Leave it open while you click around.

If something's wrong: `npx wrangler rollback --env production` returns to the previous version.

## Step 6. Load content and make the first staff keys

1. Import the content pack against production (set `EDITOR_TOKEN` in that terminal to the production value, and point the import at the deployed address; or use the desk: Library → Import pack). Everything lands as drafts.
2. /admin → **Staff and roles**: make a personal key for yourself and each editor. Each key is shown once.
3. /admin → **AI**: set the daily caps low to start, and decide whether "Chotu (cloud)" is on.
4. /admin → **Feature flags**: leave `plus` **off** (payments aren't built). Decide on pod chat and joining for the test.
5. Approve a handful of items on the desk and press Publish, then check they appear in `/app/` and on a phone.

## Step 7. Domain and protecting admin

1. **Buy the domain** once the name is settled. A `.in` costs about ₹700 to ₹900 a year (any Indian registrar); a `.com` is cheapest at Cloudflare Registrar. Either way, put the domain's DNS on Cloudflare (Add a site → change the nameservers at your registrar).
2. Suggested layout:
   - `app.<domain>`: the Worker (Workers & Pages → upsc-pods → Settings → Domains & Routes → Add Custom Domain). Everything (web app, API, /status, /admin) runs here.
   - `<domain>` and `www`: a small Cloudflare Pages site with the landing page, **privacy policy**, terms and support email. Play requires the privacy policy URL, so do this before step 10.
3. **Cloudflare Access on admin pages** (Zero Trust, free for up to 50 users): Zero Trust → Access → Applications → Self-hosted, for `app.<domain>/admin*` and `app.<domain>/desk*`, allowed for your email and your editors' emails with a one-time PIN. The tokens still apply on top. Then check the desk and admin still work, including saving and approving.
4. Turn off the workers.dev address once the custom domain works (Settings → Domains & Routes → workers.dev → Disable), so there's one public address. **Before you do**, the Focus extension needs your new domain: its `manifest.json` only matches `*.workers.dev` and localhost. Ask the build thread to add `https://app.<domain>/*`.

## Step 8. Chotu's model files in R2

The phones download models from your server (`/models/files/<name>`), which reads R2 under `models/`. Three files exist (sizes and SHA-256 in `server/README.md` and `src/chotu.ts`):

| File | Size | Upload at launch? |
|---|---|---|
| `qwen3_0_6b_mixed_int4.litertlm` (4 GB phones) | 0.5 GB | yes |
| `gemma-4-E2B-it.litertlm` (6 GB+ phones) | 2.6 GB | yes |
| `gemma-4-E4B-it.litertlm` (8 GB+ phones, optional) | 3.7 GB | no, drop it (see below) |

**Smaller is possible.** See [chotu-model-options.md](chotu-model-options.md). In short: drop E4B, and test E2B on a real 4 GB phone. If it runs there, E2B can be the only on-phone model, and the Qwen file goes too. Also try the 2.01 GB `-gpu` E2B file from the same repo. Do this test before the upload below, and ask the build thread to update the model list in `src/chotu.ts` to match.

1. Download them from the pinned Hugging Face links in `server/README.md`.
2. Check each one on Windows: `certutil -hashfile <file> SHA256` and compare with the table. A wrong size or hash is silently left out of `/models`.
3. `wrangler r2 object put` can't upload files this large (its limit is about 300 MB), so use **rclone**:
   - R2 → Manage R2 API Tokens → create a token with **Object Read & Write on `upsc-pods-media` only**.
   - `rclone config` → new remote `r2`, type S3, provider Cloudflare, paste the key, secret and endpoint.
   - `rclone copy qwen3_0_6b_mixed_int4.litertlm r2:upsc-pods-media/models/ --progress`, and the same for E2B.
   - **Delete that R2 token afterwards**, and don't paste its values anywhere else.
4. Check `https://app.<domain>/models`: both files should be listed. A phone on Wi-Fi should download and resume after you toggle airplane mode mid-download.

With E2B and Qwen only, R2 holds about 3.1 GB of models, well inside the 10 GB free storage alongside media and 30 daily backups.

## Step 9. Monitoring and backups

**Uptime:** sign up for a free uptime monitor (UptimeRobot or Better Stack). Monitors:
- `https://app.<domain>/health` every 5 minutes, alert to email and phone.
- `https://app.<domain>/status.json`: alert if the text contains `"outage"`.

The `/status` page runs on the same Worker, so if the Worker is down, so is the status page. The monitor's own free public status page is your backstop; link it from the landing page.

**Logs:** `observability` is already on in production. Workers & Pages → upsc-pods → Logs. Once a week, search for `fetched 0 items` (a news feed address changed) and for errors.

**AI spend:** /admin → AI usage daily; the Groq spend limit from step 1; the daily caps from step 6.

**Backups (three layers):**
1. The app's own daily backup at 05:30 IST to `upsc-pods-backups`, last 30 kept, including pod chat. Check /admin → Backups the morning after launch to confirm one exists. Make one by hand before every deploy.
2. D1 Time Travel: restore the database to any minute in the last 30 days (paid plan): `npx wrangler d1 time-travel restore upsc-pods --env production --timestamp=<ISO time>`.
3. Off-Cloudflare copy, weekly: `npx wrangler d1 export upsc-pods --remote --env production --output=backup-YYYY-MM-DD.sql`, stored in your own Google Drive or an external disk. This one doesn't include pod chat (that's only in layer 1).

**Practise a restore once** before launch: make a backup, change something on the desk, restore from /admin → Backups, and check it came back.

## Step 10. Android: release build and Play Store

1. **Point release builds at the https server.** Release builds can't talk to plain `http://`. Make sure the app's default pod server is `https://app.<domain>` (today it's typed in My Path). Ask the build thread to set that default, and to add **release signing** and a **"Report" option on Chotu's messages** (Play's AI-content rule) if they aren't in yet.
2. **Create the upload key** in Android Studio: Build → Generate Signed App Bundle → Create new keystore. Store the `.jks` file and both passwords in your password manager **and** a second place (external disk). Keep the keystore out of the project folder and out of git.
3. Build the `.aab` (release).
4. Play Console → Create app → accept **Play App Signing**.
5. **App content** forms (prepared answers are coming in the drafts list):
   - Privacy policy URL (from step 7).
   - Data safety: mood, journal and Chotu chats stay on the phone; pod chat and member ids go to your server.
   - Content rating (IARC); target audience **18+**; ads: none.
   - **Accessibility API declaration** for Focus, with the in-app disclosure (`ui/FocusScreen.kt`). Record a short screen video of the disclosure and a block in action; Google often asks for one.
   - Health apps declaration: peer support, not medical care. Confirm Tele-MANAS 14416 is current.
   - Account deletion URL: point at the in-app deletion and `/privacy/delete`.
6. Store listing: short and long description, 512×512 icon, 1024×500 feature graphic, 2+ phone screenshots.
7. Tracks, in order: **Internal testing** (you and friends) → **Closed testing** (the pod test, 12+ testers for 14 days straight) → apply for production access → **Production with a staged rollout** (20%, then 50%, then 100%).
8. For every later release, raise `versionCode` in `android/app/build.gradle.kts`.

## Step 11. Web and desktop

Nothing extra to deploy. After step 7, open `https://app.<domain>/app/` in Chrome or Edge, install it, and check it opens in its own window and works offline. Put an "Install on your laptop" link on the landing page. The Focus extension stays "load unpacked" until you publish it to the Chrome Web Store (needs the privacy policy and an `<all_urls>` justification); that can wait until after launch.

---

## The order, at a glance

| When | Do |
|---|---|
| Today | Step 0.1 (rotate keys), step 1 (Play account, Groq, Cloudflare), book the lawyer call |
| When the community-first build is done | Steps 0.2 and 0.3 (tests, snapshot), then 2 to 6 on workers.dev |
| After the name is settled | Step 7 (domain, landing and privacy pages, Access on admin) |
| Same week | Step 8 (model files), step 9 (monitoring, a restore drill) |
| When the release build is ready | Step 10: internal test, then start the 14-day closed test |
| After the closed test | Production rollout; step 11 links; Chrome Web Store later |

## Before every deploy (keep this short list)

1. Tests pass locally.
2. Make a backup from /admin → Backups.
3. `npm run deploy`, then check `/health`, `/status`, `/app/` and `wrangler tail` for a few minutes.
4. If anything's wrong: `npx wrangler rollback --env production`.
5. If `schema.sql` changed, check with the build thread whether the change needs a migration on the live database (the code also calls `ensureSchema`, which adds some tables and columns itself).
