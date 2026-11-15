# aspiran.in as a conversion machine: review (15 Nov 2026)

Walked as a first-time aspirant on desktop and phone (375 px): home → "Try one topic free" → Federalism cover →
first question → "Join free" sign-in. Also read /how-it-works. Source: `~/Documents/aspiran-web` (live = `origin/main`,
ba73e07). Home page = `src/components/ShortHome.astro`; long page = `src/components/HomePage.astro`. Nothing changed.

## The short answer

The bones are good: one clear button, no sign-up to try, the first real question is **2 taps** from the home page,
sign-in is one Google button, the page is fast (about 220 KB, text on screen in under half a second) and works well
on a phone. It doesn't feel like a conversion machine for three reasons:

1. **You never see the product.** The home page has no screenshot, no video, no image of the app. Not one.
2. **Nothing makes a stranger believe you.** The trust section apologises ("New, and honest about it") instead of
   showing the honest proof you already have.
3. **The second button leaks the keenest visitors** to a 21,500-pixel page that ends in a waiting list
   ("Save my seat in the first pod batch… is forming") for an app that is already open.

## Top 5 changes, most sign-ups first

### 1. Show the app right under the hero (biggest win)
**Why:** an unknown brand asking people to spend 15 minutes needs them to *see* what they'll get. Right now the
visitor reads four text cards and has to imagine it. You already have the best material: the 13 Nov trailer, with the
real app screens in it, and 254 short videos.
**Do:** directly under the hero buttons (`ShortHome.astro`, between section 1 and section 2), put either
- the vertical trailer as a tap-to-play poster ("▶ Watch: 1 min 40. Sound off until you tap"), with nothing loading
  until it's tapped (same rule as the demo), **or**
- a strip of 3 real phone screenshots with one-line captions: "1. Guess first." · "2. Read it short." ·
  "3. It comes back next week, just before you'd forget."
On phone, make it a swipeable row. This also gives the share card (`og.png`) something real to show.

### 2. Put your honest proof on the home page; drop the apology tone
**Why:** "We have no toppers to show you" is true and good, but it's the *only* proof, and it's in section 5. Your
demo's cover page has stronger, honest proof that the home page never uses.
**Replace the "New, and honest about it" section with "What's behind it"** (three short facts, then the honesty line):
- **What's inside, in numbers:** "2,000+ practice questions, 250+ short videos, 19 hours of notes read aloud,
  all mapped to the UPSC syllabus." (These are the demo's own numbers. Check they're current, and make the demo agree
  with itself: its cover says "254 videos… nearly 20 hours", its banner says "250+… 19 hours".)
- **Who wrote it:** "Written by our team. Past-paper answers match UPSC's official keys. Every card says whether an
  editor has checked it." (Lifted from the demo cover; it's the line that answers "can I trust this?".)
- **Why it works, with the source:** "Recall beats re-reading (Roediger and Karpicke, 2006). Spaced review beats
  cramming." The trailer already cites these; the site doesn't.
- Then keep the honest line: "We opened in 2026, so we won't show you toppers. Try one topic and judge us."
- **Later, real voices without testimonials:** the demo's end survey (`/try/summary`) will give chip counts. Once
  there are 20+ answers, show them as they are, e.g. "Of the first 40 people who finished Federalism, 29 said they'd
  use it again." Only real numbers, only once you have them.
- **Owner's call:** a real person's name and face ("Made by [name], SnapSkill LLP, Mohali") is the single strongest
  trust signal a new Indian ed brand can show. Right now there's a company, not a person.

### 3. Fix the /how-it-works leak
**Why:** the second hero button ("See how it teaches") goes to the long page. Whoever clicks it is your most
interested visitor. That page is about 21,500 px tall, its main action is **"Save my seat in the first pod batch"**,
it ends with **"The first pod batch is forming"**, and its price card has no button at all. It's the old waiting-list
funnel, still live.
**Do (in `HomePage.astro`):**
- Every "Save my seat" → "Try one topic free". Delete "The first pod batch is forming. Come say hi."
- Room 16's seat form → the home page's "Not now? We'll email you the link."
- Add the Try button under the Room 15 price card.
- Still unresolved from the 2 Nov review: "— on the wall of every Aspiran pod" (there are no walls; cut or change to
  "— the Aspiran pod rule").
- Footer here says "Study content is a draft until our editors check it", the home says "Content says on the page
  whether an editor has checked it". Use the home wording on both.

### 4. Sharpen the first screen: say who it's for and what 15 minutes gets them
**Why:** the headline is strong and matches the trailer, keep it. But the line under it lists three features, and
the kicker ("UPSC CIVIL SERVICES · ENGLISH AND HINDI") doesn't say *who*. The grey small print under the buttons is
the most persuasive bit (free, no card, 15 minutes) and it's the least visible.
**Suggested hero (English; Hindi to match):**
> **What you read in October is gone by March.**
> You don't have a reading problem. You have a forgetting problem. Aspiran brings back what you read just before
> you'd forget it, in 15 minutes a day, in English or हिंदी. For UPSC aspirants on their own books, with or without
> coaching.
>
> **[ Try one topic free ]**  See how it teaches
>
> ✓ No sign-up  ✓ No card  ✓ 15 minutes: Federalism, with real past-paper questions

