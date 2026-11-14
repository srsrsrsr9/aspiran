@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.upscpods.app.ui

import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.FAMILIES
import com.upscpods.app.data.LibraryItem
import com.upscpods.app.data.PlusGate
import com.upscpods.app.data.Prep
import com.upscpods.app.data.SYLLABUS
import com.upscpods.app.data.SYLLABUS_LINES
import com.upscpods.app.data.SyllabusPaper
import com.upscpods.app.data.SyllabusTopic
import com.upscpods.app.data.MapNode
import com.upscpods.app.data.MapState
import com.upscpods.app.data.SyllabusMap
import com.upscpods.app.data.nodeId
import com.upscpods.app.data.subjectName
import com.upscpods.app.data.syllabusFor
import java.time.LocalDate

// Prep's front door (sell-first plan W2): the syllabus in view from the first screen, the variety shown off rather
// than hidden, and coverage tracking shown as a locked Plus layer. Free members see the whole syllabus and every piece.

/** One colour per way of learning, so the showcase reads as variety at a glance. */
private val WAY_COLORS = mapOf(
    "choose" to listOf(Color(0xFFFF7A1A), Color(0xFFFFB547)),
    "reveal" to listOf(Color(0xFF6C5CE7), Color(0xFFA29BFE)),
    "match" to listOf(Color(0xFF00A884), Color(0xFF3DDC97)),
    "order" to listOf(Color(0xFF1F5F8B), Color(0xFF6FB7FF)),
    "sort" to listOf(Color(0xFFD63A6B), Color(0xFFFF7B9C)),
    "cloze" to listOf(Color(0xFF8E5A00), Color(0xFFE0A030)),
    "compare" to listOf(Color(0xFF0F766E), Color(0xFF5EC8C0)),
    "steps" to listOf(Color(0xFF4338CA), Color(0xFF818CF8)),
    "hub" to listOf(Color(0xFFB45309), Color(0xFFF59E0B)),
    "picture" to listOf(Color(0xFFBE185D), Color(0xFFF472B6)),
)
private val WAY_VERB = mapOf(
    "choose" to "Spot the trap", "reveal" to "Flip it", "match" to "Pair it up", "order" to "Put it in order", "sort" to "Sort it",
    "cloze" to "Fill the gap", "compare" to "Side by side", "steps" to "Step through", "hub" to "Link it across papers", "picture" to "See the pattern",
)

private fun titleText(item: LibraryItem) = itemTitle(item, false) + " " + item.id.replace('-', ' ')

/** The pieces under one topic, from the subject the piece belongs to and the words in its title. */
fun topicPieces(topic: SyllabusTopic, pieces: List<Pair<LibraryItem, String>>, subjectOf: Map<String, String>) =
    pieces.filter { (item, _) -> topic.matches(subjectOf[item.id] ?: "more", titleText(item)) }

/** The full syllabus, one tap from Today: every paper as a chip. */
@Composable
fun SyllabusStrip(optional: String? = null, onPaper: (String) -> Unit) {
    Column(Modifier.fillMaxWidth().padding(top = 4.dp)) {
        Text("THE FULL UPSC SYLLABUS", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 1.6.sp,
            modifier = Modifier.padding(horizontal = 16.dp))
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            syllabusFor(optional).forEachIndexed { i, p ->
                val c = WAY_COLORS.values.elementAt(i % WAY_COLORS.size)
                Box(Modifier.clip(RoundedCornerShape(999.dp)).background(Brush.horizontalGradient(c)).clickable { onPaper(p.id) }.padding(horizontal = 16.dp, vertical = 9.dp)) {
                    Text(p.short, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                }
            }
        }
    }
}

/**
 * "One topic, N ways to make it stick": today's topic in every format we have for it, side by side. Shown only when a
 * subject has at least three formats, so it never looks thin.
 */
