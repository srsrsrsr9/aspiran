package com.upscpods.app.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.UUID
import java.util.concurrent.TimeUnit

/** Pods v2: one volunteer a month who opens Answer hour and checks on quiet members. */
data class PodHelper(val name: String, val memberId: String)
/** Two Answer hour answers to compare. */
data class ComparePair(val aId: String, val aText: String, val bId: String, val bText: String)

@Serializable
data class PodMessage(
    val id: String,
    val memberId: String,
    val name: String,
    val text: String,
    val ts: Long,
    val kind: String,
    val clientId: String? = null,
    /** Private notes only: who the note is for. */
    val to: String? = null,
)

@Serializable
data class StudyRoom(val startedAt: Long, val minutes: Int, val startedBy: String, val studying: List<String> = emptyList()) {
    val endsAt: Long get() = startedAt + minutes * 60_000L
}

/** The pod's weekly goal: one shared bar. Who added what is never stored. */
@Serializable
data class PodGoal(val text: String, val target: Int, val unit: String = "", val done: Int = 0, val setBy: String = "member")

@Serializable
data class QuizQuestion(val topic: String = "", val question: String, val options: List<String>)

@Serializable
data class QuizScore(val right: Int = 0, val answered: Int = 0, val pct: Int? = null)

/** Pod Quiz Night: one shared pod score, never who got what. */
@Serializable
data class PodQuiz(val id: String, val questions: List<QuizQuestion>, val score: QuizScore = QuizScore(), val lastWeekPct: Int? = null)

data class QuizResult(val right: Boolean, val answerIndex: Int, val explanation: String)

/** An open room's question of the day: one shared tally; the answer comes back only once you've answered. */
@Serializable
data class PinnedQuestion(
    val day: String, val kind: String = "mcq", val topic: String = "", val question: String, val options: List<String> = emptyList(),
    val tally: QuizScore = QuizScore(), val mine: Int? = null, val answerIndex: Int? = null, val explanation: String = "",
)

/** PAUSED: the admin console switched pod chat (or joining a first pod) off; see [PodClient.pausedNote]. */
enum class PodStatus { NO_SERVER, CONNECTING, ONLINE, OFFLINE, PAUSED }

/**
 * Talks to the pod server (server/src/pod.ts) over one WebSocket.
 * Offline first: the last messages are cached on the phone, and anything typed offline waits in an
 * outbox and sends on reconnect. All state is Compose state, updated on the main thread.
 *
 * With a [roomId] it talks to one open room (server rooms.ts) instead: same socket and chat, no joining, and its
 * own cache. The member id and server address are always the pod's.
 */
