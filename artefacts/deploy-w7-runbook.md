# Production deploy: rework/slice-1 (2026-10-23)

Local `master` is fast-forwarded to `c383818`. It has slice 1, slice 2 and W2–W7, plus migration 0005. Nothing is pushed: the repo has no remote.

Run these from `server/` in Git Bash. Wrangler is already logged in.

```bash
# 1. Back up the live database first (this file holds members' data: keep it out of git and out of shared folders)
mkdir -p ../../app-backups && npx wrangler d1 export upsc-pods --env production --remote --output=../../app-backups/upsc-pods-2026-10-23.sql

# 2. The one new table (room_members for open pods)
npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0005_rooms.sql

# 3. Deploy the Worker
npm run deploy

# 4. The CA week to the production media bucket (social cuts not included)
for f in ../content/motion/ca/2026-41/*; do npx wrangler r2 object put "upsc-pods-media/ca/2026-41/$(basename "$f")" --remote --file="$f"; done

# 5. Smoke checks
B=https://upsc-pods-production.chotu-aec.workers.dev
curl -s $B/health; echo; curl -s $B/config | head -c 400; echo; curl -s "$B/ca"; echo
```

## Release APK (from `android/`, uses the release key in keystore.properties)
```bash
./gradlew :app:assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`.

## Things to know
- **Secrets:** production has ADMIN_TOKEN, CASHFREE_APP_ID, CASHFREE_SECRET_KEY, GOOGLE_AI_API_KEY, GROQ_API_KEY and NVIDIA_API_KEY. Answer Studio uses NVIDIA and Groq, so nothing it needs is missing.
  - No EDITOR_TOKEN: the desk uses ADMIN_TOKEN as the owner key.
  - No ANTHROPIC_API_KEY: only the desk's Author tab uses it.
- **CA drafts:** all 3 scenes are drafts, so `/ca` on live will list no weeks and the release app shows no CA card. They show once someone approves them. Approving means setting review.status to "approved" in the manifest and uploading it again.
- **Paywall:** Plus scene videos can still be fetched from `/media/ca/...` by anyone who knows the path. The lock is in the app only.
