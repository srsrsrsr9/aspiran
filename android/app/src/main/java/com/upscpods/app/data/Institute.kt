package com.upscpods.app.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

// Aspiran for coaching centres, the student side (server/src/institutes.ts; the web copy is server/public/app/institute.js).
// Behind the server's `institutes` flag, off by default. A student joins with a code or an invite link from their centre,
// then sees its name, colour and logo, its announcements and batch chat, their doubts, its study plan, its notes and
// question sets, and their own progress. Never anyone else's numbers. No timers, streaks or scores to compare. Messages
// and doubts that look like distress are never posted: the server holds them and Aspiran's care team is told, not the centre.

@Serializable
data class InstBrand(val id: String = "", val name: String = "", val city: String? = null, val color: String? = null, val logo: String? = null, val aiFirstAnswer: Boolean = false)

@Serializable
data class InstBatch(val id: String = "", val name: String = "")

/**
 * GET /inst/me. [features] is the centre's own switches (chat, doubts, plans, content), when the server sends them; a
 * feature it doesn't name counts as on.
 */
@Serializable
data class InstMe(
    val institute: InstBrand? = null,
    val paused: Boolean = false,
    val role: String = "student",
    val displayName: String = "",
    val batch: InstBatch? = null,
    val joinedAt: String? = null,
    val features: Map<String, Boolean> = emptyMap(),
) {
    fun on(feature: String) = features[feature] != false
}

/** GET /inst/invite/<code>, before sign-in: which centre and batch a live code is for. */
@Serializable
data class InvitePreview(val code: String = "", val role: String = "student", val institute: InstBrand = InstBrand(), val batch: InstBatch? = null)

@Serializable
data class InstPost(val id: String = "", val name: String = "", val role: String = "", val text: String = "", val at: String = "", val mine: Boolean = false)

@Serializable
data class InstFeed(val batch: InstBatch? = null, val announcements: List<InstPost> = emptyList(), val messages: List<InstPost> = emptyList())

@Serializable
data class InstPlanItem(val id: String, val day: String, val kind: String = "", val nodeId: String? = null, val topic: String? = null,
                        val contentId: String? = null, val title: String = "", val note: String? = null, val done: Boolean = false)

@Serializable
data class InstPlan(val id: String, val title: String = "", val startsOn: String? = null, val forYou: Boolean = false, val items: List<InstPlanItem> = emptyList())

@Serializable
data class InstPlans(val plans: List<InstPlan> = emptyList(), val today: String = "")

@Serializable
data class InstDoubt(val id: String, val topic: String? = null, val text: String = "", val photo: Boolean = false, val status: String = "open",
                     val createdAt: String? = null, val updatedAt: String? = null)

@Serializable
data class InstContentRow(val id: String, val kind: String = "note", val title: String = "", val topic: String? = null, val questions: Int? = null, val attempts: Int = 0)

@Serializable
data class InstReviewItem(val q: Int = 0, val chosen: Int? = null, val right: Boolean = false, val answerIndex: Int = 0, val explanation: String? = null, val hiExplanation: String? = null)

@Serializable
data class InstTaken(val right: Int = 0, val total: Int = 0, val review: List<InstReviewItem> = emptyList())

@Serializable
data class InstResult(val right: Int = 0, val total: Int = 0, val review: List<InstReviewItem> = emptyList())

@Serializable
data class InstQ(val question: String = "", val options: List<String> = emptyList())

/** A centre's piece: a note ({en: {body}, hi: {body}}) or a set of questions (no answers until answered). */
@Serializable
data class InstPiece(val id: String, val kind: String = "note", val title: String = "", val topic: String? = null, val data: JsonObject = JsonObject(emptyMap()), val taken: InstTaken? = null) {
    private fun side(o: JsonElement?, hi: Boolean): JsonObject? = (o as? JsonObject)?.let { if (hi) it["hi"] as? JsonObject else it["en"] as? JsonObject }
    fun body(hindi: Boolean): String {
        fun b(hi: Boolean) = (side(data, hi)?.get("body") as? JsonPrimitive)?.contentOrNull
        return (if (hindi) b(true) else null) ?: b(false) ?: ""
    }
    /** The questions, in Hindi where the centre gave Hindi and the reader wants it. */
    fun questions(hindi: Boolean): List<InstQ> = ((data["questions"] as? JsonArray) ?: JsonArray(emptyList())).map { q ->
        val s = (if (hindi) side(q, true) else null) ?: side(q, false)
        InstQ((s?.get("question") as? JsonPrimitive)?.contentOrNull.orEmpty(), (s?.get("options") as? JsonArray)?.map { it.jsonPrimitive.content }.orEmpty())
    }
}

@Serializable
data class InstWeak(val topic: String = "", val answered: Int = 0, val pct: Int = 0)

@Serializable
data class InstProgress(val daysActive14: Int = 0, val focusMinutes: Int = 0, val answered: Int = 0, val accuracy: Int? = null, val planDone: Int = 0, val planDue: Int = 0,
                        val doubtsRaised: Int = 0, val doubtsResolved: Int = 0, val weakTopics: List<InstWeak> = emptyList())