class PodClient(context: Context, val roomId: String? = null) {
    private val prefs = context.getSharedPreferences("pod", Context.MODE_PRIVATE)
    private val cachePrefs = if (roomId == null) prefs else context.getSharedPreferences("room_$roomId", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    // AuthInterceptor adds the sign-in token to /pods/join and the pod socket (Auth.kt).
    private val http = OkHttpClient.Builder().pingInterval(25, TimeUnit.SECONDS).addInterceptor(AuthInterceptor).build()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var socket: WebSocket? = null
    private var retry: Job? = null
    private var attempt = 0
    private var wanted = false
    private var chatOn = true
    private var joinOn = true

    var status by mutableStateOf(PodStatus.NO_SERVER); private set
    var messages by mutableStateOf(loadCache()); private set
    var online by mutableStateOf(listOf<String>()); private set
    var room by mutableStateOf<StudyRoom?>(null); private set
    var outbox by mutableStateOf(listOf<PodMessage>()); private set
    /** Set when the Guardian flags something this member wrote. The UI opens Need to talk. */
    var careRequested by mutableStateOf(false)
    var notice by mutableStateOf<String?>(null)
    var unread by mutableStateOf(0)
    /** The pod lead's name, and whether that's this member. */
    var lead by mutableStateOf<String?>(null); private set
    var isLead by mutableStateOf(false); private set
    /** "Ask the lead privately": notes only this member and the lead can see. */
    var privateNotes by mutableStateOf(listOf<PodMessage>()); private set
    /** Why chat is paused, in words for the member. Null unless status is PAUSED. */
    var pausedNote by mutableStateOf<String?>(null); private set

    // --- Pod v2: goal, quiz, thanks, moves -------------------------------------------------------
    var goal by mutableStateOf<PodGoal?>(null); private set
    var quiz by mutableStateOf<PodQuiz?>(null); private set
    /** This member's own quiz picks (question index to option), and what each turned out to be. */
    var quizMine by mutableStateOf(mapOf<Int, Int>()); private set
    var quizResults by mutableStateOf(mapOf<Int, QuizResult>()); private set
    /** Open rooms only: today's pinned question, with this member's pick and the answer once picked. */
    var pinned by mutableStateOf<PinnedQuestion?>(null); private set
    /** Messages someone has thanked (ids only; who thanked whom isn't shown). */
    var thanked by mutableStateOf(setOf<String>()); private set
    /** Rituals a member has claimed this week; Chotu stays out of those. */
    var claims by mutableStateOf(listOf<String>()); private set
    /** The pod's honest summary (state, size, opening Monday), from /pods/join or /pods/me. */
    var summary by mutableStateOf<PodSummary?>(
        runCatching { json.decodeFromString(PodSummary.serializer(), prefs.getString("summary", null)!!) }.getOrNull(),
    ); private set
    /** Set when this pod was merged; the app reconnects to the new one. */
    var movedNote by mutableStateOf<String?>(null)
    /** Pods v2: this month's volunteer helper, the pair of answers to compare, and what the helper's last check-in reached. */
    var helper by mutableStateOf<PodHelper?>(null); private set
    var pair by mutableStateOf<ComparePair?>(null)
    var noPair by mutableStateOf(false); private set
    var compared by mutableStateOf(false); private set
    var missSent by mutableStateOf<Int?>(null); private set
    /** Called for things that earn a stamp: "first_thanks", "lead", "quiz_night". */
    var onStamp: (String) -> Unit = {}
    /** The four matching fields from the staged profile (stage, attempt_band, lang, time_band). */
    var matchFields: () -> Map<String, String> = { emptyMap() }
    private var lastPersona: Persona? = null
    /** False while the app can't use the server (not signed in, or access switched off): no joining, no socket. */
    var mayConnect: () -> Boolean = { true }
    /** Open mode (server rooms.ts): nobody new is matched, so a member without a pod doesn't try to join one. */
    var roomsOnly: () -> Boolean = { false }

    var memberId: String = prefs.getString("memberId", null) ?: UUID.randomUUID().toString().replace("-", "").also {
        prefs.edit().putString("memberId", it).apply()
    }
        private set

    /**
     * Sign-in linked this phone to an account that already has a member id (used on another phone first):
     * use that one, and its pod, from now on. The old id's cached chat is dropped; nothing else on the phone changes.
     */
    fun adoptMemberId(id: String) {
        if (id.isBlank() || id == memberId) return
        val wasWanted = wanted
        forget()
        memberId = id
        prefs.edit().putString("memberId", id).apply()
        if (wasWanted) start(lastPersona)
    }
    /** The typed server, or the release build's default (see [ServerPolicy]). */
    var serverUrl: String
        get() = ServerPolicy.resolve(prefs.getString("server", ""))
        set(value) {
            // Release builds refuse plain http; the screen shows ServerPolicy.check's sentence.
            if (ServerPolicy.check(value) != null) return
            prefs.edit().putString("server", value.trim().trimEnd('/')).remove("podId").apply()
        }
    val podId: String? get() = roomId ?: prefs.getString("podId", null)

    /** Join (or rejoin) a pod and open the socket. Safe to call repeatedly. */
    fun start(persona: Persona?) {
        wanted = true
        lastPersona = persona
        if (serverUrl.isBlank()) { status = PodStatus.NO_SERVER; return }
        if (!mayConnect()) { retry?.cancel(); status = PodStatus.OFFLINE; return }
        if (podId == null && roomsOnly()) { retry?.cancel(); status = PodStatus.OFFLINE; return }
        if (!chatOn || (podId == null && !joinOn)) {
            pausedNote = if (!chatOn) "Pod chat is paused for a little while. Your pod and its messages are safe."
                else "Joining new pods is paused for now. Try again a bit later."
            status = PodStatus.PAUSED
            return
        }
        pausedNote = null
        if (status == PodStatus.ONLINE || status == PodStatus.CONNECTING) return
        status = PodStatus.CONNECTING
        scope.launch {
            val pod = podId ?: runCatching { join(persona) }.getOrNull()
            if (pod == null) { scheduleRetry(persona); return@launch }
            open(pod, persona?.name?.ifBlank { null } ?: "Member", persona)
        }
    }

    /** The admin console's switches, from /config. Pauses or resumes chat to match. */
    fun gate(chat: Boolean, join: Boolean, persona: Persona?) {
        if (chat == chatOn && join == joinOn) return
        chatOn = chat; joinOn = join
        if (!wanted) return
        if (!chat) { retry?.cancel(); socket?.close(1000, "paused"); socket = null }
        if (status != PodStatus.ONLINE || !chat) { status = PodStatus.OFFLINE; start(persona) }
    }

    fun stop() {
        wanted = false
        retry?.cancel()
        socket?.close(1000, "background")
        socket = null
        if (status != PodStatus.NO_SERVER) status = PodStatus.OFFLINE
    }

    /** "Delete my data": drops the cached chat and the pod membership on this phone. The server address stays. */
    fun forget() {
        stop()
        prefs.edit().remove("cache").remove("podId").remove("summary").remove("joinedOn").apply()
        if (roomId != null) cachePrefs.edit().remove("cache").apply()
        summary = null; goal = null; quiz = null; quizMine = emptyMap(); quizResults = emptyMap(); thanked = emptySet()
        messages = emptyList()
        outbox = emptyList()
        privateNotes = emptyList()
        unread = 0
    }

    /** [kind] is "chat", or "favour" / "offer" for the favours strip. */
    fun say(text: String, kind: String = "chat") {
        val clean = text.trim()
        if (clean.isEmpty()) return
        val pending = PodMessage("local-${UUID.randomUUID()}", memberId, "You", clean, System.currentTimeMillis(), kind, UUID.randomUUID().toString())
        // Shown as "sending" until the server echoes it back; resent on reconnect if offline.
        outbox = outbox + pending
        send(sayEvent(pending))
    }

    /** A private note to the pod lead, or (from the lead) a reply to one member. Needs a connection. */
    fun askLead(text: String): Boolean = text.isNotBlank() && send(buildJsonObject { put("type", "ask_lead"); put("text", text.trim()) })
    fun replyPrivately(to: String, text: String): Boolean =
        text.isNotBlank() && send(buildJsonObject { put("type", "lead_reply"); put("to", to); put("text", text.trim()) })

    /** Answer hour: two answers from this week to compare (not yours), then which is stronger and one reason. */
    fun askPair(): Boolean { compared = false; noPair = false; return send(buildJsonObject { put("type", "compare_get") }) }
    fun compare(a: String, b: String, pick: String, reason: String): Boolean =
        send(buildJsonObject { put("type", "compare"); put("a", a); put("b", b); put("pick", pick); put("reason", reason.trim()) })
    fun takeHelper() = send(buildJsonObject { put("type", "helper_take") })
    fun leaveHelper() = send(buildJsonObject { put("type", "helper_leave") })
    fun openAnswerHour(question: String) = send(buildJsonObject { put("type", "answer_hour_start"); put("question", question.trim()) })
    fun missYou(text: String) = text.isNotBlank() && send(buildJsonObject { put("type", "miss_you"); put("text", text.trim()) })

    private fun sayEvent(m: PodMessage) = buildJsonObject {
        put("type", "say"); put("text", m.text); put("clientId", m.clientId)
        if (m.kind != "chat") put("kind", m.kind)
    }

    fun chaiPing() = send(buildJsonObject { put("type", "chai_ping") })
    fun report(id: String, reason: String) = send(buildJsonObject { put("type", "report"); put("id", id); put("reason", reason) })
    fun startRoom(minutes: Int) = send(buildJsonObject { put("type", "room_start"); put("minutes", minutes) })
    fun joinRoom() = send(buildJsonObject { put("type", "room_join") })
    fun leaveRoom() = send(buildJsonObject { put("type", "room_leave") })
    /** The lead sets the week's goal; everyone adds to the one bar. */
    fun setGoal(text: String, target: Int, unit: String) =
        send(buildJsonObject { put("type", "goal_set"); put("text", text.trim()); put("target", target); put("unit", unit.trim()) }).also { Metrics.ritualOnce("goal") }
    fun addToGoal(n: Int) = send(buildJsonObject { put("type", "goal_add"); put("n", n) })
    fun answerQuiz(q: Int, choice: Int): Boolean {
        if (quizMine.containsKey(q)) return false
        quizMine = quizMine + (q to choice)
        return send(buildJsonObject { put("type", "quiz_answer"); put("q", q); put("choice", choice) })
    }
    fun answerPinned(choice: Int): Boolean {
        val p = pinned ?: return false
        if (p.mine != null || p.kind != "mcq") return false
        pinned = p.copy(mine = choice)
        return send(buildJsonObject { put("type", "pinned_answer"); put("choice", choice) })
    }
    fun thank(id: String) = send(buildJsonObject { put("type", "thanks"); put("id", id) })
    /** Running this week's ritual yourself: Chotu stays out of a claimed one. */
    fun claim(ritual: String) = send(buildJsonObject { put("type", "claim"); put("ritual", ritual) }).also { Metrics.ritualOnce(ritual) }
    val joinedOn: java.time.LocalDate? get() = prefs.getString("joinedOn", null)?.let { runCatching { java.time.LocalDate.parse(it) }.getOrNull() }

    fun updateSummary(s: PodSummary?) {
        summary = s
        prefs.edit().putString("summary", s?.let { json.encodeToString(PodSummary.serializer(), it) }).apply()
    }

    /** After a merge or a chosen move: forget the old pod and connect to the new one. */
    fun switchTo(podId: String, persona: Persona?) {
        if (podId == this.podId) return
        stop()
        prefs.edit().putString("podId", podId).remove("cache").apply()
        messages = emptyList(); goal = null; quiz = null; quizMine = emptyMap(); quizResults = emptyMap(); thanked = emptySet()
        start(persona)
    }

    /** The latest published brief, or null when offline or nothing is published yet. */
    suspend fun latestBrief(): String? = withContext(Dispatchers.IO) {
        if (serverUrl.isBlank()) return@withContext null
        runCatching {
            http.newCall(Request.Builder().url("$serverUrl/brief/latest").build()).execute().use { r ->
                if (r.isSuccessful) r.body.string() else null
            }
        }.getOrNull()
    }

    // --- internals --------------------------------------------------------------

    private suspend fun join(persona: Persona?): String? = withContext(Dispatchers.IO) {
        // Only the four matching fields the server accepts; a field nobody gave is left out ("any").
        val f = matchFields()
        val body = buildJsonObject {
            put("memberId", memberId)
            f["stage"]?.let { put("stage", it) }
            f["attempt_band"]?.let { put("attempt_band", it) }
            put("lang", f["lang"] ?: when (persona?.language) {
                ReadingLanguage.HINDI -> "hindi"
                ReadingLanguage.ENGLISH, ReadingLanguage.BOTH -> "english"
                null -> "any"
            })
            f["time_band"]?.let { put("time_band", it) }
        }.toString()
        val req = Request.Builder().url("$serverUrl/pods/join")
            .post(body.toRequestBody("application/json".toMediaType())).build()
        http.newCall(req).execute().use { r ->
            if (!r.isSuccessful) return@withContext null
            val o = json.parseToJsonElement(r.body.string()).jsonObject
            val id = o["podId"]?.jsonPrimitive?.content
            runCatching { json.decodeFromJsonElement(PodSummary.serializer(), o) }.getOrNull()?.let { withContext(Dispatchers.Main) { updateSummary(it) } }
            if (id != null && prefs.getString("joinedOn", null) == null) Metrics.rateLater("pod_joined", 90_000)
            id?.also { prefs.edit().putString("podId", it).putString("joinedOn", java.time.LocalDate.now().toString()).apply() }
        }
    }

    private fun open(pod: String, name: String, persona: Persona?) {
        val ws = serverUrl.replaceFirst("http", "ws")
        val url = "$ws/${if (roomId != null) "rooms" else "pods"}/$pod/ws?member=$memberId&name=${java.net.URLEncoder.encode(name, "UTF-8")}"
        socket = http.newWebSocket(Request.Builder().url(url).build(), object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                scope.launch {
                    status = PodStatus.ONLINE
                    attempt = 0
                    // Resend anything typed while offline.
                    outbox.forEach { m -> webSocket.send(sayEvent(m).toString()) }
                }
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                scope.launch { handle(text) }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                // 4403: the server switched this account off (staff suspended it). Auth shows the notice.
                if (code == 4403) { Auth.markSuspended(null); scope.launch { wanted = false; retry?.cancel() } }
                webSocket.close(1000, null)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                scope.launch {
                    // 403 means the server no longer knows this pod (e.g. a fresh local database): rejoin.
                    if (response?.code == 403 && roomId == null) prefs.edit().remove("podId").apply()
                    status = PodStatus.OFFLINE
                    socket = null
                    scheduleRetry(persona)
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                scope.launch {
                    if (status != PodStatus.NO_SERVER && status != PodStatus.PAUSED) status = PodStatus.OFFLINE
                    socket = null
                    if (wanted && status != PodStatus.PAUSED) scheduleRetry(persona)
                }
            }
        })
    }

