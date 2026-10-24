package com.upscpods.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.add
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/** The pod's honest summary from /pods/join, /pods/me and /pods/choose. */
@Serializable
data class PodSummary(
    val podId: String? = null,
    val state: String = "forming",
    val sizeState: String = "forming",
    val humans: Int = 0,
    val capacity: Int = 8,
    /** A forming pod's batch-match Monday (YYYY-MM-DD). */
    val opensOn: String? = null,
    val hasLead: Boolean = false,
) {
    /** "Forming · 2 of 8" etc. Real numbers only. */
    val header: String get() = when (sizeState) {
        "forming" -> "Forming · $humans of $capacity"
        "small" -> "Small pod · $humans of $capacity"
        else -> "Full pod · $humans of $capacity"
    }
}

@Serializable
data class CommonsRoomInfo(val id: String, val name: String = "", val note: String = "", val count: Int? = null)

@Serializable
data class CommonsSummary(val rooms: List<CommonsRoomInfo> = emptyList(), val total: Int? = null, val label: String = "")

@Serializable
data class Season(val title: String = "", val goal: Long = 0, val unit: String = "questions", val endsOn: String = "", val done: Long = 0)

/** One open room (server rooms.ts): real member counts, and unread only in rooms you're in. */
@Serializable
data class RoomInfo(
    val id: String,
    val name: String = "",
    /** "language", "attempt", "goal", "optional" or "region". */
    val group: String = "",
    val note: String = "",
    val members: Int = 0,
    val joined: Boolean = false,
    val unread: Int = 0,
    val lastTs: Long? = null,
    val lastName: String? = null,
    val lastText: String? = null,
    val online: Int = 0,
)

@Serializable
data class RoomsList(val mode: String = "open", val signups: Int = 0, val threshold: Int = 500, val rooms: List<RoomInfo> = emptyList())

/** One room on the room board: the room's shared Quiz Night score. Rooms are ranked, people never. */
@Serializable
data class BoardRoom(val rank: Int = 0, val id: String, val name: String = "", val pct: Int = 0, val answered: Int = 0, val players: Int = 0)

@Serializable
data class RoomBoard(val week: String = "", val minAnswers: Int = 10, val rooms: List<BoardRoom> = emptyList())

@Serializable
data class RubricArea(val band: String = "at", val note: String = "", val fix: String = "")

@Serializable
data class AnswerSkeleton(val intro: String = "", val body: List<String> = emptyList(), val conclusion: String = "")

/** Answer Studio's feedback (server answers.ts). [error] is set instead when it couldn't be given. */
@Serializable
data class AnswerFeedback(
    val wordCount: Int = 0,
    val words: Int = 150,
    val overLimit: Boolean = false,
    val readable: Boolean = true,
    val areas: Map<String, RubricArea> = emptyMap(),
    val skeleton: AnswerSkeleton = AnswerSkeleton(),
    val summary: String = "",
    /** Free reviews left this week; null on Plus. */
    val left: Int? = null,
    val care: Boolean = false,
    val error: String? = null,
)

@Serializable
data class PlusStatus(val enabled: Boolean = false, val testMode: Boolean = true, val plan: JsonObject? = null, val prices: Map<String, PlusPrice> = emptyMap(), val play: PlayInfo? = null) {
    /** The one price on show, a year of Plus, from the server; null when it sent none. */
    fun yearlyInr(): Int? = prices["yearly"]?.inr?.takeIf { it > 0 }
    /** The server's play_billing flag is on and its Play check is set up (server play.ts). An older server says nothing: off. */
    val playReady get() = play?.let { it.on && it.ready } == true
}

@Serializable
data class PlusPrice(val inr: Int = 0, val days: Int = 0)

@Serializable
data class PlayInfo(val on: Boolean = false, val ready: Boolean = false, val productId: String = "")

/**
 * The community parts of the server: pods summary, the Commons, the season, the four matching fields,
 * Plus status and Chotu reports. Every call is best effort: null or false when offline.
 */
class Community(private val server: () -> String, private val memberId: () -> String) {
    /** The pod server address (for the account card's Change password). */
    fun serverUrl(): String = server()
    private val json = Json { ignoreUnknownKeys = true }
    // AuthInterceptor adds the sign-in token to member routes (Auth.kt); public ones (season, Commons list) go without.
    private val http = OkHttpClient.Builder().callTimeout(10, TimeUnit.SECONDS).addInterceptor(AuthInterceptor).build()
    // Reading a handwritten page takes a vision model a while.
    private val slowHttp = http.newBuilder().callTimeout(90, TimeUnit.SECONDS).readTimeout(90, TimeUnit.SECONDS).build()

