# Community-first spec (approved 11 Oct 2026)

_Saved for reference by the build. The build log is in `app\community-first-build.md`._

## 0. The decision
The app becomes two clearly separate spaces. Adda (the community) is where you land. It's free with no card needed, and it never sells to you: your pod, the Commons, Chotu, Close the Day, Calm, and a shelf of free resources. Prep (the study engine) holds Today's 3, Chai, practice, mocks, long reads, Focus and your plan. Prep has a generous free tier and a paid tier, Plus, and it's the only place an offer ever appears.

## 1. Information architecture
1.2 Bottom nav, in this order:
1. Adda (home, default): pod strip, Commons live now, Chotu's one line, Close the Day (evening), Calm now, Free Shelf, Wins of the week.
2. Pod: chat, the week's shared goal, study room, buddy, ask the lead privately, Pod Quiz Night.
3. Chotu (community, with a Prep mode): Talk, Calm, plan my day, explain this, quiz me.
4. Prep: sub-tabs Today's 3 · Chai · Practice · Mocks · Read · Focus · My Plan.
5. Me: Profile ("what the app knows about me"), My rhythm, Stamp book, Plus, privacy, Need to talk?

Web and desktop get the same five in the side rail, with Prep's sub-tabs as a second rail inside Prep. Calm and "Need to talk?" stay pinned at the bottom of the rail.

1.3 Looks:
- Adda: warm palette (chai brown, terracotta, cream), rounded header with the kulhad and pod avatars, Martel headings, ambient sound, conversational copy, and never money.
- Prep: cool palette (ink blue, slate, white), flat header with a thin progress bar, system-sans headings, effects-only sound, crisp copy, free tier plus Plus at value moments only.

1.4 Where features go:
- Pod: pod chat, study room, favours, ask the lead (as now).
- Adda: the pod strip (moved from Today); Close the Day and Lamp Off (they move to the top of Adda after 20:00); a Calm now card (Calm also stays in the side rail); the Free Shelf with Honest tools, Plan B, reading shelf and great-minds content (thinker cards, quotes, Standing on their shoulders); the routine builder.
- Need to talk?: Me, the overflow menu and the side rail.
- Chotu tab: Chotu chat.
- Prep: My Routine runs in Prep → My Plan. Today's 3 moves to Prep (no longer the landing screen). Chai moves to Prep, with "Today's Chai" as one card on Adda; Chai stays free. Practice (Prelims, Mains editor, Learn and play), Mocks, Read and Focus move to their Prep sub-tabs. My Path's honest numbers and WOOP go to Prep → My Plan.
- Me: pause mode, Delete my data, and the weekly rhythm dots (Me → My rhythm, with a small echo in Close the Day; still private).

1.5 First run:
1. Language, 18+, consent and nickname: three screens, under 40 seconds.
2. "Meet Chotu": two lines with the "Chotu · AI" label, saying what it can and can't do.
3. Land on Adda. The pod card says "Say hi to your pod", or "Your pod opens Monday. Meanwhile, the Commons is live".
4. One first action by time of day: morning, "Today's Chai, 6 minutes"; evening, "Close your first day"; late night, "Calm now".

## 2. Screens
2.1 Adda, at most 5 blocks, top to bottom:
1. Greeting with Chotu's line ("Evening, Meera. Your pod wrote 3 answers today."). Factual, built from events, never guilt; tap opens Chotu.
2. Pod card: avatars of who's online, the shared goal bar, the latest line, and buttons Open pod / Send a chai ping. A forming pod shows its honest count and the Monday date.
3. Commons live now: "212 aspirants studying now · 3 rooms open", join with mic off. Real numbers only; under 10, say "A few people are studying now".
4. After 20:00, Close the Day moves to the top.
5. Free Shelf row: Today's Chai, Calm now, Attempt Compass, Cost-of-a-Year, the 5-source map for your weakest subject, and this week's thinker card, each with Share.

Below the fold: Wins of the week (opt-in, Sundays), a Stamp book teaser and announcements. Never on Adda: prices, Plus, locks, countdowns, streak numbers, or rank of any kind.

