package com.upscpods.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import kotlinx.coroutines.delay
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Brief
import com.upscpods.app.data.DayState
import com.upscpods.app.data.Persona
import com.upscpods.app.data.PodClient
import com.upscpods.app.data.PodStatus
import com.upscpods.app.data.TaskId
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime

/**
 * Today, top to bottom: greeting, the one next step (teaching plan, build step 3), today's full list one tap away,
 * the syllabus map, pod strip, Close the Day (collapsed). After 20:00 Close the Day moves to the top.
 * One filled button per screen. No countdown, streak or upsell.
 */
@Composable
fun TodayScreen(
    brief: Brief,
    day: DayState,
    persona: Persona?,
    onOpenChai: () -> Unit,
    onOpenCloseDay: () -> Unit,
    onOpenTask: (TaskId) -> Unit,
    onOpenPod: () -> Unit,
    modifier: Modifier = Modifier,
    pod: PodClient? = null,
    now: LocalTime = LocalTime.now(),
    mainsTopic: String = TaskId.MAINS.subject,
    onFiveMinutes: (TaskId?) -> Unit = {},
    onWhy: (() -> Unit)? = null,
    /** Monday's WOOP or this week's line, and the planning mirror. */
    weekly: @Composable () -> Unit = {},
    /** The review queue: how many are due, whether today's is done, and opening it. */
    reviewDue: Int = 0,
    reviewed: Boolean = false,
    onOpenReview: () -> Unit = {},
    /** The syllabus map's counts ("3 met · 1 can recall"), and opening it. */
    mapLine: String? = null,
    onOpenMap: () -> Unit = {},
    /** The whole syllabus as a creeper garden (VineGarden.kt), shown in place of the map line when given. */
    vines: List<Vine>? = null,
) {
    val evening = now.hour >= 20
    var full by rememberSaveable { mutableStateOf(false) }
    Column(
        modifier = modifier.verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Greeting(now, day, persona)
        WelcomeBackCard(PauseSource.library, PauseSource.hindi)
        weekly()
        if (evening) CloseTheDayBlock(day, primary = true, onOpenCloseDay, now)
        val open = { t: TaskId -> if (t == TaskId.CHAI) onOpenChai() else onOpenTask(t) }
        NextStep(day, persona, brief, mainsTopic, reviewDue.takeIf { !reviewed } ?: 0, filled = !evening, onOpenReview,
            onFive = { t -> day.startFiveMinutes(t); onFiveMinutes(t); open(t) }, onFirstStep = { onFiveMinutes(null) }, onOpen = open)
        TextButton(onClick = { full = !full }) { Text(if (full) "Hide today's full list" else "Today's full list") }
        if (full) {
            if (reviewDue > 0 || reviewed) FlatCard(Modifier.clickable(onClick = onOpenReview)) {
                Column(Modifier.padding(16.dp)) {
                    Text("Review", style = MaterialTheme.typography.titleMedium)
                    Text(if (reviewDue == 0) "✓ Done" else "$reviewDue due · about ${maxOf(2, (reviewDue + 1) / 2)} min", style = MaterialTheme.typography.bodySmall)
                }
            }
            TodaysThree(brief, day, persona, now, primary = false, mainsTopic, onFiveMinutes, onWhy, open)
        }
        if (vines != null) FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text("Your syllabus", style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
                    TextButton(onClick = onOpenMap) { Text("All of it →") }
                }
                GardenSection(vines, onVine = { onOpenMap() }, height = 300f, note = false, small = true)
            }
        } else mapLine?.let { line ->
            FlatCard(Modifier.clickable(onClick = onOpenMap)) {
                Column(Modifier.padding(16.dp)) {
                    Text("Your syllabus map →", style = MaterialTheme.typography.titleMedium)
                    Text(line, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        PodStrip(day, pod, onOpenPod)
        if (!evening) CloseTheDayBlock(day, primary = false, onOpenCloseDay, now)
        if (brief.sample) {
            Text("Sample content: facts not yet checked", style = MaterialTheme.typography.labelSmall)
        }
    }
}

/** The one thing to do next: last night's first step, then the review, then the next of today's 3. */
@Composable
private fun NextStep(
    day: DayState, persona: Persona?, brief: Brief, mainsTopic: String, reviewDue: Int, filled: Boolean, onOpenReview: () -> Unit,
    onFive: (TaskId) -> Unit, onFirstStep: () -> Unit, onOpen: (TaskId) -> Unit,
) {
    val firstStep = day.firstStep?.takeIf { !day.firstStepDone }
    val task = day.remaining.firstOrNull()
    val left = listOfNotNull(firstStep, reviewDue.takeIf { it > 0 }).size + day.remaining.size
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            if (left == 0) {
                Text("You're done for today. Really.", style = MaterialTheme.typography.titleLarge)
                Text("The rest of the day is yours. Close the Day tonight if you like.", style = MaterialTheme.typography.bodyMedium)
                return@Column
            }
            Text("Next", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
            val action: @Composable (String, () -> Unit) -> Unit = { label, go ->
                if (filled) Button(onClick = go, modifier = Modifier.height(MainActionHeight)) { Text(label) } else OutlinedButton(onClick = go) { Text(label) }
            }
            when {
                firstStep != null -> {
                    Text(firstStep.line, style = MaterialTheme.typography.titleLarge)
                    Text("Your first step, from last night · 5 min", style = MaterialTheme.typography.bodySmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        action("Just 5 minutes", onFirstStep)
                        TextButton(onClick = { day.firstStepDone = true; day.showUp() }) { Text("Did it") }
                    }
                }
                reviewDue > 0 -> {
                    Text("Review: $reviewDue due", style = MaterialTheme.typography.titleLarge)
                    Text("Recall first · about ${maxOf(2, (reviewDue + 1) / 2)} min", style = MaterialTheme.typography.bodySmall)
                    action("Start the review", onOpenReview)
                }
                task != null -> {
                    val partTime = task == TaskId.MAINS && persona?.partTime == true
                    val minutes = if (partTime) 5 else task.minutes
                    Text(if (task == TaskId.CHAI) "Today's Chai, ${brief.items.size} card${if (brief.items.size == 1) "" else "s"}" else if (partTime) "Mains outline" else task.title,
                        style = MaterialTheme.typography.titleLarge)
                    Text("$minutes min · ${if (task == TaskId.MAINS) mainsTopic else task.subject}${if (task in day.started) " · Started" else ""}", style = MaterialTheme.typography.bodySmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        action("Just 5 minutes") { onFive(task) }
                        if (minutes > 5) TextButton(onClick = { onOpen(task) }) { Text("All $minutes min") }
                    }
                }
            }
            if (left > 1) Text("Then ${left - 1} more.", style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun Greeting(now: LocalTime, day: DayState, persona: Persona?) {
    val hello = when (now.hour) {
        in 4..11 -> "Good morning"
        in 12..16 -> "Good afternoon"
        else -> "Good evening"
    }
    Column {
        // The name is already on the Adda; here the day itself is the point.
        Text(hello, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun TodaysThree(
    brief: Brief, day: DayState, persona: Persona?, now: LocalTime, primary: Boolean,
    mainsTopic: String, onFiveMinutes: (TaskId?) -> Unit, onWhy: (() -> Unit)?, onOpen: (TaskId) -> Unit,
) {
    val doneCount = day.done.size
    val firstStep = day.firstStep?.takeIf { !day.firstStepDone }
    val next = if (firstStep != null) null else day.remaining.firstOrNull()
    FlatCard {
        Column(Modifier.padding(16.dp)) {
            Text("Today's 3", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(8.dp))
            Text("$doneCount of 3 done", style = MaterialTheme.typography.bodyMedium)
            SegmentedProgress(doneCount)
            Spacer(Modifier.height(8.dp))

            // Last night's if-then plan is task 1 this morning.
            day.firstStep?.let { plan ->
                FirstStepRow(plan, done = day.firstStepDone, filled = primary && firstStep != null,
                    onStart = { onFiveMinutes(null) }, onDone = { day.firstStepDone = true; day.showUp() })
            }

            TaskId.entries.forEach { task ->
                val partTimeOutline = task == TaskId.MAINS && persona?.partTime == true
                // Minutes and a subject, never output: "20 min · Polity", not "1 answer".
                val minutes = if (partTimeOutline) 5 else task.minutes
                val subject = when (task) {
                    TaskId.MAINS -> mainsTopic
                    else -> task.subject
                }
                val what = when {
                    task == TaskId.CHAI -> "Today's Chai, ${brief.items.size} card${if (brief.items.size == 1) "" else "s"}"
                    partTimeOutline -> "Mains outline · part-time mode"
                    else -> task.title
                }
                TaskRow(
                    title = "$minutes min · $subject",
                    detail = what,
                    status = when (task) {
                        in day.done -> "✓ Done"
                        in day.movedToTomorrow -> "→ Tomorrow"
                        in day.started -> "◐ Started"
                        else -> "○ To do"
                    },
                    minutes = minutes,
                    isNext = task == next,
                    filled = primary && task == next,
                    onFive = { day.startFiveMinutes(task); onFiveMinutes(task); onOpen(task) },
                    onStart = { onOpen(task) },
                )
            }

            Spacer(Modifier.height(8.dp))
            when {
                doneCount == 3 -> Text(
                    "You're done for today. Really. The rest of the evening is yours.",
                    style = MaterialTheme.typography.bodyLarge,
                )
                now.hour >= 21 && day.remaining.isNotEmpty() -> {
                    Text(
                        if (doneCount > 0) "$doneCount of 3 is a real day." else "Tomorrow is a fresh start.",
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    TextButton(onClick = { day.moveRemainingToTomorrow() }) { Text("Move to tomorrow?") }
                }
                // A quiet acknowledgement, credited to the member. No confetti, no points.
                doneCount > 0 -> Text("$doneCount done. You did that.", style = MaterialTheme.typography.bodyMedium)
                day.started.isNotEmpty() -> Text("Started counts. Five minutes is a real start.", style = MaterialTheme.typography.bodyMedium)
            }
            onWhy?.let { WhyLink(it) }
        }
    }
}

@Composable
private fun FirstStepRow(plan: DayState.Plan, done: Boolean, filled: Boolean, onStart: () -> Unit, onDone: () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Text("5 min · Your first step", style = MaterialTheme.typography.titleMedium)
        Text(plan.line + if (done) " · ✓ Done" else "", style = MaterialTheme.typography.bodySmall)
        if (!done) Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            if (filled) {
                Button(onClick = onStart, modifier = Modifier.height(MainActionHeight)) { Text("Just 5 minutes") }
            } else {
                OutlinedButton(onClick = onStart) { Text("Just 5 minutes") }
            }
            TextButton(onClick = onDone) { Text("Did it") }
        }
    }
}

@Composable
private fun TaskRow(
    title: String, detail: String, status: String, minutes: Int, isNext: Boolean, filled: Boolean,
    onFive: () -> Unit, onStart: () -> Unit,
) {
    Column(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text("$detail · $status", style = MaterialTheme.typography.bodySmall)
        if (isNext) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                // "Just 5 minutes" is the easy way in; stopping at 5 still counts as started.
                if (filled) {
                    Button(onClick = onFive, modifier = Modifier.height(MainActionHeight)) { Text("Just 5 minutes") }
                } else {
                    OutlinedButton(onClick = onFive) { Text("Just 5 minutes") }
                }
                if (minutes > 5) TextButton(onClick = onStart) { Text("All $minutes min") }
            }
        }
    }
}

/**
 * The "Just 5 minutes" timer, floating over the task. At five minutes it says so once and
 * offers a clean stop; carrying on is just as fine. No alarm, no countdown pressure.
 */
@Composable
fun FiveMinutePill(startedAt: Long, onStop: () -> Unit, onKeepGoing: () -> Unit, modifier: Modifier = Modifier) {
    var nowMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(startedAt) {
        while (true) {
            nowMs = System.currentTimeMillis()
            delay(1000)
        }
    }
    val left = (5 * 60 - (nowMs - startedAt) / 1000).coerceAtLeast(0)
    Surface(
        modifier = modifier.padding(8.dp),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.secondaryContainer,
        tonalElevation = 2.dp,
    ) {
        if (left > 0) {
            Text(
                "Just 5 minutes · %d:%02d".format(left / 60, left % 60),
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            )
        } else {
            Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                Text("Five minutes done. You started, and that counts.", style = MaterialTheme.typography.bodyMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onStop) { Text("Stop here") }
                    TextButton(onClick = onKeepGoing) { Text("Keep going") }
                }
            }
        }
    }
}

/** Segmented accent bar. Never red, never a percentage. */
@Composable
private fun SegmentedProgress(done: Int) {
    Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        repeat(3) { i ->
            Box(
                Modifier.weight(1f).height(6.dp).background(
                    if (i < done) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                    RoundedCornerShape(3.dp),
                ),
            )
        }
    }
}

/** Presence, not performance. Never shows who finished. Sample data until a pod server is set. */
@Composable
private fun PodStrip(day: DayState, pod: PodClient?, onOpenPod: () -> Unit) {
    val live = pod != null && pod.status != PodStatus.NO_SERVER
    val names = if (live) pod!!.online.ifEmpty { pod.messages.map { it.name }.distinct().take(4) } else listOf("A", "R", "S", "M")
    val last = pod?.messages?.lastOrNull { it.kind == "chat" || it.kind == "ritual" }
    FlatCard(Modifier.clickable(enabled = live, onClick = onOpenPod)) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                names.take(5).forEach { Avatar(it.take(1).uppercase()) }
                Spacer(Modifier.size(8.dp))
                Text(
                    when {
                        !live -> "Aman shared an answer · 9:12 (sample)"
                        last != null -> "${last.name}: ${last.text}".take(60)
                        else -> "Your pod is quiet. Say hello."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 1,
                )
            }
            // Only claim it was sent when the pod is actually connected.
            val online = pod?.status == PodStatus.ONLINE
            TextButton(
                onClick = { day.chaiPingSent = true; pod?.chaiPing() },
                enabled = online && !day.chaiPingSent,
            ) {
                Text(when {
                    !online -> "Chai ping works when your pod is connected"
                    day.chaiPingSent -> "Chai ping sent to your pod ☕"
                    else -> "Send a chai ping"
                })
            }
        }
    }
}

