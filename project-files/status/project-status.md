# UPSC Pods: project status and business checklist

_Living document. Last refreshed: 11 Oct 2026, 17:00 IST, from the project chat, all 7 threads and the shared files. App facts come from the "App brainstorm and build" thread's own reports. This document has not checked the code on your PC directly._

---

## 1. Where things stand, in five lines

- **Product:** a calm, honest community app for UPSC aspirants, built around small pods, a daily "Chai" news brief and a night ritual. Nothing has launched yet.
- **Built:** an Android app (Kotlin + Compose), a local pod server with an editor desk, a web app that also installs as a desktop app, focus blocking on both, and on-device Chotu. All of it runs locally on your PC. Nothing is deployed.
- **Content:** 70 templates on 9 shared engines, 72 sample packs, a sound kit and a model pipeline (Haiku fills, a validator checks, editors approve EN and HI). Every item is still a draft that an editor has to check.
- **Done on 11 Oct:** the Author tab on the web desk (paste a source, pick types, approve), support for any number of languages with Telugu as a pilot, Calm now, My Routine, the admin console and the /status page. The thinker content now uses only older voices (Kautilya, Tirukkural, Dhammapada, Patanjali, Basavanna, Kabir, the Gita). **Next:** see [next-steps.md](/mnt/project-files/status/next-steps.md) for what Claude can finish now and what only you can do.
- **Biggest gap to a business:** the free core is mostly built, but nothing on the paid side exists yet (payments, entitlements, answer feedback, sprints). The cheap validation test from your brief (a 6-8 week pod test with about 100 aspirants and a founding-member pre-sale) hasn't started.

---

## 2. The business model (your brief, plus decisions so far)

**A community that gives a lot for free, with paid things for people who get serious.**

| Layer | What's in it | Status |
|---|---|---|
| **Free forever (never charged for)** | Pods and the daily rhythm, Today, Chai news cards, Rooms, Close the Day, distress support and helplines, Honest Guide and calculators, basic Plan B, on-device Chotu, the 70 content types, focus blocks | Mostly built (see §5) |
| **Free with a limit** | 3 answer feedbacks a week | Not built |
| **Low-ticket (₹199-499/mo, from the brief)** | Unlimited answer feedback, deeper analytics, revision tracking, personal study plan | Not built |
| **Cycle sprint (₹2,999-5,999)** | Prelims or Mains 100-day sprint: structured plan plus a weekly mentor touchpoint, with a refund window | Not built |
| **Mentor tier (₹8k-25k)** | 1:1 or small-group mentoring from selected aspirants and repeaters | Not built |
| **Marketplace and partners** | Mentor marketplace (take rate), verified test-series partners, interview prep | Not built |

**Guardrails already agreed:** no upsells on Today, in distress threads, or in the 72 hours after a result. No countdowns, streak loss or fake scarcity. Every price includes everything. Commercial ties are disclosed. No result claims that can't be proved.

**Price reality check (from the brief's devil's-advocate section):** SuperKalam charges about ₹399/month or ₹2,999/year. "We have community" is the only thing that justifies a similar price, and it's untested. Illustrative maths: 50,000 active members × 3% × ₹2,999 ≈ ₹45 lakh per cycle.

---

## 3. Decisions made (newest first)