(The middle line is Jeetu's line from the trailer, which is the clearest one-sentence pitch you have.) Make the three
ticks normal text size, not grey small print. Button text "Try one topic free" matches the trailer's end card
exactly; "no sign-up" moves into the ticks.

### 5. Handle the price and the "why not coaching?" objections where they arise
**Why:** ₹9,999 is printed huge; the ₹999 offer is in small grey text, and paying means "WhatsApp us to pay by UPI".
A visitor who scrolls to price sees ₹9,999 and stops. (Note: don't add a "X of 300 left" counter: that's the
countdown you've promised never to show.)
**Do (in the price section):**
- Free card first and plainly called the main offer: "Free. Not a trial. Your pod, daily review, Chai, Chotu, 3
  answers marked a week."
- Plus card: lead with the offer line: "**₹999 for your first year** (first 300 people), then ₹9,999 a year. One
  payment, no auto-renewal, refund within 7 days." Only while it's genuinely buyable.
- Add 3 FAQ questions people will actually have:
  - "I already go to coaching / watch YouTube. Why this too?" → "Coaching teaches it once. Aspiran makes it stay:
    10 to 20 minutes of review a day on what you've already studied."
  - "Is it for Prelims or Mains?" → both, with one line each.
  - "Who is it for?" → first attempt, repeater, working aspirant, Hindi medium.

## Smaller fixes

- **Nav "Open the app"** (phone and desktop) goes straight to sign-in. For a first-timer that's a dead end. Rename it
  "Sign in", or point it to the demo.
- **Demo cover** asks a choice (Express or Whole topic) and shows a video and a 7-minute audio player before the first
  question. Fine on desktop; on phone the audio block pushes things down. Consider a single "Start (15 min) →"
  button with "or do the whole topic" as a small link.
- **Speed:** the English page downloads the Hindi font (about 100 KB, half the page's weight). Load the Devanagari
  font only on /hi/ or only where Hindi text appears (the language link). Otherwise speed is good.
- **The recall trick** (Preamble, sections 2 and 4) is a lovely idea, but on phone the answer is only about 2
  screens below the fact, so it isn't a real test, and many will scroll past section 2 without reading it. Keep it,
  but consider moving the question to just above the price, so it also pulls people further down.
- **Pod promise:** home says "a small pod of 6 to 8 aspirants at your stage". Check that's what a new user gets today;
  if pods start smaller, say "a small pod (up to 8)".
- **"Chai's getting cold."** as the last heading is charming but says nothing. Try "Fifteen minutes. One topic. See if
  it stays." above the button.
- **Measure before the next round:** PostHog is live with click tracking and the visitor id passed into the demo.
  Build one funnel in PostHog: home visit → Try click → demo screen 1 → demo finished → signed in. Look at it after a
  week; it will show which of the above matters most.

## What's already working (keep)

- One action everywhere, and it's the right one (try without an account).
- 2 taps to the first real question; Google sign-in in one tap; progress carries over into the account.
- The "never see here" list: a real differentiator, and honest.
- Headline matches the trailer's line word for word.
- Phone layout: no sideways scroll, big buttons, readable text.

## The funnel to watch in PostHog (for the owner)

PostHog → Product analytics → New insight → **Funnel**, "within 1 day", these steps in order:

1. **Saw the home page**: `$pageview` where URL path is `/` or `/hi/`.
2. **Tapped Try**: `cta` where `cta` = `try` (break down by `where` to see which button works: hero, shots, recall, price, end).
3. **Opened the demo**: `try_open` (the app passes the site's visitor id as `ph=`, so steps 1 to 3 join up as one person).
4. **Started the route**: `try_step` where `n` = 1.
5. **Finished the topic**: `try_finish`.
6. **Tapped Join**: `try_join`.
7. **Signed up**: `onboarding_done` where `from` = `try`.

Read it after a week of traffic. The biggest drop between two steps is the next thing to fix. A second funnel, "Saw /how-it-works/ → `cta` = `try`", shows whether the long page now sends people to the demo. Visitors who switch analytics off in the app are not counted, so the numbers are a floor.

## Done (15 Nov 2026)

Built on aspiran-web branch `claude/conversion-review` (not published yet):
- **Home, English and Hindi** (`ShortHome.astro`, `short.css`, `pages/hi/index.astro`):
  - Hero: says who it's for, adds "You don't have a reading problem. You have a forgetting problem.", button "Try one topic free", three ticks (No sign-up · No card · 15 minutes).
  - New "What the 15 minutes look like": three real demo screens (Guess first · Real PYQs, "how sure?" · It comes back), English and Hindi versions, WebP about 30 to 40 KB each, lazy-loaded; a swipe row on phones.
  - "What's behind it" replaces the apology: 2,000+ questions, 250+ videos, 19+ hours of notes, 11 past papers (counted on production today, rounded down); who wrote it and how it's checked; the research with sources; the honest "no toppers" line.
  - The recall question moved further down (before the price).
  - Price: Free first ("not a trial"); Plus leads with "₹999 for your first year · first 300 people · then ₹9,999". Paying stays "WhatsApp us to pay by UPI" (the owner collects UPI directly). No counter.
  - FAQ: coaching / YouTube, Prelims or Mains, who it's for.
  - End heading: "Fifteen minutes. One topic. See if it stays."
  - Nav "Open the app" → "Sign in". Pod line → "a small pod (up to 8)".
  - The English page no longer downloads the Hindi font (the ₹ sign was pulling it).
- **/how-it-works, English and Hindi:** by the side session on branch `claude/how-it-works-fixes`, merged in.
- **Demo:** one set of numbers and a single Start button, by the side session in the app repo.
- **Skipped:** the trailer on the site (free ElevenLabs plan doesn't allow commercial use); a named founder (owner's call); real survey counts (not enough answers yet).
