# Aspiran for coaching centres: plan (14 Nov 2026)

Branch `claude/frosty-burnell-f7ae53`. Phase 1 is built on that branch, behind the `institutes` flag (off by default).
Nothing here is deployed, and no production migration has been applied.

## In one paragraph
A coaching centre ("institute") runs its own students inside the same Aspiran app. A student types the institute's
code once. From then on the app shows the institute's name, logo and colour, a batch chat with announcements, a place
to ask doubts, the study plan the teacher set, and the institute's own notes and question sets, next to everything
Aspiran already gives them. Teachers and the institute's admins work from a console in the browser: batches, invite
codes, the roster, branding, announcements, doubts, plans, content and analytics. Each institute sees only its own
students, and only what happens inside the institute. Pods, Chotu, Jeetu and anything private stay private.

## 1. The model

**An institute is a tenant.** Every institute row has its own id, and every institute table carries `institute_id`.
Every server route looks up the caller's own membership first and refuses anything outside it.

**Roles (one per person per institute):**

| Role | Who | Can do |
| --- | --- | --- |
| Owner | The centre's head. One per institute: Aspiran makes the institute and gives the head a one-time owner code. | Everything an admin can, plus invite, change or remove admins. Can't leave, and can't be changed or removed by anyone in the institute. |
| Admin | Office staff, centre manager | Batches, invite codes (students and teachers), roster changes (move, remove, change role), branding, the AI switch, everything a teacher does |
| Teacher / mentor | Faculty | Answer doubts, post announcements, hide chat messages and see reported ones, write content, build study plans, see analytics, invite students |
| Student | Aspirants | Join with a code, chat in their batch, ask doubts, see their plan and the institute's content, do the institute's question sets |

**Joining.** The institute makes a code in the console, for example `KXR7-M2PD`. A code has a role (student, teacher
or admin), an optional batch, a use limit and an end date, and can be cancelled. A student opens Aspiran, goes to
Me → Coaching centre (or follows a link `app.aspiran.in/app/#inst/KXR7M2PD`), reads one plain notice of what the
institute will and won't see, ticks it, picks the name the institute will see, and joins.

**An existing account keeps everything.** Joining adds a membership. Their pod, rooms, Chotu chats, saved reviews,
journal, Plus and streak-free progress stay exactly as they were, and the institute can't see any of it. One institute
at a time in phase 1. Leaving is one button, any time. On leaving (or being removed), their answers to institute question sets, their plan ticks and any plan made just for
them are deleted; their doubts stay for the batch with the name replaced by "A former student", and their chat
messages stay with the same change. The owner can't leave; Aspiran hands the institute to someone else first.