@Composable
private fun Avatar(initial: String) {
    Box(
        Modifier.padding(end = 4.dp).size(32.dp).background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(initial, color = MaterialTheme.colorScheme.onPrimaryContainer, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
private fun CloseTheDayBlock(day: DayState, primary: Boolean, onOpen: () -> Unit, now: LocalTime) {
    FlatCard {
        Column(Modifier.padding(16.dp)) {
            Text("Close the Day", style = MaterialTheme.typography.titleLarge)
            if (day.dayClosed) {
                Text("Day closed. You showed up. That counts.", style = MaterialTheme.typography.bodyLarge)
            } else {
                Text("About 90 seconds · Only you can see this", style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(8.dp))
                WeeklyRhythm(day)
                Spacer(Modifier.height(8.dp))
                if (primary) {
                    Button(onClick = onOpen, modifier = Modifier.height(MainActionHeight)) { Text("Close the day") }
                } else {
                    OutlinedButton(onClick = onOpen) { Text("Close the day") }
                }
            }
            if (now.hour >= 23) {
                Text("Sleep is part of the prep too.", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 8.dp))
            }
        }
    }
}

/** Private weekly rhythm: 7 neutral dots against the user's target. Resets Monday. */
@Composable
fun WeeklyRhythm(day: DayState) {
    Column {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DayOfWeek.entries.forEach { d ->
                val on = d in day.showUpDays
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        Modifier.size(14.dp).background(
                            if (on) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.surfaceVariant,
                            CircleShape,
                        ),
                    )
                    Text(d.name.take(1), style = MaterialTheme.typography.labelSmall)
                }
            }
        }
        Text(
            "${day.showUpDays.size} of ${day.weeklyTarget} days this week · 2 rest days built in",
            style = MaterialTheme.typography.labelSmall,
        )
    }
}
