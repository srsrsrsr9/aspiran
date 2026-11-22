package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalAdjusters
import kotlin.math.roundToInt

/**
 * The student's own record, counted by the app (artefacts/chotu-jeetu-behaviour-rules-2026-11-22.md §1). Every number
 * Chotu and Jeetu say comes from here; the models never count. Kept on this phone only.
 */

/** One day as the student left it: tasks done and moved, and last night's first step (private text, never sent online). */
@Serializable
data class DayLog(
    val done: Set<String> = emptySet(),
    val moved: Set<String> = emptySet(),
    val firstStep: String? = null,
    val firstStepDone: Boolean = false,
)

/** A subject's accuracy, older two weeks or more against the last 7 days. */
data class Trend(val subject: String, val fromPct: Int, val toPct: Int, val weeks: Int) {
    val change get() = toPct - fromPct
}

data class StudyFacts(
    val today: LocalDate,
    /** This week, from Monday: planned and done minutes of Today's 3. */
    val weekPlannedMin: Int,
    val weekDoneMin: Int,
    val weekQuestions: Int,
    val weekAnswers: Int,
    val weekReviews: Int,
    /** This calendar month. */
    val monthMinutes: Int,
    val monthQuestions: Int,
    val monthAnswers: Int,
    val monthReviews: Int,
    val monthMocks: Int,
    val trends: List<Trend>,
    /** One best-ever win, already worded in English and Hindi. */
    val win: Pair<String, String>?,
    /** Subjects below 50% in each of the last two weeks (5+ questions each week). */
    val stuck: List<String>,
    /** Today's tasks left or moved on 3 or more of the last 14 days. */
    val missed: List<String>,
    /** Yesterday's first step and whether it was ticked. Private text: on-phone Chotu only. */
    val yesterdayStep: String?,
    val yesterdayStepDone: Boolean,
    /** Days since the last day with any work, before today. Null with no record at all. */
    val quietDays: Int?,
) {
    /** A pattern worth Jeetu's take: something planned and missed 3+ times, or a subject stuck below 50%. */
    val jeetuPattern get() = stuck.isNotEmpty() || missed.isNotEmpty()
    val hasAnything get() = weekDoneMin > 0 || monthQuestions > 0 || monthAnswers > 0 || monthReviews > 0 || monthMocks > 0
    /** The trend for the card: the biggest rise, else the steadiest; a fall is left to Jeetu's facts. */
    val shownTrend: Trend? get() = trends.filter { it.change >= 0 }.maxByOrNull { it.change }

    /**
     * The facts as short lines for a model. [private] adds the student's own first-step text, for the phone's model
     * only; anything sent online leaves it out (the Close the Day promise).
     */
    fun block(private: Boolean): String = buildList {
        add("This week: planned $weekPlannedMin min, done $weekDoneMin min; $weekQuestions questions, $weekAnswers answers written, $weekReviews reviews.")
        add("This month: $monthMinutes min, $monthQuestions questions, $monthAnswers answers written, $monthReviews reviews, $monthMocks mocks.")
        trends.take(3).forEach { add("${it.subject} accuracy: ${it.fromPct}% to ${it.toPct}% over ${it.weeks} weeks.") }
        win?.let { add("Win: ${it.first}") }
        stuck.forEach { add("$it below 50% two weeks running.") }
        missed.forEach { add("$it planned but not done on 3 or more of the last 14 days.") }
        if (private && yesterdayStep != null) add("Yesterday's own plan: \"$yesterdayStep\" (${if (yesterdayStepDone) "ticked done" else "not ticked"}).")
    }.joinToString("\n")

    /** Two lines after a mock or a practice set: effort, then one trend or the win. Null with nothing true to say. */
    fun debrief(hindi: Boolean): String? {
        if (!hasAnything) return null
        val effort = if (hindi) "इस हफ़्ते $weekQuestions प्रश्न, इस महीने $monthQuestions।" else "That's $weekQuestions questions this week and $monthQuestions this month."
        val second = shownTrend?.let { trendLine(it, hindi) } ?: win?.let { if (hindi) it.second else it.first }
        return listOfNotNull(effort, second).joinToString("\n")
    }

    companion object {
        fun trendLine(t: Trend, hindi: Boolean) =
            if (hindi) "${t.subject}: ${t.weeks} हफ़्तों में ${t.fromPct}% → ${t.toPct}%।" else "${t.subject} accuracy ${t.fromPct}% → ${t.toPct}% over ${t.weeks} weeks."
    }
}

