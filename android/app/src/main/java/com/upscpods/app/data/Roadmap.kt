package com.upscpods.app.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import java.util.concurrent.TimeUnit

/**
 * The free roadmap builder (server/src/roadmap.ts): the goal form goes to the server, the roadmap comes back and is
 * kept on this phone; the server stores nothing. The weekly plan is rebuilt each Monday from last week's focus
 * minutes and the subjects and units ticked off here.
 */
@Serializable data class RoadmapGoal(
    val examYear: Int, val attempt: Int = 1, val optional: String = "", val hoursPerDay: Double = 6.0,
    val working: Boolean = false, val weakPapers: List<String> = emptyList(),
)
@Serializable data class RoadmapPhase(val id: String, val name: String, val from: String, val to: String, val weeks: Int, val focus: String)
@Serializable data class RoadmapSubject(val id: String, val name: String, val paper: String, val hours: Int, val weeks: Int)
@Serializable data class RoadmapUnit(val name: String, val hours: Int, val sources: String, val check: String)
@Serializable data class RoadmapMilestone(val title: String, val by: String, val check: String)
@Serializable data class RoadmapSplit(val gs: Int, val optional: Int, val answers: Int, val current: Int, val tests: Int)
@Serializable data class RoadmapPlan(
    val goal: RoadmapGoal, val prelims: String, val weeksLeft: Int, val studyDays: Int, val hoursPerWeek: Int,
    val split: RoadmapSplit, val phases: List<RoadmapPhase>, val order: List<RoadmapSubject>,
    val milestones: List<RoadmapMilestone>, val polity: List<RoadmapUnit>, val notes: List<String>, val tooShort: Boolean = false,
)
@Serializable data class WeekBlock(val minutes: Int, val what: String)
@Serializable data class WeekDay(val day: String, val blocks: List<WeekBlock>)
@Serializable data class RoadmapWeek(val week: String, val phase: String, val targetHours: Int, val smaller: Boolean, val days: List<WeekDay>, val line: String, val weekOf: String = "")

val PAPER_CHOICES = listOf("GS1", "GS2", "GS3", "GS4", "Essay", "CSAT", "Optional")

class RoadmapStore(context: Context, private val server: () -> String) {
    private val app = context.applicationContext
    private val prefs = app.getSharedPreferences("roadmap", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val http = OkHttpClient.Builder().callTimeout(15, TimeUnit.SECONDS).build()

    val plan: RoadmapPlan? get() = prefs.getString("plan", null)?.let { runCatching { json.decodeFromString<RoadmapPlan>(it) }.getOrNull() }
    val week: RoadmapWeek? get() = prefs.getString("week", null)?.let { runCatching { json.decodeFromString<RoadmapWeek>(it) }.getOrNull() }
    val unitsDone: Set<String> get() = prefs.getStringSet("units", emptySet())!!.toSet()
    val subjectsDone: Set<String> get() = prefs.getStringSet("subjects", emptySet())!!.toSet()

    fun toggleUnit(name: String) = toggle("units", name)
    fun toggleSubject(id: String) = toggle("subjects", id)
    private fun toggle(key: String, v: String) {
        val cur = prefs.getStringSet(key, emptySet())!!.toMutableSet()
        if (!cur.remove(v)) cur.add(v)
        prefs.edit().putStringSet(key, cur).apply()
    }

    private fun post(path: String, body: String): Pair<Int, String>? = runCatching {
        val base = server().trimEnd('/')
        if (base.isBlank()) return null
        val req = Request.Builder().url(base + path).post(body.toRequestBody("application/json".toMediaType())).build()
        http.newCall(req).execute().use { it.code to (it.body?.string() ?: "") }
    }.getOrNull()

    /** Builds the roadmap. Returns null when it worked, or a line to show. */
    suspend fun build(goal: RoadmapGoal): String? = withContext(Dispatchers.IO) {
        val (code, text) = post("/roadmap", buildJsonObject { put("goal", json.encodeToJsonElement(RoadmapGoal.serializer(), goal)) }.toString())
            ?: return@withContext "You're offline. Try again when you're connected."
        if (code != 200) return@withContext runCatching { json.parseToJsonElement(text).let { (it as kotlinx.serialization.json.JsonObject)["error"]?.toString()?.trim('"') } }.getOrNull() ?: "Couldn't build it just now. Try again."
        val plan = runCatching { json.decodeFromString<RoadmapPlan>(text) }.getOrNull() ?: return@withContext "Couldn't read the roadmap. Try again."
        prefs.edit().putString("plan", json.encodeToString(plan)).remove("week").apply()
        Metrics.track("roadmap_built")
        null
    }

    /** This week's plan, rebuilt on the first open of each week (or when asked). */
    suspend fun refreshWeek(force: Boolean = false): RoadmapWeek? = withContext(Dispatchers.IO) {
        val p = plan ?: return@withContext null
        val monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        week?.takeIf { !force && it.weekOf == monday.toString() }?.let { return@withContext it }
        val lastMinutes = (1..7).sumOf { Focus.focusedMinutes(app, monday.minusDays(it.toLong())) }
        val body = buildJsonObject {
            put("goal", json.encodeToJsonElement(RoadmapGoal.serializer(), p.goal))
            put("done", buildJsonObject {
                put("hours", lastMinutes / 60.0)
                put("unitsDone", buildJsonArray { unitsDone.forEach { add(kotlinx.serialization.json.JsonPrimitive(it)) } })
                put("subjectsDone", buildJsonArray { subjectsDone.forEach { add(kotlinx.serialization.json.JsonPrimitive(it)) } })
            })
        }
        val (code, text) = post("/roadmap/week", body.toString()) ?: return@withContext week
        if (code != 200) return@withContext week
        val w = runCatching { json.decodeFromString<RoadmapWeek>(text).copy(weekOf = monday.toString()) }.getOrNull() ?: return@withContext week
        prefs.edit().putString("week", json.encodeToString(w)).apply()
        w
    }

    fun forget() = prefs.edit().clear().apply()
}
