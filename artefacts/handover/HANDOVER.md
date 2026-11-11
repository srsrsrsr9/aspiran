# UPSC Pods: handover to a new Claude account (25 Oct 2026)

Read this once at the start of the new account. `CLAUDE.md` (same folder) holds the short standing rules.
`MIGRATION-CHECKLIST.md` lists what a zip of the folder does not carry.

## 1. The product in one paragraph
UPSC Pods is a community-first study app for UPSC civil-services aspirants. Members join small pods
(the first to join is the lead), get a daily "Chai" current-affairs card set, practise Prelims and Mains,
sit mocks with UPSC negative marking, and talk to **Chotu**, an AI study buddy. Free tier plus a paid
**Plus** (sold on the web only, via Cashfree; price is set in admin → Payments. The 18 Oct build defaulted to
₹2,499/yr with ₹999 for the first 300; the Play Billing plan uses ₹9,999/yr. Confirm which is current). English and Hindi everywhere; Telugu pilot.

## 2. Where things live
| Thing | Where |
|---|---|
| App code (server, Android, content, extension) | PC: `C:\Users\Srinivas Vedantham\Documents\Personal\app` (local git, branch `master`, everything merged). Not on GitHub as far as this project knows. |
| Local copies of every artefact | PC: `...\app\artefacts\` |
| DB backups | PC: `...\Documents\Personal\app-backups\` |
| Content packs for upload | PC: `...\Documents\Personal\app-packs\` |
| Project shared folder (397 MB: content, community, strategy, research, marketing videos, status) | Copied to PC: `...\app\project-files\` (25 Oct). Paths in old notes like `/mnt/project-files/x` now mean `project-files/x`. |
| Production | `https://upsc-pods-production.chotu-aec.workers.dev` (Cloudflare account id `aec6050bcd4fc95113accdbaae8d14d3`) |
| Firebase | project `upsc-pods` (Google sign-in, emails) |
| Second approved folder (other project) | `C:\Users\Srinivas Vedantham\Documents\Builds\artha` |

## 3. Architecture
- **Server:** one Cloudflare Worker (`server/src/index.ts`), D1 `upsc-pods`, R2 `upsc-pods-media` and
  `upsc-pods-backups`, Durable Objects `PodRoom` and `CommonsRoom`, Workers AI binding, one cron `0,30 * * * *`
  that dispatches IST jobs (05:30 feeds and backup, 07:00 publish and Chai post, Fri quiz night, etc.).
  It also serves the web/desktop PWA (`/app/`), the editor desk (`/desk`), admin (`/admin`) and legal pages.
- **Chotu:** on-device model on phones (Gemma family, files on R2; see "Switching offline Chotu Lite to Gemma 3 1B")
  plus cloud Chotu routed by language in `server/src/ai.ts` (`CHAT_ROUTES`): English NVIDIA then Groq;
  Hindi and Telugu Google first. Keys: `NVIDIA_API_KEY`, `GROQ_API_KEY`, `GOOGLE_AI_API_KEY`.
  Design: "Chotu AI Platform Design" doc. Model choice is reviewed weekly (`project-files/research/model-watch.md`).
- **Content:** packs of JSON items (30 template types on nine engines, `server/src/engines.ts`). Written with
  Claude Haiku batches via the prompt kit, imported as drafts, approved per language on the desk.
  Motion Stories (rendered current-affairs videos, Sarvam Bulbul Hindi voice) in `content/tools/`.
- **Auth:** Google (Firebase) and username/password; flags `sign_in_required`, `password_login`, `plus` are ON
  in production (20 Oct). Email recovery built, off until Resend keys.
- **Android:** Kotlin/Compose, `com.upscpods.app`, signed with the owner's `upload.jks`. Play Billing Library 8
  compiled in, off (`-Pupsc.playBilling=true` + `play_billing` flag to enable).

## 4. Deploy (owner runs, PowerShell, one line at a time)
Template: `artefacts/deploy-slice-3-runbook-powershell.md`. Shape: `cd server` → D1 export backup →
`wrangler d1 execute ... --file=migrations/000N_*.sql` → `wrangler secret put` (if any) → `npm run deploy` →
content import (`npm run import -- <pack>` with `EDITOR_TOKEN` and `BASE` set) → `curl.exe` smoke checks →
signed release APK in Android Studio, copied to `artefacts/apk/`.
If Android Studio fails with "loopback connection": set `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:/gtmp`.

## 5. Live state (24-25 Oct)
- Slice 2 is live (rooms leaderboard, Plus video lock returns 403). Plus sales page live on web (21 Oct).
- **Slice 3 is merged and tested but NOT deployed:** email recovery + offline gate, Play Billing (off),
  content drafts (30 syllabus notes, CSAT set, 3 full GS1 mocks, syllabus map for optionals). Migrations 0006, 0007.
- Cashfree is still in **sandbox**. With `plus` on, "Get Plus" goes to a test checkout.

