package com.upscpods.app.ui

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.size
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.StartOffset
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withLink
import androidx.compose.ui.text.withStyle
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.upscpods.app.data.Honest
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.FAMILIES
import com.upscpods.app.data.LibraryItem
import com.upscpods.app.data.LongRead
import com.upscpods.app.data.MockMcq
import com.upscpods.app.data.MockPaper
import com.upscpods.app.data.MockRecord
import com.upscpods.app.data.PlusGate
import com.upscpods.app.data.Prep
import com.upscpods.app.data.PrepQ
import com.upscpods.app.data.SUBJECTS
import com.upscpods.app.data.TopicTally
import com.upscpods.app.data.subjectName

// Prep → Learn and play, long reads, the four Plus tools and "What Plus adds", following server/public/app/explore.js.
// Learn and play and long reads are free. Plus tools carry a small "Plus" tag and give a real taste first.
// Google Play rule: nothing here shows a price, a buy button, or says where Plus can be bought.

enum class PrepTool(val title: String, val lead: String) {
    WEEKLY("Weekly Chai test", "This week's Chai questions as one test"),
    INSIGHTS("Mock insights", "Where you're lucky, where you're stuck, what to revise"),
    REVISE("Revise my misses", "Every question you got wrong, in one go"),
    COMPILE("Monthly compilation", "The month's Chai questions by topic"),
}

private fun plural(n: Int, w: String) = "$n $w${if (n == 1) "" else "s"}"

/** A full-screen Prep page with a back button, scrolling content. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PrepPage(title: String, onClose: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    PrepSpace {
        Scaffold(topBar = { TopAppBar(title = { Text(title) }, navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } }) }) { padding ->
            Column(
                Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                content = content,
            )
        }
    }
}

@Composable
private fun PlusTag() {
    Text("Plus", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondaryContainer,
        modifier = Modifier.background(MaterialTheme.colorScheme.secondaryContainer, RoundedCornerShape(6.dp)).padding(horizontal = 6.dp, vertical = 2.dp))
}

@Composable
private fun Muted(text: String) = Text(text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

/** The quiet card after a taste. In quiet times it says nothing about Plus beyond the tag. No purchase path, ever. */
@Composable
private fun PlusNote(what: String, quiet: Boolean, onSeePlus: () -> Unit, onNotNow: () -> Unit) {
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) { Text(what, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f)); PlusTag() }
            Text(if (quiet) "That was the preview. This is a Plus tool."
                else "That was the preview. This is a Plus tool: the rest opens with Plus, along with every mock paper, full mock insights and the monthly compilation.",
                style = MaterialTheme.typography.bodyMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (!quiet) OutlinedButton(onClick = onSeePlus) { Text("See what Plus adds") }
                TextButton(onClick = onNotNow) { Text(if (quiet) "Back" else "Not now") }
            }
        }
    }
}

// --- Practice tab entries ------------------------------------------------------------------------------

/** Learn and play, Long reads and the four tools, as rows on the Practice tab. */
@Composable
fun PrepEntries(pieces: Int, questions: Int, reads: Int, plusOn: Boolean, showPlusInfo: Boolean,
                onLearn: () -> Unit, onReads: () -> Unit, onTool: (PrepTool) -> Unit, onPlusInfo: () -> Unit) {
    Text("Learn and play", style = MaterialTheme.typography.titleLarge)
    EntryCard("Learn and play", if (pieces > 0) "${plural(pieces, "piece")}, $questions questions and cards, by format and subject. Free." else "Pieces appear here once an editor approves them.", onLearn)
    EntryCard("Long reads", if (reads > 0) "${plural(reads, "read")} for a proper sit-down session. Free." else "Long reads appear here after an editor approves them.", onReads)
    Text("Revision tools", style = MaterialTheme.typography.titleMedium)
    PrepTool.entries.forEach { t -> EntryCard(t.title, t.lead, { onTool(t) }, tag = plusOn) }
    if (showPlusInfo) TextButton(onClick = onPlusInfo) { Text("What Plus adds →") }
}

@Composable
private fun EntryCard(title: String, lead: String, onClick: () -> Unit, tag: Boolean = false) {
    FlatCard(Modifier.clickable(onClick = onClick)) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) { Text(title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f)); if (tag) PlusTag() }
            Muted(lead)
        }
    }
}

// --- Learn and play: every engine piece by format, with subject filters ------------------------------------

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LearnHubScreen(library: ContentLibrary, prep: Prep, hindi: Boolean, plusOn: Boolean, onOpen: (String) -> Unit, onTool: (PrepTool) -> Unit, onClose: () -> Unit) {
    val all = remember(library.items) { prep.pieces(library) }
    var filter by remember { mutableStateOf(prep.learnFilter) }
    val setFilter = { f: Pair<String, String> -> filter = f; prep.learnFilter = f }
    val learnt = remember(library.items) { prep.learnt() }
    val subjectOf = remember(all) { all.associate { (it, _) -> it.id to prep.subjectOf(it) } }
    PrepPage("Learn and play", onClose) {
        val total = all.sumOf { prep.sizeOf(it.first) }
        Text(if (all.isNotEmpty()) "${plural(all.size, "piece")}, $total questions and cards in all. Free. Every piece plays to an end."
            else "Pieces appear here once an editor approves them on the desk. Connect to the pod server once to get them; after that they open offline.",
            style = MaterialTheme.typography.bodyMedium)
        if (all.isEmpty()) return@PrepPage
        val subjects = SUBJECTS.filter { (k, _) -> subjectOf.values.any { it == k } } + (if ("more" in subjectOf.values) listOf("more" to "More") else emptyList())
        Text("Subject", style = MaterialTheme.typography.labelLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            subjects.forEach { (k, name) -> FilterChip(selected = filter.first == k, onClick = { setFilter((if (filter.first == k) "" else k) to filter.second) }, label = { Text(name) }) }
        }
        Text("Format", style = MaterialTheme.typography.labelLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            FAMILIES.filter { (fam) -> all.any { it.second == fam } }.forEach { (fam, name) ->
                FilterChip(selected = filter.second == fam, onClick = { setFilter(filter.first to (if (filter.second == fam) "" else fam)) }, label = { Text(name) })
            }
        }
        val shown = all.filter { (it, eng) -> (filter.first.isEmpty() || subjectOf[it.id] == filter.first) && (filter.second.isEmpty() || eng == filter.second) }
        if (shown.isEmpty()) Text("Nothing matches both filters. Tap a chip again to clear it.")
        FAMILIES.forEach { (fam, name, lead) ->
            val list = shown.filter { it.second == fam }
            if (list.isEmpty()) return@forEach
            Text("$name  ·  ${list.size}", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 8.dp))
            Muted(lead)
            list.forEach { (item, eng) -> PieceTile(item, eng, subjectName(subjectOf[item.id] ?: "more"), prep.sizeOf(item), learnt[item.id], hindi) { onOpen(item.id) } }
        }
        Text("Revision tools", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp))
        PrepTool.entries.forEach { t -> EntryCard(t.title, t.lead, { onTool(t) }, tag = plusOn) }
    }
}

private val UNIT = mapOf("choose" to "question", "sort" to "item", "order" to "item", "match" to "pair", "reveal" to "card", "steps" to "step",
    "compare" to "row", "hub" to "link", "cloze" to "gap", "picture" to "frame")

