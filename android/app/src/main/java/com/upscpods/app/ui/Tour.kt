package com.upscpods.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand

/** The bottom bar's icons, drawn in code (no icon library): a cup for the Adda, a circle of people, a pencil, a person. */
enum class TabGlyph { ADDA, POD, CHOTU, PREP, ME }

@Composable
fun TabIcon(glyph: TabGlyph, selected: Boolean) {
    if (glyph == TabGlyph.CHOTU) {
        Kulhad(if (selected) ChotuMood.HAPPY else ChotuMood.CALM, 26.dp)
        return
    }
    val c = MaterialTheme.colorScheme.onSurface
    Canvas(Modifier.size(24.dp)) {
        val w = size.width
        val s = Stroke(width = w * 0.08f, cap = StrokeCap.Round)
        when (glyph) {
            TabGlyph.ADDA -> {
                // A cup with a handle and a wisp of steam.
                drawRoundRect(c, Offset(w * 0.18f, w * 0.38f), Size(w * 0.5f, w * 0.46f), CornerRadius(w * 0.08f), style = s)
                drawArc(c, -90f, 180f, false, Offset(w * 0.56f, w * 0.46f), Size(w * 0.24f, w * 0.24f), style = s)
                drawLine(c, Offset(w * 0.36f, w * 0.12f), Offset(w * 0.36f, w * 0.28f), s.width, StrokeCap.Round)
                drawLine(c, Offset(w * 0.5f, w * 0.16f), Offset(w * 0.5f, w * 0.28f), s.width, StrokeCap.Round)
            }
            TabGlyph.POD -> {
                // Five heads in a circle.
                for (i in 0 until 5) {
                    val a = Math.toRadians(i * 72.0 - 90)
                    drawCircle(c, w * 0.1f, Offset(w * 0.5f + w * 0.32f * Math.cos(a).toFloat(), w * 0.5f + w * 0.32f * Math.sin(a).toFloat()))
                }
            }
            TabGlyph.PREP -> {
                // A pencil on a line.
                drawLine(c, Offset(w * 0.22f, w * 0.72f), Offset(w * 0.72f, w * 0.22f), w * 0.16f, StrokeCap.Round)
                drawLine(c, Offset(w * 0.14f, w * 0.88f), Offset(w * 0.86f, w * 0.88f), s.width, StrokeCap.Round)
            }
            TabGlyph.ME -> {
                drawCircle(c, w * 0.16f, Offset(w * 0.5f, w * 0.3f), style = s)
                drawArc(c, 180f, 180f, false, Offset(w * 0.18f, w * 0.56f), Size(w * 0.64f, w * 0.6f), style = s)
            }
            TabGlyph.CHOTU -> Unit
        }
    }
}

/**
 * One stop of Chotu's tour: which tab it shows (and which Prep chip, for [sub]), and what Chotu says there.
 * [pitch] is the last stop, the Plus pitch, which shows over whatever tab is open.
 */
data class TourStop(val tab: String, val line: String, val mood: ChotuMood, val sub: String? = null, val pitch: Boolean = false)

// The 60-second tour (sell-first plan W1): each stop shows a feature working behind Chotu, and the last one sells Plus.
val TOUR = listOf(
    TourStop("ADDA", "Hi, I'm Chotu! Give me one minute and I'll show you why this is the smartest way to crack UPSC.", ChotuMood.HAPPY),
    TourStop("PREP", "The whole UPSC syllabus, paper by paper, right at the top. And every topic comes many ways: flip it, pair it, sort it, play it. No boring PDFs.", ChotuMood.PROUD, sub = "TODAY"),
    TourStop("PREP", "Write an answer on paper, snap a photo, and get it marked on 5 areas in about a minute, with a model skeleton. 3 free every week.", ChotuMood.PROUD, sub = "PRACTICE"),
    TourStop("POD", "Open rooms for your language, attempt, optional and region. Someone's always studying. Jump in, join as many as you like.", ChotuMood.HAPPY),
    TourStop("MASCOT", "And I'm here all day. Plan your week, clear a doubt, quiz yourself, or just tell me how it's going.", ChotuMood.HAPPY),
    TourStop("ADDA", "", ChotuMood.PROUD, pitch = true),
)

/**
 * Chotu's tour after onboarding. It sits over the bottom of the screen so the tab it describes shows behind it.
 * [onStop] moves the app to that stop's tab; Skip or the last button ends it for good. Chotu's eyes follow your taps.
 * The last stop pitches Plus at the one yearly price ([price], from the server) with the free-trial offer; [onSeePlus] opens the Plus page.
 */
@Composable
fun ChotuTour(onStop: (TourStop) -> Unit, onFinish: () -> Unit, price: Int? = null, hindi: Boolean = false, onSeePlus: (() -> Unit)? = null) {
    var i by rememberSaveable { mutableIntStateOf(0) }
    val stop = TOUR[i]
    var origin by remember { mutableStateOf(Offset.Zero) }
    var tap by remember { mutableStateOf<Offset?>(null) }
    Box(
        Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.35f))
            .onGloballyPositioned { origin = it.positionInWindow() }
            // Watch taps without taking them, so Chotu can look where you touch.
            .pointerInput(Unit) { awaitPointerEventScope { while (true) { awaitPointerEvent(PointerEventPass.Initial).changes.firstOrNull()?.let { tap = origin + it.position } } } },
        contentAlignment = Alignment.BottomCenter,
    ) {
        Surface(
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 3.dp,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.navigationBarsPadding().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // A dot per stop, filling in as the tour goes.
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("${Brand.MASCOT_SHORT}'s tour", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    TOUR.indices.forEach { k ->
                        Box(Modifier.size(if (k == i) 18.dp else 7.dp, 7.dp).clip(RoundedCornerShape(99.dp))
                            .background(if (k <= i) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant))
                    }
                }
                if (stop.pitch) PlusPitch(price, hindi, tap, puffKey = i)
                else ChotuSays(stop.line, stop.mood, look = tap, wave = i == 0, puffKey = i)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = onFinish) { Text(if (stop.pitch) "Start free" else "Skip") }
                    Button(onClick = {
                        when {
                            stop.pitch -> { onFinish(); onSeePlus?.invoke() }
                            else -> { i++; onStop(TOUR[i]) }
                        }
                    }) { Text(if (stop.pitch) "See Plus" else "Next") }
                }
            }
        }
    }
}

/** The tour's last stop: Chotu sells Plus with confidence. Only what Plus does today, at the one yearly price. */
@Composable
private fun PlusPitch(price: Int?, hindi: Boolean, look: Offset?, puffKey: Any) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        ChotuSays("One more thing. Free gets you started. Plus shows you exactly where your marks leak, and wins them back.", ChotuMood.PROUD, look = look, puffKey = puffKey)
        Column(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp))
                .background(Brush.linearGradient(listOf(Color(0xFF1B1030), Color(0xFF3A1A4A), Color(0xFF6A2A2A))))
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text("UPSC PODS PLUS", color = Color(0xFFFFB547), fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 2.sp)
            listOf(
                "Every mock analysed: where your marks leak",
                "Every miss comes back until it sticks",
                "Unlimited answer reviews",
                "The weekly Chai test and the monthly compilation",
            ).forEach { Text("✦  $it", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.SemiBold) }
            PlusOffer(hindi, price ?: PLUS_YEARLY_INR, Modifier.padding(top = 4.dp))
        }
    }
}
