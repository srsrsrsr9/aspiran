package com.upscpods.app.ui

import android.media.MediaPlayer
import android.media.PlaybackParams
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.upscpods.app.data.Assemble
import com.upscpods.app.data.Chain
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.Postcard
import com.upscpods.app.data.Radio
import com.upscpods.app.data.ScratchCard
import com.upscpods.app.data.ScratchText
import com.upscpods.app.data.SoundRef
import com.upscpods.app.data.StampTrail
import com.upscpods.app.data.ThenNow
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import java.text.NumberFormat
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.random.Random

/**
 * Sound effects for one item. Silent until the member turns sound on, never for tragic items
 * (the server sends none) and never in data saver. Files are fetched once, when sound goes on.
 */
class Sfx(private val library: ContentLibrary, private val sounds: Map<String, SoundRef>, tone: String, private val scope: CoroutineScope) {
    val available = sounds.isNotEmpty() && !tone.equals("TRAGIC", ignoreCase = true) && !library.dataSaver()
    var on by mutableStateOf(false)
        private set
    private val files = mutableMapOf<String, File>()
    private val live = mutableListOf<MediaPlayer>()
    private val bed = LoopPlayer()
    private var bedWanted = true
    private val bedRole = sounds.keys.firstOrNull { it == "bed" } ?: sounds.entries.firstOrNull { it.value.loop }?.key

    fun toggle() {
        if (!available) return
        on = !on
        if (!on) return release()
        scope.launch {
            for ((role, s) in sounds) s.best?.let { p -> library.file(p)?.let { files[role] = it } }
            if (bedWanted) startBed()
        }
    }

    /** A one-shot effect; [rate] above 1 raises the pitch (the domino run). */
    fun play(role: String, rate: Float = 1f, volume: Float = 1f) {
        if (!on) return
        val f = files[role] ?: return
        val gain = ((sounds[role]?.gain ?: 0.5f) * volume).coerceIn(0f, 1f)
        if (live.size >= 6) live.removeAt(0).also { runCatching { it.release() } }
        runCatching {
            MediaPlayer().apply {
                setDataSource(f.absolutePath)
                setVolume(gain, gain)
                setOnCompletionListener { live.remove(it); it.release() }
                prepare()
                if (rate != 1f) playbackParams = PlaybackParams().setPitch(rate).setSpeed(rate)
                start()
            }
        }.getOrNull()?.let { live.add(it) }
    }

    /** The first of [roles] this item has a sound for (types name the same moment differently). */
    fun playAny(vararg roles: String) {
        roles.firstOrNull { it in sounds }?.let { play(it) }
    }

    private fun startBed() {
        val role = bedRole ?: return
        val f = files[role] ?: return
        if (on) bed.play(f, role, sounds[role]?.gain ?: 0.5f, loop = true)
    }

    fun bedGain(x: Float) = bed.setGain(((sounds[bedRole]?.gain ?: 0.5f) * x).coerceIn(0f, 1f))

    /** The background loop ends with the piece. */
    fun stopBed() {
        bedWanted = false
        bed.stop()
    }

    fun release() {
        bed.stop()
        live.forEach { runCatching { it.release() } }
        live.clear()
    }
}

@Composable
fun rememberSfx(library: ContentLibrary, sounds: Map<String, SoundRef>, tone: String): Sfx {
    val scope = rememberCoroutineScope()
    val sfx = remember(sounds) { Sfx(library, sounds, tone, scope) }
    DisposableEffect(sfx) { onDispose { sfx.release() } }
    return sfx
}

@Composable
fun SoundToggle(sfx: Sfx, hindi: Boolean) {
    if (!sfx.available) return
    OutlinedButton(onClick = { sfx.toggle() }) {
        Text(if (sfx.on) (if (hindi) "🔊 आवाज़ चालू" else "🔊 Sound on") else (if (hindi) "🔈 आवाज़ बंद" else "🔈 Sound off"))
    }
}

private val Chai = Color(0xFFB07A45)
private val Ink = Color(0xFFB3261E)

