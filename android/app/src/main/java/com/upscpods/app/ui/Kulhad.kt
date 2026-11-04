package com.upscpods.app.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import java.time.LocalTime
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin

/** The steam and the face show the tone: quiet in care or result mode, sleepy late, warm by day, calm in the evening. */
enum class KulhadTone { WARM, CALM, NIGHT, THINKING, QUIET }

fun toneNow(care: Boolean = false, result: Boolean = false, thinking: Boolean = false): KulhadTone {
    if (care || result) return KulhadTone.QUIET
    if (thinking) return KulhadTone.THINKING
    val t = LocalTime.now()
    val hm = t.hour * 60 + t.minute
    return when {
        hm >= 23 * 60 + 30 || hm < 6 * 60 -> KulhadTone.NIGHT
        hm < 18 * 60 -> KulhadTone.WARM
        else -> KulhadTone.CALM
    }
}

private val STEAM = mapOf(
    KulhadTone.WARM to listOf("M22 14 q-4 -6 0 -11", "M32 13 q4 -6 0 -12", "M42 14 q-4 -6 0 -11"),
    KulhadTone.CALM to listOf("M27 14 q-3 -5 0 -10", "M37 14 q3 -5 0 -10"),
    KulhadTone.NIGHT to listOf("M32 14 q-2 -4 0 -8"),
    KulhadTone.THINKING to listOf("M24 14 q-4 -6 0 -11", "M32 13 q4 -6 0 -12", "M40 14 q-4 -6 0 -11"),
    KulhadTone.QUIET to emptyList(),
)

/** Chotu's face. Six expressions, drawn in code (no image files), so the mascot stays light and works offline. */
enum class ChotuMood { HAPPY, CALM, THINKING, SLEEPY, PROUD, GENTLE }

/** The face that goes with a tone, so every existing kulhad gets one without changing its callers. */
fun KulhadTone.mood(): ChotuMood = when (this) {
    KulhadTone.WARM -> ChotuMood.HAPPY
    KulhadTone.CALM -> ChotuMood.CALM
    KulhadTone.NIGHT -> ChotuMood.SLEEPY
    KulhadTone.THINKING -> ChotuMood.THINKING
    KulhadTone.QUIET -> ChotuMood.GENTLE
}

/** How much steam each face gets: proud and happy steam the most, gentle and sleepy barely. */
private fun ChotuMood.steamTone(): KulhadTone = when (this) {
    ChotuMood.HAPPY, ChotuMood.PROUD -> KulhadTone.WARM
    ChotuMood.CALM, ChotuMood.GENTLE -> KulhadTone.CALM
    ChotuMood.THINKING -> KulhadTone.THINKING
    ChotuMood.SLEEPY -> KulhadTone.NIGHT
}

private val INK = Color(0xFF2A1A10)
private val BLUSH = Color(0xFFE88A6A)

/** Chotu: a small terracotta kulhad with a face. [tone] picks the face and the steam. */
@Composable
fun Kulhad(tone: KulhadTone, size: Dp = 48.dp) = Kulhad(tone.mood(), size, steamTone = tone)

/**
 * Chotu with a given expression. The steam rises and fades on a slow loop (still when the phone asks for less
 * motion). Decorative: screen readers skip it; the text beside it carries the meaning.
 *
 * [lively] Chotu (the tour, onboarding, anywhere Chotu talks) also glows, bobs, blinks and looks toward [look], a
 * point in window coordinates such as the last tap. [wave] raises a waving hand; each new [puffKey] lets off a puff
 * of steam, for a moment of excitement.
 */
