package com.upscpods.app.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Jeetu
import com.upscpods.app.data.JeetuClient
import com.upscpods.app.data.Voice
import com.upscpods.app.data.VoiceAsk
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.launch

// --- The portrait: adapted from the trailer's bust (artefacts/trailer-2026-11-13/scenes/chars.js), drawn in code -----

private val INK = Color(0xFF2A1B12)
private fun p(d: String): Path = PathParser().parsePathString(d).toPath()

/** Jeetu's shapes on the trailer's 440 × 540 grid, parsed once. */
private object JeetuArt {
    val robe = p("M40 540 Q48 400 140 370 L300 370 Q392 400 400 540Z")
    val shawlL = p("M30 540 Q40 420 130 372 L176 360 Q150 450 170 540Z")
    val shawlR = p("M410 540 Q400 420 310 372 L264 360 Q290 450 270 540Z")
    val borderL = p("M168 540 Q150 450 176 362")
    val borderR = p("M272 540 Q290 450 264 362")
    val hair = p("M134 226 Q128 160 170 142 Q220 128 270 142 Q312 160 306 226 Q296 186 280 176 Q290 160 262 154 Q220 150 178 154 Q150 160 160 176 Q144 186 134 226Z")
    val beard = p("M150 300 Q160 350 220 356 Q280 350 290 300 Q280 330 250 332 Q220 340 190 332 Q160 330 150 300Z")
    val moustache = p("M184 296 Q220 280 256 296 Q240 302 220 300 Q200 302 184 296Z")
    val mouth = p("M198 312 Q220 320 242 312")
    val browL = p("M168 204 Q186 192 204 205")
    val browR = p("M236 208 Q254 200 272 210")
    val cheeks = p("M164 254 Q170 262 180 262 M260 262 Q270 262 276 254")
    val nose = p("M218 246 Q210 270 220 276 Q228 276 230 270")
    val frame = p("M213 236 Q220 230 227 236 M159 232 L136 226 M281 232 L304 226")
    val glint = p("M170 226 L182 214 M238 226 L250 214")
    val tumbler = p("M-34 -70 H34 L28 40 Q27 50 18 50 H-18 Q-27 50 -28 40Z")
}

private fun DrawScope.jeetuBust(tumbler: Boolean) {
    val a = JeetuArt
    drawPath(a.robe, Color(0xFFEDE3D2))
    drawPath(a.shawlL, Color(0xFF5B2A22)); drawPath(a.shawlR, Color(0xFF5B2A22))
    drawPath(a.borderL, Color(0xFFC98A0B), style = Stroke(8f)); drawPath(a.borderR, Color(0xFFC98A0B), style = Stroke(8f))
    drawRoundRect(Color(0xFF8E5A3E), Offset(190f, 320f), Size(60f, 56f), androidx.compose.ui.geometry.CornerRadius(16f))
    drawOval(Color(0xFF9C6646), Offset(134f, 144f), Size(172f, 200f))
    drawOval(Color(0xFF8E5A3E), Offset(122f, 226f), Size(28f, 44f)); drawOval(Color(0xFF8E5A3E), Offset(290f, 226f), Size(28f, 44f))
    drawPath(a.hair, Color(0xFFD9D4CC))
    drawPath(a.beard, Color(0xFFCFC8BE))
    drawPath(a.moustache, Color(0xFFE3DDD4))
    drawPath(a.mouth, Color(0xFF4A1F14), style = Stroke(4f, cap = StrokeCap.Round))
    drawPath(a.browL, Color(0xFFCFC8BE), style = Stroke(8f, cap = StrokeCap.Round)); drawPath(a.browR, Color(0xFFCFC8BE), style = Stroke(8f, cap = StrokeCap.Round))
    for (cx in listOf(186f, 254f)) {
        drawOval(INK, Offset(cx - 7.5f, 229.5f), Size(15f, 17f))
        drawCircle(Color.White, 2.3f, Offset(cx + 2f, 235f))
    }
    drawPath(a.cheeks, Color(0xFF7E4F35), alpha = 0.6f, style = Stroke(2.5f))
    drawPath(a.nose, Color(0xFF7E4F35), style = Stroke(4f, cap = StrokeCap.Round))
    for (cx in listOf(186f, 254f)) drawCircle(INK, 27f, Offset(cx, 238f), style = Stroke(5f))
    drawPath(a.frame, INK, style = Stroke(5f, cap = StrokeCap.Round))
    drawPath(a.glint, Color.White, alpha = 0.5f, style = Stroke(4f, cap = StrokeCap.Round))
    if (tumbler) translate(320f, 450f) {
        scale(0.8f, pivot = Offset.Zero) {
            drawPath(a.tumbler, Brush.horizontalGradient(listOf(Color(0xFF8E979F), Color(0xFFE4E9ED), Color(0xFFA9B1B8), Color(0xFF6E767E)), -34f, 34f))
            drawOval(Color(0xFFDDE3E8), Offset(-34f, -77f), Size(68f, 14f))
            drawOval(Color(0xFF7A4A26), Offset(-28f, -74.5f), Size(56f, 9f))
            drawLine(Color.White, Offset(-20f, -60f), Offset(-16f, 36f), 6f, StrokeCap.Round, alpha = 0.55f)
        }
    }
}

