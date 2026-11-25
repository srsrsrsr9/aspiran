# The Android app as a conversion engine (25 Nov 2026)

**Owner's ask:** the app should welcome new people, let them feel the product fast, remember what they did, nudge
them to do more, and close (Plus) without it feeling like a sale. Built in Android 19 (0.7.0).

## The journey, in order

| Moment | What the person sees | Code |
|---|---|---|
| Welcome | One question first (the Preamble), then language. Three screens at most, as on the web. | `ui/OnboardingScreen.kt` |
| One last screen | Name, "I'm 18 or older and I've read what we keep" (details fold open), who Chotu is. "Not now: just read today's Chai" stays visible. | same |
| First five minutes | "Welcome, Priya." Three numbered things, one button: "Start with today's Chai". Replaces the 4-stop tab tour. | `ui/JourneyUi.kt` `FirstFiveMinutes` |
| The Adda | **Next up** card (one thing, one button, minutes), **What you've built** (4 tiles), **Your first week** (8 steps, ticks). | `NextUpCard`, `MemoryTiles`, `FirstWeekPath` |
| After each step | A dark bar for 7 seconds: "✓ Read today's Chai · 1 of 8 · Next: …" with Go. | `StepDoneBar` |
| The nudge ask | Asked when cards exist to come back ("3 cards you answered are set to come back…"), not on day zero. | `NudgeStepSheet` |
| Push | Morning: "Chai's ready. 3 cards today. And 4 cards from earlier came back." Comeback: "Your 12 cards are still here." | `data/Rituals.kt` |
| The close | Day 5+: "Your first week" in their own numbers; free members also get "A week like yours, with Plus" (their misses, their mocks), with "Keep going free" next to "See Plus". | `FirstWeekScreen` |

## The eight first-week steps
Chai → pick nudge time → meet your pod → practice set → review (only when cards are due) → one 7-minute answer →
quick mock → see your week (from day 5). At most 3 a day ("That's a good day."), skippable, never a streak.
After the first week (or 14 days) the card runs the daily loop: cards due → Chai → practice → answer hour → done.

## Rules kept
- No timers, streaks or public scores: the tiles are private, "you against you".
- Chotu's quiet hours (23:30 to 07:00): the card says "It's late" with no button, and shows Need to talk.
- No Plus ask in result week, while paused, or for a day after a distress check (`plusQuiet`). No price on the close.
- No "AI" anywhere. Chotu "is your study buddy, not a person".
- Need to talk: in the ⋮ menu on every screen (crisis protocol), on Me, in result-week mode and late at night.
- Removed: "How's it going? Good / Okay-ish / Rough day" (Chotu must not respond to feelings).

## Measuring it
- New event `journey_step` (step, day), allowed on the server (`server/src/metrics.ts`). With `onboarding_done`, it
  gives the first-week funnel: how many reach each step, on which day.
- `offer_shown` with moment `first_week`, and the existing `plus_view`/`paid`, show the close.

## Not done / next
- No phone walk-through yet (no working emulator on the Mac). Step 3 of the v19 runbook is that check.
- The web app could get the same Next up card and first-week path. Worth doing once Android's numbers come in.
- Existing members within their first 14 days see the path too, with what they've done counted from now.
