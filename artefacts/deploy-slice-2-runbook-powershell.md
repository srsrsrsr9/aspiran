# Production deploy: slice 2, PowerShell 5.1 (2026-10-24)

What goes out: PYQ (Mains 2025 papers, as desk drafts), the day-2 chat, the website and pod copy, Rooms (Room Quiz
Night board of rooms, a pinned question a day, photos in Send to pod kept 7 days, the room list on the web), the
server-side Plus lock on current-affairs scenes, and the Answer Studio live-check script (not run). Paused, not in this
deploy: email password recovery, the offline gate, Play Billing.

- Paste one line at a time and wait for it to finish.
- If a step fails, stop and send me the full output.
- Use `curl.exe`, not `curl`. In PowerShell 5.1, plain `curl` is a different command.

## Steps 1–6: in the server folder

Start in the server folder:
```powershell
cd "C:\Users\Srinivas Vedantham\Documents\Personal\app\server"
```

### 1. Back up the live database
```powershell
New-Item -ItemType Directory -Force "C:\Users\Srinivas Vedantham\Documents\Personal\app-backups"
npx wrangler d1 export upsc-pods --env production --remote --output="C:\Users\Srinivas Vedantham\Documents\Personal\app-backups\upsc-pods-2026-10-24-slice2.sql"
```
- **Success:** wrangler says the export is done, and `Get-Item "C:\Users\Srinivas Vedantham\Documents\Personal\app-backups\upsc-pods-2026-10-24-slice2.sql"` shows a file larger than 0 bytes.
- **If it fails:** stop here. If the error mentions login, run `npx wrangler login` and try again.

The file holds members' data. Keep it out of git and shared folders.

### 2. Migrations
Slice 2 adds no new D1 tables. The board, the pinned question and photos live in the room Durable Objects and in R2.
Run migration 0005 once more, in case the W7 deploy stopped before it. The SQL uses `IF NOT EXISTS`, so a repeat is harmless.
```powershell
npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0005_rooms.sql
```
- **Success:** wrangler reports the queries ran.
- **If it fails:** stop. Nothing has changed, and your backup is in place.

### 3. Deploy the Worker
```powershell
npm run deploy
```
- **Success:** the output ends with `https://upsc-pods-production.chotu-aec.workers.dev` and a "Current Version ID" line.
- **If it fails:** the old version keeps running, so the live app is fine. Send me the output.

### 4. Backstop for room photos (one time)
The server deletes room photos after 7 days in a daily sweep. This R2 rule deletes anything the sweep misses after 8 days.
```powershell
npx wrangler r2 bucket lifecycle add upsc-pods-media --prefix pod-photos/ --expire-days 8
```
- **Success:** wrangler says the rule was added. `npx wrangler r2 bucket lifecycle list upsc-pods-media` shows it.
- **If it fails** with a prompt about the rule's name: use any name, for example `pod-photos-8d`. If wrangler says your version lacks the command, run `npx wrangler@latest r2 bucket lifecycle add ...` with the same arguments.

### 5. Upload the PYQ papers as desk drafts
Type your production editor token yourself. It isn't stored in any file, and this window forgets it when you close it.
```powershell
$env:EDITOR_TOKEN = Read-Host "Production editor token"
$env:BASE = "https://upsc-pods-production.chotu-aec.workers.dev"
node scripts/pyq.mjs pack "C:\Users\Srinivas Vedantham\Documents\Personal\app-packs\pyq-2026-10-24"
npm run import -- "C:\Users\Srinivas Vedantham\Documents\Personal\app-packs\pyq-2026-10-24"
```
- **Success:** the pack line reports the papers written (no SAMPLE papers). The import reports every file uploaded and the pack imported.
- **If the import says 401:** the token is wrong. Run the `Read-Host` line again.
- **If a file upload fails:** run the import line again. Uploads overwrite, so repeats are safe.

The papers arrive on the desk as **drafts**. Phones see nothing until an editor checks each paper against the upsc.gov.in PDF and approves it.

### 6. Smoke checks
```powershell
$B = "https://upsc-pods-production.chotu-aec.workers.dev"
curl.exe -s "$B/health"
curl.exe -s "$B/rooms/leaderboard"
curl.exe -s -o NUL -w "%{http_code}`n" "$B/media/ca/2026-41/02-el-nino.mp4"
curl.exe -s -o NUL -w "%{http_code}`n" "$B/media/ca/2026-41/03-sendai.vtt"
curl.exe -s -o NUL -w "%{http_code}`n" "$B/media/ca/2026-41/01-gi-tag.mp4"
curl.exe -s -o NUL -w "%{http_code}`n" "$B/media/ca/2026-41/02-el-nino.jpg"
curl.exe -s -o NUL -w "%{http_code}`n" "$B/media/ca/2026-41/02-el-nino.mp4?exp=9999999999&sig=00"
curl.exe -s -H "authorization: Bearer $env:EDITOR_TOKEN" "$B/desk/api/library" | findstr /c:"csm-2025-gs1"
```
- **Success:**
  - `/health` answers `"ok":true`.
  - `/rooms/leaderboard` returns JSON with `"minAnswers":10` and a `rooms` list. The list is empty until the first Friday Room Quiz Night.
  - **Plus lock:** the Plus scene's video (`02-el-nino.mp4`) and captions (`03-sendai.vtt`) print `403`, and so does the forged key on the last media line. The free scene (`01-gi-tag.mp4`) and the poster print `200`.
  - The last line prints a long line containing `csm-2025-gs1`, the Mains 2025 GS1 draft.
- **If `/rooms/leaderboard` says Not found:** step 3 didn't deploy. Run it again.
- **If the Plus scene prints 200:** the old Worker is still serving. Wait a minute and check again. If it's still 200, send me the output of step 3.

**Rooms check in the app:** open Pod → Open rooms. You see the five groups (Language, Where you are, Goal, Optionals, Region) and the Room board card. Join one room. A 📌 Today's question appears after 07:00 IST, when the daily job pins it.

## Step 7: release APK, in Android Studio

1. Open `C:\Users\Srinivas Vedantham\Documents\Personal\app\android` in Android Studio.
2. The app folder is on `master`, with slice 2 merged in. `git log --oneline -1` in the app folder shows the merge.
3. Choose Build → Generate Signed App Bundle or APK → APK, then Next.
4. Pick your existing `upload.jks` and type its passwords yourself. Choose the `release` variant, then Create.
- **Success:** Android Studio shows "APK(s) generated successfully", and `android\app\release\app-release.apk` (or `app\build\outputs\apk\release\`) has today's date.
- **If it fails:** a wrong password says so plainly. For anything else, send me the Build window's output.

Copy the APK next to the others:
```powershell
Copy-Item "C:\Users\Srinivas Vedantham\Documents\Personal\app\android\app\release\app-release.apk" "C:\Users\Srinivas Vedantham\Documents\Personal\app\artefacts\apk\upsc-pods-release-2026-10-24-slice2.apk"
```
If that path doesn't exist, use the path Android Studio's "locate" link shows.

## Notes
- **Plus lock and older APKs:** after step 3, an older build can't play the two Plus scenes, even for a Plus member, because it doesn't fetch the new key. Install the new APK. Free scenes play everywhere. Only test entitlements exist today, so no paying member is affected.
- **Content drafts** (syllabus notes, CSAT passages, the three Prelims mocks) are still being written. They upload the same way as step 5 when they're ready. They stay drafts, and release builds don't show them until an editor approves each one on the desk.
- **Nothing else is needed:** no new secrets, no new bindings. The Plus key is generated and kept in D1 on first use.