    private fun handle(raw: String) {
        val ev = runCatching { json.parseToJsonElement(raw).jsonObject }.getOrNull() ?: return
        when (ev["type"]?.jsonPrimitive?.content) {
            "history" -> {
                messages = json.decodeFromJsonElement(ListSerializer(PodMessage.serializer()), ev["messages"]!!)
                online = ev["online"]?.jsonArray?.map { it.jsonPrimitive.content } ?: emptyList()
                room = roomOf(ev)
                lead = ev["lead"]?.jsonPrimitive?.contentOrNull
                isLead = ev["youAreLead"]?.jsonPrimitive?.booleanOrNull == true
                privateNotes = ev["private"]?.let { runCatching { json.decodeFromJsonElement(ListSerializer(PodMessage.serializer()), it) }.getOrNull() } ?: emptyList()
                goal = goalOf(ev["goal"])
                quiz = quizOf(ev["quiz"])
                quizMine = (ev["quiz"] as? JsonObject)?.get("mine")?.let { m ->
                    runCatching { m.jsonObject.entries.associate { (k, v) -> k.toInt() to v.jsonPrimitive.content.toInt() } }.getOrNull()
                } ?: emptyMap()
                pinned = pinnedOf(ev["pinned"])
                thanked = ev["thanked"]?.let { a -> runCatching { a.jsonArray.map { it.jsonPrimitive.content }.toSet() }.getOrNull() } ?: emptySet()
                helper = helperOf(ev["helper"])
                claims = ev["claims"]?.let { a -> runCatching { a.jsonArray.map { it.jsonPrimitive.content } }.getOrNull() } ?: emptyList()
                if (ev["thankedYou"]?.jsonPrimitive?.booleanOrNull == true) onStamp("first_thanks")
                if (isLead) onStamp("lead")
                ev["movedTo"]?.jsonPrimitive?.contentOrNull?.let { moved(it) }
                saveCache()
            }
            "private" -> {
                val m = json.decodeFromJsonElement<PodMessage>(ev["message"]!!)
                privateNotes = (privateNotes + m).takeLast(50)
            }
            "msg" -> {
                val m = json.decodeFromJsonElement<PodMessage>(ev["message"]!!)
                outbox = outbox.filterNot { it.clientId != null && it.clientId == m.clientId }
                messages = (messages + m).takeLast(200)
                // New since the member last looked: the Pod tab and the room list show it as a badge.
                if (m.memberId != memberId) unread++
                saveCache()
            }
            "presence" -> online = ev["online"]?.jsonArray?.map { it.jsonPrimitive.content } ?: emptyList()
            "room" -> room = roomOf(ev)
            "hidden" -> {
                val id = ev["id"]?.jsonPrimitive?.content
                messages = messages.filterNot { it.id == id }
                saveCache()
            }
            "care" -> careRequested = true
            "goal" -> goal = goalOf(ev["goal"])
            "quiz" -> quiz = quizOf(ev["quiz"])
            // The room's tally changed: keep this member's own pick and answer, which the broadcast doesn't carry.
            "pinned" -> pinned = pinnedOf(ev["pinned"])?.let { p ->
                val old = pinned
                if (old != null && old.day == p.day && old.question == p.question) p.copy(mine = old.mine, answerIndex = old.answerIndex ?: p.answerIndex, explanation = old.explanation.ifBlank { p.explanation }) else p
            }
            "pinned_result" -> pinned = pinned?.copy(
                mine = ev["choice"]?.jsonPrimitive?.content?.toIntOrNull(),
                answerIndex = ev["answerIndex"]?.jsonPrimitive?.content?.toIntOrNull(),
                explanation = ev["explanation"]?.jsonPrimitive?.contentOrNull ?: "",
            )
            "quiz_result" -> {
                val q = ev["q"]?.jsonPrimitive?.content?.toIntOrNull() ?: return
                quizResults = quizResults + (q to QuizResult(
                    ev["right"]?.jsonPrimitive?.booleanOrNull == true,
                    ev["answerIndex"]?.jsonPrimitive?.content?.toIntOrNull() ?: -1,
                    ev["explanation"]?.jsonPrimitive?.contentOrNull ?: "",
                ))
                onStamp("quiz_night")
                Metrics.ritualOnce("quiz")
                if (quizResults.size >= (quiz?.questions?.size ?: Int.MAX_VALUE)) Metrics.rateAfter("quiz")
            }
            "thanked" -> ev["id"]?.jsonPrimitive?.contentOrNull?.let { thanked = thanked + it }
            "thanks_received" -> onStamp("first_thanks")
            "moved" -> ev["to"]?.jsonPrimitive?.contentOrNull?.let { moved(it) }
            "helper" -> helper = helperOf(ev["helper"])
            "compare_pair" -> if (ev["none"]?.jsonPrimitive?.booleanOrNull == true) { pair = null; noPair = true } else {
                val a = ev["a"]?.jsonObject; val b = ev["b"]?.jsonObject
                if (a != null && b != null) pair = ComparePair(a["id"]!!.jsonPrimitive.content, a["text"]!!.jsonPrimitive.content, b["id"]!!.jsonPrimitive.content, b["text"]!!.jsonPrimitive.content)
            }
            "compared" -> { pair = null; compared = true }
            "miss_you_sent" -> missSent = ev["n"]?.jsonPrimitive?.content?.toIntOrNull()
            "reported" -> notice = "Thanks. A moderator will look at it."
            "error" -> {
                if (ev["code"]?.jsonPrimitive?.contentOrNull == "account_suspended") { Auth.markSuspended(null); return }
                notice = ev["message"]?.jsonPrimitive?.content
            }
        }
    }

