package com.upscpods.app.data

import android.content.Context
import android.util.Base64
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import kotlin.math.roundToInt

/**
 * The private weekly pieces: Monday WOOP (playbook A4) and the planning mirror (A3).
 * Everything stays on this phone; the WOOP is encrypted like the journal.
 */
class Week(context: Context) {
    private val prefs = context.getSharedPreferences("week", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    @Serializable
    data class Woop(val wish: String, val outcome: String, val obstacle: String, val plan: String)

    private fun monday(date: LocalDate = LocalDate.now()) = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))

    // --- WOOP -----------------------------------------------------------------

    fun woop(date: LocalDate = LocalDate.now()): Woop? {
        val enc = prefs.getString("woop:${monday(date)}", null) ?: return null
        return runCatching { json.decodeFromString<Woop>(Crypto.decrypt(Base64.decode(enc, Base64.NO_WRAP))) }.getOrNull()
    }

    /** Monday's first open, until it's filled in or skipped. Skipping is silent. */
    fun woopDue(date: LocalDate = LocalDate.now()): Boolean =
        date.dayOfWeek == DayOfWeek.MONDAY && woop(date) == null && !prefs.getBoolean("woopSkip:${monday(date)}", false)

    fun saveWoop(w: Woop, date: LocalDate = LocalDate.now()) {
        val enc = Base64.encodeToString(Crypto.encrypt(json.encodeToString(w)), Base64.NO_WRAP)
        prefs.edit().putString("woop:${monday(date)}", enc).apply()
    }

    fun skipWoop(date: LocalDate = LocalDate.now()) = prefs.edit().putBoolean("woopSkip:${monday(date)}", true).apply()

    // --- Planning mirror ------------------------------------------------------

    /** Planned and done minutes for one day, saved with every change to the day. */
    fun logMinutes(planned: Int, done: Int, date: LocalDate = LocalDate.now()) {
        val cutoff = date.minusDays(28).toString()
        val log = minutes().filterKeys { it >= cutoff } + (date.toString() to listOf(planned, done))
        prefs.edit().putString("minutes", json.encodeToString(log)).apply()
    }

    private fun minutes(): Map<String, List<Int>> =
        prefs.getString("minutes", null)?.let { runCatching { json.decodeFromString<Map<String, List<Int>>>(it) }.getOrNull() } ?: emptyMap()

    /**
     * "You usually finish about 7 of every 10 planned minutes", from the last 14 days before today.
     * Null with fewer than 4 days of data, when it's already been answered this week, or when
     * plans are already about right.
     */
    fun mirror(date: LocalDate = LocalDate.now()): Int? {
        if (prefs.getBoolean("mirror:${monday(date)}", false)) return null
        val from = date.minusDays(14).toString()
        val days = minutes().filterKeys { it >= from && it < date.toString() }.values.filter { it.size == 2 && it[0] > 0 }
        if (days.size < 4) return null
        val ratio = days.sumOf { it[1] }.toDouble() / days.sumOf { it[0] }
        val tenths = (ratio * 10).roundToInt().coerceIn(1, 10)
        return if (tenths >= 9) null else tenths
    }

    fun answerMirror(date: LocalDate = LocalDate.now()) = prefs.edit().putBoolean("mirror:${monday(date)}", true).apply()

    fun forget() = prefs.edit().clear().apply()

    companion object {
        /** Today's planned and done minutes, from the day's tasks and last night's first step. */
        fun minutesOf(s: DaySnapshot, today: LocalDate = LocalDate.now()): Pair<Int, Int> {
            val firstStep = s.plan?.madeOn?.isBefore(today) == true
            val planned = TaskId.entries.filter { it !in s.moved }.sumOf { it.minutes } + if (firstStep) 5 else 0
            val done = s.done.sumOf { it.minutes } + (s.started - s.done).size * 5 + if (s.firstStepDone) 5 else 0
            return planned to done
        }

        /** Next week's target, sized to what usually happens. */
        fun sized(target: Int, tenths: Int): Int = (target * tenths / 10.0).roundToInt().coerceIn(3, 7)
    }
}