private fun num(v: Double): String = NumberFormat.getNumberInstance().apply { maximumFractionDigits = 2 }.format(v)

/** Text that types itself out; with motion off it's simply there. */
@Composable
private fun TypeOut(text: String, still: Boolean) {
    var n by remember(text) { mutableIntStateOf(if (still) text.length else 0) }
    LaunchedEffect(text) {
        while (n < text.length) { delay(18); n++ }
    }
    Text(text.take(n), style = MaterialTheme.typography.bodyLarge)
}

// --- Scratch and reveal ------------------------------------------------------------------------

@Composable
fun ScratchAndReveal(s: ScratchCard, hindi: Boolean, library: ContentLibrary) {
    val still = reducedMotion(LocalContext.current)
    val sfx = rememberSfx(library, s.sounds, s.tone)
    Text(s.title.pick(hindi), style = MaterialTheme.typography.headlineSmall)
    SoundToggle(sfx, hindi)
    s.cards.forEach { ScratchOne(it.pick(hindi), sfx, still, hindi) }
    s.sources?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
}

@Composable
private fun ScratchOne(t: ScratchText, sfx: Sfx, still: Boolean, hindi: Boolean) {
    val cols = 14
    val rows = 5
    val cleared = remember(t) { mutableStateListOf<Boolean>().apply { repeat(cols * rows) { add(false) } } }
    var revealed by rememberSaveable(t.answer) { mutableStateOf(false) }
    var lastScrape by remember { mutableLongStateOf(0L) }
    fun reveal() {
        if (revealed) return
        revealed = true
        sfx.play("reveal")
    }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(t.tease, style = MaterialTheme.typography.titleMedium)
        Box(
            Modifier.fillMaxWidth().height(88.dp)
                .background(MaterialTheme.colorScheme.secondaryContainer, RoundedCornerShape(12.dp))
                .pointerInput(t, still) {
                    // With motion off, one tap shows the answer.
                    if (still) detectTapGestures { reveal() }
                    else detectDragGestures { change, drag ->
                        if (revealed) return@detectDragGestures
                        val cx = (change.position.x / size.width * cols).toInt()
                        val cy = (change.position.y / size.height * rows).toInt()
                        for (dx in -1..1) for (dy in -1..1) {
                            val x = cx + dx
                            val y = cy + dy
                            if (x in 0 until cols && y in 0 until rows) cleared[y * cols + x] = true
                        }
                        // The scrape follows the finger: louder when faster, never a constant drone.
                        val now = System.currentTimeMillis()
                        if (now - lastScrape > 140) {
                            lastScrape = now
                            sfx.play("scrape", volume = (drag.getDistance() / 40f).coerceIn(0.25f, 1f))
                        }
                        if (cleared.count { it } >= 0.55 * cols * rows) reveal()
                    }
                },
            contentAlignment = Alignment.Center,
        ) {
            Text(t.answer, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, modifier = Modifier.padding(8.dp))
            if (!revealed) Canvas(Modifier.fillMaxSize()) {
                val w = size.width / cols
                val h = size.height / rows
                for (i in cleared.indices) if (!cleared[i]) {
                    drawRect(Chai, Offset((i % cols) * w, (i / cols) * h), Size(w + 1, h + 1))
                }
            }
        }
        if (!revealed) TextButton(onClick = { reveal() }) {
            Text(if (still) (if (hindi) "टैप करके देखें" else "Tap to see") else (if (hindi) "सीधे दिखाइए" else "Just show me"))
        }
        else if (t.detail.isNotBlank()) Text(t.detail, style = MaterialTheme.typography.bodyMedium)
    }
}

// --- Stamp trail -------------------------------------------------------------------------------

