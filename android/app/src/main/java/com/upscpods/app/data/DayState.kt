package com.upscpods.app.data

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.time.DayOfWeek
import java.time.LocalDate

/** Today's tasks, framed as time and a subject rather than output (playbook A1). */
enum class TaskId(val title: String, val minutes: Int, val subject: String) {
    CHAI("Today's Chai", 7, "Current affairs"),
    PRELIMS("5 Prelims questions", 5, "Prelims practice"),
    MAINS("1 Mains answer", 20, "Mains"),
}

enum class Mood(val en: String, val hi: String) {
    HEAVY("Heavy", "भारी"),
    LOW("Low", "उदास"),
    OKAY("Okay", "ठीक"),
    GOOD("Good", "अच्छा"),
    LIGHT("Light", "हल्का"),
}

/** Who hears about a low mood. Default nobody; whoever is told never sees the mood itself. */
enum class LowMoodContact(val label: String) {
    NOBODY("Nobody"),
    BUDDY("My buddy"),
    POD_LEAD("Pod lead"),
}

/** Everything the repository persists, captured as one value so changes can be observed. */
data class DaySnapshot(
    val done: Set<TaskId>,
    val moved: Set<TaskId>,
    val chaiPing: Boolean,
    val closed: Boolean,
    val showedUpToday: Boolean,
    val savedCards: Set<String>,
    val weeklyTarget: Int,
    val lowMoodContact: LowMoodContact,
    val showPrelimsDate: Boolean,
    val pausedUntil: LocalDate?,
    val plan: DayState.Plan?,
    val started: Set<TaskId>,
    val firstStepDone: Boolean,
)

/** Today's UI state. AppRepository loads it at start and saves every change (see AppRoot). */
class DayState {
    var done by mutableStateOf(setOf<TaskId>())
    var movedToTomorrow by mutableStateOf(setOf<TaskId>())
    var savedCards by mutableStateOf(setOf<String>())
    var chaiPingSent by mutableStateOf(false)
    var dayClosed by mutableStateOf(false)
    var weeklyTarget by mutableStateOf(5)
    var showUpDays by mutableStateOf(setOf<DayOfWeek>())
    var lowMoodContact by mutableStateOf(LowMoodContact.NOBODY)
    var showPrelimsDate by mutableStateOf(false)
    var plan by mutableStateOf<Plan?>(null)
    /** Pause mode: up to 14 days, no reason asked. The weekly rhythm doesn't count paused days. */
    var pausedUntil by mutableStateOf<LocalDate?>(null)
    /** Tasks opened with "Just 5 minutes". Stopping at 5 counts as started, never as failed. */
    var started by mutableStateOf(setOf<TaskId>())
    /** Last night's "Tomorrow's first step", ticked off this morning. */
    var firstStepDone by mutableStateOf(false)

    val paused: Boolean get() = pausedUntil?.let { !LocalDate.now().isAfter(it) } ?: false

    fun snapshot() = DaySnapshot(
        done, movedToTomorrow, chaiPingSent, dayClosed,
        LocalDate.now().dayOfWeek in showUpDays,
        savedCards, weeklyTarget, lowMoodContact, showPrelimsDate, pausedUntil, plan,
        started, firstStepDone,
    )

    /** "After [after], I'll [text] for 5 minutes", written at Close the Day. */
    data class Plan(val text: String, val slot: String?, val madeOn: LocalDate, val after: String? = null) {
        val line: String get() = if (!after.isNullOrBlank()) "After $after, I'll $text for 5 minutes" else "$text · 5 minutes"
    }

    /** Last night's plan, which becomes task 1 today. */
    val firstStep: Plan? get() = plan?.takeIf { it.madeOn.isBefore(LocalDate.now()) }

    fun startFiveMinutes(task: TaskId) {
        started = started + task
        showUp()
    }

    val remaining: List<TaskId> get() = TaskId.entries.filter { it !in done && it !in movedToTomorrow }

    fun markDone(task: TaskId) {
        done = done + task
        showUp()
    }

    /** Any task, Chai Card, or Close the Day (even mood-only) counts as showing up. */
    fun showUp() {
        showUpDays = showUpDays + LocalDate.now().dayOfWeek
    }

    fun moveRemainingToTomorrow() {
        movedToTomorrow = movedToTomorrow + remaining
    }
}
