package com.upscpods.app.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume

/**
 * Usage counts for the admin Growth page (server/src/metrics.ts): what happened, never what was said. Events carry a
 * random install id and, once signed in, the account's member id (AuthInterceptor adds the token), plus small codes
 * and numbers. No mood, journal or chat text, and no third-party trackers. The Play install referrer is read once,
 * and the server keeps only its utm source, medium and campaign.
 */
object Metrics {
    private lateinit var app: Context
    private val prefs by lazy { app.getSharedPreferences("metrics", Context.MODE_PRIVATE) }
    private val http by lazy { OkHttpClient.Builder().callTimeout(10, TimeUnit.SECONDS).addInterceptor(AuthInterceptor).build() }
    private val io = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var server: () -> String = { "" }
    private var memberId: () -> String? = { null }

    /** The moment waiting for a one-tap rating, shown as a small card at the bottom (ui/Feedback.kt). */
    var pendingRating by mutableStateOf<String?>(null)
        private set

    fun init(context: Context, server: () -> String, memberId: () -> String?) {
        app = context.applicationContext; this.server = server; this.memberId = memberId
    }

    val installId: String
        get() = prefs.getString("installId", null) ?: UUID.randomUUID().toString().replace("-", "").also { prefs.edit().putString("installId", it).apply() }

    private fun today() = LocalDate.now().toString()

    private fun post(path: String, body: JsonObject): Boolean {
        val base = server()
        if (base.isBlank()) return false
        val full = buildJsonObject {
            put("installId", installId); put("platform", "android")
            memberId()?.takeIf { it.isNotBlank() }?.let { put("memberId", it) }
            body.forEach { (k, v) -> put(k, v) }
        }
        return runCatching {
            val req = Request.Builder().url(base + path).post(full.toString().toRequestBody("application/json".toMediaType())).build()
            http.newCall(req).execute().use { it.isSuccessful }
        }.getOrDefault(false)
    }

    /** One event, fire and forget. */
    fun track(name: String, props: JsonObject = JsonObject(emptyMap())) {
        if (!::app.isInitialized) return
        io.launch { post("/events", buildJsonObject { put("events", buildJsonArray { add(buildJsonObject { put("name", name); put("props", props) }) }) }) }
    }

    /** first_open once per install (with the Play referrer), and app_open once a day. */
    fun boot() {
        if (!::app.isInitialized) return
        io.launch {
            if (!prefs.getBoolean("firstOpenSent", false)) {
                val ref = readReferrer()
                val ok = post("/events", buildJsonObject {
                    put("events", buildJsonArray { add(buildJsonObject { put("name", "first_open"); put("props", buildJsonObject { ref?.let { put("referrer", it) } }) }) })
                })
                if (ok) prefs.edit().putBoolean("firstOpenSent", true).putString("firstOpenDay", today()).apply()
            }
            if (prefs.getString("lastOpen", null) != today()) {
                prefs.edit().putString("lastOpen", today()).apply()
                track("app_open")
            }
        }
    }

    private suspend fun readReferrer(): String? = withTimeoutOrNull(5_000) {
        suspendCancellableCoroutine { cont ->
            val client = runCatching { InstallReferrerClient.newBuilder(app).build() }.getOrNull()
            if (client == null) { cont.resume(null); return@suspendCancellableCoroutine }
            runCatching {
                client.startConnection(object : InstallReferrerStateListener {
                    override fun onInstallReferrerSetupFinished(code: Int) {
                        val ref = if (code == InstallReferrerClient.InstallReferrerResponse.OK) runCatching { client.installReferrer.installReferrer }.getOrNull() else null
                        runCatching { client.endConnection() }
                        if (cont.isActive) cont.resume(ref)
                    }
                    override fun onInstallReferrerServiceDisconnected() { if (cont.isActive) cont.resume(null) }
                })
            }.onFailure { if (cont.isActive) cont.resume(null) }
        }
    }

    /** A ritual counted at most once a day per kind. */
    fun ritualOnce(kind: String) {
        if (!::app.isInitialized || prefs.getString("r:$kind", null) == today()) return
        prefs.edit().putString("r:$kind", today()).apply()
        track("ritual", buildJsonObject { put("kind", kind) })
    }
    fun prepMinutes(minutes: Int) { if (minutes >= 1) track("prep_minutes", buildJsonObject { put("minutes", minutes) }) }
    fun chaiRead(cards: Int) = track("chai_read", buildJsonObject { put("cards", cards) })

    // --- One-tap rating: at most one a day, each moment at most once a fortnight ----------------------------

    val RATING_QUESTIONS = mapOf(
        "pod_joined" to "How was joining your pod?", "close_day" to "How did closing the day feel?", "chotu_chat" to "Was Chotu helpful?",
        "quiz" to "How was the quiz?", "roadmap" to "Is this roadmap useful?", "chai" to "How was today's Chai?",
    )

    private fun wantsRating(moment: String): Boolean {
        if (moment !in RATING_QUESTIONS || prefs.getString("lastRatingDay", null) == today()) return false
        val last = prefs.getString("rated:$moment", null) ?: return true
        return runCatching { ChronoUnit.DAYS.between(LocalDate.parse(last), LocalDate.now()) >= 14 }.getOrDefault(true)
    }

    /** Ask for a rating after a key moment, if it's due. */
    fun rateAfter(moment: String) { if (::app.isInitialized && pendingRating == null && wantsRating(moment)) pendingRating = moment }
    /** The same, a little later (joining a pod: ask once they've looked around). */
    fun rateLater(moment: String, millis: Long) { io.launch { delay(millis); withContext(Dispatchers.Main) { rateAfter(moment) } } }

    private fun markRated(moment: String) { prefs.edit().putString("lastRatingDay", today()).putString("rated:$moment", today()).apply() }

    fun sendRating(moment: String, rating: Int) {
        markRated(moment) // the sheet thanks them, then clears itself (dismissRating)
        io.launch { post("/feedback", buildJsonObject { put("moment", moment); put("rating", rating) }) }
    }
    fun dismissRating() { pendingRating?.let { markRated(it) }; pendingRating = null }

    // --- Day-7 check-in ---------------------------------------------------------------------------------------

    val CHECKIN_Q1 = "How useful has Aspiran been in your first week?" to listOf("Very useful", "Somewhat", "Not yet")
    val CHECKIN_Q2 = "What would help you most next?" to listOf("A livelier pod", "More practice questions", "A study plan", "Better Chotu answers", "Something else")

    /** From day 7 after the first open, until answered or put away. */
    fun checkinDue(): Boolean {
        if (!::app.isInitialized || prefs.getString("checkin", null) != null) return false
        val first = prefs.getString("firstOpenDay", null) ?: prefs.getString("lastOpen", null) ?: return false
        return runCatching { ChronoUnit.DAYS.between(LocalDate.parse(first), LocalDate.now()) >= 7 }.getOrDefault(false)
    }
    fun sendCheckin(q1: Int, q2: Int) {
        prefs.edit().putString("checkin", "answered").apply()
        io.launch { post("/feedback", buildJsonObject { put("kind", "checkin"); put("q1", q1); put("q2", q2) }) }
    }
    fun dismissCheckin() { prefs.edit().putString("checkin", "dismissed").apply() }

    /** "Delete my data": a new install id from here on, and nothing remembered. */
    fun forget() { if (::app.isInitialized) prefs.edit().clear().apply(); pendingRating = null }
}
