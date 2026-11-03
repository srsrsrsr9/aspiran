# Earth and sky: Aspiran's one look (3 Nov 2026)

**Idea.** Earth is where you sit down every day: your pod, Chai, Chotu. Sky is what you're working towards: the syllabus
as stars, Prep, mocks. Chai is the one accent everywhere, the lamp you study by.

**Rules.**
- The space picks earth or sky: the Adda is earth, Prep is sky. The theme picks day or night.
- Headings are Martel (800 on web, Bold on Android). Body text stays the system font; reading text stays the serif.
- Buttons and links are always chai. Never use #C8693A for text or buttons on light backgrounds; it fails contrast.
- The website starts in the sky (hero, how prep works) and lands on earth from the pod room down, with a horizon glow.
- Stars are still in the app (no motion). Reduced motion is respected on the website.

| Token | Earth day | Earth night | Sky day (dawn) | Sky night |
|---|---|---|---|---|
| background | #F7F2EA | #17100B | #F3F3F8 | #0B0E1C |
| card | #FFFDF9 | #22180F | #FFFFFF | #141932 |
| ink | #2A1B12 | #F3E8DA | #161A2E | #EEEAF6 |
| muted | #6E5A4C | #BFA996 | #565C78 | #A3A8C6 |
| line | #E4D8C8 | #3A2B1F | #DCDDEA | #262C4A |
| chai (buttons, links) | #9A4E0E | #F0A04B | #9A4E0E | #F0A04B |
| soft fill | #F6E2C9 | #3B2716 | #E6E7F3 | #1E2444 |
| cardamom (ok, focus) | #4F6B3E | #9DBB83 | #2E3A73 | #7FE3F0 |

**Where it lives.** Web app: `server/public/app/index.html` (top of the style block). Android: `ui/Theme.kt` (earth) and
`ui/Kulhad.kt` (`PrepLight`/`PrepDark`, sky). Website: `aspiran-web/src/styles/global.css` (earth, legal pages) and
`home.css` (`.night` sky, `.earth` lower half). Change all three together.
