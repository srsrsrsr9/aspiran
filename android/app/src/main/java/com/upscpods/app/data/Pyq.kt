package com.upscpods.app.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromJsonElement

// UPSC previous-year questions: official papers from upsc.gov.in, editor-approved, in the cached /library (kind "pyq",
// built by server/scripts/pyq.mjs). Mains questions are text only, never a model answer; a Prelims answer shows only
// when the paper carries UPSC's official key. Each question names its syllabus nodes, so it shows under that topic.

@Serializable
data class PyqText(val q: String, val options: List<String> = emptyList())

@Serializable
data class PyqQuestion(
    val n: String,
    val marks: Double? = null,
    val words: Int? = null,
    val nodes: List<String> = emptyList(),
    val cards: List<String> = emptyList(),
    val en: PyqText,
    val answer: Int? = null,
)

@Serializable
data class PyqKey(val status: String = "none", val url: String? = null, val dropped: List<String> = emptyList())

@Serializable
data class PyqSource(val publisher: String = "UPSC", val url: String = "")

@Serializable
data class PyqPaper(
    val id: String = "",
    val exam: String = "mains",
    val year: Int = 0,
    val paper: String = "",
    val title: Bi<String> = Bi(""),
    val source: PyqSource = PyqSource(),
    val answerKey: PyqKey = PyqKey(),
    val sample: Boolean = false,
    val questions: List<PyqQuestion> = emptyList(),
) {
    val mains get() = exam == "mains"
    /** Answers only from UPSC's own key; a question UPSC dropped has none. */
    fun answerOf(q: PyqQuestion): Int? = q.answer.takeIf { answerKey.status == "official" && q.n !in answerKey.dropped }
    /** "Mains 2025 · GS1 Q7". */
    fun label(q: PyqQuestion) = "${if (mains) "Mains" else "Prelims"} $year · ${SYLLABUS.firstOrNull { it.id == paper }?.short ?: paper.uppercase()} Q${q.n}"
}

/** One question with the paper it came from. */
data class Pyq(val paper: PyqPaper, val q: PyqQuestion) {
    val id get() = "${paper.id}#${q.n}"
    val label get() = paper.label(q)
    /** The word limit and marks as UPSC prints them, for Answer Studio's prompt. */
    fun prompt() = q.en.q + (q.words?.let { " ($it words${q.marks?.let { m -> ", ${fmtMarks(m)} marks" } ?: ""})" } ?: "")
    fun asMainsTask() = MainsTask("pyq-$id", prompt(), label)
}

private fun fmtMarks(m: Double) = if (m == m.toLong().toDouble()) m.toLong().toString() else m.toString()

object Pyqs {
    private val JSON = Json { ignoreUnknownKeys = true; coerceInputValues = true }

    /** Approved papers, newest first. SAMPLE papers never show, even if one slipped through. */
    fun papers(library: ContentLibrary): List<PyqPaper> = library.items.filter { it.kind == "pyq" }.mapNotNull { item ->
        runCatching { JSON.decodeFromJsonElement<PyqPaper>(item.data) }.getOrNull()?.takeIf { !it.sample && it.questions.isNotEmpty() }
    }.sortedWith(compareByDescending<PyqPaper> { it.year }.thenBy { SYLLABUS.indexOfFirst { p -> p.id == it.paper } })

    fun all(papers: List<PyqPaper>): List<Pyq> = papers.flatMap { p -> p.questions.map { Pyq(p, it) } }

    /** The questions under one syllabus topic: those whose nodes name it. */
    fun forTopic(all: List<Pyq>, paper: SyllabusPaper, topic: SyllabusTopic): List<Pyq> =
        all.filter { pq -> pq.q.nodes.any { syllabusNode(it)?.let { (p, t) -> p.id == paper.id && t == topic } == true } }

    /** Per topic name, how many questions sit under it, for the Syllabus cards. */
    fun counts(all: List<Pyq>): Map<Pair<String, String>, Int> = all.flatMap { pq ->
        pq.q.nodes.mapNotNull { syllabusNode(it) }.mapNotNull { (p, t) -> t?.let { p.id to it.name } }.distinct()
    }.groupingBy { it }.eachCount()
}
