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
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import com.upscpods.app.BuildConfig
import kotlinx.serialization.json.JsonPrimitive
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
        startAnalytics()
        flushPending()
    }

    // --- PostHog (owner, 12 Nov 2026): the same event names, which screen was opened, and crashes, under the random
    // member id (never a name or an email). No session replay on Android, and the screens where people talk or write
    // about themselves are never named. Me → Privacy → Usage analytics switches it off on this phone.
    private var analytics = false
    private var lastScreen: String? = null
    private val PRIVATE = setOf("ADDA", "POD", "MASCOT", "ME", "CLOSE_DAY", "LAMP", "SHOULDERS", "TOOL")

    var analyticsOn: Boolean
        get() = ::app.isInitialized && prefs.getBoolean("analytics", true)
        set(on) {
            prefs.edit().putBoolean("analytics", on).apply()
            if (on) { if (analytics) PostHog.optIn() else startAnalytics() } else if (analytics) PostHog.optOut()
        }

    private fun startAnalytics() {
        if (analytics || BuildConfig.POSTHOG_KEY.isBlank() || !analyticsOn) return
        runCatching {
            PostHogAndroid.setup(app, PostHogAndroidConfig(BuildConfig.POSTHOG_KEY, BuildConfig.POSTHOG_HOST).apply {
                captureScreenViews = false // one activity; screens are named below
                captureDeepLinks = false
                captureApplicationLifecycleEvents = true
                sessionReplay = false
            })
            PostHog.register("platform", "android")
            analytics = true
        }
    }

    /** A screen was opened: its name only. Private screens are skipped. */
    fun screen(name: String) {
        if (!analytics || name == lastScreen) return
        lastScreen = name
        if (name in PRIVATE) return
        runCatching { memberId()?.let { PostHog.identify(it) }; PostHog.screen(name) }
    }

    /** On "Delete my data": the analytics id on this phone goes too. */
    fun forgetAnalytics() { if (analytics) runCatching { PostHog.reset() } }

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

    /** Counted on our own server only, never sent to PostHog (the pod is a private place, as on the web). */
    private val OWN_SERVER_ONLY = setOf("pod_session", "pod_message")

    /** One event, fire and forget. */
    fun track(name: String, props: JsonObject = JsonObject(emptyMap())) {
        if (!::app.isInitialized) return
        if (analytics && name !in OWN_SERVER_ONLY) runCatching { PostHog.capture(name, properties = props.mapValues { (_, v) -> (v as? JsonPrimitive)?.content ?: v.toString() }) }
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
                // The same referrer as its own event, so PostHog sees which link brought this install.
                if (ok && ref != null) utmOnly(ref)?.let { track("install_referrer", buildJsonObject { put("referrer", it) }) }
            }
            if (prefs.getString("lastOpen", null) != today()) {
                prefs.edit().putString("lastOpen", today()).apply()
                track("app_open")
            }
        }
    }

    /** Only the utm source, medium and campaign of a Play referrer, as a query string; anything else is dropped. */
    private fun utmOnly(ref: String): String? {
        val q = ref.split('&').mapNotNull { p -> p.split('=', limit = 2).takeIf { it.size == 2 } }
            .associate { (k, v) -> k to runCatching { java.net.URLDecoder.decode(v, "UTF-8") }.getOrDefault("") }
        val keep = listOf("utm_source", "utm_medium", "utm_campaign").mapNotNull { k -> q[k]?.takeIf { Regex("^[\\w.:-]{1,40}$").matches(it) }?.let { "$k=$it" } }
        return keep.takeIf { it.isNotEmpty() }?.joinToString("&")
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

    // --- Studying (analytics scope, 20 Nov 2026): the same names as the web app (metrics.js) ---------------------
    // Codes and numbers only: a content id, a topic code, minutes. Never what someone typed or a query, and a mock's
    // score stays on the phone. Pod counts go only to our own server, never to PostHog (as on the web).

    /** "Science and tech" → "science-and-tech": for content ids and topics only. */
    fun codeOf(v: String?, max: Int = 40): String? =
        v?.lowercase()?.replace(Regex("[^a-z0-9]+"), "-")?.trim('-')?.take(max)?.trim('-')?.ifBlank { null }

    private val clocks = mutableMapOf<String, Long>()
    private fun startClock(key: String) { clocks[key] = System.currentTimeMillis() }
    private fun minutesOn(key: String): Int? = clocks.remove(key)?.let { ((System.currentTimeMillis() - it) / 60_000).toInt().coerceIn(0, 300) }
    /** Once per key per day (opening the same note twice in a day counts once). */
    private fun oncePerDay(key: String): Boolean {
        if (!::app.isInitialized || prefs.getString("o:$key", null) == today()) return false
        prefs.edit().putString("o:$key", today()).apply(); return true
    }
    private fun props(vararg kv: Pair<String, Any?>) = buildJsonObject {
        kv.forEach { (k, v) -> when (v) { null -> {}; is Number -> put(k, v); is Boolean -> put(k, if (v) 1 else 0); else -> put(k, v.toString()) } }
    }

    fun noteOpen(id: String, lang: String) { startClock("note:$id"); if (oncePerDay("note:$id")) track("note_open", props("node" to codeOf(id, 64), "lang" to lang)) }
    fun noteDone(id: String, lang: String, minutes: Int? = null) {
        if (oncePerDay("noteDone:$id")) track("note_done", props("node" to codeOf(id, 64), "lang" to lang, "minutes" to (minutesOn("note:$id") ?: minutes)))
    }
    fun audioPlay(id: String?, lang: String, kind: String) = track("audio_play", props("node" to codeOf(id, 64), "lang" to lang, "kind" to kind))
    fun audioDone(id: String?, lang: String, kind: String, minutes: Int?) = track("audio_done", props("node" to codeOf(id, 64), "lang" to lang, "kind" to kind, "minutes" to minutes))
    fun videoPlay(series: String?, id: String) = track("video_play", props("series" to codeOf(series ?: "ca"), "id" to codeOf(id, 64)))
    fun videoDone(series: String?, id: String, seconds: Int?) = track("video_done", props("series" to codeOf(series ?: "ca"), "id" to codeOf(id, 64), "seconds" to seconds))
    fun practiceAnswer(where: String, topic: String?, right: Boolean, sure: Boolean? = null) =
        track("practice_answer", props("where" to where, "node" to codeOf(topic), "right" to right, "sure" to sure))
    fun mockStart(paperId: String, questions: Int) = track("mock_start", props("paper" to codeOf(paperId, 64), "questions" to questions))
    /** Which paper, how many were tried, the minutes. Never the score. */
    fun mockDone(paperId: String, attempted: Int, of: Int, minutes: Int) = track("mock_done", props("paper" to codeOf(paperId, 64), "attempted" to attempted, "of" to of, "minutes" to minutes))
    fun pyqOpen(paper: String?, kind: String) { if (oncePerDay("pyq:$paper:$kind")) track("pyq_open", props("paper" to codeOf(paper), "kind" to kind)) }
    /** words: what was typed (0 for a photo of a paper answer); target: the 150 or 250 asked for. Never the text. */
    fun answerSubmit(paper: String, words: Int, via: String, target: Int? = null, snap: Int? = null) =
        track("answer_submit", props("paper" to codeOf(paper, 12), "words" to words, "via" to via, "target" to target, "snap" to snap))
    fun answerRewrite(paper: String, second: Boolean) = track("answer_rewrite", props("paper" to codeOf(paper, 12), "second" to second))
    fun reviewDone(cards: Int, kept: Int) { if (cards > 0 && oncePerDay("review")) track("review_done", props("cards" to cards, "kept" to kept.coerceAtMost(cards))) }
    fun flashcardSession(id: String?, engine: String, cards: Int) =
        track(if (engine == "reveal") "flashcard_session" else "practice_piece", props("node" to codeOf(id, 64), "engine" to engine, "cards" to cards))
    fun plusView(from: String?, page: String) { if (oncePerDay("plus_view:$page")) track("plus_view", props("from" to (codeOf(from) ?: "direct"), "page" to page)) }
    fun paywallShown(moment: String) = track("paywall_shown", props("moment" to codeOf(moment, 30)))
    fun share(kind: String) = track("share", props("kind" to kind))
    /** Where a search was made and how many results it found; never the words. */
    fun search(where: String, results: Int) = track("search", props("where" to where, "results" to results))

    // The pod: one visit = its minutes and how many messages were sent, counted when it ends.
    private var podSince: Long? = null
    private var podSent = 0
    fun podOpened() { if (podSince == null) { podSince = System.currentTimeMillis(); podSent = 0 } }
    fun podMessageSent() { if (podSince != null) podSent++ }
    fun podClosed() {
        val since = podSince ?: return
        podSince = null
        track("pod_session", props("minutes" to ((System.currentTimeMillis() - since) / 60_000).toInt().coerceIn(0, 300)))
        if (podSent > 0) track("pod_message", props("n" to podSent))
        podSent = 0
    }

    /** A notification was tapped. It can come before init (the app was closed): kept until then. */
    private var pendingOpen: String? = null
    fun notificationOpen(kind: String) {
        if (::app.isInitialized) track("notification_open", props("kind" to codeOf(kind, 30))) else pendingOpen = kind
    }
    private fun flushPending() { pendingOpen?.let { pendingOpen = null; notificationOpen(it) } }

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