@Composable
fun StampTrailView(t: StampTrail, hindi: Boolean, library: ContentLibrary) {
    val still = reducedMotion(LocalContext.current)
    val sfx = rememberSfx(library, t.sounds, t.tone)
    val scope = rememberCoroutineScope()
    var stamped by rememberSaveable(t.id) { mutableIntStateOf(0) }
    val squash = remember { Animatable(1f) }
    val slide = remember { Animatable(0f) }
    val done = stamped >= t.stations.size
    Text(t.title.pick(hindi), style = MaterialTheme.typography.headlineSmall)
    SoundToggle(sfx, hindi)
    t.stations.forEachIndexed { i, s ->
        val v = s.pick(hindi)
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("${i + 1}. ${v.name}", fontWeight = FontWeight.Bold, color = if (i <= stamped) Color.Unspecified else MaterialTheme.colorScheme.outline)
                if (i < stamped && v.rule.isNotBlank()) Text(v.rule, style = MaterialTheme.typography.bodySmall)
            }
            when {
                i < stamped -> Text(
                    v.stamp.uppercase(), color = Ink, fontWeight = FontWeight.Bold, fontSize = 13.sp,
                    modifier = Modifier
                        .graphicsLayer { if (i == stamped - 1) { scaleX = squash.value; scaleY = 2f - squash.value } }
                        .rotate(-8f).border(BorderStroke(2.dp, Ink), RoundedCornerShape(4.dp)).padding(horizontal = 6.dp, vertical = 2.dp),
                )
                i == stamped -> Text(
                    "📜 " + t.item.pick(hindi), style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.graphicsLayer { translationX = -slide.value * 160f; alpha = 1f - slide.value }
                        .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 4.dp),
                )
            }
        }
    }
    if (!done) {
        val next = t.stations[stamped].pick(hindi).stamp
        Button(onClick = {
            scope.launch {
                sfx.play("stamp")
                stamped++
                if (!still) {
                    // Thud: a 200 ms squash, then the item slides on to the next desk.
                    squash.snapTo(1.3f)
                    squash.animateTo(1f, tween(200))
                }
                if (stamped < t.stations.size) {
                    sfx.play("move")
                    if (!still) { slide.snapTo(1f); slide.animateTo(0f, tween(350)) }
                } else sfx.play("end")
            }
        }) { Text((if (hindi) "मुहर लगाइए: " else "Stamp: ") + next) }
    } else {
        Text(if (hindi) "सफ़र पूरा ✓" else "Journey complete ✓", style = MaterialTheme.typography.titleMedium)
        t.takeaway?.let { Text(it.pick(hindi)) }
        TextButton(onClick = { stamped = 0 }) { Text(if (hindi) "फिर से" else "Again") }
    }
    t.sources?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
}

// --- Chai stall radio --------------------------------------------------------------------------

@Composable
fun RadioView(r: Radio, hindi: Boolean, library: ContentLibrary) {
    val still = reducedMotion(LocalContext.current)
    val sfx = rememberSfx(library, r.sounds, r.tone)
    val stations = remember(r) { r.stations.sortedBy { it.freq } }
    if (stations.isEmpty()) return
    val lo = stations.first().freq - 2f
    val hi = stations.last().freq + 2f
    var dial by rememberSaveable(r.id) { mutableFloatStateOf(lo) }
    val heard = remember(r) { mutableStateListOf<Int>() }
    val tuned = stations.indexOfFirst { abs(it.freq - dial) < 0.35f }
    val allHeard = heard.size == stations.size
    LaunchedEffect(tuned) {
        if (tuned >= 0) {
            sfx.play("tune")
            if (tuned !in heard) heard.add(tuned)
        }
    }
    // Static fades as the dial nears a station.
    LaunchedEffect(dial, sfx.on) {
        val d = stations.minOf { abs(it.freq - dial) }
        sfx.bedGain(if (tuned >= 0) 0.12f else (0.35f + d / 2f).coerceAtMost(1f))
    }
    LaunchedEffect(allHeard) {
        if (allHeard) { delay(if (still) 0 else 1500); sfx.stopBed(); sfx.play("end") }
    }
    Text(r.title.pick(hindi), style = MaterialTheme.typography.headlineSmall)
    Text(r.desk.pick(hindi), style = MaterialTheme.typography.titleMedium)
    SoundToggle(sfx, hindi)
    Box(Modifier.fillMaxWidth().background(Color(0xFF2B211B), RoundedCornerShape(12.dp)).padding(12.dp)) {
        Text("%.1f FM".format(dial), color = Color(0xFFFFC870), fontSize = 28.sp, fontWeight = FontWeight.Bold)
    }
    Slider(value = dial, onValueChange = { dial = it }, valueRange = lo..hi)
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        stations.forEachIndexed { i, s ->
            Text((if (i in heard) "● " else "○ ") + "%.1f".format(s.freq), style = MaterialTheme.typography.labelMedium)
        }
    }
    TextButton(onClick = {
        val next = stations.firstOrNull { it.freq > dial + 0.35f } ?: stations.first()
        dial = next.freq
    }) { Text(if (hindi) "अगला स्टेशन" else "Next station") }
    if (tuned >= 0) {
        val b = stations[tuned].pick(hindi)
        Text(b.callsign, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        TypeOut(b.lines.joinToString("\n\n"), still)
    } else if (!allHeard) {
        Text(if (hindi) "डायल घुमाइए… सिर्फ़ खरखराहट" else "Turn the dial… only static here", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.outline)
    }
    if (allHeard) r.signoff?.let { Text(it.pick(hindi), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium) }
    r.sources?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
}