@Composable
fun Kulhad(
    mood: ChotuMood, size: Dp = 48.dp, steamTone: KulhadTone = mood.steamTone(), cupColor: Color? = null,
    lively: Boolean = false, look: Offset? = null, wave: Boolean = false, puffKey: Any? = null,
) {
    val steam = remember(steamTone) { STEAM[steamTone].orEmpty().map { PathParser().parsePathString(it).toPath() } }
    val cup = remember { PathParser().parsePathString("M12 20 L52 20 L46 56 Q32 60 18 56 Z").toPath() }
    val rim = remember { PathParser().parsePathString("M12 20 L52 20 L51 25 L13 25 Z").toPath() }
    val shine = remember { PathParser().parsePathString("M18 30 Q20 44 22 52").toPath() }
    val still = reducedMotion()
    val rise = if (still) 0f else {
        val t by rememberInfiniteTransition(label = "steam").animateFloat(
            0f, 1f, infiniteRepeatable(tween(2600, easing = LinearEasing), RepeatMode.Restart), label = "rise",
        )
        t
    }
    val live = lively && !still
    val loop = rememberInfiniteTransition(label = "chotu")
    val bob by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(2400, easing = LinearEasing)), label = "bob")
    val blinkT by loop.animateFloat(0f, 1f, infiniteRepeatable(tween(4300, easing = LinearEasing)), label = "blink")
    val waveT by loop.animateFloat(-1f, 1f, infiniteRepeatable(tween(380), RepeatMode.Reverse), label = "wave")
    val puff = remember { Animatable(1f) }
    LaunchedEffect(puffKey) { if (puffKey != null && !still) { puff.snapTo(0f); puff.animateTo(1f, tween(900, easing = LinearEasing)) } }
    var centre by remember { mutableStateOf<Offset?>(null) }
    Canvas(Modifier.size(size).onGloballyPositioned { centre = it.boundsInWindow().center }.clearAndSetSemantics { }) {
        // Where the eyes turn: up to 2 units toward the point, more the further away it is.
        val gaze = run {
            val c = centre; val l = look
            if (!live || c == null || l == null) Offset.Zero
            else { val d = l - c; val len = hypot(d.x, d.y); if (len < 1f) Offset.Zero else d / len * (2f * (len / 300f).coerceAtMost(1f)) }
        }
        val lift = if (live) sin(bob * 2 * PI).toFloat() * 1.6f else 0f
        scale(this.size.width / 64f, pivot = Offset.Zero) {
          if (live && cupColor == null) drawCircle(Brush.radialGradient(listOf(Color(0x66FFB547), Color(0x00FFB547)), Offset(32f, 38f), 32f), 32f, Offset(32f, 38f))
          translate(top = lift) {
            // Steam drifts up about 4 units and fades in and out, then starts again.
            val base = if (steamTone == KulhadTone.NIGHT) 0.45f else 0.8f
            val fade = if (still) 1f else (if (rise < 0.2f) rise / 0.2f else (1f - rise) / 0.8f)
            translate(top = -rise * 4f) {
                steam.forEach { drawPath(it, Color(0xFFB9AA9C), alpha = base * fade, style = Stroke(2.4f, cap = StrokeCap.Round)) }
            }
            // A puff: five little clouds burst up and out from the cup, then fade.
            if (puff.value < 1f) for (k in 0 until 5) {
                val a = (-150 + k * 30) * PI / 180
                val r = 6f + puff.value * 16f
                drawCircle(Color(0xFFE8DCD0), 2.2f + puff.value * 2.6f, Offset(32f + cos(a).toFloat() * r, 12f + sin(a).toFloat() * r), alpha = (1f - puff.value) * 0.9f)
            }
            // The pod friends each have their own cup colour; Chotu keeps the terracotta, now glazed and bright.
            if (cupColor != null) drawPath(cup, cupColor)
            else drawPath(cup, Brush.verticalGradient(listOf(Color(0xFFF08A4B), Color(0xFFC75A27), Color(0xFFA8461E)), startY = 20f, endY = 58f))
            drawPath(rim, cupColor ?: Color(0xFFB04A1F), alpha = if (cupColor != null) 0.8f else 1f)
            drawOval(Color(0xFF7A3418), topLeft = Offset(12f, 16.8f), size = Size(40f, 6.4f))
            drawPath(shine, if (cupColor == null) Color(0xFFFFC59A) else Color(0xFFCF7448), alpha = if (cupColor == null) 0.75f else 0.6f, style = Stroke(2f, cap = StrokeCap.Round))
            if (live && wave) {
                // A little clay hand on the right, waving.
                val a = (-55 + 22 * waveT) * PI / 180
                val hand = Offset(50f + cos(a).toFloat() * 11f, 34f + sin(a).toFloat() * 11f)
                drawLine(cupColor ?: Color(0xFFC75A27), Offset(48.5f, 36f), hand, 3.6f, StrokeCap.Round)
                drawCircle(cupColor ?: Color(0xFFE07A3F), 3f, hand)
            }
            translate(left = gaze.x, top = gaze.y) { face(mood, blink = live && blinkT > 0.955f) }
          }
        }
    }
}