2.2 Pod:
- The header shows the state: "Forming · 2 of 8", "Small · 5 of 8" or "Full · 8 of 8". Chotu is never counted.
- A pinned weekly goal, set by the lead or by Chotu if there's no lead, with one shared bar and never per-person progress.
- A ritual calendar: Mon goals, Tue/Thu answer hour, Fri Pod Quiz Night, Sun wins.
- @Chotu.
- "Catch me up": a 3-line digest made on the phone.
- Pod Quiz Night: 5 questions from the week's Chai. Only the pod's shared score shows, compared with the pod's own last week.
- 🙏 thanks feed Helper stamps but never show as counts on people.

2.3 Commons:
- 3 to 5 always-open silent study rooms ("Library Hall · Hindi", "Night Owls", "Working professionals"): presence only, no chat.
- Ask the seniors: one thread a day with a scheduled hour shown.
- Chai talk: one thread per Chai card, off for TRAGIC cards.
- Live tonight: quiz nights and panels.
- The same rules and distress check as pods. No DMs between strangers.

2.4 Chotu tab: Talk (default) · Prep · Plan chips, a link to "What Chotu knows about me", and the free cloud allowance shown only in Prep mode when nearly used up.

2.5 Prep:
- Sub-tabs as above. Today's 3 stays exactly as designed, minus the pod strip; instead, one line "Your pod: 4 answers today" links to the Pod.
- Plus surfaces appear only here, at value moments, as a quiet card with an equal-weight "Not now".
- A small "Plus" tag on Plus features, never a padlock on content that was free.

2.6 Me:
- Profile: each field with its source (you told us / inferred / skipped), where it's stored (phone, or the server for matching), and edit and delete.
- My rhythm, Stamp book, and Plus (plan, renewal, cancel in 2 taps, refund window, invoice, Gift Plus, scholarship).
- Privacy: pause, export, delete, and the Smarter Chotu switch.
- Need to talk?

## 3. Pods with few or no humans
No fake members, ever.

States:
- Forming (1-2 humans): Chotu hosts every ritual; show the Commons; offer a buddy; show the join date; merge with a same-bucket forming pod after 7 days.
- Small (3-5): Chotu co-hosts; a floating lead checks in twice a week; open to new members.
- Full (6-8): a human lead runs it; Chotu only covers unclaimed rituals, Catch me up and @Chotu.
- Quiet (no human post in 5 days): one low-key Chotu prompt, never naming anyone. After 14 days, each member gets a private choice to stay or move. Nobody is moved without asking.

Filling the gap:
1. Batched starts: pods open on Mondays, and the waiting list is matched by bucket (stage, attempt band, language, time of day) every Monday at 06:00 IST, so pods start with 6 to 8 people together.
2. The Commons.
3. Opt-in buddy pairs across forming pods.
4. Floating leads: one volunteer senior covers up to 10 forming or small pods.
5. Chotu as host, never as a member.
6. Honest copy: "Your pod has 2 people so far. 6 more join on Monday 20 Oct."

Server:
- a weekly batch job
- pods.state, computed daily
- a merge job
- a presence-only CommonsRoom DO per room
- extend /ritual with a per-pod host schedule

## 5. Staged profile
Rules:
- One question at a time, at most one a day, asked at the moment it helps, with "why we ask" and a "Skip" button just as big.
- Infer before asking: weak subjects from practice, study hours from Focus.
- Store on the phone by default. Only stage, attempt band, language and time band go to the server.
- Never ask about mood, money or family in a form.
- Chotu asks in Talk mode, or an inline card asks. Never a modal.
- A skipped question waits at least 7 days; after two skips, never ask again.

Stages:
0. First run: language, 18+, consent, nickname.
1. When joining a pod: stage, attempt band (1st, 2nd-3rd, 4th+), preferred study time.
2. Days 1-7, in context: target year; medium (EN, HI, both); working or full time; optional subject (asked when they first open Mains practice).
3. Inferred, weeks 1-3: strong and weak subjects, accuracy band, average daily study time, best time of day.
4. Week 3+, inside the tool that uses it: city or study hub, coaching or self-study, the attempt they'd stop at (only inside Attempt Compass).
5. At a value moment: main goal for this cycle, and the hardest part right now.

Phone table profile_fields: field, value, source (asked | inferred | imported), confidence, asked_at, skipped, synced (1 only for the matching fields). Server: add members.stage, members.attempt_band, members.lang and members.time_band.

## 6. Leaderboards and badges
No individual leaderboards anywhere in the community.

