package com.upscpods.app.ui

import android.app.Activity
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.upscpods.app.data.ActiveMock
import com.upscpods.app.data.MockBand
import com.upscpods.app.data.MockLast
import com.upscpods.app.data.MockPaper
import com.upscpods.app.data.MockRecord
import com.upscpods.app.data.Mocks
import com.upscpods.app.data.QUICK
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Mock papers, matching the web app's Prep → Mocks: timed, UPSC negative marking, a question palette,
// results as a range over the last five papers (playbook A8), answers with explanations, and the opt-in band.

/** Prep → Mocks: the papers, the paper in progress, your range and past papers. Works offline from the cache. */
@Composable
fun MockListTab(
    papers: List<MockPaper>,
    quick: MockPaper?,
    active: ActiveMock?,
    history: List<MockRecord>,
    onStart: (MockPaper) -> Unit,
    onResume: () -> Unit,
    onOpenResult: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var confirm by remember { mutableStateOf<MockPaper?>(null) }
    Column(modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Mock papers", style = MaterialTheme.typography.titleLarge)
        Text("Timed, with negative marking. Full screen, and your blocked apps stay closed until you submit.", style = MaterialTheme.typography.bodyMedium)
        if (active != null) {
            FlatCard {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Paper in progress", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Text(active.paper.title, style = MaterialTheme.typography.titleMedium)
                    val left = active.endsAt - System.currentTimeMillis()
                    Text("${active.answers.size} of ${active.paper.questions.size} answered · " +
                        if (active.paper.countUp) "no countdown" else if (left > 0) "${clock(left)} left" else "time is up",
                        style = MaterialTheme.typography.bodyMedium)
                    Button(onClick = onResume, modifier = Modifier.height(MainActionHeight)) { Text(if (left > 0) "Back to the paper" else "See the result") }
                }
            }
        }
        papers.forEach { p -> PaperCard(p, enabled = active == null) { confirm = p } }
        if (quick != null) PaperCard(quick, enabled = active == null) { confirm = quick }
        else Text("A quick mock appears once there are 10 or more checked questions.", style = MaterialTheme.typography.bodySmall)
        if (papers.isEmpty()) {
            Text("Full-length papers appear here after an editor writes and approves them on the desk. Connect to the pod server once to get them; after that they open offline.",
                style = MaterialTheme.typography.bodySmall)
        }
        if (history.isNotEmpty()) {
            Text("Your range", style = MaterialTheme.typography.titleLarge)
            RangeBand(history)
            Text("Past papers", style = MaterialTheme.typography.titleMedium)
            history.asReversed().take(10).forEachIndexed { i, r ->
                Row(
                    Modifier.fillMaxWidth().then(if (i == 0) Modifier.clickable(onClick = onOpenResult) else Modifier).padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(r.title, style = MaterialTheme.typography.bodyLarge)
                        Text("${r.day} · ${num(r.score)} of ${num(r.max)} · ${r.attempted} attempted" + if (i == 0) " · see answers" else "",
                            style = MaterialTheme.typography.bodySmall)
                    }
                    Text("${r.pct}%", style = MaterialTheme.typography.titleMedium)
                }
            }
        }
    }
    confirm?.let { p ->
        AlertDialog(
            onDismissRequest = { confirm = null },
            title = { Text(p.title) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(if (p.countUp) "• ${p.questions.size} questions. Suggested time: about ${p.minutes} minutes, just a guide." else "• ${p.questions.size} questions in ${p.minutes} minutes.")
                    Text("• +${num(p.marking.right)} for a right answer, ${num(p.marking.wrong)} for a wrong one, 0 if you leave it.")
                    Text("• Tick “Not sure” when you guess. Afterwards you'll see whether your guesses are paying off.")
                    Text(
                        if (p.countUp) "• No countdown. " + (if (p.timerOff) "The timer is off; switch on an upward timer if you want one." else "The timer counts up.") +
                            " You submit when you're done. If you close the app, the paper waits for you."
                        else "• The paper submits itself when time runs out. If you close the app, the clock keeps running and the paper waits for you.",
                    )
                    if (p.note.isNotBlank()) Text(p.note, style = MaterialTheme.typography.bodySmall)
                    PauseLine("first-mock-start")
                }
            },
            confirmButton = { Button(onClick = { confirm = null; onStart(p) }) { Text("Start the paper") } },
            dismissButton = { TextButton(onClick = { confirm = null }) { Text("Not now") } },
        )
    }
}

