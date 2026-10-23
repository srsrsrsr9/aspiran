package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromJsonElement
import java.io.File
import java.time.LocalDate
import kotlin.math.max
import kotlin.math.roundToInt

/** A mock question's one language. Explanations are required on approval, but older items may lack one. */
@Serializable
data class MockMcq(val question: String, val options: List<String>, val answerIndex: Int, val explanation: String = "")

@Serializable
data class MockQuestion(val id: String = "", val topic: String = "", val en: MockMcq, val cardId: String? = null)

/** UPSC Prelims: GS1 is +2 / -0.66 per question; CSAT is +2.5 / -0.83. */
@Serializable
data class Marking(val right: Double = 2.0, val wrong: Double = -0.66) {
    fun label() = "+${fmt(right)} / ${fmt(wrong)}"
}

@Serializable
data class MockPaper(
    val id: String,
    val title: String,
    val paper: String = "GS1",
    val minutes: Int,
    val marking: Marking = Marking(),
    val note: String = "",
    val questions: List<MockQuestion>,
    val checkedBy: String? = null,
    val checkedOn: String? = null,
    /** The paper's own timer setting: no countdown, and [minutes] is only the suggested time. */
    val countUp: Boolean = false,
    /** With [countUp], the upward timer starts switched off. */
    val timerOff: Boolean = false,
) {
    val quick get() = id == QUICK
}

/** A paper's timer setting, e.g. {"default": "off", "counts": "up"}. Papers without one count down as before. */
@Serializable
data class MockTimer(val default: String = "", val counts: String = "")

/** A paper in progress. Saved on every change, so it resumes after the app is closed; the clock keeps running. */
@Serializable
data class ActiveMock(
    val paper: MockPaper,
    val answers: Map<Int, Int> = emptyMap(),
    val unsure: Set<Int> = emptySet(),
    val review: Set<Int> = emptySet(),
    val cur: Int = 0,
    /** Questions moved past without an answer; one answered later counts as a second try in Mock Intelligence. */
    val passed: Set<Int> = emptySet(),
    val startedAt: Long,
    val endsAt: Long,
    val hideTimer: Boolean = false,
)

@Serializable
data class TopicTally(val right: Int = 0, val wrong: Int = 0, val skipped: Int = 0)

@Serializable
data class MockRecord(
    val id: String,
    val title: String,
    val day: String,
    val marking: Marking,
    val score: Double,
    val max: Double,
    val pct: Int,
    val attempted: Int,
    val right: Int,
    val wrong: Int,
    val unsureRight: Int,
    val unsureTotal: Int,
    val topics: Map<String, TopicTally>,
    val minutes: Int,
    /** Per topic, the shaky answers: marked "Not sure", or left and answered on a later visit. Empty in older records. */
    val shaky: Map<String, TopicTally> = emptyMap(),
)

/** The last paper with its answers, for going through them on the result screen. */
@Serializable
data class MockLast(val paper: MockPaper, val answers: Map<Int, Int>, val unsure: Set<Int>)

/** The server's opt-in band: a band among people who shared, never a rank. */
@Serializable
data class MockBand(val band: String? = null, val note: String? = null, val n: Int = 0, val reason: String? = null) {
    val line get() = band ?: note ?: ""
}

@Serializable
private data class LibraryMock(
    val title: Bi<String> = Bi(""),
    val paper: String = "GS1",
    val minutes: Int = 120,
    val marking: Marking = Marking(),
    val note: Bi<String>? = null,
    val questions: List<MockQuestion> = emptyList(),
    val review: Review? = null,
    val timer: MockTimer? = null,
)

private fun fmt(d: Double) = if (d == d.toLong().toDouble()) d.toLong().toString() else d.toString()

const val QUICK = "quick"

/**
 * Mock papers on the phone, matching the web app: editor-approved papers from the cached /library (so the
 * list opens offline), a quick mock from Chai questions and the starter bank, and everything the person
 * does kept in files on this phone. Only the opt-in band ever leaves it, as a paper id and a percent.
 * Content stays English.
 */
class Mocks(context: Context) {
    private val dir = File(context.filesDir, "mocks").apply { mkdirs() }
    private val activeFile = File(dir, "active.json")
    private val historyFile = File(dir, "history.json")
    private val lastFile = File(dir, "last.json")
    private val bandsFile = File(dir, "bands.json")

    fun papers(library: ContentLibrary): List<MockPaper> = library.items.filter { it.kind == "mock" }.mapNotNull { item ->
        runCatching {
            val d = JSON.decodeFromJsonElement<LibraryMock>(item.data)
            MockPaper(
                id = item.id, title = d.title.en.ifBlank { "Mock paper" }, paper = d.paper, minutes = d.minutes, marking = d.marking,
                note = d.note?.en ?: "", questions = d.questions.mapIndexed { i, q -> q.copy(id = "${item.id}#$i") },
                checkedBy = d.review?.en?.checkedBy, checkedOn = d.review?.en?.checkedOn,
                countUp = d.timer?.counts == "up", timerOff = d.timer?.default == "off",
            )
        }.getOrNull()?.takeIf { it.questions.isNotEmpty() && it.minutes > 0 }
    }

