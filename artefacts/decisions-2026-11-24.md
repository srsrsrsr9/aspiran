# Decisions made for the owner, 24 Nov 2026

The owner said "go ahead and decide for me" (24 Nov). These are Claude's calls on every open question that didn't
need the owner's own hands. Any of them can be reversed: say which.

## Coaching centres (the 11 in `coaching-centres-plan-2026-11-14.md`, plus the open item)

1. **Branding:** inside the app only, for now. No separate Play app for each centre. The Play Store app is "Aspiran".
2. **One centre per person** for now.
3. **18 and over only** until there is a parent-consent flow.
4. **Students in a centre get Plus while they are in it, paid by the centre.** During the free pilot, the centre's students
   get Plus free for the 30 days.
5. **Quick first answer on doubts:** off by default; the centre switches it on. Labelled "A quick first answer from
   Aspiran. Your teacher checks doubts too." Never "AI" (owner's rule, 17 Nov).
6. **Distress goes only to Aspiran's moderators**, never to the centre. No centre safety contact.
7. **Teachers see per-student numbers** inside their own centre. Batch figures stay hidden below 5 students. No rankings.
8. **When a student leaves:** their answers, ticks and personal plans are deleted. Doubts and messages stay, with the
   name removed.
9. **Pricing (option A, rescaled to Plus at ₹3,999):** ₹1,200 per student a year, minimum 25 students (₹30,000).
   A free 30-day pilot for one or two batches. The website still shows no price for centres; the price comes after the pilot.
10. **Only Aspiran staff create centres.**
11. **Console address:** `app.aspiran.in/institute`.
12. **Centres choose features and pods:** build it. Each feature has a switch the centre controls: chat, doubts, the
    quick first answer, plans, own content, and pods. Pods are off by default for centre students.
13. **Android:** build the student side of centres in the Android app (join by link or code, the centre's name and colour,
    chat and announcements, doubts with a photo, plans, the centre's content). Until it ships, the for-coaching page
    says the student side is on the web, with Android coming soon.

Switching the `institutes` flag on stays with the owner (standing rule: Claude never changes a live flag).

## AI (from `ai-budget-decisions-2026-11-22.md`)

1. **Where the hidden $15 sits:** a monthly limit of $1.25 per Plus member, counted from the logged cost of each call.
   Past it, answers quietly move to the cheaper model (gpt-oss-120b, then gpt-oss-20b), then to on-phone Chotu if the
   member has it. Nothing is shown to the member. The count restarts on the 1st of each month.
2. **Free members and visitors:** a daily number of cloud Chotu turns (as now), plus cutting someone off for the day for
   any of these: more than 100 turns in a day, messages faster than one every 2 seconds for a minute, more than 3
   accounts on one device in a week, or a long run of questions that have nothing to do with study. A cut-off person gets
   a calm, plain line, never an accusation.
3. **Uploading Chotu chats:** only after a clear notice and a yes from the member (India's DPDP Act). Until they say
   yes, nothing is uploaded. The privacy page gets a new section first. A no keeps everything working.
4. **Daily study profile for Plus:** built. Once a night, a strong online model writes each Plus member's short study
   profile from their own study counts (what they did, what's weak, their plan). Only counts and codes go in, never their
   chats unless they said yes to point 3. The profile feeds Chotu (online and on the phone) and Jeetu.
5. **On-phone model:** chosen by running the 303-case Chotu test set on the candidates and picking the best score that
   runs on a 6 GB phone. The result and the reasons go in `artefacts/`. The owner can overrule it.
6. **Retired backup model:** Llama 4 Scout is replaced wherever it is still listed.
7. **Separate Groq key for Plus:** optional. Until the owner adds `GROQ_API_KEY_PLUS`, Plus shares the main key.
   Spend is still counted per group.

## Website, marketing, and plans

1. **The free plan is free forever** (it never ends). The site already says so. The pamphlet's "Free trial" is changed to
   "Free" in the next print run. Jeetu's 14 days are called a "taste", not a trial.
2. **Sunday "Your week" for free members:** yes. It's counts only, no model cost, and it brings people back.
3. **K4 five-email series:** a separate tick-box ("Send me 5 short study emails"), unticked by default. The demo's promise
   of one email stays true for people who don't tick it.
4. **K3:** add the 4 FAQs to the site.
5. **UPSC files saved by the Internet Archive** count as UPSC sources when the saved address is on upsc.gov.in.

## Still with the owner (can't be decided for you)

- Typing secrets (`GROQ_API_KEY_PLUS`, rotating the Sarvam and Cashfree keys), the ₹1 Cashfree test, and Play Console
  work: building, signing and uploading Android, the store listing, and the closed test with 12 testers.
- Switching on live flags (`institutes`, Plus in the Android app).
- A native Hindi read, and a mental-health professional's read of Chotu's one-line replies before wide launch.
