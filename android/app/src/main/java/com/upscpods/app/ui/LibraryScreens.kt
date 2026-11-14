@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.upscpods.app.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.Explainer
import com.upscpods.app.data.LibraryItem
import com.upscpods.app.data.MapCard
import com.upscpods.app.data.MatchGame
import com.upscpods.app.data.MythCard
import com.upscpods.app.data.NumberCard
import com.upscpods.app.data.Part
import com.upscpods.app.data.PartFrame
import com.upscpods.app.data.QuizPack
import com.upscpods.app.data.Review
import com.upscpods.app.data.Timeline
import com.upscpods.app.data.TwoSides
import com.upscpods.app.data.Winddown
import kotlinx.coroutines.launch
import kotlinx.serialization.json.decodeFromJsonElement
import java.text.NumberFormat
import java.time.LocalDate
import java.time.Period
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.random.Random

/** What each kind is called on the Practice tab, in the reading language. */
fun kindName(kind: String, hindi: Boolean): String = when (kind) {
    "explainer" -> if (hindi) "एक मिनट" else "Ek Minute"
    "timeline" -> if (hindi) "समयरेखा" else "Timeline story"
    "match" -> if (hindi) "अनुच्छेद मिलाओ" else "Match the Article"
    "quiz" -> if (hindi) "क्विज़ नाइट" else "Quiz night"
    "map" -> if (hindi) "नक़्शा चाय" else "Map Chai"
    "number" -> if (hindi) "आँकड़ों की समझ" else "Number Sense"
    "myth" -> if (hindi) "झूठ या सच" else "Myth vs Fact"
    "debate" -> if (hindi) "दोनों पक्ष" else "Two Sides"
    "winddown" -> if (hindi) "दीया बुझाओ" else "Lamp Off"
    "scratch" -> if (hindi) "खुरचो और देखो" else "Scratch and reveal"
    "trail" -> if (hindi) "मुहरों का सफ़र" else "Stamp trail"
    "radio" -> if (hindi) "चाय की टपरी का रेडियो" else "Chai stall radio"
    "assemble" -> if (hindi) "जोड़ो" else "Snap together"
    "chain" -> if (hindi) "डोमिनो असर" else "Domino effect"
    "thennow" -> if (hindi) "तब और अब" else "Then and now"
    "postcard" -> if (hindi) "पोस्टकार्ड" else "Postcards"
    else -> engineTypeName(kind, hindi) ?: kind
}