@Composable
private fun PaperCard(p: MockPaper, enabled: Boolean, onStart: () -> Unit) {
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(p.title, style = MaterialTheme.typography.titleMedium)
            Text("${p.questions.size} questions · ${if (p.countUp) "about ${p.minutes} min suggested, no countdown" else "${p.minutes} min"} · ${p.marking.label()} per question",
                style = MaterialTheme.typography.bodySmall)
            if (p.checkedBy != null) Text("Checked by ${p.checkedBy}${p.checkedOn?.let { ", $it" } ?: ""} ✓", style = MaterialTheme.typography.bodySmall)
            if (p.note.isNotBlank()) Text(p.note, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            OutlinedButton(onClick = onStart, enabled = enabled) { Text("Start") }
        }
    }
}

/** The paper itself: full screen, one question at a time, a palette, and a clock that submits at zero. */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun MockPaperScreen(start: ActiveMock, onChange: (ActiveMock) -> Unit, onSubmit: (ActiveMock) -> Unit, onLeave: () -> Unit) {
    var m by remember { mutableStateOf(start) }
    val update = { next: ActiveMock -> m = next; onChange(next) }
    val p = m.paper
    val n = p.questions.size
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var submitted by remember { mutableStateOf(false) }
    val submit = { if (!submitted) { submitted = true; onSubmit(m) } }
    var paletteOpen by rememberSaveable { mutableStateOf(false) }
    var confirmSubmit by remember { mutableStateOf(false) }
    var confirmLeave by remember { mutableStateOf(false) }

    // The clock is wall time, so it's right after the app was closed; at zero the paper submits itself.
    LaunchedEffect(Unit) {
        while (true) {
            now = System.currentTimeMillis()
            if (!m.paper.countUp && now >= m.endsAt) { submit(); break }
            delay(500)
        }
    }
    FullScreen()
    BackHandler { confirmLeave = true }

    val left = m.endsAt - now
    val q = p.questions[m.cur.coerceIn(0, n - 1)]
    val go = { i: Int ->
        val to = i.coerceIn(0, n - 1)
        // Leaving a question unanswered marks it passed: answered later, it's a second try (Mock Intelligence).
        // Per-question timing: the seconds on the one being left are added up; the next one's clock starts now.
        val t = System.currentTimeMillis()
        val spent = if (m.onAt > 0) ((t - m.onAt) / 1000).toInt() else 0
        update(m.copy(cur = to, passed = if (to != m.cur && m.answers[m.cur] == null) m.passed + m.cur else m.passed,
            secs = if (to != m.cur) m.secs + (m.cur to (m.secs[m.cur] ?: 0) + spent) else m.secs, onAt = if (to != m.cur || m.onAt == 0L) t else m.onAt)); paletteOpen = false
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(p.title, style = MaterialTheme.typography.titleMedium)
                        Text("${m.answers.size} answered · ${n - m.answers.size} left", style = MaterialTheme.typography.labelSmall)
                    }
                },
                navigationIcon = { TextButton(onClick = { confirmLeave = true }) { Text("← Leave") } },
                actions = {
                    if (p.countUp) {
                        // Never a countdown: off by default, and when switched on it counts up from the start.
                        val spent = clock(now - m.startedAt)
                        Text(
                            if (m.hideTimer) "Timer off" else "$spent so far",
                            style = MaterialTheme.typography.titleMedium.copy(fontFeatureSettings = "tnum"),
                            modifier = Modifier.clickable { update(m.copy(hideTimer = !m.hideTimer)) }.padding(horizontal = 8.dp)
                                .semantics { contentDescription = if (m.hideTimer) "Timer off. Tap to switch on an upward timer. Suggested about ${p.minutes} minutes." else "$spent so far. Tap to switch the timer off." },
                        )
                    } else Text(
                        if (m.hideTimer) (if (left < 5 * 60_000) "${clock(left)} left" else "Timer hidden") else clock(left),
                        style = MaterialTheme.typography.titleMedium.copy(fontFeatureSettings = "tnum"),
                        modifier = Modifier.clickable { update(m.copy(hideTimer = !m.hideTimer)) }.padding(horizontal = 8.dp)
                            .semantics { contentDescription = if (m.hideTimer) "Timer hidden. Tap to show." else "${clock(left)} left. Tap to hide the timer." },
                    )
                },
            )
        },
        bottomBar = {
            Column(Modifier.navigationBarsPadding().padding(horizontal = 16.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { go(m.cur - 1) }, enabled = m.cur > 0, modifier = Modifier.weight(1f)) { Text("← Previous") }
                    OutlinedButton(onClick = { paletteOpen = !paletteOpen }, modifier = Modifier.weight(1f)) { Text(if (paletteOpen) "Close" else "Questions") }
                    Button(onClick = { if (m.cur == n - 1) confirmSubmit = true else go(m.cur + 1) }, modifier = Modifier.weight(1f)) {
                        Text(if (m.cur == n - 1) "Submit" else "Next →")
                    }
                }
            }
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (paletteOpen) {
                Text("Tap a number to jump. Filled: answered. Ringed: come back to it.", style = MaterialTheme.typography.bodySmall)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    p.questions.indices.forEach { i -> PaletteCell(i, answered = i in m.answers, review = i in m.review, current = i == m.cur) { go(i) } }
                }
                OutlinedButton(onClick = { confirmSubmit = true }) { Text("Submit paper") }
                Spacer(Modifier.height(4.dp))
            }
            Text("Question ${m.cur + 1} of $n" + if (q.topic.isNotBlank()) " · ${q.topic}" else "", style = MaterialTheme.typography.labelMedium)
            Text(q.en.question, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            q.en.options.forEachIndexed { i, opt ->
                FilterChip(
                    selected = m.answers[m.cur] == i,
                    // Tapping your answer again clears it: leaving a question scores 0.
                    onClick = {
                        val into = if (m.onAt > 0) ((System.currentTimeMillis() - m.onAt) / 1000).toInt() else null
                        update(m.copy(answers = if (m.answers[m.cur] == i) m.answers - m.cur else m.answers + (m.cur to i),
                            answerSecs = if (m.answers[m.cur] == i || into == null) m.answerSecs else m.answerSecs + (m.cur to into)))
                    },
                    label = { Text((if (m.answers[m.cur] == i) "✓ " else "") + "${"abcd".getOrElse(i) { '•' }}) $opt", modifier = Modifier.padding(vertical = 8.dp)) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            CheckLine("Not sure (a guess)", m.cur in m.unsure) { on -> update(m.copy(unsure = if (on) m.unsure + m.cur else m.unsure - m.cur)) }
            CheckLine("Come back to this", m.cur in m.review) { on -> update(m.copy(review = if (on) m.review + m.cur else m.review - m.cur)) }
            if (p.note.isNotBlank()) Text(p.note, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }

    if (confirmSubmit) {
        val unanswered = n - m.answers.size
        AlertDialog(
            onDismissRequest = { confirmSubmit = false },
            title = { Text("Submit the paper?") },
            text = { Text("$unanswered unanswered" + (if (m.review.isNotEmpty()) ", ${m.review.size} marked to come back to" else "") + ". Unanswered questions score 0.") },
            confirmButton = { Button(onClick = { confirmSubmit = false; submit() }) { Text("Submit") } },
            dismissButton = { TextButton(onClick = { confirmSubmit = false }) { Text("Keep working") } },
        )
    }
    if (confirmLeave) {
        AlertDialog(
            onDismissRequest = { confirmLeave = false },
            title = { Text("Step out of the paper?") },
            text = { Text("The clock keeps running, as in the exam hall. Your answers are saved; come back from Prep → Mocks.") },
            confirmButton = { Button(onClick = { confirmLeave = false }) { Text("Keep working") } },
            dismissButton = { TextButton(onClick = { confirmLeave = false; onLeave() }) { Text("Step out") } },
        )
    }
}

@Composable
private fun CheckLine(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().clickable { onChange(!checked) }, verticalAlignment = Alignment.CenterVertically) {
        Checkbox(checked = checked, onCheckedChange = onChange)
        Text(label, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun PaletteCell(i: Int, answered: Boolean, review: Boolean, current: Boolean, onClick: () -> Unit) {
    val c = MaterialTheme.colorScheme
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        color = if (answered) c.primaryContainer else c.surfaceContainerLow,
        border = when {
            current -> BorderStroke(2.dp, c.primary)
            review -> BorderStroke(2.dp, c.tertiary)
            else -> BorderStroke(1.dp, c.surfaceVariant)
        },
        modifier = Modifier.size(44.dp).semantics {
            contentDescription = "Question ${i + 1}" + (if (answered) ", answered" else "") + (if (review) ", marked to come back to" else "") + (if (current) ", current" else "")
        },
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text("${i + 1}", style = MaterialTheme.typography.labelLarge, color = if (answered) c.onPrimaryContainer else c.onSurface)
        }
    }
}

/** Hides the system bars and keeps the screen on while the paper is open. */
@Composable
private fun FullScreen() {
    val view = LocalView.current
    val window = (LocalContext.current as? Activity)?.window
    DisposableEffect(window) {
        val ctl = window?.let { WindowCompat.getInsetsController(it, view) }
        ctl?.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        ctl?.hide(WindowInsetsCompat.Type.systemBars())
        view.keepScreenOn = true
        onDispose {
            ctl?.show(WindowInsetsCompat.Type.systemBars())
            view.keepScreenOn = false
        }
    }
}

/** After the paper: score, range, guesses, the opt-in band, then every answer with its explanation. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MockResultScreen(
    record: MockRecord,
    last: MockLast,
    history: List<MockRecord>,
    savedBand: MockBand?,
    resultWeek: Boolean,
    shareBand: suspend () -> MockBand?,
    onClose: () -> Unit,
    /** Members without Plus: Chotu brings it up here, right after the result, when it's most useful. */
    onSeePlus: (() -> Unit)? = null,
) {
    BackHandler(onBack = onClose)
    val scope = rememberCoroutineScope()
    var filter by rememberSaveable { mutableStateOf("wrong") }
    var band by remember { mutableStateOf(savedBand) }
    var bandOpen by rememberSaveable { mutableStateOf(true) }
    var bandError by remember { mutableStateOf<String?>(null) }
    var asking by remember { mutableStateOf(false) }
    Scaffold(
        topBar = { TopAppBar(title = { Text("Paper done.") }, navigationIcon = { TextButton(onClick = onClose) { Text("← Mocks") } }) },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("${record.title} · ${record.minutes} min", style = MaterialTheme.typography.bodyMedium)
            FlatCard {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(num(record.score), style = MaterialTheme.typography.displaySmall)
                    Text("of ${num(record.max)} · ${record.right} right, ${record.wrong} wrong, ${last.paper.questions.size - record.attempted} left",
                        style = MaterialTheme.typography.bodyMedium)
                    RangeBand(history)
                }
            }
            // Opt-in band: full papers only, never in result week, and never a rank.
            if (record.id != QUICK && !resultWeek && bandOpen) {
                FlatCard {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        val b = band
                        if (b != null) {
                            Text("Your band", style = MaterialTheme.typography.titleMedium)
                            Text(b.line, style = MaterialTheme.typography.bodyLarge)
                            Text("A band among people who shared, never a rank.", style = MaterialTheme.typography.bodySmall)
                        } else {
                            Text("See where you sit?", style = MaterialTheme.typography.titleMedium)
                            Text("Share your percent for this paper anonymously (no member id, no name) and see a band once 30 people have. Never a rank.",
                                style = MaterialTheme.typography.bodyMedium)
                            bandError?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error) }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(enabled = !asking, onClick = {
                                    asking = true; bandError = null
                                    scope.launch {
                                        val got = shareBand()
                                        if (got == null) bandError = "Couldn't reach the server. Your result is saved here; try again when you're online."
                                        band = got; asking = false
                                    }
                                }) { Text(if (asking) "Sharing…" else "Share and see my band") }
                                TextButton(onClick = { bandOpen = false }) { Text("No thanks") }
                            }
                        }
                    }
                }
            }
            guessLine(record)?.let { line ->
                Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = MaterialTheme.shapes.medium) {
                    Text(line, Modifier.padding(16.dp), style = MaterialTheme.typography.bodyMedium)
                }
            }
            val weak = record.topics.filter { (_, t) -> t.wrong + t.skipped > t.right }.keys.take(3)
            if (weak.isNotEmpty()) {
                Text("Worth a look: ${weak.joinToString(", ")}." + if (last.paper.questions.any { it.cardId != null }) " Wrong answers from Chai cards come back in your Prelims questions." else "",
                    style = MaterialTheme.typography.bodyLarge)
            }
            if (onSeePlus != null && !resultWeek) ChotuSays(
                if (weak.isNotEmpty()) "Want the full picture? Plus breaks this paper down topic by topic, shows where your marks leak, and brings every miss back until it sticks."
                else "Nice paper! Plus tracks every mock like this one, shows your trend, and brings each miss back until it sticks.",
                ChotuMood.PROUD, size = 52.dp,
            ) { TextButton(onClick = onSeePlus) { Text("See what Plus shows →") } }
            Text("Go through the answers", style = MaterialTheme.typography.titleLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("wrong" to "Wrong", "skipped" to "Skipped", "all" to "All").forEach { (v, l) ->
                    FilterChip(selected = filter == v, onClick = { filter = v }, label = { Text(l) })
                }
            }
            val shown = last.paper.questions.indices.filter { i ->
                val a = last.answers[i]
                when (filter) { "wrong" -> a != null && a != last.paper.questions[i].en.answerIndex; "skipped" -> a == null; else -> true }
            }
            if (shown.isEmpty()) Text(if (filter == "wrong") "None wrong. Well done." else "Nothing here.", style = MaterialTheme.typography.bodyMedium)
            shown.forEach { i -> AnswerCard(i, last) }
            OutlinedButton(onClick = onClose) { Text("Back to mock papers") }
        }
    }
}

