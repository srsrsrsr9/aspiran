package com.upscpods.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import com.upscpods.app.data.Brief
import com.upscpods.app.data.DayState
import com.upscpods.app.data.TaskId
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.Button
import com.upscpods.app.data.Community
import com.upscpods.app.data.Honest
import com.upscpods.app.data.Persona
import com.upscpods.app.data.PodClient
import com.upscpods.app.data.Season
import com.upscpods.app.data.StagedProfile
import java.text.NumberFormat
import java.time.LocalDate
import java.time.LocalTime
import java.util.Locale

enum class ShelfTool { COMPASS, COST, MAPS }

private fun lakh(n: Long) = NumberFormat.getIntegerInstance(Locale("en", "IN")).format(n)

/** Chotu's line for the Adda: the day's ritual, quieter at night. */
// Pod lines only for someone in a pod; otherwise the same day, said for one person.
fun hostLine(inPod: Boolean, now: LocalTime = LocalTime.now(), day: java.time.DayOfWeek = LocalDate.now().dayOfWeek): String {
    if (now.hour >= 23 || now.hour < 6) return "It's late. If you're still up, keep it gentle: Need to talk is one tap away, and tomorrow's fine."
    val line = when (day) {
        java.time.DayOfWeek.SUNDAY -> "Sunday's wins thread: one thing that went okay counts."
        java.time.DayOfWeek.MONDAY -> if (inPod) "New week. Your pod's goal is up." else "New week. Pods are matched on Mondays."
        java.time.DayOfWeek.TUESDAY -> "Answer hour is today. Bring one answer."
        java.time.DayOfWeek.WEDNESDAY -> "Midweek. One small thing is enough today."
        java.time.DayOfWeek.THURSDAY -> "Answer hour again today."
        java.time.DayOfWeek.FRIDAY -> if (inPod) "Pod Quiz Night tonight. Five questions, one shared score." else "Friday. Five practice questions are plenty."
        java.time.DayOfWeek.SATURDAY -> "Saturday. A good day to revise what came back."
    }
    return (if (now.hour < 12) "Morning. Chai's ready. " else if (now.hour < 18) "" else "Evening. ") + line
}

/**
 * The Adda: a short home. Chotu's line (and a once-a-day check-in), one Today card with one filled button, your
 * pod (with its three matching questions while they're unanswered), and from day two one rotating extra.
 * No prices or locks anywhere here.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AddaTab(
    persona: Persona?,
    pod: PodClient,
    community: Community,
    result: String?,
    brief: Brief,
    day: DayState,
    staged: StagedProfile,
    onOpenPod: () -> Unit,
    /** Opens the Chotu tab; [talk] switches it to Talk first (from the check-in). */
    onOpenChotu: (talk: Boolean) -> Unit,
    onOpenChai: () -> Unit,
    onOpenTask: (TaskId) -> Unit,
    onOpenPrep: () -> Unit,
    onOpenShelf: (ShelfTool) -> Unit,
    onOpenNeedToTalk: () -> Unit,
    onSwitchOffMine: (() -> Unit)?,
    /** A pod-matching answer was saved, so the server copy can be updated. */
    onPodAnswers: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (result != null) {
        Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("The Adda", style = MaterialTheme.typography.titleLarge)
            FlatCard {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Kulhad(KulhadTone.QUIET, 72.dp)
                    Text("Whatever happened, you're more than a roll number.", style = ReadingText)
                    Text(result, style = MaterialTheme.typography.bodySmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = onOpenNeedToTalk) { Text("Need to talk?") }
                        OutlinedButton(onClick = onOpenPod) { Text("Your pod") }
                    }
                    onSwitchOffMine?.let { TextButton(onClick = it) { Text("Switch off result-day mode") } }
                }
            }
        }
        return
    }
    var season by remember { mutableStateOf<Season?>(null) }
    LaunchedEffect(Unit) {
        community.podMe()?.let { pod.updateSummary(it) }
        season = community.season()
    }
    Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // A different one of the eleven greetings each day (needs native-speaker check, see Welcome.kt).
        Column {
            DailyHello()
            Text(persona?.name?.takeIf { it.isNotBlank() }?.let { "Namaste, $it" } ?: "Namaste", style = MaterialTheme.typography.titleLarge)
        }
        // Day 7: two quick questions (ui/Feedback.kt).
        CheckinCard()
        ChotuCheckIn(pod.podId != null, staged, onOpenChotu, onOpenPod, onOpenNeedToTalk)
        TodayCard(brief, day, onOpenChai, onOpenTask, onOpenPrep)
        PodCard(pod, onOpenPod)
        // The three matching questions are why pods exist, so they sit right here until answered.
        ProfileAskCard(staged, "pod", quiet = day.paused, onSynced = onPodAnswers)
        // Day one stays short. After that, one extra a day, never all at once.
        if (!staged.firstDay) SomethingForToday(persona, pod, season, onOpenShelf)
    }
}