/**
 * Jeetu's portrait. Small: a round head-and-shawl badge on the theme's soft colour. [full]: the bust with his steel
 * tumbler. Still (no motion at all) and decorative: the "Jeetu · AI" text beside it carries the meaning.
 */
@Composable
fun JeetuPortrait(size: Dp = 44.dp, full: Boolean = false) {
    val bg = MaterialTheme.colorScheme.secondaryContainer
    val ring = MaterialTheme.colorScheme.outlineVariant
    val circle = remember { Path().apply { addOval(androidx.compose.ui.geometry.Rect(Offset(220f, 240f), 126f)) } }
    Canvas(Modifier.size(size).clearAndSetSemantics { }) {
        if (full) {
            // The trailer's box from y = 100 down, as a square.
            scale(this.size.width / 440f, pivot = Offset.Zero) {
                translate(top = -100f) {
                    drawCircle(bg, 218f, Offset(220f, 320f)); drawCircle(ring, 218f, Offset(220f, 320f), style = Stroke(4f))
                    jeetuBust(tumbler = true)
                }
            }
        } else {
            scale(this.size.width / 256f, pivot = Offset.Zero) {
                translate(-92f, -112f) {
                    drawCircle(bg, 126f, Offset(220f, 240f))
                    clipPath(circle) { jeetuBust(tumbler = false) }
                    drawCircle(ring, 126f, Offset(220f, 240f), style = Stroke(4f))
                }
            }
        }
    }
}

/** "Jeetu · AI": the portrait and the label together, everywhere he appears. */
@Composable
fun JeetuLabel(size: Dp = 24.dp) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        JeetuPortrait(size); Text("  Jeetu", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
    }
}

/** One of his lines as a small card; nothing when he's off, quiet or it's result week. */
@Composable
fun JeetuNote(key: String, hindi: Boolean = Jeetu.hindi, text: String? = null) {
    if (!Jeetu.awake) return
    val words = text ?: Jeetu.line(key, hindi)
    if (words.isBlank()) return
    FlatCard(Modifier.fillMaxWidth()) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
            JeetuPortrait(40.dp)
            Column(Modifier.padding(start = 12.dp)) {
                Text("Jeetu", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(words, style = MaterialTheme.typography.bodyLarge)
                // His scripted lines can be heard: by key, so the server speaks only its own copy of the words.
                if (text == null) ListenButton(VoiceAsk("jeetu", line = key, lang = if (hindi) "hi" else "en"), hindi)
            }
        }
    }
}

