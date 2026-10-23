# Rework slice 2: sell-first Prep home, Chotu as tour guide, AI privacy line (23 Oct 2026)

Built from the owner's comments on the Buyer Review (22 Oct) and the plan's workstreams W1 and W2.
Local branch `rework/slice-1` only. Nothing pushed, published or deployed.

## What changed

**W2 Prep home**
- Prep now has four chips: Today, Syllabus, Practice & Mocks (Practice and Mocks are inner chips) and My Plan.
- "The full UPSC syllabus" strip sits at the top of Today: Prelims, CSAT, GS1 to GS4 and Essay, each opening its paper in the Syllabus tab.
- The Syllabus tab lists the official topic headings for each paper (new `data/Syllabus.kt`). Each topic expands to show the pieces and reads that match it.
- Coverage and readiness for each paper are Plus. Members see their real percentage. Everyone else sees a blurred meter and a "Track your coverage and readiness · Plus" pill, with no fake numbers behind it.
- "One topic, N ways to make it stick" (`SevenWays`) sits on Today. It picks the day's subject that has at least 3 kinds of engine and shows a coloured tile for each way. It stays hidden while the library is empty.
- The Plus banner stays on Today.

**W1 Chotu sells**
- Chotu has a glazed, brighter cup. Wherever Chotu talks, the cup also glows, bobs, blinks, looks toward your last tap, and lets off a puff of steam at each new line. The hand waves on the first tour stop. It all stays still when the phone asks for less motion.
- The new 60-second tour has six stops with progress dots:
  1. Adda greeting
  2. Prep: syllabus and the many ways
  3. Answer Studio (3 free a week)
  4. Open pod rooms
  5. Chotu all day
  6. The Plus pitch
- The pitch ends with "Start free" or "See Plus", and shows the price line from `/plus/status` (₹299 a month, or ₹2,499 a year).
- The mock result shows a Chotu nudge to Plus for non-members. It is skipped in result week, like the other nudges.

**Privacy**
- The in-app "What leaves this phone" page and `server/public/legal/privacy.html` now say three things:
  - Online Chotu questions and Answer Studio photos go to an outside AI service (Google Gemini, Groq or NVIDIA).
  - Free or developer tiers of those services may keep what is sent.
  - We keep neither the questions nor the photos.

## Checked
- `gradle :app:assembleDebug` succeeded with no new warnings.
- On the emulator (screens in `slice-2-screens/`):
  - the glazed Chotu on the Adda
  - Prep with four chips and the syllabus strip
  - the GS2 syllabus with 11 topics and the locked coverage pill
  - the tour's first and second stops
  - the Plus pitch

## Not checked
- The emulator had no content server, so these were never shown:
  - "One topic, N ways" was hidden.
  - Topics were empty.
  - The pitch showed no price line.
- I haven't watched it on a real phone with real content.

## Judgement calls
- There is no founding price on the server, so the pitch uses the real ₹299 and ₹2,499.
- Focus mode stays in My Plan.
- The old Plus tab composable (`PlusTab`) is no longer used. Members reach Plus through the Plus page and the Practice entries.
- I built the changes straight into the app rather than making mocks for approval first.

## Not done yet
- W6 Mock Intelligence
- W4 ritual nudges
- W7 cinematic current affairs
- W8 legal risk ranking
- the PYQ import
- real checkout, which needs the Play account and legal entity