/** The server held a message or doubt (it looked like distress): nothing was posted; show [message] and the helplines. */
class InstHeld(message: String) : Exception(message)

/** An error sentence written by our server for people to read, or our own when the server couldn't be reached. */
class InstError(message: String, val status: Int = 0) : Exception(message)

class Institute(context: Context, private val server: () -> String) {
    private val prefs = context.getSharedPreferences("institute", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false; coerceInputValues = true }
    // AuthInterceptor adds the sign-in token to the member routes (Auth.kt); the invite preview and logos go without.
    private val http = OkHttpClient.Builder().callTimeout(20, TimeUnit.SECONDS).addInterceptor(AuthInterceptor).build()

    /** Who I am in my centre (kept on the phone so the brand shows offline). Null when not in one. */
    var me by mutableStateOf<InstMe?>(prefs.getString("me", null)?.let { s -> runCatching { json.decodeFromString<InstMe>(s) }.getOrNull() }); private set

    /** An invite link or code waiting to be used: kept 7 days, so it survives sign-in and the first run. */
    var pending by mutableStateOf(prefs.getString("pending", null)?.takeIf { System.currentTimeMillis() - prefs.getLong("pendingAt", 0) < 7 * 86_400_000L }); private set

    fun remember(code: String) {
        val c = cleanCode(code)
        if (c.length != 8 || c == pending) return
        pending = c
        prefs.edit().putString("pending", c).putLong("pendingAt", System.currentTimeMillis()).apply()
    }
    fun clearPending() { pending = null; prefs.edit().remove("pending").remove("pendingAt").apply() }

    fun url(path: String) = server().trimEnd('/') + path

    private fun call(path: String, body: JsonObject? = null): JsonElement {
        val b = Request.Builder().url(url(path))
        if (body != null) b.post(body.toString().toRequestBody("application/json".toMediaType()))
        val r = try { http.newCall(b.build()).execute() } catch (e: Exception) { throw InstError("Couldn't reach your centre. Check your connection and try again.") }
        r.use {
            val text = it.body.string()
            val d = runCatching { json.parseToJsonElement(text) }.getOrNull()
            val o = d as? JsonObject
            if (!it.isSuccessful) throw InstError((o?.get("error") as? JsonPrimitive)?.contentOrNull ?: "Couldn't reach your centre. Try again.", it.code)
            if ((o?.get("held") as? JsonPrimitive)?.contentOrNull == "true") {
                val msg = ((o["care"] as? JsonObject)?.get("message") as? JsonPrimitive)?.contentOrNull
                throw InstHeld(msg ?: "This wasn't posted. You matter more than any exam. Aspiran's care team has been told and will reach out. If you're in danger right now, call 112.")
            }
            return d ?: JsonNull
        }
    }
    private inline fun <reified T> get(path: String): T = json.decodeFromJsonElement(call(path))
    private inline fun <reified T> post(path: String, body: JsonObject): T = json.decodeFromJsonElement(call(path, body))

    /** Reloads who I am in my centre. Keeps the last answer when offline. */
    suspend fun refresh(): InstMe? = withContext(Dispatchers.IO) {
        runCatching { get<InstMe>("/inst/me") }.onSuccess { m ->
            val next = m.takeIf { it.institute != null }
            me = next
            prefs.edit().apply { if (next == null) remove("me") else putString("me", json.encodeToString(InstMe.serializer(), next)) }.apply()
        }
        me
    }

    /** Which centre a code is for. Null when it couldn't be checked; throws [InstError] (404) when the code is dead. */
    suspend fun preview(code: String): InvitePreview? = withContext(Dispatchers.IO) {
        val c = cleanCode(code)
        if (c.length != 8) return@withContext null
        try { get<InvitePreview>("/inst/invite/$c") } catch (e: InstError) { if (e.status == 404) throw e else null }
    }

    suspend fun join(code: String, name: String, consent: Boolean): InstBrand = withContext(Dispatchers.IO) {
        // Everyone with an Aspiran profile said they're 18 or older on the first-run consent screen.
        val d = call("/inst/join", buildJsonObject { put("code", cleanCode(code)); put("displayName", name.trim()); put("consent", consent); put("adult", true) }) as JsonObject
        clearPending()
        refresh()
        json.decodeFromJsonElement(d["institute"] ?: JsonObject(emptyMap()))
    }

    suspend fun leave() = withContext(Dispatchers.IO) {
        call("/inst/leave", JsonObject(emptyMap()))
        me = null
        prefs.edit().remove("me").apply()
    }

    suspend fun plan(): InstPlans = withContext(Dispatchers.IO) { get("/inst/plan") }
    suspend fun tick(itemId: String, done: Boolean) = withContext(Dispatchers.IO) { call("/inst/plan/done", buildJsonObject { put("itemId", itemId); put("done", done) }) }

