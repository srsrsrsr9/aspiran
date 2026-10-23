package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.TemporalAdjusters

/**
 * One timed answer in Answer Studio: when it started, and whether it was finished or left. [over] is true when
 * the timer ran out before it was finished (it still counts as finished). Kept on the phone only.
 */
@Serializable
data class AnswerAttempt(
    val id: String,
    val question: String,
    val words: Int,
    val startedAt: Long,
    val endedAt: Long? = null,
    /** "started", "finished" or "abandoned". */
    val outcome: String = "started",
    val over: Boolean = false,
    val reviewed: Boolean = false,
)

/** Answer Studio's attempt log (sell-first plan, W5): started, finished, abandoned, over time. Never leaves the phone. */
class AnswerLog(context: Context) {
    private val prefs = context.getSharedPreferences("answer_log", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val ser = ListSerializer(AnswerAttempt.serializer())

    fun all(): List<AnswerAttempt> = runCatching { json.decodeFromString(ser, prefs.getString("log", "[]")!!) }.getOrDefault(emptyList())

    private fun save(list: List<AnswerAttempt>) = prefs.edit().putString("log", json.encodeToString(ser, list.takeLast(300))).apply()

    fun start(question: String, words: Int): AnswerAttempt {
        // One still marked "started" from a closed app was left.
        val now = System.currentTimeMillis()
        val tidy = all().map { if (it.outcome == "started") it.copy(outcome = "abandoned", endedAt = it.endedAt ?: now) else it }
        val a = AnswerAttempt("a$now", question, words, now)
        save(tidy + a)
        return a
    }

    fun finish(id: String, over: Boolean) = update(id) { it.copy(outcome = "finished", endedAt = System.currentTimeMillis(), over = over) }
    fun abandon(id: String) = update(id) { if (it.outcome == "started") it.copy(outcome = "abandoned", endedAt = System.currentTimeMillis()) else it }
    fun reviewed(id: String) = update(id) { it.copy(reviewed = true) }

    private fun update(id: String, f: (AnswerAttempt) -> AnswerAttempt) = save(all().map { if (it.id == id) f(it) else it })

    data class Week(val started: Int, val finished: Int, val abandoned: Int, val streakDays: Int, val lastFinished: LocalDate?)

    /** This week (from Monday): how many started and finished, and how many days in a row ended with a finished one. */
    fun week(today: LocalDate = LocalDate.now()): Week {
        val zone = ZoneId.systemDefault()
        val day = { ms: Long -> Instant.ofEpochMilli(ms).atZone(zone).toLocalDate() }
        val monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val log = all()
        val thisWeek = log.filter { !day(it.startedAt).isBefore(monday) }
        val finishedDays = log.filter { it.outcome == "finished" }.map { day(it.startedAt) }.toSet()
        var streak = 0
        var d = if (today in finishedDays) today else today.minusDays(1)
        while (d in finishedDays) { streak++; d = d.minusDays(1) }
        return Week(
            started = thisWeek.size,
            finished = thisWeek.count { it.outcome == "finished" },
            abandoned = thisWeek.count { it.outcome == "abandoned" },
            streakDays = streak,
            lastFinished = finishedDays.maxOrNull(),
        )
    }

    /** Chotu's line on the Studio screen, from the log. Warm, never a scold, and always one small next step. */
    fun chotuLine(hindi: Boolean, today: LocalDate = LocalDate.now()): String {
        val w = week(today)
        val gap = w.lastFinished?.let { java.time.temporal.ChronoUnit.DAYS.between(it, today) }
        return when {
            w.started == 0 && w.lastFinished == null -> if (hindi) "पहला उत्तर बस 7 मिनट का है। सवाल चुनो, टाइमर चलाओ, जो आए लिखो।" else "Your first one is just 7 minutes. Pick a question, start the timer, write what comes."
            w.started == 0 && gap != null && gap >= 3 -> if (hindi) "$gap दिन हो गए। आज एक 7 मिनट का उत्तर, बस इतना।" else "It's been $gap days. One 7-minute answer today, that's all."
            w.started == 0 -> if (hindi) "नया हफ़्ता। आज एक उत्तर पूरा करें, बस 7 मिनट।" else "New week. Let's finish one today, just 7 minutes."
            w.finished == 0 -> if (hindi) "इस हफ़्ते ${w.started} शुरू किए। आज एक पूरा करें, बस 7 मिनट। अधूरा भी चलेगा, बस आख़िर तक लिखो।" else "You started ${w.started} this week. Let's finish one today, just 7 minutes. Rough is fine, just get to the end."
            w.finished < w.started -> if (hindi) "इस हफ़्ते ${w.started} शुरू किए और ${w.finished} पूरे। आज एक और पूरा करें, बस 7 मिनट।" else "You started ${w.started} and finished ${w.finished} this week. Let's finish one today, just 7 minutes."
            w.streakDays >= 2 -> if (hindi) "लगातार ${w.streakDays} दिन उत्तर पूरे। आज का भी 7 मिनट में।" else "${w.streakDays} days in a row with a finished answer. Today's is 7 minutes too."
            else -> if (hindi) "इस हफ़्ते ${w.finished} पूरे किए। अगला 7 मिनट का?" else "You finished ${w.finished} this week, every one you started. Another 7 minutes?"
        }
    }
}