// --- Snap together -----------------------------------------------------------------------------

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AssembleView(a: Assemble, hindi: Boolean, library: ContentLibrary) {
    val still = reducedMotion(LocalContext.current)
    val sfx = rememberSfx(library, a.sounds, a.tone)
    val scope = rememberCoroutineScope()
    val tray = remember(a) {
        val order = a.pieces.indices.toList()
        order.shuffled(Random(a.id.hashCode())).let { if (it == order) it.reversed() else it }
    }
    var placed by rememberSaveable(a.id) { mutableIntStateOf(0) }
    var wrong by remember { mutableIntStateOf(-1) }
    val wobble = remember { Animatable(0f) }
    val pop = remember { Animatable(1f) }
    Text(a.title.pick(hindi), style = MaterialTheme.typography.headlineSmall)
    Text(a.prompt.pick(hindi))
    SoundToggle(sfx, hindi)
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        a.pieces.forEachIndexed { i, p ->
            val filled = i < placed
            Text(
                if (filled) p.pick(hindi).text else "    ${i + 1}    ",
                modifier = Modifier
                    .graphicsLayer { if (i == placed - 1) { scaleX = pop.value; scaleY = pop.value } }
                    .background(if (filled) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            )
        }
    }
    if (placed in 1..a.pieces.size) a.pieces[placed - 1].pick(hindi).note.takeIf { it.isNotBlank() }?.let {
        Text(it, style = MaterialTheme.typography.bodySmall)
    }
    if (placed < a.pieces.size) {
        Text(if (hindi) "अगला टुकड़ा चुनिए:" else "Pick the next piece:", style = MaterialTheme.typography.labelLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            tray.filter { it >= placed }.forEach { idx ->
                OutlinedButton(
                    modifier = Modifier.graphicsLayer { if (idx == wrong) translationX = wobble.value },
                    onClick = {
                        if (idx == placed) {
                            wrong = -1
                            placed++
                            sfx.play(if (placed == a.pieces.size) "done" else "snap")
                            if (!still) scope.launch { pop.snapTo(0.7f); pop.animateTo(1f, spring(dampingRatio = 0.45f)) }
                        } else {
                            wrong = idx
                            sfx.play("wrong")
                            if (!still) scope.launch { for (x in listOf(12f, -10f, 7f, -4f, 0f)) wobble.animateTo(x, tween(45)) }
                        }
                    },
                ) { Text(a.pieces[idx].pick(hindi).text) }
            }
        }
    } else {
        Text(if (hindi) "पूरा जुड़ गया ✓" else "All snapped together ✓", style = MaterialTheme.typography.titleMedium)
        a.explain?.let { Text(it.pick(hindi)) }
        TextButton(onClick = { placed = 0 }) { Text(if (hindi) "फिर से" else "Again") }
    }
    a.sources?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
}

// --- Domino effect -----------------------------------------------------------------------------