/** The item's own title, falling back to the kind's name. */
fun itemTitle(item: LibraryItem, hindi: Boolean): String {
    val j = ContentLibrary.JSON
    fun bi(key: String) = item.data[key]?.let { runCatching { j.decodeFromJsonElement<com.upscpods.app.data.Bi<String>>(it).pick(hindi) }.getOrNull() }
    return when (item.kind) {
        "match" -> if (hindi) "अनुच्छेद और उसका अर्थ जोड़िए" else "Pair each Article with what it does"
        "quiz" -> if (hindi) "इस हफ़्ते की दोहराई, पूरे कमरे के साथ" else "This week's revision, for the whole room"
        "myth" -> if (hindi) "फ़ॉरवर्ड हुए दावे, जाँचे हुए" else "Forwarded claims, checked"
        "number" -> bi("lead")?.let { lead -> (item.data["value"]?.toString() ?: "") + " " + lead }
        "postcard" -> bi("place")?.let { if (hindi) "$it से पोस्टकार्ड" else "A postcard from $it" }
        else -> bi("title") ?: bi("question") ?: bi("lead")
    } ?: kindName(item.kind, hindi)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(item: LibraryItem, library: ContentLibrary, hindiPreferred: Boolean, onClose: () -> Unit) {
    if (item.kind == "winddown") {
        val w = remember(item) { runCatching { ContentLibrary.JSON.decodeFromJsonElement<Winddown>(item.data) }.getOrNull() }
        if (w != null) return LampOff(w, library, hindiPreferred && item.hindi, onClose)
    }
    var hindi by rememberSaveable(item.id) { mutableStateOf(hindiPreferred && item.hindi) }
    // Decoded once, outside composition, so a malformed item shows a message instead of crashing.
    val content: Any? = remember(item) {
        val j = ContentLibrary.JSON
        runCatching {
            when (item.kind) {
                "explainer" -> j.decodeFromJsonElement<Explainer>(item.data)
                "timeline" -> j.decodeFromJsonElement<Timeline>(item.data)
                "match" -> j.decodeFromJsonElement<MatchGame>(item.data)
                "quiz" -> j.decodeFromJsonElement<QuizPack>(item.data)
                "map" -> j.decodeFromJsonElement<MapCard>(item.data)
                "number" -> j.decodeFromJsonElement<NumberCard>(item.data)
                "myth" -> j.decodeFromJsonElement<MythCard>(item.data)
                "debate" -> j.decodeFromJsonElement<TwoSides>(item.data)
                "scratch" -> j.decodeFromJsonElement<com.upscpods.app.data.ScratchCard>(item.data)
                "trail" -> j.decodeFromJsonElement<com.upscpods.app.data.StampTrail>(item.data)
                "radio" -> j.decodeFromJsonElement<com.upscpods.app.data.Radio>(item.data)
                "assemble" -> j.decodeFromJsonElement<com.upscpods.app.data.Assemble>(item.data)
                "chain" -> j.decodeFromJsonElement<com.upscpods.app.data.Chain>(item.data)
                "thennow" -> j.decodeFromJsonElement<com.upscpods.app.data.ThenNow>(item.data)
                "postcard" -> j.decodeFromJsonElement<com.upscpods.app.data.Postcard>(item.data)
                else -> if (item.data["play"] != null) j.decodeFromJsonElement<com.upscpods.app.data.EngineItem>(item.data) else null
            }
        }.getOrNull()
    }
    val review = remember(item) { item.data["review"]?.let { runCatching { ContentLibrary.JSON.decodeFromJsonElement<Review>(it) }.getOrNull() } ?: Review() }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(kindName(item.kind, hindi)) },
                navigationIcon = { TextButton(onClick = onClose) { Text(if (hindi) "← वापस" else "← Back") } },
                actions = {
                    if (item.hindi) TextButton(onClick = { hindi = !hindi }) { Text(if (hindi) "English" else "हिंदी") }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            when (val c = content) {
                is Explainer -> ExplainerPlayer(c, hindi, library)
                is Timeline -> TimelineStory(c, hindi, library)
                is MatchGame -> MatchTheArticle(c, hindi)
                is QuizPack -> QuizNight(c, hindi)
                is MapCard -> MapChai(c, hindi, library)
                is NumberCard -> NumberSense(c, hindi)
                is MythCard -> MythVsFact(c, hindi)
                is TwoSides -> TwoSidesView(c, hindi)
                is com.upscpods.app.data.ScratchCard -> ScratchAndReveal(c, hindi, library)
                is com.upscpods.app.data.StampTrail -> StampTrailView(c, hindi, library)
                is com.upscpods.app.data.Radio -> RadioView(c, hindi, library)
                is com.upscpods.app.data.Assemble -> AssembleView(c, hindi, library)
                is com.upscpods.app.data.Chain -> ChainView(c, hindi, library)
                is com.upscpods.app.data.ThenNow -> ThenNowView(c, hindi, library)
                is com.upscpods.app.data.Postcard -> PostcardView(c, hindi, library)
                is com.upscpods.app.data.EngineItem -> EnginePlayer(c, hindi, library)
                else -> Text(if (hindi) "यह आइटम खुल नहीं सका। ऐप अपडेट करके देखें।" else "This item couldn't be opened. A newer app may be needed.")
            }
            HorizontalDivider()
            Text(review.line(hindi), style = MaterialTheme.typography.labelSmall)
        }
    }
}

// --- Ek Minute explainer ---------------------------------------------------------------------

