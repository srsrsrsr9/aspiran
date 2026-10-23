# 02: Android platform, visual system, accessibility, bilingual UX and low-end performance

*Slice owner: Android UX and design-systems research. Compiled 10 October 2026.*
*Scope: Kotlin + Jetpack Compose app for UPSC aspirants. Five tabs (Today, Pod, Practice, Rooms, My Path), a nightly "Close the Day" ritual, Chai Cards for news, Chotu the labelled AI mascot. Hindi + English. Built for low-end Android.*

**How to read this.** Each section has three parts: **(a) principles** with sources, **(b) what they mean for this product**, and **(c) build rules** with numbers and Compose snippets. Every claim has a source URL or is tagged **[Inference]**. Where I measured or computed something myself, it is tagged **[Measured]** and the method is given. Persona names come from the product brief: **Arjun** (small-town, Hindi-medium, family money at stake), **Meera** (urban, English-medium, attempt 2, comparison anxiety), **Rahul** (working professional, studies 2-4 hours around a job), **Sana** (woman aspirant with extra social load and safety concerns), **Vikram** (long-haul repeater, attempts 4-6, identity fatigue) and **Kavya** (online-only learner in a Tier-3 city, depends on apps and Telegram).

---

## 0. The audience these rules are built for

Every rule below follows from six facts about these users.