**Who creates an institute?** Aspiran staff, from the Aspiran-staff box on the console page (the owner's admin key).
That gives back the owner's one-time code (valid 30 days; staff can make a new one while there is no owner). Staff can
also pause and resume an institute; while paused, its people can't use it and its codes stop working. Self-serve sign-up for institutes comes later, with billing.

## 2. White label

**What is honest and cheap (phase 1, built for the web):** branding after sign-in, at runtime, in the one app.
Once a student is in an institute, the web app shows the institute's logo and name at the top of the side rail,
"with Aspiran" under it, and uses the institute's colour as the accent everywhere. Signed-out screens, the sign-in
screen and the Play listing stay Aspiran. The same works in the Android app with the same `/inst/me` call (phase 2:
Compose already reads the accent from one theme, so this is a few hours, not a rebuild).

**What needs a separate Play listing:** the institute's own name and icon on the phone's home screen and in the
Play Store, its own app id, its own store listing and screenshots. That is a second build of the Android app per
institute (a "flavour"), a Play listing in the institute's own developer account or ours, and its own Firebase app.
Each one costs a Play review per update and a person to keep it in step. Only worth it for a large centre paying for it.

**Recommendation:** runtime branding only, for everyone, until a centre pays for its own listing. Say plainly in sales
material that the app in the store is "Aspiran", and that the centre's brand shows once a student joins. Don't promise
"your own app" until a separate listing is actually on offer.

## 3. Institute admin views (the console at `/institute`)

One page, served by the Worker, in the same style as `/desk` and `/admin`, signed in with the person's own Aspiran
account (Google, or the dev sign-in on a local server). The left rail shows only what the role can use.

- **Overview**: students, teachers, batches, open doubts, students gone quiet, invite codes in use.
- **Batches**: create, rename, archive. Each has its own chat and its own codes.
- **Invite codes**: make a code for a batch (students) or for staff (teachers; admins for the owner only), set uses
  and days, cancel.
- **Roster**: everyone in the institute with role, batch, when they joined and when they were last active. Admins
  move a student between batches, remove a person or change a role; only the owner makes or changes an admin.
- **Branding**: display name, colour, logo (PNG or JPEG under 200 KB), and the AI first-answer switch.
- **Chat**: each batch's messages; post an announcement (to one batch or all); hide a message; see what students reported.
- **Doubts**: open, answered and resolved, newest first, with the question or topic it is about. Answer, mark resolved.
- **Study plans**: build a plan for a batch or one student, day by day.
- **Content**: notes and question sets, draft or published, for one batch or all; paste a content-pack quiz to import.
- **Analytics**: see section 6. CSV download.

## 4. Internal chat

**Batch rooms and announcements.** Every batch has one chat. Announcements are messages from teachers and admins,
pinned at the top, to one batch or the whole institute. Students write only in their own batch.

**Why not the PodRoom Durable Object (yet).** PodRoom is built for a pod of up to 8: a lead, pings, a study room,
Chotu's rituals and the AI pod friends. A batch of 80 with a teacher who moderates fits it badly, and the AI pod
friends must never appear in a coaching batch. CommonsRoom is presence only, with no chat. So phase 1 keeps batch chat
in D1 and the app refreshes it every 10 seconds while the chat is open. That costs a few reads per open screen and is
easy to moderate and export. Phase 2 moves live delivery to a new `BatchRoom` Durable Object (a copy of PodRoom's socket
handling without its pod features) once a centre has busy batches.

**Safety in chat.** Every message goes through the same distress check as pods. A message that trips it is not posted:
the writer sees the care box with the helpline at once, and a "distress" report goes to Aspiran's own moderators, as in
`community/crisis-protocol.md`. The institute isn't told at all: not the text, and not that anything was held.
Students can report a message; teachers and admins see reports and can hide messages. Ten messages a minute per person
at most, across chat, doubts and replies. Names are
the name the student chose for the institute.

## 5. Doubt clarification

- A student asks a doubt: free text (up to 2,000 characters), optionally tied to a syllabus topic (the same topic ids as
  the garden), optionally tied to one of the institute's questions, and optionally with one photo (JPEG under 1.5 MB,
  in R2 under `inst-doubts/`, seen only by the student and the institute's teachers).
- **States:** open (waiting for a teacher), answered (a teacher replied), resolved (the student or a teacher closed it).
  The student can reopen it with a follow-up.
- **AI first answer (optional, off by default, the institute's switch):** when on, a doubt gets one first reply labelled
  "Aspiran AI" within a few seconds, and it stays open for a teacher. The AI never answers a doubt about feelings,
  ranks or results, never during 23:30 to 07:00 IST, and never a doubt that tripped the distress check (that one goes
  to the care flow above and is not posted). Photos are not sent to the AI in phase 1.
- Distress in a doubt is handled exactly as in chat.

## 6. Analytics for teachers and admins

Built only from what Aspiran actually stores on the server for that student, and only from the day they joined:

| Number | Where it comes from |
| --- | --- |
| Last active, days active in the last 14 | sign-in check (`accounts.last_seen_at`), app opens (`events`), institute activity |
| Focus minutes logged | `prep_minutes` events (numbers only) |
| Coverage by paper and topic | the institute's question sets they did, by syllabus topic |
| Accuracy | right answers / questions answered in institute question sets |
| Weak topics, per student and per batch | topics with at least 5 answered and under 60% right |
| Test results | institute question sets marked "test": each student's score, and the batch's spread |
| Doubts raised and resolved | the doubts tables |
| Plan progress | plan items they ticked done |
| Gone quiet | students with nothing at all for 7 days |
| Export | one CSV per batch or the whole institute |

**What is not there and why.** Aspiran's own practice, reviews and mocks are kept on the student's device today (the
server keeps mock scores without names). So a teacher sees the institute's question sets, not the student's private
Aspiran practice. Phase 3 can add "share my Aspiran practice with my institute" as a separate opt-in.

**Students never see each other's numbers.** The student screen shows only their own. No leaderboard, no rank, no
batch average shown to students, nothing public. Teachers see per-student numbers; that's what the centre is paying for.

## 7. Own content

- Kinds in phase 1: **notes** (title and text, English with optional Hindi) and **question sets** (1 to 100 MCQs of
  2 to 6 options, with the answer and an explanation; a set is either **practice**, done any number of times, or a
  **test**, done once). Each can be tagged with a syllabus topic, and the paper follows from the topic. Students never
  get the answers before they answer.
- For one batch or the whole institute; draft until published; visible only to that institute's students, under
  "From your institute" next to Aspiran's own library.
- **Reuse of the pack format.** A question set is stored in the same shape as `upsc-pods/quiz-pack@1`
  (`questions: [{ en: { question, options, answerIndex, explanation }, hi: {...} }]`), and the console takes a pasted
  quiz-pack JSON file as an import, with the same checks (answer in range, English and Hindi answers agree).
- Answers to institute question sets are marked on the server, which is what feeds the analytics.
- Later: PDFs and video upload (phase 3, needs R2 sizing, Stream or similar, and a per-institute storage cap), and
  bulk import of a whole pack folder.

## 8. Custom study plans

- A plan belongs to a batch or to one student, and has a title and a start date. Items have a day and are one of:
  a **topic** (a syllabus topic id, the same ids as the garden and the coverage map), a **practice** set or a **test**
  (one of the institute's question sets), a **note** to read, or a plain **task**.
- Students see "Your institute's plan" in the app: today's items first, then the week, each with a tick. Topic items
  open the garden at that topic; practice and test items open the set. The tick is the only thing reported back.
- It sits next to the student's own roadmap and garden. It does not replace them, and Aspiran's spaced reviews carry on.
- No timers, no streaks, no "you're behind" nags. A missed day just stays on the list.

## 9. Privacy and safety

- **Isolation.** Every institute table has `institute_id`; every route checks the caller's own membership and role
  first; ids from one institute return "not found" in another. Tests cover cross-tenant reads and writes and role escalation.
- **What an institute can see about a student:** the name they chose for the institute, their batch, when they joined,
  last active, days active and focus minutes since joining, their answers to the institute's question sets, their doubts,
  their messages in the institute chat, and their ticks on the institute's plan.
- **Never:** private pod or room chats, Chotu and Jeetu chats, the journal and "Your room", their own Aspiran practice
  and reviews, Plus or payments, their email or phone, anything from before they joined or after they leave.
- **What Aspiran staff can see:** the list of institutes with counts, and anything reported to Aspiran (distress
  reports, abuse reports). Staff don't read institute chats or doubts unless one is reported, or the institute asks for
  help in writing. This needs a line in the privacy policy and in the institute agreement.
- **Minors.** Aspiran is 18+ today. Phase 1 keeps that: joining an institute needs a tick saying the person is 18 or over.
  Foundation-course students under 18 need verifiable parental consent under the DPDP Act 2023 (section 9) and no
  behavioural tracking; that is a later phase with its own consent flow, not something to switch on quietly.
- **Consent.** One plain notice at joining, listing the "can see" and "never" lists above; ticked and stored with a time.
  Leaving withdraws it. Aspiran's "Delete my data" also removes all their institute data: membership, answers, ticks,
  personal plans, doubts (with photos) and messages. Replies they wrote on someone else's doubt stay, as "A former member".
- **Crisis protocol** in institute chats and doubts: the same distress check and care box as pods, with reports to
  Aspiran's trained moderators, never to the institute. Whether an institute should name a safety contact who is told
  in a tier 1 case is an open decision (below).
- **The institute is a data fiduciary for its students too.** The agreement must say the centre uses the data only to
  teach, and must delete exports when a student leaves.

## 10. Pricing

**Decided (24 Nov 2026, `artefacts/decisions-2026-11-24.md`, centres 9):** option A, rescaled to Plus at ₹3,999.
**₹1,200 per student a year, minimum 25 students (₹30,000 a year)**, after a **free 30-day pilot** for one or two
batches. Students get Plus while they are in the centre, and free during the pilot. The public website shows no price
for centres; the price is talked through after the pilot.

Built (24 Nov, `server/src/inst-centre.ts`): each centre has a pilot end (30 days from when Aspiran staff make it), a
paid-until date and seats, set in Admin → Coaching centres → Plan. Seats are a record; nobody is cut off by them.
Billing the centre itself (an invoice through Cashfree) is still to build; until then the paid-until date is set by hand.

The options as first suggested (kept for the record):

Prices in rupees, per student per year, for the institute. Students in an institute get Plus while they are in it
(the centre pays).

| Option | What | Price idea |
| --- | --- | --- |
| A. Flat per student | Everything in phase 1 and 2 | ₹1,500 per student a year, minimum 50 students (₹75,000) |
| B. Tiers | Starter (up to 100 students): chat, doubts, plans, content, analytics. Pro (up to 500): plus AI first answers, CSV and priority help. Enterprise: own Play listing, video hosting, SSO | Starter ₹1,200, Pro ₹1,800, Enterprise quoted (own listing adds about ₹2 lakh a year) |
| C. Seat packs | Buy seats in packs of 50, use them across batches | ₹60,000 per 50 seats a year |

Against the student price of Plus (₹9,999 a year then; ₹3,999 since 17 Nov), any of these is a large discount, which is the point: the centre
brings the students. A free 30-day pilot for one batch is the easiest way in.

## 11. Build order

**Phase 1 (built on this branch, web and server, flag off):**
- Database: institutes, members and roles, batches, invite codes, batch chat, doubts and replies, study plans and items
  with ticks, institute content and answers (migration `0014_institutes.sql`).
- Server routes under `/inst/...`, each with a tenant and role check; Aspiran-staff routes to create, pause and resume
  institutes and to make a new owner code.
- The console at `/institute`.
- The student side in the web app (`#inst`): join by code, branding, chat and announcements, doubts with a photo,
  the plan, the institute's content and question sets.
- Analytics and CSV from real data.
- Test suite `institutes` in `npm run test:all`.

**Phase 2:** Android student screens (join, branding, chat, doubts, plan, content); live batch chat on a `BatchRoom`
Durable Object; push notifications for answered doubts and announcements; teacher view on the phone.

**Phase 3:** institute billing (Cashfree invoices to the centre, seats, Plus for its students); PDF and video upload;
bulk pack import; "share my Aspiran practice with my institute" opt-in; under-18 consent flow; per-teacher batch
assignment; several institutes per person.

**Phase 4 (only when paid for):** a separate branded Play listing per large centre.

## 12. Decisions the owner should confirm
1. **Runtime branding only** for now (no per-centre Play app). Sales copy says the store app is "Aspiran".
2. **One institute per person** in phase 1.
3. **18+ only** in phase 1; no foundation-course minors until a parental-consent flow exists.
4. **Students in an institute get Plus, paid by the centre**, and free during the 30-day pilot. Built 24 Nov.
5. **Quick first answer off by default**, the centre's switch; shown as "A quick first answer from Aspiran. Your
   teacher checks doubts too." Never "AI" (owner, 17 Nov).
6. **Distress goes to Aspiran's moderators only**, never to the centre. Should a centre name a safety contact for tier 1?
7. **Teachers see per-student numbers** inside their institute (students never see anyone else's).
8. **On leaving**, answers, ticks and personal plans are deleted; doubts and messages stay with the name removed.
9. **Pricing**: decided 24 Nov: ₹1,200 a student a year, 25 at least, after a free 30-day pilot (section 10).
10. **Who may create institutes**: Aspiran staff only for now.
11. **Console address**: `app.aspiran.in/institute` (that host must be in Firebase's authorised domains for Google sign-in).
12. **Centres choose features** (decided 24 Nov, built): chat, doubts, the quick first answer, plans, own content and
    pods each have a switch in the console (Branding and switches). Pods are off by default for centre students.

All twelve were decided for the owner on 24 Nov 2026; see `artefacts/decisions-2026-11-24.md`.
