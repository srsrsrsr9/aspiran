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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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

/** One stop of Chotu's tour: which tab it shows, and what Chotu says there. */
data class TourStop(val tab: String, val line: String, val mood: ChotuMood)

val TOUR = listOf(
    TourStop("ADDA", "This is the Adda, your home. Each day I'll say hello here, and your next step is the big button.", ChotuMood.HAPPY),
    TourStop("PREP", "Today's Chai lives in Prep: a few short news cards each morning, then 5 Prelims questions and 1 Mains answer. That's a whole day.", ChotuMood.PROUD),
    TourStop("POD", "Your pods: open rooms for your language, attempt, goal, optional and region. Join as many as help. Nobody does this alone here.", ChotuMood.CALM),
    TourStop("MASCOT", "And this is my corner. Ask me about the syllabus, plan your week, or just tell me how it's going. Need to talk is always at the top.", ChotuMood.HAPPY),
)

/**
 * Chotu's four-stop tour after onboarding. It sits over the bottom of the screen so the tab it describes shows
 * behind it. [onStop] moves the app to that stop's tab; Skip or Done ends it for good.
 */
@Composable
fun ChotuTour(onStop: (TourStop) -> Unit, onFinish: () -> Unit) {
    var i by rememberSaveable { mutableIntStateOf(0) }
    val stop = TOUR[i]
    Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.35f)), contentAlignment = Alignment.BottomCenter) {
        Surface(
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 3.dp,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.navigationBarsPadding().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("${Brand.MASCOT_SHORT}'s tour · ${i + 1} of ${TOUR.size}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                ChotuSays(stop.line, stop.mood)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = onFinish) { Text("Skip") }
                    Button(onClick = {
                        if (i == TOUR.lastIndex) onFinish() else { i++; onStop(TOUR[i]) }
                    }) { Text(if (i == TOUR.lastIndex) "Let's start" else "Next") }
                }
            }
        }
    }
}
