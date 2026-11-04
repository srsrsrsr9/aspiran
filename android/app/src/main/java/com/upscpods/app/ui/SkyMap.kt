package com.upscpods.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.MapNode
import com.upscpods.app.data.MapState
import com.upscpods.app.data.SyllabusPaper
import com.upscpods.app.data.nodeId
import kotlin.math.PI
import kotlin.math.ceil
import kotlin.math.min
import kotlin.math.sin

// "Your sky": the syllabus map drawn as constellations, one per paper, one star per topic. Not started is a faint
// ring; Met a small star; Can recall a bright one; Can use a bright four-pointed star with a soft glow. A line joins
// neighbouring topics once both are lit. Counts in words, never a percentage. Each paper is a small window onto the
// night sky in both themes. Nothing moves. The web copy is sky.js; keep the two in step (same layout, same hash).

private val Night = Color(0xFF0D1124)
private val Night2 = Color(0xFF090C1A)
private val Dusk = Color(0xFF1E1A4A)
private val Gold = Color(0xFFF6C46A)
private val Pale = Color(0xFFC9CCE6)
private val Faint = Color(0xFF6D7299)
private const val PER_ROW = 9

/** The same steady number from an id as sky.js's jitter, so a star sits in the same place on web and phone. */
private fun jitter(id: String): Float {
    var x = 2166136261.toInt()
    for (c in id) x = (x xor c.code) * 16777619
    x = x xor (x ushr 15); x *= 2246822507L.toInt(); x = x xor (x ushr 13); x *= 3266489909L.toInt(); x = x xor (x ushr 16)
    return ((x.toLong() and 0xFFFFFFFFL) % 10000).toFloat() / 10000f - 0.5f
}

private data class Pt(val x: Float, val y: Float)

/** Star positions in a 100-wide box: rows of up to PER_ROW, snaking, with a little drift. Height in the same units. */
private fun layout(ids: List<String>): Pair<List<Pt>, Float> {
    val rows = maxOf(1, ceil(ids.size / PER_ROW.toFloat()).toInt())
    val per = ceil(ids.size / rows.toFloat()).toInt()
    val pts = ids.mapIndexed { i, id ->
        val r = i / per; val k = i % per; val n = min(per, ids.size - r * per)
        val t = if (n == 1) 0.5f else k / (n - 1).toFloat()
        val x = 8 + 84 * (if (r % 2 == 1) 1 - t else t) + jitter(id + "x") * 4
        val y = 12 + r * 22 + jitter(id) * 12 + sin(t * PI.toFloat() * 2 + r) * 3
        Pt(x, y)
    }
    return pts to (24f + (rows - 1) * 22f)
}

private fun DrawScope.star(c: Offset, st: MapState, u: Float) {
    when (st) {
        MapState.NONE -> drawCircle(Faint, 1.3f * u, c, style = Stroke(0.4f * u))
        MapState.MET -> drawCircle(Gold.copy(alpha = 0.6f), 1.4f * u, c)
        MapState.RECALL -> drawCircle(Gold, 1.9f * u, c)
        MapState.USE -> {
            drawCircle(Gold.copy(alpha = 0.16f), 4.2f * u, c)
            val s = 2.9f * u; val w = 0.7f * u
            drawPath(Path().apply {
                moveTo(c.x, c.y - s); lineTo(c.x + w, c.y - w); lineTo(c.x + s, c.y); lineTo(c.x + w, c.y + w)
                lineTo(c.x, c.y + s); lineTo(c.x - w, c.y + w); lineTo(c.x - s, c.y); lineTo(c.x - w, c.y - w); close()
            }, Gold)
        }
    }
}

private fun countLine(states: List<MapState>): String {
    val lit = states.count { it != MapState.NONE }
    if (lit == 0) return "${states.size} stars, none lit yet"
    val recall = states.count { it == MapState.RECALL }; val use = states.count { it == MapState.USE }
    return listOfNotNull("$lit of ${states.size} lit", if (recall > 0) "$recall can recall" else null, if (use > 0) "$use can use" else null).joinToString(" · ")
}

@Composable
private fun Constellation(ids: List<String>, states: List<MapState>, label: String) {
    val (pts, h) = remember(ids) { layout(ids) }
    val seed = remember(ids) { ids.joinToString("") }
    Canvas(Modifier.fillMaxWidth().aspectRatio(100f / h).semantics { contentDescription = label }) {
        val u = size.width / 100f
        fun at(p: Pt) = Offset(p.x * u, p.y * u)
        // Background dust: a few faint specks, the same for this paper every time.
        repeat(14) { i ->
            val c = Offset((50 + jitter(seed + i) * 100) * u, (h / 2 + jitter("$i$seed") * h) * u)
            drawCircle(Pale.copy(alpha = 0.35f), (0.25f + (jitter("r$i$seed") + 0.5f) * 0.3f) * u, c)
        }
        for (i in 1 until pts.size) {
            val on = states[i - 1] != MapState.NONE && states[i] != MapState.NONE
            drawLine(if (on) Gold.copy(alpha = 0.55f) else Faint.copy(alpha = 0.5f), at(pts[i - 1]), at(pts[i]),
                strokeWidth = (if (on) 0.3f else 0.2f) * u, pathEffect = if (on) null else PathEffect.dashPathEffect(floatArrayOf(0.6f * u, 1.4f * u)))
        }
        pts.forEachIndexed { i, p -> star(at(p), states[i], u) }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SkyKey() = FlowRow(
    Modifier.clip(RoundedCornerShape(50)).background(Night).padding(horizontal = 12.dp, vertical = 5.dp),
    horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp),
) {
    listOf(MapState.NONE, MapState.MET, MapState.RECALL, MapState.USE).forEach { st ->
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Canvas(Modifier.size(12.dp)) { star(center, st, size.width / 12f) }
            Text(st.label, style = MaterialTheme.typography.labelSmall, color = Pale)
        }
    }
}

/** Your sky, above the paper chips: tap a constellation to open that paper's topics. */
@Composable
fun SkySection(papers: List<SyllabusPaper>, map: Map<String, MapNode>, current: SyllabusPaper, onPaper: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Your sky", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
        Text("One star for each topic in the syllabus. Each one you meet lights up, and grows brighter as you recall it and use it.",
            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        SkyKey()
        papers.forEach { p ->
            val ids = p.topics.map { p.nodeId(it) }
            val states = ids.map { map[it]?.state() ?: MapState.NONE }
            val line = countLine(states)
            val shape = RoundedCornerShape(16.dp)
            Column(
                Modifier.fillMaxWidth().clip(shape)
                    .background(Brush.verticalGradient(listOf(Night, Night2)))
                    .background(Brush.radialGradient(listOf(Dusk, Color.Transparent), center = Offset(Float.POSITIVE_INFINITY, 0f), radius = 900f))
                    .border(BorderStroke(if (p.id == current.id) 2.dp else 1.dp, if (p.id == current.id) Gold else Color(0xFF262C4A)), shape)
                    .clickable { onPaper(p.id) }
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(p.short, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, color = Color(0xFFEEEAF6))
                    Text(line, style = MaterialTheme.typography.labelSmall, color = Pale)
                }
                Constellation(ids, states, "${p.name}: $line")
            }
        }
    }
}