@Composable
fun SevenWays(library: ContentLibrary, prep: Prep, hindi: Boolean, onOpen: (String) -> Unit, onSeeAll: () -> Unit) {
    val pieces = remember(library.items) { prep.pieces(library) }
    val pick = remember(pieces) {
        val bySubject = pieces.groupBy { prep.subjectOf(it.first) }.filterKeys { it != "more" }
            .mapValues { (_, l) -> l.distinctBy { it.second } }.filterValues { it.size >= 3 }
        if (bySubject.isEmpty()) null
        else bySubject.entries.sortedBy { it.key }.let { it[Math.floorMod(LocalDate.now().toEpochDay(), it.size.toLong()).toInt()] }
    } ?: return
    val (subject, ways) = pick
    val still = reducedMotion()
    Column(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("TODAY · ${subjectName(subject).uppercase()}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 1.6.sp)
        Text("One topic, ${ways.size} ways to make it stick", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
        Text("Same facts, never the same boring page. Flip it, pair it, sort it, play it. Pick the way your brain likes.",
            style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            ways.forEachIndexed { k, (item, engine) ->
                val enter = remember { Animatable(if (still) 1f else 0f) }
                LaunchedEffect(Unit) { if (!still) enter.animateTo(1f, tween(500, delayMillis = 90 * k, easing = FastOutSlowInEasing)) }
                val c = WAY_COLORS[engine] ?: listOf(Color(0xFF1F5F8B), Color(0xFF6FB7FF))
                Column(
                    Modifier.width(150.dp).height(168.dp)
                        .graphicsLayer { alpha = enter.value; translationY = (1f - enter.value) * 40f }
                        .clip(RoundedCornerShape(20.dp)).background(Brush.linearGradient(c)).clickable { onOpen(item.id) }.padding(14.dp),
                    verticalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("${k + 1}", color = Color.White.copy(alpha = .55f), fontWeight = FontWeight.ExtraBold, fontSize = 30.sp)
                    Column {
                        Text(WAY_VERB[engine] ?: (FAMILIES.firstOrNull { it.first == engine }?.second ?: engine), color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, lineHeight = 20.sp)
                        Text(itemTitle(item, hindi && item.hindi), color = Color.White.copy(alpha = .9f), fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    }
                }
            }
        }
        TextButton(onClick = onSeeAll) { Text("Every way to learn, every subject →") }
    }
}

/**
 * Prep → Syllabus: every paper and topic. Each topic opens to the pieces and long reads that teach it. Members with
 * Plus also see how much they've covered; everyone else sees that layer locked.
 */
@Composable
fun SyllabusTab(
    modifier: Modifier, library: ContentLibrary, prep: Prep, hindi: Boolean, gate: PlusGate, paper: String?,
    onPaper: (String) -> Unit, onOpenItem: (String) -> Unit, onOpenRead: (String) -> Unit, onSeePlus: () -> Unit,
    focus: String? = null,
    /** Past UPSC questions per (paper, topic name), and opening them (Practice → PYQ). */
    pyqs: Map<Pair<String, String>, Int> = emptyMap(), onPyq: (paper: String, topic: String) -> Unit = { _, _ -> },
    /** The member's answer about their Mains optional: its papers join the chips. */
    optional: String? = null,
    /** The syllabus map on this phone (data/SyllabusMap.kt), by node id, and its actions. */
    map: Map<String, MapNode> = emptyMap(),
    onMeet: (id: String, note: String) -> Unit = { _, _ -> },
    onUse: (id: String, how: String) -> Unit = { _, _ -> },
    onReset: (id: String) -> Unit = {},
    onOpenReview: () -> Unit = {},
) {
    val pieces = remember(library.items) { prep.pieces(library) }
    val reads = remember(library.items) { prep.reads(library).map { it.first to "read" } }
    val subjectOf = remember(pieces, reads) { (pieces + reads).associate { (it, _) -> it.id to prep.subjectOf(it) } }
    val learnt = remember(library.items) { prep.learnt() + prep.readDone() }
    val current = SYLLABUS.firstOrNull { it.id == paper } ?: SYLLABUS.first()
    // A paper opened from a link (a node in a mock or PYQ) keeps its chip even when it isn't the member's optional.
    val shown = syllabusFor(optional).let { if (current in it) it else it + current }
    Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("The whole syllabus. Every line of it.", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
        PauseLine("syllabus-first-open")
        Text("Every paper and every topic, straight from the official notification. Tap a topic to learn it here. Each one moves from Not started to Met, then Can recall, then Can use. Only you see this.",
            style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(SyllabusMap.line(map.values.groupingBy { it.state() }.eachCount()), style = MaterialTheme.typography.labelLarge)
        val vines = remember(map, optional) { vinesOf(syllabusFor(optional), map, !optional.isNullOrBlank()) }
        GardenSection(vines, onVine = { id ->
            when (id) {
                "optional" -> shown.firstOrNull { it.forOptional != null }?.let { onPaper(it.id) }
                "qualifying" -> onPaper("lang")
                else -> onPaper(id)
            }
        })
        PedagogyCard()
        Text("Topic by topic", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            shown.forEach { p -> FilterChip(selected = p.id == current.id, onClick = { onPaper(p.id) }, label = { Text(p.short) }) }
        }
        PaperHeader(current, pieces + reads, subjectOf, learnt, gate, onSeePlus)
        // A topic opened from the revision list (Mock Intelligence) comes first, already open.
        current.topics.sortedBy { it.name != focus }.forEach { topic ->
            TopicCard(topic, topicPieces(topic, pieces, subjectOf), topicPieces(topic, reads, subjectOf), learnt, gate.member, hindi, onOpenItem, onOpenRead,
                startOpen = topic.name == focus, pyqs = pyqs[current.id to topic.name] ?: 0, onPyq = { onPyq(current.id, topic.name) },
                node = map[current.nodeId(topic)], id = current.nodeId(topic), onMeet = onMeet, onUse = onUse, onReset = onReset, onOpenReview = onOpenReview)
        }
    }
}

@Composable
private fun PaperHeader(p: SyllabusPaper, all: List<Pair<LibraryItem, String>>, subjectOf: Map<String, String>, learnt: Map<String, String>, gate: PlusGate, onSeePlus: () -> Unit) {
    val inPaper = remember(p, all) { all.filter { (item, _) -> p.topics.any { it.matches(subjectOf[item.id] ?: "more", titleText(item)) } } }
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(p.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(p.lead, style = MaterialTheme.typography.bodyMedium)
            Text("${p.topics.size} topics · ${inPaper.size} pieces to learn from", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
            // No coverage percentage (teaching plan): each topic below shows Not started, Met, Can recall or Can use.
            Text("Each topic below shows where you are with it: Not started, Met, Can recall or Can use.", style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun Meter(value: Float) {
    Box(Modifier.fillMaxWidth().height(10.dp).clip(RoundedCornerShape(999.dp)).background(MaterialTheme.colorScheme.surfaceVariant)) {
        Box(Modifier.fillMaxWidth(value.coerceIn(0f, 1f)).height(10.dp).clip(RoundedCornerShape(999.dp))
            .background(Brush.horizontalGradient(listOf(Color(0xFF3DDC97), Color(0xFF6FB7FF)))))
    }
}

@Composable
private fun TopicCard(
    topic: SyllabusTopic, pieces: List<Pair<LibraryItem, String>>, reads: List<Pair<LibraryItem, String>>, learnt: Map<String, String>,
    member: Boolean, hindi: Boolean, onOpenItem: (String) -> Unit, onOpenRead: (String) -> Unit, startOpen: Boolean = false,
    pyqs: Int = 0, onPyq: () -> Unit = {},
    node: MapNode? = null, id: String = "", onMeet: (String, String) -> Unit = { _, _ -> }, onUse: (String, String) -> Unit = { _, _ -> },
    onReset: (String) -> Unit = {}, onOpenReview: () -> Unit = {},
) {
    var open by rememberSaveable(topic.name, startOpen) { mutableStateOf(startOpen) }
    val n = pieces.size + reads.size
    val state = node?.state() ?: MapState.NONE
    FlatCard(Modifier.clickable { open = !open }) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            // The topic as a branch of its paper's creeper: one leaf per line of UPSC's syllabus.
            val lines = SYLLABUS_LINES[id]
            if (lines != null) TopicBranch(lines, state, id)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(topic.name, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                Text("${state.mark} ${state.label}  ", style = MaterialTheme.typography.labelMedium,
                    color = if (state == MapState.NONE) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.primary)
                Text(if (open) "▴" else "▾", style = MaterialTheme.typography.titleMedium)
            }
            Text(
                when {
                    n == 0 && pyqs > 0 -> "$pyqs past UPSC question${if (pyqs == 1) "" else "s"} · fresh pieces land here soon"
                    n == 0 -> "Fresh pieces land here soon. Ask Chotu about it meanwhile."
                    member -> "${pieces.size} to play · ${reads.size} to read · ${(pieces + reads).count { it.first.id in learnt }} done"
                    else -> "${pieces.size} to play · ${reads.size} to read"
                } + if (n > 0 && pyqs > 0) " · $pyqs past UPSC" else "",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (open) {
                if (lines != null) Text("UPSC's lines: " + lines.joinToString(" · "), style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.size(2.dp))
                MapStep(id, node, state, onMeet, onUse, onReset, onOpenReview)
                if (pyqs > 0) TopicRow("Past UPSC questions", "$pyqs from the official papers. See how UPSC asks it.", Color(0xFFB45309), done = false, onClick = onPyq)
                pieces.forEach { (item, engine) ->
                    TopicRow(WAY_VERB[engine] ?: kindName(item.kind, hindi), itemTitle(item, hindi && item.hindi), WAY_COLORS[engine]?.first(),
                        done = member && item.id in learnt) { onOpenItem(item.id) }
                }
                reads.forEach { (item, _) -> TopicRow("Long read", itemTitle(item, hindi && item.hindi), Color(0xFF1F5F8B), done = member && item.id in learnt) { onOpenRead(item.id) } }
            }
        }
    }
}

@Composable
private fun TopicRow(kind: String, title: String, color: Color?, done: Boolean, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable(onClick = onClick).padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(Modifier.size(10.dp).clip(RoundedCornerShape(999.dp)).background(color ?: MaterialTheme.colorScheme.primary))
        Column(Modifier.weight(1f)) {
            Text(kind, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            Text(title, style = MaterialTheme.typography.bodyMedium, maxLines = 2, overflow = TextOverflow.Ellipsis)
        }
        if (done) Text("✓", color = Color(0xFF3DDC97), fontWeight = FontWeight.Bold)
    }
}

/** Where this topic is on the map, and the one thing that moves it on. */
@Composable
private fun MapStep(
    id: String, node: MapNode?, state: MapState, onMeet: (String, String) -> Unit, onUse: (String, String) -> Unit,
    onReset: (String) -> Unit, onOpenReview: () -> Unit,
) {
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(MaterialTheme.colorScheme.surfaceVariant).padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)) {
        when (state) {
            MapState.NONE -> {
                var note by rememberSaveable(id) { mutableStateOf("") }
                Text("Learn it below, then close the book and write what you remember. Check it against the book and fix it.", style = MaterialTheme.typography.bodyMedium)
                OutlinedTextField(note, { note = it }, Modifier.fillMaxWidth(), placeholder = { Text("Without looking: the main points, in your own words.") }, minLines = 3)
                OutlinedButton(onClick = { onMeet(id, note.trim()) }) { Text("Mark as met") }
            }
            MapState.MET -> {
                Text(if (node?.recalledOn != null) "It's been a while since your last check, so it's back to Met. The next check that goes well brings it back."
                    else "You've met it. A recall check after a week or more moves it to Can recall.", style = MaterialTheme.typography.bodyMedium)
                if (node?.isDue() == true) OutlinedButton(onClick = onOpenReview) { Text("A check is due: open the review") }
                else Text("Next check: ${node?.due}. It comes up in your review.", style = MaterialTheme.typography.bodySmall)
            }
            MapState.RECALL -> {
                Text("You can recall it. To reach Can use, use it: write an answer on it, or try a set of past questions on it.", style = MaterialTheme.typography.bodyMedium)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                    OutlinedButton(onClick = { onUse(id, "answer") }) { Text("I wrote an answer") }
                    OutlinedButton(onClick = { onUse(id, "pyq") }) { Text("I did past questions") }
                }
            }
            MapState.USE -> Text("You can use it. Your review keeps checking it, further apart each time.", style = MaterialTheme.typography.bodyMedium)
        }
        if (state != MapState.NONE) TextButton(onClick = { onReset(id) }) { Text("Start this topic again") }
    }
}