@Composable
fun ChainView(c: Chain, hindi: Boolean, library: ContentLibrary) {
    val still = reducedMotion(LocalContext.current)
    val sfx = rememberSfx(library, c.sounds, c.tone)
    val scope = rememberCoroutineScope()
    var fallen by rememberSaveable(c.id) { mutableIntStateOf(0) }
    var running by remember { mutableStateOf(false) }
    var answer by rememberSaveable(c.id) { mutableStateOf(false) }
    Text(c.title.pick(hindi), style = MaterialTheme.typography.headlineSmall)
    SoundToggle(sfx, hindi)
    c.links.forEachIndexed { i, l ->
        val angle by animateFloatAsState(if (i < fallen) 70f else 0f, tween(if (still) 0 else 260), label = "domino")
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.width(28.dp).height(36.dp), contentAlignment = Alignment.BottomCenter) {
                Box(Modifier.size(10.dp, 30.dp).graphicsLayer { rotationZ = angle; transformOrigin = androidx.compose.ui.graphics.TransformOrigin(1f, 1f) }
                    .background(if (i < fallen) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline, RoundedCornerShape(2.dp)))
            }
            Spacer(Modifier.width(8.dp))
            Text(l.pick(hindi), modifier = Modifier.graphicsLayer { alpha = if (i < fallen) 1f else 0.3f })
        }
    }
    if (fallen < c.links.size) {
        Button(enabled = !running, onClick = {
            running = true
            scope.launch {
                if (still) {
                    fallen = c.links.size
                    sfx.play("fall")
                } else for (i in c.links.indices) {
                    // Each click a little higher than the last.
                    fallen = i + 1
                    sfx.play("fall", rate = 1f + 0.07f * i)
                    delay(600)
                }
                sfx.play("end")
                running = false
            }
        }) { Text(if (hindi) "पहला डोमिनो गिराइए" else "Tip the first domino") }
    } else c.breakIt?.pick(hindi)?.let { b ->
        Text(b.question, style = MaterialTheme.typography.titleMedium)
        if (answer) Text(b.answer) else TextButton(onClick = { answer = true }) { Text(if (hindi) "जवाब देखिए" else "Show the answer") }
    }
    c.sources?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
}

// --- Then and now ------------------------------------------------------------------------------

