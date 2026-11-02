package com.upscpods.app.ui

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.DistressMatcher
import com.upscpods.app.data.RoomStore
import com.upscpods.app.data.SYLLABUS_NODES
import java.time.LocalDate

private val HOURS = listOf(5 to "5 or less", 6 to "About 6", 7 to "About 7", 8 to "8 or more")
private val FELT = listOf("rested" to "Rested", "okay" to "Okay", "tired" to "Tired")

/** Your room on Me: sleep, notes, to-dos, the journal (in My Path) and export. Private and never scored. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RoomPage(room: RoomStore, hindi: Boolean, onOpenJournal: () -> Unit, onExport: () -> Unit, onOpenNeedToTalk: () -> Unit) {
    Text("Only you see this. Nothing here goes to your pod, to marketing or to any AI, and nothing is scored.", style = MaterialTheme.typography.bodyMedium)

    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            val last = room.sleep[LocalDate.now().toString()]
            Text("Last night's sleep", style = MaterialTheme.typography.titleMedium)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { HOURS.forEach { (v, l) -> FilterChip(selected = last?.hours == v, onClick = { room.setSleep(hours = v) }, label = { Text(l) }) } }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { FELT.forEach { (v, l) -> FilterChip(selected = last?.felt == v, onClick = { room.setSleep(felt = v) }, label = { Text(l) }) } }
            Text("Sleep over weeks matters more for exams than the night before. One tap in the morning is enough.", style = MaterialTheme.typography.bodySmall)
            Text(room.sleepView(), style = MaterialTheme.typography.bodySmall)
        }
    }

    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            var text by remember { mutableStateOf("") }
            var pin by remember { mutableStateOf("") }
            val speak = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
                if (r.resultCode == Activity.RESULT_OK) r.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull()?.let { text = (text + " " + it).trim() }
            }
            Text("Notes", style = MaterialTheme.typography.titleMedium)
            Text("Pin a note to a syllabus topic and it comes back with that topic in your review.", style = MaterialTheme.typography.bodySmall)
            OutlinedTextField(value = text, onValueChange = { text = it }, placeholder = { Text("A note in your own words") }, modifier = Modifier.fillMaxWidth().heightIn(min = 110.dp),
                textStyle = if (hindi) ReadingHindi else ReadingText)
            if (DistressMatcher.matches(text)) TextButton(onClick = onOpenNeedToTalk) { Text("If things feel heavy, people who can help are one tap away") }
            OutlinedTextField(value = pin, onValueChange = { pin = it }, label = { Text("Pin to a syllabus topic (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            val matches = if (pin.length >= 3) SYLLABUS_NODES.filter { it.second.contains(pin, ignoreCase = true) && it.second != pin }.take(4) else emptyList()
            matches.forEach { (_, name) -> TextButton(onClick = { pin = name }) { Text(name) } }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = { if (text.isNotBlank()) { room.addNote(text.trim(), SYLLABUS_NODES.firstOrNull { it.second == pin.trim() }?.first); text = ""; pin = "" } }) { Text("Save the note") }
                OutlinedButton(onClick = {
                    runCatching {
                        speak.launch(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                            .putExtra(RecognizerIntent.EXTRA_LANGUAGE, if (hindi) "hi-IN" else "en-IN"))
                    }
                }) { Text("Speak a note") }
            }
            room.notes.reversed().take(30).forEach { n ->
                Row(verticalAlignment = Alignment.Top) {
                    Column(Modifier.weight(1f)) {
                        Text(n.text, style = MaterialTheme.typography.bodyMedium)
                        Text(n.at + (n.node?.let { id -> " · " + (SYLLABUS_NODES.firstOrNull { it.first == id }?.second ?: id) } ?: ""), style = MaterialTheme.typography.labelSmall)
                    }
                    TextButton(onClick = { room.deleteNote(n.id) }) { Text("Delete") }
                }
            }
        }
    }

    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            var todo by remember { mutableStateOf("") }
            Text("To-dos", style = MaterialTheme.typography.titleMedium)
            Text("Your own list, apart from the plan. No dates, so nothing is ever overdue.", style = MaterialTheme.typography.bodySmall)
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(value = todo, onValueChange = { todo = it.take(160) }, placeholder = { Text("Something for you to do") }, singleLine = true, modifier = Modifier.weight(1f))
                TextButton(onClick = { if (todo.isNotBlank()) { room.addTodo(todo.trim()); todo = "" } }) { Text("Add") }
            }
            val (done, open) = room.todos.partition { it.done }
            (open + done.takeLast(10)).forEach { t ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = t.done, onCheckedChange = { c -> room.updateTodo(t.id) { it.copy(done = c) } })
                    Column(Modifier.weight(1f)) {
                        Text(t.text, style = MaterialTheme.typography.bodyMedium)
                        t.node?.let { id -> Text(SYLLABUS_NODES.firstOrNull { it.first == id }?.second ?: id, style = MaterialTheme.typography.labelSmall) }
                        val match = if (t.node == null && !t.offered) room.topicFor(t.text) else null
                        if (match != null) Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Link to “${match.second}”?", style = MaterialTheme.typography.labelSmall, modifier = Modifier.weight(1f))
                            TextButton(onClick = { room.updateTodo(t.id) { it.copy(node = match.first, offered = true) } }) { Text("Yes") }
                            TextButton(onClick = { room.updateTodo(t.id) { it.copy(offered = true) } }) { Text("No") }
                        }
                    }
                    TextButton(onClick = { room.deleteTodo(t.id) }) { Text("×") }
                }
            }
        }
    }

    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Journal", style = MaterialTheme.typography.titleMedium)
            Text("Your journal lives in My Path, on this phone. Nobody reads it, and no AI. If you write something that sounds like you're in danger, the app shows you people who can help; that's all it does.", style = MaterialTheme.typography.bodySmall)
            OutlinedButton(onClick = onOpenJournal) { Text("Open My Path") }
        }
    }

    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Take it with you", style = MaterialTheme.typography.titleMedium)
            Text("Share your sleep log, notes, to-dos and journal as text, any time. Your work is yours.", style = MaterialTheme.typography.bodySmall)
            OutlinedButton(onClick = onExport) { Text("Export my room") }
        }
    }
}
