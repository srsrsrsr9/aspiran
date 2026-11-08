# Try one topic: the Federalism demo (version 2)

8 November 2026. Branch `sample-topic-open-access`. Not deployed, not merged.

## Decisions for you (blocking before it goes public)

1. **Price question in the survey.** It says: "Plus (every mock paper, mock insights with an error log, the weekly Chai
   test and the monthly compilation) costs ₹9,999 a year. The first 300 people who buy on our website pay ₹999 instead."
   - Is that the right one-line description of Plus?
   - Does the ₹999 renew at ₹999 or at ₹9,999? If it renews at ₹9,999, the question must say so.
2. **AI marking of a photographed answer: free or Plus?** The essay screen says this is "still being decided" until you
   choose.
3. **Contact consent.** Contacts are kept until the person deletes them (there's a button), and are used once.
   - Choose how long we keep them if nobody asks to delete (suggested: 12 months after the demo ends).
   - Choose a grievance contact.
   - Have a lawyer read the consent line (DPDP Rules 2025).
4. **Essay pages.** The three "handwritten" pages are drawn on screen in a handwriting font and labelled "written by our
   team for this demo". You make all content, so you may want to replace them with three real photographed pages.
   The margin notes stay the same.
5. **The videos use a synthetic voice** (Sarvam Bulbul). The cover and the video screen say so. Keep, or wait for
   recorded voice?
6. **Prelims 2026.** The path counts five papers (2018–2025) and says plainly that 2026 isn't counted yet. Adding the
   2026 paper to `content/pyq/pyq.json` would strengthen the "why this topic" line.

## What a visitor gets

**Cover:** "Learn one UPSC topic properly. Judge us by it." with two doors.

- **Express, about 15 minutes, 8 screens:**
  1. Guess first.
  2. The Governor and state bills.
  3. The Governor's desk (game).
  4. Which list? (six lookalikes).
  5. Three 2025 and 2018 PYQs with "how sure?".
  6. Plan a Mains answer.
  7. Keep it.
  8. Finish, with the survey.
- **Whole topic, about 75 minutes, 17 screens in three sittings:**
  1. Guess first.
  2. Five short reads.
  3. Which list? (12 items).
  4. Two "good place to stop" cards.
  5. The Governor's desk.
  6. The GST Council vote (game).
  7. Say it from memory.
  8. Eight PYQs.
  9. Three situations.
  10. Mains plan.
  11. Keep it.
  12. Finish.
- **Side doors (optional, never numbered):**
  - two 52-second videos (Governors and the clock; when Union and State laws clash);
  - four news cards (the Governor ruling, the 16th Finance Commission, the failed 131st Amendment, GST 2.0);
  - an essay in three snaps (skeleton, outline, page, with S/C/E margin notes, plus "try yours" by photo, which never
    leaves the phone);
  - a tour of the app.

**Showing our thinking:**
- Every step has a folded "Why we do it this way" note: plain English and Hindi, the study it rests on, and how strong
  that evidence is (bands A to E).
- One dry joke per step, never about results or wellbeing.

**Collecting feedback:**
- Up to five one-tap questions, each saying what we'll decide with the answer. They only appear after a step is done,
  and a "No more questions" link turns them all off.
- A six-question end survey: stage, language, most useful part, what's missing, what it would replace, price, and
  0 to 10 likelihood to recommend.
- An optional contact field with a consent box.
- A "Delete what I sent" button.
- After sending, the visitor sees what others said, once at least 20 people have answered.
- You read it all in **Admin → Try one topic**, with a CSV download. Written answers that match the crisis-protocol
  phrases show the helplines at once and are marked CARE at the top.

## What changed after the expert reviews

I asked three specialist reviewers (UPSC Polity faculty, a learning scientist, a UX and sales lead) for independent
reviews. Their full reports are in `artefacts/try-one-topic-reviews/`. Most important changes:

- **Facts brought to November 2026.** The first version was out of date in places:
  - The 16th Finance Commission kept 41% with new weights; the government accepted it on 1 Feb 2026.
  - The Supreme Court's 20 Nov 2025 opinion: a Governor has three options, not four, and may reserve a re-passed bill.
  - Also added: the failed 131st Amendment on Lok Sabha seats (17 Apr 2026), Census 2027, GST 2.0 and the end of the
    compensation cess, Manipur's President's Rule (2025–26), Keralam, and Tamil Nadu's Kurian Joseph committee.
- **Learning design:**
  - The text folds away before each check.
  - "Keep it" asks the cards cold and grades them; it no longer marks all eight as known.
  - The warm-up guesses come back at the end.
  - The recall checklist opens only after a try.
  - Three confidence levels, with the negative-marking maths.
  - A worked plan is offered to Mains beginners.
- **UX:** the Express door, a slim header with named stages (Learn, Practise, Write, Keep), one PYQ per screen,
  answers labelled in words ("Right answer", "your pick"), and no Join button inside the path.
- **Honesty:** the old line "nothing is sent anywhere" became untrue once feedback existed. Now the first quick question
  says exactly what is sent, and the cover says the videos use a synthetic voice.

## Before it opens (editors)

1. **Polity editor:** check the 18 items in `factsToCheck`. The reviewers could reach news and legal sites, but not the
   judgment PDFs, the Finance Commission report or PRS. So the primary documents still need a human check.
2. **Hindi editor (Pooja):** all the Hindi. The PYQ and video-transcript Hindi is our own translation.
3. **Import and approve:**
   1. Run `node scripts/syllabus.mjs pack`. The videos ride in the pack.
   2. Run `npm run import -- <folder>`.
   3. Approve English on the desk. Visitors see nothing until then.
4. **Deploy:** it needs migration 0009 (`try_feedback`, `try_contacts`). The Worker also creates these tables itself on
   first use. Deploying needs Cloudflare access, which this cloud session doesn't have.

## Tested

- Walked in a phone-sized browser: Express end to end, every side door, the full-route screens, Hindi, and the admin
  view. No page errors.
- Survey answers reach the database. Preview taps are tagged "draft:" and left out of admin.
- `npm run test:try` passes: gate, Hindi stripping, feedback, consent, the distress flag, the summary minimum, and
  delete. The smoke, mocks and pyq suites pass. Type check passes.

## Not done

- No link from the website (aspiran-web) yet.
- The Android app has no screen for it; phones use the web app.
- The status page is unchanged, because nothing is deployed.