@Composable
private fun AnswerCard(i: Int, last: MockLast) {
    val q = last.paper.questions[i]
    val a = last.answers[i]
    val c = MaterialTheme.colorScheme
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Question ${i + 1}" + (if (q.topic.isNotBlank()) " · ${q.topic}" else "") + (if (i in last.unsure) " · you marked it a guess" else ""),
                style = MaterialTheme.typography.labelMedium)
            Text(q.en.question, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
            q.en.options.forEachIndexed { j, opt ->
                val right = j == q.en.answerIndex
                val mine = j == a
                val (bg, mark) = when {
                    right -> c.tertiary.copy(alpha = 0.18f) to "✓ "
                    mine -> c.error.copy(alpha = 0.14f) to "✗ "
                    else -> c.surfaceContainerLow to ""
                }
                Text(
                    mark + opt + (if (mine) "  (your answer)" else "") + (if (right) "  (correct)" else ""),
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(bg).padding(10.dp),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            if (a == null) Text("You left this one: 0 marks.", style = MaterialTheme.typography.bodySmall)
            if (q.en.explanation.isNotBlank()) Text(q.en.explanation, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

/** Your last five papers as a range, never one number on its own (playbook A8). */
@Composable
fun RangeBand(hist: List<MockRecord>) {
    val last = hist.takeLast(5)
    val newest = last.lastOrNull() ?: return
    if (last.size < 2) {
        Text("${newest.pct}% on your first paper here. One paper is a small sample; your range appears after the second.", style = MaterialTheme.typography.bodyMedium)
        return
    }
    val lo = last.minOf { it.pct }; val hi = last.maxOf { it.pct }
    val prev = last.dropLast(1); val plo = prev.minOf { it.pct }; val phi = prev.maxOf { it.pct }
    val c = MaterialTheme.colorScheme
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Your range: $lo% to $hi% over your last ${last.size} papers", style = MaterialTheme.typography.titleSmall)
        BoxWithConstraints(
            Modifier.fillMaxWidth().height(16.dp).clip(RoundedCornerShape(8.dp)).background(c.surfaceVariant)
                .semantics { contentDescription = "Range $lo to $hi percent, newest ${newest.pct} percent" },
        ) {
            val w = maxWidth
            Box(Modifier.offset(x = w * (lo / 100f)).width(w * (maxOf(hi - lo, 1) / 100f)).fillMaxHeight().background(c.primary.copy(alpha = 0.45f)))
            Box(Modifier.offset(x = (w * (newest.pct / 100f) - 6.dp).coerceIn(0.dp, w - 12.dp)).size(12.dp).align(Alignment.CenterStart)
                .clip(CircleShape).background(c.primary).border(1.dp, c.onPrimary, CircleShape))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("0%", style = MaterialTheme.typography.labelSmall); Text("100%", style = MaterialTheme.typography.labelSmall)
        }
        if (newest.pct in plo..phi) Text("Inside your normal range.", style = MaterialTheme.typography.bodyMedium)
        if (newest.pct > phi) Text("Above your usual range. Note what you did differently.", style = MaterialTheme.typography.bodyMedium)
    }
}

/** A guess pays when its hit rate beats the break-even point for this marking. Needs 3 or more guesses. */
private fun guessLine(r: MockRecord): String? {
    if (r.unsureTotal < 3) return null
    val be = Mocks.breakEven(r.marking)
    val hit = r.unsureRight.toDouble() / r.unsureTotal
    return "Your guesses: ${r.unsureRight} of ${r.unsureTotal} right. " + when {
        hit > be + 0.1 -> "That's well above break-even, so your educated guesses are earning marks."
        hit < be -> "That's below break-even with negative marking, so skip more of the wild ones."
        else -> "That's about break-even: guesses aren't gaining or losing much yet."
    }
}

private fun num(d: Double) = if (d == d.toLong().toDouble()) d.toLong().toString() else "%.2f".format(d).trimEnd('0').trimEnd('.')

private fun clock(ms: Long): String {
    val s = maxOf(ms, 0) / 1000
    val h = s / 3600; val m = (s % 3600) / 60; val sec = s % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, sec) else "%02d:%02d".format(m, sec)
}
