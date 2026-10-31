# Community first: product spec v1

_11 Oct 2026. Owner of this spec: the "Community-first repositioning" thread. Build owner: "App brainstorm and build". It covers points 3 to 7 of the founder's feedback: segmentation, Chotu, staged profiling, leaderboards and badges, and the free-to-paid funnel. Chotu's full persona, system prompt and model choice are in [chotu.md](/mnt/project-files/strategy/chotu.md). The positioning for marketing is in [positioning.md](/mnt/project-files/strategy/positioning.md)._

_Checked against: the founding brief, the project status doc, the great-minds playbook, ai-economics.xlsx, the UX guide, and the current app code on the PC (web `server/public/app/app.js`, pod server `server/src/pod.ts`, AI wrapper `server/src/ai.ts`; the Android files were too deeply nested to read from here, so Android facts come from the status doc)._

---

## 0. The decision in one paragraph

The app becomes two clearly separate spaces. **Adda** (the community) is where you land, it is free with no card needed, and it never sells to you: your pod, the Commons, Chotu, Close the Day, Calm, and a shelf of free resources. **Prep** (the study engine) holds Today's 3, Chai, practice, mocks, long reads, Focus and your plan. Prep has a generous free tier and a paid tier, **Plus**, and it is the only place an offer ever appears. The community's job is to make people stay; Prep's job is to make the serious ones pay. Keeping the two apart is what lets the community stay honest while the business still works.

---

## 1. Information architecture

### 1.1 Today's structure (what's built)

