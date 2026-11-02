package com.upscpods.app.ui

import android.content.Context
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.AnswerLog
import com.upscpods.app.data.CASE_PAPERS
import com.upscpods.app.data.CaseFile
import com.upscpods.app.data.MapState
import com.upscpods.app.data.Mocks
import com.upscpods.app.data.SYLLABUS_NODES
import com.upscpods.app.data.SyllabusMap
import kotlin.math.roundToInt

/** Your case file: examples kept from Chai, by paper and topic, and the topics with no example yet. */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun CaseFileScreen(caseFile: CaseFile, onClose: () -> Unit) {
    var paper by rememberSaveable { mutableStateOf("GS2") }
    var showGaps by remember { mutableStateOf(false) }
    BackHandler(onBack = onClose)
    Scaffold(topBar = { TopAppBar(title = { Text("Your case file") }, navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            PauseLine("keep-for-mains")
            Text("Examples you kept from Chai, by paper and topic, for your Mains answers. Only you see this.")
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CASE_PAPERS.forEach { p -> FilterChip(selected = p == paper, onClick = { paper = p }, label = { Text("$p (${caseFile.entries.count { it.paper == p }})") }) }
            }
            val mine = caseFile.entries.filter { it.paper == paper }
            val topics = caseFile.topicsOf(paper)
            if (mine.isEmpty()) Text("Nothing kept for this paper yet. On a Chai card, tap Keep for Mains.")
            (topics.map { it.first to it.second } + listOf<Pair<String?, String>>(null to "Not pinned to a topic")).forEach { (id, name) ->
                val ex = mine.filter { it.node == id }
                if (ex.isNotEmpty()) FlatCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(name, style = MaterialTheme.typography.titleSmall)
                        ex.forEach { e ->
                            Row(verticalAlignment = Alignment.Top) {
                                Column(Modifier.weight(1f)) {
                                    Text(e.example, style = MaterialTheme.typography.bodyMedium)
                                    Text("${e.day} · from “${e.from}”", style = MaterialTheme.typography.labelSmall)
                                }
                                TextButton(onClick = { caseFile.remove(e.id) }) { Text("Remove") }
                            }
                        }
                    }
                }
            }
            val gaps = topics.filter { (id, _) -> mine.none { it.node == id } }
            if (mine.isNotEmpty() && gaps.isNotEmpty()) {
                TextButton(onClick = { showGaps = !showGaps }) { Text("Topics with no example yet (${gaps.size})") }
                if (showGaps) gaps.forEach { Text("• ${it.second}", style = MaterialTheme.typography.bodySmall) }
            }
        }
    }
}

private val AREAS = listOf("directive" to "Directive word", "structure" to "Structure", "content" to "Content coverage", "examples" to "Examples and data", "conclusion" to "Conclusion")
private val BAND_N = mapOf("below" to 1.0, "at" to 2.0, "above" to 3.0)
private fun one(x: Double) = ((x * 10).roundToInt() / 10.0).toString()

