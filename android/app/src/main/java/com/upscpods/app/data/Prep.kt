package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.decodeFromJsonElement
import java.io.File
import java.time.LocalDate
import java.time.LocalTime

// Prep → Learn and play, long reads and the Plus tools, matching the web app's explore.js: every approved engine
// piece by format and subject, long reads with a reader, and the weekly Chai test, monthly compilation, revise my
// misses and mock insights. Everything the person does stays in files on this phone.

/** A long read in the reader's shape (the server's normalizeRead): sections and recall prompts per language. */
@Serializable
data class LongRead(
    val title: Bi<String> = Bi(""),
    val minutes: Int = 10,
    val topic: String = "",
    val gsPaper: String = "",
    val dek: Map<String, String> = emptyMap(),
    val sections: Map<String, List<ReadSection>> = emptyMap(),
    val recall: Map<String, List<String>> = emptyMap(),
    val sources: JsonElement? = null,
    val review: Review = Review(),
) {
    fun sectionsFor(hindi: Boolean) = (if (hindi) sections["hi"] else null)?.takeIf { it.isNotEmpty() } ?: sections["en"] ?: emptyList()
    fun recallFor(hindi: Boolean) = (if (hindi) recall["hi"] else null)?.takeIf { it.isNotEmpty() } ?: recall["en"] ?: emptyList()
    fun dekFor(hindi: Boolean) = (if (hindi) dek["hi"] else null) ?: dek["en"] ?: ""
    /** Most reads write { en, hi }; a plain string is shown as it is. */
    fun sourceLine(hindi: Boolean): String = when (val s = sources) {
        is JsonObject -> runCatching { ContentLibrary.JSON.decodeFromJsonElement<Bi<String>>(s).pick(hindi) }.getOrDefault("")
        is JsonPrimitive -> s.content
        else -> ""
    }
}

@Serializable
data class ReadSection(val heading: String = "", val body: String = "")

/** One question for the Plus tools: a Chai Exam Corner question, a practice question or a mock question. */
@Serializable
data class PrepQ(val id: String, val topic: String = "", val q: MockMcq, val day: String = "")

/** The ten engine families, in the web's order, with its lead lines. */
val FAMILIES: List<Triple<String, String, String>> = listOf(
    Triple("choose", "Quick questions", "Pick one. A wrong answer gets an explanation, never a buzzer."),
    Triple("reveal", "Flip cards", "Read the front, say it, turn it over."),
    Triple("match", "Match", "Tap one on the left, then its partner."),
    Triple("order", "Put in order", "Tap them in order, then check."),
    Triple("sort", "Sort it", "Each one goes in a bucket."),
    Triple("cloze", "Fill the gap", "Tap a gap, then the word."),
    Triple("compare", "Side by side", "Two things, row by row."),
    Triple("steps", "Step through", "One step at a time. Answer skeletons, stories and dilemmas."),
    Triple("hub", "Link web", "One topic, linked across papers."),
    Triple("picture", "Picture stories", "The Hidden Why: a picture, a pattern, a name for it."),
)

/** Subjects from the id prefix (pol-, geo-, ...), as on the web. */
val SUBJECTS: List<Pair<String, String>> = listOf(
    "pol" to "Polity", "his" to "Modern history", "anc" to "Ancient and medieval", "art" to "Art and culture", "geo" to "Geography",
    "env" to "Environment", "eco" to "Economy", "sci" to "Science and tech", "ir" to "World and India", "sec" to "Internal security", "soc" to "Society", "eth" to "Ethics",
    "mains" to "Answer writing", "ess" to "Essay", "csat" to "CSAT",
)
private val SUBJECT_NAME = SUBJECTS.toMap()
fun subjectName(key: String) = SUBJECT_NAME[key] ?: "More"

class Prep(context: Context) {
    private val dir = File(context.filesDir, "prep").apply { mkdirs() }
    private val missesFile = File(dir, "misses.json")
    private val learntFile = File(dir, "learnt.json")
    private val readFile = File(dir, "read.json")
    private val notesFile = File(dir, "read-notes.json")
    private val prefs = context.getSharedPreferences("prep", Context.MODE_PRIVATE)

    // --- Learn and play ----------------------------------------------------------------------------------

    /** Every approved piece the server shaped for an engine player. */
    fun pieces(library: ContentLibrary): List<Pair<LibraryItem, String>> = library.items.mapNotNull { item ->
        val engine = ((item.data["play"] as? JsonObject)?.get("engine") as? JsonPrimitive)?.content
        engine?.let { item to it }
    }

    /** Questions, cards or steps in a piece, for the tile's "12 questions". */
    fun sizeOf(item: LibraryItem): Int {
        val p = item.data["play"] as? JsonObject ?: return 0
        return listOf("rounds", "items", "pairs", "cards", "beats", "choices", "rows", "spokes", "frames", "answers")
            .firstNotNullOfOrNull { k -> (p[k] as? kotlinx.serialization.json.JsonArray)?.size?.takeIf { it > 0 } } ?: 0
    }

    fun subjectOf(item: LibraryItem): String {
        val id = ((item.data["id"] as? JsonPrimitive)?.content ?: item.id)
        val p = id.substringBefore('-')
        if (p in SUBJECT_NAME) return p
        val title = runCatching { ContentLibrary.JSON.decodeFromJsonElement<Bi<String>>(item.data["title"]!!).en }.getOrDefault("")
        return subjectByWords("$title $id")
    }