/** Builds [StudyFacts] from plain data, so the numbers can be unit-tested. */
object Facts {
    /** Questions a week needs before its accuracy counts. */
    const val MIN_Q = 5

    fun build(
        today: LocalDate,
        /** Week.log(): date → [planned, done] minutes. */
        minutes: Map<String, List<Int>>,
        /** EffortLog.days(): date → the day's tasks and first step. */
        days: Map<String, DayLog>,
        /** EffortLog.answers(): date → subject → [right, total], practice, review and Chai questions. */
        answers: Map<String, Map<String, List<Int>>>,
        /** Answer Studio: the epoch-day of each finished answer. */
        answersWritten: List<LocalDate>,
        mocks: List<MockRecord>,
        /** EffortLog.reviews(): date → review questions and topic checks done. */
        reviews: Map<String, Int>,
    ): StudyFacts {
        val monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val month = today.withDayOfMonth(1)
        fun inWeek(d: String) = d >= monday.toString() && d <= today.toString()
        fun inMonth(d: String) = d >= month.toString() && d <= today.toString()

        // Mocks count as questions too, by their topics and day.
        val all = mutableMapOf<String, MutableMap<String, IntArray>>()
        fun add(day: String, subject: String, right: Int, total: Int) {
            if (total <= 0) return
            val a = all.getOrPut(day) { mutableMapOf() }.getOrPut(subjectOf(subject)) { IntArray(2) }
            a[0] += right; a[1] += total
        }
        answers.forEach { (d, m) -> m.forEach { (s, v) -> if (v.size >= 2) add(d, s, v[0], v[1]) } }
        mocks.forEach { r -> r.topics.forEach { (s, t) -> add(r.day, s, t.right, t.right + t.wrong) } }
        fun qs(f: (String) -> Boolean) = all.filterKeys(f).values.sumOf { m -> m.values.sumOf { it[1] } }

        val weekMins = minutes.filterKeys(::inWeek).values.filter { it.size >= 2 }
        val monthMinutes = minutes.filterKeys(::inMonth).values.filter { it.size >= 2 }.sumOf { it[1] }

        // Accuracy by subject in 7-day buckets ending today: 0 = last 7 days, 1 = the 7 before, 2 = the 7 before that.
        fun bucket(d: String): Int? = runCatching { ChronoUnit.DAYS.between(LocalDate.parse(d), today) }.getOrNull()
            ?.takeIf { it >= 0 }?.let { (it / 7).toInt() }?.takeIf { it <= 2 }
        val bySubject = mutableMapOf<String, Array<IntArray>>()
        all.forEach { (d, m) ->
            val b = bucket(d) ?: return@forEach
            m.forEach { (s, v) -> val arr = bySubject.getOrPut(s) { Array(3) { IntArray(2) } }; arr[b][0] += v[0]; arr[b][1] += v[1] }
        }
        fun pct(v: IntArray) = (v[0] * 100.0 / v[1]).roundToInt()
        val trends = bySubject.mapNotNull { (s, b) ->
            if (b[0][1] < MIN_Q) return@mapNotNull null
            val old = (2 downTo 1).firstOrNull { b[it][1] >= MIN_Q } ?: return@mapNotNull null
            Trend(s, pct(b[old]), pct(b[0]), old + 1)
        }.sortedByDescending { kotlin.math.abs(it.change) }
        val stuck = bySubject.filter { (_, b) -> (0..1).all { b[it][1] >= MIN_Q && pct(b[it]) < 50 } }.keys.sorted()

        // Missed, on 3 or more of the last 14 days (today not counted yet): a task the student moved to tomorrow and didn't
        // do, or their own first step left unticked. Today's 3 simply left alone don't count: the student didn't choose them.
        val recent = days.filterKeys { d -> bucketDays(d, today)?.let { it in 1..14 } == true }.values
        val missed = TaskId.entries.filter { t -> recent.count { t.name in it.moved && t.name !in it.done } >= 3 }.map { it.title } +
            listOfNotNull("Their own first step".takeIf { recent.count { it.firstStep != null && !it.firstStepDone } >= 3 })

        val y = days[today.minusDays(1).toString()]
        val active = (days.filter { (_, l) -> l.done.isNotEmpty() || l.firstStepDone }.keys + all.keys + answersWritten.map { it.toString() } +
            minutes.filter { (_, v) -> v.size >= 2 && v[1] > 0 }.keys).filter { it < today.toString() }
        val quiet = active.maxOrNull()?.let { ChronoUnit.DAYS.between(LocalDate.parse(it), today).toInt() }

        val weekQ = qs(::inWeek)
        val monthAns = answersWritten.count { inMonth(it.toString()) }
        return StudyFacts(
            today = today,
            weekPlannedMin = weekMins.sumOf { it[0] },
            weekDoneMin = weekMins.sumOf { it[1] },
            weekQuestions = weekQ,
            weekAnswers = answersWritten.count { inWeek(it.toString()) },
            weekReviews = reviews.filterKeys(::inWeek).values.sum(),
            monthMinutes = monthMinutes,
            monthQuestions = qs(::inMonth),
            monthAnswers = monthAns,
            monthReviews = reviews.filterKeys(::inMonth).values.sum(),
            monthMocks = mocks.count { inMonth(it.day) },
            trends = trends,
            win = win(today, all, minutes, monthAns),
            stuck = stuck,
            missed = missed,
            yesterdayStep = y?.firstStep,
            yesterdayStepDone = y?.firstStepDone == true,
            quietDays = quiet,
        )
    }