/** You vs. you: only against your own past. The web copy is viewProgress in app.js. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProgressScreen(answerLog: AnswerLog, mocks: Mocks, syllabusMap: SyllabusMap, caseFile: CaseFile, targetYear: String?, onClose: () -> Unit) {
    val context = LocalContext.current
    BackHandler(onBack = onClose)
    Scaffold(topBar = { TopAppBar(title = { Text("You vs. you") }, navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            PauseLine("you-vs-you")
            Text("Only against your own past. No ranks, no cut-offs, nobody else's numbers.")
            targetYear?.toIntOrNull()?.let { y ->
                val weeks = java.time.temporal.ChronoUnit.WEEKS.between(java.time.LocalDate.now(), java.time.LocalDate.of(y, 5, 25))
                if (weeks > 0) Text("Prelims $y is about $weeks weeks away (UPSC usually holds it in late May; check the official calendar).")
            }
            val counts = syllabusMap.counts()
            Section("Your syllabus map") {
                Text("${counts[MapState.MET] ?: 0} Met · ${counts[MapState.RECALL] ?: 0} Can recall · ${counts[MapState.USE] ?: 0} Can use, out of ${SYLLABUS_NODES.size} topics.")
            }
            val wl = answerLog.all().filter { it.ai.isNotEmpty() }
            Section("Writing") {
                if (wl.size < 6) Text("After six answers with a second opinion (${wl.size} so far), this compares your first five with your last five.", style = MaterialTheme.typography.bodySmall)
                else {
                    val first = wl.take(5); val last = wl.takeLast(5)
                    fun agree(ws: List<com.upscpods.app.data.AnswerAttempt>) = ws.map { w -> AREAS.count { (k, _) -> w.self[k] != null && w.self[k] == w.ai[k] }.toDouble() }.average()
                    Text("Your own marks agreed with the second opinion on ${one(agree(first))} of 5 parts in your first five answers, and ${one(agree(last))} in your last five. That gap closing is the real progress.")
                    AREAS.forEach { (k, name) ->
                        val a = first.mapNotNull { BAND_N[it.ai[k]] }.takeIf { it.isNotEmpty() }?.average()
                        val b = last.mapNotNull { BAND_N[it.ai[k]] }.takeIf { it.isNotEmpty() }?.average()
                        Text("$name: ${a?.let(::one) ?: "–"} → ${b?.let(::one) ?: "–"}", style = MaterialTheme.typography.bodyMedium)
                    }
                    Text("1 is below a typical scoring answer, 2 at it, 3 above it.", style = MaterialTheme.typography.bodySmall)
                }
            }
            val hist = mocks.history()
            Section("Sure and not sure") {
                val sureR = hist.sumOf { it.right - it.unsureRight }; val sureT = hist.sumOf { it.attempted - it.unsureTotal }
                val gR = hist.sumOf { it.unsureRight }; val gT = hist.sumOf { it.unsureTotal }
                if (sureT >= 20 && gT >= 10) {
                    val g = gR.toDouble() / gT
                    Text("When you were sure: ${100 * sureR / sureT}% right. When you marked a guess: ${100 * gR / gT}%. " +
                        when { g > 0.45 -> "Your guesses do better than you think; trust them a little more."; g < 0.3 -> "Guesses cost you marks; skip more of them."; else -> "Your sense of what you know is about right." })
                } else Text("Mark answers “Not sure” in mocks. After a few papers this shows how far your sense of sure matches your marks.", style = MaterialTheme.typography.bodySmall)
            }
            val nodes = syllabusMap.nodes().values
            val met = nodes.map { it.met }.sorted(); val recalled = nodes.mapNotNull { it.recalledOn }.sorted(); val used = nodes.mapNotNull { it.usedOn }.sorted()
            val rewrites = answerLog.all().filter { it.rewritten }.mapNotNull { it.endedAt }.sorted().map { java.time.Instant.ofEpochMilli(it).atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString() }
            val essays = context.getSharedPreferences("essays", Context.MODE_PRIVATE).all.filterKeys { it.endsWith(":s3done") }.values.map { it.toString() }.sorted()
            val boards = runCatching { Regex("\"day\":\"([\\d-]+)\"").findAll(context.getSharedPreferences("interview", Context.MODE_PRIVATE).getString("log", "[]")!!).map { it.groupValues[1] }.sorted().toList() }.getOrDefault(emptyList())
            val markers = listOf("Your first topic Met" to met.getOrNull(0), "Ten topics Met" to met.getOrNull(9), "Your first topic you Can recall" to recalled.getOrNull(0),
                "Your first topic you Can use" to used.getOrNull(0), "Your first answer rewritten" to rewrites.getOrNull(0), "Ten answers rewritten" to rewrites.getOrNull(9),
                "Your first full mock" to hist.firstOrNull()?.day, "Your first essay in three snaps" to essays.firstOrNull(), "Your first mock interview" to boards.firstOrNull(),
                "Ten examples in your case file" to caseFile.entries.map { it.day }.sorted().getOrNull(9))
            Section("Markers") {
                Text("The day you first reached each one.", style = MaterialTheme.typography.bodySmall)
                markers.forEach { (label, d) ->
                    Row { Text(label, Modifier.weight(1f)); Text(d?.let { "✓ $it" } ?: "Not yet", style = MaterialTheme.typography.labelMedium, color = if (d != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant) }
                }
            }
        }
    }
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            content()
        }
    }
}