@Composable
fun ExplainerPlayer(ex: Explainer, hindi: Boolean, library: ContentLibrary) {
    val context = LocalContext.current
    val still = remember { reducedMotion(context) }
    val scenes = ex.scenes
    if (scenes.isEmpty()) return
    var scene by rememberSaveable(ex.id) { mutableIntStateOf(0) }
    var t by remember { mutableFloatStateOf(0f) }
    var playing by rememberSaveable(ex.id) { mutableStateOf(false) }
    var sound by rememberSaveable { mutableStateOf(false) } // never autoplays
    var motifPlayed by remember { mutableStateOf(false) }
    val bed = rememberLoopPlayer()
    val motif = rememberLoopPlayer()
    val scope = rememberCoroutineScope()
    val total = scenes.sumOf { it.seconds.toDouble() }.toFloat()
    val elapsed = scenes.take(scene).sumOf { it.seconds.toDouble() }.toFloat() + t
    val s = scenes[scene]

    LaunchedEffect(playing, scene) {
        if (!playing) return@LaunchedEffect
        var last = withFrameNanos { it }
        while (true) {
            val now = withFrameNanos { it }
            t += (now - last) / 1e9f
            last = now
            if (t >= s.seconds) {
                if (scene < scenes.lastIndex) { scene++; t = 0f } else { t = s.seconds; playing = false }
                break
            }
        }
    }
    // Music bed while playing with sound on; at the end the bed stops and the chai motif plays once.
    LaunchedEffect(sound, playing, motifPlayed) {
        if (sound && playing && !motifPlayed && !library.dataSaver()) {
            if (bed.playingPath == null) ex.audio.bed?.let { p -> library.audio(p)?.let { bed.play(it, p, ex.audio.bedGain) } } else bed.resume()
        } else bed.pause()
    }
    val motifAt = ex.audio.motifAtSeconds
    LaunchedEffect(elapsed >= (motifAt ?: Float.MAX_VALUE)) {
        if (motifAt != null && elapsed >= motifAt && !motifPlayed) {
            motifPlayed = true
            bed.stop()
            if (sound) ex.audio.motif?.let { p -> library.audio(p)?.let { motif.play(it, p, loop = false) } }
        }
    }

    Text(ex.title.pick(hindi), style = MaterialTheme.typography.titleLarge)
    ExplainerStage(ex, scene, if (still) 99f else t, hindi)
    Text(s.caption.pick(hindi), style = if (hindi) ReadingHindi else ReadingText, modifier = Modifier.height(if (hindi) 120.dp else 110.dp))
    LinearProgressIndicator(progress = { (elapsed / total).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth())
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
        TextButton(onClick = { if (scene > 0) { scene--; t = 0f } }, enabled = scene > 0) { Text("◀") }
        val ended = scene == scenes.lastIndex && t >= s.seconds
        Button(onClick = {
            if (ended) { scene = 0; t = 0f; motifPlayed = false; playing = true } else playing = !playing
        }) { Text(if (ended) (if (hindi) "फिर से" else "Replay") else if (playing) (if (hindi) "रोकें" else "Pause") else (if (hindi) "चलाएँ" else "Play")) }
        TextButton(onClick = { if (scene < scenes.lastIndex) { scene++; t = 0f } }, enabled = scene < scenes.lastIndex) { Text("▶") }
        FilterChip(selected = sound, onClick = { sound = !sound; if (!sound) scope.launch { bed.stop(); motif.stop() } }, label = { Text(if (sound) "♪ On" else "♪ Off") })
    }
    Text("${scene + 1} / ${scenes.size}", style = MaterialTheme.typography.labelSmall)
}

@Composable
private fun ExplainerStage(ex: Explainer, scene: Int, t: Float, hindi: Boolean) {
    val measurer = rememberTextMeasurer()
    val s = ex.scenes[scene]
    val prev = ex.scenes.getOrNull(scene - 1)?.frame ?: s.frame
    val fade = (t / 0.3f).coerceIn(0f, 1f)
    val move = (t / s.seconds).coerceIn(0f, 1f)
    fun mix(a: Float, b: Float) = a + (b - a) * fade
    val parts = remember(ex) { ex.parts }
    val tiles = remember(ex) { ex.tiles }
    val end = remember(ex) { ex.endCard }
    val ink = MaterialTheme.colorScheme.onSurface
    val soft = MaterialTheme.colorScheme.surfaceContainerHigh
    val accent = MaterialTheme.colorScheme.primary
    val teal = MaterialTheme.colorScheme.tertiary
    val endBg = MaterialTheme.colorScheme.primaryContainer
    val endInk = MaterialTheme.colorScheme.onPrimaryContainer
    Canvas(Modifier.fillMaxWidth().aspectRatio(ex.canvas.width / ex.canvas.height).background(MaterialTheme.colorScheme.surfaceContainerLow)) {
        val k = size.width / ex.canvas.width
        fun label(text: String, x: Float, y: Float, w: Float, size: Float, color: Color, alpha: Float, bold: Boolean = false, center: Boolean = true) {
            if (alpha <= 0.01f || text.isBlank()) return
            drawText(
                measurer, text, topLeft = Offset(x * k, y * k),
                style = TextStyle(fontSize = (size * k).toSp(), color = color.copy(alpha = alpha), fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal, textAlign = if (center) TextAlign.Center else TextAlign.Start),
                size = Size(w * k, 60f * k),
            )
        }
        parts.forEach { (name, p) ->
            val now = s.frame.parts[name] ?: PartFrame()
            val before = prev.parts[name] ?: now
            val a = mix(before.opacity, now.opacity)
            val dx = now.dx[0] + (now.dx.getOrElse(1) { now.dx[0] } - now.dx[0]) * move
            drawPart(p, a, dx, k, ink, soft, accent)
            p.label?.let { label(it.pick(hindi), p.x + dx - 10, p.y + (if (p.kind == "paper") (p.h ?: 38f) + 4 else 86f), p.w + 20, 12f, ink, a) }
        }
        tiles.forEachIndexed { i, tile ->
            val a = mix(prev.tiles.getOrElse(i) { 0f }, s.frame.tiles.getOrElse(i) { 0f })
            if (a <= 0.01f) return@forEachIndexed
            val focus = s.frame.tiles.getOrElse(i) { 0f } >= 0.99f && s.frame.tiles.any { it in 0.01f..0.99f }
            drawRoundRect(soft.copy(alpha = a), Offset(tile.x * k, tile.y * k), Size(tile.w * k, tile.h * k), CornerRadius(12 * k))
            if (focus) drawRoundRect(accent.copy(alpha = a), Offset(tile.x * k, tile.y * k), Size(tile.w * k, tile.h * k), CornerRadius(12 * k), style = Stroke(2.5f * k))
            drawIcon(tile.icon, Offset((tile.x + 14) * k, (tile.y + 14) * k), 22 * k, teal.copy(alpha = a))
            label(tile.label.pick(hindi), tile.x + 12, tile.y + 42, tile.w - 24, 16f, ink, a, bold = true, center = false)
            if (s.frame.tileSub == i) tile.sub?.let { label(it.pick(hindi), tile.x + 12, tile.y + 66, tile.w - 24, 12f, ink, a, center = false) }
        }
        end?.let { e ->
            val a = mix(prev.end, s.frame.end)
            if (a > 0.01f) {
                drawRoundRect(endBg.copy(alpha = a), Offset(e.x * k, e.y * k), Size(e.w * k, e.h * k), CornerRadius(16 * k))
                label(e.title.pick(hindi), e.x, e.y + e.h / 2 - 36, e.w, 30f, endInk, a, bold = true)
                e.subtitle?.let { label(it.pick(hindi), e.x, e.y + e.h / 2 + 12, e.w, 14f, endInk, a) }
            }
        }
    }
}