@Composable
private fun PieceTile(item: LibraryItem, engine: String, subject: String, n: Int, seen: String?, hindi: Boolean, onClick: () -> Unit) {
    val h = hindi && item.hindi
    FlatCard(Modifier.clickable(onClick = onClick)) {
        Column(Modifier.padding(16.dp)) {
            Text("${kindName(item.kind, h)} · $subject", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            Text(itemTitle(item, h).ifBlank { "Untitled" }, style = MaterialTheme.typography.titleMedium)
            Muted(plural(n, UNIT[engine] ?: "part") + (seen?.let { " · opened $it" } ?: ""))
        }
    }
}

// --- Long reads -----------------------------------------------------------------------------------------

@Composable
fun LongReadsScreen(reads: List<Pair<LibraryItem, LongRead>>, prep: Prep, hindi: Boolean, onOpen: (String) -> Unit, onClose: () -> Unit) {
    val done = remember(reads) { prep.readDone() }
    PrepPage("Long reads", onClose) {
        Text("For a proper sit-down session. Text size is in the reader. At the end, write what you remember before you check.", style = MaterialTheme.typography.bodyMedium)
        if (reads.isEmpty()) Text("Long reads appear here after an editor writes and approves them on the desk.")
        reads.forEach { (item, r) ->
            FlatCard(Modifier.clickable { onOpen(item.id) }) {
                Column(Modifier.padding(16.dp)) {
                    Text(r.title.pick(hindi && item.hindi), style = MaterialTheme.typography.titleMedium)
                    Muted("${r.minutes} min · " + listOf(r.gsPaper, r.topic).filter { it.isNotBlank() }.joinToString(" · ") + if (done[item.id] != null) " · Read" else "")
                }
            }
        }
    }
}

@Composable
fun ReaderScreen(item: LibraryItem, read: LongRead, prep: Prep, hindiPreferred: Boolean, onFocus: ((Int) -> Unit)?, onClose: () -> Unit) {
    val hindi = hindiPreferred && item.hindi
    var size by remember { mutableIntStateOf(prep.readSize) }
    var recall by rememberSaveable(item.id) { mutableStateOf(prep.readNote(item.id)) }
    var checked by rememberSaveable(item.id) { mutableStateOf(false) }
    val body = MaterialTheme.typography.bodyLarge.copy(fontSize = size.sp, lineHeight = (size * 1.55f).sp)
    PrepPage("Long read", onClose) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            TextButton(onClick = { size = (size - 1).coerceAtLeast(14); prep.readSize = size }, modifier = Modifier.semantics { contentDescription = "Smaller text" }) { Text("A−") }
            TextButton(onClick = { size = (size + 1).coerceAtMost(28); prep.readSize = size }, modifier = Modifier.semantics { contentDescription = "Larger text" }) { Text("A+") }
            if (onFocus != null) {
                val mins = maxOf(15, read.minutes)
                OutlinedButton(onClick = { onFocus(mins) }) { Text("Read with focus ($mins min)") }
            }
        }
        Text(read.title.pick(hindi), style = MaterialTheme.typography.headlineSmall)
        Muted("${read.minutes} min · ${read.review.line(hindi)}")
        read.dekFor(hindi).takeIf { it.isNotBlank() }?.let { Text(it, style = body, fontWeight = FontWeight.Medium) }
        read.sectionsFor(hindi).forEach { s ->
            if (s.heading.isNotBlank()) Text(s.heading, style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 8.dp))
            s.body.split(Regex("\n{2,}")).filter { it.isNotBlank() }.forEach { Text(it.trim(), style = body) }
        }
        read.sourceLine(hindi).takeIf { it.isNotBlank() }?.let { Muted("Sources: $it") }
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Before you go: say it from memory", style = MaterialTheme.typography.titleMedium)
                Text("Pulling it back out of memory makes it stick far better than reading it again.", style = MaterialTheme.typography.bodySmall)
                OutlinedTextField(recall, { recall = it }, Modifier.fillMaxWidth().heightIn(min = 120.dp),
                    placeholder = { Text("Without scrolling back: what were the main points?") })
                Button(onClick = { prep.markRead(item.id, recall.trim()); checked = true }) { Text("Check") }
                if (checked) {
                    Text("Did you get these?", style = MaterialTheme.typography.titleSmall)
                    val prompts = read.recallFor(hindi)
                    if (prompts.isEmpty()) Text("Scroll back and compare.") else prompts.forEach { Text("• $it") }
                }
            }
        }
    }
}

// --- A run of questions --------------------------------------------------------------------------------

/** One question at a time, with the answer and why. [limit] cuts it short for a taste. Finite, no timer. */
@Composable
private fun McqRun(qs: List<PrepQ>, title: String, onAnswer: (PrepQ, Boolean) -> Unit, limit: Int = Int.MAX_VALUE,
                   done: @Composable (right: Int, n: Int) -> Unit = { r, n -> Text("$r of $n right.", style = MaterialTheme.typography.titleMedium) }) {
    val n = minOf(qs.size, limit)
    var i by rememberSaveable(qs.size, limit) { mutableIntStateOf(0) }
    var right by rememberSaveable(qs.size, limit) { mutableIntStateOf(0) }
    var picked by rememberSaveable(i) { mutableIntStateOf(-1) }
    if (n == 0) return
    if (i >= n) return done(right, n)
    val q = qs[i]
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Muted("$title · ${i + 1} of $n" + if (q.topic.isNotBlank()) " · ${q.topic}" else "")
        Text(q.q.question, style = MaterialTheme.typography.titleMedium)
        q.q.options.forEachIndexed { k, opt ->
            FilterChip(selected = picked == k, onClick = {
                if (picked >= 0) return@FilterChip
                picked = k
                val ok = k == q.q.answerIndex
                if (ok) right++
                onAnswer(q, ok)
            }, label = { Text(opt, modifier = Modifier.padding(vertical = 8.dp)) }, modifier = Modifier.fillMaxWidth())
        }
        if (picked >= 0) {
            val ok = picked == q.q.answerIndex
            Text((if (ok) "✓ Right. " else "○ Not quite. The answer is ${q.q.options.getOrElse(q.q.answerIndex) { "" }}. ") + q.q.explanation, style = MaterialTheme.typography.bodyLarge)
            Button(onClick = { i++ }) { Text(if (i + 1 < n) "Next" else "Finish") }
        }
    }
}

// --- The four tools ------------------------------------------------------------------------------------

@Composable
fun WeeklyTestScreen(qs: List<PrepQ>, gate: PlusGate, quiet: Boolean, onAnswer: (PrepQ, Boolean) -> Unit, onSeePlus: () -> Unit, onClose: () -> Unit) = PrepPage("Weekly Chai test", onClose) {
    Text("Every Exam Corner question from the last 7 days of Chai, as one test. Checked by an editor, like the cards.", style = MaterialTheme.typography.bodyMedium)
    when {
        gate.loading -> Muted("Loading…")
        qs.isEmpty() -> Text("No Chai questions from the last 7 days yet. They come with each day's checked cards.")
        gate.open -> McqRun(qs, "Weekly Chai test", onAnswer) { r, n ->
            Text("$r of $n right.", style = MaterialTheme.typography.headlineSmall)
            Text("Wrong ones come back in Revise my misses.")
            OutlinedButton(onClick = onClose) { Text("Back to Practice") }
        }
        else -> {
            Muted("This week's test has ${plural(qs.size, "question")}. Here are the first ${listOf("one", "two", "three")[minOf(3, qs.size) - 1]}.")
            McqRun(qs, "Preview", onAnswer, limit = 3) { _, _ -> PlusNote("The weekly Chai test", quiet, onSeePlus, onClose) }
        }
    }
}

@Composable
fun CompilationScreen(qs: List<PrepQ>, gate: PlusGate, quiet: Boolean, onSeePlus: () -> Unit, onClose: () -> Unit) {
    val context = LocalContext.current
    PrepPage("Monthly compilation", onClose) {
        Text("The last 30 days of Chai questions, grouped by topic, with answers and explanations.", style = MaterialTheme.typography.bodyMedium)
        val topics = remember(qs) { qs.groupBy { it.topic.ifBlank { "Other" } }.entries.sortedByDescending { it.value.size }.map { it.key to it.value } }
        when {
            gate.loading -> Muted("Loading…")
            qs.isEmpty() -> Text("Nothing from the last 30 days yet.")
            gate.open -> {
                OutlinedButton(onClick = { shareText(context, "Monthly compilation", compileText(topics)) }) { Text("Save or share as text") }
                topics.forEach { CompileTopic(it.first, it.second) }
            }
            else -> {
                Muted("${plural(qs.size, "question")} across ${plural(topics.size, "topic")}. Here's the first topic.")
                CompileTopic(topics[0].first, topics[0].second)
                PlusNote("The monthly compilation", quiet, onSeePlus, onClose)
            }
        }
    }
}

@Composable
private fun CompileTopic(topic: String, list: List<PrepQ>) {
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("$topic  ·  ${list.size}", style = MaterialTheme.typography.titleMedium)
            list.forEach { q -> AnsweredQ(q) }
        }
    }
}

@Composable
private fun AnsweredQ(q: PrepQ) {
    Column {
        if (q.day.isNotBlank()) Muted(q.day)
        Text(q.q.question, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
        Text("Answer: " + q.q.options.getOrElse(q.q.answerIndex) { "" }, style = MaterialTheme.typography.bodyMedium)
        if (q.q.explanation.isNotBlank()) Muted(q.q.explanation)
    }
}

private fun compileText(topics: List<Pair<String, List<PrepQ>>>): String = buildString {
    appendLine("Monthly compilation")
    topics.forEach { (t, list) ->
        appendLine(); appendLine("== $t ==")
        list.forEach { q -> appendLine(); appendLine(q.q.question); appendLine("Answer: " + q.q.options.getOrElse(q.q.answerIndex) { "" }); if (q.q.explanation.isNotBlank()) appendLine(q.q.explanation) }
    }
}

private fun shareText(context: Context, title: String, text: String) {
    val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_SUBJECT, title).putExtra(Intent.EXTRA_TEXT, text)
    context.startActivity(Intent.createChooser(send, title))
}

@Composable
fun ReviseScreen(misses: List<PrepQ>, gate: PlusGate, quiet: Boolean, onAnswer: (PrepQ, Boolean) -> Unit, onSeePlus: () -> Unit, onPrelims: () -> Unit, onClose: () -> Unit) =
    PrepPage("Revise my misses", onClose) {
        Text("Every question you got wrong in practice and mocks, in one go, until it sticks.", style = MaterialTheme.typography.bodyMedium)
        val qs = remember { misses.shuffled() }
        when {
            gate.loading -> Muted("Loading…")
            qs.isEmpty() -> { Text("Nothing to revise: you haven't missed a question here yet."); OutlinedButton(onClick = onPrelims) { Text("Prelims practice") } }
            gate.open -> McqRun(qs, "Revision", onAnswer) { r, n ->
                Text("$r of $n right this time.", style = MaterialTheme.typography.headlineSmall)
                Text("Right ones leave the list. The rest stay for next time.")
                OutlinedButton(onClick = onClose) { Text("Back to Practice") }
            }
            else -> {
                Muted("${plural(qs.size, "question")} waiting. Free: two come back in each day's Prelims practice. Here are two now.")
                McqRun(qs, "Preview", onAnswer, limit = 2) { _, _ -> PlusNote("Revise everything you missed", quiet, onSeePlus, onClose) }
            }
        }
    }

