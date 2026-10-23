package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.DayOfWeek
import java.time.LocalDate

/**
 * The 1/7/30-day recall loop (playbook A5). Every answer stays on this phone.
 *
 * - Day 1: one question from yesterday's pack at the top of today's Chai, gone after one tap.
 * - Day 7: on Fridays the Prelims set pulls first from this week's misses and skips.
 * - Day 30: a monthly "Remember these?" set from packs about a month old.
 */
class Recall(context: Context) {
    private val prefs = context.getSharedPreferences("recall", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    @Serializable
    private data class Answer(val date: String, val right: Boolean, val topic: String = "")

    private fun answers(): Map<String, Answer> = prefs.getString("answers", null)
        ?.let { runCatching { json.decodeFromString<Map<String, Answer>>(it) }.getOrNull() } ?: emptyMap()

    /** The latest answer per card. Entries older than 45 days are dropped. */
    fun record(cardId: String, right: Boolean, topic: String = "", today: LocalDate = LocalDate.now()) {
        val cutoff = today.minusDays(45).toString()
        val next = answers().filterValues { it.date >= cutoff } + (cardId to Answer(today.toString(), right, topic))
        prefs.edit().putString("answers", json.encodeToString(next)).apply()
    }

    // --- Day 1 ----------------------------------------------------------------

    /** One question from the newest pack before today's, or null once it's been answered today. */
    fun yesterdayQuestion(today: Brief, archive: List<Brief>, hindi: Boolean, date: LocalDate = LocalDate.now()): PracticeQuestion? {
        if (prefs.getString("dayOne", null) == date.toString()) return null
        val prev = archive.filter { it.date < today.date && !it.sample }.maxByOrNull { it.date } ?: return null
        val withMcq = prev.items.filter { it.text(hindi).mcq != null }
        if (withMcq.isEmpty()) return null
        val item = withMcq[(date.toEpochDay() % withMcq.size).toInt()]
        return PracticeQuestion("recall-${item.id}", item.topic, item.text(hindi).mcq!!, item.id, isReview = true)
    }

    fun answeredYesterday(cardId: String, right: Boolean, topic: String, date: LocalDate = LocalDate.now()) {
        prefs.edit().putString("dayOne", date.toString()).apply()
        record(cardId, right, topic, date)
    }

    /** Topics missed in the last 30 days, most missed first (for "Know the paper, know yourself"). */
    fun weakTopics(date: LocalDate = LocalDate.now()): List<Pair<String, Int>> {
        val from = date.minusDays(30).toString()
        return answers().values.filter { !it.right && it.topic.isNotBlank() && it.date >= from }
            .groupingBy { it.topic }.eachCount().entries.sortedByDescending { it.value }.take(3).map { it.key to it.value }
    }

    // --- Day 7 ----------------------------------------------------------------

    /** Cards from the last 7 days' packs that were answered wrong or never answered. Empty except on Fridays. */
    fun fridayMisses(archive: List<Brief>, hindi: Boolean, date: LocalDate = LocalDate.now()): List<NewsItem> {
        if (date.dayOfWeek != DayOfWeek.FRIDAY) return emptyList()
        val from = date.minusDays(7).toString()
        val seen = answers()
        return archive.filter { it.date >= from && it.date < date.toString() && !it.sample }
            .flatMap { it.items }
            .filter { it.text(hindi).mcq != null && seen[it.id]?.right != true }
            // Wrong answers before skipped ones.
            .sortedBy { if (seen[it.id]?.right == false) 0 else 1 }
            .distinctBy { it.id }
    }

    // --- Day 30 ---------------------------------------------------------------

    /** "Remember these?": up to 5 cards from packs 25 to 40 days old, once a month. */
    fun monthlySet(archive: List<Brief>, hindi: Boolean, date: LocalDate = LocalDate.now()): List<PracticeQuestion> {
        if (prefs.getString("monthly", null) == date.toString().take(7)) return emptyList()
        val from = date.minusDays(40).toString()
        val to = date.minusDays(25).toString()
        val seen = answers()
        return archive.filter { it.date in from..to && !it.sample }
            .flatMap { it.items }
            .filter { it.text(hindi).mcq != null }
            .distinctBy { it.id }
            .sortedBy { if (seen[it.id]?.right == false) 0 else 1 }
            .take(Practice.DAILY)
            .map { PracticeQuestion("month-${it.id}", it.topic, it.text(hindi).mcq!!, it.id, isReview = true) }
    }

    fun finishedMonthly(date: LocalDate = LocalDate.now()) {
        prefs.edit().putString("monthly", date.toString().take(7)).apply()
    }

    fun forget() = prefs.edit().clear().apply()
}