private fun DrawScope.drawPart(p: Part, a: Float, dx: Float, k: Float, ink: Color, soft: Color, accent: Color) {
    if (a <= 0.01f) return
    val x = (p.x + dx) * k
    val y = p.y * k
    val w = p.w * k
    when (p.kind) {
        "building" -> {
            val bodyTop = y + 30 * k
            drawRect(soft.copy(alpha = a), Offset(x, bodyTop), Size(w, 50 * k))
            for (c in 1..3) {
                val cx = x + w * c / 4f
                drawLine(ink.copy(alpha = a * 0.6f), Offset(cx, bodyTop + 8 * k), Offset(cx, bodyTop + 44 * k), 3 * k)
            }
            if (p.roof == "dome") {
                drawArc(accent.copy(alpha = a), 180f, 180f, true, Offset(x + w * 0.2f, y), Size(w * 0.6f, 60 * k))
            } else {
                val roof = Path().apply { moveTo(x - 4 * k, bodyTop); lineTo(x + w / 2, y); lineTo(x + w + 4 * k, bodyTop); close() }
                drawPath(roof, accent.copy(alpha = a))
            }
        }
        "paper" -> {
            val h = (p.h ?: 38f) * k
            drawRect(Color.White.copy(alpha = a), Offset(x, y), Size(w, h))
            drawRect(ink.copy(alpha = a), Offset(x, y), Size(w, h), style = Stroke(1.5f * k))
            for (l in 1..3) drawLine(ink.copy(alpha = a * 0.5f), Offset(x + 5 * k, y + h * l / 4.5f), Offset(x + w - 5 * k, y + h * l / 4.5f), 1.5f * k)
        }
        else -> drawRect(soft.copy(alpha = a), Offset(x, y), Size(w, (p.h ?: 40f) * k))
    }
}

private fun DrawScope.drawIcon(icon: String, at: Offset, s: Float, c: Color) {
    val stroke = Stroke(s * 0.14f, cap = StrokeCap.Round)
    when (icon) {
        "check" -> drawPath(Path().apply { moveTo(at.x, at.y + s * 0.55f); lineTo(at.x + s * 0.38f, at.y + s * 0.9f); lineTo(at.x + s, at.y + s * 0.1f) }, c, style = stroke)
        "pause" -> {
            drawRect(c, Offset(at.x + s * 0.15f, at.y), Size(s * 0.22f, s))
            drawRect(c, Offset(at.x + s * 0.63f, at.y), Size(s * 0.22f, s))
        }
        "loop-back" -> {
            drawArc(c, 200f, 260f, false, at, Size(s, s), style = stroke)
            drawPath(Path().apply { moveTo(at.x - s * 0.05f, at.y + s * 0.15f); lineTo(at.x + s * 0.05f, at.y + s * 0.5f); lineTo(at.x + s * 0.35f, at.y + s * 0.3f) }, c, style = stroke)
        }
        "arrow-right" -> {
            drawLine(c, Offset(at.x, at.y + s / 2), Offset(at.x + s, at.y + s / 2), s * 0.14f, StrokeCap.Round)
            drawPath(Path().apply { moveTo(at.x + s * 0.6f, at.y + s * 0.15f); lineTo(at.x + s, at.y + s / 2); lineTo(at.x + s * 0.6f, at.y + s * 0.85f) }, c, style = stroke)
        }
        else -> drawCircle(c, s / 3, Offset(at.x + s / 2, at.y + s / 2))
    }
}

// --- Timeline story --------------------------------------------------------------------------