    private fun bucketDays(d: String, today: LocalDate): Long? = runCatching { ChronoUnit.DAYS.between(LocalDate.parse(d), today) }.getOrNull()

    /**
     * One best-ever win, as a total (never days in a row): the most questions in a week so far, else the most minutes
     * in a week so far, else this month's answers written. "So far" needs at least two earlier weeks on record.
     */
    private fun win(today: LocalDate, all: Map<String, Map<String, IntArray>>, minutes: Map<String, List<Int>>, monthAnswers: Int): Pair<String, String>? {
        fun weekOf(d: String) = runCatching { LocalDate.parse(d).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)) }.getOrNull()
        val thisWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        fun best(perWeek: Map<LocalDate, Int>): Int? {
            val now = perWeek[thisWeek] ?: return null
            val before = perWeek.filterKeys { it < thisWeek }
            return now.takeIf { it > 0 && before.size >= 2 && before.values.all { v -> now > v } }
        }
        val qWeeks = all.entries.mapNotNull { (d, m) -> weekOf(d)?.let { it to m.values.sumOf { v -> v[1] } } }
            .groupBy({ it.first }, { it.second }).mapValues { it.value.sum() }
        best(qWeeks)?.let { return "Your most questions in a week so far: $it." to "एक हफ़्ते में अब तक के सबसे ज़्यादा प्रश्न: $it।" }
        val mWeeks = minutes.entries.mapNotNull { (d, v) -> if (v.size >= 2) weekOf(d)?.let { it to v[1] } else null }
            .groupBy({ it.first }, { it.second }).mapValues { it.value.sum() }
        best(mWeeks)?.let { return "Your most study minutes in a week so far: $it." to "एक हफ़्ते में अब तक के सबसे ज़्यादा मिनट: $it।" }
        if (monthAnswers > 0) return "Answers written this month: $monthAnswers." to "इस महीने लिखे उत्तर: $monthAnswers।"
        return null
    }

    /** One subject name for a topic: the app's own subject names first, then by keyword, else the topic as written. */
    fun subjectOf(topic: String): String {
        val t = topic.trim()
        if (t.isEmpty()) return "Other"
        SUBJECTS.firstOrNull { it.second.equals(t, true) || it.first.equals(t, true) }?.let { return it.second }
        val low = t.lowercase()
        when {
            "polity" in low -> return "Polity"
            "geograph" in low -> return "Geography"
            "econom" in low -> return "Economy"
            "environment" in low || "ecology" in low -> return "Environment"
            "modern" in low -> return "Modern history"
            "science" in low || "tech" in low -> return "Science and tech"
            "international" in low || "world" in low -> return "World and India"
        }
        val key = subjectByWords(t)
        return if (key != "more") subjectName(key) else t.replaceFirstChar { it.uppercase() }
    }
}

