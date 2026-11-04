package com.upscpods.app.ui

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.MapNode
import com.upscpods.app.data.MapState
import com.upscpods.app.data.SYLLABUS_LINES
import com.upscpods.app.data.SyllabusPaper
import com.upscpods.app.data.nodePrefix
import java.time.LocalDate
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

// The syllabus as a creeper garden. One vine per paper rises from the earth into the sky; every topic is a branch and
// every line of UPSC's syllabus a leaf. A leaf starts silvery and lights up with its topic: Met is a light green leaf,
// Can recall a deep green one, Can use deep green with a marigold flower at the branch tip. Lit leaves glow (gold by
// day, green at night). The whole syllabus is on one screen on purpose: the breadth is the point. No percentages, no
// comparison with anyone. The vines grow in once per app start (about a second and a half) unless the phone has
// animations off; after that nothing moves. The web copy is vine.js; keep the two in step (same layout, same hash).

data class VineLeaf(val line: String, val node: String?, val state: MapState)
data class VineBranch(val node: String?, val label: String, val paper: String?, val state: MapState?, val leaves: List<VineLeaf>)
data class Vine(val id: String, val label: String, val name: String, val lead: String, val branches: List<VineBranch>, val seedling: Boolean = false)
data class GardenCounts(val papers: Int, val topics: Int, val lines: Int, val lit: Int)

private fun SyllabusPaper.nodeAt(i: Int) = "${nodePrefix()}-${i + 1}"

/**
 * Papers into vines. A common paper is a vine whose branches are its topics and whose leaves are the topic's syllabus
 * lines (all lit together with the topic). The optional's two papers make one vine, and the two qualifying language
 * papers another; there each branch is a paper and each leaf a topic with its own state.
 */
fun vinesOf(papers: List<SyllabusPaper>, map: Map<String, MapNode>, hasOptional: Boolean, day: LocalDate = LocalDate.now()): List<Vine> {
    fun st(id: String) = map[id]?.state(day) ?: MapState.NONE
    val vines = papers.filter { it.forOptional == null && SYLLABUS_LINES[it.nodeAt(0)] != null }.map { p ->
        Vine(p.id, p.short, p.name, p.lead, p.topics.mapIndexed { i, t ->
            val node = p.nodeAt(i); val s = st(node)
            VineBranch(node, t.name, null, s, (SYLLABUS_LINES[node] ?: listOf(t.name)).map { VineLeaf(it, node, s) })
        })
    }.toMutableList()
    fun group(id: String, label: String, name: String, lead: String, ps: List<SyllabusPaper>) {
        if (ps.isEmpty()) return
        vines += Vine(id, label, name, lead, ps.map { p ->
            VineBranch(null, p.name, p.id, null, p.topics.indices.map { i -> VineLeaf(p.topics[i].name, p.nodeAt(i), st(p.nodeAt(i))) })
        })
    }
    group("optional", "Optional", "Your optional", "Two papers of 250 marks each, in the subject you choose.", papers.filter { it.forOptional != null })
    if (!hasOptional) vines += Vine("optional", "Optional", "Your optional", "Tell us your optional and its two papers grow here.", emptyList(), seedling = true)
    group("qualifying", "Lang", "Qualifying language papers", "Paper A (an Indian language) and Paper B (English). Qualifying, 25% to pass.",
        papers.filter { it.id == "lang" || it.id == "english" })
    return vines
}

fun countsOf(vines: List<Vine>): GardenCounts {
    var topics = 0; var lines = 0; var lit = 0
    for (v in vines) for (b in v.branches) {
        topics += if (b.paper != null) b.leaves.size else 1
        lines += b.leaves.size; lit += b.leaves.count { it.state != MapState.NONE }
    }
    val papers = vines.filter { !it.seedling }.sumOf { v -> if (v.branches.firstOrNull()?.paper != null) v.branches.size else 1 }
    return GardenCounts(papers, topics, lines, lit)
}

// --- Colours (index.html's --g-* and --leaf-* tokens) ----------------------------------------------------------

private class GardenColors(
    val sky1: Color, val sky2: Color, val ground: Color, val ground2: Color, val stem: Color, val twig: Color,
    val noneStroke: Color, val noneFill: Color, val met: Color, val recall: Color, val use: Color, val glow: Color,
    val bloom: Color, val bloomEye: Color, val star: Color, val label: Color,
)