private val SAMPLE_HIST = listOf(
    sample("Week 1", 38, "Modern history" to TopicTally(6, 4, 2), "Economy" to TopicTally(3, 5, 3), "Environment" to TopicTally(5, 2, 1)),
    sample("Week 2", 44, "Modern history" to TopicTally(7, 3, 1), "Economy" to TopicTally(4, 4, 2)),
    sample("Week 3", 41, "Geography" to TopicTally(6, 3, 2), "Economy" to TopicTally(4, 3, 3)),
    sample("Week 4", 52, "Polity" to TopicTally(9, 2, 1), "Environment" to TopicTally(6, 3, 0)),
)
private fun sample(day: String, pct: Int, vararg t: Pair<String, TopicTally>) =
    MockRecord("sample", "Sample", day, com.upscpods.app.data.Marking(), 0.0, 0.0, pct, 0, 0, 0, 0, 0, t.toMap(), 0)
private val SAMPLE_MISSES = listOf(PrepQ("s1", "Economy", MockMcq("Which body decides the repo rate in India?",
    listOf("Finance Commission", "Monetary Policy Committee", "NITI Aayog", "SEBI"), 1, "The RBI's Monetary Policy Committee sets the policy repo rate.")))

/** Subject breakdown across every paper, the trend of the last ten, and the error log. */
@Composable
private fun InsightsBody(hist: List<MockRecord>, misses: List<PrepQ>, sample: Boolean, onRevise: (() -> Unit)?) {
    if (sample) Muted("Sample: made-up numbers to show the layout. Yours appear after your first paper.")
    val rows = remember(hist) {
        val t = mutableMapOf<String, TopicTally>()
        hist.forEach { r -> r.topics.forEach { (k, v) -> val x = t[k] ?: TopicTally(); t[k] = TopicTally(x.right + v.right, x.wrong + v.wrong, x.skipped + v.skipped) } }
        t.map { (k, v) -> Triple(k, v, if (v.right + v.wrong > 0) v.right * 100 / (v.right + v.wrong) else 0) }.sortedBy { it.third }
    }
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Subject breakdown", style = MaterialTheme.typography.titleMedium)
            rows.forEach { (topic, v, acc) ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(topic, style = MaterialTheme.typography.bodyMedium)
                        Muted("${v.right} right · ${v.wrong} wrong · ${v.skipped} left")
                    }
                    Box(Modifier.width(72.dp).height(8.dp).background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(4.dp))) {
                        Box(Modifier.fillMaxWidth(acc / 100f).fillMaxHeight().background(MaterialTheme.colorScheme.primary, RoundedCornerShape(4.dp)))
                    }
                    Text(" $acc%", style = MaterialTheme.typography.labelMedium, modifier = Modifier.width(44.dp))
                }
            }
            rows.firstOrNull()?.let { Muted("Weakest first. Start with ${it.first}.") }
        }
    }
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Trend", style = MaterialTheme.typography.titleMedium)
            val last = hist.takeLast(10)
            if (last.size > 1) {
                val color = MaterialTheme.colorScheme.primary
                Canvas(Modifier.fillMaxWidth().height(90.dp).semantics { contentDescription = "Score trend: " + last.joinToString(", ") { "${it.pct}%" } }) {
                    val pad = 8.dp.toPx()
                    val pts = last.mapIndexed { k, r -> Offset(pad + k * (size.width - 2 * pad) / (last.size - 1), size.height - pad - r.pct / 100f * (size.height - 2 * pad)) }
                    drawPath(Path().apply { moveTo(pts[0].x, pts[0].y); pts.drop(1).forEach { lineTo(it.x, it.y) } }, color, style = Stroke(2.dp.toPx()))
                    pts.forEach { drawCircle(color, 3.dp.toPx(), it) }
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Muted(last.first().day); Muted(last.last().day) }
            } else Muted("Your trend line starts after the second paper.")
        }
    }
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Error log", style = MaterialTheme.typography.titleMedium)
            if (misses.isEmpty()) Muted("No wrong answers logged yet.") else {
                Muted("${plural(misses.size, "question")} you got wrong, by topic.")
                var open by rememberSaveable { mutableStateOf("") }
                misses.groupBy { it.topic.ifBlank { "Other" } }.entries.sortedByDescending { it.value.size }.forEach { (t, list) ->
                    TextButton(onClick = { open = if (open == t) "" else t }) { Text((if (open == t) "▾ " else "▸ ") + "$t (${list.size})") }
                    if (open == t) list.takeLast(20).asReversed().forEach { AnsweredQ(it.copy(day = "")) }
                }
                onRevise?.let { OutlinedButton(onClick = it) { Text("Revise these now") } }
            }
        }
    }
}

@Composable
fun InsightsScreen(hist: List<MockRecord>, misses: List<PrepQ>, gate: PlusGate, quiet: Boolean, onRevise: () -> Unit, onMocks: () -> Unit, onSeePlus: () -> Unit,
                   onOpenNode: (paper: String, topic: String) -> Unit, onClose: () -> Unit) =
    PrepPage("Mock insights", onClose) {
        Text("Where your marks come from and where they leak: by topic, over time, and every question you got wrong. Kept on this phone, never on the server.",
            style = MaterialTheme.typography.bodyMedium)
        if (!gate.loading) MockIntelligenceSection(hist, misses, gate, quiet, onOpenNode, onSeePlus)
        when {
            gate.loading -> Muted("Loading…")
            gate.open -> {
                if (hist.isEmpty()) { Text("Take a mock paper and your breakdown and trend appear here. Until then, this is how it looks:"); InsightsBody(SAMPLE_HIST, SAMPLE_MISSES, true, null) }
                else InsightsBody(hist, misses, false, onRevise)
                OutlinedButton(onClick = onMocks) { Text("Mock papers") }
            }
            else -> {
                // The taste: your own latest paper, or the sample.
                if (hist.isEmpty()) InsightsBody(SAMPLE_HIST, SAMPLE_MISSES, true, null) else {
                    InsightsBody(hist.takeLast(1), misses.takeLast(1), false, null)
                    Muted("That's your latest paper only. Plus covers all ${plural(hist.size, "paper")} and ${plural(misses.size, "logged question")}.")
                }
                PlusNote("Mock insights", quiet, onSeePlus, onClose)
            }
        }
    }

// --- Plus: the first chip in Prep ---------------------------------------------------------------------------

private val PLAN_ROWS = listOf(
    Triple("Adda, pod, Commons, Calm", "Always", "Always"),
    Triple("Daily Chai and Today's 3", "Always", "Always"),
    Triple("Prelims practice and Learn and play", "Always", "Always"),
    Triple("Long reads", "Always", "Always"),
    Triple("Full mock papers", "1 a month", "All of them"),
    Triple("Mock insights: breakdown, trend, error log", "Latest paper", "Every paper"),
    Triple("Weekly Chai test", "A preview", "Every week"),
    Triple("Monthly compilation", "One topic", "Every topic, to save"),
    Triple("Revise my misses", "2 a day in practice", "All of them, any time"),
    Triple("Answer feedback", "3 a week", "Unlimited, deeper"),
    Triple("Cloud Chotu turns", "15 a day", "100 a day"),
)

/** The one price on show (owner, 23 Oct): a year of Plus. The server's figure wins when it has one. */
const val PLUS_YEARLY_INR = 9999
private const val WA_NUMBER = "919876656573"
private const val WA_SHOWN = "98766 56573"
private fun waLink(hindi: Boolean) = "https://wa.me/$WA_NUMBER?text=" +
    android.net.Uri.encode(if (hindi) "नमस्ते, मुझे Plus के मुफ़्त ऑफ़र के बारे में जानना है।" else "Hi, I'd like to know about the free Plus offer.")

/** Opens WhatsApp with a prefilled note about the free offer. The only Plus action in the app: Google Play's payments policy. */
private fun openPilot(context: Context, hindi: Boolean) {
    runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(waLink(hindi)))) }
}

/**
 * The price and the special offer, together wherever a price shows: "₹9,999 a year", then the free trial for
 * eligible candidates with the WhatsApp number as selectable text that also opens the chat. For dark stages.
 */
@Composable
fun PlusOffer(hindi: Boolean, inr: Int = PLUS_YEARLY_INR, modifier: Modifier = Modifier) {
    val price = Honest.inr(inr)
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(if (hindi) "$price सालाना" else "$price a year", color = Color(0xFFFFD08A), fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
        SelectionContainer {
            Text(buildAnnotatedString {
                withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = Color(0xFFFFB547))) { append(if (hindi) "विशेष ऑफ़र: " else "Special offer: ") }
                append(if (hindi) "योग्य उम्मीदवार Plus मुफ़्त आज़मा सकते हैं। ज़्यादा जानने के लिए हमें WhatsApp करें: " else "eligible candidates can try Plus free. WhatsApp us to know more: ")
                withLink(LinkAnnotation.Url(waLink(hindi), TextLinkStyles(SpanStyle(color = Color(0xFFFFB547), fontWeight = FontWeight.ExtraBold, textDecoration = TextDecoration.Underline)))) { append(WA_SHOWN) }
            }, color = Color.White.copy(alpha = .9f), fontSize = 14.sp, lineHeight = 20.sp)
        }
    }
}

