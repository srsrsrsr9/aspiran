package com.upscpods.app.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.MainsTask
import com.upscpods.app.data.Pyq
import com.upscpods.app.data.PyqPaper
import com.upscpods.app.data.Pyqs
import com.upscpods.app.data.SYLLABUS
import com.upscpods.app.data.syllabusNode

// Practice → PYQ: UPSC's own past questions, by paper, or under one syllabus topic when opened from the Syllabus.
// A Mains question goes to Answer Studio to be written; a Prelims question is answered here, and only papers with
// UPSC's official key say whether you were right.

/** What the PYQ page shows: one paper's questions, or one syllabus topic's across every year. */
data class PyqFocus(val paper: String, val topic: String? = null)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PyqScreen(papers: List<PyqPaper>, focus: PyqFocus?, onWrite: (MainsTask) -> Unit, onClose: () -> Unit) {
    val all = remember(papers) { Pyqs.all(papers) }
    val shelves = remember(papers) { SYLLABUS.filter { s -> papers.any { it.paper == s.id } } }
    var paper by rememberSaveable(focus) { mutableStateOf(focus?.paper ?: shelves.firstOrNull()?.id ?: "gs1") }
    val topic = focus?.takeIf { it.paper == paper }?.topic
    val shown = remember(all, paper, topic) {
        val sp = SYLLABUS.firstOrNull { it.id == paper }
        val t = sp?.topics?.firstOrNull { it.name == topic }
        if (sp != null && t != null) Pyqs.forTopic(all, sp, t) else all.filter { it.paper.paper == paper }
    }
    PrepSpace {
        Scaffold(topBar = { TopAppBar(title = { Text("Past UPSC questions") }, navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } }) }) { padding ->
            Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("The questions UPSC actually set, from the papers on upsc.gov.in. Mains: write one in Answer Studio. Prelims: answers only from UPSC's official key.",
                    style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (shelves.isEmpty()) {
                    Text("Past papers land here once our editors have checked them against UPSC's PDFs.", style = MaterialTheme.typography.titleSmall)
                    return@Column
                }
                Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    shelves.forEach { s -> FilterChip(selected = s.id == paper, onClick = { paper = s.id }, label = { Text(s.short) }) }
                }
                if (topic != null) Text("Under “$topic” · ${shown.size}", style = MaterialTheme.typography.titleMedium)
                if (shown.isEmpty()) Text("No past question sits under this topic yet.", style = MaterialTheme.typography.bodyMedium)
                shown.forEach { pq -> if (pq.paper.mains) MainsPyq(pq, onWrite) else PrelimsPyq(pq) }
            }
        }
    }
}

@Composable
private fun PyqHead(pq: Pyq) {
    val topics = pq.q.nodes.mapNotNull { syllabusNode(it)?.second?.name?.substringBefore(':')?.substringBefore(',') }.distinct()
    Text(pq.label + (if (topics.isEmpty()) "" else " · " + topics.joinToString(" · ")), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
}

@Composable
private fun MainsPyq(pq: Pyq, onWrite: (MainsTask) -> Unit) = FlatCard {
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        PyqHead(pq)
        Text(pq.q.en.q, style = MaterialTheme.typography.bodyLarge)
        Text(listOfNotNull(pq.q.words?.let { "$it words" }, pq.q.marks?.let { "${it.toInt()} marks" }).joinToString(" · "),
            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedButton(onClick = { onWrite(pq.asMainsTask()) }) { Text("Write it in Answer Studio") }
    }
}

@Composable
private fun PrelimsPyq(pq: Pyq) = FlatCard {
    val answer = pq.paper.answerOf(pq.q)
    var picked by rememberSaveable(pq.id) { mutableIntStateOf(-1) }
    val context = LocalContext.current
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        PyqHead(pq)
        Text(pq.q.en.q, style = MaterialTheme.typography.bodyLarge)
        pq.q.en.options.forEachIndexed { k, opt ->
            FilterChip(selected = picked == k, onClick = { if (picked < 0) picked = k },
                label = { Text("(${'a' + k}) $opt", modifier = Modifier.padding(vertical = 8.dp)) }, modifier = Modifier.fillMaxWidth())
        }
        val keyName = if (pq.paper.answerKey.provisional) "provisional key" else "official key"
        if (picked >= 0) Text(
            when {
                answer == null && pq.q.n in pq.paper.answerKey.dropped -> "UPSC dropped this question in its official key."
                answer == null -> "UPSC hasn't published the official key for this paper yet, so we don't say which answer is right."
                picked == answer -> "✓ Right, per UPSC's ${keyName}."
                else -> "○ Not quite. UPSC's ${keyName} says (${'a' + answer}) ${pq.q.en.options.getOrElse(answer) { "" }}."
            },
            style = MaterialTheme.typography.bodyLarge,
        )
        val key = pq.paper.answerKey.url ?: pq.paper.source.url
        if (picked >= 0 && key.isNotBlank()) TextButton(onClick = { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(key))) }) {
            Text(if (answer != null) "UPSC's $keyName ↗" else "The paper on upsc.gov.in ↗")
        }
    }
}