private val DayColors = GardenColors(
    Color(0xFFE9ECF8), Color(0xFFFBEFE2), Color(0xFF6B4E36), Color(0xFF4E3725), Color(0xFF5B7446), Color(0xFF6E8A55),
    Color(0xFFA3AFA0), Color(0x9EC4CCC2), Color(0xFF8BC85A), Color(0xFF3E9B4F), Color(0xFF1F7A3E), Color(0xE6FFBE46),
    Color(0xFFE58B2A), Color(0xFF7A3B0B), Color.Transparent, Color(0xFFF6EADB),
)
private val NightColors = GardenColors(
    Color(0xFF070A18), Color(0xFF151A3A), Color(0xFF2A1D13), Color(0xFF1A110A), Color(0xFF4D6E4C), Color(0xFF5A7F57),
    Color(0xFF56658A), Color(0x616070A0), Color(0xFF6DB36F), Color(0xFF9BE38C), Color(0xFFC6FFA6), Color(0xBF9BE38C),
    Color(0xFFF0A04B), Color(0xFFFFE0A8), Color(0xB3EEEAF6), Color(0xFFE8D8C4),
)

@Composable
private fun gardenColors() = if (isDark()) NightColors else DayColors

// --- Geometry (a port of vine.js) -----------------------------------------------------------------------------

/** The same steady number from an id as vine.js's jitter, so a leaf sits in the same place on web and phone. */
private fun jitter(id: String): Float {
    var x = 2166136261.toInt()
    for (c in id) x = (x xor c.code) * 16777619
    x = x xor (x ushr 15); x *= 2246822507L.toInt(); x = x xor (x ushr 13); x *= 3266489909L.toInt(); x = x xor (x ushr 16)
    return ((x.toLong() and 0xFFFFFFFFL) % 10000).toFloat() / 10000f - 0.5f
}

private fun leafPath(l: Float) = Path().apply {
    moveTo(0f, 0f); quadraticTo(l * 0.45f, -l * 0.42f, l, 0f); quadraticTo(l * 0.45f, l * 0.42f, 0f, 0f); close()
}

private class Pt(val x: Float, val y: Float, val a: Float)

private fun bez(p0: Offset, p1: Offset, p2: Offset, p3: Offset, t: Float): Pt {
    val u = 1 - t
    val x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x
    val y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    val dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x)
    val dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
    return Pt(x, y, (atan2(dy, dx) * 180 / PI).toFloat())
}

private class BranchOpts(val leaf: Float, val step: Float, val base: Float, val reach: Float, val twig: Float, val flat: Float = 1f, val from: Float = 0.16f)
private class LeafAt(val x: Float, val y: Float, val angle: Float, val len: Float, val state: MapState)
private class Sprig(val twig: Path, val curl: Path, val width: Float, val leaves: List<LeafAt>, val bloom: Offset?, val bloomSize: Float)

/** One branch from the stem at (x, y) out to one side, rising a little, its leaves alternating above and below. */
private fun sprig(b: VineBranch, x: Float, y: Float, side: Int, o: BranchOpts, seed: String): Sprig {
    val n = max(1, b.leaves.size)
    val len = min(o.reach, o.base + n * o.step / 2)
    val rise = len * (0.32f + jitter(seed + "r") * 0.12f) * o.flat
    val p0 = Offset(x, y); val p3 = Offset(x + side * len, y - rise)
    val p1 = Offset(x + side * len * 0.35f, y + o.leaf * 0.25f); val p2 = Offset(p3.x - side * len * 0.2f, p3.y + rise * 0.35f)
    val twig = Path().apply { moveTo(p0.x, p0.y); cubicTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y) }
    val s = o.leaf * 0.55f
    val curl = Path().apply {
        moveTo(p3.x, p3.y)
        relativeCubicTo(side * s * 0.9f, -s * 0.2f, side * s * 1.2f, -s * 1.1f, side * s * 0.5f, -s * 1.2f)
        relativeCubicTo(-side * s * 0.45f, 0f, -side * s * 0.5f, s * 0.5f, -side * s * 0.15f, s * 0.55f)
    }
    val leaves = b.leaves.mapIndexed { j, lf ->
        val t = o.from + (0.96f - o.from) * (j + 0.5f) / n
        val p = bez(p0, p1, p2, p3, t)
        val up = if (j % 2 == 1) 1 else -1
        LeafAt(p.x, p.y, p.a + up * (38 + jitter(seed + j) * 18), o.leaf * (0.82f + (jitter(seed + "s" + j) + 0.5f) * 0.3f), lf.state)
    }
    val blooming = b.state == MapState.USE || (b.paper != null && b.leaves.any { it.state == MapState.USE })
    return Sprig(twig, curl, o.twig, leaves, if (blooming) Offset(p3.x + side * o.leaf * 0.2f, p3.y - o.leaf * 0.5f) else null, o.leaf * 0.75f)
}