// Warm night palette for Plus: near-black, cream type, amber to orange. The stages stay dark in both themes, like the website's.
private val N0 = Color(0xFF0E0A07)
private val N1 = Color(0xFF1A120C)
private val N2 = Color(0xFF3A2414)
private val GOLD = Color(0xFFFFB547)
private val SAF = Color(0xFFFF7A1A)
private val ROSE = Color(0xFFFF4F6D)
private val SKY = Color(0xFF6FB7FF)
private val MINT = Color(0xFF3DDC97)
private val LILAC = Color(0xFF8A7CFF)
private val TX = Color(0xFFFFF4E6)
private val TX2 = Color(0xFFC9B8A6)
private val PAPER = Color(0xFFFFF4E6)
private val GRAD = listOf(Color(0xFFFFD08A), GOLD, SAF)

/** False until the block scrolls into view; the entrance animations below wait for it. True outside the Plus page. */
private val LocalSeen = compositionLocalOf { true }

/** Marks its content as seen once its top comes within the bottom tenth of the screen, so motion starts where the reader is. */
@Composable
private fun Reveal(content: @Composable () -> Unit) {
    val still = reducedMotion()
    var seen by remember { mutableStateOf(still) }
    val screen = with(LocalDensity.current) { LocalConfiguration.current.screenHeightDp.dp.toPx() }
    Box(Modifier.fillMaxWidth().onGloballyPositioned { c -> if (!seen && c.boundsInWindow().top < screen * .92f) seen = true }) {
        CompositionLocalProvider(LocalSeen provides seen) { content() }
    }
}

/** 0 → 1 once, when first shown. Straight to 1 when the phone's "remove animations" is on. */
@Composable
private fun entrance(delayMs: Int = 0, durationMs: Int = 1100): Float {
    val still = reducedMotion()
    val seen = LocalSeen.current
    var go by remember { mutableStateOf(still) }
    LaunchedEffect(seen) { if (seen) go = true }
    return animateFloatAsState(if (go) 1f else 0f, if (still) snap() else tween(durationMs, delayMs, FastOutSlowInEasing), label = "in").value
}

/** A slow back-and-forth for decoration only. Always 0 when motion is off. */
@Composable
private fun drift(periodMs: Int, delayMs: Int = 0): Float {
    val still = reducedMotion()
    val t = rememberInfiniteTransition(label = "drift")
    val v by t.animateFloat(0f, 1f, infiniteRepeatable(tween(periodMs, easing = FastOutSlowInEasing), RepeatMode.Reverse, StartOffset(delayMs)), label = "d")
    return if (still) 0f else v
}

@Composable
private fun GradText(text: String, style: TextStyle, modifier: Modifier = Modifier, colors: List<Color> = GRAD, align: TextAlign? = null) =
    Text(text, modifier, style = style.merge(TextStyle(brush = Brush.linearGradient(colors))), textAlign = align)

/** A dark stage with a slowly drifting glow in its accent colour. */
@Composable
private fun Stage(accent: Color, modifier: Modifier = Modifier, pad: Int = 22, content: @Composable ColumnScope.() -> Unit) {
    val d = drift(14000)
    Column(
        modifier.fillMaxWidth().clip(RoundedCornerShape(28.dp)).background(Brush.verticalGradient(listOf(N1, N0)))
            .drawBehind {
                drawRect(Brush.radialGradient(listOf(accent.copy(alpha = .42f), Color.Transparent),
                    center = Offset(size.width * (.18f + .2f * d), size.height * (.2f + .1f * d)), radius = size.maxDimension * .7f))
                drawRect(Brush.radialGradient(listOf(ROSE.copy(alpha = .2f), Color.Transparent),
                    center = Offset(size.width * (.9f - .15f * d), size.height * .85f), radius = size.maxDimension * .55f))
                drawRect(Brush.radialGradient(listOf(N2.copy(alpha = .7f), Color.Transparent),
                    center = Offset(size.width * .85f, 0f), radius = size.maxDimension * .5f))
            }
            .padding(pad.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp), content = content,
    )
}

/** The one Plus action in the app. Google Play's payments policy: it only opens a WhatsApp chat. */
@Composable
private fun PilotButton(hindi: Boolean, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    Box(
        modifier.fillMaxWidth().heightIn(min = 56.dp).clip(RoundedCornerShape(999.dp)).background(Brush.linearGradient(GRAD))
            .clickable { openPilot(context, hindi) }.padding(horizontal = 24.dp, vertical = 14.dp),
        contentAlignment = Alignment.Center,
    ) { Text(if (hindi) "ज़्यादा जानने के लिए WhatsApp करें" else "WhatsApp us to know more", color = Color(0xFF2A1300), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp) }
}

/**
 * A year of Plus through Google Play (data/PlayBilling.kt). Null, and so not shown, unless this build, the server's
 * play_billing flag and its Play check all say so; with it null the page is exactly as before.
 */
class PlayBuy(val busy: Boolean, val note: String?, val onBuy: () -> Unit)

/** Under the WhatsApp chat, only when [PlayBuy] is given. Play's own sheet takes the payment. */
@Composable
private fun PlayButton(play: PlayBuy, hindi: Boolean) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            Modifier.fillMaxWidth().heightIn(min = 52.dp).clip(RoundedCornerShape(999.dp)).border(1.dp, GOLD, RoundedCornerShape(999.dp))
                .clickable(enabled = !play.busy, onClick = play.onBuy).padding(horizontal = 24.dp, vertical = 12.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(if (play.busy) (if (hindi) "Google Play खुल रहा है…" else "Opening Google Play…") else (if (hindi) "Google Play पर एक साल लें" else "Get a year on Google Play"),
                color = GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
        }
        play.note?.let { Text(it, color = TX2, fontSize = 13.sp) }
    }
}

