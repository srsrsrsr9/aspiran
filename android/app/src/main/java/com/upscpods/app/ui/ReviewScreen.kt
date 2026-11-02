package com.upscpods.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Fsrs
import com.upscpods.app.data.PracticeQuestion

/** A syllabus topic due a recall check: its node id, paper, name and the note written when it was met. */
data class TopicCheck(val id: String, val paper: String, val name: String, val note: String)

/**
 * The review (teaching plan, build step 1): recall first. Topics from the syllabus map that are due a check, then
 * questions that are due. Everything is graded by FSRS and comes back just before you'd forget it. Nothing is scored
 * or shared.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ReviewScreen(
    topics: List<TopicCheck>,
    questions: List<PracticeQuestion>,
    onCheck: (TopicCheck, Int) -> Unit,
    onAnswer: (PracticeQuestion, Boolean) -> Unit,
    onFinished: () -> Unit,
    onClose: () -> Unit,
    /** Your own notes pinned to a topic (Your room), shown with its check. */
    notesFor: (String) -> List<String> = { emptyList() },
) {
    var index by rememberSaveable { mutableIntStateOf(0) }
    var showNote by rememberSaveable(index) { mutableStateOf(false) }
    if (index >= topics.size && questions.isNotEmpty()) {
        PrelimsScreen(questions, onAnswer, onFinished, onClose, title = "Review")
        return
    }
    val finished = index >= topics.size
    if (finished) LaunchedEffect(Unit) { onFinished() }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (finished) "Review" else "Topic ${index + 1} of ${topics.size}") },
                navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } },
            )
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (finished) {
                Text(if (topics.isEmpty()) "Nothing due today." else "That's today's review.", style = MaterialTheme.typography.headlineSmall)
                Text("Each one comes back just before you'd forget it. The ones you knew well wait longer.", style = MaterialTheme.typography.bodyLarge)
                OutlinedButton(onClick = onClose) { Text("Back") }
                return@Column
            }
            val t = topics[index]
            Text("${t.paper} · Topic check", style = MaterialTheme.typography.labelMedium)
            Text(t.name, style = MaterialTheme.typography.headlineSmall)
            Text("Close your notes. Say or write the main points from memory, then check them.", style = MaterialTheme.typography.bodyLarge)
            if (t.note.isNotBlank()) {
                if (showNote) Text(t.note, style = MaterialTheme.typography.bodyMedium)
                else TextButton(onClick = { showNote = true }) { Text("Check against what you wrote when you met it") }
            }
            notesFor(t.id).takeIf { it.isNotEmpty() }?.let { mine ->
                Text("Your notes on this", style = MaterialTheme.typography.labelLarge)
                mine.forEach { Text(it, style = MaterialTheme.typography.bodyMedium) }
            }
            Text("How much came back?", style = MaterialTheme.typography.labelLarge)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(Fsrs.AGAIN to "Little", Fsrs.HARD to "Some, with effort", Fsrs.GOOD to "Most of it", Fsrs.EASY to "All of it, easily").forEach { (g, label) ->
                    val pick: () -> Unit = { onCheck(t, g); index++ }
                    if (g == Fsrs.GOOD) Button(onClick = pick) { Text(label) } else OutlinedButton(onClick = pick) { Text(label) }
                }
            }
        }
    }
}