private fun DrawScope.line(d: String, width: Float = 2.2f) =
    drawPath(PathParser().parsePathString(d).toPath(), INK, style = Stroke(width, cap = StrokeCap.Round))

/** Eyes at about (26,36) and (38,36), mouth at about (32,45), on the 64-unit cup. */
private fun DrawScope.face(mood: ChotuMood, blink: Boolean = false) {
    // A blink: open dot eyes close to a short line for a moment.
    if (blink && mood in setOf(ChotuMood.CALM, ChotuMood.THINKING, ChotuMood.GENTLE)) {
        val y = if (mood == ChotuMood.THINKING) 34.5f else 36.5f
        val dx = if (mood == ChotuMood.THINKING) 1.5f else 0f
        line("M${23.5f + dx} $y l5 0", 2f); line("M${35.5f + dx} $y l5 0", 2f)
        if (mood == ChotuMood.CALM) line("M29.5 44 q2.5 2 5 0", 2f)
        if (mood == ChotuMood.THINKING) line("M30 45.5 l5.5 -1.2", 2f)
        if (mood == ChotuMood.GENTLE) { line("M23 32.5 l5 -1.4", 1.6f); line("M41 32.5 l-5 -1.4", 1.6f); line("M29.5 44.5 q2.5 1.5 5 0", 2f) }
        return
    }
    when (mood) {
        ChotuMood.HAPPY -> {
            line("M23.5 37 q2.5 -3.5 5 0"); line("M35.5 37 q2.5 -3.5 5 0")
            line("M28 43.5 q4 4 8 0")
        }
        ChotuMood.PROUD -> {
            line("M23.5 37 q2.5 -3.5 5 0"); line("M35.5 37 q2.5 -3.5 5 0")
            drawPath(PathParser().parsePathString("M27 43 L37 43 Q36.5 49 32 49 Q27.5 49 27 43 Z").toPath(), INK)
        }
        ChotuMood.CALM -> {
            drawCircle(INK, 2.6f, Offset(26f, 36f)); drawCircle(INK, 2.6f, Offset(38f, 36f))
            line("M29.5 44 q2.5 2 5 0", 2f)
        }
        ChotuMood.THINKING -> {
            // Looking up and to the side, mouth pushed over.
            drawCircle(INK, 2.6f, Offset(27.5f, 34.5f)); drawCircle(INK, 2.6f, Offset(39.5f, 34.5f))
            line("M30 45.5 l5.5 -1.2", 2f)
        }
        ChotuMood.SLEEPY -> {
            line("M23.5 36 q2.5 2.6 5 0", 2f); line("M35.5 36 q2.5 2.6 5 0", 2f)
            drawCircle(INK, 1.6f, Offset(32f, 45f), style = Stroke(1.6f))
        }
        ChotuMood.GENTLE -> {
            // Soft eyes, brows tilted up in the middle: listening, not alarmed.
            drawCircle(INK, 2.4f, Offset(26f, 37f)); drawCircle(INK, 2.4f, Offset(38f, 37f))
            line("M23 32.5 l5 -1.4", 1.6f); line("M41 32.5 l-5 -1.4", 1.6f)
            line("M29.5 44.5 q2.5 1.5 5 0", 2f)
        }
    }
    if (mood == ChotuMood.HAPPY || mood == ChotuMood.PROUD || mood == ChotuMood.GENTLE) {
        drawCircle(BLUSH, 2.4f, Offset(20.5f, 41f), alpha = 0.55f)
        drawCircle(BLUSH, 2.4f, Offset(43.5f, 41f), alpha = 0.55f)
    }
}

