package com.upscpods.app.data

import kotlin.math.abs
import kotlin.math.roundToInt

// Mock Intelligence (sell-first plan W6, a Plus feature): five readings of the mock papers on this phone, worked out
// here from the history, the "Not sure" ticks, second tries, the error log and the syllabus. Nothing leaves the phone.

/** Right answers that rested on a guess or a second try, in one topic over the last papers. */
data class LuckyTopic(val topic: String, val luckyRight: Int, val shaky: Int)

/** A topic whose accuracy has stayed flat or fallen across its last papers, oldest first. */
data class StuckTopic(val topic: String, val pcts: List<Int>)

/** Marks lost to wrong answers over the last papers, and whether guessing pays at this marking. */
data class NegativeMarks(val lost: Double, val wrong: Int, val guessRight: Int, val guessTotal: Int, val breakEven: Double, val papers: Int) {
    val guessRate: Double? get() = if (guessTotal > 0) guessRight.toDouble() / guessTotal else null
}

/** One syllabus node worth revising this week: the marks in play there, and where they came from. */
data class RevisionNode(val paper: SyllabusPaper, val topic: SyllabusTopic, val marks: Double, val missed: Int, val skipped: Int, val shaky: Int)

/** Scores across papers, oldest first, and the band of the last five: where you're scoring now. */
data class ProgressBand(val pcts: List<Int>, val days: List<String>, val low: Int, val high: Int, val mean: Int)

data class MockIntel(
    val lucky: List<LuckyTopic>, val stuck: List<StuckTopic>, val negative: NegativeMarks?,
    val revision: List<RevisionNode>, val band: ProgressBand?, val papers: Int,
)

object MockIntelligence {
    private const val RECENT = 5

    fun of(hist: List<MockRecord>, misses: List<PrepQ>): MockIntel {
        val recent = hist.takeLast(RECENT)
        return MockIntel(lucky(recent), stuck(hist), negative(recent), revision(recent, misses), band(hist), hist.size)
    }

    /** Topics with 2 or more right answers that were guesses or second tries in the last papers. */
    private fun lucky(recent: List<MockRecord>): List<LuckyTopic> {
        val t = mutableMapOf<String, TopicTally>()
        recent.forEach { r -> r.shaky.forEach { (k, v) -> val x = t[k] ?: TopicTally(); t[k] = TopicTally(x.right + v.right, x.wrong + v.wrong) } }
        return t.filter { it.value.right >= 2 }.map { (k, v) -> LuckyTopic(k, v.right, v.right + v.wrong) }.sortedByDescending { it.luckyRight }.take(5)
    }

    /** Topics answered (2 or more each time) in 3 of the last 5 papers, up no more than 5 points and still under 70%. */
    private fun stuck(hist: List<MockRecord>): List<StuckTopic> {
        val series = mutableMapOf<String, MutableList<Int>>()
        hist.forEach { r -> r.topics.forEach { (k, v) -> val n = v.right + v.wrong; if (n >= 2) series.getOrPut(k) { mutableListOf() } += v.right * 100 / n } }
        return series.mapNotNull { (k, all) ->
            val s = all.takeLast(RECENT)
            if (s.size < 3 || s.last() - s.first() > 5 || s.average() >= 70) null else StuckTopic(k, s)
        }.sortedBy { it.pcts.last() - it.pcts.first() }.take(5)
    }

    private fun negative(recent: List<MockRecord>): NegativeMarks? {
        if (recent.isEmpty()) return null
        return NegativeMarks(
            round1(recent.sumOf { it.wrong * abs(it.marking.wrong) }), recent.sumOf { it.wrong },
            recent.sumOf { it.unsureRight }, recent.sumOf { it.unsureTotal }, Mocks.breakEven(recent.last().marking), recent.size,
        )
    }

    /**
     * The 10 syllabus nodes with the most marks in play: each question still in the error log (a wrong answer turned
     * right gains the mark and the penalty), each question left blank in the last papers, and half a mark's worth for
     * each lucky right answer, which may not hold.
     */
    private fun revision(recent: List<MockRecord>, misses: List<PrepQ>): List<RevisionNode> {
        val m = recent.lastOrNull()?.marking ?: Marking()
        class Acc { var marks = 0.0; var missed = 0; var skipped = 0; var shaky = 0 }
        val acc = linkedMapOf<Pair<SyllabusPaper, SyllabusTopic>, Acc>()
        misses.forEach { q -> nodeFor(q.topic, q.topic + " " + q.q.question)?.let { acc.getOrPut(it) { Acc() }.apply { marks += m.right + abs(m.wrong); missed++ } } }
        recent.forEach { r ->
            r.topics.forEach { (k, v) -> if (v.skipped > 0) nodeFor(k, k)?.let { acc.getOrPut(it) { Acc() }.apply { marks += v.skipped * m.right; skipped += v.skipped } } }
            r.shaky.forEach { (k, v) -> if (v.right > 0) nodeFor(k, k)?.let { acc.getOrPut(it) { Acc() }.apply { marks += v.right * m.right / 2; shaky += v.right } } }
        }
        return acc.entries.sortedByDescending { it.value.marks }.take(10).map { (n, a) -> RevisionNode(n.first, n.second, round1(a.marks), a.missed, a.skipped, a.shaky) }
    }

    private fun band(hist: List<MockRecord>): ProgressBand? {
        val last = hist.takeLast(10)
        if (last.isEmpty()) return null
        val r = last.takeLast(RECENT).map { it.pct }
        return ProgressBand(last.map { it.pct }, last.map { it.day }, r.min(), r.max(), r.average().roundToInt())
    }

    /** The syllabus node a mock topic or question sits under: one its words pick out, else the narrowest that fits. */
    fun nodeFor(topic: String, text: String): Pair<SyllabusPaper, SyllabusTopic>? {
        val subject = topicSubject(topic).takeIf { it != "more" } ?: topicSubject(text)
        val fits = SYLLABUS.flatMap { p -> p.topics.map { p to it } }.filter { it.second.matches(subject, text) }
        return fits.firstOrNull { it.second.words != null } ?: fits.minByOrNull { it.second.subjects.size }
    }

    /** A subject key for a mock topic ("Modern history", "Economy") or a question, falling back to the library's words. */
    fun topicSubject(text: String): String {
        val t = text.lowercase().trim()
        SUBJECTS.firstOrNull { it.second.lowercase() == t }?.let { return it.first }
        return when {
            Regex("\\bcsat\\b|reasoning|comprehension|numeracy").containsMatchIn(t) -> "csat"
            Regex("polity|governance").containsMatchIn(t) -> "pol"
            Regex("geograph").containsMatchIn(t) -> "geo"
            Regex("ancient|medieval").containsMatchIn(t) -> "anc"
            Regex("histor|national movement").containsMatchIn(t) -> "his"
            Regex("econom").containsMatchIn(t) -> "eco"
            Regex("environment|ecolog|biodivers").containsMatchIn(t) -> "env"
            Regex("science|technolog").containsMatchIn(t) -> "sci"
            Regex("international|world and india|\\bir\\b").containsMatchIn(t) -> "ir"
            Regex("\\bart\\b|culture").containsMatchIn(t) -> "art"
            Regex("societ").containsMatchIn(t) -> "soc"
            else -> subjectByWords(t)
        }
    }

    private fun round1(d: Double) = (d * 10).roundToInt() / 10.0
}
