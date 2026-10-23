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
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters

/**
 * Staged profiling: what the app knows about you, one question at a time, at a moment it helps.
 * Each field remembers where it came from (you said it, you were asked, or the app guessed) and stays on
 * this phone. Only [SYNCED] (stage, attempts, language, study time) go to the server, to match pods.
 * Chotu's memory notes (max 10, each one approved by you) live here too.
 */
class StagedProfile(context: Context) {
    private val prefs = context.getSharedPreferences("staged", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    @Serializable
    data class Field(val value: String, val source: String, val on: String, val confidence: Double = 1.0)

    data class Question(val key: String, val q: String, val opts: List<Pair<String, String>> = emptyList(), val text: String? = null, val note: String? = null)

    var fields by mutableStateOf(loadFields()); private set
    var notes by mutableStateOf(loadNotes()); private set
    var stamps by mutableStateOf(loadStamps()); private set
    /** A short "New stamp: …" line for the screen to show once. */
    var newStamp by mutableStateOf<String?>(null)

    fun value(key: String): String? = fields[key]?.value

    fun set(key: String, value: String, source: String, confidence: Double = 1.0) {
        // A guess never overwrites something you told us.
        val old = fields[key]
        if (source == "inferred" && old != null && old.source != "inferred") return
        fields = fields + (key to Field(value, source, LocalDate.now().toString(), confidence))
        prefs.edit().putInt("skip:$key", 0).apply()
        saveFields()
    }

    fun delete(key: String) {
        fields = fields - key
        // Deleted means don't ask again for a while.
        prefs.edit().putInt("skip:$key", 2).apply()
        saveFields()
    }

    fun skip(key: String) = prefs.edit().putInt("skip:$key", prefs.getInt("skip:$key", 0) + 1).apply()

    /** Never after two skips; never if already known. */
    fun askable(key: String) = fields[key] == null && prefs.getInt("skip:$key", 0) < 2

    /** The questions for a context, or empty. One ask a day; the pod card asks its three together. */
    fun ask(context: String, quiet: Boolean): List<Question> {
        if (quiet) return emptyList()
        val keys = ASK_IN[context].orEmpty().filter { askable(it) }
        if (keys.isEmpty()) return emptyList()
        if (context == "today" && startedOn().isBefore(LocalDate.now().minusDays(7))) return emptyList()
        // The pod's three matching questions are why pods exist, so they never wait behind the one-a-day limit.
        if (context == "pod") return keys.mapNotNull { QUESTIONS[it] }
        val pick = keys.take(1)
        val stamp = "$context:${pick.joinToString(",")}"
        val askedDay = prefs.getString("askedDay", null)
        if (askedDay == LocalDate.now().toString() && prefs.getString("askedKey", null) != stamp) return emptyList()
        prefs.edit().putString("askedDay", LocalDate.now().toString()).putString("askedKey", stamp).apply()
        return pick.mapNotNull { QUESTIONS[it] }
    }

    /** Chotu's 4-stop tour after onboarding: shown once. "Redo the first-run steps" shows it again. */
    var toured: Boolean
        get() = prefs.getBoolean("toured", false)
        set(v) { prefs.edit().putBoolean("toured", v).apply() }

    /** Chotu's "how's it going?" on the Adda: once a day. Only the date is kept; never the answer. */
    var checkedIn by mutableStateOf(prefs.getString("checkedIn", null) == LocalDate.now().toString()); private set
    fun markCheckedIn() { prefs.edit().putString("checkedIn", LocalDate.now().toString()).apply(); checkedIn = true }

    /** True on the day this phone first used the app. Day one stays simple: no weekly card, no rotating extras. */
    val firstDay: Boolean get() = !startedOn().isBefore(LocalDate.now())

    /**
     * Chotu's day-2 chat on the Adda, never in onboarding: true from day 2 until it's been had. It starts with the
     * ritual picker (W4, ui/NudgeUi.kt). TODO(rework): the rubric and persona questions (how answers are judged,
     * attempt, medium, weakest paper) join the same chat.
     */
    var dayTwoAskDue by mutableStateOf(startedOn().isBefore(LocalDate.now()) && !prefs.getBoolean("dayTwoAsked", false)); private set
    fun markDayTwoAsked() { prefs.edit().putBoolean("dayTwoAsked", true).apply(); dayTwoAskDue = false }

    private fun startedOn(): LocalDate = prefs.getString("startedOn", null)?.let { LocalDate.parse(it) }
        ?: LocalDate.now().also { prefs.edit().putString("startedOn", it.toString()).apply() }

    fun synced(): Map<String, String> = SYNCED.mapNotNull { k -> value(k)?.let { k to it } }.toMap()

    // --- Chotu's memory notes ----------------------------------------------------------------------

    fun addNote(text: String): Boolean {
        val t = text.trim().take(160)
        if (t.isEmpty() || notes.size >= MAX_NOTES || t in notes) return false
        notes = notes + t
        prefs.edit().putString("notes", json.encodeToString(ListSerializer(String.serializer()), notes)).apply()
        return true
    }

    fun removeNote(text: String) {
        notes = notes - text
        prefs.edit().putString("notes", json.encodeToString(ListSerializer(String.serializer()), notes)).apply()
    }

    /** Smarter Chotu: approved notes go with cloud questions. Off by default. */
    var smarterChotu: Boolean
        get() = prefs.getBoolean("smarter", false)
        set(v) { prefs.edit().putBoolean("smarter", v).apply() }

    // --- Stamps (never lost, no counts that shame) --------------------------------------------------

    fun award(id: String) {
        val info = stampInfo(id) ?: return
        if (stamps.containsKey(id)) return
        stamps = stamps + (id to LocalDate.now().toString())
        prefs.edit().putString("stamps", json.encodeToString(MapSerializer(String.serializer(), String.serializer()), stamps)).apply()
        newStamp = "New stamp: ${info.title}"
    }

    /** Stamps that come from what's already on this phone. Checked once per open. */
    fun checkStamps(closedDays: List<LocalDate>, podJoinedOn: LocalDate?) {
        val today = LocalDate.now()
        prefs.getString("lastOpen", null)?.let { if (!LocalDate.parse(it).isAfter(today.minusDays(7))) award("came_back") }
        prefs.edit().putString("lastOpen", today.toString()).apply()
        if (closedDays.isNotEmpty()) award("first_close")
        if (closedDays.map { mondayOf(it) }.toSet().size >= 4) award("rhythm4")
        if (podJoinedOn != null && !podJoinedOn.isAfter(today.minusDays(7))) award("pod_week")
    }

    /** Practice finished: topic scores feed mastery (80%+ on three different days) and the guessed weak/strong subject. */
    fun practiceFinished(byTopic: Map<String, Pair<Int, Int>>) {
        val day = LocalDate.now().toString()
        val log = topicLog().toMutableList()
        byTopic.forEach { (topic, rt) -> if (topic.isNotBlank() && rt.second > 0) log += TopicScore(topic, rt.first * 100 / rt.second, day) }
        val kept = log.takeLast(120)
        prefs.edit().putString("topicLog", json.encodeToString(ListSerializer(TopicScore.serializer()), kept)).apply()
        kept.groupBy { it.topic }.forEach { (topic, xs) ->
            if (xs.filter { it.pct >= 80 }.map { it.day }.toSet().size >= 3) award("mastery:$topic")
        }
        val ranked = kept.groupBy { it.topic }.filterValues { it.size >= 2 }.mapValues { (_, xs) -> xs.map { it.pct }.average() }.entries.sortedBy { it.value }
        if (ranked.size >= 2) {
            set("weak_subject", ranked.first().key, "inferred", 0.6)
            set("strong_subject", ranked.last().key, "inferred", 0.6)
        }
    }

    @Serializable
    private data class TopicScore(val topic: String, val pct: Int, val day: String)

    private fun topicLog(): List<TopicScore> =
        runCatching { json.decodeFromString(ListSerializer(TopicScore.serializer()), prefs.getString("topicLog", "[]")!!) }.getOrDefault(emptyList())

    /** Result-day mode the member switched on for themselves (72 hours). */
    var myResultModeUntil by mutableStateOf(prefs.getLong("resultModeUntil", 0L))
        private set
    fun setMyResultMode(on: Boolean) {
        myResultModeUntil = if (on) System.currentTimeMillis() + 72 * 3_600_000L else 0L
        prefs.edit().putLong("resultModeUntil", myResultModeUntil).apply()
    }
    val myResultMode: Boolean get() = myResultModeUntil > System.currentTimeMillis()

    fun choiceDone(id: String) = prefs.getBoolean("choiceDone:$id", false)
    fun markChoice(id: String) = prefs.edit().putBoolean("choiceDone:$id", true).apply()

    var podJoinedOn: LocalDate?
        get() = prefs.getString("podJoinedOn", null)?.let { LocalDate.parse(it) }
        set(v) { prefs.edit().putString("podJoinedOn", v?.toString()).apply() }

    /** Delete my data. */
    fun forget() {
        prefs.edit().clear().apply()
        fields = emptyMap(); notes = emptyList(); stamps = emptyMap()
    }

    private fun loadFields(): Map<String, Field> = runCatching {
        json.decodeFromString(MapSerializer(String.serializer(), Field.serializer()), prefs.getString("fields", "{}")!!)
    }.getOrDefault(emptyMap())
    private fun saveFields() = prefs.edit().putString("fields", json.encodeToString(MapSerializer(String.serializer(), Field.serializer()), fields)).apply()
    private fun loadNotes(): List<String> =
        runCatching { json.decodeFromString(ListSerializer(String.serializer()), prefs.getString("notes", "[]")!!) }.getOrDefault(emptyList())
    private fun loadStamps(): Map<String, String> =
        runCatching { json.decodeFromString(MapSerializer(String.serializer(), String.serializer()), prefs.getString("stamps", "{}")!!) }.getOrDefault(emptyMap())

    data class StampInfo(val family: String, val title: String, val why: String)

    companion object {
        const val MAX_NOTES = 10
        val SYNCED = listOf("stage", "attempt_band", "lang", "time_band")
        val ASK_IN = mapOf(
            "pod" to listOf("stage", "attempt_band", "time_band"),
            "today" to listOf("target_year", "medium", "working"),
            "compass" to listOf("stop_attempt"),
            "plan" to listOf("main_goal", "hardest_part"),
        )
        private val year = LocalDate.now().year
        val QUESTIONS: Map<String, Question> = listOf(
            Question("stage", "Where are you in the journey?", listOf("starting" to "Just starting", "prelims" to "Preparing for Prelims", "mains" to "Cleared Prelims, on Mains", "interview" to "Interview stage", "repeat" to "Taking another attempt")),
            Question("attempt_band", "How many attempts so far, including this one?", listOf("1" to "This is my first", "2-3" to "2 or 3", "4+" to "4 or more")),
            Question("time_band", "When do you usually study?", listOf("morning" to "Morning", "afternoon" to "Afternoon", "evening" to "Evening", "night" to "Night")),
            Question("target_year", "Which year's exam are you aiming for?", listOf("${year + 1}" to "${year + 1}", "${year + 2}" to "${year + 2}", "${year + 3}" to "${year + 3}", "unsure" to "Not sure yet")),
            Question("medium", "Which medium will you write Mains in?", listOf("english" to "English", "hindi" to "Hindi", "other" to "Another language")),
            Question("working", "Are you working while you prepare?", listOf("no" to "Full-time on prep", "yes" to "Working too", "student" to "Still in college")),
            Question("stop_attempt", "When would you like to look at this again?", listOf("year" to "In a year", "after_next" to "After the next attempt", "undecided" to "Haven't decided"), note = "Only you see this. Nothing here tells you to stop or continue."),
            Question("main_goal", "What do you most want from this year, apart from the result?", text = "For example: finish the GS syllabus once"),
            Question("hardest_part", "What's the hardest part right now?", listOf("consistency" to "Staying consistent", "syllabus" to "Too much syllabus", "money" to "Money", "alone" to "Feeling alone", "family" to "Family pressure", "focus" to "Focus")),
        ).associateBy { it.key }
        val LABEL = mapOf(
            "lang" to "Pod language", "stage" to "Stage", "attempt_band" to "Attempts", "time_band" to "Study time",
            "target_year" to "Target year", "medium" to "Mains medium", "working" to "Working", "optional_subject" to "Optional subject",
            "stop_attempt" to "When to look again", "main_goal" to "This year's goal", "hardest_part" to "Hardest part",
            "weak_subject" to "Subject to work on", "strong_subject" to "Strongest subject",
        )
        val STAMPS = mapOf(
            "first_close" to StampInfo("showing", "First day closed", "You closed a day for the first time."),
            "rhythm4" to StampInfo("showing", "Four-week rhythm", "You closed at least one day in each of four weeks. Not in a row, just there."),
            "came_back" to StampInfo("showing", "Came back", "You came back after a week or more away. That's the hard part."),
            "first_thanks" to StampInfo("helping", "First 🙏", "Someone in your pod thanked you."),
            "welcomed" to StampInfo("helping", "Welcomed someone", "You said hello when someone new joined."),
            "pod_week" to StampInfo("pod", "First pod week", "A full week in a pod."),
            "quiz_night" to StampInfo("pod", "Quiz Night", "You played a Pod Quiz Night."),
            "lead" to StampInfo("roles", "Pod lead", "You lead a pod."),
            // Ritual nudges (data/Rituals.kt): the first time each one is done. Comeback earns "came_back", quiz night "quiz_night".
            "ca_ritual" to StampInfo("showing", "Week in scenes", "You watched the week's current affairs and took its questions."),
            "chai_ritual" to StampInfo("showing", "Morning Chai", "You had Morning Chai at your chai time."),
            "goal_ritual" to StampInfo("showing", "Fresh-week goal", "You set a goal for the week on a Monday."),
            "answer_hour" to StampInfo("showing", "Answer hour", "You wrote an answer on an answer-hour day."),
        )
        val FAMILIES = listOf("showing" to "Showing up", "helping" to "Helping", "pod" to "Pod life", "mastery" to "Mastery", "roles" to "Roles")
        fun stampInfo(id: String): StampInfo? =
            if (id.startsWith("mastery:")) StampInfo("mastery", id.removePrefix("mastery:"), "80% or more in three practice sessions, on three different days.") else STAMPS[id]
        fun mondayOf(d: LocalDate): LocalDate = d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        fun labelOf(key: String, value: String): String =
            QUESTIONS[key]?.opts?.firstOrNull { it.first == value }?.second ?: value
    }
}