1. **The phone is cheap and the data costs money.** The device is usually a 2-3 GB RAM Android 10-14 phone with a 720p screen. Google's Play team reports that **more than 50% of Indian and Indonesian smartphone users have no Wi-Fi access**, so every MB is paid for. In emerging markets, a **10 MB smaller app correlates with about 2.5% higher install conversion** (https://medium.com/googleplaydev/shrinking-apks-growing-installs-5d3fcba23ce2). This matters most for **Arjun and Kavya**, and for **Vikram**, whose money is running out.
2. **Many users read Hindi first.** By 2016 India had more Indian-language internet users than English ones (234M vs 175M). KPMG and Google found that **68% consider local-language content more reliable** and **70% struggle with English keyboards** (https://assets.kpmg.com/content/dam/kpmg/in/pdf/2017/04/Indian-languages-Defining-Indias-Internet.pdf). Mukherjee Nagar is the Hindi-medium hub, and coaching material skews English-first (brief §3.1, §5.3). This matters most for **Arjun**, and also for **Kavya**.
3. **Late-night use is part of the product.** The guilt spiral peaks around **23:30** (brief §3.3). Close the Day happens in a dark room on a dimmed screen, so the dark theme, calm motion and quiet notifications are core features, not options. This matters for **all six**, and most for **Vikram and Meera**.
4. **Users distrust hype.** After years of misleading coaching ads (the CCPA penalised several institutes; brief §4.3), anything that looks like a coaching banner costs trust: red, yellow, countdowns, "LIMITED OFFER" chips, confetti. Calm design has to be visible on screen, not just stated. This matters for **Vikram and Meera**.
5. **Time is short and the phone is held in one hand.** Rahul studies between work tasks. Sana may be reading in a library queue or on a bus. Hoober's field study of 1,333 observations found **49% one-handed, 36% cradled and 15% two-handed** grips (https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php). This matters for **Rahul and Sana**.
6. **Shame and comparison are the core emotional risk.** Visual feedback must never look like a score, a rank or a failure state. A "missed day" is not an error. This matters for **Vikram and Meera**.

---

## 1. Material 3 in Compose: structure, components and colour

### 1.1 Navigation bar (five destinations)

**(a) Principles**
- Use a navigation bar for **three to five destinations of equal importance** on compact windows, where the destinations stay the same across screens (https://developer.android.com/develop/ui/compose/components/navigation-bar). Five is the maximum, so there is no room for a sixth tab such as "Honest Guide". It belongs inside My Path.
- `NavigationBarItem` takes an icon, a label and `alwaysShowLabel` (https://developer.android.com/reference/kotlin/androidx/compose/material3/NavigationBarItem.composable).
- Nielsen heuristic 6, *Recognition rather than recall* (https://www.nngroup.com/articles/ten-usability-heuristics/), favours visible text labels over icons alone. Icon meaning differs by culture, and "Pod" and "Rooms" have no universal icon.
- Fitts's law: time to hit a target depends on distance divided by size (https://ixdf.org/literature/topics/fitts-law). A bottom bar sits in the natural thumb zone of a one-handed grip.

**(b) Implications**
- Labels must **always** show, in both languages. On a 360 dp-wide 720p phone, each of the five items gets 72 dp. That width has to hold the Hindi label at 200% font scale without truncation. **[Inference]**
- Hindi labels must be short, everyday words. Proposed: **आज** (Today), **टोली** or **पॉड** (Pod; test both with Arjun-type users), **अभ्यास** (Practice), **रूम्स** or **बैठक** (Rooms), **मेरी राह** (My Path). **[Inference: validate in interviews]**
- Icons should say what each tab does, not decorate it: sun or teacup for Today, a small group for Pod, a pencil for Practice, a door or headphones for Rooms, a winding path for My Path. Use the outlined icon when unselected and the filled icon when selected, so state is shown by shape as well as colour (WCAG 1.4.1, https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

**(c) Build rules**
- Five items only. Set `alwaysShowLabel = true`, single-line labels, 12 sp (`labelMedium`) minimum.
- Never add a badge to Today. Allow a **dot** badge (no count) on Pod only. Counts turn a calm place into an inbox. *Serves Vikram and Meera.*
- Keep Scaffold's `contentPadding` and the edge-to-edge insets. Android 15 enforces edge-to-edge for apps targeting API 35 (https://developer.android.com/about/versions/15/behavior-changes-15).

```kotlin
@Composable
fun AppBottomBar(current: Dest, onSelect: (Dest) -> Unit) {
    NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceContainer) {
        Dest.entries.forEach { d ->
            val selected = d == current
            NavigationBarItem(
                selected = selected,
                onClick = { onSelect(d) },
                icon = { Icon(if (selected) d.iconFilled else d.iconOutlined, contentDescription = null) },
                label = { Text(stringResource(d.label), maxLines = 1, softWrap = false) },
                alwaysShowLabel = true   // labels always visible, both languages
            )
        }
    }
}
```
The icon's `contentDescription` is `null` because the visible label already names the tab. This avoids TalkBack reading it twice (https://developer.android.com/develop/ui/compose/accessibility/semantics).

### 1.2 Top app bars, cards, chips and bottom sheets

**(a) Principles.** M3 Compose offers small, center-aligned, medium and large top app bars (https://developer.android.com/develop/ui/compose/components/app-bars). Cards come in elevated, filled and outlined forms (https://developer.android.com/develop/ui/compose/components/card). Chips come as assist, filter, input and suggestion (https://developer.android.com/develop/ui/compose/components/chip). Modal bottom sheets hold secondary content (https://developer.android.com/develop/ui/compose/components/bottom-sheets). Gestalt proximity and common region (https://ixdf.org/literature/topics/gestalt-principles) explain why a card works as a grouping device: one card is one idea.

**(b) Implications and (c) rules**
- **Top app bar.** Use the **small** bar on Today, with a greeting like "Good evening, Arjun" as `titleLarge`. Avoid large collapsing bars. The scroll-linked animation costs frames on low-end GPUs and takes vertical space from the 720p screen. **[Inference]**
- **Do not put a countdown in the app bar.** The brief mock-up shows "227 days to Prelims 2027", but the brief's own §4.1 warns against countdown banners. Offer it as an opt-in My Path widget instead, in neutral `onSurfaceVariant` text and never red. *Serves Vikram and Meera.*
- **Chai Cards** use **filled cards** (`surfaceContainerLow`) with no elevation. Shadows cost overdraw and look like ads on a cheap LCD. Use an outlined card for a pod post and an elevated card only for one hero item per screen at most. Card shape is `medium` (12 dp). Inner padding is 16 dp, and cards are 12 dp apart.
- **Chips:**
  - Filter chips for Chai Card topics (Polity, Economy, IR and so on), scrolling horizontally on one row.
  - Assist chips for "Listen", "हिंदी में पढ़ें" and "Save".
  - No chips with "NEW!" or "HOT", which is coaching-ad language.
  - Each chip's touch target is at least 48 dp, even though the visual height is 32 dp. M3 components enforce `minimumInteractiveComponentSize()` (https://developer.android.com/guide/topics/ui/accessibility/apps).
- **Bottom sheets** hold one Chai Card's "Why this matters for GS-2" detail, the reaction picker and the language switch.
  - Close the Day is **not** a bottom sheet. It is a full-screen ritual with its own calm space, and a sheet that a stray swipe can dismiss is wrong for a ritual (heuristic 3, *User control and freedom*, applies the other way round here).
  - Sheets always have a visible drag handle and a close action that TalkBack can reach.

### 1.3 Dynamic colour vs a fixed brand scheme

**(a) Principles.** Dynamic colour exists on Android 12 and above. The recommended pattern falls back to a custom scheme on older versions (https://developer.android.com/develop/ui/compose/designsystems/material3). Material's codelab describes a *custom scheme* as one "not derived from the user's device wallpaper, but instead from the app maker". It also suggests keeping brand colours in an extended scheme when you do use dynamic colour (https://codelabs.developers.google.com/customizing-material-color).

**(b) Recommendation: a fixed brand scheme, with dynamic colour off.** Reasons:
1. **Most of the audience would not get it anyway.** Many target phones run Android 10-11. They would fall back to the brand scheme, which would make the brand inconsistent across the user base. Pod members compare screenshots on WhatsApp. **[Inference]**
2. **Recognition and trust.** The warm "chai" identity is the clearest visual signal that this is not a coaching app. An OEM wallpaper could turn it neon. This matters to Vikram and Meera.
3. **Guaranteed contrast.** Every pair in the fixed scheme can be checked once (see 1.5). Wallpaper-derived schemes are generated to be accessible, but they cannot be checked against our custom semantic colours. **[Inference]**
4. **Cost.** No harmonisation code and no extra testing surface.

Revisit only if research shows users want personalisation. If so, expose it as an in-app "Theme" choice, not system-driven. **[Inference]**

### 1.4 Building the ColorScheme from one seed

**(a) Principles.** M3 gives each key colour a **tonal palette**, where *tone* equals CIE L\* lightness in the HCT colour space (https://chromium.googlesource.com/external/github.com/material-foundation/material-color-utilities/+/91da30d89e70c3dc9575ec71a1ebe8874d881f29/README.md). In the reference implementation (2021 spec), the role tones are:

| Role | Light tone | Dark tone |
|---|---|---|
| primary | 40 | 80 |
| onPrimary | 100 | 20 |
| primaryContainer | 90 | 30 |
| onPrimaryContainer | 30 | 90 |
| surface | 98 | 6 |
| onSurface | 10 | 90 |
| onSurfaceVariant | 30 | 80 |
| outline | 50 | 60 |
| outlineVariant | 80 | 30 |
| surfaceContainer Lowest / Low / default / High / Highest | 100 / 96 / 94 / 92 / 90 | 4 / 10 / 12 / 17 / 22 |

Source: https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/typescript/dynamiccolor/color_spec_2021.ts. **Contrast comes from tone distance, not hue.** That is why a seed colour almost never works directly as a button colour.

**[Measured]** White text on the chai seed `#B8732A` scores only **3.80:1**, which fails AA for normal text. The palette's tone-40 version, `#8D4F01`, scores **6.46:1**. White on the indigo seed `#3F4FB0` already passes at 7.10:1. Method: I wrote a Python script (`scratchpad/tools/palette.py`, `scheme.py`) that builds each palette by fixing CIE L\* to the tone and keeping the seed's LCh hue and chroma, reducing chroma until the colour fits in sRGB. Contrast uses the WCAG relative-luminance formula (https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Because HCT tone equals L\*, **luminance and therefore contrast are exact**. Hue can drift slightly from what Google's HCT solver would produce. Regenerate the final values in **Material Theme Builder** and re-run the script. Contrast will not change.

**Two seed options, both with warm "paper" neutrals.** I gave both schemes warm neutrals (hue about 67-70°, chroma 4) so that even the indigo option feels like chai on paper, not a cold tech dashboard. The neutral `surface` in light mode is `#FFF8F3`, a warm off-white that is easier on the eyes than pure white at night. **[Inference]**

| Palette | Chai amber option (seed `#B8732A`) | Indigo option (seed `#3F4FB0`) |
|---|---|---|
| Primary | hue 67, chroma ≥40 | hue 295, chroma ≥40 |
| Secondary | hue 67, chroma 16 (latte browns) | hue 295, chroma 16 |
| Tertiary | **peacock teal**, hue 200, chroma 24 | **marigold**, hue 70, chroma 40 |
| Neutral / neutral variant | hue 67, chroma 4 / 8 | hue 70, chroma 4 / 7 (warm) |

**Recommendation: chai amber as primary, peacock teal as tertiary.**
- It carries the product's own metaphor (Chai Cards, the tapri chai break from brief §3.3).
- It is unlike the blues, purples and greens of ed-tech apps and the red-and-yellow of coaching banners.
- Its tone-40 primary is a deep brown (`#8D4F01`), not saffron orange. That avoids reading as a "warning" colour or carrying political colour associations. **[Inference: test with users]**

The trade-off: amber is close to the conventional "caution" hue. Solve that by never using colour alone for status (see 4.4). If interviews show the warm palette reads as "old" or "dull", indigo with marigold tertiary is the fallback. It is fully specified below, and its contrast is identical by construction.

### 1.5 Concrete tokens and verified contrast [Measured]

**Chai amber: light**

| Role | Hex | Role | Hex |
|---|---|---|---|
| primary | `#8D4F01` | onPrimary | `#FFFFFF` |
| primaryContainer | `#FFDCC0` | onPrimaryContainer | `#6B3B00` |
| secondary | `#715A47` | onSecondary | `#FFFFFF` |
| secondaryContainer | `#FADDC7` | onSecondaryContainer | `#584330` |
| tertiary | `#14696B` | onTertiary | `#FFFFFF` |
| tertiaryContainer | `#A4EFF1` | onTertiaryContainer | `#024F51` |
| surface / background | `#FFF8F3` | onSurface | `#201B17` |
| surfaceVariant | `#EFE0D5` | onSurfaceVariant | `#50453B` |
| surfaceContainerLowest | `#FFFFFF` | surfaceContainerLow | `#FAF2EC` |
| surfaceContainer | `#F4ECE7` | surfaceContainerHigh | `#EEE7E1` |
| surfaceContainerHighest | `#E9E1DB` | outline / outlineVariant | `#82756B` / `#D2C4B9` |
| inverseSurface | `#352F2B` | inverseOnSurface / inversePrimary | `#F7EFEA` / `#FFB876` |

**Chai amber: dark**

| Role | Hex | Role | Hex |
|---|---|---|---|
| primary | `#FFB876` | onPrimary | `#4A2800` |
| primaryContainer | `#6B3B00` | onPrimaryContainer | `#FFDCC0` |
| secondary | `#DDC1AB` | onSecondary | `#402C1B` |
| secondaryContainer | `#584330` | onSecondaryContainer | `#FADDC7` |
| tertiary | `#89D3D5` | onTertiary | `#003738` |
| tertiaryContainer | `#024F51` | onTertiaryContainer | `#A4EFF1` |
| surface / background | `#18120D` | onSurface | `#E9E1DB` |
| surfaceVariant | `#50453B` | onSurfaceVariant | `#D2C4B9` |
| surfaceContainerLowest | `#140D06` | surfaceContainerLow | `#201B17` |
| surfaceContainer | `#241F1B` | surfaceContainerHigh | `#2E2925` |
| surfaceContainerHighest | `#39342F` | outline / outlineVariant | `#9C8E84` / `#50453B` |
| inverseSurface | `#E9E1DB` | inverseOnSurface / inversePrimary | `#352F2B` / `#8D4F01` |

**Indigo: light.** primary `#4755B7`, onPrimary `#FFFFFF`, primaryContainer `#E2DFFF`, onPrimaryContainer `#253E9C`, secondary `#5D5C76`, secondaryContainer `#E2DFFE`, onSecondaryContainer `#46445D`, tertiary `#82551F`, tertiaryContainer `#FFDCBD`, onTertiaryContainer `#663D06`, surface `#FFF8F3`, onSurface `#1F1B16`, onSurfaceVariant `#4E453D`, surfaceContainer Low / default / High / Highest `#FAF2EC` / `#F4EDE7` / `#EEE7E1` / `#E8E1DB`, outline `#80756C`, outlineVariant `#D0C4BA`, inversePrimary `#C4C0FF`.

**Indigo: dark.** primary `#C4C0FF`, onPrimary `#022979`, primaryContainer `#253E9C`, onPrimaryContainer `#E2DFFF`, secondary `#C6C3E1`, secondaryContainer `#46445D`, onSecondaryContainer `#E2DFFE`, tertiary `#F5BB81`, tertiaryContainer `#663D06`, onTertiaryContainer `#FFDCBD`, surface `#18120D`, onSurface `#E8E1DB`, onSurfaceVariant `#D0C4BA`, surfaceContainer Low / default / High / Highest `#1F1B16` / `#231F1A` / `#2E2925` / `#39342F`, outline `#9A8F85`, outlineVariant `#4E453D`, inversePrimary `#4755B7`.

**Contrast ratios** (WCAG AA: 4.5:1 for body text, 3:1 for large text and UI components):

| Pair | Chai light | Chai dark | Indigo light | Indigo dark |
|---|---|---|---|---|
| onSurface / surface (body text) | 16.23 | 14.37 | 16.28 | 14.34 |
| onSurfaceVariant / surface (secondary text) | 8.86 | 10.91 | 8.91 | 10.86 |
| onSurfaceVariant / surfaceContainerHigh | 7.60 | 8.45 | 7.65 | 8.42 |
| primary / surface (links, accent text) | 6.14 | 10.94 | 6.14 | 10.90 |
| primary / surfaceContainer (accent on card) | 5.54 | 9.61 | 5.57 | 9.62 |
| onPrimary / primary (filled button) | 6.46 | 7.76 | 6.46 | 7.73 |
| onPrimaryContainer / primaryContainer | 7.22 | 7.22 | 7.22 | 7.22 |
| onSecondaryContainer / secondaryContainer (nav indicator) | 7.18 | 7.18 | 7.22 | 7.22 |
| onTertiaryContainer / tertiaryContainer | 7.23 | 7.23 | 7.26 | 7.26 |
| outline / surface (borders, 3:1 needed) | 4.24 | 5.85 | 4.27 | 5.87 |
| inverseOnSurface / inverseSurface (snackbar) | 11.61 | 10.21 | 11.60 | 10.19 |

All text pairs pass **AA**, and every container pair is at or above **AAA (7:1)**. This matters for Arjun and Kavya reading on a cheap TN or IPS panel in sunlight, where real-world contrast is much lower than measured contrast. **[Inference]**

**Semantic colours (shared by both options; tone 40 light, tone 80 dark) [Measured]**

| Role | Light | Dark | Container (light / dark) | Light on `#FFF8F3` | Dark on `#18120D` |
|---|---|---|---|---|---|
| success / "done" | `#2B6B37` | `#94D69A` | `#AFF3B5` / `#0C5221` | 6.12 | 10.91 |
| info / "live now" | `#05677E` | `#78D3F0` | `#B4EBFF` / `#024E5F` | 6.15 | 10.94 |
| caution | `#825501` | `#F7BB6C` | `#FFDDB7` / `#633F00` | 6.15 | 10.86 |
| error (forms and network only) | `#B02B35` | `#FFB3AE` | `#FEDAD7` / `#920120` | 6.16 | 10.88 |

**Rule:** `error` is used **only** for system errors such as a failed upload or an invalid field. It is never used for a missed task, a broken streak, a low score or a timer. Missed and skipped states use neutral `outline` with a dash icon. *Serves Vikram and Meera, and fulfils the brief's "no red timers".*

**Dark theme for 23:30 use.** NN/g finds that light mode reads better for most people with normal vision, while some low-vision users do better in dark mode. It recommends offering dark mode, not defaulting to it, and following the OS setting (https://www.nngroup.com/articles/dark-mode/). Rules:
- Default to **Follow system**, with an in-app choice of Light / Dark / System.
- Offer an opt-in **"Night calm"** schedule (dark from 22:00 to 06:00) that also lowers the primary accent to the container tones. **[Inference]**
- The dark surface is warm tone 6 (`#18120D`), not pure black. That avoids smearing on cheap OLEDs, and the warm cast matches the brand. **[Inference]**

```kotlin
// Color.kt (Chai). Regenerate in Material Theme Builder before release; contrast is invariant.
val ChaiLight = lightColorScheme(
    primary = Color(0xFF8D4F01), onPrimary = Color.White,
    primaryContainer = Color(0xFFFFDCC0), onPrimaryContainer = Color(0xFF6B3B00),
    secondary = Color(0xFF715A47), onSecondary = Color.White,
    secondaryContainer = Color(0xFFFADDC7), onSecondaryContainer = Color(0xFF584330),
    tertiary = Color(0xFF14696B), onTertiary = Color.White,
    tertiaryContainer = Color(0xFFA4EFF1), onTertiaryContainer = Color(0xFF024F51),
    background = Color(0xFFFFF8F3), onBackground = Color(0xFF201B17),
    surface = Color(0xFFFFF8F3), onSurface = Color(0xFF201B17),
    surfaceVariant = Color(0xFFEFE0D5), onSurfaceVariant = Color(0xFF50453B),
    surfaceContainerLowest = Color.White, surfaceContainerLow = Color(0xFFFAF2EC),
    surfaceContainer = Color(0xFFF4ECE7), surfaceContainerHigh = Color(0xFFEEE7E1),
    surfaceContainerHighest = Color(0xFFE9E1DB),
    outline = Color(0xFF82756B), outlineVariant = Color(0xFFD2C4B9),
    inverseSurface = Color(0xFF352F2B), inverseOnSurface = Color(0xFFF7EFEA),
    inversePrimary = Color(0xFFFFB876),
    error = Color(0xFFB02B35), onError = Color.White,
    errorContainer = Color(0xFFFEDAD7), onErrorContainer = Color(0xFF920120),
)
val ChaiDark = darkColorScheme(
    primary = Color(0xFFFFB876), onPrimary = Color(0xFF4A2800),
    primaryContainer = Color(0xFF6B3B00), onPrimaryContainer = Color(0xFFFFDCC0),
    secondary = Color(0xFFDDC1AB), onSecondary = Color(0xFF402C1B),
    secondaryContainer = Color(0xFF584330), onSecondaryContainer = Color(0xFFFADDC7),
    tertiary = Color(0xFF89D3D5), onTertiary = Color(0xFF003738),
    tertiaryContainer = Color(0xFF024F51), onTertiaryContainer = Color(0xFFA4EFF1),
    background = Color(0xFF18120D), onBackground = Color(0xFFE9E1DB),
    surface = Color(0xFF18120D), onSurface = Color(0xFFE9E1DB),
    surfaceVariant = Color(0xFF50453B), onSurfaceVariant = Color(0xFFD2C4B9),
    surfaceContainerLowest = Color(0xFF140D06), surfaceContainerLow = Color(0xFF201B17),
    surfaceContainer = Color(0xFF241F1B), surfaceContainerHigh = Color(0xFF2E2925),
    surfaceContainerHighest = Color(0xFF39342F),
    outline = Color(0xFF9C8E84), outlineVariant = Color(0xFF50453B),
    inverseSurface = Color(0xFFE9E1DB), inverseOnSurface = Color(0xFF352F2B),
    inversePrimary = Color(0xFF8D4F01),
    error = Color(0xFFFFB3AE), onError = Color(0xFF680014),
    errorContainer = Color(0xFF920120), onErrorContainer = Color(0xFFFEDAD7),
)

@Immutable data class SemanticColors(val success: Color, val successContainer: Color,
                                     val info: Color, val caution: Color)
val LocalSemantic = staticCompositionLocalOf {
    SemanticColors(Color(0xFF2B6B37), Color(0xFFAFF3B5), Color(0xFF05677E), Color(0xFF825501))
}
```

---

## 2. Typography: Latin + Devanagari

### 2.1 Principles

- **One family covering both scripts is the simplest pairing.** If two families are needed, match stroke weight, contrast and terminals, and match the **Latin x-height to the Devanagari body (shirorekha) height**. **Devanagari needs more line spacing than Latin**, and automatic leading should be avoided. **Devanagari has no case**, so hierarchy has to come from weight. Underline and italic work poorly (https://www.alphabettes.org/devanagari-typography-101-a-guide-for-typesetting-with-latin/).
- W3C i18n notes that Devanagari, like Thai and Arabic, has taller characters and generally needs more inter-line space. Short English strings can expand 200-300% in translation (https://www.w3.org/International/articles/article-text-size).
- W3C ILReq prefers Indic line breaks **at word boundaries** and **never inside numbers** such as currency amounts or years (https://www.w3.org/TR/ilreq/).
- Fonts affect comprehension. An eye-tracking study of three Devanagari fonts (Ralekar, Saha and Gandhi, 2018) found that comprehension score, fixation count and fixation duration differed significantly by font. Total reading time did not (https://research.iitj.ac.in/publication/effect-of-devanagari-font-type-in-reading-comprehension). **Font choice for Hindi is a comprehension decision, not decoration.** This matters most for Arjun.
- Heavier Devanagari weights blur together unless the letterforms are adjusted, which is why Mukta's designers tuned their bold weights (https://design.google/library/new-wave-indian-type-design).

### 2.2 Candidate evaluation [Measured where noted]

Method: I downloaded the static TTFs from the Google Fonts API, parsed `hhea` and `OS/2` with a struct-based script (`scratchpad/metrics.py`), probed available weights with `css2?family=X:wght@N`, and measured the size of the Devanagari and Latin woff2 subsets.

| Family | Style | Scripts | Weights available | TTF / weight | hhea line box | Notes |
|---|---|---|---|---|---|---|
| **Martel** | Serif | Devanagari + Latin (Latin based on Merriweather) | 200, 300, 400, 600, 700, 800, 900 | **162 KB** | 1.69 em | Designed "for typesetting immersive-style documents", meaning long Hindi reading (https://fontsource.org/fonts/martel/about). Latin x-height **0.546**, large and good at small sizes on 720p. Matched serif for both scripts. |
| **Tiro Devanagari Hindi** | Serif (traditional) | Devanagari + Latin (the Castoro design) | **400 only** (+ italic) | 368 KB | 1.33 em (win 1.59) | Lovely and scholarly, made for sustained reading (https://design.google/library/the-modern-tiro-indic-collection-font). With one weight there is no bold for hierarchy, and the file is large. Possible for a quote style only. |
| **Noto Serif Devanagari** | Serif | Devanagari + basic Latin | 100-900 (variable) | 226 KB | 1.55 em (win 2.20) | Neutral and very complete. The Latin is basic. Variable fonts cannot be downloadable fonts (https://developer.android.com/develop/ui/compose/text/fonts). |
| **Mukta** | Humanist sans | Devanagari + Latin (+ Gujarati, Gurmukhi, Tamil) | 200-800 | **409 KB** | 1.66 em | Shared visual grammar across scripts. **Used by most major Indian newspapers online**, including Dainik Jagran (https://design.google/library/new-wave-indian-type-design). Excellent but heavy. |
| **Hind** | Sans | Devanagari + Latin | 300-700 | 284 KB | 1.60 em | Widely used and plain. |
| **Noto Sans Devanagari** | Sans | Devanagari + basic Latin | 100-900 | 214 KB | 1.30 em (win 1.91) | **Already on the device** as Android's system Devanagari fallback. **[Inference: standard AOSP font stack]** |
| Literata / Source Serif 4 | Serif | Latin only (no Devanagari) | 200-900 | n/a | 1.49 / 1.37 em | Excellent Latin text faces, but each would need a separate Devanagari partner. Rejected. |
| Yatra One / Rozha One / Kalam / Amita | Display or handwriting | Devanagari + Latin | 400 | n/a | n/a | Kalam could suit Chotu's speech bubbles. The rest are poster faces that would look like coaching ads. Avoid. |

### 2.3 Recommendation

- **Serif (reading voice): Martel**, 400 and 700 only, **bundled**. Use it for Chai Card body, card titles, headlines and the Close the Day prompt. It covers both scripts, so English and Hindi in the same card match. It was designed for long Hindi reading, and two weights cost about 0.3 MB uncompressed. *Serves Arjun (reading comfort), Meera (a calm editorial feel) and Kavya (data).*
- **Sans (UI voice): the system font** (`FontFamily.SansSerif`, which is Roboto plus the system Noto Sans Devanagari). Use it for labels, buttons, chips, navigation and metadata. It costs **0 KB** and renders fastest. OEM skins can swap the system font. That is acceptable for UI text. **[Inference]**
- If the team wants a branded sans later, use **Mukta** in 400 and 600 only. Budget about 820 KB, or subset it.
- **Bundle, don't download.** Downloadable fonts need Google Play services, fetch over the network at first use, fall back silently and cannot be variable (https://developer.android.com/develop/ui/compose/text/fonts). On patchy 3G, the first Today screen would render in one font and then reflow into another. That is a visible glitch on exactly the screen that must feel calm. **[Inference]**
- **Subsetting.** Ship the TTFs with Devanagari, basic Latin, Latin-1 punctuation, ₹ and the Indic danda (। ॥) kept. Use `pyftsubset` at build time on a CI machine, not in the app. Expect roughly a 30% saving. Do not strip the GSUB and GPOS conjunct tables. **[Inference: verify the size after subsetting]**

### 2.4 Line height and clipping for Devanagari

**(a) Principles**
- Since Compose BOM 2024.01.01, `includeFontPadding` defaults to **false**. `LineHeightStyle.Trim` works only when it is false (https://developer.android.com/develop/ui/compose/text/style-paragraph).
- `includeFontPadding` existed to stop tall scripts clipping. Android 9 fixed most of that for multi-line layouts (`useLineSpacingFromFallbacks`), but single-line `BoringLayout` could still clip. Compose computes padding from the fonts actually used (https://medium.com/androiddevelopers/fixing-font-padding-in-compose-text-768cd232425b).
- Android 14 scales fonts up to **200%** along a **non-linear** curve. Line height should be in sp. **Test at 200%** (https://developer.android.com/about/versions/14/features).

**(c) Build rules**
- Devanagari body line height should be **at least 1.6 × font size**. Latin body line height should be **at least 1.45 ×**. The Hindi typography scale below gets its own line heights.
- On any `Text` that can show Devanagari, use **`Trim.None`**. Trimming the first line's top can shave off the upper matras (ि ी ें ँ ॅ) on the first line. **[Inference: confirm with the test strings below]**
- Never put Devanagari text inside a fixed-height container. Use `heightIn(min = …)`. Do not apply `Modifier.clipToBounds()` to text rows.
- **Clipping test strings**, to run on API 29, 31 and 34 at font scale 1.0, 1.3 and 2.0: `हिंदी`, `क्षत्रिय`, `राष्ट्रपति`, `कृषि`, `द्वितीय`, `संविधान में ऐं ँ ॅ`, `श्रीमान् ॐ`, `ड़ी ढ़ ड्ढ`, `पूर्वोत्तर`, `अनुच्छेद 370`, and a mixed line: `GS-2: संघवाद (Federalism)`.
- On Devanagari content, set `localeList = LocaleList("hi-IN")` in the TextStyle so shaping and fallback pick Hindi forms rather than Marathi or Nepali glyph variants. Tiro ships separate Hindi, Marathi and Sanskrit families because these forms differ (https://design.google/library/the-modern-tiro-indic-collection-font).
- Bold Devanagari should be 700, not 800 or 900, to keep conjuncts legible on 720p. Use weight and size for hierarchy, not italic or underline.

### 2.5 Full type scale (sp)

M3's default scale runs from displayLarge 57/64 down to labelSmall 11/16 (https://developer.android.com/develop/ui/compose/designsystems/material3). The scale below is adjusted for 720p screens, long reading and Devanagari. Body text is slightly larger than M3's defaults, nothing on a user-facing surface goes below 12 sp, and the Hindi scale adds about 8-12% line height. **[Inference grounded in the sources in 2.1]**

| Token | Family / weight | English size / line | Hindi size / line | Used for |
|---|---|---|---|---|
| displaySmall | Martel 700 | 32 / 44 | 32 / 48 | Close the Day header only |
| headlineMedium | Martel 700 | 26 / 36 | 26 / 40 | Screen hero, e.g. "आज का दिन" |
| headlineSmall | Martel 700 | 22 / 30 | 22 / 34 | Section heads (marked as headings) |
| titleLarge | Martel 700 | 20 / 28 | 20 / 32 | Chai Card title, greeting |
| titleMedium | Sans 500 | 16 / 24 | 16 / 26 | List titles, sheet titles |
| titleSmall | Sans 500 | 14 / 20 | 14 / 22 | Card meta heads |
| bodyLarge | Martel 400 | **17 / 27** | **17 / 29** | Chai Card reading body |
| bodyMedium | Sans 400 | 15 / 22 | 15 / 24 | General UI body, pod posts |
| bodySmall | Sans 400 | 13 / 18 | 13 / 20 | Secondary meta (source, time) |
| labelLarge | Sans 500 | 15 / 20 | 15 / 22 | Buttons |
| labelMedium | Sans 500 | 12 / 16 | 12 / 18 | Navigation labels, chips |
| labelSmall | Sans 500 | 12 / 16 | 12 / 18 | Floor size, replaces M3's 11 |

Letter spacing is **0** for all Devanagari styles (Martel already has tuned spacing). Latin labels keep M3's default tracking.

```kotlin
// Type.kt
private val Martel = FontFamily(
    Font(R.font.martel_regular, FontWeight.Normal),
    Font(R.font.martel_bold, FontWeight.Bold),
)
private val Sans = FontFamily.SansSerif
private val Lh = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None)

private fun style(f: FontFamily, w: FontWeight, size: Int, lh: Int, hi: Boolean) = TextStyle(
    fontFamily = f, fontWeight = w, fontSize = size.sp, lineHeight = lh.sp,
    letterSpacing = 0.sp, lineHeightStyle = Lh,
    localeList = if (hi) LocaleList("hi-IN") else null,
)

fun appTypography(hindi: Boolean) = with(hindi) {
    Typography(
        displaySmall   = style(Martel, FontWeight.Bold, 32, if (this) 48 else 44, this),
        headlineMedium = style(Martel, FontWeight.Bold, 26, if (this) 40 else 36, this),
        headlineSmall  = style(Martel, FontWeight.Bold, 22, if (this) 34 else 30, this),
        titleLarge     = style(Martel, FontWeight.Bold, 20, if (this) 32 else 28, this),
        titleMedium    = style(Sans, FontWeight.Medium, 16, if (this) 26 else 24, this),
        titleSmall     = style(Sans, FontWeight.Medium, 14, if (this) 22 else 20, this),
        bodyLarge      = style(Martel, FontWeight.Normal, 17, if (this) 29 else 27, this),
        bodyMedium     = style(Sans, FontWeight.Normal, 15, if (this) 24 else 22, this),
        bodySmall      = style(Sans, FontWeight.Normal, 13, if (this) 20 else 18, this),
        labelLarge     = style(Sans, FontWeight.Medium, 15, if (this) 22 else 20, this),
        labelMedium    = style(Sans, FontWeight.Medium, 12, if (this) 18 else 16, this),
        labelSmall     = style(Sans, FontWeight.Medium, 12, if (this) 18 else 16, this),
    )
}
```

**Content-language override.** The UI might be in English while a Chai Card is in Hindi, which is common for Meera's pod friends and for Arjun's English-UI phone. In that case, wrap the card in `ProvideTextStyle` with the Hindi line heights. Choose the scale from the **content's** language, not just the UI locale.

**Font scale.** Every size is in sp. Never use sp for padding: under non-linear scaling, 4 sp + 20 sp may not equal 24 sp (https://developer.android.com/about/versions/14/features). Add `@Preview(fontScale = 2f)` and `@Preview(locale = "hi")` for every screen.

---

## 3. Bilingual UX

### 3.1 Principles and evidence

- **Separate the UI language from the content language.** ShareChat found that users who had set English were actually sharing and chatting in Hindi, Marathi and other languages. Engagement rose after it stopped treating English as the primary content language (https://archive.factordaily.com/indian-language-social-network-gets-bharat-way-facebook-cannot/).
- **Choose at install, switch in two taps.** Inshorts shipped Hindi inside the same app. Users set Hindi or English at install, and "switching back to English is pretty straightforward taking only two taps from any screen" (https://www.medianama.com/2015/11/223-inshorts-hindi-launch/).
- **Language choice covers help too.** PhonePe lets users pick from 8 Indian languages for the app, the help section and chat support, and adds imagery to explain concepts to first-time users from smaller cities (https://www.phonepe.com/blog/design/building-a-seamless-payment-experience-for-millions-of-indians/).
- **Hinglish counts as a language.** Google Pay added Hinglish as a preferred language next to its 8 Indian languages, framing it as making interactions feel like "everyday conversations" (https://www.businesstoday.in/amp/technology/news/story/google-pay-to-be-available-in-hinglish-soon-you-can-also-split-bills-on-it-312636-2021-11-18).
- **Exam-prep apps.** Adda247 launched a Hindi version of its app (https://www.bankersadda.com/adda247-app-launched-in-hindi/). Test-series platforms such as PW list tests as bilingual (https://www.pw.live/ssc/test-series/67610687a832f5320e1393e9-online). I could not verify Testbook, Unacademy, Dailyhunt or Josh UI patterns from primary sources. Treat any claim about them as **[Inference]** and audit the apps on a real device.
- **Per-app language.** Android 13+ supports per-app language through `LocaleManager`. AndroidX AppCompat 1.6+ (`AppCompatDelegate.setApplicationLocales`) back-ports it, with `autoStoreLocales` for Android 12 and below. **With Compose, the Activity must extend `AppCompatActivity` or the locale will not apply.** `generateLocaleConfig = true` (AGP 8.1+) lists the languages in system settings (https://developer.android.com/guide/topics/resources/app-languages).
- **Typing is a barrier.** 45% of Indian-language users struggle with text input in chat apps, and 70% with English keyboards (KPMG PDF above). Gboard supports 22 Indian languages, with **QWERTY transliteration** for Hindi and a Hinglish mode (https://www.fonearena.com/blog/218344/gboard-now-supports-22-indian-languages-gets-transliteration-in-hindi-tamil-telugu-and-more.html).
- **Numbers.** Indian grouping puts three digits first, then groups of two: 12,34,56,789. One lakh is 1,00,000 and one crore is 1,00,00,000 (https://en.wikipedia.org/wiki/Indian_numbering_system). The Constitution prescribes "the international form of Indian numerals" (0-9) for official Union use, even in Hindi (Art. 343(1), https://www.constitutionofindia.net/articles/article-343-official-language-of-the-union).

### 3.2 Implications

- Arjun may keep the UI in English (because his phone is in English) but want every Chai Card and Mains question in Hindi.
- Meera wants English but will read Hindi posts from her pod.
- Hindi-medium aspirants use a Hindi technical vocabulary (सामान्य अध्ययन, अनुच्छेद, संघवाद) and also the English exam words everyone uses (Prelims, Mains, PYQ, CSAT). The copy has to respect both. **[Inference: validate with Hindi-medium aspirants]**

### 3.3 Build rules

1. **Two settings, asked once at onboarding** in the brief's 3-tap flow:
   - **App language**: English or हिंदी. Use `AppCompatDelegate.setApplicationLocales` and `generateLocaleConfig`.
   - **Reading language**: English, हिंदी or "Both, side by side".

   Show the language names as **endonyms in their own script** ("English", "हिंदी"), never as flags. Both settings stay editable in My Path → Settings. Chai Cards always show a one-tap **"हिंदी में पढ़ें / Read in English"** assist chip, so switching takes one tap from anywhere content appears (the Inshorts lesson). *Serves Arjun and Meera.*
2. **"Both" means stacked, not interleaved.** Show the English paragraph, then the Hindi paragraph, each with its own locale-tagged style. Mixed lines are harder to scan. **[Inference]** The UPSC question paper itself is printed in both Hindi and English, so aspirants already know this pattern. **[Inference: verify in the CSE notification]**
3. **Copy register.** Use spoken, everyday Hindi (*bolchaal*), not Sanskritised official Hindi. Keep exam nouns transliterated: मेन्स, प्रीलिम्स, PYQ, पॉड. Have a Hindi-medium aspirant review every string. Do **not** ship machine-translated UI. Hinglish in Roman script is allowed **only in Chotu's voice and pod chat**, never in system UI, because consistency is heuristic 4. *Serves Arjun.*
4. **Design for expansion.** No fixed-width buttons. Labels wrap to two lines, except bottom-navigation labels, which must be chosen to fit. Leave about 40% extra width for any string under 20 English characters (W3C/IBM table above). Translation can also *shrink* text (आज is shorter than "Today"), so never centre layouts on an assumed width.
5. **Numbers and dates.**
   - Use `android.icu.text.NumberFormat.getInstance(ULocale("en_IN"))` or `hi_IN` for 12,34,567 grouping. Always use Latin digits by default, per Art. 343.
   - Compact forms ("5.49 लाख", "₹3.6 lakh") need a **small in-house formatter with unit tests**. CLDR's compact lakh and crore support for en-IN is uncertain across Android ICU versions. **[Inference: verify on API 29-35]**
   - Dates: "10 अक्टूबर 2026" or "10 Oct 2026" via `DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale)`. Never write ambiguous numeric dates such as 10/11.
   - Times are 12-hour with "रात"/"सुबह" in Hindi ("रात 10:30"), since that is how people say them. **[Inference]**
   - Never line-break inside a number (ILReq). Use ` ` between a number and its unit: `₹ 499`, `20 मिनट`.
6. **Input.**
   - Do not build an IME. Rely on Gboard transliteration and voice typing.
   - Set `KeyboardOptions(hintLocales = LocaleList("hi-IN"))` on Hindi answer fields so the keyboard opens in Hindi. **[Inference: available in recent Compose foundation; maps to `EditorInfo.hintLocales`]**
   - Show a one-time tip: "Type in Hindi using English letters: *namaste* → नमस्ते (Gboard)". *Serves Arjun and Kavya.*
7. **Search and matching** must work across scripts. A search for "samvidhan" should find संविधान. Store a transliterated search key on the server. **[Inference]**

---

## 4. Accessibility

### 4.1 Principles

- **POUR** (Perceivable, Operable, Understandable, Robust) is the WCAG frame. Key criteria here:
  - 1.4.3 contrast: 4.5:1 for text, 3:1 for large text (https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
  - 1.4.1 use of colour (https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
  - 2.5.8 target size: 24×24 CSS px minimum (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
  - 2.3.3 animation from interactions (AAA): motion can be turned off (https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- Android's stricter rule is **48×48 dp** touch targets. Android's contrast guidance is 4.5:1 below 18 sp (or below 14 sp bold) and 3:1 otherwise (https://developer.android.com/guide/topics/ui/accessibility/apps).
- Compose semantics:
  - `mergeDescendants` groups children into one focusable element.
  - `clearAndSetSemantics` replaces child semantics.
  - `heading()` enables jump-by-heading.
  - `customActions` exposes swipe and nested actions.
  - `stateDescription` customises state wording.
  - Decorative icons beside labels get `contentDescription = null`.

  Source: https://developer.android.com/develop/ui/compose/accessibility/semantics.
- TalkBack supports **Hindi (India)** and **English (India)** through Google Text-to-Speech. "Some devices may not support all languages in all regions" (https://support.google.com/accessibility/android/answer/11101402?hl=en). Recent TalkBack is reported to switch languages on the fly for mixed Hindi-English text (https://phrase.com/blog/posts/android-accessibility/). Treat that as a claim to verify on target devices.

### 4.2 Implications

Accessibility here is not only about blind users. It also covers:
- Vikram reading at 1 a.m. with tired eyes.
- Arjun reading on a scratched screen in a bright library.
- Sana using the app one-handed on a bus.
- Aspirants with low vision who already use large text. Disability is listed as a research gap in the brief (§12).

Font scaling and contrast benefit everyone in this audience. **[Inference]**

### 4.3 Build rules

- **Touch targets:** at least 48×48 dp everywhere, and **56 dp** for the primary actions on Today: "Start task", "Close the day" and "Join room". Fitts's law favours bigger, closer targets for one-handed use. Keep primary actions in the **bottom half** of the screen. Put destructive actions such as "Leave pod" behind a confirmation, away from the thumb's resting arc. *Serves Rahul and Sana.*
- **Chai Card semantics:** one merged node with a heading, plus custom actions. Swipe-only gestures must have accessible equivalents.

```kotlin
@Composable
fun ChaiCard(card: ChaiCardUi, onOpen: () -> Unit, onSave: () -> Unit, onListen: () -> Unit) {
    val saveLabel = stringResource(R.string.a11y_save_card)
    val listenLabel = stringResource(R.string.a11y_listen_card)
    Card(
        onClick = onOpen,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLow),
        modifier = Modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) {
                customActions = listOf(
                    CustomAccessibilityAction(saveLabel) { onSave(); true },
                    CustomAccessibilityAction(listenLabel) { onListen(); true },
                )
            }
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(card.topic, style = MaterialTheme.typography.labelMedium)   // "Polity · GS-2"
            Text(card.title, style = MaterialTheme.typography.titleLarge,
                 modifier = Modifier.semantics { heading() })
            Text(card.summary, style = MaterialTheme.typography.bodyLarge, maxLines = 4)
            Text(card.readTime, style = MaterialTheme.typography.bodySmall)    // "2 min read"
        }
    }
}
```
- **Section headings** ("Today's 3", "Your pod", "Live now", "Chai Cards") get `heading()`, so TalkBack users can jump between sections, which is heuristic 7, *Flexibility and efficiency*.
- **Today task rows:** use `toggleable` with `Role.Checkbox` and a custom `stateDescription` such as "done" / "not started yet". Never say "incomplete" or "missed". Even screen-reader wording should avoid shame. *Serves Vikram.*
- **Chotu:** `contentDescription = "Chotu, AI helper"` in English and "छोटू, AI सहायक" in Hindi. Every Chotu message also carries a visible "AI" label chip, so it is never mistaken for a human pod member. That honesty matters to users burned by fake testimonials (brief §4.3). No idle-loop animation.
- **Colour-blind-safe status:** every status pairs a **shape, an icon and a word** with its colour:
  - Done: filled check, success tone, "Done"
  - Pending: outlined circle, outline tone, "To do"
  - Skipped: dash, neutral tone, "Skipped, that's okay"
  - Live: dot plus "LIVE", info tone

  No red/green pairs carry meaning on their own (WCAG 1.4.1).
- **Font scale:** layouts must work at **200%**. Today's three task rows reflow so the time estimate goes to a second line. Bottom-navigation labels stay on one line. Test them at 200% in Hindi.
- **Mixed-language speech:**
  - Tag Hindi spans in an `AnnotatedString` with `SpanStyle(localeList = LocaleList("hi-IN"))`. This helps font selection and may help TTS language switching. **[Inference: verify with TalkBack + Google TTS on two OEMs]**
  - Write content descriptions in the UI language.
  - Make sure "12,34,567" is read as lakh by checking Hindi TTS output. **[Inference: test]**
- **"Listen" on Chai Cards:** use the platform `TextToSpeech` with the Hindi or English locale. Do not stream server audio, to save data. If `isLanguageAvailable(Locale("hi","IN"))` fails, hide the chip rather than speak English-accented Hindi. *Serves Kavya and Rahul (listening while commuting).*
- **Testing:** use Accessibility Scanner (recommended at https://developer.android.com/guide/topics/ui/accessibility/apps), Compose UI tests asserting `hasClickAction()` sizes, and manual TalkBack runs in both languages.

---

## 5. Low-end performance

### 5.1 Principles and thresholds

**Android vitals thresholds**
- **Startup** is "excessive" at **cold ≥5 s, warm ≥2 s, hot ≥1.5 s**, measured as time to initial display (https://developer.android.com/google/play/vitals/launch-time).
- **Core bad-behaviour thresholds:**
  - user-perceived crash rate **1.09%** overall, or 8% on any single phone model
  - ANR rate **0.47%** overall, or 8% per phone model
  - excessive battery usage **1%**
  - excessive partial wake locks **5%**

  Source: https://developer.android.com/google/play/vitals.

**Baseline Profiles** speed up code execution by **about 30% from the first launch**. A Startup Profile adds **about 15%** more for startup (https://developer.android.com/topic/performance/baselineprofiles/overview). Generate them with the Baseline Profile Gradle plugin and `BaselineProfileRule.collect`, setting `includeInStartupProfile = true` for startup journeys (https://developer.android.com/topic/performance/baselineprofiles/create-baselineprofile).

**Compose performance practices** (https://developer.android.com/develop/ui/compose/performance/bestpractices):
- `remember` expensive work
- give lazy lists stable **keys**
- use `derivedStateOf`
- defer state reads with lambda modifiers
- never write state backwards

**Strong skipping** is on by default from Kotlin 2.0.20 (https://developer.android.com/develop/ui/compose/performance/stability/strongskipping).

**App size**
- In emerging markets, about **+2.5% install conversion per 10 MB saved**. Globally, about **−1% per +6 MB** (https://medium.com/googleplaydev/shrinking-apks-growing-installs-5d3fcba23ce2).
- Size levers (https://developer.android.com/topic/performance/reduce-apk-size, https://developer.android.com/guide/topics/androidgo/optimize-size):
  - ship an App Bundle
  - turn on R8 and resource shrinking
  - limit packaged languages with `resConfigs`/`resourceConfigurations`, so libraries do not bring dozens of translations
  - use WebP
  - drop large GIFs and complex animations

**Images**
- WebP lossy is **25-34% smaller** than JPEG at equal quality. Lossless WebP is 26% smaller than PNG. **AVIF is supported from Android 12** (https://developer.android.com/develop/ui/views/graphics/reduce-image-sizes).
- Coil's `AsyncImage` sizes requests to the composable's constraints. `SubcomposeAsyncImage` is slower and should be **avoided in lazy lists** (https://coil-kt.github.io/coil/compose/).

**Loading feedback** (NN/g)
- 0.1 s feels instant, 1 s keeps the flow of thought, 10 s is the limit of attention (https://www.nngroup.com/articles/response-times-3-important-limits/).
- Show no indicator under 1 s. Use a **skeleton for full-page loads**, a spinner for a single module, and a progress bar beyond 10 s.
- Animated skeletons can distract and cause accessibility problems (https://www.nngroup.com/articles/skeleton-screens/).

**Background work**
- WorkManager constraints include `UNMETERED`, `requiresCharging`, `BatteryNotLow`, `DeviceIdle` and `StorageNotLow`. Periodic work has a 15-minute minimum interval and a flex window (https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work).
- **Doze** stops JobScheduler and WorkManager jobs until a maintenance window opens. FCM high-priority messages should only be used for user-visible notifications (https://developer.android.com/training/monitoring-device-state/doze-standby).
- Several OEMs common in India are among the most aggressive at killing background apps: Xiaomi, OnePlus, Samsung, Oppo, Vivo and realme (https://dontkillmyapp.com/).
- **Data Saver:** check `isActiveNetworkMetered` and `restrictBackgroundStatus`, and reduce data even when Data Saver is off but the network is metered (https://developer.android.com/develop/connectivity/network-ops/data-saver).

**Notifications and alarms**
- On Android 13+, `POST_NOTIFICATIONS` is a runtime permission. Notifications are **off by default for new installs**. Don't prompt on first launch; ask in context, after a user action. Users can see how many notifications an app sends per day (https://developer.android.com/develop/ui/views/notifications/notification-permission).
- From Android 14, `SCHEDULE_EXACT_ALARM` is **denied by default** for new installs. For reminders, use inexact alarms: `set()`, `setWindow()` (minimum window 10 minutes) or `setAndAllowWhileIdle()` (https://developer.android.com/about/versions/14/changes/schedule-exact-alarms).

### 5.2 Implications for this audience

- **"Overnight on Wi-Fi and charging" will fail for many users.** For Arjun in a PG and Kavya at home with mobile data only, an `UNMETERED` constraint may never be met, because over half have no Wi-Fi (Play data above). The prefetch must **degrade gracefully** to a tiny text-only pack on mobile data. **[Inference]**
- On aggressive OEMs, background prefetch may be killed or deferred. **Today must never depend on prefetch.** It opens from the Room cache and refreshes in the foreground. **[Inference]**
- Many prepaid users have daily data quotas that reset at midnight, so a small fetch after midnight costs "tomorrow's" quota. This is plausible but unverified. **[Inference: validate in interviews]**

### 5.3 Build rules

**Startup and rendering**
- **Startup:**
  - Single Activity (`AppCompatActivity`, needed for per-app locale).
  - Draw the first frame from Room with no network wait.
  - No splash beyond the system `SplashScreen` API.
  - Lazy-initialise analytics and crash SDKs after the first frame, via App Startup or a deferred coroutine.
  - Call `reportFullyDrawn()` once the Chai Cards from cache are visible.
- **Baseline and Startup Profiles** cover: cold start → Today → scroll Chai Cards → open card → Close the Day.
- **Compose stability:**
  - UI models are `@Immutable` data classes holding `ImmutableList` (kotlinx.collections.immutable).
  - `LazyColumn(items, key = { it.id }, contentType = { it.kind })`.
  - No `SubcomposeAsyncImage` and no `BoxWithConstraints` inside list items.
  - Scroll-driven UI uses `derivedStateOf`.
- **No custom blur, no shadows on list items, no parallax.** These cost GPU on Mali/PowerVR entry-level chips. **[Inference]**

**Images (Coil)**
- Chai Cards are **text-first**. A thumbnail is optional, 16:9, **WebP ≤25 KB** (AVIF on API 31+ if the CDN can negotiate it). Request it at display size through the CDN (`?w=` parameter).
- Use a static placeholder in `surfaceContainerHigh` with no shimmer animation. Allow `crossfade(150)` only when animations are enabled.
- Memory cache at **15% of app memory on `isLowRamDevice`** and 20% otherwise; disk cache **50 MB**. **[Inference: tune with Macrobenchmark and memory profiler]**
- **Data saver mode** (in-app toggle, auto-on when the system says Data Saver is enabled): no images on mobile data, no autoplay, Rooms audio at low bitrate, and a visible "Data saver on" chip in the app bar so users understand why images are missing (heuristic 1). *Serves Arjun, Kavya and Vikram.*

**Offline-first Chai Cards (Room + WorkManager)**
- **Tier 1 (preferred):** periodic work every 24 h with a flex window over roughly 01:00-05:00, constraints `UNMETERED + charging + batteryNotLow + storageNotLow`. It downloads the day's text pack plus thumbnails, capped at about 150 KB.
- **Tier 2 (fallback):** if Tier 1 has not run by 06:30, a one-off job on `CONNECTED + batteryNotLow` fetches the **text-only pack, ≤40 KB gzipped**. Thumbnails stay lazy.
- **Tier 3 (foreground):** when the app opens, show cached cards immediately and refresh in the background with a quiet "Updated 6:10 am" label, never a spinner over content.
- **Retention:** keep the last 7 days of cards and saved cards forever. Prune Room weekly.

```kotlin
val prefetch = PeriodicWorkRequestBuilder<ChaiPrefetchWorker>(24, TimeUnit.HOURS, 4, TimeUnit.HOURS)
    .setConstraints(Constraints.Builder()
        .setRequiredNetworkType(NetworkType.UNMETERED)
        .setRequiresCharging(true).setRequiresBatteryNotLow(true).setRequiresStorageNotLow(true)
        .build())
    .setInitialDelay(delayUntil(hour = 1), TimeUnit.MILLISECONDS)
    .build()
WorkManager.getInstance(ctx).enqueueUniquePeriodicWork("chai_prefetch", ExistingPeriodicWorkPolicy.KEEP, prefetch)

val textOnlyFallback = OneTimeWorkRequestBuilder<ChaiTextPackWorker>()
    .setConstraints(Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED).setRequiresBatteryNotLow(true).build())
    .build()   // enqueue at 06:30 if today's pack is missing (inexact alarm or app open)
```

**Loading states**
- Show **skeletons** (static, in `surfaceContainerHigh`, no shimmer) only on the very first launch, when there is no cache.
- After that, always show cached content plus a small "Refreshing…" text.
- Single modules such as the pod's live strip use a small inline indicator.
- Answer upload uses a determinate **progress bar** with "Will send when you're online" if offline. Never lose a draft: save every 5 seconds to Room. *Serves Rahul (interrupted sessions).*

**Notifications (Android 13+)**
- **Timing:** do not ask at first launch. Ask **after the user completes their first Close the Day**, the moment the benefit is clear, with an in-app explainer card first:
  > "Want a gentle reminder at 10:30 pm to close your day? One notification, no streak alarms. You can change the time or turn it off anytime."
  >
  > [Yes, remind me] [Not now]

  Only "Yes" triggers the system dialog. Respect `shouldShowRequestPermissionRationale`.
- **Channels:** *Close the Day reminder* (default importance), *Pod messages* (default), *Rooms going live* (low), *Account and safety* (high).
- **Volume cap:** at most **2 non-pod notifications a day**. Quiet hours run 23:30-07:00 by default, except the user's own reminder.
- **Never send** "You'll lose your streak!" or countdown pushes. The brief's anti-fear rule extends to the notification shade.
- **Scheduling:** schedule the reminder with `setWindow()` (a 10-15 minute window is fine) or WorkManager. Don't request the exact-alarm permission.
- **Server pushes:** FCM normal priority for digests, high priority only for a pod member's direct message.

*Serves Vikram (no guilt pushes), Rahul (a predictable single nudge) and Sana (quiet hours).*

**Battery:** no foreground service except during an active Rooms voice call. No location. No polling, only FCM. Target **0** stuck wake locks.

---

## 6. Motion and haptics

**(a) Principles**
- M3 easing tokens:
  - standard: `cubic-bezier(0.2, 0, 0, 1)`
  - emphasized decelerate: `(0.05, 0.7, 0.1, 1)`
  - emphasized accelerate: `(0.3, 0, 0.8, 0.15)`
- M3 duration tokens run from short1 to 4 (50-200 ms), medium1 to 4 (250-400 ms), long (450-600 ms) and extra-long (700-1000 ms). Duration should grow with the distance or area animated (https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md).
- Compose Material 3 offers `MotionScheme.standard()` and `MotionScheme.expressive()` (https://kotlinlang.org/api/compose-multiplatform/material3/androidx.compose.material3/-motion-scheme/-companion/).
- The system "Remove animations" setting appears as `Settings.Global.ANIMATOR_DURATION_SCALE == 0`. Apps can read it and turn off decorative motion (https://dev.to/eevajonnapanula/making-basicmarquee-modifier-more-accessible-1f5i). Compose animations follow the duration scale, and reports show a scale of 0 can make scroll animations jump (https://slack-chats.kotlinlang.org/t/505584/in-latest-compose-the-animation-duration-scale-now-affects-t?t=v2).
- Haptics: "less is more". Prefer clear haptics, and "given the choice of buzzy haptics or no haptics… choose no haptics". Be consistent, and use `HapticFeedbackConstants` rather than one-shot vibrations (https://developer.android.com/develop/ui/views/haptics/haptics-principles).

**(b) Implications.** Calm motion is part of the brand's honesty. It says "nothing here is trying to grab you." Expressive springs and bouncy confetti belong to gamified, coaching-style apps. **[Inference]**

**(c) Build rules**
- Use `MotionScheme.standard()`. Do not use expressive.
- Durations:
  - 150-200 ms for state changes such as a checkbox or chip
  - 250-300 ms for screen and sheet transitions
  - ≤400 ms for anything else

  No looping animation on any steady-state screen.
- **Close the Day completion:** one gentle 400 ms fade and scale of a teacup or diya glyph, plus a calm line ("Day closed. Rest well, Arjun."). No confetti, no streak number spinning up, and the streak is private by default (brief).
- **Reduced motion:** when the duration scale is 0, or the in-app "Calm motion" switch is on, replace movement with an instant cross-fade or nothing. Turn `crossfade` off in Coil. Never use the "scroll to top" animation; use a jump instead.

```kotlin
@Composable
fun rememberReduceMotion(): Boolean {
    val ctx = LocalContext.current
    return remember {
        runCatching {
            Settings.Global.getFloat(ctx.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
        }.getOrDefault(false)
    }
}
val LocalReduceMotion = staticCompositionLocalOf { false }
```
- **Haptics:** used only in two places. `CONFIRM` (API 30+, falling back to `VIRTUAL_KEY`) when a task is checked off and when the day is closed, and `LONG_PRESS` on the reaction picker. Nothing on scroll, nothing on navigation, never on errors.

---

## 7. Shapes and spacing

**Shapes.** These are M3 `ShapeDefaults` values (extraSmall 4, small 8, medium 12, large 16, extraLarge 28 dp; https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary). **[Inference: values per the library's shape tokens]** Keep them, with these assignments: Chai Card 12 (medium), bottom sheet top corners 28 (extraLarge), chips 8 (small), buttons fully rounded (default), text fields 4 (extraSmall).

**Spacing.** Use a 4 dp base grid: **4, 8, 12, 16, 24, 32, 48**.
- Screen gutter 16 dp; card padding 16 dp; space between cards 12 dp.
- 24 dp between sections, and a 32 dp top margin before Close the Day.
- Gestalt proximity: space within a group (8) must be clearly smaller than space between groups (24).

```kotlin
@Immutable data class Spacing(val xs: Dp = 4.dp, val s: Dp = 8.dp, val m: Dp = 12.dp,
    val l: Dp = 16.dp, val xl: Dp = 24.dp, val xxl: Dp = 32.dp, val xxxl: Dp = 48.dp)
val LocalSpacing = staticCompositionLocalOf { Spacing() }

@Composable
fun SaathiTheme(dark: Boolean = isSystemInDarkTheme(), hindiContent: Boolean, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalSpacing provides Spacing(), LocalReduceMotion provides rememberReduceMotion()) {
        MaterialTheme(
            colorScheme = if (dark) ChaiDark else ChaiLight,   // dynamic colour deliberately OFF
            typography = appTypography(hindiContent),
            shapes = Shapes(),                                  // M3 defaults
            motionScheme = MotionScheme.standard(),
            content = content
        )
    }
}
```
(`SaathiTheme` is a placeholder name. `motionScheme` needs a recent Material 3 version; drop that line on older ones.)

---

## 8. Mapping the build rules to the IxDF canon

| Principle | Where it shows up in these rules |
|---|---|
| **Nielsen 1: Visibility of system status** | "Updated 6:10 am" label; "Data saver on" chip; offline upload progress bar; "Will send when online". |
| **Nielsen 2: Match with the real world** | Chai and tapri metaphor; Indian numbering (lakh, crore); "रात 10:30"; bolchaal Hindi; exam nouns aspirants actually say. |
| **Nielsen 3: User control and freedom** | One-tap language switch on every card; reminders editable or off; Close the Day as a full screen, not a dismissible sheet; drafts autosave. |
| **Nielsen 4: Consistency and standards** | One Material 3 component set; fixed scheme (no wallpaper drift); one haptic vocabulary; Hinglish limited to Chotu and chat. |
| **Nielsen 5: Error prevention** | Destructive actions confirmed and out of the thumb arc; never line-break inside numbers; offline queueing. |
| **Nielsen 6: Recognition rather than recall** | Labels always visible on the navigation bar; endonym language names; icon + word for every status. |
| **Nielsen 7: Flexibility and efficiency** | Heading semantics for jump navigation; TalkBack custom actions; "Listen" for commuters. |
| **Nielsen 8: Aesthetic and minimalist design** | No badges on Today, no countdown header, no shadows, no confetti, one accent. |
| **Nielsen 9: Recover from errors** | Error colour only for real system errors, with a plain-language fix ("No internet. Your answer is saved and will send later."). |
| **Nielsen 10: Help** | One-time Gboard transliteration tip; Chotu labelled as AI. |
| **Norman: affordances and signifiers** | Filled cards signal tappability; drag handles on sheets; outlined vs filled navigation icons. |
| **Norman: feedback** | `CONFIRM` haptic and checkmark when a task is done; calm close animation. |
| **Norman: mapping** | Five tabs in the order of the daily loop: Today → Pod → Practice → Rooms → My Path. |
| **Norman: constraints** | 5-tab ceiling; text sizes floor at 12 sp; error colour reserved for system errors. |
| **Gestalt: proximity and common region** | One idea per card; 8 dp inside a group vs 24 dp between groups. |
| **Gestalt: similarity** | All Chai Cards share one form; status uses consistent icon shapes. |
| **Visual hierarchy** | Serif (Martel 700) for "what to read", sans for "what to tap"; weight rather than italic for Devanagari emphasis. |
| **Fitts's law and thumb zone** | 48 dp minimum, 56 dp primary actions; bottom navigation; primary CTAs in the lower half. |
| **POUR / inclusive design** | AA contrast (7:1 on containers); 200% font scale; reduce-motion support; Hindi TTS; colour never used alone. |
| **Colour theory** | One warm accent plus a complementary teal tertiary; warm neutrals for a calm "paper" feel; contrast by tone distance. |
| **Typography fundamentals** | Matched bilingual family; Devanagari line height ≥1.6×; x-height matching; 17 sp reading body. |

---

## 9. Per-persona summary

- **Arjun** (Hindi-medium, small town, family money): Hindi reading language independent of UI language. Martel's Devanagari body at 17/29 sp. Bolchaal copy reviewed by a Hindi-medium aspirant. Text-only fallback pack (≤40 KB). Data saver. App download kept under 12 MB. Gboard transliteration tip. Lakh and crore formatting.
- **Meera** (urban, English-medium, comparison anxiety): no leaderboards, no badge counts on Today, private streaks, a calm editorial serif, no countdown header. Reads her pod's Hindi posts with correct line heights because typography follows content language.
- **Rahul** (working professional, short sessions): starts in under 1.5 s from cache. Draft autosave every 5 seconds. "Listen" via on-device TTS for commutes. One predictable 10:30 pm reminder. 56 dp primary actions reachable one-handed.
- **Sana** (extra social load, safety): quiet hours by default. Notification previews can be hidden (*Pod messages* channel defaults to private on the lock screen). **[Inference]** One-handed layout. No location permission.
- **Vikram** (repeater, fatigue, shame): no red, no "missed" states, neutral "Skipped, that's okay" wording even in TalkBack. No guilt notifications. Calm motion. Dark theme and Night calm for late-night Close the Day.
- **Kavya** (Tier 3, online-only, patchy data): offline-first Today. Graceful fallback when Wi-Fi never appears. WebP/AVIF thumbnails ≤25 KB. Works on aggressive-OEM phones because nothing depends on background jobs completing.

---

## 10. Ready-to-use design-token table

| Category | Token | Value (Chai, recommended) | Notes |
|---|---|---|---|
| Colour, light | primary / onPrimary | `#8D4F01` / `#FFFFFF` | 6.46:1 |
| | primaryContainer / onPrimaryContainer | `#FFDCC0` / `#6B3B00` | 7.22:1 |
| | secondaryContainer / onSecondaryContainer | `#FADDC7` / `#584330` | Navigation indicator, 7.18:1 |
| | tertiary / tertiaryContainer / onTertiaryContainer | `#14696B` / `#A4EFF1` / `#024F51` | Peacock teal, "live" and info accents |
| | surface / onSurface / onSurfaceVariant | `#FFF8F3` / `#201B17` / `#50453B` | 16.23 and 8.86:1 |
| | surfaceContainer Low / default / High / Highest | `#FAF2EC` / `#F4ECE7` / `#EEE7E1` / `#E9E1DB` | Cards, navigation bar, skeletons |
| | outline / outlineVariant | `#82756B` / `#D2C4B9` | 4.24:1 |
| Colour, dark | primary / onPrimary | `#FFB876` / `#4A2800` | 7.76:1 |
| | primaryContainer / onPrimaryContainer | `#6B3B00` / `#FFDCC0` | 7.22:1 |
| | surface / onSurface / onSurfaceVariant | `#18120D` / `#E9E1DB` / `#D2C4B9` | 14.37 and 10.91:1 |
| | surfaceContainer Low / default / High / Highest | `#201B17` / `#241F1B` / `#2E2925` / `#39342F` | |
| | outline | `#9C8E84` | 5.85:1 |
| Semantic | success / info / caution / error (light) | `#2B6B37` / `#05677E` / `#825501` / `#B02B35` | Error for system errors only |
| | success / info / caution / error (dark) | `#94D69A` / `#78D3F0` / `#F7BB6C` / `#FFB3AE` | |
| Alt accent | Indigo primary (light / dark) | `#4755B7` / `#C4C0FF` | Same contrast; marigold tertiary `#82551F` / `#F5BB81` |
| Type | Serif / Sans | Martel 400 + 700 (bundled) / system sans | ~0.3 MB fonts total |
| | bodyLarge (reading) | 17/27 sp EN, 17/29 sp HI | Martel |
| | bodyMedium (UI) | 15/22 EN, 15/24 HI | Sans |
| | titleLarge (card title) | 20/28 EN, 20/32 HI | Martel 700 |
| | label floor | 12 sp | Nothing smaller |
| | Devanagari line-height ratio | ≥1.6× body, `Trim.None` | |
| Shape | xs / s / m / l / xl | 4 / 8 / 12 / 16 / 28 dp | Card = m, sheet = xl |
| Spacing | scale | 4, 8, 12, 16, 24, 32, 48 dp | Gutter 16 |
| Touch | minimum / primary | 48 dp / 56 dp | |
| Motion | scheme | `MotionScheme.standard()` | |
| | state / transition / max | 150-200 / 250-300 / ≤400 ms | Standard easing (0.2, 0, 0, 1) |
| | reduce motion | duration scale 0 or in-app switch → no movement | |
| Elevation | cards / sheets | 0 dp (tonal surfaces) / M3 default | No shadows in lists |
| Haptics | allowed | `CONFIRM` on task done and day closed; `LONG_PRESS` on reactions | Nothing else |

---

## 11. Performance budget

Reference test device: a 2-3 GB RAM, Android 11-13, 720p phone from a common Indian OEM. Measure with Macrobenchmark on a real device, not an emulator. **[Inference: targets set by me, anchored to the vitals thresholds and Play size data cited above]**

| Metric | Budget | Hard ceiling | Why |
|---|---|---|---|
| Download size (AAB-delivered, per device) | **≤ 12 MB** | 18 MB | +2.5% conversion per 10 MB saved in India; users pay per MB |
| Installed size | ≤ 35 MB | 50 MB | Low-storage phones; `StorageNotLow` jobs |
| Bundled fonts | ≤ 350 KB | 900 KB | Martel ×2; Mukta only if the brand needs it |
| Cold start TTID (p50 / p90) | **≤ 1.5 s / ≤ 2.5 s** | < 5 s (vitals "excessive") | Rahul's micro-sessions; Baseline Profile required |
| Warm / hot start | ≤ 1 s / ≤ 0.5 s | < 2 s / < 1.5 s | Vitals thresholds |
| Time to Chai Cards visible from cache | ≤ 1.8 s cold | 3 s | `reportFullyDrawn()` after cached cards render |
| Frame rendering on Today scroll | ≥ 95% frames < 16.7 ms; 0 frozen (>700 ms) | | Low-end GPU; no shadows, blur or shimmer |
| Java/Kotlin heap on Today | ≤ 120 MB | 180 MB | 2 GB devices kill background apps quickly |
| Coil memory cache | 15% (low-RAM) / 20% | | Tune with the profiler |
| Daily data, metered (cards + thumbs) | **≤ 150 KB** | 300 KB | Text pack ≤40 KB gzip; thumbs ≤25 KB WebP |
| Daily data with data saver | ≤ 40 KB | 60 KB | Text only |
| Image per thumbnail | ≤ 25 KB WebP / AVIF | 40 KB | Sized via CDN width parameter |
| Background jobs / day | 1 periodic + ≤1 fallback | | Doze and OEM killers; no polling |
| Wake locks | 0 stuck; partial wake locks only inside WorkManager | < 5% sessions (vitals) | Battery vital |
| Crash / ANR rate | ≤ 0.5% / ≤ 0.2% | 1.09% / 0.47% (vitals) | Per-model 8% ceiling too |
| Notifications / day (non-pod) | ≤ 2 | | Users see per-app counts on Android 13+ |
| Answer draft autosave | every 5 s to Room | | Never lose an aspirant's writing |

**CI gates:**
- Macrobenchmark startup test fails the build if p50 cold TTID regresses by more than 10%.
- Bundle-size check fails above 12 MB.
- Screenshot tests at `fontScale = 2f` and `locale = hi` for every screen.
- A contrast unit test re-runs `scheme.py` against `Color.kt`.

---

### Sources not directly fetched or with open verification items
- Testbook, Unacademy, Dailyhunt and Josh Hindi patterns: not verified. Audit on a device.
- CLDR compact lakh and crore in Android ICU: unverified (https://unicode-org.atlassian.net/browse/CLDR-13660 was unreachable).
- `KeyboardOptions.hintLocales` availability: verify against your Compose version.
- Exact HCT hues: regenerate in Material Theme Builder (https://material.io/material-theme-builder). Contrast values are exact because tone equals L\*.
- m3.material.io pages render only with JavaScript and could not be fetched. M3 guidance was taken from developer.android.com Compose docs, the material-components-android token docs and the material-color-utilities source.
