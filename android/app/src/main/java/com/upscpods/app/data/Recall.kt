package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.LocalDate

/**
 * Day-1 recall (playbook A5): one question from yesterday's pack at the top of today's Chai, gone after one tap, plus
 * the answer log behind "Know the paper, know yourself". Every answer stays on this phone. The old Friday and monthly
 * sets are gone: every Chai answer now goes into the one review queue (AppRepository, FSRS), which brings it back
 * just before you'd forget it.
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

    fun forget() = prefs.edit().clear().apply()
}