/**
 * Chotu's line for the day and, once a day, "How's it going?". Friend voice, not a therapist: a rough day gets
 * company and a way to real people (Talk, your pod, Need to talk), never advice. The answer isn't kept anywhere.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ChotuCheckIn(
    inPod: Boolean,
    staged: StagedProfile,
    onOpenChotu: (talk: Boolean) -> Unit,
    onOpenPod: () -> Unit,
    onOpenNeedToTalk: () -> Unit,
) {
    val now = LocalTime.now()
    val late = now.hour >= 23 || now.hour < 6
    var answer by rememberSaveable { mutableStateOf<String?>(null) }
    when (answer) {
        "good" -> ChotuSays("Love that. Ride it: Today's Chai is ready when you are.", ChotuMood.PROUD) {
            TextButton(onClick = { onOpenChotu(false) }) { Text("Ask ${Brand.MASCOT_SHORT} something") }
        }
        "okay" -> ChotuSays("Fair enough. Okay-ish days count too. One small thing from Today, then a chai break?", ChotuMood.CALM) {
            TextButton(onClick = { onOpenChotu(true) }) { Text("Tell me about it") }
        }
        "rough" -> ChotuSays("Sorry, that sounds heavy. You don't have to push through it alone. Want some company?", ChotuMood.GENTLE) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { onOpenChotu(true) }) { Text("Talk it out with me") }
                OutlinedButton(onClick = onOpenPod) { Text(if (inPod) "Tell my pod" else "Find my pod") }
            }
            TextButton(onClick = onOpenNeedToTalk) { Text("Talk to a person now") }
        }
        else -> ChotuSays(hostLine(inPod) + if (!staged.checkedIn && !late) " How's it going today?" else "", toneNow().mood()) {
            when {
                late -> TextButton(onClick = onOpenNeedToTalk) { Text("Need to talk?") }
                !staged.checkedIn -> FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("good" to "Good", "okay" to "Okay-ish", "rough" to "Rough day").forEach { (k, label) ->
                        FilterChip(selected = false, onClick = { answer = k; staged.markCheckedIn() }, label = { Text(label) })
                    }
                }
                else -> TextButton(onClick = { onOpenChotu(false) }) { Text("Ask ${Brand.MASCOT_SHORT}") }
            }
        }
    }
}

private fun cards(n: Int) = if (n == 1) "1 card" else "$n cards"

/** The day in one card: one filled button for the next thing, and the three tasks as rows. */
@Composable
private fun TodayCard(brief: Brief, day: DayState, onOpenChai: () -> Unit, onOpenTask: (TaskId) -> Unit, onOpenPrep: () -> Unit) {
    val open = { t: TaskId -> if (t == TaskId.CHAI) onOpenChai() else onOpenTask(t) }
    val next = day.remaining.firstOrNull()
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Today", style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
                Text("${day.done.size} of 3 done", style = MaterialTheme.typography.bodyMedium)
            }
            if (next != null) Button(onClick = { open(next) }, modifier = Modifier.fillMaxWidth().height(MainActionHeight)) {
                Text(if (next == TaskId.CHAI) "Read Today's Chai (${cards(brief.items.size)})" else "Next: ${next.title} · ${next.minutes} min")
            } else Text("You're done for today. Really. The rest of the day is yours.", style = MaterialTheme.typography.bodyLarge)
            TaskId.entries.forEach { t ->
                val status = when (t) {
                    in day.done -> "✓"
                    in day.movedToTomorrow -> "→"
                    in day.started -> "◐"
                    else -> "○"
                }
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 48.dp).clickable(onClickLabel = "Open ${t.title}") { open(t) },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(status, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                    Text(if (t == TaskId.CHAI) "Today's Chai · ${cards(brief.items.size)}" else t.title, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                    Text("${t.minutes} min", style = MaterialTheme.typography.bodySmall)
                }
            }
            TextButton(onClick = onOpenPrep) { Text("Plan, practice and mocks are in Prep →") }
        }
    }
}

