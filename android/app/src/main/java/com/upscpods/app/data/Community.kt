package com.upscpods.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
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

@Serializable
data class PlusStatus(val enabled: Boolean = false, val testMode: Boolean = true, val plan: JsonObject? = null)

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