/** The kulhad with its label. Chotu is always shown as an AI. */
@Composable
fun ChotuBadge(tone: KulhadTone, size: Dp = 40.dp) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Kulhad(tone, size)
        Text(Brand.MASCOT, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
    }
}

/**
 * Chotu talking: the kulhad beside a speech bubble. Hosts onboarding, the tour and the Adda check-in.
 * [content] goes under the words (chips, buttons). Screen readers hear the words once when they change.
 */
@Composable
fun ChotuSays(
    text: String,
    mood: ChotuMood = ChotuMood.HAPPY,
    modifier: Modifier = Modifier,
    size: Dp = 64.dp,
    look: Offset? = null,
    wave: Boolean = false,
    puffKey: Any? = null,
    content: @Composable ColumnScope.() -> Unit = {},
) {
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Kulhad(mood, size, lively = true, look = look, wave = wave, puffKey = puffKey)
        Surface(
            shape = RoundedCornerShape(topStart = 4.dp, topEnd = 18.dp, bottomEnd = 18.dp, bottomStart = 18.dp),
            color = MaterialTheme.colorScheme.primaryContainer,
            modifier = Modifier.weight(1f).padding(top = 8.dp),
        ) {
            Column(Modifier.padding(horizontal = 14.dp, vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite; contentDescription = "${Brand.MASCOT_SHORT} says: $text" },
                )
                content()
            }
        }
    }
}

// Prep is the sky (study, ambition), the Adda the earth (people). Dawn by day, the website's night sky after dark.
// Chai stays the accent, the lamp you study by. Same type and shapes.
private val PrepLight = lightColorScheme(
    primary = Color(0xFF9A4E0E),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFE6E7F3),
    onPrimaryContainer = Color(0xFF161A2E),
    tertiary = Color(0xFF2E3A73),
    surface = Color(0xFFF3F3F8),
    background = Color(0xFFF3F3F8),
    onSurface = Color(0xFF161A2E),
    onBackground = Color(0xFF161A2E),
    onSurfaceVariant = Color(0xFF565C78),
    outline = Color(0xFF9A9EB8),
    outlineVariant = Color(0xFFDCDDEA),
    secondaryContainer = Color(0xFFE6E7F3),
    onSecondaryContainer = Color(0xFF161A2E),
    surfaceVariant = Color(0xFFE6E7F3),
    surfaceContainerLow = Color(0xFFFFFFFF),
    surfaceContainer = Color(0xFFEBEBF4),
)
private val PrepDark = darkColorScheme(
    primary = Color(0xFFF0A04B),
    onPrimary = Color(0xFF1B1205),
    primaryContainer = Color(0xFF1E2444),
    onPrimaryContainer = Color(0xFFEEEAF6),
    tertiary = Color(0xFF7FE3F0),
    surface = Color(0xFF0B0E1C),
    background = Color(0xFF0B0E1C),
    onSurface = Color(0xFFEEEAF6),
    onBackground = Color(0xFFEEEAF6),
    onSurfaceVariant = Color(0xFFA3A8C6),
    outline = Color(0xFF4A5178),
    outlineVariant = Color(0xFF262C4A),
    secondaryContainer = Color(0xFF1E2444),
    onSecondaryContainer = Color(0xFFEEEAF6),
    surfaceVariant = Color(0xFF1E2444),
    surfaceContainerLow = Color(0xFF141932),
    surfaceContainer = Color(0xFF181E3A),
)

/** Wraps the Prep tab in the sky palette. */
@Composable
fun PrepSpace(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isDark()) PrepDark else PrepLight,
        typography = MaterialTheme.typography,
        shapes = MaterialTheme.shapes,
        content = content,
    )
}