@Composable
private fun TimelineStory(tl: Timeline, hindi: Boolean, library: ContentLibrary) {
    val fmt = remember(hindi) { DateTimeFormatter.ofPattern("d MMMM yyyy", if (hindi) Locale.forLanguageTag("hi-IN") else Locale.UK) }
    Text(tl.title.pick(hindi), style = MaterialTheme.typography.titleLarge)
    SvgImage(library, tl.illustration)
    val dates = tl.events.map { runCatching { LocalDate.parse(it.date) }.getOrNull() }
    tl.events.forEachIndexed { i, e ->
        val d = dates[i]
        val gap = if (i > 0 && d != null && dates[i - 1] != null) gapText(Period.between(dates[i - 1], d), hindi) else null
        if (gap != null) Text("  ⋮  $gap", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.padding(top = 6.dp).size(14.dp).background(if (e.key) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.outline, CircleShape))
            Column {
                Text(d?.format(fmt) ?: e.date, style = MaterialTheme.typography.labelLarge, color = if (e.key) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.onSurfaceVariant)
                val v = e.pick(hindi)
                Text(v.title, style = MaterialTheme.typography.titleMedium)
                Text(v.body, style = if (hindi) ReadingHindi else ReadingText)
            }
        }
    }
    Text(if (hindi) "समयरेखा पूरी ✓" else "That's the whole story ✓", style = MaterialTheme.typography.titleSmall)
}

private fun gapText(p: Period, hindi: Boolean): String = when {
    p.years > 0 && p.months > 0 -> if (hindi) "${p.years} साल ${p.months} महीने बाद" else "${p.years} yr ${p.months} mo later"
    p.years > 0 -> if (hindi) "${p.years} साल बाद" else "${p.years} year${if (p.years > 1) "s" else ""} later"
    p.months > 0 -> if (hindi) "${p.months} महीने बाद" else "${p.months} month${if (p.months > 1) "s" else ""} later"
    else -> if (hindi) "${p.days} दिन बाद" else "${p.days} day${if (p.days != 1) "s" else ""} later"
}

// --- Match the Article -----------------------------------------------------------------------