    fun learnt(): Map<String, String> = read(learntFile, MAP) ?: emptyMap()
    fun markLearnt(id: String) = write(learntFile, MAP, learnt() + (id to LocalDate.now().toString()))

    var learnFilter: Pair<String, String>
        get() = (prefs.getString("learnSubject", "") ?: "") to (prefs.getString("learnFamily", "") ?: "")
        set(v) { prefs.edit().putString("learnSubject", v.first).putString("learnFamily", v.second).apply() }

    // --- Long reads -------------------------------------------------------------------------------------

    fun reads(library: ContentLibrary): List<Pair<LibraryItem, LongRead>> = library.all("read", LongRead.serializer())
        .filter { it.second.sections["en"]?.isNotEmpty() == true }

    fun readDone(): Map<String, String> = read(readFile, MAP) ?: emptyMap()
    fun markRead(id: String, notes: String) {
        write(readFile, MAP, readDone() + (id to LocalDate.now().toString()))
        write(notesFile, MAP, (read(notesFile, MAP) ?: emptyMap()) + (id to notes))
    }
    fun readNote(id: String): String = read(notesFile, MAP)?.get(id) ?: ""

    var readSize: Int
        get() = prefs.getInt("readSize", 18)
        set(v) { prefs.edit().putInt("readSize", v.coerceIn(14, 28)).apply() }

    // --- The error log: every question got wrong in practice and mocks, until it's got right ---------------

    fun misses(): List<PrepQ> = read(missesFile, LIST) ?: emptyList()
    fun addMiss(q: PrepQ) = write(missesFile, LIST, (misses().filter { it.id != q.id } + q.copy(day = q.day.ifBlank { LocalDate.now().toString() })).takeLast(500))
    fun clearMiss(id: String) { if (misses().any { it.id == id }) write(missesFile, LIST, misses().filter { it.id != id }) }

    /** The weekly test and the monthly compilation: Exam Corner questions from Chai packs of the last [days] days. */
    fun chaiQuestions(briefs: List<Brief>, days: Long): List<PrepQ> {
        val from = LocalDate.now().minusDays(days).toString()
        return briefs.filter { !it.sample && it.date >= from }.sortedBy { it.date }.flatMap { b ->
            b.items.mapNotNull { item -> item.text(false).mcq?.let { PrepQ("card-${item.id}", item.topic, MockMcq(it.question, it.options, it.answerIndex, it.explanation), b.date) } }
        }.distinctBy { it.id }
    }

    // --- Quiet times: no offers in pause, result days, after a distress check, or from 22:30 to 06:00 ----------

    fun markCare() { prefs.edit().putLong("careAt", System.currentTimeMillis()).apply() }
    private fun careRecently() = System.currentTimeMillis() - prefs.getLong("careAt", 0L) < 86_400_000L

    /** Why any mention of Plus stays quiet right now, or null when it may show. */
    fun quiet(paused: Boolean, resultMode: Boolean, now: LocalTime = LocalTime.now()): String? = when {
        paused -> "paused"
        resultMode -> "result"
        careRecently() -> "care"
        !now.isBefore(LocalTime.of(22, 30)) || now.isBefore(LocalTime.of(6, 0)) -> "late"
        else -> null
    }

    fun forget() { dir.listFiles()?.forEach { it.delete() }; prefs.edit().clear().apply() }

    private fun <T> read(f: File, s: KSerializer<T>): T? =
        runCatching { if (f.exists()) JSON.decodeFromString(s, f.readText()) else null }.getOrNull()

    private fun <T> write(f: File, s: KSerializer<T>, v: T) {
        val tmp = File(f.parentFile, f.name + ".tmp")
        tmp.writeText(JSON.encodeToString(s, v))
        if (!tmp.renameTo(f)) { f.delete(); tmp.renameTo(f) }
    }

    companion object {
        private val JSON = Json { ignoreUnknownKeys = true; coerceInputValues = true }
        private val MAP = MapSerializer(String.serializer(), String.serializer())
        private val LIST = ListSerializer(PrepQ.serializer())
    }
}

/**
 * Who gets the Plus tools, from /plus/status as on the web: only a member with a Plus plan, whether or not the admin
 * "plus" flag is on (a plan can be granted from admin). Anyone else gets the preview. Offline counts as no plan.
 * The app never sells Plus or points to where it's sold.
 */
data class PlusGate(val member: Boolean, val loading: Boolean = false) {
    val open get() = member
}

/** A subject key for some words (a title and id), by keyword; "more" when none fits. Shared with Mock Intelligence. */
fun subjectByWords(text: String): String {
    val t = text.lowercase()
    return when {
        Regex("constitution|article|parliament|preamble|governor|president|court|amendment|citizenship|election|schedule|federal|defection|bill").containsMatchIn(t) -> "pol"
        Regex("monsoon|river|cyclone|lake|strait|map|geograph|soil|climate|nino").containsMatchIn(t) -> "geo"
        Regex("mughal|harappa|vedic|maurya|gupta|ancient|medieval").containsMatchIn(t) -> "anc"
        Regex("ethic|dilemma|integrity|virtue").containsMatchIn(t) -> "eth"
        Regex("answer|directive|essay|mains").containsMatchIn(t) -> "mains"
        Regex("scheme|gdp|inflation|bank|tax|economy|budget").containsMatchIn(t) -> "eco"
        Regex("forest|tiger|wildlife|biodiversity|pollution|stubble|environment").containsMatchIn(t) -> "env"
        Regex("1857|congress|gandhi|freedom|reform|british|colonial").containsMatchIn(t) -> "his"
        else -> "more"
    }
}
