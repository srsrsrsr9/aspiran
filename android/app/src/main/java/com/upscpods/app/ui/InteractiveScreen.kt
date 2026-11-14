package com.upscpods.app.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.upscpods.app.data.Bi
import com.upscpods.app.data.Interactive
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.random.Random

// "Try it yourself": the hands-on piece that goes with a Syllabus in a minute video. One screen plays all six kinds.
// Same rules as the videos: no sound, nothing animates (so reduced motion has nothing to stop), no timer, no score
// kept or shown, and every piece ends with what to keep and its sources.

private val T_INK = Color(0xFF0E0A07)
private val T_GOLD = Color(0xFFFFB547)
private val T_CREAM = Color(0xFFFFF4E6)
private val T_RIGHT = Color(0xFF3DDC97)
private val T_WRONG = Color(0xFFFF6B6B)
private val T_CARD = Color.White.copy(alpha = .08f)

@Composable
fun InteractiveScreen(piece: Interactive, hindi: Boolean, onClose: () -> Unit) {
    BackHandler(onBack = onClose)
    var round by remember(piece.id) { mutableIntStateOf(0) }
    Column(
        Modifier.fillMaxSize().background(T_INK).statusBarsPadding().navigationBarsPadding()
            .verticalScroll(rememberScrollState()).padding(horizontal = 18.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        TextButton(onClick = onClose) { Text(if (hindi) "← वीडियो पर लौटें" else "← Back to the video", color = T_GOLD) }
        Text(
            listOfNotNull(if (hindi) "ख़ुद करके देखें" else "TRY IT YOURSELF", piece.typeName?.pick(hindi)).joinToString(" · "),
            color = T_GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 1.4.sp,
        )
        Text(piece.title.pick(hindi), color = T_CREAM, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, lineHeight = 28.sp)
        Text(piece.prompt.pick(hindi), color = T_CREAM, fontSize = 16.sp, lineHeight = 22.sp)
        key(piece.id, round) {
            var done by remember { mutableStateOf(false) }
            val finish = { done = true }
            when (piece.type) {
                "decide" -> Decide(piece, hindi, finish)
                "order" -> Order(piece, hindi, finish)
                "sort" -> Sort(piece, hindi, finish)
                "match" -> Match(piece, hindi, finish)
                "statements" -> Statements(piece, hindi, finish)
                "dial" -> Dial(piece, hindi, finish)
            }
            if (done) {
                Card {
                    Text(if (hindi) "याद रखने की बात" else "What to keep", color = T_GOLD, fontWeight = FontWeight.ExtraBold)
                    Text(piece.takeaway.pick(hindi), color = T_CREAM, fontSize = 15.sp, lineHeight = 21.sp)
                    if (piece.sources.isNotEmpty()) {
                        Text((if (hindi) "स्रोत: " else "Sources: ") + piece.sources.joinToString("; "), color = T_CREAM.copy(alpha = .7f), fontSize = 12.sp, lineHeight = 16.sp)
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { round++ }) { Text(if (hindi) "फिर से करें" else "Do it again", color = T_CREAM) }
                    GoldButton(if (hindi) "हो गया" else "Done", onClick = onClose)
                }
                Text(if (hindi) "बस इतना ही। यहीं रुकिए, या अगला वीडियो देखिए।" else "That's the piece. Stop here, or watch the next video.",
                    color = T_CREAM.copy(alpha = .7f), fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun Card(shade: Color = T_CARD, content: @Composable () -> Unit) {
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(shade).padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) { content() }
}

@Composable
private fun GoldButton(label: String, enabled: Boolean = true, onClick: () -> Unit) {
    Button(onClick = onClick, enabled = enabled, colors = ButtonDefaults.buttonColors(containerColor = T_GOLD, contentColor = Color(0xFF2A1300))) {
        Text(label, fontWeight = FontWeight.ExtraBold)
    }
}

@Composable
private fun Chip(label: String, picked: Boolean, onClick: () -> Unit) {
    Text(label, Modifier.clip(RoundedCornerShape(999.dp)).background(if (picked) T_GOLD else Color.White.copy(alpha = .12f))
        .clickable(onClick = onClick).padding(horizontal = 14.dp, vertical = 8.dp).semantics { if (picked) contentDescription = "$label, chosen" },
        color = if (picked) Color(0xFF2A1300) else T_CREAM, fontWeight = if (picked) FontWeight.ExtraBold else FontWeight.Normal, fontSize = 14.sp)
}

private fun shade(ok: Boolean) = (if (ok) T_RIGHT else T_WRONG).copy(alpha = .22f)
private fun mark(ok: Boolean) = if (ok) "✓ " else "✗ "
private fun Bi<String>?.txt(hindi: Boolean) = this?.pick(hindi).orEmpty()

/** You decide: one round at a time. */
@Composable
private fun Decide(d: Interactive, hindi: Boolean, finish: () -> Unit) {
    val picks = remember { mutableStateMapOf<Int, Int>() }
    var shown by remember { mutableIntStateOf(1) }
    d.rounds.take(shown).forEachIndexed { k, r ->
        val picked = picks[k]
        Card {
            if (d.rounds.size > 1) Text("${k + 1} / ${d.rounds.size}", color = T_CREAM.copy(alpha = .6f), fontSize = 12.sp)
            Text(r.situation.pick(hindi), color = T_CREAM, fontWeight = FontWeight.Bold, fontSize = 16.sp, lineHeight = 22.sp)
            r.options.forEachIndexed { i, o ->
                val bg = when {
                    picked == null -> Color.White.copy(alpha = .1f)
                    o.best -> T_RIGHT.copy(alpha = .3f)
                    i == picked -> T_WRONG.copy(alpha = .3f)
                    else -> Color.White.copy(alpha = .05f)
                }
                Text(o.text.pick(hindi), Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(bg)
                    .clickable(enabled = picked == null) { picks[k] = i; if (k == d.rounds.lastIndex) finish() }
                    .padding(horizontal = 14.dp, vertical = 11.dp), color = T_CREAM)
            }
            if (picked != null) {
                val o = r.options[picked]
                val best = r.options.firstOrNull { it.best }
                Text(mark(o.best) + (if (o.best) (if (hindi) "अच्छा चुनाव। " else "A strong choice. ") else (if (hindi) "सबसे अच्छा नहीं। " else "Not the strongest. ")) + o.why.txt(hindi),
                    color = if (o.best) T_RIGHT else T_CREAM, fontSize = 14.sp, lineHeight = 20.sp)
                if (!o.best && best != null) {
                    Text((if (hindi) "बेहतर: " else "Stronger: ") + best.text.pick(hindi) + " " + best.why.txt(hindi), color = T_CREAM, fontSize = 14.sp, lineHeight = 20.sp)
                }
                if (k == shown - 1 && k < d.rounds.lastIndex) GoldButton(if (hindi) "अगला" else "Next") { shown++ }
            }
        }
    }
}

/** Put in order: up and down buttons, then one check. */
@Composable
private fun Order(d: Interactive, hindi: Boolean, finish: () -> Unit) {
    val now = remember {
        val idx = d.items.indices.shuffled(Random(d.id.hashCode()))
        mutableStateListOf<Int>().apply { addAll(if (idx == d.items.indices.toList()) idx.reversed() else idx) }
    }
    var checked by remember { mutableStateOf(false) }
    if (d.ends != null && d.ends2 != null) Text("↑ ${d.ends.pick(hindi)} · ↓ ${d.ends2.pick(hindi)}", color = T_CREAM.copy(alpha = .7f), fontSize = 12.sp)
    now.forEachIndexed { i, k ->
        val ok = k == i
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(if (checked) shade(ok) else T_CARD).padding(start = 12.dp, top = 4.dp, bottom = 4.dp, end = 4.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Text((if (checked) mark(ok) else "${i + 1}. ") + d.items[k].text.pick(hindi) + if (checked && !ok) (if (hindi) " (सही जगह ${k + 1})" else " (belongs at ${k + 1})") else "",
                Modifier.weight(1f).padding(vertical = 8.dp), color = T_CREAM, fontSize = 15.sp)
            if (!checked) {
                TextButton(enabled = i > 0, onClick = { now.add(i - 1, now.removeAt(i)) }, modifier = Modifier.semantics { contentDescription = "Move up" }) { Text("↑", color = if (i > 0) T_GOLD else T_CREAM.copy(alpha = .3f), fontSize = 20.sp) }
                TextButton(enabled = i < now.lastIndex, onClick = { now.add(i + 1, now.removeAt(i)) }, modifier = Modifier.semantics { contentDescription = "Move down" }) { Text("↓", color = if (i < now.lastIndex) T_GOLD else T_CREAM.copy(alpha = .3f), fontSize = 20.sp) }
            }
        }
    }
    if (!checked) GoldButton(if (hindi) "जाँचिए" else "Check") { checked = true; finish() }
    else Card {
        Text(if (hindi) "सही क्रम" else "The right order", color = T_GOLD, fontWeight = FontWeight.ExtraBold)
        d.items.forEachIndexed { i, x ->
            Text("${i + 1}. ${x.text.pick(hindi)}" + (x.note?.let { " · " + it.pick(hindi) } ?: ""), color = T_CREAM, fontSize = 14.sp, lineHeight = 20.sp)
        }
    }
}

/** Sort: a row of bucket chips under each item. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Sort(d: Interactive, hindi: Boolean, finish: () -> Unit) {
    val order = remember { d.items.indices.shuffled(Random(d.id.hashCode())) }
    val pick = remember { mutableStateMapOf<Int, Int>() }
    var checked by remember { mutableStateOf(false) }
    order.forEach { k ->
        val x = d.items[k]
        val ok = pick[k] == x.bucket
        Card(if (checked) shade(ok) else T_CARD) {
            Text((if (checked) mark(ok) else "") + x.text.pick(hindi), color = T_CREAM, fontSize = 15.sp)
            if (!checked) FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                d.buckets.forEachIndexed { j, b -> Chip(b.pick(hindi), pick[k] == j) { pick[k] = j } }
            } else {
                Text("→ " + d.buckets.getOrNull(x.bucket).txt(hindi), color = T_CREAM, fontSize = 13.sp)
                x.why?.let { Text(it.pick(hindi), color = T_CREAM.copy(alpha = .85f), fontSize = 13.sp, lineHeight = 18.sp) }
            }
        }
    }
    if (!checked) GoldButton(if (hindi) "जाँचिए" else "Check", enabled = pick.size == d.items.size) { checked = true; finish() }
}

/** Match: a menu of partners for each item on the left. */
@Composable
private fun Match(d: Interactive, hindi: Boolean, finish: () -> Unit) {
    val lefts = remember { d.pairs.indices.shuffled(Random(d.id.hashCode())) }
    val rights = remember { d.pairs.indices.shuffled(Random(d.id.hashCode() + 3)) }
    val pick = remember { mutableStateMapOf<Int, Int>() }
    var checked by remember { mutableStateOf(false) }
    if (d.left != null && d.right != null) Text("${d.left.pick(hindi)} → ${d.right.pick(hindi)}", color = T_CREAM.copy(alpha = .7f), fontSize = 12.sp)
    lefts.forEach { k ->
        val p = d.pairs[k]
        val ok = pick[k] == k
        var open by remember { mutableStateOf(false) }
        Card(if (checked) shade(ok) else T_CARD) {
            Text((if (checked) mark(ok) else "") + p.a.pick(hindi), color = T_CREAM, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            if (!checked) Box {
                Text(pick[k]?.let { d.pairs[it].b.pick(hindi) } ?: if (hindi) "चुनिए… ▾" else "Choose… ▾",
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(Color.White.copy(alpha = .1f)).clickable { open = true }.padding(horizontal = 12.dp, vertical = 10.dp),
                    color = if (pick[k] == null) T_GOLD else T_CREAM, fontSize = 14.sp)
                DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
                    rights.forEach { r -> DropdownMenuItem(text = { Text(d.pairs[r].b.pick(hindi), Modifier.widthIn(max = 280.dp)) }, onClick = { pick[k] = r; open = false }) }
                }
            } else {
                Text("→ " + p.b.pick(hindi), color = T_CREAM, fontSize = 14.sp, lineHeight = 20.sp)
                if (!ok) pick[k]?.let { Text((if (hindi) "आपने चुना: " else "You picked: ") + d.pairs[it].b.pick(hindi), color = T_CREAM.copy(alpha = .8f), fontSize = 13.sp) }
            }
        }
    }
    if (!checked) GoldButton(if (hindi) "जाँचिए" else "Check", enabled = pick.size == d.pairs.size) { checked = true; finish() }
}

/** Statements: true or false for each, then one check. */
@Composable
private fun Statements(d: Interactive, hindi: Boolean, finish: () -> Unit) {
    val pick = remember { mutableStateMapOf<Int, Boolean>() }
    var checked by remember { mutableStateOf(false) }
    d.statements.forEachIndexed { i, s ->
        val ok = pick[i] == s.answer
        Card(if (checked) shade(ok) else T_CARD) {
            Text((if (checked) mark(ok) else "") + "${i + 1}. " + s.text.pick(hindi), color = T_CREAM, fontSize = 15.sp, lineHeight = 21.sp)
            if (!checked) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Chip(if (hindi) "सही" else "True", pick[i] == true) { pick[i] = true }
                Chip(if (hindi) "ग़लत" else "False", pick[i] == false) { pick[i] = false }
            } else {
                Text((if (s.answer) (if (hindi) "सही। " else "True. ") else (if (hindi) "ग़लत। " else "False. ")) + s.why.txt(hindi), color = T_CREAM, fontSize = 13.sp, lineHeight = 19.sp)
            }
        }
    }
    if (!checked) GoldButton(if (hindi) "जाँचिए" else "Check", enabled = pick.size == d.statements.size) { checked = true; finish() }
}

/** Dial: a half-circle gauge set with the slider under it (or − and +). The needle doesn't animate. */
@Composable
private fun Dial(d: Interactive, hindi: Boolean, finish: () -> Unit) {
    val span = (d.max - d.min).takeIf { it > 0 } ?: 1.0
    val step = d.step.takeIf { it > 0 } ?: 1.0
    val dp = step.toString().substringAfter('.', "").trimEnd('0').length
    fun fmt(v: Double) = if (dp == 0) v.roundToInt().toString() else String.format(java.util.Locale.US, "%.${dp}f", v)
    fun snap(v: Double) = (d.min + Math.round((v - d.min) / step) * step).coerceIn(d.min, d.max)
    var v by remember { mutableStateOf(snap(d.start ?: d.min)) }
    var locked by remember { mutableStateOf(false) }
    val unit = d.unit.txt(hindi)
    Card {
        Canvas(Modifier.fillMaxWidth().aspectRatio(2f).padding(horizontal = 24.dp, vertical = 8.dp)
            .semantics { contentDescription = "${fmt(v)} $unit" }) {
            val r = minOf(size.width / 2f, size.height) - 12f
            val c = Offset(size.width / 2f, size.height - 6f)
            fun at(value: Double, len: Float): Offset {
                val a = PI * (1 - (value - d.min) / span)
                return Offset(c.x + len * cos(a).toFloat(), c.y - len * sin(a).toFloat())
            }
            drawArc(Color.White.copy(alpha = .18f), 180f, 180f, false, Offset(c.x - r, c.y - r), Size(r * 2, r * 2), style = Stroke(22f, cap = StrokeCap.Round))
            for (i in 0..10) { val t = d.min + span * i / 10; drawLine(T_CREAM.copy(alpha = .5f), at(t, r - 26f), at(t, r - (if (i % 5 == 0) 44f else 36f)), 3f) }
            if (locked) drawLine(T_RIGHT, c, at(d.answer, r + 6f), 9f, StrokeCap.Round)
            drawLine(T_GOLD, c, at(v, r - 30f), 9f, StrokeCap.Round)
            drawCircle(T_GOLD, 14f, c)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(fmt(d.min), color = T_CREAM.copy(alpha = .6f), fontSize = 12.sp)
            Text(fmt(v) + if (unit.isNotBlank()) " $unit" else "", color = T_CREAM, fontWeight = FontWeight.ExtraBold, fontSize = 24.sp)
            Text(fmt(d.max), color = T_CREAM.copy(alpha = .6f), fontSize = 12.sp)
        }
        if (!locked) Row(verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = { v = snap(v - step) }, modifier = Modifier.semantics { contentDescription = "Less" }) { Text("−", color = T_GOLD, fontSize = 24.sp) }
            Slider(value = v.toFloat(), onValueChange = { v = snap(it.toDouble()) }, valueRange = d.min.toFloat()..d.max.toFloat(), modifier = Modifier.weight(1f),
                colors = SliderDefaults.colors(thumbColor = T_GOLD, activeTrackColor = T_GOLD, inactiveTrackColor = Color.White.copy(alpha = .2f)))
            TextButton(onClick = { v = snap(v + step) }, modifier = Modifier.semantics { contentDescription = "More" }) { Text("+", color = T_GOLD, fontSize = 24.sp) }
        }
    }
    if (!locked) GoldButton(if (hindi) "पक्का करें" else "Lock it in") { locked = true; finish() }
    else {
        val off = abs(v - d.answer)
        val spot = off <= d.near + 1e-9
        val lead = when {
            spot -> if (hindi) "बिल्कुल सही। " else "Spot on. "
            off <= span * 0.1 -> if (hindi) "क़रीब। " else "Close. "
            else -> if (hindi) "पूरी तरह नहीं। " else "Not quite. "
        }
        Card(if (spot) shade(true) else T_CARD) {
            Text(lead + (if (hindi) "आपने ${fmt(v)} चुना; उत्तर ${fmt(d.answer)} $unit है।" else "You set ${fmt(v)}; the answer is ${fmt(d.answer)} $unit."),
                color = T_CREAM, fontWeight = FontWeight.Bold, fontSize = 15.sp, lineHeight = 21.sp)
            Text(d.explain.txt(hindi), color = T_CREAM, fontSize = 14.sp, lineHeight = 20.sp)
            Text(if (hindi) "हरी रेखा उत्तर दिखाती है।" else "The green line marks the answer.", color = T_CREAM.copy(alpha = .7f), fontSize = 12.sp)
        }
    }
}
