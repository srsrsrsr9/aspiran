package com.upscpods.app.ui

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.upscpods.app.data.Community
import com.upscpods.app.data.LanguageRequests
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.LocalDate

/**
 * The welcome: greetings in eleven languages rise from Chotu's kulhad like chai steam. The app stays in English
 * (Hindi where it already exists); this only says hello.
 *
 * NEEDS NATIVE-SPEAKER CHECK: every non-English greeting and romanisation here was written without a native speaker.
 * Have one check each line before launch, then fill in `checked`. None is verified yet.
 * Same list as server/public/app/welcome.js; change both together. Android ships Noto for every one of these
 * scripts, so the system font draws them (no boxes) without bundling anything.
 */
data class Greeting(val code: String, val name: String, val word: String, val say: String?, val checked: String? = null)

val GREETINGS = listOf(
    Greeting("en", "English", "Welcome", null, checked = "n/a"),
    Greeting("hi", "Hindi", "स्वागत है", "Swagat hai"),
    Greeting("ta", "Tamil", "வணக்கம்", "Vanakkam"),
    Greeting("bn", "Bengali", "স্বাগতম", "Swagatam"),
    Greeting("te", "Telugu", "స్వాగతం", "Swagatam"),
    Greeting("hinglish", "Hinglish", "Aao, baitho!", "Come, pull up a chair"),
    Greeting("mr", "Marathi", "स्वागत आहे", "Swagat aahe"),
    Greeting("ml", "Malayalam", "സ്വാഗതം", "Swagatham"),
    Greeting("gu", "Gujarati", "સ્વાગત છે", "Swagat chhe"),
    Greeting("kn", "Kannada", "ಸುಸ್ವಾಗತ", "Suswagata"),
    Greeting("or", "Odia", "ସ୍ୱାଗତ", "Swagata"),
)

/** One greeting a day, cycling through all eleven (the Adda header and the launch welcome). */
fun greetingOfTheDay(day: LocalDate = LocalDate.now()): Greeting = GREETINGS[Math.floorMod(day.toEpochDay(), GREETINGS.size.toLong()).toInt()]

/** True when the phone asks for less motion (Settings → Accessibility → Remove animations sets this to 0). */
@Composable
fun reducedMotion(): Boolean {
    val context = LocalContext.current
    return remember { Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f }
}

private val DRIFT = listOf(-36, 28, -12, 40, -44, 14, -24, 34, -6, 22, -30)

/** Opacity and rise (dp) for one word at phase p in 0..1 of its 22-second turn. Same curve as the web CSS. */
private fun steam(p: Float): Pair<Float, Float> = when {
    p < 0.03f -> (p / 0.03f) to -(p / 0.13f * 95f)
    p < 0.13f -> (1f - (p - 0.03f) / 0.10f * 0.1f) to -(p / 0.13f * 95f)
    p < 0.20f -> (0.9f * (1f - (p - 0.13f) / 0.07f)) to (-95f - (p - 0.13f) / 0.07f * 45f)
    else -> 0f to -140f
}