/**
 * The answer and day log behind [Facts]: practice, review and Chai answers by day and subject, and each day's tasks
 * and first step. 180 days kept. Never leaves the phone (the facts block that goes online carries no plan text).
 */
class EffortLog(context: Context) {
    private val prefs = context.getSharedPreferences("effort", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val answersSer = MapSerializer(String.serializer(), MapSerializer(String.serializer(), ListSerializer(Int.serializer())))
    private val daysSer = MapSerializer(String.serializer(), DayLog.serializer())

    fun answers(): Map<String, Map<String, List<Int>>> =
        prefs.getString("answers", null)?.let { runCatching { json.decodeFromString(answersSer, it) }.getOrNull() } ?: emptyMap()

    private val countSer = MapSerializer(String.serializer(), Int.serializer())

    fun reviews(): Map<String, Int> = prefs.getString("reviews", null)?.let { runCatching { json.decodeFromString(countSer, it) }.getOrNull() } ?: emptyMap()

    /** One review question or topic check done. */
    fun reviewed(date: LocalDate = LocalDate.now()) {
        val d = date.toString(); val cut = date.minusDays(KEEP_DAYS).toString()
        val all = reviews().filterKeys { it >= cut }
        prefs.edit().putString("reviews", json.encodeToString(countSer, all + (d to (all[d] ?: 0) + 1))).apply()
    }

    fun days(): Map<String, DayLog> = prefs.getString("days", null)?.let { runCatching { json.decodeFromString(daysSer, it) }.getOrNull() } ?: emptyMap()

    fun answer(topic: String, right: Boolean, date: LocalDate = LocalDate.now()) {
        val d = date.toString(); val s = Facts.subjectOf(topic)
        val all = answers().toMutableMap()
        val day = (all[d] ?: emptyMap()).toMutableMap()
        val v = day[s] ?: listOf(0, 0)
        day[s] = listOf(v[0] + if (right) 1 else 0, v[1] + 1)
        all[d] = day
        val cut = date.minusDays(KEEP_DAYS).toString()
        prefs.edit().putString("answers", json.encodeToString(answersSer, all.filterKeys { it >= cut })).apply()
    }

    /** Today's tasks and first step, saved with every change to the day. */
    fun logDay(s: DaySnapshot, today: LocalDate = LocalDate.now()) {
        val step = s.plan?.takeIf { it.madeOn.isBefore(today) }?.text
        val log = DayLog(s.done.map { it.name }.toSet(), s.moved.map { it.name }.toSet(), step, s.firstStepDone)
        val cut = today.minusDays(KEEP_DAYS).toString()
        val next = days().filterKeys { it >= cut } + (today.toString() to log)
        prefs.edit().putString("days", json.encodeToString(daysSer, next)).apply()
    }

    fun forget() = prefs.edit().clear().apply()

    companion object {
        const val KEEP_DAYS = 180L

        /** Everything the phone knows, counted now. */
        fun facts(context: Context, today: LocalDate = LocalDate.now()): StudyFacts {
            val log = EffortLog(context)
            val zone = ZoneId.systemDefault()
            val written = AnswerLog(context).all().filter { it.outcome == "finished" }
                .map { Instant.ofEpochMilli(it.startedAt).atZone(zone).toLocalDate() }
            return Facts.build(today, Week(context).log(), log.days(), log.answers(), written, Mocks(context).history(), log.reviews())
        }
    }
}