| Date | Decision | Where |
|---|---|---|
| 11 Oct | **Community first.** The app splits into Adda (community, landing screen, free with no card, never sells) and Prep (study engine, free tier plus Plus). Pods start in Monday batches, a Commons fills quiet hours, Chotu hosts unclaimed rituals, no fake members. Profile is gathered in stages. No leaderboards: a stamp book, shared pod goals and opt-in mock score bands in Prep. Offers appear only in Prep at value moments | [community-first-spec.md](/mnt/project-files/strategy/community-first-spec.md) |
| 11 Oct | **Chotu v2:** drawn as a clay kulhad, always labelled AI. Groq (`openai/gpt-oss-120b`, fallback `gpt-oss-20b`) answers until launch whenever the phone model isn't ready; distress, Close the Day, mood, journal, name and stage never go to the cloud. Gemma 4 E2B/E4B now served from our own server | [chotu.md](/mnt/project-files/strategy/chotu.md) |
| 11 Oct | Admin console added on top of the editor desk. Coordinator added roles, audit log, safety queue, DPDP export and delete, feature flags with a kill switch, announcements and push, and backups | Build thread (in progress) |
| 11 Oct | The web app comes first and installs as a desktop app (a PWA), so there's no second codebase. Regain-style blocking comes from a browser extension on desktop and the Accessibility service on Android | Build thread |
| 11 Oct | Every Prelims, CSAT, Mains, Essay and qualifying-paper format has at least one template, and everything is tagged by stage, paper and format. The interview and optional subjects are left out on purpose | Content thread |
| 11 Oct | Models: use existing quantized models (Gemma 4 E2B/E4B, EmbeddingGemma 2, Llama Guard 3 1B), pinned and self-hosted. Train only small classifiers for now. No distilling and no training from scratch. No generative video or image models | AI models thread |
| 10 Oct | Credit and quote the great thinkers (at most one sourced quote per screen), with a "Standing on their shoulders" page and a reading shelf. **No AI voice clones and no web photos**: illustrated portraits and human narrators only | Great minds thread |
| 11 Oct | Authoring happens on the web desk. Authoring on the phone is nice to have, not a priority | Project chat |
| 11 Oct | In Telugu and other languages, study content stays in a standard register, while instructions, comments and app text use an everyday, spoken tone. Applied to the app strings and the content prompts | Content building plan thread |
| 11 Oct | Gandhi, Ambedkar and Sen are dropped as featured thinkers in favour of older figures such as Kautilya, Thiruvalluvar, the Gita, Patanjali and the Bhakti saints. Ambedkar stays only in factual polity content | [Playbook §F](/mnt/project-files/research/great-minds-playbook.md#f-indian-thinkers) |
| 11 Oct | Calm and routines added as playbook section G: a 2-tap "Calm now" (guided breathing first, optional binaural tones described without health claims, never in place of help) and a "My Routine" builder with persona templates, drawing on Clear, Duhigg, Currey and Nguyen. Two of the requested titles still need checking | [Playbook §G](/mnt/project-files/research/great-minds-playbook.md#g-routines-and-calming-sound) |
| 11 Oct | Indian thinkers added as playbook section F: Thiruvalluvar, the Gita, Patanjali, the Buddha, Bhakti and reform saints, Vivekananda, Tagore, the Phules, Azad, Ramanujan, Kalam and others (Gandhi, Ambedkar and Sen later dropped, see above). Balanced across regions and faiths, every quote sourced, fake quotes become myth packs | [Playbook §F](/mnt/project-files/research/great-minds-playbook.md#f-indian-thinkers) |
| 10 Oct | 15 thinkers adopted (Kahneman, Oakley, Sierra, Sugarman, Fogg, Gollwitzer, Neff, Story Wars, Sun Tzu, Kautilya and others). Pressure tactics are left out, and so is Khera's winners-and-losers framing | Great minds playbook |
| 10 Oct | Content runs on templates so a small model (Haiku 5.5) can produce volume. The validator rejects any number that isn't in the source, and an editor must approve English and Hindi separately | Content thread |
| 10 Oct | Marketing defaults: reach 1M installs by 31 Dec 2027, target UPSC plus state PSC aspirants, budget about ₹1.45 crore with 85% from owned channels, public launch in early Dec 2026. **Applied as defaults; you haven't confirmed them** | Marketing thread |
| 10 Oct | Content defaults: an optional 60-second wind-down sound, test the name Chotu with about 10 users, Lottie for animation. **Applied as defaults** | Content thread |
| 10 Oct | UI/UX changes: no countdown or streak on Today (a private weekly rhythm instead), "What got in the way?", the user picks who hears about a low mood, Chotu is kept for now pending a name test | UI/UX thread, you said go ahead |
| 10 Oct | News is the flagship: each story becomes a Chai Card with a UPSC lens, an exam corner and humour by tone (none on serious or tragic stories), and a human editor approves every card | Build thread |
| 10 Oct | Hosting option A on Cloudflare: phones run the AI, and Cloudflare runs chat, rituals and the news fetch. Workers AI is optional, for public content only. Vercel was ruled out because its free plan is non-commercial | Build thread |
| 10 Oct | Native Android (Kotlin + Jetpack Compose), not Expo | Project chat |
| 10 Oct | Chotu is a clearly labelled AI host ("Chotu · AI"). Fake members seeded into pods are off-limits. Mood, journal, distress and pod chat never leave the phone | Kimi critique, stack v2 |
| 10 Oct | Online model router (LiteLLM plus Laya, over OpenRouter, Hugging Face and Sail) is saved for paid tiers, for public content and paid feedback only. OpenCode's free models stay away from user data | Stack doc v2 |
| 10 Oct | Work stays local: no Claude memory, no GitHub. Files go to your app folder | Your first message |

---

## 4. Discussions worth remembering

- **EmbeddingGemma can't run the agents** because it's an embedding model. It powers matching, memory, search and the small classifiers. Gemma 4 or Qwen3.5 is the voice, and rituals are the spine.
- **You can't have all four of free, local, always-on and shared**, so the decision was to put the AI on phones and keep the server AI-free.
- **Jev (TypeSafe AI)** is hosted only and waitlisted, so its typed-decision pattern is copied locally. **Laya** is the open-weight alternative, with Hindi.
- **Your PC:** 16 GB of RAM and integrated graphics. Sarvam-30B doesn't fit. You asked to skip running anything on your laptop.
- **The devil's-advocate case** (in your brief) still stands: prices are anchored low, AI feedback is easy to copy, the honest mission works against retention, and crisis response needs real capacity. The suggested answer is a cheap pod test before scaling.

---

## 5. What's built (all local, on your PC)

**Android app**: `app\android`, debug APK about 65 MB
- [x] Five tabs: Today, Practice, Pod, Chotu, My Path
- [x] Onboarding: a tour, consent and 18+ check first, six persona questions, a persona reveal, and part-time mode
- [x] Today: Today's 3 in minutes with a "Just 5 minutes" start, a pod strip, a private weekly rhythm, and Close the Day moving to the top after 20:00
- [x] Chai Cards: six zones, a trust footer, humour by tone, Hindi with a toggle, share cards, and 1/7/30-day recall
- [x] Close the Day: an encrypted journal, mood in words, an if-then step for tomorrow, Lamp Off, export and delete
- [x] Practice: Prelims quiz, Mains editor, archive, and "Learn and play" with all 48+ types on 9 engine players, with sound off by default
- [x] On-device Chotu: chooses a model by phone RAM, downloads on Wi-Fi only, checks the file, chats offline, checks for distress on the phone, and has night rules
- [x] Pod: study room with soundscapes, favours, and a private line to the lead
- [x] My Path: honest numbers (draft), a two-sided Plan B, WOOP, a reading shelf, pause mode, Delete my data
- [x] Focus: app blocking, daily limits and a calm screen (not yet tried on a phone)
- [x] Great-minds items A1 to A18
- [x] Telugu pilot in the app, with everyday spoken Telugu for app text (a native speaker still needs to check the Hindi and Telugu text)
- [ ] Tried on a real phone end to end (Chotu, Focus, connecting to the pod server)

**Server and editor desk**: `app\server`, runs at `localhost:8787`
- [x] Pod chat, rituals and news-desk approval, with English and Hindi approved separately
- [x] Content-pack import (`npm run import`), Library approval, "Write a card", "Start a draft", and an edit clears both approvals
- [x] Mock-paper and long-read kinds
- [x] Smoke tests pass
- [x] Admin console at `/admin`: roles and personal keys, audit log, users, moderation, safety queue, content versions, LLM usage and controls, analytics, feature flags with kill switches, announcements, DPDP requests, daily backups with restore
- [x] Public status page at `/status`
- [x] Author tab on the desk: paste a source, pick up to three types, get the prompts, paste Claude's reply back, review and approve. A Generate button works once your own API key is in `server/.dev.vars`
- [x] Any number of languages; Telugu in pilot, blocked from going live until it has a Telugu editor and a reviewed distress-phrase list
- [ ] Android app reads flags and banners; real push keys; pod chat in backups; Cloudflare Access in front of /admin
- [ ] Deployed to Cloudflare (it runs only on your PC)

**Web and desktop**: `localhost:8787/app/`
- [x] Today, Chai, practice, Close the Day, pod chat
- [x] Timed mock papers with negative marking, a "Not sure" tick and results shown as a range
- [x] Long reads with "say it from memory"
- [x] Focus blocks, installable as a desktop app, works offline
- [x] Browser focus extension in `focus-extension`, tested in Chrome
- [x] Calm now (guided breathing, calm tones) and My Routine builder

**Other files on your PC:** `build-overview.html`, `ai-stack-recommendation.md` (v2), `stack-v2.html`, `daily-content-plan.md`, `publish-checklist.md`, `ux-guide.md`, `ux-research\` (3 reports).

---

## 6. Content (shared folder: `content/`)

- **70 templates** (`content/templates/`), each with a schema, brief, config and example, on **9 engines**: choose, sort, order, match, reveal, steps, compare, link web and fill the gap.
- **72 sample packs**, including 3 Chai cards (EN and HI), the Article 200 explainer, the "Chai in 60" reel timeline, maps, myths, CSAT passages and quant, case studies, the essay planner and more.
- **Sound kit:** 12 effects and 6 soundscapes (Opus with AAC fallbacks), plus the chai motif.
- **Pipeline:** a Haiku generator, a validator with source-number and Hindi-parity checks, and a coverage check that fails the build if any exam format loses its last template. The generator script hasn't been run against the API yet; the tests went through Claude agents.
- **Quote bank:** 8 starter quotes, none checked yet.
- **Previews:** [Chai Content Preview](https://claude.ai/artifact/QXBZwcKkxR7TMixYHDU1Hu) · [Template Studio](https://claude.ai/artifact/FdZCJfPC5Z2go18GtZXjJg) · [Content plan](https://claude.ai/code/artifact/2d28bdd3-05ba-4879-a0c1-58e764b51640)
- **Marketing:** [Marketing plan to 1M](https://claude.ai/code/artifact/18cd7d6f-4faf-4cde-a848-e2110066c4e1) · [Launch Kit](https://claude.ai/artifact/WyCpp4nn9qXAHqHbEtbRY7), with the Play listing in EN and HI, 5 screenshots, share cards, pod invite, Parent page, week-1 posts and an author email draft.
- **Research:** [great-minds-playbook.md](/mnt/project-files/research/great-minds-playbook.md) · [models-and-content-plan.md](/mnt/project-files/research/models-and-content-plan.md) · founding brief: `Life, Emotions, Needs, and a Community.md`

---

## 7. Waiting on you right now

1. **Rotate the Cloudflare API token and R2 keys** pasted in the project chat on 10 Oct, and edit that message to remove them. They're still visible as of this refresh.
2. **Read aloud in the phone's built-in voice:** yes or no ("AI models for app and content" thread).
3. **Confirm or change the marketing defaults:** the Dec 2027 target, UPSC plus state PSC, ₹1.45 crore, early Dec 2026 launch.
4. **Approve content on the desk** (`localhost:8787/desk`) so it shows on phones.
5. **Delete the duplicate Template Studio artifact.**
6. **Try the latest APK on your phone**, especially Chotu and Focus.
7. **Platforms and distribution** (raised 11 Oct, recommendation not yet confirmed): Play Store as the main Android channel, a direct APK only for the pilot, Focus on Android moving from Accessibility to Usage Access, and iOS, Mac and Linux served by the web app first, with a native iOS app only after the pod test.
8. **Try the new Author tab** on the desk (`localhost:8787/desk`). It's built and tested; authoring stays on the web, so phone authoring is a low-priority extra.
9. **Find native speakers** to check the Hindi and Telugu app text, and a Telugu editor to review the 7 Telugu packs.

---

## 8. Checklist: from build to a thriving business

✅ = done · ⬜ = open. Grouped in roughly the order a launch needs them.

### A. Validate before scaling (from your brief)
- ✅ Research brief, personas, emotional map, devil's advocate
- ⬜ 10 aspirant interviews using the brief's interview guide
- ⬜ Recruit about 100 aspirants for a 6-8 week pod test (Reddit, Telegram, Ashok Nagar and Hyderabad libraries)
- ⬜ Run the test using the APK, measuring week-4 activity (kill under 30%, strong over 50%), referrals and pod-lead stamina
- ⬜ **Founding-member pre-sale:** 30 seats at a real price (kill under 5, strong 15 or more)
- ⬜ Test the name "Chotu" with about 10 users
- ⬜ Use the pod test as the Play Store's 12-tester, 14-day closed test

### B. The free core (the community)
- ✅ Today, Chai Cards, Close the Day, Practice, Pod and My Path screens
- ✅ Onboarding with persona
- ✅ On-device Chotu (labelled as AI)
- ✅ Web and desktop app, mock papers, long reads
- ✅ Focus blocking (desktop extension, Android)
- ✅ 70 content templates, 9 engines, sound kit
- ✅ Great-minds features A1 to A18
- ✅ Calm now and My Routine (web app)
- ✅ Indian thinkers, calm scripts and routine cards as draft content
- ✅ Gandhi, Ambedkar and Sen content replaced with older thinkers
- ⬜ Honest Tools hooks: Attempt Compass, Cost-of-a-Year calculator, 5-source maps per subject, Honest coaching guide (a calculator exists on the Launch Kit page only)
- ⬜ Rooms with real co-presence (voice or cam)
- ⬜ Pod matching (EmbeddingGemma) and pod-lead tools
- ⬜ Real mock papers and long reads written on the desk (none exist yet)
- ⬜ Past-question database (needed for PYQ links and "where an hour pays most")
- ⬜ Read aloud (waiting on your decision)
- ⬜ Real-phone testing of Chotu, Focus and server sync

### C. The paid side (as members get serious)
- ⬜ Decide the first paid product (the brief suggests unlimited answer feedback plus a study plan, then a cycle sprint)
- ⬜ Answer feedback: free 3 a week, unlimited when paid (not built; needs the online model router behind the privacy wall)
- ⬜ Entitlements and paywall screens, with upsells only at value moments
- ⬜ Payments: Google Play Billing on Android (Play's rules for digital goods) and Razorpay or similar on the web
- ⬜ Prelims and Mains sprint programs, with a refund window
- ⬜ Mentor tier: recruit and vet mentors, scheduling, payouts
- ⬜ Marketplace and partner rules, with disclosure in the Honest Guide
- ⬜ Pricing test against SuperKalam's ₹399/month and ₹2,999/year anchor

### D. Content operations
- ✅ Template pipeline, validator, coverage tags
- ✅ Editor desk with separate EN and HI approval
- ✅ Paste-and-pick authoring: the Author tab on the web desk
- ⬜ Authoring on the phone (nice to have, low priority)
- ✅ Templates, prompts and checks work for any language; 7 Telugu packs translated; style notes ready for Marathi, Tamil, Bengali and Kannada
- ✅ Two tones: standard for study content, everyday spoken for instructions and app text
- ⬜ Telugu editor reviews the 7 packs; native speakers check the Hindi and Telugu app text
- ⬜ Daily news lane as a scheduled job (PIB, PRS, RBI, SC to drafts by 07:00)
- ⬜ Subject lane: syllabus map, starting with GS2 Polity
- ⬜ Run the Haiku generator against the API (needs an API key on your PC)
- ⬜ Hire or recruit 2 editors (EN and HI), then a Telugu editor; editor time limits volume
- ⬜ Fact-check every sample pack, quotes against the named editions, and My Path numbers against upsc.gov.in
- ⬜ Human narrations, illustrated portraits, real audio recordings
- ⬜ Reel rendering from JSON for social media (ffmpeg or Remotion)

### E. Safety and trust
- ✅ On-device distress check with helplines shown instead of a reply
- ✅ Result-day mode and night rules designed and in the app
- ⬜ Write the crisis protocol and train moderators. The brief says to do this first
- ⬜ Staff and publish real moderator response hours
- ⬜ Test-call Tele-MANAS 14416 and 1-800-891-4416
- ⬜ Train a distress classifier on EmbeddingGemma that always routes to a human
- ✅ Safety queue in the admin console
- ⬜ Community rules and pod-lead playbook
- ⬜ A reviewed distress-phrase list for each new language before it goes live (Telugu first)

### F. Legal and compliance
- ⬜ Check the app name: "UPSC" may imply affiliation
- ⬜ Business entity, GST, bank account
- ⬜ Privacy policy, terms, refund policy, grievance officer (IT Rules)
- ⬜ DPDP review (consent, export and delete are built in admin), data minimisation
- ⬜ AI labelling under the 2026 IT rules (Chotu is labelled; check everything else)
- ⬜ Check consumer protection and misleading-ads rules (CCPA, dark-pattern guidelines) before marketing
- ⬜ Play Console: data safety form, Accessibility declaration for Focus, AI disclosure
- ⬜ Written consent before using any member's story
- ⬜ Permissions for quotes, and from authors for any messages

### G. Infrastructure and operations
- ✅ Local server and tests
- ⬜ Rotate the Cloudflare keys, then log in with `npx wrangler login`
- ⬜ Deploy the pod server to Cloudflare, with a domain and HTTPS
- ⬜ Self-host pinned model files for the Chotu download
- ⬜ Signed release build, smaller install (AI as a separate download)
- ✅ Admin console, analytics, LLM usage and controls, backups, public /status page
- ⬜ Cloudflare Access in front of /admin; pod chat in backups; push keys
- ⬜ Crash reporting and privacy-safe analytics
- ⬜ Push notifications (one a day, quiet hours 23:30-07:00)
- ⬜ Use version control or backups for the code on your PC. GitHub is off by your choice, so a local git repo or backup is the alternative

### H. Launch and growth
- ✅ Marketing plan to 1M and Launch Kit (Play listing, screenshots, share cards, invite, Parent page, posts)
- ⬜ Confirm the marketing defaults (§7)
- ⬜ Google Play developer account
- ⬜ Closed test, then public launch (default: early Dec 2026)
- ⬜ Owned channels: WhatsApp Channel, Telegram, Instagram, r/UPSC. Posting starts after legal checks
- ⬜ Plan the notification-day wave (Jan 2027)
- ⬜ Send the author outreach emails (draft ready, needs your OK)
- ⬜ Web landing page with the calculators as hooks

### I. Team and money
- ⬜ Pod leads and moderators (volunteer, then paid)
- ⬜ Editors (EN and HI) and a subject reviewer
- ✅ Monthly cost model including people, with a slow-month view (ai-economics.xlsx, "People and total" sheet)
- ⬜ Budget for the ₹1.45 crore marketing plan, or the lean no-ads version (about 600k to 700k installs)

### J. Metrics to track (from your brief)
- ⬜ 14-day first-submission rate · pod retention at weeks 4 and 8 · time to first human reply on distress · referral rate · paid conversion and refunds · editor approval rate per template

---

## 9. Threads in this project

| Thread | State |
|---|---|
| App brainstorm and build | Done: Author tab, Telugu pilot, Calm now, My Routine, tone rule |
| UI/UX research for the app | Done |
| Marketing plan for 1M downloads | Done; defaults waiting on your confirmation |
| Content building plan | Done: older thinkers, two-tone rule, Telugu, calm and routine content |
| Ideas from great minds | Done |
| AI models for app and content | Waiting on you: read-aloud decision |
| Project summary and launch checklist | This document; refreshed by a daily routine |

---

## 10. AI and infrastructure economics (added 11 Oct)

Full model with editable assumptions: [ai-economics.xlsx](/mnt/project-files/status/ai-economics.xlsx). These are planning estimates from list prices, not measurements. Assumptions: ₹88 to the dollar, 30% of monthly users active each day, 3% paid conversion at ₹299/month, and 20% of members using the free 3 feedbacks a week. People costs are not included.

| Monthly users | 1k | 10k | 100k | 1M |
|---|---|---|---|---|
| Server, Cloudflare ($/mo) | 5 | 6 | 22 | 204 |
| On-device AI | 0 | 0 | 0 | 0 |
| Content generation ($/mo) | 15 | 15 | 15 | 15 |
| Free feedback on Haiku 5.5 ($/mo) | 3 | 31 | 312 | 3,120 |
| Free feedback on Sonnet 5.5 ($/mo) | 65 | 650 | 6,500 | 65,000 |
| Paid feedback on Sonnet 5.5 ($/mo) | 30 | 300 | 3,000 | 30,000 |
| Net paid revenue (₹/mo) | 6.5k | 65k | 6.5L | 65L |
| Tech cost, Haiku for free feedback (₹/mo) | 4.7k | 31k | 2.9L | 29L |

What it shows:
- **On-device AI is free at any scale.** Model downloads from R2 have no egress charge, and the Cloudflare server stays under about ₹18k a month even at 1M users.
- **Content generation is a flat cost.** It's tiny next to editor salaries.
- **Cloud answer feedback is the only cost that grows with users.** Run the free tier on Sonnet and it costs about ₹57 lakh a month at 1M users, nearly all of the paid revenue. On Haiku it's about ₹2.7 lakh. So free feedback should use Haiku, and Sonnet should be reserved for paid users.
- **Even paid feedback on Sonnet takes about 40% of each paid member's net revenue** at 40 feedbacks a month. Two fixes: Haiku first with Sonnet only for hard answers, or lower thinking effort.
- **People are the real cost.** Editors, moderators and pod leads cost more than all the tech here at every scale up to 1M.

**With people included** (new "People and total" sheet, added 11 Oct; salaries are rough planning numbers, founder pay and marketing excluded):

| Monthly users | 1k | 10k | 100k | 1M |
|---|---|---|---|---|
| People (₹/mo) | 1.05L | 4.25L | 10.2L | 33.3L |
| Tech, Haiku route (₹/mo) | 5k | 31k | 2.9L | 29.3L |
| Net paid revenue at 3% and ₹299 (₹/mo) | 6k | 65k | 6.5L | 64.6L |
| Profit or loss, average month (₹/mo) | −1.0L | −3.9L | −6.6L | +2.0L |
| Paying members to break even | 509 | 2,117 | 6,081 | 29,059 |

- **At 3% conversion and ₹299 a month, the business only breaks even near 1M monthly users,** and still loses money in slow months.
- **To break even at 100k users you need about 6% paying,** or a higher average price (sprints and the mentor tier), or a leaner team. That makes the founding-member pre-sale and the pricing test the numbers to watch.

---

## Change log
- **11 Oct 2026, 09:15 IST:** first version.
- **11 Oct 2026, 10:50 IST:** added the platforms decision (§7) and the AI economics (§10).
- **11 Oct 2026, 12:10 IST:** admin console marked done; paste-friendly to-do list added ([todos.txt](/mnt/project-files/status/todos.txt)).
- **11 Oct 2026, 11:00 IST:** added calm sound and the routine builder (playbook §G).
- **11 Oct 2026, 10:55 IST:** added Indian thinkers (playbook §F), plus the simpler-authoring and languages asks (§7).
- **11 Oct 2026, 13:15 IST:** authoring, Telugu pilot, Calm now and My Routine marked done; phone authoring made low priority; Gandhi, Ambedkar and Sen dropped as featured thinkers (playbook §F updated); two-tone rule for languages added.
- **11 Oct 2026, 17:00 IST:** thinker swap marked done; added [next-steps.md](/mnt/project-files/status/next-steps.md), splitting open work into what Claude can finish now, what only you can do, and what's blocked.
- **11 Oct 2026, 17:20 IST:** added the people cost model and break-even view (§10).
