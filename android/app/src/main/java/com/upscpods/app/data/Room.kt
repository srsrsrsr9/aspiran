package com.upscpods.app.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import java.time.LocalDate

@Serializable data class SleepEntry(val hours: Int? = null, val felt: String? = null)
@Serializable data class RoomNote(val id: String, val at: String, val text: String, val node: String? = null)
@Serializable data class RoomTodo(val id: String, val text: String, val done: Boolean = false, val node: String? = null, val offered: Boolean = false)

/** Every syllabus topic as (node id, name), with the same ids as the web app's map ("pre-1", "gs2-2" …). */
val SYLLABUS_NODES: List<Pair<String, String>> = SYLLABUS.flatMap { p -> p.topics.mapIndexed { i, t -> "${if (p.id == "prelims") "pre" else p.id}-${i + 1}" to t.name } }

/**
 * Your room (teaching plan, step 4): sleep, notes, to-dos, and right/total answers per day for the private sleep view.
 * All on this phone: nothing goes to the pod, to marketing or to an AI, and nothing is scored. The web copy is viewRoom
 * in app.js; the journal stays where it is (My Path).
 */
class RoomStore(context: Context) {
    private val prefs = context.getSharedPreferences("room", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val sleepSer = MapSerializer(String.serializer(), SleepEntry.serializer())
    private val rightSer = MapSerializer(String.serializer(), ListSerializer(Int.serializer()))

    var sleep by mutableStateOf(read("sleep", sleepSer, emptyMap())); private set
    var notes by mutableStateOf(read("notes", ListSerializer(RoomNote.serializer()), emptyList())); private set
    var todos by mutableStateOf(read("todos", ListSerializer(RoomTodo.serializer()), emptyList())); private set
    private var rightDays = read("rightDays", rightSer, emptyMap())

    private fun <T> read(key: String, ser: kotlinx.serialization.KSerializer<T>, empty: T): T =
        prefs.getString(key, null)?.let { runCatching { json.decodeFromString(ser, it) }.getOrNull() } ?: empty
    private fun <T> write(key: String, ser: kotlinx.serialization.KSerializer<T>, v: T) = prefs.edit().putString(key, json.encodeToString(ser, v)).apply()
    private fun newId() = System.currentTimeMillis().toString(36)

    fun setSleep(hours: Int? = null, felt: String? = null) {
        val day = LocalDate.now().toString()
        val cur = sleep[day] ?: SleepEntry()
        sleep = (sleep + (day to cur.copy(hours = hours ?: cur.hours, felt = felt ?: cur.felt))).toSortedMap().entries.toList().takeLast(400).associate { it.key to it.value }
        write("sleep", sleepSer, sleep)
    }

    fun addNote(text: String, node: String?) {
        notes = (notes + RoomNote(newId(), LocalDate.now().toString(), text.take(4000), node)).takeLast(1000)
        write("notes", ListSerializer(RoomNote.serializer()), notes)
    }
    fun deleteNote(id: String) { notes = notes.filterNot { it.id == id }; write("notes", ListSerializer(RoomNote.serializer()), notes) }
    fun notesFor(node: String): List<String> = notes.filter { it.node == node }.takeLast(5).map { it.text }

    fun addTodo(text: String) { todos = (todos + RoomTodo(newId(), text.take(160))).takeLast(300); saveTodos() }
    fun updateTodo(id: String, f: (RoomTodo) -> RoomTodo) { todos = todos.map { if (it.id == id) f(it) else it }; saveTodos() }
    fun deleteTodo(id: String) { todos = todos.filterNot { it.id == id }; saveTodos() }
    private fun saveTodos() = write("todos", ListSerializer(RoomTodo.serializer()), todos)

    /** One answer or topic check, right or not. Kept 120 days, only for [sleepView]. */
    fun logRight(ok: Boolean) {
        val day = LocalDate.now().toString()
        val (r, t) = rightDays[day]?.let { it[0] to it[1] } ?: (0 to 0)
        rightDays = (rightDays + (day to listOf(r + if (ok) 1 else 0, t + 1))).toSortedMap().entries.toList().takeLast(120).associate { it.key to it.value }
        write("rightDays", rightSer, rightDays)
    }

    /** After three weeks of mornings: your own accuracy after short nights and long ones, or why it isn't shown yet. */
    fun sleepView(): String {
        if (sleep.size < 21) return "After three weeks of mornings (${sleep.size} so far), this shows your own review accuracy after short and long nights. Only you see it."
        fun sum(test: (Int) -> Boolean) = sleep.filter { (d, e) -> e.hours != null && test(e.hours) && (rightDays[d]?.get(1) ?: 0) >= 3 }.keys
            .fold(Triple(0, 0, 0)) { a, d -> Triple(a.first + rightDays[d]!![0], a.second + rightDays[d]!![1], a.third + 1) }
        val short = sum { it <= 5 }; val long = sum { it >= 7 }
        if (short.third < 5 || long.third < 5) return "Not enough days yet on both sides (5 or more after short nights and after long ones, with some review done) to compare."
        return "Your answers on days after under 6 hours: ${100 * short.first / short.second}% right. After 7 or more: ${100 * long.first / long.second}%. Your own data, over ${short.third + long.third} days."
    }

    /** A to-do that names a syllabus topic, offered once as a link. Same words rule as nodeMatch in app.js. */
    fun topicFor(text: String): Pair<String, String>? {
        val skip = setOf("revise", "revision", "chapter", "notes", "today", "finish", "write", "about", "practice")
        val words = Regex("[a-z]{5,}").findAll(text.lowercase()).map { it.value }.filter { it !in skip }.toList()
        return if (words.isEmpty()) null else SYLLABUS_NODES.firstOrNull { (_, name) -> words.any { name.lowercase().contains(it) } }
    }

    /** Plain text for the share sheet: sleep, notes and to-dos. */
    fun export(): String = buildString {
        appendLine("Your room, exported ${LocalDate.now()}"); appendLine()
        appendLine("SLEEP"); sleep.forEach { (d, e) -> appendLine("$d: ${e.hours?.let { "about $it h" } ?: "-"}${e.felt?.let { ", $it" } ?: ""}") }; appendLine()
        appendLine("NOTES"); notes.forEach { n -> appendLine("${n.at}${n.node?.let { id -> " · " + (SYLLABUS_NODES.firstOrNull { it.first == id }?.second ?: id) } ?: ""}"); appendLine(n.text); appendLine() }
        appendLine("TO-DOS"); todos.forEach { appendLine("${if (it.done) "[x]" else "[ ]"} ${it.text}") }
    }
}
