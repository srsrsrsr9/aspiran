package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * The syllabus map (teaching plan, build step 2): each syllabus topic is Not started, Met, Can recall or Can use.
 * No percentages. Everything stays on this phone. The web copy is server/public/app/map.js; keep the two in step.
 *
 * - Met: you studied it and wrote down what you remember. The topic then joins the review queue (Fsrs).
 * - Can recall: a recall check went well a week or more after the one before. Checks come from the review.
 * - Can use: you can recall it and you've used it in an answer or a set of past questions.
 * - A topic you haven't checked in a long while fades back to Met until the next check goes well.
 */
enum class MapState(val label: String, val mark: String) {
    NONE("Not started", "○"), MET("Met", "◐"), RECALL("Can recall", "●"), USE("Can use", "★"),
}

@Serializable
data class MapNode(
    val met: String,
    val note: String = "",
    val stability: Double,
    val difficulty: Double,
    val last: String,
    val due: String,
    val recalledOn: String? = null,
    val usedOn: String? = null,
    val usedHow: String? = null,
) {
    val fsrs get() = Fsrs.State(stability, difficulty, LocalDate.parse(last), LocalDate.parse(due))

    fun state(day: LocalDate = LocalDate.now()): MapState {
        if (recalledOn == null) return MapState.MET
        val days = maxOf(0L, ChronoUnit.DAYS.between(LocalDate.parse(last), day))
        if (Fsrs.retrievability(days, stability) < SyllabusMap.FADED) return MapState.MET
        return if (usedOn != null) MapState.USE else MapState.RECALL
    }

    fun isDue(day: LocalDate = LocalDate.now()) = due <= day.toString()

    /** One recall check. A miss takes the topic back to Met; a pass after a week or more makes it Can recall. */
    fun check(grade: Int, day: LocalDate = LocalDate.now()): MapNode {
        val gap = ChronoUnit.DAYS.between(LocalDate.parse(last), day)
        val next = Fsrs.review(fsrs, grade, day)
        val recalled = when {
            grade == Fsrs.AGAIN -> null
            gap >= SyllabusMap.RECALL_GAP -> day.toString()
            else -> recalledOn
        }
        return copy(stability = next.stability, difficulty = next.difficulty, last = next.last.toString(), due = next.due.toString(), recalledOn = recalled)
    }

    companion object {
        /** Mark a topic Met. Its first recall check comes in a few days. */
        fun met(note: String, day: LocalDate = LocalDate.now()): MapNode {
            val f = Fsrs.review(null, Fsrs.GOOD, day)
            return MapNode(day.toString(), note, f.stability, f.difficulty, f.last.toString(), f.due.toString())
        }
    }
}

class SyllabusMap(context: Context) {
    private val prefs = context.getSharedPreferences("syllabus_map", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    fun nodes(): Map<String, MapNode> = prefs.getString("nodes", null)
        ?.let { runCatching { json.decodeFromString<Map<String, MapNode>>(it) }.getOrNull() } ?: emptyMap()

    private fun put(id: String, node: MapNode?) {
        val next = nodes().toMutableMap().apply { if (node == null) remove(id) else put(id, node) }
        prefs.edit().putString("nodes", json.encodeToString(next)).apply()
    }

    fun state(id: String, day: LocalDate = LocalDate.now()) = nodes()[id]?.state(day) ?: MapState.NONE

    fun meet(id: String, note: String) { if (nodes()[id] == null) put(id, MapNode.met(note)) }
    fun check(id: String, grade: Int) { nodes()[id]?.let { put(id, it.check(grade)) } }

    /** Used in an answer or a PYQ set. Only counts once the topic is Can recall. */
    fun use(id: String, how: String) {
        val n = nodes()[id] ?: return
        if (n.state() in setOf(MapState.RECALL, MapState.USE)) put(id, n.copy(usedOn = LocalDate.now().toString(), usedHow = how))
    }

    fun reset(id: String) = put(id, null)

    /** Topics due a recall check, the most overdue first. */
    fun due(day: LocalDate = LocalDate.now()) = nodes().filterValues { it.isDue(day) }.entries.sortedBy { it.value.due }.map { it.key }

    /** How many topics are in each state (Not started left out). */
    fun counts(day: LocalDate = LocalDate.now()) = nodes().values.groupingBy { it.state(day) }.eachCount()

    /** The day the review was last finished, so Today can move past it. */
    var reviewedOn: String?
        get() = prefs.getString("reviewedOn", null)
        set(v) { prefs.edit().putString("reviewedOn", v).apply() }

    fun forget() = prefs.edit().clear().apply()

    companion object {
        /** A recall check only proves something after this many days. */
        const val RECALL_GAP = 7L
        /** Below this chance of recall, a topic shows as Met again. */
        const val FADED = 0.7
        /** At most this many items in one review; the rest wait for tomorrow. */
        const val REVIEW_MAX = 20

        fun line(counts: Map<MapState, Int>): String {
            val parts = listOfNotNull(
                counts[MapState.MET]?.let { "$it met" }, counts[MapState.RECALL]?.let { "$it can recall" }, counts[MapState.USE]?.let { "$it can use" },
            )
            return if (parts.isEmpty()) "Every topic in the syllabus. Mark one as met when you've studied it." else parts.joinToString(" · ")
        }
    }
}