@Composable
fun ThenNowView(t: ThenNow, hindi: Boolean, library: ContentLibrary) {
    val sfx = rememberSfx(library, t.sounds, t.tone)
    var pos by rememberSaveable(t.id) { mutableFloatStateOf(0f) }
    var tick by remember { mutableIntStateOf(0) }
    var ended by remember { mutableStateOf(false) }
    Text(t.title.pick(hindi), style = MaterialTheme.typography.headlineSmall)
    SoundToggle(sfx, hindi)
    Row(Modifier.fillMaxWidth()) {
        Text("${t.from.year}", fontWeight = if (pos == 0f) FontWeight.Bold else FontWeight.Normal)
        Spacer(Modifier.weight(1f))
        Text("${t.to.year}", fontWeight = if (pos == 1f) FontWeight.Bold else FontWeight.Normal)
    }
    Slider(value = pos, steps = 9, onValueChange = { v ->
        val step = (v * 10).roundToInt()
        if (step != tick) { tick = step; sfx.play("tick") }
        pos = v
        if (v >= 1f && !ended) { ended = true; sfx.play("end") }
    })
    val primary = MaterialTheme.colorScheme.primary
    val track = MaterialTheme.colorScheme.surfaceVariant
    val ghost = MaterialTheme.colorScheme.outline
    t.metrics.forEach { m ->
        val l = m.pick(hindi)
        // Only the two real counts are ever printed; between them the bar moves without a number.
        val shown = when (pos) { 0f -> num(m.from) + " " + l.unit; 1f -> num(m.to) + " " + l.unit; else -> "" }
        Row(Modifier.fillMaxWidth()) {
            Text(l.label, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
            Text(shown, style = MaterialTheme.typography.labelLarge)
        }
        Canvas(Modifier.fillMaxWidth().height(14.dp)) {
            val max = m.max.coerceAtLeast(1e-9)
            drawRoundRect(track, cornerRadius = CornerRadius(7f))
            val now = (m.from + (m.to - m.from) * pos) / max
            drawRoundRect(primary, size = Size(size.width * now.toFloat().coerceIn(0f, 1f), size.height), cornerRadius = CornerRadius(7f))
            val then = (m.from / max).toFloat().coerceIn(0f, 1f) * size.width
            drawLine(ghost, Offset(then, 0f), Offset(then, size.height), strokeWidth = 3f)
        }
    }
    if (pos > 0f && pos < 1f) Text(
        if (hindi) "गिनती सिर्फ़ ${t.from.year} और ${t.to.year} में हुई; बीच के आँकड़े नहीं दिखाते।" else "Counted only in ${t.from.year} and ${t.to.year}; we don't show guesses in between.",
        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline,
    )
    if (pos == 1f) t.takeaway?.let { Text(it.pick(hindi), style = MaterialTheme.typography.bodyLarge) }
    t.note?.let { Text(it.pick(hindi), style = MaterialTheme.typography.bodySmall) }
    t.sources?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
}

// --- Postcards ---------------------------------------------------------------------------------

@Composable
fun PostcardView(p: Postcard, hindi: Boolean, library: ContentLibrary) {
    val still = reducedMotion(LocalContext.current)
    val sfx = rememberSfx(library, p.sounds, p.tone)
    var flipped by rememberSaveable(p.id) { mutableStateOf(false) }
    var postmarked by remember { mutableStateOf(false) }
    val rot by animateFloatAsState(if (flipped) 180f else 0f, tween(if (still) 0 else 400), label = "flip")
    LaunchedEffect(flipped) {
        if (flipped && !postmarked) {
            if (!still) delay(400)
            sfx.play("stamp")
            postmarked = true
        }
    }
    SoundToggle(sfx, hindi)
    val paper = Color(0xFFFFF4E0)
    val inkText = Color(0xFF3A2A1C)
    Box(
        Modifier.fillMaxWidth().aspectRatio(1.45f)
            .graphicsLayer { rotationY = rot; cameraDistance = 14f * density }
            .clickable { sfx.play("flip"); flipped = !flipped }
            .background(paper, RoundedCornerShape(10.dp))
            .border(1.dp, Chai, RoundedCornerShape(10.dp)),
    ) {
        if (rot <= 90f) Box(Modifier.fillMaxSize().padding(16.dp)) {
            Column(Modifier.align(Alignment.BottomStart)) {
                Text(p.greeting.pick(hindi), color = inkText, style = MaterialTheme.typography.bodyMedium)
                Text(p.place.pick(hindi), color = inkText, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            }
            Text(
                p.stamp.pick(hindi), color = Ink, fontSize = 12.sp, textAlign = TextAlign.Center,
                modifier = Modifier.align(Alignment.TopEnd).border(BorderStroke(2.dp, Ink), RoundedCornerShape(2.dp)).padding(8.dp),
            )
        } else Box(Modifier.fillMaxSize().graphicsLayer { rotationY = 180f }.padding(16.dp)) {
            Column(Modifier.align(Alignment.TopStart).padding(end = 64.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                p.facts.pick(hindi).forEach { Text("• $it", color = inkText, style = MaterialTheme.typography.bodySmall) }
            }
            if (postmarked) Box(
                Modifier.align(Alignment.TopEnd).size(56.dp).rotate(-12f).border(BorderStroke(2.dp, Ink.copy(alpha = 0.7f)), CircleShape),
                contentAlignment = Alignment.Center,
            ) { Text(p.place.pick(hindi).take(10), color = Ink.copy(alpha = 0.7f), fontSize = 9.sp, textAlign = TextAlign.Center) }
        }
    }
    Text(if (flipped) (if (hindi) "पलटने के लिए टैप करें" else "Tap to turn back") else (if (hindi) "पीछे पढ़ने के लिए पलटिए" else "Tap to turn it over"),
        style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.outline)
    p.sources?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall) }
}