/** Your pod: honest state and the one shared goal. */
@Composable
private fun PodCard(pod: PodClient, onOpenPod: () -> Unit) {
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Your pod", style = MaterialTheme.typography.titleMedium)
            val s = pod.summary
            if (s == null) Text("Not in a pod yet. Open rooms are live in the Pod tab: Hindi medium, Repeaters, your optional, your region and more. Join as many as help.", style = MaterialTheme.typography.bodyMedium)
            else {
                Text(s.header, style = MaterialTheme.typography.bodyMedium)
                if (pod.online.size > 1) Text("${pod.online.size} here now", style = MaterialTheme.typography.bodySmall)
            }
            pod.goal?.let { g ->
                Text("This week: ${g.text} · ${g.done} of ${g.target}", style = MaterialTheme.typography.bodySmall)
                LinearProgressIndicator(progress = { if (g.target > 0) (g.done.toFloat() / g.target).coerceIn(0f, 1f) else 0f }, modifier = Modifier.fillMaxWidth())
            }
            OutlinedButton(onClick = onOpenPod) { Text("Open pod") }
        }
    }
}

/** From day two: one extra a day, in turn (the Akela Nahi video, the Free Shelf, the thinker, the season). */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SomethingForToday(persona: Persona?, pod: PodClient, season: Season?, onOpenShelf: (ShelfTool) -> Unit) {
    val turn = Math.floorMod(LocalDate.now().toEpochDay(), 4L).toInt().let { if (it == 3 && season == null) 2 else it }
    Text("Something for today", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
    when (turn) {
        // "Akela Nahi" in the member's language. Never autoplays; nothing loads until Play (see RapVideo.kt).
        0 -> RapVideoCard(server = pod.serverUrl, reading = persona?.language)
        1 -> FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Free Shelf", style = MaterialTheme.typography.titleMedium)
                Text("Honest tools. Free, no card needed.", style = MaterialTheme.typography.bodySmall)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = { onOpenShelf(ShelfTool.COMPASS) }) { Text("Attempt Compass") }
                    TextButton(onClick = { onOpenShelf(ShelfTool.COST) }) { Text("Cost of a Year") }
                    TextButton(onClick = { onOpenShelf(ShelfTool.MAPS) }) { Text("5-source maps") }
                }
            }
        }
        2 -> {
            val t = remember { Honest.thinkerOfWeek() }
            FlatCard {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Thinker of the week", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                    Text(t.name, style = MaterialTheme.typography.titleMedium)
                    Text(t.idea, style = ReadingText, fontStyle = FontStyle.Italic)
                    Text("From: ${t.from}. In our words, not a quote.", style = MaterialTheme.typography.bodySmall)
                    Text("Use it in: ${t.use}", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        else -> season?.let { s ->
            FlatCard {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(s.title, style = MaterialTheme.typography.titleMedium)
                    Text("${lakh(s.done)} of ${lakh(s.goal)} ${s.unit}, answered together. No ranks, just one counter.", style = MaterialTheme.typography.bodySmall)
                    LinearProgressIndicator(progress = { (s.done.toFloat() / maxOf(1L, s.goal)).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth())
                }
            }
        }
    }
}

// --- Free Shelf tools ---------------------------------------------------------------------------------

@Composable
fun ShelfToolScreen(tool: ShelfTool, staged: StagedProfile, onClose: () -> Unit) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        TextButton(onClick = onClose) { Text("← Back") }
        when (tool) {
            ShelfTool.COMPASS -> Compass(staged)
            ShelfTool.COST -> CostOfYear()
            ShelfTool.MAPS -> Maps()
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Compass(staged: StagedProfile) {
    Text("Attempt Compass", style = MaterialTheme.typography.titleLarge)
    Text("Which exam years are still open to you, by UPSC's own rules. It doesn't tell you to stop or continue.", style = MaterialTheme.typography.bodyMedium)
    var dob by rememberSaveable { mutableStateOf("") }
    var cat by rememberSaveable { mutableStateOf("general") }
    var used by rememberSaveable { mutableStateOf("0") }
    var pwbd by rememberSaveable { mutableStateOf(false) }
    OutlinedTextField(value = dob, onValueChange = { dob = it.take(10) }, label = { Text("Date of birth (YYYY-MM-DD)") }, singleLine = true)
    Text("Stays on this phone; it isn't saved.", style = MaterialTheme.typography.labelSmall)
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Honest.CATEGORIES.forEach { c -> FilterChip(selected = cat == c.key, onClick = { cat = c.key }, label = { Text(c.label) }) }
    }
    OutlinedTextField(value = used, onValueChange = { used = it.filter(Char::isDigit).take(2) }, label = { Text("Attempts already used") }, singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
    Row(verticalAlignment = Alignment.CenterVertically) {
        Checkbox(checked = pwbd, onCheckedChange = { pwbd = it })
        Text("Person with benchmark disability (PwBD)")
    }
    val birth = runCatching { LocalDate.parse(dob) }.getOrNull()
    if (birth != null) {
        val r = Honest.compass(birth, cat, used.toIntOrNull() ?: 0, pwbd)
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    when {
                        r.years.isEmpty() -> "By these rules, no exam years are open from ${Honest.nextExamYear()}."
                        else -> "Open years: " + r.years.joinToString(", ") { "${it.year} (age ${it.age}${if (it.check) ", check the UPSC notification" else ""})" }
                    },
                    style = MaterialTheme.typography.bodyLarge,
                )
                Text("Upper age limit for you: under ${r.upper} on 1 August. " + (r.attemptsLeft?.let { "Attempts left: $it." } ?: "No limit on attempts in your category."), style = MaterialTheme.typography.bodySmall)
                r.upperCheck?.let {
                    val label = Honest.CATEGORIES.firstOrNull { c -> c.key == cat }?.label ?: ""
                    Text("Check the UPSC notification: sources differ on the upper age for $label candidates with a disability ($it or ${r.upper}). " +
                        "Years after you turn ${r.upper} are marked until it's confirmed.", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                }
                if (r.years.isNotEmpty()) Text(if (r.ageLimitFirst) "The age limit comes before the attempt limit for you." else "The attempt limit comes first for you.", style = MaterialTheme.typography.bodySmall)
                Text("Source: ${Honest.RULES_SOURCE}. Rules can change; the year's notification on upsc.gov.in is what counts.", style = MaterialTheme.typography.labelSmall)
            }
        }
        Text("Questions worth sitting with", style = MaterialTheme.typography.titleSmall)
        Honest.COMPASS_QUESTIONS.forEach { Text("• $it", style = MaterialTheme.typography.bodyMedium) }
        ProfileAskCard(staged, "compass")
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CostOfYear() {
    Text("Cost of a Year", style = MaterialTheme.typography.titleLarge)
    Text("Rough starting numbers, not facts. Change every one to what you actually pay. Nothing here is saved or sent.", style = MaterialTheme.typography.bodyMedium)
    var values by remember { mutableStateOf(Honest.CITY_PRESETS[0].second) }
    var salary by rememberSaveable { mutableStateOf("0") }
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Honest.CITY_PRESETS.forEach { (label, preset) -> FilterChip(selected = values == preset, onClick = { values = preset }, label = { Text(label) }) }
    }
    Honest.COST_ITEMS.forEach { item ->
        OutlinedTextField(
            value = (values[item.key] ?: 0).toString(),
            onValueChange = { v -> values = values + (item.key to (v.filter(Char::isDigit).take(7).toIntOrNull() ?: 0)) },
            label = { Text(item.label + if (item.monthly) " (a month)" else " (a year)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )
    }
    OutlinedTextField(value = salary, onValueChange = { salary = it.filter(Char::isDigit).take(7) }, label = { Text("Salary you'd otherwise earn (a month, optional)") },
        singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.fillMaxWidth())
    val c = Honest.costOfYear(values, salary.toIntOrNull() ?: 0)
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("About ${Honest.inr(c.year)} a year (${Honest.inr(c.month)} a month)", style = MaterialTheme.typography.titleMedium)
            if (c.forgone > 0) Text("With the salary you're not earning: ${Honest.inr(c.withForgone)}", style = MaterialTheme.typography.bodyMedium)
            Text("A number to plan with, not a reason to feel guilty.", style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun Maps() {
    Text("5-source maps", style = MaterialTheme.typography.titleLarge)
    Text("A map, not a shopping list: five sources per subject, in the order to use them. The syllabus and past papers are free and come first.", style = MaterialTheme.typography.bodyMedium)
    var open by rememberSaveable { mutableStateOf<String?>(null) }
    Honest.MAPS.forEach { (subject, sources) ->
        FlatCard {
            Column(Modifier.padding(12.dp)) {
                TextButton(onClick = { open = if (open == subject) null else subject }) { Text(subject) }
                if (open == subject) sources.forEachIndexed { i, (name, why) ->
                    Text("${i + 1}. $name", style = MaterialTheme.typography.bodyMedium)
                    Text(why, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(start = 16.dp, bottom = 6.dp))
                }
            }
        }
    }
}

// --- Staged profile asks --------------------------------------------------------------------------------

/**
 * One question a day, at a moment it helps. "Not now" twice and it stops asking.
 * [onSynced] runs when a pod-matching field was saved, so the server copy can be updated.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProfileAskCard(staged: StagedProfile, context: String, quiet: Boolean = false, onSynced: () -> Unit = {}) {
    val questions = remember(context) { staged.ask(context, quiet) }
    if (questions.isEmpty()) return
    var answers by remember(context) { mutableStateOf(mapOf<String, String>()) }
    var done by rememberSaveable(context) { mutableStateOf<String?>(null) }
    FlatCard(Modifier.padding(horizontal = if (context == "pod") 16.dp else 0.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            done?.let { Text(it, style = MaterialTheme.typography.bodySmall); return@Column }
            if (context == "pod") Text("To match you with people at your stage. These three go to the pod server; nothing else does.", style = MaterialTheme.typography.bodySmall)
            questions.forEach { q ->
                Text(q.q, style = MaterialTheme.typography.titleSmall)
                q.note?.let { Text(it, style = MaterialTheme.typography.labelSmall) }
                if (q.opts.isNotEmpty()) FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    q.opts.forEach { (v, label) -> FilterChip(selected = answers[q.key] == v, onClick = { answers = answers + (q.key to v) }, label = { Text(label) }) }
                } else OutlinedTextField(value = answers[q.key] ?: "", onValueChange = { answers = answers + (q.key to it.take(80)) }, placeholder = { Text(q.text ?: "") }, singleLine = true)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = {
                    questions.forEach { q -> answers[q.key]?.takeIf { it.isNotBlank() }?.let { staged.set(q.key, it.trim(), "asked") } ?: staged.skip(q.key) }
                    if (questions.any { it.key in StagedProfile.SYNCED && answers[it.key] != null }) onSynced()
                    done = "Saved. You can see and delete it in Me → Profile."
                }, enabled = answers.isNotEmpty()) { Text("Save") }
                TextButton(onClick = { questions.forEach { staged.skip(it.key) }; done = "No problem. We won't ask again for a while." }) { Text("Not now") }
            }
        }
    }
}

/** The private stay-or-move choice for a pod that's been quiet for two weeks. Nobody is moved without choosing. */
@Composable
fun StayOrMoveCard(pod: PodClient, staged: StagedProfile, onChoose: (stay: Boolean) -> Unit) {
    val note = pod.privateNotes.lastOrNull { it.memberId == "choice" } ?: return
    var done by remember(note.id) { mutableStateOf(staged.choiceDone(note.id)) }
    if (done) return
    FlatCard(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(note.text, style = MaterialTheme.typography.bodyMedium)
            Text("Only you see this. Nobody is moved without choosing.", style = MaterialTheme.typography.labelSmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { staged.markChoice(note.id); done = true; onChoose(true) }) { Text("Stay") }
                OutlinedButton(onClick = { staged.markChoice(note.id); done = true; onChoose(false) }) { Text("Move to a more active pod") }
            }
        }
    }
}