    /** Up to 25 questions from Chai cards and the starter bank. Null under 10. Practice only. */
    fun quick(archive: List<Brief>, bank: List<BankQuestion>, seed: Long = System.currentTimeMillis() % 100_000): MockPaper? {
        val fromCards = archive.flatMap { it.items }.distinctBy { it.id }.mapNotNull { item ->
            item.text(false).mcq?.let { MockQuestion("card-${item.id}", item.topic, MockMcq(it.question, it.options, it.answerIndex, it.explanation), item.id) }
        }
        val pool = fromCards + bank.map { MockQuestion(it.id, it.topic, MockMcq(it.en.question, it.en.options, it.en.answerIndex, it.en.explanation)) }
        if (pool.size < 10) return null
        val qs = pool.shuffled(kotlin.random.Random(seed)).take(25)
        return MockPaper(QUICK, "Quick mock", "GS1", kotlin.math.ceil(qs.size * 1.2).toInt(), Marking(2.0, -0.66),
            "Built from checked Chai questions and the starter bank. Practice only, not an official paper.", qs)
    }

    fun active(): ActiveMock? = read(activeFile, ActiveMock.serializer())
    fun save(m: ActiveMock) = write(activeFile, ActiveMock.serializer(), m)

    /** A count-up paper has no end time: it never submits itself. */
    fun start(p: MockPaper, now: Long = System.currentTimeMillis()): ActiveMock =
        ActiveMock(p, startedAt = now, endsAt = if (p.countUp) Long.MAX_VALUE else now + p.minutes * 60_000L, hideTimer = p.countUp && p.timerOff).also(::save)

    /** Focus-block length for a paper: its time, or a generous three times the suggestion for a count-up paper. */
    fun focusMinutes(p: MockPaper): Int = if (p.countUp) maxOf(60, p.minutes * 3) else p.minutes

    fun history(): List<MockRecord> = read(historyFile, ListSerializer(MockRecord.serializer())) ?: emptyList()
    fun last(): MockLast? = read(lastFile, MockLast.serializer())

    /** Scores the paper, keeps the record and the answers, and clears the paper in progress. */
    fun submit(m: ActiveMock, now: Long = System.currentTimeMillis()): MockRecord {
        val p = m.paper
        var right = 0; var wrong = 0; var unsureRight = 0; var unsureTotal = 0
        val topics = mutableMapOf<String, TopicTally>()
        val shaky = mutableMapOf<String, TopicTally>()
        p.questions.forEachIndexed { i, q ->
            val key = q.topic.ifBlank { "Other" }
            val t = topics[key] ?: TopicTally()
            val a = m.answers[i]
            if (a == null) { topics[key] = t.copy(skipped = t.skipped + 1); return@forEachIndexed }
            val ok = a == q.en.answerIndex
            if (ok) { right++; topics[key] = t.copy(right = t.right + 1) } else { wrong++; topics[key] = t.copy(wrong = t.wrong + 1) }
            if (i in m.unsure) { unsureTotal++; if (ok) unsureRight++ }
            if (i in m.unsure || i in m.passed) { val s = shaky[key] ?: TopicTally(); shaky[key] = if (ok) s.copy(right = s.right + 1) else s.copy(wrong = s.wrong + 1) }
        }
        val maxScore = round2(p.questions.size * p.marking.right)
        val score = round2(right * p.marking.right + wrong * p.marking.wrong)
        val rec = MockRecord(
            p.id, p.title, LocalDate.now().toString(), p.marking, score, maxScore,
            max(0, if (maxScore > 0) (score / maxScore * 100).roundToInt() else 0),
            right + wrong, right, wrong, unsureRight, unsureTotal, topics, ((now - m.startedAt) / 60_000).toInt(), shaky,
        )
        write(historyFile, ListSerializer(MockRecord.serializer()), (history() + rec).takeLast(100))
        write(lastFile, MockLast.serializer(), MockLast(p, m.answers, m.unsure))
        activeFile.delete()
        return rec
    }

    /** A band already fetched for this paper and day, so it isn't asked for twice. */
    fun band(r: MockRecord): MockBand? = bands()["${r.id}:${r.day}"]
    fun saveBand(r: MockRecord, b: MockBand) = write(bandsFile, BANDS, bands() + ("${r.id}:${r.day}" to b))
    private fun bands(): Map<String, MockBand> = read(bandsFile, BANDS) ?: emptyMap()

    fun forget() { dir.listFiles()?.forEach { it.delete() } }

    private fun <T> read(f: File, s: KSerializer<T>): T? =
        runCatching { if (f.exists()) JSON.decodeFromString(s, f.readText()) else null }.getOrNull()

    // Write to a temp file first, so a paper isn't lost if the app is killed mid-write.
    private fun <T> write(f: File, s: KSerializer<T>, v: T) {
        val tmp = File(f.parentFile, f.name + ".tmp")
        tmp.writeText(JSON.encodeToString(s, v))
        if (!tmp.renameTo(f)) { f.delete(); tmp.renameTo(f) }
    }

    companion object {
        private val JSON = Json { ignoreUnknownKeys = true; coerceInputValues = true }
        private val BANDS = MapSerializer(String.serializer(), MockBand.serializer())
        private fun round2(d: Double) = (d * 100).roundToInt() / 100.0

        /** Hit rate a guess needs to pay with this marking (about 1 in 4 for GS1). */
        fun breakEven(m: Marking) = -m.wrong / (m.right - m.wrong)
    }
}