## 6. Open threads and what each waits on
| Thread | State | Waiting on |
|---|---|---|
| Buyer's-eye app review | blocked | Owner runs slice-3 runbook; decisions in `artefacts/owner-and-editor-actions.md` |
| Deepstash-style insight stories (Hidden Why) | blocked | An Android Studio build to verify the story screen; 2 sources (cobra, Goodhart) for an editor |
| Marketing plan for 1M downloads | blocked | ElevenLabs reachability for vocals (old thread; superseded by Telugu vocals threads) |
| Telugu vocals with new key | blocked | A fresh ElevenLabs key (later "final key fix" thread completed) |
| AI models for app and content | blocked | Decision: allow phone's built-in TTS "read aloud" (changes no-AI-voice rule) |
| App brainstorm and build | review_ready | The main build thread; nothing specific pending |
| Prep content and upgrade screen | done | Owner publishes the signed release APK |
| Build plan from here, Fix Chotu's garbled replies, Model watch, AI stack redesign, Motion video templates, ₹3000/month stack | done | Nothing |

## 7. Decisions only the owner can make
1. **Sell Plus via Google Play?** (Play Billing built, off. If yes: product `plus_yearly`, service-account secret.)
2. **Email recovery:** create Resend account, set `RESEND_API_KEY`, `MAIL_FROM`.
3. **Go live with Cashfree:** production keys, `CASHFREE_ENV=production`, webhook URL.
4. **Read-aloud with device TTS** (accessibility vs. the no-AI-voice rule).
5. **People:** at least one English and one Hindi editor; named moderator roster for the crisis protocol;
   native-speaker check of Hindi/Telugu strings.
6. **Legal:** fill `[Legal entity name]` (8 places) in `artefacts/Legal pages (draft, placeholders)/` and
   placeholders in `server/public/legal/*.html`.
7. Soften "checked by a human editor" in the Launch Kit (lines 367, 393, 449) until editors exist.
8. Budget pick (24 Oct): Claude Pro + Cloudflare Workers Paid + domain + small Haiku API cap ≈ ₹3,000/month.

## 8. Published pages (old account owns these links)
Motion Stories https://claude.ai/artifact/SQHoUP63zxhCw1QBNNWdqR ·
Sell-first rework plan https://claude.ai/artifact/R8HNtGgA8GDs1kqqAXCJXb ·
Buyer Review, Annotated https://claude.ai/artifact/2wsJdXcP8BdNyd67Pdx6tj ·
Build plan from here https://claude.ai/artifact/XgdzpK3yRTtbWcgwpyobXQ ·
Chotu AI Platform Design https://claude.ai/artifact/4cMzQP3nfJcqTtcKZJJ1z2 ·
The Hidden Why https://claude.ai/artifact/RsVs1Xderu4TS7G3uj7ryZ ·
Gemma 3 1B switch https://claude.ai/artifact/VkZWPszUP1KPvrpwbiyEvG ·
Template Studio v2 https://claude.ai/artifact/FdZCJfPC5Z2go18GtZXjJg · v1 https://claude.ai/artifact/J6Rr96wAUxUoAusNEUu2vR ·
Website https://claude.ai/artifact/GC4RfzMqoMu5NeYbToWAjw ·
Launch Kit https://claude.ai/artifact/WyCpp4nn9qXAHqHbEtbRY7 ·
Routine Builder https://claude.ai/artifact/3cw7CrG5UXKXBTfoftrcSu ·
Chai Content Preview https://claude.ai/artifact/QXBZwcKkxR7TMixYHDU1Hu ·
Content Building Plan https://claude.ai/artifact/6aSA8TJRe8zAukKqsJJwMh ·
Marketing Plan https://claude.ai/artifact/44e4pnMAykqbAXw3BHZez4
Local copies are in `artefacts/` (the sell-first rework plan has no local copy; export it before leaving).

## 9. Key docs to read on demand (not up front)
`server/README.md` · `content/README.md` · `artefacts/owner-and-editor-actions.md` ·
`artefacts/deploy-slice-3-runbook-powershell.md` · `artefacts/UPSC Pods Buyer Review (22 Oct).md` ·
`community/crisis-protocol.md` · `strategy/community-first-spec.md` · `research/model-watch.md`.

## 10. First prompt for the new account (cheap start)
> Read CLAUDE.md and artefacts/handover/HANDOVER.md only. Don't scan the repo. Then tell me in five lines
> what's pending and wait.

## 11 Nov 2026 (reconcile after cloud work)
- Cloud sessions (8 Nov) had branched from GitHub `main` (d22ebdd), which was 21 commits behind local master. Merged into
  master: `claude/syllabus-videos` (228 videos; the six `-2000-NN` batch branches are fully inside it) and
  `sample-topic-open-access` (Try one topic). Its migration became `0010_try_feedback.sql` (0009 is `web_chats`, live).
  `content.ts` came back from the cloud with LF endings; merged keeping CRLF. Service worker shell v35.
- Pushed master to both GitHub `main` and `master` (they had drifted apart). Keep pushing to both.
- All 16 suites pass locally. Local test DB needs `schema.sql`, then migrations, then growth threshold 0.
- NOT deployed: Try one topic waits on the owner's four questions and editor approval. Migration 0010 must be applied before
  the next deploy.
- `claude/syllabus-interactives` (60 interactives, published on the status page 8 Nov) was never pushed to GitHub; it is only in
  its cloud session. Owner to ask that session to push; then merge.
- Android: no cloud work touched `android/`. versionCode 7 / 0.4.2 (5 Nov) is still the build to publish.
- Website visit counts are off (Umami ID empty in aspiran-web BaseLayout). Leads keep `source` (utm or referrer or "direct").