@Composable
private fun MatchTheArticle(game: MatchGame, hindi: Boolean) {
    var round by rememberSaveable { mutableIntStateOf(0) }
    val seed = LocalDate.now().toEpochDay() * 31 + round
    val pairs = remember(seed) { game.pairs.shuffled(Random(seed)).take(game.roundSize) }
    val meanings = remember(seed) { pairs.shuffled(Random(seed + 7)) }
    var picked by remember(seed) { mutableStateOf<String?>(null) }
    var matched by remember(seed) { mutableStateOf(setOf<String>()) }
    var nudge by remember(seed) { mutableStateOf<String?>(null) }

    Text(if (hindi) "पहले अनुच्छेद चुनिए, फिर उसका अर्थ। कोई टाइमर नहीं।" else "Tap an Article, then what it does. No timer.", style = MaterialTheme.typography.bodyMedium)
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Column(Modifier.weight(0.35f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            pairs.forEach { p ->
                FilterChip(
                    selected = picked == p.article, enabled = p.article !in matched,
                    onClick = { picked = p.article; nudge = null },
                    label = { Text((if (p.article in matched) "✓ " else "") + (if (hindi) "अनु. " else "Art. ") + p.article) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
        Column(Modifier.weight(0.65f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            meanings.forEach { p ->
                FilterChip(
                    selected = false, enabled = p.article !in matched,
                    onClick = {
                        val a = picked ?: return@FilterChip
                        if (a == p.article) { matched = matched + a; picked = null; nudge = null }
                        else nudge = if (hindi) "यह नहीं। फिर कोशिश कीजिए।" else "Not that one. Try again."
                    },
                    label = { Text(p.pick(hindi)) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
    nudge?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary) }
    if (matched.size == pairs.size) {
        Text(if (hindi) "सभी ${pairs.size} जोड़े मिल गए ✓" else "All ${pairs.size} matched ✓", style = MaterialTheme.typography.titleMedium)
        OutlinedButton(onClick = { round++ }) { Text(if (hindi) "एक और राउंड" else "Another round") }
    }
}

// --- Quiz night --------------------------------------------------------------------------------

@Composable
private fun QuizNight(quiz: QuizPack, hindi: Boolean) {
    var i by rememberSaveable { mutableIntStateOf(0) }
    var revealed by rememberSaveable(i) { mutableStateOf(false) }
    var picked by rememberSaveable(i) { mutableStateOf<Int?>(null) }
    if (i >= quiz.questions.size) {
        Text(if (hindi) "क्विज़ पूरी ☕ कोई स्कोर नहीं, बस दोहराई।" else "That's quiz night ☕ No scores, just revision.", style = MaterialTheme.typography.titleMedium)
        OutlinedButton(onClick = { i = 0 }) { Text(if (hindi) "फिर से" else "Start again") }
        return
    }
    val q = quiz.questions[i].pick(hindi)
    Text(if (hindi) "सवाल ${i + 1} / ${quiz.questions.size}" else "Question ${i + 1} of ${quiz.questions.size}", style = MaterialTheme.typography.labelMedium)
    Text(q.question, style = MaterialTheme.typography.titleMedium)
    q.options.forEachIndexed { j, o ->
        FilterChip(
            selected = picked == j || (revealed && j == q.answerIndex),
            onClick = { if (!revealed) picked = j },
            label = { Text((if (revealed && j == q.answerIndex) "✓ " else "") + o) },
            modifier = Modifier.fillMaxWidth(),
        )
    }
    if (revealed) Text(q.explanation, style = MaterialTheme.typography.bodyMedium)
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
        if (!revealed) Button(onClick = { revealed = true }) { Text(if (hindi) "जवाब दिखाएँ" else "Reveal the answer") }
        else Button(onClick = { i++ }) { Text(if (i == quiz.questions.lastIndex) (if (hindi) "पूरा करें" else "Finish") else (if (hindi) "अगला सवाल →" else "Next question →")) }
    }
}

// --- Map Chai ----------------------------------------------------------------------------------

@Composable
private fun MapChai(map: MapCard, hindi: Boolean, library: ContentLibrary) {
    var selected by rememberSaveable { mutableStateOf<String?>(null) }
    var finding by rememberSaveable { mutableStateOf(false) }
    var result by rememberSaveable { mutableStateOf<String?>(null) }
    Text(map.lead.pick(hindi), style = if (hindi) ReadingHindi else ReadingText)
    BoxWithConstraints(Modifier.fillMaxWidth().aspectRatio(map.canvas.width / map.canvas.height)) {
        val px = with(LocalDensity.current) { maxWidth.roundToPx() }
        val bmp by produceState<ImageBitmap?>(null, map.base, px) { value = renderSvg(library, map.base, px)?.asImageBitmap() }
        bmp?.let { Image(it, null, contentScale = ContentScale.FillBounds, modifier = Modifier.fillMaxSize()) }
            ?: Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surfaceContainerHigh))
        val pin = MaterialTheme.colorScheme.primary
        val ring = MaterialTheme.colorScheme.onPrimary
        Canvas(
            Modifier.fillMaxSize().pointerInput(finding, map) {
                detectTapGestures { tap ->
                    val k = size.width / map.canvas.width
                    if (finding) {
                        val f = map.find ?: return@detectTapGestures
                        val dx = (tap.x / k - f.target.cx) / (f.target.rx * 1.5f)
                        val dy = (tap.y / k - f.target.cy) / (f.target.ry * 1.5f)
                        result = if (dx * dx + dy * dy <= 1f) f.right.pick(hindi) else f.hint.pick(hindi)
                    } else {
                        selected = map.pins.minByOrNull { p -> (p.x * k - tap.x).let { it * it } + (p.y * k - tap.y).let { it * it } }
                            ?.takeIf { p -> (p.x * k - tap.x).let { it * it } + (p.y * k - tap.y).let { it * it } < (36.dp.toPx()).let { it * it } }?.id
                    }
                }
            },
        ) {
            if (finding) return@Canvas
            val k = size.width / map.canvas.width
            map.pins.forEach { p ->
                val c = Offset(p.x * k, p.y * k)
                drawCircle(pin, if (p.id == selected) 11.dp.toPx() else 8.dp.toPx(), c)
                drawCircle(ring, 3.dp.toPx(), c)
            }
        }
    }
    if (!finding) {
        val p = map.pins.firstOrNull { it.id == selected }?.pick(hindi)
        if (p != null) {
            Text(p.label, style = MaterialTheme.typography.titleMedium)
            Text(p.fact, style = if (hindi) ReadingHindi else ReadingText)
        } else Text(if (hindi) "किसी बिंदु पर टैप करें।" else "Tap a pin.", style = MaterialTheme.typography.bodyMedium)
    }
    map.find?.let { f ->
        if (finding) {
            Text(f.prompt.pick(hindi), style = MaterialTheme.typography.titleMedium)
            result?.let { Text(it, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.primary) }
            TextButton(onClick = { finding = false; result = null }) { Text(if (hindi) "बिंदु फिर दिखाएँ" else "Show the pins again") }
        } else OutlinedButton(onClick = { finding = true; result = null }) { Text(if (hindi) "ढूँढिए" else "Find it") }
    }
    Text(if (hindi) "नक़्शा सांकेतिक है, पैमाने पर नहीं, और इसमें सीमाएँ नहीं दिखाई गई हैं।" else "Schematic, not to scale, no borders drawn.", style = MaterialTheme.typography.labelSmall)
}

// --- Number Sense ------------------------------------------------------------------------------

@Composable
private fun NumberSense(n: NumberCard, hindi: Boolean) {
    val context = LocalContext.current
    val still = remember { reducedMotion(context) }
    val nf = remember(hindi) { NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")) }
    var shown by remember { mutableStateOf(still) }
    LaunchedEffect(Unit) { shown = true }
    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(nf.format(n.value), style = MaterialTheme.typography.displayMedium, color = MaterialTheme.colorScheme.primary)
        Text(n.unit.pick(hindi), style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 8.dp))
    }
    Text(n.lead.pick(hindi), style = if (hindi) ReadingHindi else ReadingText)
    val c = n.chart
    val span = (c.axisEnd - c.axisStart).takeIf { it > 0 } ?: 1f
    c.bars.forEach { b ->
        val target = ((b.v - c.axisStart) / span).coerceIn(0f, 1f)
        val f by animateFloatAsState(if (shown) target else 0f, tween(if (still) 0 else c.animateMs), label = "bar")
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(b.pick(hindi), style = MaterialTheme.typography.labelMedium, modifier = Modifier.width(110.dp))
            BoxWithConstraints(Modifier.weight(1f).height(26.dp)) {
                Box(Modifier.fillMaxHeight().fillMaxWidth(f).background(if (b.hero) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant))
                c.reference?.let { r ->
                    val rf = ((r - c.axisStart) / span).coerceIn(0f, 1f)
                    Box(Modifier.padding(start = maxWidth * rf).width(2.dp).fillMaxHeight().background(MaterialTheme.colorScheme.onSurface))
                }
            }
            Text(" " + nf.format(b.v.toDouble()), style = MaterialTheme.typography.labelMedium, modifier = Modifier.width(56.dp))
        }
    }
    Text(
        (if (hindi) "पैमाना " else "Axis ") + "${nf.format(c.axisStart.toDouble())}–${nf.format(c.axisEnd.toDouble())}" +
            (c.reference?.let { (if (hindi) " · रेखा " else " · line at ") + nf.format(it.toDouble()) } ?: ""),
        style = MaterialTheme.typography.labelSmall,
    )
    Text(if (hindi) "इसका मतलब" else "What it means", style = MaterialTheme.typography.titleMedium)
    n.whatItMeans.pick(hindi).forEach { Text("• $it", style = MaterialTheme.typography.bodyLarge) }
    n.sources?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
}

// --- Myth vs Fact ------------------------------------------------------------------------------

@Composable
private fun MythVsFact(m: MythCard, hindi: Boolean) {
    var i by rememberSaveable { mutableIntStateOf(0) }
    var guess by rememberSaveable(i) { mutableStateOf<String?>(null) }
    val labels = m.verdictLabels.pick(hindi)
    if (i >= m.claims.size) {
        Text(if (hindi) "सभी दावे जाँच लिए ✓ फ़ॉरवर्ड करने वाले का मज़ाक़ नहीं, बस सही जानकारी।" else "All claims checked ✓ No mocking whoever forwarded them, just the facts.", style = MaterialTheme.typography.titleMedium)
        OutlinedButton(onClick = { i = 0 }) { Text(if (hindi) "फिर से" else "Start again") }
        m.source?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
        return
    }
    val c = m.claims[i]
    val t = c.pick(hindi)
    Text(if (hindi) "दावा ${i + 1} / ${m.claims.size}" else "Claim ${i + 1} of ${m.claims.size}", style = MaterialTheme.typography.labelMedium)
    Text("“${t.claim}”", style = MaterialTheme.typography.titleMedium)
    if (guess == null) {
        Text(if (hindi) "आपको क्या लगता है?" else "What do you think?", style = MaterialTheme.typography.bodyMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("MYTH", "FACT", "HALF").forEach { v -> OutlinedButton(onClick = { guess = v }) { Text(labels[v] ?: v) } }
        }
    } else {
        val right = guess == c.verdict
        Text(
            labels[c.verdict] ?: c.verdict,
            style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold,
            color = when (c.verdict) { "FACT" -> MaterialTheme.colorScheme.tertiary; "MYTH" -> MaterialTheme.colorScheme.error; else -> MaterialTheme.colorScheme.primary },
        )
        Text(if (right) (if (hindi) "आपने सही पहचाना।" else "You called it.") else (if (hindi) "आपने कहा: ${labels[guess] ?: guess}" else "You said: ${labels[guess] ?: guess}"), style = MaterialTheme.typography.labelLarge)
        Text(t.correction, style = if (hindi) ReadingHindi else ReadingText)
        Button(onClick = { i++ }) { Text(if (hindi) "अगला दावा →" else "Next claim →") }
    }
}

// --- Two Sides ---------------------------------------------------------------------------------

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TwoSidesView(d: TwoSides, hindi: Boolean) {
    var opened by rememberSaveable { mutableStateOf(setOf<String>()) }
    val pro = d.pro.pick(hindi)
    val con = d.against.pick(hindi)
    Text(d.paper, style = MaterialTheme.typography.labelMedium)
    Text(d.question.pick(hindi), style = MaterialTheme.typography.titleLarge)
    @Composable
    fun side(title: String, key: String, points: List<String>) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        points.forEachIndexed { i, p ->
            val id = "$key$i"
            FlatCard(Modifier.clickable { opened = opened + id }) {
                Text(
                    if (id in opened) p else (if (hindi) "बिंदु ${i + 1} · खोलने के लिए टैप करें" else "Point ${i + 1} · tap to open"),
                    style = if (id in opened) MaterialTheme.typography.bodyLarge else MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(12.dp),
                )
            }
        }
    }
    side(if (hindi) "पक्ष में" else "For", "f", pro)
    side(if (hindi) "विपक्ष में" else "Against", "a", con)
    if (opened.size >= pro.size + con.size) {
        Text(if (hindi) "उत्तर की रूपरेखा" else "Answer outline", style = MaterialTheme.typography.titleMedium)
        d.outline.pick(hindi).forEachIndexed { i, o -> Text("${i + 1}. $o", style = MaterialTheme.typography.bodyLarge) }
    } else {
        Text(if (hindi) "सभी बिंदु खोलने पर उत्तर की रूपरेखा दिखेगी।" else "Open all the points to see the answer outline.", style = MaterialTheme.typography.bodySmall)
    }
    d.sources?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
}

// --- Lamp Off ----------------------------------------------------------------------------------

/** Two quiet minutes after Close the Day. Always dark, never shareable, nothing below the end line. */
@Composable
fun LampOff(w: Winddown, library: ContentLibrary, hindi: Boolean, onClose: () -> Unit) {
    val context = LocalContext.current
    val still = remember { reducedMotion(context) }
    val text = w.text.pick(hindi)
    var started by rememberSaveable { mutableStateOf(false) }
    var sound by rememberSaveable { mutableStateOf(false) }
    val lamp = remember { Animatable(1f) }
    val bed = rememberLoopPlayer()
    LaunchedEffect(started) {
        if (!started) return@LaunchedEffect
        if (still) lamp.snapTo(0f) else lamp.animateTo(0f, tween(w.seconds * 1000, easing = LinearEasing))
    }
    LaunchedEffect(sound, started) {
        if (sound && started && !library.dataSaver()) w.audio.file?.let { p -> library.audio(p)?.let { bed.play(it, p, w.audio.gain) } } else bed.stop()
    }
    LaunchedEffect(lamp.value) { if (sound) bed.setGain(w.audio.gain * lamp.value) }
    val done = started && lamp.value <= 0.001f
    val night = Color(0xFF0E0A07)
    val glowColor = Color(0xFFE8A066)
    Box(Modifier.fillMaxSize().background(night)) {
        Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(Modifier.fillMaxWidth()) {
                TextButton(onClick = onClose) { Text(if (hindi) "← वापस" else "← Back", color = Color(0xFF9A8D82)) }
                Spacer(Modifier.weight(1f))
                TextButton(onClick = { sound = !sound }) { Text(if (sound) "♪ On" else "♪ Off", color = Color(0xFF9A8D82)) }
            }
            Spacer(Modifier.weight(1f))
            Canvas(Modifier.size(220.dp)) {
                val a = lamp.value
                val c = Offset(size.width / 2, size.height * 0.55f)
                drawCircle(Brush.radialGradient(listOf(glowColor.copy(alpha = 0.45f * a), Color.Transparent), c, size.minDimension / 2), size.minDimension / 2, c)
                val flame = Path().apply {
                    moveTo(c.x, c.y - 70f)
                    cubicTo(c.x + 38f, c.y - 10f, c.x + 30f, c.y + 34f, c.x, c.y + 36f)
                    cubicTo(c.x - 30f, c.y + 34f, c.x - 38f, c.y - 10f, c.x, c.y - 70f)
                    close()
                }
                drawPath(flame, Color(0xFFF2C14E).copy(alpha = 0.08f + 0.92f * a))
                drawRoundRect(Color(0xFF6B4A2E), Offset(c.x - 60f, c.y + 40f), Size(120f, 34f), CornerRadius(17f))
            }
            Spacer(Modifier.height(24.dp))
            val line = when { done -> text.end; started -> text.cue; else -> text.start }
            Text(line, style = (if (hindi) ReadingHindi else ReadingText).copy(fontSize = 20.sp, textAlign = TextAlign.Center), color = Color(0xFFDCD2C9), modifier = Modifier.alpha(if (done) 1f else 0.9f))
            Spacer(Modifier.weight(1f))
            if (!started) {
                OutlinedButton(onClick = { started = true }) { Text(text.button, color = Color(0xFFE8A066)) }
            }
            Spacer(Modifier.height(32.dp))
        }
    }
}