/**
 * The steam scene for the first-run welcome. A word rises every 2 seconds (22-second loop, two on screen at once).
 * With reduced motion, the eleven greetings sit still above the cup instead. Screen readers hear one plain list.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun WelcomeScene(modifier: Modifier = Modifier) {
    val still = reducedMotion()
    val glow = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)
    val list = "Welcome, in eleven languages: " + GREETINGS.joinToString(", ") { "${it.word} (${it.name})" }
    Box(
        modifier.fillMaxWidth().height(if (still) 330.dp else 300.dp)
            .background(Brush.radialGradient(listOf(glow, glow.copy(alpha = 0f))), RoundedCornerShape(24.dp))
            .clearAndSetSemantics { contentDescription = list },
    ) {
        if (still) {
            FlowRow(
                Modifier.fillMaxWidth().padding(12.dp).align(Alignment.TopCenter),
                horizontalArrangement = Arrangement.spacedBy(14.dp, Alignment.CenterHorizontally),
            ) {
                GREETINGS.forEach { Text(it.word, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary) }
            }
        } else {
            val t by rememberInfiniteTransition(label = "steam").animateFloat(
                0f, 22f, infiniteRepeatable(tween(22_000, easing = LinearEasing), RepeatMode.Restart), label = "t",
            )
            val density = LocalDensity.current
            GREETINGS.forEachIndexed { i, g ->
                val p = Math.floorMod(((t - i * 2f + 1f) * 1000).toInt(), 22_000) / 22_000f
                val (a, rise) = steam(p)
                val drift = DRIFT[i] * (0.3f + (p.coerceAtMost(0.2f) / 0.2f) * 1.1f)
                Column(
                    Modifier.align(Alignment.BottomCenter).padding(bottom = 120.dp)
                        .graphicsLayer {
                            alpha = a
                            translationY = with(density) { rise.dp.toPx() }
                            translationX = with(density) { drift.dp.toPx() }
                        },
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(g.word, fontSize = 32.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text(g.say?.let { "${g.name} · $it" } ?: g.name, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        Box(Modifier.align(Alignment.BottomCenter).padding(bottom = 12.dp)) { Kulhad(KulhadTone.WARM, 104.dp) }
    }
}

/**
 * Right after the system splash (the steaming kulhad icon): the kulhad stays put and today's greeting rises out
 * of it, then the app opens. About 1.3 seconds, or 0.7 with reduced motion. A tap skips it.
 */
@Composable
fun LaunchWelcome(onDone: () -> Unit) {
    val g = remember { greetingOfTheDay() }
    val still = reducedMotion()
    val rise = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        if (still) delay(700) else rise.animateTo(1f, tween(1300, easing = LinearEasing))
        onDone()
    }
    val p = if (still) 0.5f else rise.value
    val alpha = if (still) 1f else when { p < 0.2f -> p / 0.2f; p > 0.8f -> (1f - p) / 0.2f; else -> 1f }
    Surface(
        Modifier.fillMaxSize().clickable(remember { MutableInteractionSource() }, indication = null) { onDone() },
        color = MaterialTheme.colorScheme.background,
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            // Same size and place as the splash icon's kulhad (96dp, centred), so the hand-off doesn't jump.
            Kulhad(KulhadTone.WARM, 96.dp)
            Column(
                Modifier.offset(y = (-104).dp).alpha(alpha).graphicsLayer { translationY = (1f - p) * 60f }
                    .semantics { liveRegion = LiveRegionMode.Polite },
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(g.word, fontSize = 34.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, textAlign = TextAlign.Center)
                Text(g.say?.let { "${g.name} · $it" } ?: g.name, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

/** A different greeting each day above the Adda's title (needs native-speaker check, see GREETINGS). */
@Composable
fun DailyHello() {
    val g = remember { greetingOfTheDay() }
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(g.word, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        Text(" · ${g.name}", style = MaterialTheme.typography.bodySmall)
    }
}

/**
 * "Request your language": one tap per language, an optional "I'd help translate", nothing else. Tap again to take
 * it back. Works before signing up (first run) and in Me.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RequestLanguageCard(requests: LanguageRequests, community: Community, modifier: Modifier = Modifier) {
    val scope = rememberCoroutineScope()
    var status by remember { mutableStateOf("") }
    Surface(
        modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        border = androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Request your language", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(
                "The app is in English, with Hindi where it's ready. Tap the languages you'd like next. We'll build the most-asked first.",
                style = MaterialTheme.typography.bodyMedium,
            )
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                LanguageRequests.REQUESTABLE.forEach { l ->
                    FilterChip(
                        selected = l.code in requests.asked,
                        onClick = { scope.launch { status = requests.toggle(community, l) } },
                        label = { Text(if (l.native == l.name) l.name else "${l.native} · ${l.name}") },
                    )
                }
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable { scope.launch { requests.updateHelper(community, !requests.helper) } },
            ) {
                Checkbox(checked = requests.helper, onCheckedChange = null)
                Text("I'd help translate or check translations", style = MaterialTheme.typography.bodyMedium)
            }
            if (status.isNotEmpty()) Text(status, style = MaterialTheme.typography.bodySmall, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
            Text(
                "We count one tap per language from this phone. No name, no account, no phone number.",
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}