/** A gently swaying stem from the ground up to `top`. */
private class Stem(val path: Path, val at: (Float) -> Float)
private fun stem(x0: Float, ground: Float, top: Float, sway: Float, seed: String): Stem {
    val ph = jitter(seed) * 6; val per = 26 + jitter(seed + "p") * 8
    val at = { y: Float -> x0 + sin((ground - y) / per + ph) * sway }
    val path = Path().apply {
        moveTo(at(ground), ground)
        var y = ground - 3
        while (y >= top) { lineTo(at(y), y); y -= 3 }
        lineTo(at(top), top)
    }
    return Stem(path, at)
}

private fun DrawScope.leaf(l: LeafAt, c: GardenColors, twig: Float) {
    translate(l.x, l.y) {
        rotate(l.angle, Offset.Zero) {
            val path = leafPath(l.len)
            when (l.state) {
                MapState.NONE -> { drawPath(path, c.noneFill); drawPath(path, c.noneStroke, style = Stroke(width = 0.35f)) }
                else -> {
                    val (fill, glow) = when (l.state) {
                        MapState.MET -> c.met to 0.25f
                        MapState.RECALL -> c.recall to 0.4f
                        else -> c.use to 0.55f
                    }
                    // The glow: the same leaf, a little larger and soft, behind it.
                    scale(1.35f, 1.6f, Offset(l.len / 2, 0f)) { drawPath(path, c.glow.copy(alpha = c.glow.alpha * glow)) }
                    drawPath(path, fill)
                    drawLine(Color.Black.copy(alpha = 0.18f), Offset(l.len * 0.12f, 0f), Offset(l.len * 0.8f, 0f), strokeWidth = twig * 0.45f, cap = StrokeCap.Round)
                }
            }
        }
    }
}

private fun DrawScope.bloom(at: Offset, s: Float, c: GardenColors) {
    translate(at.x, at.y) {
        repeat(5) { k -> rotate(k * 72f, Offset.Zero) { drawOval(c.bloom, Offset(-s * 0.38f, -s * 1.1f), androidx.compose.ui.geometry.Size(s * 0.76f, s * 1.1f)) } }
        drawCircle(c.bloomEye, s * 0.32f, Offset.Zero)
    }
}

private fun DrawScope.sprigDraw(sp: Sprig, c: GardenColors) {
    drawPath(sp.twig, c.twig, style = Stroke(sp.width, cap = StrokeCap.Round))
    drawPath(sp.curl, c.twig, style = Stroke(sp.width * 0.7f, cap = StrokeCap.Round))
    sp.leaves.forEach { leaf(it, c, sp.width) }
    sp.bloom?.let { bloom(it, sp.bloomSize, c) }
}

// --- The garden -------------------------------------------------------------------------------------------------

private class Scene(val w: Float, val h: Float, val ground: Float, val stems: List<Pair<Path, Float>>, val twines: List<Path>,
                    val sprigs: List<Sprig>, val seedlings: List<Float>, val labels: List<Pair<Float, String>>, val stars: List<Triple<Float, Float, Float>>)