/**
 * "Listen · AI voice" (data/Voice.kt): plays on a tap only, a second tap stops it. Shows nothing while voices are off,
 * or when there is nothing the server would speak (no sig on a reply). Still: no animation at all.
 */
@Composable
fun ListenButton(ask: VoiceAsk, hindi: Boolean = Jeetu.hindi) {
    if (!Voice.enabled || !ask.ok) return
    val context = LocalContext.current
    val key = remember(ask) { ask.key }
    val label = when (key) {
        Voice.playing -> if (hindi) "■ रोकें" else "■ Stop"
        Voice.loading -> if (hindi) "आवाज़ बन रही है…" else "Getting the voice…"
        else -> if (hindi) "🔊 सुनें" else "🔊 Listen"
    }
    Column {
        TextButton(onClick = { Voice.toggle(context, ask) }, enabled = Voice.loading != key) { Text(label) }
        Voice.trouble?.takeIf { it.first == key }?.let { Text(it.second, style = MaterialTheme.typography.bodySmall) }
    }
    // Leaving the screen stops the voice.
    DisposableEffect(key) { onDispose { if (Voice.playing == key) Voice.stop() } }
}

/** The weekly note on Progress: how much came back, against your own past only. */
@Composable
fun JeetuWeekly(rightDays: Map<String, List<Int>>, onAsk: (() -> Unit)?) {
    if (!Jeetu.awake) return
    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                JeetuPortrait(40.dp)
                Column(Modifier.padding(start = 12.dp)) {
                    Text(if (Jeetu.hindi) "इस हफ़्ते की याद" else "Your week of recall", style = MaterialTheme.typography.titleSmall)
                    Text("Jeetu", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Text(Jeetu.weeklyText(rightDays), style = MaterialTheme.typography.bodyLarge)
            if (onAsk != null) TextButton(onClick = onAsk) { Text(if (Jeetu.hindi) "Jeetu से तरीक़े के बारे में पूछें →" else "Ask Jeetu about the method →") }
        }
    }
}

/** The double act from the trailer: Chotu asks for a streak. */
@Composable
fun JeetuDoubleAct() {
    if (!Jeetu.awake) return
    val hi = Jeetu.hindi
    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            @Composable fun chotu(tone: KulhadTone, line: String) = Row(verticalAlignment = Alignment.CenterVertically) {
                Kulhad(tone, 24.dp); Text("  Chotu", Modifier.width(110.dp), style = MaterialTheme.typography.labelLarge); Text(line, style = MaterialTheme.typography.bodyMedium)
            }
            val l = if (hi) "hi" else "en"
            chotu(KulhadTone.WARM, if (hi) "Jeetu भैया… एक स्ट्रीक मिल सकती है? बस छोटी सी?" else "Jeetu bhaiya… can I have a streak? Just a tiny one?")
            ListenButton(VoiceAsk("chotu", line = "streakAsk", lang = l), hi)
            Row(verticalAlignment = Alignment.CenterVertically) {
                JeetuPortrait(24.dp); Text("  Jeetu", Modifier.width(110.dp), style = MaterialTheme.typography.labelLarge)
                Text(if (hi) "नहीं। चाय पियो।" else "No. Drink your chai.", style = MaterialTheme.typography.bodyMedium)
            }
            ListenButton(VoiceAsk("jeetu", line = "streakNo", lang = l), hi)
            chotu(KulhadTone.CALM, if (hi) "मैं ही तो चाय हूँ।" else "I AM the chai.")
            ListenButton(VoiceAsk("chotu", line = "streakChai", lang = l), hi)
        }
    }
}