    suspend fun podMe(): PodSummary? = post("/pods/me", buildJsonObject { put("memberId", memberId()) })
        ?.let { json.decodeFromJsonElement(PodSummary.serializer(), it) }?.takeIf { it.podId != null }

    /** The private stay-or-move answer. Nobody is moved without choosing it. */
    suspend fun choose(stay: Boolean): PodSummary? =
        post("/pods/choose", buildJsonObject { put("memberId", memberId()); put("choice", if (stay) "stay" else "move") })
            ?.let { json.decodeFromJsonElement(PodSummary.serializer(), it) }

    suspend fun commons(): CommonsSummary? = get("/commons")?.let { json.decodeFromJsonElement(CommonsSummary.serializer(), it) }
    suspend fun season(): Season? = get("/season")?.let { json.decodeFromJsonElement(Season.serializer(), it) }

    /** Practice questions answered, added to the one shared season counter. No member id. */
    suspend fun seasonAdd(n: Int) { if (n > 0) post("/season/add", buildJsonObject { put("n", n) }) }

    /** Only the four matching fields ever leave the phone. [clear] empties the server's copy of a deleted field. */
    suspend fun syncProfile(fields: Map<String, String>, clear: List<String> = emptyList()): Boolean =
        post("/members/profile", buildJsonObject {
            put("memberId", memberId())
            StagedProfile.SYNCED.forEach { k -> fields[k]?.let { put(k, it) } }
            putJsonArray("clear") { clear.filter { it in StagedProfile.SYNCED }.forEach { add(it) } }
        }) != null

    suspend fun plusStatus(): PlusStatus? = get("/plus/status?member=${memberId()}")?.let { json.decodeFromJsonElement(PlusStatus.serializer(), it) }

    /** A Google Play purchase (data/PlayBilling.kt): the server checks it with Google and grants the year. "granted", "pending", or null. */
    suspend fun playVerify(purchaseToken: String, productId: String): String? =
        post("/plus/play/verify", buildJsonObject { put("memberId", memberId()); put("purchaseToken", purchaseToken); put("productId", productId) })
            ?.get("status")?.jsonPrimitive?.contentOrNull

    /** Report one Chotu reply: its id, a reason and that reply's text. Never the chat. */
    suspend fun reportChotu(messageId: String, reason: String, text: String): Boolean =
        post("/chotu/report", buildJsonObject { put("messageId", messageId); put("reason", reason); put("text", text.take(2000)) }) != null

    /** "Request your language": a random id made for this (never the member id), the language, and "I'd help". */
    suspend fun requestLanguage(device: String, lang: String, on: Boolean, helper: Boolean): Boolean =
        post("/languages/request", buildJsonObject { put("device", device); put("lang", lang); put("on", on); put("helper", helper) }) != null

    /** Opt-in mock band: only the paper id and the percent, no member id. Null when offline or refused. */
    suspend fun mockBand(mockId: String, pct: Int): MockBand? =
        post("/mocks/band", buildJsonObject { put("mockId", mockId); put("pct", pct) })
            ?.let { json.decodeFromJsonElement(MockBand.serializer(), it) }

    /** With Plus on, a full paper uses the monthly allowance. False only when the server says it's used up. */
    suspend fun useMockAllowance(): Boolean =
        post("/plus/use", buildJsonObject { put("memberId", memberId()); put("kind", "mock") })
            ?.get("ok")?.toString() != "false"

    /** The open rooms, with unread counted from [seen] (room id to the last time this phone opened it, in ms). */
    suspend fun rooms(seen: Map<String, Long>): RoomsList? =
        post("/rooms/list", buildJsonObject { put("memberId", memberId()); put("seen", buildJsonObject { seen.forEach { (k, v) -> put(k, v) } }) })
            ?.let { json.decodeFromJsonElement(RoomsList.serializer(), it) }
    suspend fun joinRoom(id: String): Boolean = post("/rooms/join", buildJsonObject { put("memberId", memberId()); put("roomId", id) }) != null
    suspend fun leaveRoom(id: String): Boolean = post("/rooms/leave", buildJsonObject { put("memberId", memberId()); put("roomId", id) }) != null
    /** This week's room board (Room Quiz Night). */
    suspend fun roomBoard(): RoomBoard? = get("/rooms/leaderboard")?.let { runCatching { json.decodeFromJsonElement(RoomBoard.serializer(), it) }.getOrNull() }