private fun scene(vines: List<Vine>, height: Float): Scene {
    val w = 400f; val n = vines.size; val slot = w / n; val top = 26f; val groundH = 36f
    val sizes = vines.map { v -> v.branches.fold(0f) { s, b -> s + 7 + b.leaves.size * 0.8f } }
    val unit = height / max(1f, sizes.maxOrNull() ?: 1f)
    val ground = top + height + 10
    val stems = mutableListOf<Pair<Path, Float>>(); val twines = mutableListOf<Path>(); val sprigs = mutableListOf<Sprig>()
    val seedlings = mutableListOf<Float>(); val labels = mutableListOf<Pair<Float, String>>()
    vines.forEachIndexed { i, v ->
        val x0 = slot * (i + 0.5f)
        if (v.seedling) seedlings += x0 else {
            val total = sizes[i] * unit
            val sway = min(5f, slot * 0.1f)
            val st = stem(x0, ground - 2, ground - 2 - total - 6, sway, v.id)
            // A thinner second stem twines round the first, the way a creeper climbs.
            twines += stem(x0, ground - 2, ground - 2 - total * 0.92f, sway + 3, v.id + "t").path
            stems += st.path to 2.8f
            var y = ground - 8
            val o = BranchOpts(leaf = 13f, step = 5f, base = 10f, reach = slot * 1.15f, twig = 1.3f, flat = 1.6f, from = 0.06f)
            v.branches.forEachIndexed { k, b ->
                y -= (7 + b.leaves.size * 0.8f) * unit * 0.5f
                val side = if ((k + (if (jitter(v.id) > 0) 1 else 0)) % 2 == 1) -1 else 1
                sprigs += sprig(b, st.at(y), y, side, o, v.id + k)
                y -= (7 + b.leaves.size * 0.8f) * unit * 0.5f
            }
        }
        labels += x0 to v.label
    }
    val stars = (0 until 26).map { i -> Triple(w / 2 + jitter("st$i") * w, top + (jitter("sy$i") + 0.5f) * height * 0.8f, 0.5f + (jitter("sr$i") + 0.5f) * 0.7f) }
    return Scene(w, ground + groundH, ground, stems, twines, sprigs, seedlings, labels, stars)
}

private var grownOnce = false

/** Every vine side by side on a strip of earth, under the sky. Tapping a vine calls [onVine] with its id. */
@Composable
fun VineGarden(vines: List<Vine>, modifier: Modifier = Modifier, height: Float = 430f, onVine: (String) -> Unit = {}) {
    val c = gardenColors()
    val sc = remember(vines, height) { scene(vines, height) }
    val measurer = rememberTextMeasurer()
    val context = LocalContext.current
    val grow = remember { Animatable(if (grownOnce) 1f else 0f) }
    LaunchedEffect(Unit) {
        val off = Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
        grownOnce = true
        if (off) grow.snapTo(1f) else grow.animateTo(1f, tween(1500, easing = FastOutSlowInEasing))
    }
    val counts = remember(vines) { countsOf(vines) }
    Canvas(
        modifier.fillMaxWidth().aspectRatio(sc.w / sc.h).clip(RoundedCornerShape(20.dp))
            .background(Brush.verticalGradient(listOf(c.sky1, c.sky2)))
            .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(20.dp))
            .semantics { contentDescription = "The whole syllabus as a creeper garden: ${counts.papers} papers, ${counts.lines} lines, ${counts.lit} lit. Tap a vine to open its paper." }
            .pointerInput(vines) { detectTapGestures { p -> vines.getOrNull((p.x / size.width * vines.size).toInt())?.let { onVine(it.id) } } },
    ) {
        val u = size.width / sc.w
        scale(u, u, Offset.Zero) {
            sc.stars.forEach { (x, y, r) -> drawCircle(c.star, r, Offset(x, y)) }
            drawRect(c.ground, Offset(0f, sc.ground - 2), androidx.compose.ui.geometry.Size(sc.w, sc.h - sc.ground + 2))
            drawPath(Path().apply { moveTo(0f, sc.ground - 2); quadraticTo(sc.w / 2, sc.ground - 9, sc.w, sc.ground - 2); close() }, c.ground2.copy(alpha = 0.55f))
            // Growing in: everything above the earth is revealed from the ground up.
            clipRect(top = sc.ground - grow.value * sc.ground, bottom = sc.ground) {
                sc.twines.forEach { drawPath(it, c.twig.copy(alpha = 0.7f), style = Stroke(1.3f, cap = StrokeCap.Round)) }
                sc.stems.forEach { (p, wd) -> drawPath(p, c.stem, style = Stroke(wd, cap = StrokeCap.Round)) }
                sc.sprigs.forEach { sprigDraw(it, c) }
                sc.seedlings.forEach { x ->
                    translate(x, sc.ground - 2) {
                        drawPath(Path().apply { moveTo(0f, 0f); cubicTo(1f, -6f, -1f, -10f, 0f, -16f) }, c.stem, style = Stroke(1.4f, cap = StrokeCap.Round))
                        leaf(LeafAt(0f, -12f, -140f, 6f, MapState.NONE), c, 0.7f)
                        leaf(LeafAt(0f, -15f, -40f, 6f, MapState.NONE), c, 0.7f)
                    }
                }
            }
        }
        val style = TextStyle(color = c.label, fontFamily = ReadingFont, fontWeight = FontWeight.Bold, fontSize = (9.5f * u).toSp())
        sc.labels.forEach { (x, text) ->
            val m = measurer.measure(text, style)
            drawText(m, topLeft = Offset(x * u - m.size.width / 2f, (sc.ground + 20) * u - m.size.height * 0.78f))
        }
    }
}