// --- Ask Jeetu ------------------------------------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AskJeetuScreen(client: JeetuClient, onOpenChotu: (() -> Unit)?, onClose: () -> Unit) {
    BackHandler(onBack = onClose)
    val hi = Jeetu.hindi
    val scope = rememberCoroutineScope()
    var input by rememberSaveable { mutableStateOf("") }
    var reported by remember { mutableStateOf(setOf<String>()) }
    val send: (String) -> Unit = { t -> input = ""; scope.launch { client.ask(t, hi) } }
    Scaffold(topBar = { TopAppBar(title = { Text(if (hi) "Jeetu से पूछें" else "Ask Jeetu") }, navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                JeetuPortrait(120.dp, full = true)
                Text("Jeetu", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
            }
            when {
                !Jeetu.enabled -> Text(if (hi) "Jeetu अभी चुप है।" else "Jeetu is staying quiet for now.", style = MaterialTheme.typography.bodyLarge)
                Jeetu.quietNow() -> Text(if (hi) "रात हो गई, बेटा। दिन बंद करो और सो जाओ। सुबह सात बजे मिलते हैं।" else Jeetu.QUIET_REPLY, style = MaterialTheme.typography.bodyLarge)
                else -> {
                    if (client.turns.isEmpty()) {
                        Text(if (hi) "Jeetu सिर्फ़ तरीक़ा सिखाते हैं: कैसे पढ़ें, याद रखें, लिखें। तथ्य और व्याख्या के लिए Chotu से पूछें।"
                            else "Jeetu teaches the method: how to study, remember and write. For facts and explanations, ask Chotu.", style = MaterialTheme.typography.bodyMedium)
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            (if (hi) listOf("रिव्यू रोज़ कितना करूँ?", "मेन्स का उत्तर ख़ुद कैसे जाँचूँ?", "करंट अफ़ेयर्स कैसे याद रखूँ?")
                            else listOf("How long should my daily review be?", "How do I mark my own Mains answer?", "How do I keep current affairs from slipping?"))
                                .forEach { s -> OutlinedButton(onClick = { send(s) }) { Text(s) } }
                        }
                    }
                    client.turns.forEach { t ->
                        if (t.fromUser) Text(if (t.care) "(kept on this phone)" else t.text, Modifier.fillMaxWidth(), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                        else FlatCard(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                JeetuLabel(20.dp)
                                Text(t.text, style = MaterialTheme.typography.bodyLarge)
                                if (!t.care) ListenButton(VoiceAsk("jeetu", text = t.text, sig = t.voiceSig), hi)
                                if (!t.care) TextButton(onClick = {
                                    if (t.id !in reported) scope.launch { if (client.report(t, "Reported from the Android app")) reported = reported + t.id }
                                }) { Text(if (t.id in reported) "Reported" else "Report") }
                            }
                        }
                    }
                    if (client.busy) Text(if (hi) "Jeetu सोच रहे हैं…" else "Jeetu is thinking…", style = MaterialTheme.typography.bodySmall)
                    client.trouble?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
                    OutlinedTextField(value = input, onValueChange = { input = it.take(1500) }, modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text(if (hi) "जैसे: दोबारा पढ़ूँ या ख़ुद को टेस्ट करूँ?" else "For example: should I re-read my notes or test myself?") })
                    Button(onClick = { send(input) }, enabled = input.isNotBlank() && !client.busy, modifier = Modifier.fillMaxWidth()) { Text(if (hi) "भेजें" else "Send") }
                }
            }
            Text(if (hi) "Jeetu ऐप का मेथड कोच है, कोई इंसानी मेंटर नहीं। वह ग़लत हो सकता है, और रैंक, नतीजे या भावनाओं पर बात नहीं करता।"
                else "Jeetu is the app's method coach, not a human mentor. He can be wrong, and he doesn't talk about ranks, results or feelings: those deserve a real person.",
                style = MaterialTheme.typography.bodySmall)
            if (onOpenChotu != null) TextButton(onClick = onOpenChotu) { Text(if (hi) "तथ्य या व्याख्या चाहिए? Chotu से पूछें →" else "Need a fact or an explanation? Ask Chotu →") }
        }
    }
}