    /**
     * "Send to pod" with the photo: one JPEG to that room or pod, kept 7 days and seen only by its members. The
     * reference to post with the message ("photo:<id>"), or null. Answer Studio's own review never keeps the photo.
     */
    suspend fun sendPhoto(roomId: String, jpeg: ByteArray): String? = withContext(Dispatchers.IO) {
        val body = buildJsonObject {
            put("memberId", memberId()); put("roomId", roomId)
            put("image", buildJsonObject { put("mime", "image/jpeg"); put("data", android.util.Base64.encodeToString(jpeg, android.util.Base64.NO_WRAP)) })
        }
        val base = server()
        if (base.isBlank()) return@withContext null
        runCatching {
            val req = Request.Builder().url("$base/rooms/photo").post(body.toString().toRequestBody("application/json".toMediaType())).build()
            slowHttp.newCall(req).execute().use { r -> if (r.isSuccessful) json.parseToJsonElement(r.body.string()).jsonObject["ref"]?.jsonPrimitive?.contentOrNull else null }
        }.getOrNull()
    }

    /** A photo someone sent to a room you're in. Null once it has gone (after 7 days) or if you're not a member. */
    suspend fun photo(id: String): ByteArray? = withContext(Dispatchers.IO) {
        val base = server()
        if (base.isBlank() || !Regex("[0-9a-f]{32}").matches(id)) return@withContext null
        runCatching {
            http.newCall(Request.Builder().url("$base/rooms/photo/$id?member=${memberId()}").build()).execute().use { r -> if (r.isSuccessful) r.body.bytes() else null }
        }.getOrNull()
    }

    /**
     * Answer Studio: rubric feedback on one answer, typed or as a JPEG of the handwritten sheet. The server reads
     * the photo and doesn't keep it. Error replies (allowance used, offline) come back as [AnswerFeedback.error].
     */
    suspend fun evaluate(question: String, words: Int, text: String?, jpeg: ByteArray?): AnswerFeedback = withContext(Dispatchers.IO) {
        val base = server()
        if (base.isBlank()) return@withContext AnswerFeedback(error = "Answer review needs the pod server. Set it in Me → My Path.")
        val body = buildJsonObject {
            put("memberId", memberId()); put("question", question); put("words", words)
            text?.takeIf { it.isNotBlank() }?.let { put("text", it) }
            jpeg?.let { put("image", buildJsonObject { put("mime", "image/jpeg"); put("data", android.util.Base64.encodeToString(it, android.util.Base64.NO_WRAP)) }) }
        }
        runCatching {
            val req = Request.Builder().url("$base/answers/evaluate").post(body.toString().toRequestBody("application/json".toMediaType())).build()
            slowHttp.newCall(req).execute().use { r ->
                val o = runCatching { json.parseToJsonElement(r.body.string()).jsonObject }.getOrNull()
                when {
                    o == null -> AnswerFeedback(error = "Couldn't review the answer just now. Try again in a minute.")
                    r.isSuccessful -> json.decodeFromJsonElement(AnswerFeedback.serializer(), o)
                    else -> AnswerFeedback(error = (o["error"] as? kotlinx.serialization.json.JsonPrimitive)?.content ?: "Couldn't review the answer just now.")
                }
            }
        }.getOrElse { AnswerFeedback(error = "No connection. Your answer is saved here; try again when you're online.") }
    }

    /** "Delete my data": erases the pod membership, messages, consent record and sign-in account on the server. */
    suspend fun privacyDelete(): Boolean = post("/privacy/delete", buildJsonObject { put("memberId", memberId()) }) != null

    private suspend fun get(path: String): JsonObject? = call(path) { url(it) }
    private suspend fun post(path: String, body: JsonObject): JsonObject? =
        call(path) { url(it).post(body.toString().toRequestBody("application/json".toMediaType())) }

    // The request is built only once a server is set: OkHttp throws on a URL with no scheme.
    private suspend fun call(path: String, build: Request.Builder.(String) -> Request.Builder): JsonObject? = withContext(Dispatchers.IO) {
        val base = server()
        if (base.isBlank()) return@withContext null
        runCatching {
            val req = Request.Builder().build(base + path).build()
            http.newCall(req).execute().use { r -> if (r.isSuccessful) json.parseToJsonElement(r.body.string()).jsonObject else null }
        }.getOrNull()
    }
}