/** The counts above the garden, in words: papers, topics, lines to learn, leaves lit. */
@Composable
fun GardenCountsRow(c: GardenCounts, small: Boolean = false) {
    Row(horizontalArrangement = Arrangement.spacedBy(if (small) 14.dp else 18.dp)) {
        listOf(c.papers to "papers", c.topics to "topics", c.lines to "lines to learn", c.lit to if (c.lit == 1) "leaf lit" else "leaves lit").forEach { (n, l) ->
            Column {
                Text("$n", fontFamily = ReadingFont, fontWeight = FontWeight.Bold, style = if (small) MaterialTheme.typography.titleLarge else MaterialTheme.typography.headlineSmall)
                Text(l.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

/** The key, drawn with the same leaves. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun GardenKey() {
    val c = gardenColors()
    FlowRow(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        listOf(MapState.NONE, MapState.MET, MapState.RECALL, MapState.USE).forEach { st ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Canvas(Modifier.size(22.dp, 16.dp)) {
                    val u = size.width / 22f
                    scale(u, u, Offset.Zero) {
                        leaf(LeafAt(2f, 10f, -20f, 16f, st), c, 1f)
                        if (st == MapState.USE) bloom(Offset(16f, 5f), 6f, c)
                    }
                }
                Text(st.label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

/** The whole garden with its counts, note and key: Prep → Syllabus, Today and the first-run step. */
@Composable
fun GardenSection(vines: List<Vine>, onVine: (String) -> Unit, height: Float = 430f, note: Boolean = true, small: Boolean = false) {
    val c = remember(vines) { countsOf(vines) }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        GardenCountsRow(c, small)
        VineGarden(vines, height = height, onVine = onVine)
        if (note) {
            Text(if (c.lit > 0) "Every leaf is a line of UPSC's syllabus. It lights up when you meet its topic, and deepens as you recall it and use it. Tap a vine to open it."
                else "It looks like a lot because it is. Every leaf is a line of UPSC's syllabus, and each one lights up as you meet its topic. Tap a vine to open it.",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            GardenKey()
        }
    }
}

/** One topic as a full-width branch, for its card on the paper's page: one leaf per syllabus line. */
@Composable
fun TopicBranch(lines: List<String>, state: MapState, seed: String, modifier: Modifier = Modifier) {
    val gc = gardenColors()
    val n = max(1, lines.size)
    val o = BranchOpts(leaf = min(26f, 300f / n + 6), step = min(40f, 330f / n * 2), base = 80f, reach = 352f, twig = 2.2f, flat = 0.28f)
    val len = min(o.reach, o.base + n * o.step / 2)
    val w = 400f; val h = len * 0.44f * o.flat + o.leaf * 1.6f + 14
    val sp = remember(lines, state, seed) { sprig(VineBranch(null, "", null, state, lines.map { VineLeaf(it, null, state) }), 14f, h - o.leaf * 0.7f - 4, 1, o, seed) }
    Canvas(modifier.fillMaxWidth().aspectRatio(w / h).semantics { contentDescription = "${lines.size} syllabus line${if (lines.size == 1) "" else "s"}, ${state.label}" }) {
        val u = size.width / w
        scale(u, u, Offset.Zero) { sprigDraw(sp, gc) }
    }
}