    suspend fun feed(after: String?): InstFeed = withContext(Dispatchers.IO) {
        get("/inst/feed" + (after?.let { "?after=" + java.net.URLEncoder.encode(it, "UTF-8") } ?: ""))
    }
    suspend fun send(text: String) = withContext(Dispatchers.IO) { call("/inst/chat", buildJsonObject { put("text", text.trim()) }) }
    suspend fun report(id: String, reason: String) = withContext(Dispatchers.IO) { call("/inst/chat/report", buildJsonObject { put("id", id); put("reason", reason.trim()) }) }

    @Serializable private data class Doubts(val doubts: List<InstDoubt> = emptyList())
    @Serializable private data class Replies(val replies: List<InstPost> = emptyList())
    @Serializable private data class Contents(val items: List<InstContentRow> = emptyList())
    @Serializable private data class Prog(val you: InstProgress = InstProgress())

    suspend fun doubts(): List<InstDoubt> = withContext(Dispatchers.IO) { get<Doubts>("/inst/doubts").doubts }
    /** Sends a doubt; [jpeg] is an already-shrunk JPEG. True when the centre's quick first answer came back. */
    suspend fun ask(text: String, nodeId: String?, jpeg: ByteArray?): Boolean = withContext(Dispatchers.IO) {
        val d = call("/inst/doubts", buildJsonObject {
            put("text", text.trim())
            nodeId?.let { put("nodeId", it) }
            jpeg?.let { put("photo", buildJsonObject { put("mime", "image/jpeg"); put("data", android.util.Base64.encodeToString(it, android.util.Base64.NO_WRAP)) }) }
        }) as JsonObject
        (d["aiAnswered"] as? JsonPrimitive)?.contentOrNull == "true"
    }
    suspend fun replies(id: String): List<InstPost> = withContext(Dispatchers.IO) { get<Replies>("/inst/doubts/$id").replies }
    suspend fun reply(id: String, text: String) = withContext(Dispatchers.IO) { call("/inst/doubts/$id/reply", buildJsonObject { put("text", text.trim()) }) }
    suspend fun resolve(id: String) = withContext(Dispatchers.IO) { call("/inst/doubts/$id/status", buildJsonObject { put("status", "resolved") }) }
    /** The doubt's photo (the student's own), never cached on disk. */
    suspend fun photo(id: String): ByteArray? = withContext(Dispatchers.IO) { bytes("/inst/doubts/$id/photo") }

    suspend fun content(): List<InstContentRow> = withContext(Dispatchers.IO) { get<Contents>("/inst/content").items }
    suspend fun piece(id: String): InstPiece = withContext(Dispatchers.IO) { get("/inst/content/$id") }
    suspend fun attempt(id: String, answers: List<Int?>): InstResult = withContext(Dispatchers.IO) {
        post("/inst/attempts", buildJsonObject { put("contentId", id); put("answers", JsonArray(answers.map { a -> a?.let { JsonPrimitive(it) } ?: JsonNull })) })
    }
    suspend fun progress(): InstProgress = withContext(Dispatchers.IO) { get<Prog>("/inst/progress").you }

    /** A logo (public) or a doubt's photo (member route), as bytes. */
    suspend fun bytes(path: String): ByteArray? = withContext(Dispatchers.IO) {
        runCatching { http.newCall(Request.Builder().url(url(path)).build()).execute().use { r -> if (r.isSuccessful) r.body.bytes() else null } }.getOrNull()
    }

    companion object {
        /** The 8-letter code from a code typed with or without its dash, or from a whole invite link (…#inst/KXR7M2PD). */
        fun cleanCode(raw: String): String {
            val s = raw.trim()
            val fromLink = Regex("(?:#inst/|#join=|[?&]code=)([A-Za-z0-9-]{8,9})").find(s)?.groupValues?.get(1)
            return (fromLink ?: s).uppercase().replace(Regex("[^A-Z0-9]"), "")
        }
        fun showCode(c: String) = if (c.length > 4) c.substring(0, 4) + "-" + c.substring(4) else c

        /** Black or white text on the centre's colour, whichever reads better (same rule as the web). */
        fun inkOn(hex: String?): Long? {
            if (hex == null || !Regex("^#[0-9a-fA-F]{6}$").matches(hex)) return null
            val (r, g, b) = listOf(1, 3, 5).map { i -> hex.substring(i, i + 2).toInt(16) / 255.0 }.map { c -> if (c <= 0.03928) c / 12.92 else Math.pow((c + 0.055) / 1.055, 2.4) }
            return if (0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4) 0xFF1A1410 else 0xFFFFFFFF
        }
        fun colorOf(hex: String?): Long? = hex?.takeIf { Regex("^#[0-9a-fA-F]{6}$").matches(it) }?.let { 0xFF000000 or it.substring(1).toLong(16) }

        /** The syllabus topic ids the server knows ("gs2-1", "pre-3"), for the doubt's optional topic. Common papers only. */
        fun topics(): List<Pair<String, String>> = SYLLABUS.filter { it.forOptional == null }.flatMap { p ->
            p.topics.mapIndexed { i, t -> "${if (p.id == "prelims") "pre" else p.id}-${i + 1}" to "${p.short} · ${t.name}" }
        }
    }
}