| Surface | Android | Web |
|---|---|---|
| Tabs | Today · Practice · Pod · Chotu · My Path | Today · Chai · Practice · Read · Focus · Pod · Path, plus Calm and Talk in the side rail |
| Landing screen | Today (Today's 3 tasks) | Today |
| Feel | A study app with a pod tab | A study app with a pod tab |

Today's 3 is the first thing anyone sees, so the app reads as "another study app". That is the problem the founder named.

### 1.2 New structure

Bottom navigation, five tabs, in this order:

| # | Tab | Space | What's in it |
|---|---|---|---|
| 1 | **Adda** (home, default landing) | Community | Your pod strip, the Commons live now, Chotu's one line for you, Close the Day (evening), Calm now, Free Shelf, Wins of the week |
| 2 | **Pod** | Community | Pod chat, the week's shared goal, study room, buddy, ask the lead privately, Pod Quiz Night |
| 3 | **Chotu** | Community (with a Prep mode) | Talk, Calm, plan my day, explain this, quiz me |
| 4 | **Prep** | Prep | Its own sub-tabs: Today's 3 · Chai · Practice · Mocks · Read · Focus · My Plan |
| 5 | **Me** | Neither | Profile ("what the app knows about me"), my rhythm, Stamp book, Plus, privacy, Need to talk? |

"Adda" is a working name (Hindi and Bengali for a hangout). Test it alongside Chotu in the name test. Alternatives: "Chaupal", "Baithak", "Home".

**Web/desktop:** the same five, in the side rail. Prep's sub-tabs show as a second rail inside Prep. Calm and "Need to talk?" stay pinned at the bottom of the rail, as today.

### 1.3 How the two spaces look different

The member should always know which space they are in without reading a label.

| | Adda (community) | Prep (study) |
|---|---|---|
| Colour | Warm: chai brown, terracotta, cream | Cool: ink blue, slate, white |
| Header | Rounded, with Chotu's kulhad and pod avatars | Flat, with a thin progress bar where relevant |
| Type | Martel for headings (already bundled) | The system sans for headings, Martel for body in Hindi |
| Sound | Ambient beds, chai motif | Effects only (tap, snap, stamp) |
| Copy voice | Conversational, Hinglish allowed | Crisp, exam register |
| Money | **Never.** No prices, no Plus badges, no locks | Free tier plus Plus, offers only at value moments |

Add these as two theme tokens (`space: adda | prep`) in `tokens.json`, so every screen picks its palette from the space it belongs to.

### 1.4 Where every existing feature goes

| Feature (built) | New home | Note |
|---|---|---|
| Pod chat, study room, favours, ask the lead | Pod | Unchanged, plus the cold-start changes in §3 |
| Pod strip on Today | Adda | Moves from Today to the top of Adda |
| Close the Day, Lamp Off | Adda | It's about the person, not the syllabus. Moves to the top of Adda after 20:00, as it did on Today |
| Calm now | Adda (card) and the side rail | Two taps from anywhere, unchanged |
| Need to talk? | Me, the overflow menu and the side rail | Two taps from anywhere, unchanged |
| Chotu chat | Chotu tab | New persona and modes (chotu.md) |
| Honest tools (Attempt Compass, Cost-of-a-Year, 5-source maps, Honest coaching guide), Plan B, reading shelf | Adda → Free Shelf | Free, shareable, no login on web |
| Great-minds content (thinker cards, quotes, Standing on their shoulders) | Adda → Free Shelf | |
| My Routine builder | Adda → Free Shelf (builder), Prep → My Plan (the routine you run) | The builder is a free hook; the plan it feeds is Prep |
| Today's 3 | Prep → Today's 3 | No longer the landing screen |
| Chai cards | Prep → Chai, with "Today's Chai" as one card on Adda | Chai stays free. It's the bridge from Adda into Prep |
| Practice (Prelims, Mains editor, Learn and play, 70 types) | Prep → Practice | |
| Mock papers | Prep → Mocks | |
| Long reads | Prep → Read | |
| Focus blocks | Prep → Focus | |
| My Path: honest numbers, WOOP | Prep → My Plan | Pause mode and Delete my data move to Me |
| Weekly rhythm dots | Me → My rhythm, with a small echo in Close the Day | Still private |

### 1.5 First run

1. Language, 18+, consent (DPDP) and a nickname. Three screens, under 40 seconds. Nothing else is asked yet (see §5).
2. "Meet Chotu": a 2-line introduction with the "Chotu · AI" label and what it can and can't do.
3. **Land on Adda**, not Today's 3. The pod card says either "Say hi to your pod" (pod has people) or "Your pod opens Monday. Meanwhile, the Commons is live" (see §3).
4. One gentle first action, chosen by time of day: morning, "Today's Chai, 6 minutes"; evening, "Close your first day"; late night, "Calm now".

---

## 2. Screen-by-screen changes

Each block lists what changes. Anything not listed stays as built.

### 2.1 Adda (new home)

Order from top, at most five blocks on a 360×640 screen:

1. **Greeting with Chotu's line.** "Evening, Meera. Your pod wrote 3 answers today." One line, factual, generated from events, never guilt. Tap opens Chotu.
2. **Your pod card.** Avatars of who's online, the week's shared goal bar, the latest line ("Aman shared an answer · 9:12"). Buttons: "Open pod", "Send a chai ping". When the pod is forming, the card shows the honest count and the Monday date.
3. **Commons, live now.** "212 aspirants studying now · 3 rooms open". Join with mic off. Real numbers only; below 10 it says "A few people are studying now".
4. **Evening slot (after 20:00): Close the Day.** Moves to the top after 20:00, as on Today now.
5. **Free Shelf row.** Horizontal cards: Today's Chai, Calm now, Attempt Compass, Cost-of-a-Year, 5-source map for your weakest subject, This week's thinker card. Each has a "Share" action.

Below the fold: Wins of the week (opt-in posts, Sundays), the Stamp book teaser, community announcements.

Never on Adda: prices, Plus, locks, countdowns, streak numbers, rank of any kind.

### 2.2 Pod

Built today: chat, chai ping, rituals posted by Chotu, study room, favours and offers, ask the lead privately, report and hide.

Changes:
- **Header shows the pod state** honestly: "Forming · 2 of 8", "Small · 5 of 8", "Full · 8 of 8". Chotu is never counted as a member.
- **Pinned weekly goal** set on Monday by the lead, or by Chotu if there's no lead ("Everyone writes 3 answers this week"). One shared progress bar, never per person.
- **Weekly ritual calendar** at the top: Mon goals, Tue/Thu answer hour, Fri Pod Quiz Night, Sun wins and close the week. Chotu hosts any ritual no human picks up.
- **@Chotu in pod chat.** Anyone can ask Chotu something in the pod ("@Chotu explain Article 200 in 3 lines"). Only the message that mentions Chotu is read by it (see chotu.md §6 for privacy).
- **"Catch me up"**: a 3-line digest of what you missed, made on the phone from the pod history you already have.
- **Pod Quiz Night** (Friday): 5 questions from the week's Chai, answered together; only the pod's shared score shows, compared with the pod's own last week.
- **Thanks**: a 🙏 on any message. Thanks feed the Helper stamps (§6) but are never shown as counts on people.

### 2.3 Commons (new, inside Adda)

A community-wide space for everyone, whatever their pod. It's the answer to "my pod is empty at 11 pm".
- **Rooms:** 3 to 5 always-open silent study rooms ("Library Hall · Hindi", "Night Owls", "Working professionals"), with presence only, no chat, so moderation load is low.
- **Ask the seniors:** a once-a-day thread where a volunteer pod lead or mentor answers questions in a scheduled hour. Shown with the time ("Rohit answers 8 to 9 pm").
- **Chai talk:** one discussion thread per Chai card, lightly moderated, off for TRAGIC cards.
- **Live tonight:** Quiz nights and repeater panels across pods.
- Rules: the same community rules and distress check as pods. No direct messages between strangers at launch.

### 2.4 Chotu tab

- **Modes, as three chips at the top:** Talk (Adda, default) · Prep (study help) · Plan (your day, routine, what to do next). Chotu's persona is the same in all three; only the tools change. Full detail in chotu.md.
- "What Chotu knows about me" link to Me → Profile, with edit and delete.
- The free cloud allowance shows only in Prep mode, and only once it's nearly used up (§7).

### 2.5 Prep

- **Sub-tabs:** Today's 3 (default) · Chai · Practice · Mocks · Read · Focus · My Plan.
- **Today's 3** stays exactly as designed (3 tasks, "Just 5 minutes", "2 of 3 is a real day", done screen), minus the pod strip, which moved to Adda. A single pod line ("Your pod: 4 answers today") links back to the Pod.
- **Plus surfaces** appear only here, only at the value moments in §7.4, and always as a quiet card with "Not now" as an equal-weight button.
- **Free vs Plus labels** live inside Prep only: a small "Plus" tag on Plus features, never a padlock icon on content that was free.

### 2.6 Me

- **Profile**: every field the app has, where it came from (you told us, inferred from practice, or you skipped), where it's stored (this phone, or the server for pod matching), and an edit and delete for each. This doubles as the DPDP notice.
- **My rhythm**: the private weekly dots (moved from Close the Day and My Path).
- **Stamp book** (§6).
- **Plus**: plan, renewal date, cancel in two taps, refund window, invoice. Gift Plus and the scholarship seat (§7).
- **Privacy**: pause mode, export, delete, "Smarter Chotu" switch (cloud on or off).
- **Need to talk?** also lives here.

### 2.7 Web landing (owned by the Marketing thread)

Not in scope here. One requirement from this spec: the Free Shelf tools (Attempt Compass, Cost-of-a-Year, 5-source maps, routine builder, Today's Chai) must work on the web **without an account**, each ending with "Find your people: join a pod", because they are the top of the funnel (§7).

---

## 3. Pods with few or no humans

The rule from 10 Oct still holds: **no fake members, ever.** Chotu fills the gap as a clearly labelled host, and the product makes humans easier to reach rather than pretending they're there.

### 3.1 Pod states

| State | Humans | What happens |
|---|---|---|
| **Forming** | 1 to 2 | Chotu hosts every ritual. The member is shown the Commons, matched with a buddy if one exists, and told the date new members join. After 7 days, it merges with another forming pod of the same bucket |
| **Small** | 3 to 5 | Rituals run with Chotu as co-host. A floating lead (below) checks in twice a week. Open to new members |
| **Full** | 6 to 8 | A human lead runs the pod. Chotu only steps in for unclaimed rituals, "Catch me up" and @Chotu questions |
| **Quiet** | Any, but no human post in 5 days | Chotu posts one low-key prompt (never naming anyone). After 14 quiet days, members get a private choice: stay, or move to an active pod. Nobody is moved without asking |

### 3.2 What fills the gap

1. **Batched starts (most important).** Pods open on Mondays. New members join the next batch with people at the same stage, so pods start with 6 to 8 humans together instead of trickling in one by one. Between sign-up and Monday they are in the Commons with Chotu. This is the single biggest fix for empty pods. The server already buckets pods (`pods.bucket`); it needs a weekly batch job.
2. **The Commons.** Even a member alone in a forming pod can see and join real people studying right now.
3. **Buddy pairs.** If a pod is forming, offer a 1:1 buddy from another forming pod at the same stage (opt-in, either can end it).
4. **Floating leads.** One volunteer senior covers up to 10 forming or small pods with two scheduled check-ins a week. Senior leads already get a stipend in the cost model (₹2,000 a month); this is where it's spent first.
5. **Chotu as host** (chotu.md §5): runs Monday goals, answer hour, Pod Quiz Night and Sunday wins; welcomes newcomers; posts "Catch me up"; answers @Chotu questions. It never takes part as if it were a member: it doesn't post answers, finish tasks, react to people's wins with fake feelings, or appear in the member count.
6. **Honest copy.** "Your pod has 2 people so far. 6 more join on Monday 20 Oct." Never "Your pod is buzzing".

### 3.3 Server changes

- Weekly batch job: match the waiting list into pods by bucket (stage, attempt band, language, time of day), every Monday 06:00 IST.
- `pods.state` (forming, small, full, quiet), computed daily.
- Merge job for forming pods older than 7 days.
- Commons rooms: a `CommonsRoom` Durable Object per room, presence-only (no message storage), so it costs almost nothing.
- Chotu host messages already post through `/ritual` as "Chotu · AI"; extend it with a host schedule per pod.

---

## 4. Chotu

See [chotu.md](/mnt/project-files/strategy/chotu.md) for the persona, character, intelligence design, full system prompt, model choice and privacy rules. The one-line version: **Chotu is a small clay kulhad (chai cup) who has sat on every library desk in Mukherjee Nagar: warm, dry, honest, always labelled AI. It hosts your pod when humans are thin, coaches in Prep, and hands you to people whenever it matters.**

---

## 5. Gathering profile information in stages

### 5.1 Rules

- **One question at a time, at most one a day,** asked at the moment the answer makes something better, with a one-line "why we ask" and a "Skip" that is just as big.
- **Ask, infer, or leave it.** If the app can infer something from use (weak subjects from practice, study hours from Focus), it infers and shows it in Me → Profile for the member to correct, instead of asking.
- **Stored on the phone by default.** Only the fields needed for pod matching (stage, attempt band, language, time of day) go to the server.
- **Never ask about mood, money or family in a form.** Those live only inside the tools that need them (Close the Day, Cost-of-a-Year, Parent page) and stay on the phone.
- **Who asks:** Chotu asks in Talk mode as part of conversation ("Which attempt is this? Only if you want to say. It helps me pick the right practice"), or an inline card asks in the screen where the answer matters. Never a modal, never a blocking form.
- **A skipped question waits at least 7 days** before it's asked again, and after two skips it's never asked again.

### 5.2 The stages

| Stage | When | What we collect | How | Why it helps the member |
|---|---|---|---|---|
| **0. Start** | First run | Language, 18+, consent, nickname | 3 screens | Required to use the app at all |
| **1. Pod** | When they tap "Join a pod" (first session for most) | Stage (starting, Prelims, Mains, repeat), attempt band (1st, 2nd-3rd, 4th+), preferred study time | 3 taps on the pod screen | Matches the right pod |
| **2. First week** | Contextually, days 1 to 7 | Target year; medium (EN, HI, both); working or full time; optional subject | Chotu in Talk, or the card in Prep where it matters (e.g. optional subject the first time they open Mains practice) | Right Today's 3 mix, part-time mode, Mains content |
| **3. Inferred** | Weeks 1 to 3 | Strong and weak subjects, accuracy band, average daily study time, best time of day | From practice, mocks and Focus; shown in Me → Profile for correction | Personal plan, revision picks |
| **4. Deeper** | Week 3+, only once they're active | City or study hub (for meetups and hub-based Commons rooms), coaching or self-study, which attempt they'll stop at (asked only inside Attempt Compass) | Inside the tool that uses it | Local meetups, honest Plan B |
| **5. Commitment** | At a value moment, before an offer | Main goal for this cycle, the hardest part right now | Chotu or the Plan screen, one question | Lets the offer fit their real need (§7) |

### 5.3 Data model

Add a `profile_fields` table on the phone (Room on Android, IndexedDB on web):

```
field        TEXT   -- e.g. "stage", "attempt_band", "optional_subject"
value        TEXT
source       TEXT   -- asked | inferred | imported
confidence   REAL   -- 1.0 when asked; 0-1 when inferred
asked_at     INTEGER
skipped      INTEGER  -- times skipped
synced       INTEGER  -- 1 only for pod-matching fields
```

Server side, only `members.stage`, `members.attempt_band`, `members.lang` and `members.time_band` are added, for matching.

Chotu reads profile fields through a "profile" tool only when the member has the field set; it never sees skipped or empty fields as gaps to fill in conversation more than once a day.

---

## 6. Leaderboards and badges: my recommendation

### 6.1 The short answer

**No individual leaderboards anywhere in the community. Yes to stamps (badges) that reward showing up, helping and mastering a topic. Yes to shared pod goals. In Prep only, an opt-in mock score band, which is also a Plus feature.**

### 6.2 Why

- **This audience is the worst fit for public rank.** The brief's emotional map puts shame and comparison at the centre: hidden attempt counts, topper worship, family comparison. A league table in the community turns the one place that's meant to feel safe into another rank list. The research brief already said rank-style leaderboards should be off by default, and the community rules list "no leaderboards".
- **What 2026 learning apps show.** Leagues lift short-term activity for casual learners (Duolingo's leagues are the well-known case), but that's a low-stakes hobby. For high-stakes exam prep, comparison mostly helps the top few and pushes the rest to quit, the same pattern as broken streaks (Silverman and Barasch, 2023, already cited in the UX guide).
- **Self-determination theory** (the playbook's frame): stamps that recognise competence (mastering a topic), relatedness (helping your pod) and autonomy (keeping your own rhythm) motivate without comparison.
- **India's dark-pattern guidelines (2023)** and the commercial guardrails rule out manufactured urgency and loss-framed streaks.
- **Aspirants do want to know where they stand,** but on exam performance, not app activity. That's a legitimate need, and it belongs in Prep, as a band, by choice.

### 6.3 What to build

**Stamp book** (in Me). Stamps, not badges: a passport-style book that fits the chai-stall look and the stamp sound already in the kit.

| Family | Examples | Earned by | Visible to |
|---|---|---|---|
| **Showing up** | First Close the Day; 4 rhythm weeks; Came back after a break | Your own rhythm, never consecutive days | You; share if you choose |
| **Helping** | First thanks; Explained something; Welcomed a newcomer; Answer-hour reviewer | Thanks from pod members, reviews given | You and your pod (on your profile card) |
| **Mastery** | Polity: Parliament; Geography: Monsoon; CSAT: Ratios | 80%+ on spaced recall of a topic across 3 sessions | You; share if you choose |
| **Pod** | Pod's first full week; Quiz Night streak of the pod (as a group) | Shared goals | The pod |
| **Roles** | Buddy; Pod lead; Senior; Mentor | Doing the role | Everyone (it's the "hero" rung of the ladder) |

Rules: no stamp for raw volume of chat; no stamp that can be lost; no stamp tied to money; Mastery stamps need spaced recall, so they can't be ground out in one night.

**Shared goals instead of ranks.**
- Pod weekly goal with one bar (built in §2.2).
- **Community seasons** tied to the exam calendar: "Prelims 2027 season: together, 1 million questions by 24 May." One community counter on Adda. Everyone contributes; nobody is ranked.

**Role ladder** (status that means something): Member → Buddy → Answer-hour reviewer → Pod lead → Senior → Mentor. Leads and mentors get a profile mark. This also builds the supply of paid mentors for the mentor tier (§7).

**Prep only, opt-in: mock score band.** After a mock, "Show me where I stand" gives a band ("Top 25 to 40% of the 1,240 people who took this mock"), never a rank or a name. Free shows the band; **Plus** shows the subject-wise breakdown and the trend. Off by default, and switched off on result days.

**Not building:** global or pod leaderboards, XP points, levels, streak counters, "you'll lose your streak" messages.

**What to test:** in the pod pilot, give half the pods the stamp book and half nothing, and watch week-4 retention and the lurker-to-poster rate.

---

## 7. Free to paid: the funnel

### 7.1 The model in one line

**The community is free, needs no card, and never sells. Prep has a free tier that's genuinely useful, and Plus for people who are going all in. Sprints and mentors sit above Plus.** People join for the community, stay for the rhythm, and pay for more and deeper Prep.

### 7.2 What's free, what's paid

| | Free (no card needed) | Plus (₹299/month or ₹2,499/year) | Sprint (₹3,999 per cycle) | Mentor (₹8k to 25k) |
|---|---|---|---|---|
| **Adda** | Everything: pod, Commons, Chotu Talk, Close the Day, Calm, Free Shelf, stamps, distress support | Same (nothing extra; the community is not tiered) | Same | Same |
| **Chai** | Daily cards, Exam Corner, recall | Plus a weekly Chai test and a monthly current-affairs compilation | | |
| **Practice** | Today's 3, all 70 types, Prelims bank | Unlimited personalised revision (spaced recall on everything you missed) | | |
| **Answer feedback** | 3 a week (Haiku) | Unlimited, deeper (Sonnet for hard answers, per the economics sheet) | Plus weekly human review | 1:1 |
| **Mocks** | 1 full mock a month, score and band | All mocks, subject breakdown, trend, error log | Sprint mock series | |
| **Chotu Prep mode** | 15 cloud turns a day (on-device unlimited) | 100 cloud turns a day, plus answer coaching and "teach me this topic" | | |
| **My Plan** | Routine builder, weekly rhythm | Personal plan that rebuilds itself weekly from your practice | 100-day structured plan | Custom |
| **Mentor touchpoint** | Ask the seniors (Commons) | | Weekly group call | 1:1 |

Prices follow the brief's ranges and the economics sheet's ₹299 assumption. The annual price undercuts SuperKalam's ₹2,999 year. Test both in the founding-member pre-sale.

### 7.3 Funnel stages and targets

| Stage | Where it happens | Target (planning numbers, not measured) |
|---|---|---|
| **Hook** | Free Shelf tools and Chai on the web, shared cards, reels | 30% of web tool users install or sign up |
| **Join** | First run → land on Adda → join a pod batch | 70% join a pod within 7 days |
| **Belong** | First pod week, first thanks, first Close the Day | 40% still active in week 4 (the brief's "strong" line is 50%) |
| **Habit** | Weekly rhythm met 3 of 4 weeks | 25% of MAU |
| **Value moment** | Hits a free limit in Prep, or reaches a calendar moment (§7.4) | 50% of habit users each month |
| **Trial** | 7-day Plus trial, no card needed on web | 30% of those who see an offer |
| **Pay** | Plus monthly or annual | 40% of trials |
| **Climb** | Sprint at notification day or Prelims result; mentor for repeaters | 10% of Plus members buy a sprint per cycle |

That chain gives about 1.5% of MAU starting Plus per month. With retention and the annual plan, the paying base can reach 5 to 6% of MAU over a cycle, which is what break-even at 100k needs (about 6,100 paying at ₹299, from the "People and total" sheet). Sprints raise the average revenue per payer and lower the share needed: in a rough mix at 100k MAU of 2,000 monthly Plus, 2,000 annual Plus and 300 sprints a month (net of a 30% mentor cost), the business roughly breaks even with about 4% paying. Treat all of this as hypotheses for the pod test and the pre-sale to confirm or kill.

### 7.4 Where offers appear (and nowhere else)

Only in Prep, only at these moments, and only as one quiet card with an equal-weight "Not now":

| Moment | Offer |
|---|---|
| Used the 3rd free answer feedback and opened the result | "Want feedback on every answer? Try Plus free for 7 days" |
| Finished a free mock and looked at the band | "See which subjects cost you marks" (Plus breakdown) |
| Hit 15 cloud turns in Chotu Prep mode | "Chotu's out of cloud turns for today. It still works offline. Plus gives you 100 a day" |
| Week 4 of a met rhythm | "You've shown up 4 weeks. Here's what a plan built on your practice looks like" (preview of Plus plan) |
| UPSC notification day (Jan) | Prelims sprint |
| Prelims result, for those who qualified, after 72 hours | Mains sprint |
| A repeater opens Attempt Compass or asks Chotu "what's wrong with my pattern?" | Diagnostic call with a mentor |

**Never:** on Adda, in pods, in the Commons, in Chotu Talk mode, in Close the Day, within 72 hours of any result, in a flagged distress conversation, to anyone in pause mode, or after 22:30.

### 7.5 Funnel boosters that fit the mission

- **Founding members.** 30 seats before launch at the annual price with a lifetime lock (from the brief's validation plan). Kill under 5 sales, strong at 15 or more.
- **Gift Plus.** A link a member sends home: "Help with my prep". In many families the parent pays, and the Parent page already exists. This is likely the biggest single lever for this audience.
- **Scholarship seats.** For every 10 paid Plus members, one member who can't pay gets Plus free, chosen by pod leads. It costs mainly AI time, gives Plus members a reason to feel good about paying, and makes the honest-mission story concrete for marketing. Publish the count monthly.
- **Pod perks for referrals.** When a member's invite joins a pod, the whole pod gets 3 extra feedbacks that week (from the brief: reward the pod, not cash).
- **Trial earned by belonging.** After the first full pod week, the member unlocks a 7-day Plus trial they can start whenever they like. It ties the paid taste to the community, not to a pop-up.
- **Plus is the default for leads.** Active pod leads get Plus free; it costs little and keeps leads.

### 7.6 Metrics to add to the admin dashboard

Already planned: 14-day first submission, pod retention at weeks 4 and 8, distress reply time, referrals, paid conversion. Add:
- Share of new members in a pod with 3+ humans by day 7 (cold-start health).
- Lurker-to-poster rate per pod.
- Profile completeness by stage (how far people go through §5).
- Value-moment reach rate, trial start rate, trial-to-paid rate.
- Gift Plus share of purchases.
- Offer impressions on any forbidden surface (must stay at zero; alert if not).

---

## 8. Build order for the build thread

1. **IA switch:** five tabs, Adda as home, Prep with sub-tabs, Me; move features per §1.4; add the `space` theme token. Web first (the PWA), then Android.
2. **Adda home** (§2.1) with the Free Shelf, using the Honest tools already on the build list.
3. **Pod states, batched Monday starts, Commons rooms, floating leads** (§3).
4. **Chotu v2:** persona, modes, host mode in pods (chotu.md). The download fix and the Groq fallback are already built (11 Oct); until launch Groq answers whenever the phone model isn't ready, and the "Smarter Chotu" switch comes back before public launch.
5. **Staged profiling:** `profile_fields`, Me → Profile, contextual asks (§5).
6. **Stamp book and pod goals** (§6).
7. **Plus:** entitlements, the free limits, value-moment cards, trial and Gift Plus screens (§7), built behind a flag with a test-mode purchase. Real Play Billing and Razorpay wait for the business entity.

Items 1 to 3 are the community-first repositioning and can ship to the pod test. Items 4 to 6 make it feel alive. Item 7's real payments wait on the business entity. First paid product, as recommended here: **Plus = unlimited answer feedback + personal plan + full mocks + more Chotu**.

_Wording note: marketing's consumer-protection check dropped "free forever" as a risky ad claim, so this spec and the positioning say "free, no card needed". Keeping the community unpaywalled is an internal commitment, not something to promise in ads._

## 9. Changes to earlier decisions (approved by the founder, 11 Oct 18:01 IST)

1. **Landing screen moves from Today to Adda.** (Changes the 10 Oct UI/UX layout.)
2. **Chotu gets a cloud path** (Groq) behind an opt-in switch. Mood, the journal and distress text still never leave the phone, and pod chat only reaches the model when someone @mentions Chotu. (Changes the 10 Oct "phones run the AI, server AI-free" decision for this one feature.)
3. **Opt-in mock score bands in Prep.** The community still has no leaderboards.
4. **Chotu is drawn as a kulhad (a clay chai cup)**, which also answers the concern that the name reads as a child tea-stall worker. Still worth including in the name test.