Stamp book (in Me, passport style, uses the stamp sound):
- Showing up: first Close the Day; 4 rhythm weeks; came back after a break. Never counts consecutive days. Visible to you; share if you choose.
- Helping: first thanks; explained something; welcomed a newcomer; answer-hour reviewer. Visible to you and your pod.
- Mastery, per topic: 80%+ on spaced recall across 3 sessions. Visible to you; share if you choose.
- Pod: the pod's first full week; a pod Quiz Night run. Visible to the pod.
- Roles: Buddy, Pod lead, Senior, Mentor. Visible to everyone.

No stamp for chat volume, none that can be lost, none tied to money.

Shared goals: the pod weekly goal bar, and a community season ("Prelims 2027 season: together, 1 million questions by 24 May"), one counter on Adda, with no ranks. Role ladder: Member → Buddy → Answer-hour reviewer → Pod lead → Senior → Mentor.

Prep only, opt-in mock score band: after a mock, "Show me where I stand" gives a band ("Top 25 to 40% of the 1,240 people who took this mock"). Never a rank or a name. Free shows the band; Plus adds the subject breakdown and trend. Off by default and off on result days.

Not building: leaderboards, XP, levels, streak counters, loss messages.

## 7. Funnel
Free, no card needed:
- All of Adda.
- Chai daily cards.
- Practice: Today's 3, all 70 types, the Prelims bank.
- 3 answer feedbacks a week, on Haiku.
- 1 full mock a month, with score and band.
- Chotu Prep: 15 cloud turns a day; on-device is unlimited.
- The routine builder.

Plus (₹299 a month or ₹2,499 a year):
- A weekly Chai test and a monthly compilation.
- Unlimited personalised revision.
- Unlimited, deeper feedback.
- All mocks, with subject breakdown, trend and error log.
- 100 cloud Chotu turns a day, answer coaching, "teach me this topic".
- A personal plan that rebuilds itself weekly.

Above Plus: Sprint ₹3,999 per cycle (100-day plan, weekly group mentor call, weekly human review). Mentor ₹8k to 25k.

Offers appear only in Prep, at these moments:
- The 3rd free feedback has been used and its result opened.
- A free mock is finished and the band viewed.
- The 15 cloud Chotu turns are used up ("Chotu's out of cloud turns for today. It still works offline. Plus gives you 100 a day").
- Week 4 of a met rhythm (a preview of the Plus plan).
- UPSC notification day (Prelims sprint).
- Prelims qualifiers, after 72 hours (Mains sprint).
- A repeater opens Attempt Compass (a mentor diagnostic).

Never: on Adda, in pods, the Commons, Chotu Talk or Close the Day; within 72 hours of a result; in distress; in pause mode; after 22:30.

Boosters:
- Founding members: 30 seats at the annual price with a lifetime lock.
- Gift Plus: a link a member sends to family.
- Scholarship seats: 1 free Plus per 10 paid, chosen by pod leads, with the count published monthly.
- Pod perks for referrals: the whole pod gets 3 extra feedbacks.
- A 7-day trial unlocked after the first full pod week.
- Active pod leads get Plus free.

Admin metrics to add:
- share of new members in a pod with 3+ humans by day 7
- lurker-to-poster rate per pod
- profile completeness by stage
- value-moment reach, trial start and trial-to-paid rates
- Gift Plus share of purchases
- offer impressions on forbidden surfaces (must be 0; alert if not)

## Chotu persona (from chotu.md)
A small clay kulhad that has sat on library desks in Mukherjee Nagar and Ashok Nagar.
- Warm, not sugary; dry humour only about aspirant life; honest; brief.
- Mirrors English, Hindi or Hinglish.
- Says it's an AI and claims no feelings.
- Pushes toward people; short and calming after 23:30.

Modes:
- Talk: company, check-ins, gentle profile asks, routing to humans.
- Prep: explains from approved notes only, quizzes, coaches answer structure without writing the answer.
- Plan: at most 3 tasks.
- Host: pod rituals.

Hard limits: always labelled AI; distress → the support sheet, never counselling; no rank or odds predictions; no quit/continue advice; facts only from sources; never mentions Plus or prices; off for 72 hours after a result (one supportive line only); a soft hand-off after about 15 Talk turns.

Memory notes: up to 10 short facts the member said and agreed to keep, stored on the phone, shown in Me → Profile, deletable one by one.