/** A slim card at the top of Today's 3 and Practice for members without Plus. The caller hides it in quiet times. */
@Composable
fun PlusBanner(hindi: Boolean, onOpen: () -> Unit) {
    Box(Modifier.padding(horizontal = 16.dp, vertical = 4.dp).clickable(onClick = onOpen)) {
        Stage(SAF, pad = 18) {
            Text("UPSC PODS PLUS", color = GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 2.sp)
            Text(if (hindi) "आपकी गलतियाँ, सबसे सस्ते अंक जो आप वापस पा सकते हैं।" else "Your mistakes are the cheapest marks you'll ever win back.",
                color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, lineHeight = 23.sp)
            Text(if (hindi) "हर मॉक का विश्लेषण। हर गलती, याद होने तक वापस।" else "Every mock, analysed. Every miss, back until it sticks.", color = TX2, fontSize = 14.sp)
            Box(Modifier.clip(RoundedCornerShape(999.dp)).background(Brush.linearGradient(GRAD)).padding(horizontal = 20.dp, vertical = 10.dp)) {
                Text(if (hindi) "Plus देखें →" else "See Plus →", color = Color(0xFF2A1300), fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

/** The ways to play, one name per kind of piece in Learn and play, for the showcase's "N ways to play". */
fun plusWays(pieces: List<Pair<LibraryItem, String>>): List<String> =
    pieces.map { it.first.kind }.distinct().map { k -> engineTypeName(k, false) ?: k.replace('-', ' ').replaceFirstChar { it.uppercase() } }

/** The Plus chip: the member's tools when they have Plus, the showcase when they don't. */
@Composable
fun PlusTab(modifier: Modifier, mocks: List<MockPaper>, week: List<PrepQ>, bank: List<PrepQ>, misses: List<PrepQ>, hist: List<MockRecord>, pieces: Int, reads: Int, ways: List<String>,
            gate: PlusGate, quiet: Boolean, hindi: Boolean, onAnswer: (PrepQ, Boolean) -> Unit, onTool: (PrepTool) -> Unit, onMocks: () -> Unit) {
    Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        when {
            gate.loading -> Muted("Loading…")
            gate.member -> PlusHub(hindi, onTool, onMocks)
            else -> PlusShowcase(mocks, week, bank, misses, hist, pieces, reads, ways, quiet, hindi, onAnswer)
        }
    }
}

@Composable
private fun ColumnScope.PlusHub(hindi: Boolean, onTool: (PrepTool) -> Unit, onMocks: () -> Unit) {
    Stage(GOLD) {
        Text("UPSC PODS PLUS", color = GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 2.sp)
        GradText(if (hindi) "आपके Plus टूल" else "Your Plus tools", TextStyle(fontSize = 34.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 38.sp), colors = listOf(Color.White, Color(0xFFFFE2B8)))
        Text(if (hindi) "नीचे सब कुछ आपके लिए खुला है।" else "You have Plus. Everything below is open.", color = TX2, fontSize = 16.sp)
    }
    PrepTool.entries.forEach { t -> EntryCard(t.title, t.lead, { onTool(t) }) }
    EntryCard("Every mock paper", "Full-length and sectional, with a review of every answer.", onMocks)
}

/** The hero's product shot: a sample insights screen whose bars and trend line build in. */
@Composable
private fun HeroShot() {
    val bars = listOf("Polity" to .84f, "Modern history" to .71f, "Geography" to .63f, "Environment" to .52f, "Economy" to .38f)
    val bob = drift(6000)
    Box(Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 14.dp).clearAndSetSemantics {}) {
        Column(
            Modifier.fillMaxWidth().padding(top = 18.dp).clip(RoundedCornerShape(20.dp)).background(Color.White.copy(alpha = .07f))
                .border(1.dp, Color.White.copy(alpha = .14f), RoundedCornerShape(20.dp)).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("MOCK INSIGHTS · SAMPLE", color = TX2, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp)
            Text("Where your marks leak", color = TX, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            bars.forEachIndexed { k, (t, v) -> GlowBar(t, v, k) }
            val p = entrance(600, 2000)
            Canvas(Modifier.fillMaxWidth().height(60.dp).padding(top = 6.dp)) {
                val ys = listOf(.82f, .7f, .76f, .58f, .62f, .46f, .5f, .32f, .26f, .12f)
                val path = Path()
                ys.forEachIndexed { i, y -> val x = size.width * i / (ys.size - 1); if (i == 0) path.moveTo(x, size.height * y) else path.lineTo(x, size.height * y) }
                clipRect(right = size.width * p) {
                    drawPath(path, Brush.linearGradient(listOf(GOLD, ROSE)), style = Stroke(width = 3.5.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
                }
            }
        }
        Chip("+2 / −0.66 · real marking", MINT, Modifier.align(Alignment.TopEnd).offset(y = (-6 * bob).dp))
        Chip("Economy · 6 misses back tomorrow", GOLD, Modifier.align(Alignment.BottomStart).offset(x = (-4).dp, y = (6 - 8 * bob).dp))
    }
}

@Composable
private fun Chip(text: String, color: Color, modifier: Modifier) =
    Text(text, modifier.clip(RoundedCornerShape(14.dp)).background(Color(0xE6141C34)).border(1.dp, Color.White.copy(alpha = .16f), RoundedCornerShape(14.dp))
        .padding(horizontal = 12.dp, vertical = 7.dp), color = color, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)

@Composable
private fun GlowBar(label: String, value: Float, k: Int) {
    val p = entrance(300 + k * 90, 1200)
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(label, Modifier.width(104.dp), color = TX, fontSize = 13.sp, maxLines = 1)
        Box(Modifier.weight(1f).height(10.dp).clip(RoundedCornerShape(6.dp)).background(Color.White.copy(alpha = .08f))) {
            Box(Modifier.fillMaxHeight().fillMaxWidth(value * p).clip(RoundedCornerShape(6.dp))
                .background(Brush.horizontalGradient(if (value < .55f) listOf(Color(0xFFFF4D6D), Color(0xFFFF7A59)) else listOf(ROSE, SAF, GOLD))))
        }
    }
}

/** One of the seven: a kicker, a headline, the copy and a drawing on its own dark stage. */
@Composable
private fun Feature(accent: Color, kicker: String, title: String, body: String, fact: String?, visual: @Composable ColumnScope.() -> Unit) = Reveal {
    val a = entrance(100, 900)
    Column(
        Modifier.fillMaxWidth().graphicsLayer { alpha = .2f + .8f * a; translationY = (1 - a) * 60f }
            .clip(RoundedCornerShape(28.dp)).background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(28.dp)).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(kicker.uppercase(), color = accent, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 1.5.sp)
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, lineHeight = 30.sp)
        Text(body, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        fact?.let { Text(it, Modifier.clip(RoundedCornerShape(999.dp)).background(accent.copy(alpha = .16f)).padding(horizontal = 12.dp, vertical = 6.dp),
            fontWeight = FontWeight.Bold, fontSize = 13.sp) }
        Stage(accent, Modifier.padding(top = 4.dp).clearAndSetSemantics {}, pad = 18) {
            Column(Modifier.fillMaxWidth().heightIn(min = 180.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterVertically), content = visual)
        }
    }
}

@Composable
private fun PaperStack() {
    val labels = listOf("Economy · Sectional", "Polity · Sectional", "GS Paper I · Full length")
    Box(Modifier.width(260.dp).height(190.dp).padding(top = 10.dp)) {
        labels.forEachIndexed { k, label ->
            val p = entrance(200 + k * 120, 1100)
            Column(
                Modifier.fillMaxSize().padding(top = 16.dp, end = 16.dp).graphicsLayer {
                    translationX = ((k - 1) * 14f).dp.toPx(); translationY = ((1 - k) * 12f).dp.toPx() + (1 - p) * 120f
                    rotationZ = (k - 1) * 4f * p; alpha = p
                }.clip(RoundedCornerShape(16.dp)).background(PAPER).padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                Row { Text(label, Modifier.weight(1f), color = Color(0xFF1C1A17), fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1); Text("+2 / −0.66", color = Color(0xFF8A5A00), fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                listOf(.9f, .8f, .72f, .6f).forEach { w -> Box(Modifier.fillMaxWidth(w).height(7.dp).clip(RoundedCornerShape(4.dp)).background(Color.Black.copy(alpha = .1f))) }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 6.dp)) {
                    listOf("A", "B", "C", "D").forEachIndexed { j, o ->
                        val on = j == (k + 1) % 4
                        Box(Modifier.size(28.dp).clip(CircleShape).background(if (on) Color(0xFF1E8A5A) else Color.Transparent).border(1.5.dp, if (on) Color(0xFF1E8A5A) else Color.Black.copy(alpha = .2f), CircleShape), contentAlignment = Alignment.Center) {
                            Text(o, color = if (on) Color.White else Color(0xFF1C1A17), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MissLoop(misses: Int, hindi: Boolean) {
    val p = entrance(300, 1600)
    val spin = drift(7000)
    Box(Modifier.size(130.dp), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize().graphicsLayer { rotationZ = spin * 60f }) {
            val w = 10.dp.toPx()
            drawCircle(Color.White.copy(alpha = .14f), radius = size.minDimension / 2 - w, style = Stroke(w))
            drawArc(Brush.sweepGradient(listOf(SKY, MINT, SKY)), -90f, 270f * p, false, topLeft = Offset(w, w),
                size = androidx.compose.ui.geometry.Size(size.width - 2 * w, size.height - 2 * w), style = Stroke(w, cap = StrokeCap.Round))
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(if (misses > 0) "$misses" else "∞", color = TX, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
            Text(if (misses > 0) (if (hindi) "गलतियों की सूची में" else "in your error log") else (if (hindi) "रिवीज़न" else "revisions"), color = TX2, fontSize = 11.sp)
        }
    }
    listOf("Economy" to "Repo rate is set by…", "Polity" to "Article 280 sets up…", "Geography" to "The Strait of Malacca…").forEachIndexed { k, (t, q) ->
        val d = drift(6000, k * 2000)
        Row(Modifier.graphicsLayer { translationX = d * 24f; alpha = 1f - d * .4f }.clip(RoundedCornerShape(12.dp)).background(Color.White.copy(alpha = .08f))
            .border(1.dp, Color.White.copy(alpha = .12f), RoundedCornerShape(12.dp)).padding(horizontal = 12.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(t, color = MINT, fontSize = 11.sp, fontWeight = FontWeight.Bold); Text(q, color = TX, fontSize = 13.sp)
        }
    }
}

@Composable
private fun ChaiWeek(weekCount: Int, hindi: Boolean) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        listOf("M", "T", "W", "T", "F", "S", "S").forEachIndexed { k, d ->
            val p = entrance(200 + k * 90, 500)
            Box(Modifier.size(32.dp).graphicsLayer { scaleX = .6f + .4f * p; scaleY = .6f + .4f * p; alpha = p }.clip(CircleShape).background(SAF.copy(alpha = .22f))
                .border(1.dp, SAF.copy(alpha = .55f), CircleShape), contentAlignment = Alignment.Center) { Text(d, color = TX, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
        }
    }
    Text("↓", color = TX2, fontSize = 20.sp)
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Brush.linearGradient(GRAD)).padding(12.dp)) {
        Text(if (hindi) "साप्ताहिक चाय टेस्ट" else "Weekly Chai test", color = Color(0xFF2A1300), fontWeight = FontWeight.ExtraBold)
        Text(if (weekCount > 0) "${plural(weekCount, "question")} this week" else "Every Exam Corner question", color = Color(0xFF4A2A10), fontSize = 13.sp)
    }
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color.White.copy(alpha = .07f)).border(1.dp, Color.White.copy(alpha = .22f), RoundedCornerShape(14.dp)).padding(12.dp)) {
        Text(if (hindi) "मासिक संकलन" else "Monthly compilation", color = TX, fontWeight = FontWeight.ExtraBold)
        Text("By topic · with answers · to save", color = TX2, fontSize = 13.sp)
    }
}

@Composable
private fun AnswerSheet() {
    val n1 = entrance(500, 600); val n2 = entrance(900, 600)
    Box(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 6.dp).clip(RoundedCornerShape(16.dp)).background(PAPER).padding(14.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Text("Q. Discuss the role of the Finance Commission in fiscal federalism. (150 words)", color = Color(0xFF1C1A17), fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 4.dp))
            listOf(.96f, .88f, .92f, .7f, .84f, .6f).forEachIndexed { k, w ->
                Box(Modifier.fillMaxWidth(w).height(7.dp).clip(RoundedCornerShape(4.dp)).background(if (k == 1 || k == 4) SKY.copy(alpha = .5f) else Color.Black.copy(alpha = .1f)))
            }
            Box(Modifier.height(16.dp))
        }
        Chip("Add Article 280 here", Color.White, Modifier.align(Alignment.TopEnd).padding(top = 40.dp).graphicsLayer { alpha = n1; scaleX = .7f + .3f * n1; scaleY = .7f + .3f * n1 })
        Chip("Good structure. Now a conclusion", MINT, Modifier.align(Alignment.BottomStart).graphicsLayer { alpha = n2; scaleX = .7f + .3f * n2; scaleY = .7f + .3f * n2 })
    }
}

@Composable
private fun ChotuTurns(hindi: Boolean) {
    val p = entrance(300, 1100)
    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("15", color = TX2, fontSize = 32.sp, textDecoration = TextDecoration.LineThrough, modifier = Modifier.padding(bottom = 10.dp))
        GradText("${(100 * p).toInt()}", TextStyle(fontSize = 80.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 84.sp), colors = listOf(Color(0xFFE7D3FF), LILAC, SKY))
    }
    Text(if (hindi) "क्लाउड छोटू टर्न रोज़" else "cloud Chotu turns a day", color = TX2, fontSize = 13.sp)
    listOf("Teach me federalism in 5 minutes" to false, "Quiz me on yesterday's Chai" to true, "Is this answer on track?" to false).forEach { (t, me) ->
        Text(t, Modifier.fillMaxWidth().wrapContentWidth(if (me) Alignment.End else Alignment.Start)
            .clip(RoundedCornerShape(14.dp)).background(if (me) LILAC.copy(alpha = .3f) else Color.White.copy(alpha = .1f)).padding(horizontal = 12.dp, vertical = 8.dp),
            color = TX, fontSize = 13.sp)
    }
}

/**
 * Plus as a story, the same one the website tells: a dark warm hero, the score-only habit, real counts from the library,
 * what's inside UPSC Pods for everyone, what the Plus pilot adds, live tastes, what stays free and the pilot card.
 * Every number is real (counted from the library or this phone) or marked as a sample. One price shows, a year of
 * Plus, with the free-trial offer; still no buy button and no link to the website. The one action is a WhatsApp chat,
 * and in quiet times (pause, result days, after a hard moment, 22:30 to 06:00) it goes quiet; the gate doesn't.
 * Blocks fade and rise in as they scroll into view; motion stops with the phone's "remove animations".
 * [play] adds a Google Play purchase under the chat; it's null (no buy button) unless Play Billing is switched on.
 */
@Composable
private fun ColumnScope.PlusShowcase(mocks: List<MockPaper>, week: List<PrepQ>, bank: List<PrepQ>, misses: List<PrepQ>, hist: List<MockRecord>, pieces: Int, reads: Int,
                                     ways: List<String>, quiet: Boolean, hindi: Boolean, onAnswer: (PrepQ, Boolean) -> Unit, play: PlayBuy? = null) {
    val mockQs = mocks.sumOf { it.questions.size }
    val csat = mocks.count { it.id.contains("csat") || it.paper.equals("CSAT", ignoreCase = true) }
    val quietLine = "Not today. Plus will be here whenever you want it."

    // 1. The hero.
    val h = entrance(0, 900)
    Stage(SAF, Modifier.graphicsLayer { alpha = h; translationY = (1 - h) * 40f }) {
        Text("UPSC PODS PLUS", Modifier.clip(RoundedCornerShape(999.dp)).background(GOLD.copy(alpha = .08f)).border(1.dp, GOLD.copy(alpha = .35f), RoundedCornerShape(999.dp))
            .padding(horizontal = 12.dp, vertical = 5.dp), color = GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 2.sp)
        Text("You've done the reading.", color = TX, style = TextStyle(fontSize = 36.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 39.sp, letterSpacing = (-1).sp))
        GradText("Now see what you actually know.", TextStyle(fontSize = 36.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 39.sp, letterSpacing = (-1).sp))
        Text("Plus turns every mock you take into a map of where your marks are slipping away, and gives you the tools to win them back, week after week, until the day of the exam.",
            color = TX2, fontSize = 17.sp, lineHeight = 25.sp)
        if (quiet) Text(quietLine, color = TX) else {
            PlusOffer(hindi, modifier = Modifier.padding(top = 4.dp))
            PilotButton(hindi)
            play?.let { PlayButton(it, hindi) }
        }
        HeroShot()
    }

    // 2. The story.
    Reveal {
        Rise {
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(28.dp)).background(N1).padding(horizontal = 22.dp, vertical = 28.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Kicker("A strange thing about Prelims")
                val big = TextStyle(fontSize = 26.sp, fontWeight = FontWeight.Bold, lineHeight = 32.sp, letterSpacing = (-.4).sp)
                Text("Most aspirants take mock after mock and look at exactly one thing.", color = TX, style = big)
                Text("The score.", color = GOLD, style = big)
                val body = TextStyle(fontSize = 17.sp, lineHeight = 27.sp)
                Text("It goes up a little. It goes down a little. They feel good, or they feel awful, and they move on to the next paper.", color = TX2, style = body)
                Text("Meanwhile the same three or four topics quietly take marks from them in every single paper. A tricky polity pair. Statement questions in economy. One kind of trap they fall for every time.", color = TX2, style = body)
                Text("Not because they didn't study. Because nobody ever showed them the pattern.", color = TX2, style = body)
                Text("Plus shows you the pattern.", color = TX, style = big)
                GradText("Then it helps you fix it.", big)
            }
        }
    }

    // 3. Real numbers, counted from the library.
    Reveal {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CountStat(mocks.size, "full mock papers", if (csat > 0) "incl. $csat CSAT" else "Prelims format", Modifier.weight(1f))
                CountStat(mockQs, "exam-format questions", "+2 / −0.66, like the real thing", Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CountStat(pieces, "practice games", "free for everyone", Modifier.weight(1f))
                CountStat(reads, "long reads", "free for everyone", Modifier.weight(1f))
            }
        }
    }

    // 4. Inside UPSC Pods: what everyone already gets.
    Reveal {
        Rise {
            Column(Modifier.padding(top = 18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Kicker("Inside UPSC Pods")
                Text("Not another PDF dump.", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, lineHeight = 36.sp)
                GradText("A whole way of preparing.", TextStyle(fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 34.sp))
                Muted("Stories you can swipe. Games that teach. News every morning. Mocks that explain themselves. A study buddy who answers back. All in one place, built around how UPSC actually tests you.")
            }
        }
    }
    InsideTile(SAF, "Swipe-sized stories", "Big topics, broken into ideas you can read in a minute each. Swipe, and the next idea arrives. Then it gives you recall questions.") { StoryCards() }
    InsideTile(MINT, "${ways.size} ways to play", "Fact or opinion. Find the lie. Timeline shuffle. Trap spotter. Every game is built on a real exam format.") { WayChips(ways) }
    InsideTile(GOLD, "Chai, every morning", "The day's news that matters for UPSC, checked and cut down to cards. Five minutes with your tea, and then three questions to lock it in.") { ChaiCards() }
    InsideTile(ROSE, "Mocks that explain themselves", "Every answer reviewed: what you picked, what was right, and the trap that caught you. Plus your score range, so one lucky paper doesn't fool you.") { ExplainedQuestion(mocks) }
    InsideTile(LILAC, "Talk it through with Chotu", "Stuck at midnight? Ask Chotu directly, argue a point, get it explained in simpler words, in English or Hindi.") { ChatBubbles() }
    Reveal {
        Rise {
            Column(Modifier.fillMaxWidth().padding(vertical = 20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("All of that is yours, free.", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                GradText("Plus is what turns it into results you can measure.", TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold, lineHeight = 30.sp), align = TextAlign.Center)
            }
        }
    }

    // 5. What Plus adds, one block per value.
    Text("What Plus adds", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, lineHeight = 36.sp, modifier = Modifier.padding(bottom = 4.dp))
    Feature(GOLD, "01 · Every mock paper", "Every mock paper. Not one a month.",
        "Free members get one full paper a month. Plus opens all ${if (mocks.isNotEmpty()) "${mocks.size}" else "of them"}, ${if (mockQs > 0) "$mockQs" else "hundreds of"} questions across polity, history, geography, economy, environment, science, IR, art and culture, society and CSAT. Real Prelims formats and negative marking, so your guessing habits show up too.",
        if (mocks.isNotEmpty()) "${plural(mocks.size, "paper")} ready now · $mockQs questions" else null) { PaperStack() }
    Feature(ROSE, "02 · Topic breakdown", "Find the marks you're losing.",
        "After every paper, Plus breaks your result down by subject and topic. Not \"62 out of 100\", but something like \"Economy: 4 of 9, and 3 of those 5 misses were statement questions.\" That one line is worth more than ten more papers taken blind.",
        if (hist.isNotEmpty()) "You've sat ${plural(hist.size, "paper")}. Free shows only the latest." else "Sample bars. Yours appear after your first paper.") {
        listOf("Polity" to .89f, "Economy" to .44f, "Geography" to .75f, "Science" to .71f, "Environment" to .5f).forEachIndexed { k, (t, v) -> GlowBar(t, v, k) }
    }
    Feature(GOLD, "03 · Your trend", "Watch yourself get better.",
        "Your trend across papers, drawn as a line, not a feeling. You'll know if last month's revision worked, and which subject is holding the line back.", null) { TrendLine() }
    Feature(MINT, "04 · Error log", "An error log that remembers for you.",
        "Every question you miss, in any mock or practice set, goes into one log, grouped by topic. Free members revise two a day. Plus lets you revise all of them, any time, so the same question never costs you twice.",
        if (misses.isNotEmpty()) "${plural(misses.size, "question")} already waiting in your error log." else null) { MissLoop(misses.size, hindi) }
    Feature(SAF, "05 · Weekly Chai test", "The week's current affairs, as one test.",
        "Every Sunday, the week's checked Chai cards become a single Prelims-style test. Seven days of news, tested in one sitting, while it's still fresh.",
        if (week.isNotEmpty()) "${plural(week.size, "question")} in this week's test so far." else null) { ChaiWeek(week.size, hindi) }
    Feature(GOLD, "06 · Monthly compilation", "A monthly compilation to keep.",
        "Thirty days of current affairs, grouped by topic, with the questions under each. Carry it, revise it on the metro. It's built from what you actually read.", null) { CompileSheets() }
    Feature(SKY, "07 · Answer feedback", "Feedback on every answer you write.",
        "Free members get three answer reviews a week. Plus removes the limit and goes deeper on structure, examples and the demand of the question, so Mains practice turns into Mains improvement.",
        "Free: 3 a week · Plus: no limit") { AnswerSheet() }
    Feature(LILAC, "08 · Chotu, all day", "Chotu, 100 conversations a day.",
        "Your study buddy in the cloud, for doubts at midnight and explanations in simpler words. Free members get 15 turns a day. Plus gives you 100.", null) { ChotuTurns(hindi) }

    // 6. Proof they can touch.
    Column(Modifier.padding(top = 24.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Kicker("Don't take our word for it")
        Text("Try three questions from a real Plus paper.", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
    }
    val paper = mocks.firstOrNull { p -> hist.none { it.id == p.id } } ?: mocks.firstOrNull()
    paper?.let { p ->
        val pq = remember(p.id) { p.questions.take(3).mapIndexed { k, q -> PrepQ("${p.id}#$k", q.topic, q.en) } }
        Taste("Three questions from a mock", "From \"${p.title}\". Take your time; there's no clock.") {
            McqRun(pq, "Mock taste", onAnswer) { r, n -> Text("$r of $n. The full paper has ${p.questions.size} questions, and Plus shows you exactly where each miss came from.") }
        }
    }
    val wq = (week.ifEmpty { bank }).take(2)
    if (wq.isNotEmpty()) Taste("This week's Chai test",
        if (week.isNotEmpty()) "${plural(week.size, "question")} from the last 7 days. Two to try." else "Two to try. The test fills up with each day's checked Chai cards.") {
        McqRun(wq, "Weekly test taste", onAnswer)
    }
    Taste("Mock insights", if (hist.isNotEmpty()) "Your own latest paper, the Plus way." else "What your insights look like (sample).") {
        InsightsBody(if (hist.isNotEmpty()) hist.takeLast(1) else SAMPLE_HIST, if (hist.isNotEmpty()) misses.takeLast(1) else SAMPLE_MISSES, hist.isEmpty(), null)
    }

    // 7. What stays free.
    Reveal {
        Rise {
            Column(Modifier.padding(top = 20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Kicker("No catch")
                Text("Everything free stays free. Always.", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, lineHeight = 36.sp)
                Muted("Plus adds depth. It never locks what you already have.")
                listOf("Your pod and the Adda", "Daily Chai and Today's 3", "$pieces practice games", "$reads long reads", "Prelims practice bank", "Focus blocks and Calm", "One full mock a month", "Chotu, 15 turns a day")
                    .chunked(2).forEach { pair ->
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { pair.forEach { FreeChip(it, Modifier.weight(1f)) }; if (pair.size == 1) Box(Modifier.weight(1f)) }
                    }
            }
        }
    }

    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Free and Plus, side by side", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            PlanRow("", "Free", "Plus", bold = true)
            PLAN_ROWS.forEach { (what, free, plus) -> PlanRow(what, if (free == "Always") "✓ Free" else free, if (plus == "Always") "✓ Included" else plus, plusBold = plus != "Always") }
        }
    }

    // 8. The close: the price and the free offer, the only action.
    Reveal {
        Stage(SAF, Modifier.padding(top = 10.dp), pad = 26) {
            Text("The exam doesn't grade effort.", color = TX, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 34.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
            GradText("It grades what you know on the day.", TextStyle(fontSize = 30.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 34.sp), Modifier.fillMaxWidth(), align = TextAlign.Center)
            if (quiet) Text(quietLine, color = TX2, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) else {
                Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(Color.White.copy(alpha = .05f)).border(1.dp, GOLD.copy(alpha = .3f), RoundedCornerShape(20.dp)).padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(if (hindi) "एक साल का PLUS" else "ONE YEAR OF PLUS", color = GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 2.sp)
                    PlusOffer(hindi)
                    PilotButton(hindi)
                    play?.let { PlayButton(it, hindi) }
                }
            }
        }
    }

    Text("Questions", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 10.dp))
    Faq("What stays free?", "Everything you use today: the Adda, your pod, Chotu's Talk, Calm, Chai, Today's 3, daily Prelims practice, Learn and play, long reads and one full mock paper a month. Plus never locks any of it.")
    Faq("What does Plus cost?", "${Honest.inr(PLUS_YEARLY_INR)} for a year. Eligible candidates can try it free: WhatsApp us on $WA_SHOWN to know more, and if you're eligible, Plus opens on this account.")
    Faq("Does Plus guarantee a better score?", "No one honest can promise that. What Plus does is show you exactly where your marks are going and give you the tools to work on it. The work is still yours.")
    Faq("Is my data private?", "Your mock scores, insights and error log stay on this phone, never on our server.")
    Faq("Already have Plus?", "Sign in with that account and every tool here opens.")
    Muted("No streaks. No countdowns. No promises about results.")
}

/** Fades and lifts its content in once its Reveal has scrolled into view. */
@Composable
private fun Rise(content: @Composable () -> Unit) {
    val a = entrance(0, 900)
    Box(Modifier.fillMaxWidth().graphicsLayer { alpha = a; translationY = (1 - a) * 60f }) { content() }
}

@Composable
private fun Kicker(text: String) = Text(text.uppercase(), color = SAF, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 1.8.sp)

/** A real count that counts up from zero when it comes into view. */
@Composable
private fun CountStat(n: Int, label: String, sub: String, modifier: Modifier) {
    val p = entrance(100, 1400)
    Column(modifier.clip(RoundedCornerShape(22.dp)).background(N0).border(1.dp, TX.copy(alpha = .12f), RoundedCornerShape(22.dp)).padding(16.dp)) {
        GradText("%,d".format((n * p).toInt()), TextStyle(fontSize = 40.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 44.sp), colors = listOf(TX, GOLD))
        Text(label, color = TX, fontWeight = FontWeight.SemiBold)
        Text(sub, color = TX2, fontSize = 12.sp)
    }
}

/** One "Inside UPSC Pods" tile: free for everyone, on its own dark card. */
@Composable
private fun InsideTile(accent: Color, title: String, body: String, visual: @Composable ColumnScope.() -> Unit) = Reveal {
    Rise {
        Stage(accent, pad = 20) {
            Text(title, color = TX, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 27.sp)
            Text(body, color = TX2, fontSize = 15.sp, lineHeight = 22.sp)
            Column(Modifier.fillMaxWidth().padding(top = 4.dp).clearAndSetSemantics {}, verticalArrangement = Arrangement.spacedBy(8.dp), content = visual)
        }
    }
}

@Composable
private fun StoryCards() {
    var top by remember { mutableIntStateOf(0) }
    val heads = listOf("One idea at a time", "Then the next one", "Then recall questions")
    Box(Modifier.fillMaxWidth().height(190.dp).clickable { top = (top + 1) % heads.size }) {
        heads.indices.reversed().forEach { i ->
            val q = (i - top + heads.size) % heads.size
            val y by animateFloatAsState(q * 14f, tween(600, easing = FastOutSlowInEasing), label = "card")
            Column(Modifier.fillMaxWidth().padding(bottom = 30.dp).graphicsLayer { translationY = y.dp.toPx(); scaleX = 1f - q * .05f; scaleY = 1f - q * .05f; alpha = 1f - q * .3f }
                .clip(RoundedCornerShape(18.dp)).background(Brush.linearGradient(listOf(PAPER, Color(0xFFF5DFC6)))).padding(16.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                Text("LONG READ · ${i + 1}/${heads.size}", color = Color(0xFF8D4F01), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Text(heads[i], color = Color(0xFF221A14), fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                listOf(.94f, .86f, .7f).forEach { w -> Box(Modifier.fillMaxWidth(w).height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color(0x22221A14))) }
                Text("Swipe →", color = Color(0xFF8D4F01), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun WayChips(ways: List<String>) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        ways.forEachIndexed { k, w ->
            val p = entrance(200 + k * 40, 500)
            Text(w, Modifier.graphicsLayer { alpha = p; scaleX = .8f + .2f * p; scaleY = .8f + .2f * p }.clip(RoundedCornerShape(999.dp))
                .border(1.dp, MINT.copy(alpha = .35f), RoundedCornerShape(999.dp)).padding(horizontal = 10.dp, vertical = 5.dp), color = TX, fontSize = 12.sp)
        }
    }
}

@Composable
private fun ChaiCards() {
    Row { Text("Today's Chai", color = TX, fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.weight(1f)); Text("Checked · 5 min", color = TX2, fontSize = 12.sp) }
    listOf("Polity" to "2 min", "Economy" to "1 min", "Environment" to "1 min", "International relations" to "2 min").forEachIndexed { k, (t, m) ->
        val p = entrance(200 + k * 150, 600)
        Row(Modifier.fillMaxWidth().graphicsLayer { alpha = p; translationY = (1 - p) * 30f }.clip(RoundedCornerShape(12.dp)).background(Color.White.copy(alpha = .05f))
            .border(1.dp, TX.copy(alpha = .1f), RoundedCornerShape(12.dp)).padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(t.uppercase(), Modifier.clip(RoundedCornerShape(6.dp)).background(GOLD.copy(alpha = .12f)).padding(horizontal = 6.dp, vertical = 3.dp), color = GOLD, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
            Box(Modifier.weight(1f).height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color.White.copy(alpha = .12f)))
            Text(m, color = TX2, fontSize = 11.sp)
        }
    }
    Text("Then: Today's 3 questions →", Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Brush.linearGradient(listOf(GOLD, SAF))).padding(12.dp),
        color = Color(0xFF1A0E03), fontWeight = FontWeight.Bold, fontSize = 14.sp)
}

/** A real question from a mock paper, shown the way a reviewed answer looks. */
@Composable
private fun ExplainedQuestion(mocks: List<MockPaper>) {
    val q = remember(mocks) { mocks.asSequence().flatMap { it.questions.asSequence() }.map { it.en }.firstOrNull { it.explanation.isNotBlank() && it.options.size == 4 && it.question.length < 140 } }
    if (q == null) return
    val right = q.answerIndex; val wrong = (right + 2) % 4
    Text(q.question, color = TX, fontSize = 15.sp, lineHeight = 21.sp)
    q.options.forEachIndexed { i, o ->
        val p = entrance(500 + i * 100, 500)
        val tint = when (i) { right -> MINT; wrong -> ROSE; else -> Color.Transparent }
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(tint.copy(alpha = .1f * p)).border(1.dp, if (tint == Color.Transparent) TX.copy(alpha = .12f) else tint.copy(alpha = .3f + .3f * p), RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 9.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(o, color = if (tint == Color.Transparent) TX2 else TX, fontSize = 13.sp, modifier = Modifier.weight(1f))
            if (i == right) Text("Correct", color = MINT, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.graphicsLayer { alpha = p })
            if (i == wrong) Text("Your pick", color = Color(0xFFFF8FA2), fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.graphicsLayer { alpha = p })
        }
    }
    val w = entrance(1300, 600)
    Text("Why: ${q.explanation}", Modifier.graphicsLayer { alpha = w }.clip(RoundedCornerShape(12.dp)).background(N0).padding(12.dp), color = TX2, fontSize = 13.sp, lineHeight = 19.sp)
}

@Composable
private fun ChatBubbles() {
    listOf("Explain the difference between repo and reverse repo, simply?" to true,
        "Think of the RBI as the bank's bank. Repo is the rate at which banks borrow from it…" to false,
        "And why does that move inflation?" to true).forEachIndexed { k, (t, me) ->
        val p = entrance(200 + k * 500, 600)
        Text(t, Modifier.fillMaxWidth().wrapContentWidth(if (me) Alignment.End else Alignment.Start).graphicsLayer { alpha = p; translationY = (1 - p) * 30f }
            .clip(RoundedCornerShape(18.dp)).background(if (me) Brush.linearGradient(listOf(GOLD, SAF)) else Brush.linearGradient(listOf(Color(0xFF211810), Color(0xFF211810))))
            .padding(horizontal = 14.dp, vertical = 10.dp), color = if (me) Color(0xFF1A0E03) else TX, fontSize = 14.sp)
    }
}

@Composable
private fun TrendLine() {
    val p = entrance(300, 2000)
    Canvas(Modifier.fillMaxWidth().height(120.dp).padding(vertical = 8.dp)) {
        val ys = listOf(.82f, .78f, .64f, .66f, .5f, .44f, .4f, .3f, .24f, .16f)
        val path = Path()
        ys.forEachIndexed { i, y -> val x = size.width * i / (ys.size - 1); if (i == 0) path.moveTo(x, size.height * y) else path.lineTo(x, size.height * y) }
        clipRect(right = size.width * p) {
            drawPath(path, Brush.linearGradient(listOf(GOLD, SAF)), style = Stroke(width = 3.5.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
            listOf(0, 3, 6, 9).forEach { i -> drawCircle(GOLD, 5.dp.toPx(), Offset(size.width * i / (ys.size - 1), size.height * ys[i])) }
        }
    }
    Row(Modifier.fillMaxWidth()) { listOf("Paper 1", "Paper 2", "Paper 3", "Paper 4").forEachIndexed { k, t -> Text(t, color = TX2, fontSize = 11.sp, modifier = Modifier.weight(1f), textAlign = if (k == 3) TextAlign.End else if (k == 0) TextAlign.Start else TextAlign.Center) } }
}

@Composable
private fun CompileSheets() {
    val p = entrance(200, 900)
    Box(Modifier.width(230.dp).height(250.dp).padding(16.dp), contentAlignment = Alignment.Center) {
        listOf(Color(0xFFCDBBA7) to -14f, Color(0xFFE6D6C4) to -6f).forEach { (c, r) ->
            Box(Modifier.fillMaxSize().graphicsLayer { rotationZ = r * p; translationX = r * 2f * p }.clip(RoundedCornerShape(14.dp)).background(c))
        }
        Column(Modifier.fillMaxSize().graphicsLayer { rotationZ = 3f * p }.clip(RoundedCornerShape(14.dp)).background(PAPER).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Monthly compilation", color = Color(0xFF2A1A0C), fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
            Text("Economy · Polity · Environment · IR", color = Color(0xFF7A6250), fontSize = 11.sp)
            listOf(.95f, .9f, .65f, .92f, .6f).forEach { w -> Box(Modifier.fillMaxWidth(w).height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color(0xFFDCC8B3))) }
        }
    }
}

@Composable
private fun FreeChip(text: String, modifier: Modifier) {
    Row(modifier.clip(RoundedCornerShape(14.dp)).background(MaterialTheme.colorScheme.surface).border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(14.dp))
        .padding(horizontal = 12.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("✓", color = Color(0xFF1E8A5A), fontWeight = FontWeight.ExtraBold)
        Text(text, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun Faq(q: String, a: String) {
    var open by rememberSaveable(q) { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth().clickable { open = !open }.padding(vertical = 10.dp)) {
        Text((if (open) "▾ " else "▸ ") + q, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        if (open) Text(a, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 6.dp))
    }
}

/** Reached from a preview's "See what Plus adds": the same showcase, as a page. */
@Composable
fun PlusInfoScreen(mocks: List<MockPaper>, week: List<PrepQ>, bank: List<PrepQ>, misses: List<PrepQ>, hist: List<MockRecord>, pieces: Int, reads: Int, ways: List<String>,
                   gate: PlusGate, quiet: Boolean, hindi: Boolean, onAnswer: (PrepQ, Boolean) -> Unit, onTool: (PrepTool) -> Unit, onMocks: () -> Unit, onClose: () -> Unit,
                   play: PlayBuy? = null) =
    PrepPage("Plus", onClose) {
        when {
            gate.loading -> Muted("Loading…")
            gate.member -> PlusHub(hindi, onTool, onMocks)
            else -> PlusShowcase(mocks, week, bank, misses, hist, pieces, reads, ways, quiet, hindi, onAnswer, play)
        }
    }


@Composable
private fun StatusCard(text: String) = FlatCard { Text(text, style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(16.dp)) }

@Composable
private fun Stat(n: Int, label: String, sub: String, modifier: Modifier) {
    FlatCard(modifier) {
        Column(Modifier.padding(12.dp)) {
            Text(n.toString(), style = MaterialTheme.typography.headlineSmall)
            Text(label, style = MaterialTheme.typography.bodyMedium)
            Muted(sub)
        }
    }
}

@Composable
private fun Taste(title: String, lead: String, body: @Composable () -> Unit) {
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) { Text(title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f)); PlusTag() }
            Muted(lead)
            body()
        }
    }
}

@Composable
private fun PlanRow(what: String, free: String, plus: String, bold: Boolean = false, plusBold: Boolean = false) {
    val w = if (bold) FontWeight.Bold else FontWeight.Normal
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Text(what, Modifier.weight(1.4f), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
        Text(free, Modifier.weight(1f), style = MaterialTheme.typography.bodySmall, fontWeight = w)
        Text(plus, Modifier.weight(1f).background(MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f)).padding(horizontal = 4.dp),
            style = MaterialTheme.typography.bodySmall, fontWeight = if (bold || plusBold) FontWeight.Bold else FontWeight.Normal)
    }
}
