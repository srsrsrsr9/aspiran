package com.upscpods.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.upscpods.app.Helplines
import com.upscpods.app.data.DayState
import com.upscpods.app.data.DistressMatcher
import com.upscpods.app.data.JournalData
import com.upscpods.app.data.LowMoodContact
import com.upscpods.app.data.Mood
import com.upscpods.app.data.TaskId
import com.upscpods.app.data.Quote
import java.time.LocalDate
import java.time.LocalTime

private val blockers = listOf("Tired", "Family", "Work", "Phone", "Felt low", "Nothing - good day")
/** Things done that aren't one of Today's 3. The default chips are always things done (playbook A2). */
private val alsoDid = listOf("Read a chapter", "Revised notes", "Made notes", "Watched a lecture", "Wrote an answer", "Showed up")
/** Cues for the if-then plan: an existing habit to hang tomorrow's first step on. */
private val cues = listOf("morning chai", "breakfast", "lunch", "work", "dinner")

/**
 * Close the Day: three lines and an ending, under 90 seconds. Private by default.
 * What I did today, one thing I can say from memory, and tomorrow's first step as an if-then.
 * It always ends on a calm finished screen (or Lamp Off), never on a to-do list.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun CloseTheDayScreen(
    day: DayState,
    onDial: (String) -> Unit,
    onOpenNeedToTalk: () -> Unit,
    onSave: (JournalData) -> Unit,
    onClose: () -> Unit,
    onLampOff: (() -> Unit)? = null,
    onWhy: (() -> Unit)? = null,
    /** The night or if-then quote, when one is approved and today is a quote day. */
    quote: ((night: Boolean) -> Quote?)? = null,
    onReadMore: ((String) -> Unit)? = null,
) {
    var got by rememberSaveable { mutableStateOf(day.done.map { it.title }.toSet()) }
    var inTheWay by rememberSaveable { mutableStateOf(setOf<String>()) }
    var memory by rememberSaveable { mutableStateOf("") }
    var after by rememberSaveable { mutableStateOf("") }
    var tomorrow by rememberSaveable { mutableStateOf("") }
    var mood by rememberSaveable { mutableStateOf<Mood?>(null) }
    // A slipped day: nothing ticked and nothing picked. The reply is kind, never a verdict.
    val slipped = day.done.isEmpty() && got.isEmpty()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Close the Day") },
                navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } },
            )
        },
    ) { padding ->
        if (day.dayClosed) {
            // Nothing below this line, by design.
            Column(Modifier.fillMaxSize().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    if (slipped) "Slipped today. Most people do some days." else "Day closed. You showed up. That counts.",
                    style = MaterialTheme.typography.headlineSmall,
                )
                Text(
                    if (day.plan?.madeOn == LocalDate.now()) "Tomorrow's first step is ready." else "Tomorrow starts fresh.",
                    style = MaterialTheme.typography.bodyLarge,
                )
                if (onLampOff == null) Text("Good night.", style = MaterialTheme.typography.bodyLarge)
                // One quote at most, and never after a heavy mood or words that matched the distress list.
                val calm = mood != Mood.HEAVY && !DistressMatcher.matches(tomorrow) && !DistressMatcher.matches(memory)
                if (calm) quote?.invoke(LocalTime.now().hour >= 21)?.let { QuoteLine(it, hindi = false, onReadMore) }
                // Two quiet minutes, only when an editor approved a Lamp Off.
                if (onLampOff != null) OutlinedButton(onClick = onLampOff, modifier = Modifier.padding(top = 16.dp)) { Text("Lamp off · दीया बुझाओ") }
            }
        } else Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Only you can see this.", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                onWhy?.let { WhyLink(it) }
            }

            Section("What I did today") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    (TaskId.entries.map { it.title } + alsoDid).forEach { t ->
                        FilterChip(selected = t in got, onClick = { got = got.toggle(t) }, label = { Text(t) })
                    }
                }
            }

            Section("One thing I can say from memory") {
                Text("Without looking. Saying it back is what makes it stick.", style = MaterialTheme.typography.bodySmall)
                OutlinedTextField(
                    value = memory,
                    onValueChange = { memory = it.take(200) },
                    placeholder = { Text("e.g. Article 21 protects life and personal liberty") },
                    modifier = Modifier.fillMaxWidth(),
                )
                if (DistressMatcher.matches(memory)) SupportLine(onDial, onOpenNeedToTalk)
            }

            Section("Tomorrow's first step") {
                Text("Small enough to start half-asleep.", style = MaterialTheme.typography.bodySmall)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("After", style = MaterialTheme.typography.bodyLarge)
                    OutlinedTextField(
                        value = after,
                        onValueChange = { after = it.take(40) },
                        placeholder = { Text("morning chai") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                    )
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    cues.forEach { c -> FilterChip(selected = after == c, onClick = { after = if (after == c) "" else c }, label = { Text(c) }) }
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("I'll", style = MaterialTheme.typography.bodyLarge)
                    OutlinedTextField(
                        value = tomorrow,
                        onValueChange = { tomorrow = it.take(80) },
                        placeholder = { Text("read Laxmikanth ch. 4") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                    )
                }
                Text("for 5 minutes.", style = MaterialTheme.typography.bodyLarge)
                if (DistressMatcher.matches(tomorrow)) SupportLine(onDial, onOpenNeedToTalk)
            }

            Section("Anything get in the way?") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    blockers.forEach { b ->
                        FilterChip(selected = b in inTheWay, onClick = { inTheWay = inTheWay.toggle(b) }, label = { Text(b) })
                    }
                }
            }

            Section("Mood") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Mood.entries.forEach { m ->
                        FilterChip(
                            selected = mood == m,
                            onClick = { mood = if (mood == m) null else m },
                            label = { Text("${m.en} · ${m.hi}") },
                        )
                    }
                }
                if (mood == Mood.HEAVY) SupportLine(onDial, onOpenNeedToTalk)
            }

            Section("If my mood is low, tell") {
                Text("They'll only know to check in. They never see your mood.", style = MaterialTheme.typography.bodySmall)
                // Equal visual weight for every choice; nobody is the default.
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LowMoodContact.entries.forEach { c ->
                        FilterChip(
                            selected = day.lowMoodContact == c,
                            onClick = { day.lowMoodContact = c },
                            label = { Text(c.label) },
                        )
                    }
                }
            }

            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    if (tomorrow.isNotBlank()) day.plan = DayState.Plan(tomorrow.trim(), null, LocalDate.now(), after.trim().ifBlank { null })
                    onSave(
                        JournalData(
                            date = LocalDate.now().toString(),
                            done = got.toList(),
                            inTheWay = inTheWay.toList(),
                            tomorrow = tomorrow.trim(),
                            mood = mood?.name,
                            memory = memory.trim(),
                            after = after.trim().ifBlank { null },
                        ),
                    )
                    day.dayClosed = true
                    day.showUp()
                },
                modifier = Modifier.fillMaxWidth().height(MainActionHeight),
            ) { Text("Close the day") }
        }
    }
}

/** Inline, never a modal. */
@Composable
private fun SupportLine(onDial: (String) -> Unit, onOpenNeedToTalk: () -> Unit) {
    Column(Modifier.padding(top = 8.dp)) {
        Text("Rough day. Want to talk to someone?", style = MaterialTheme.typography.bodyLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onOpenNeedToTalk) { Text("Pod or buddy") }
            OutlinedButton(onClick = { onDial(Helplines.main.dial) }) { Text("Call ${Helplines.main.label}") }
        }
    }
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        content()
    }
}

private fun Set<String>.toggle(v: String) = if (v in this) this - v else this + v