    private fun helperOf(e: kotlinx.serialization.json.JsonElement?): PodHelper? = (e as? JsonObject)?.let { o ->
        val id = o["memberId"]?.jsonPrimitive?.contentOrNull ?: return@let null
        PodHelper(o["name"]?.jsonPrimitive?.contentOrNull ?: "A member", id)
    }
    private fun goalOf(e: kotlinx.serialization.json.JsonElement?): PodGoal? =
        (e as? JsonObject)?.let { runCatching { json.decodeFromJsonElement<PodGoal>(it) }.getOrNull() }
    private fun quizOf(e: kotlinx.serialization.json.JsonElement?): PodQuiz? =
        (e as? JsonObject)?.let { runCatching { json.decodeFromJsonElement<PodQuiz>(it) }.getOrNull() }
    private fun pinnedOf(e: kotlinx.serialization.json.JsonElement?): PinnedQuestion? =
        (e as? JsonObject)?.let { runCatching { json.decodeFromJsonElement<PinnedQuestion>(it) }.getOrNull() }

    private fun moved(to: String) {
        if (to == podId) return
        movedNote = "Your pod joined a bigger one, so there are more people around. Same you, new room."
        switchTo(to, lastPersona)
    }

    private fun roomOf(ev: JsonObject): StudyRoom? =
        (ev["room"] as? JsonObject)?.let { runCatching { json.decodeFromJsonElement<StudyRoom>(it) }.getOrNull() }

    private fun send(event: JsonObject): Boolean = status == PodStatus.ONLINE && socket?.send(event.toString()) == true

    private fun scheduleRetry(persona: Persona?) {
        if (!wanted) return
        status = if (serverUrl.isBlank()) PodStatus.NO_SERVER else PodStatus.OFFLINE
        retry?.cancel()
        retry = scope.launch {
            delay(minOf(60_000L, 2_000L shl minOf(attempt++, 5)))
            if (status != PodStatus.ONLINE) { status = PodStatus.OFFLINE; startFromRetry(persona) }
        }
    }

    private fun startFromRetry(persona: Persona?) {
        status = PodStatus.OFFLINE
        start(persona)
    }

    private fun loadCache(): List<PodMessage> = runCatching {
        json.decodeFromString(ListSerializer(PodMessage.serializer()), cachePrefs.getString("cache", "[]")!!)
    }.getOrDefault(emptyList())

    private fun saveCache() {
        cachePrefs.edit().putString("cache", json.encodeToString(ListSerializer(PodMessage.serializer()), messages.takeLast(100))).apply()
    }
}
