package com.upscpods.app.data

import android.app.ActivityManager
import android.util.Log
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.BackoffPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
import com.google.ai.edge.litertlm.NoRepeatNgramConfig
import com.google.ai.edge.litertlm.RepetitionPenaltyConfig
import com.google.ai.edge.litertlm.SamplerConfig
import com.google.ai.edge.litertlm.ThinkingConfig
import com.upscpods.app.Brand
import com.upscpods.app.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.add
import kotlinx.serialization.json.addJsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import com.upscpods.app.data.AuthInterceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/**
 * One model the phone can download, as listed by our own pod server's /models. The file comes from our
 * server (a local folder in dev; R2, or the server passing the official Hugging Face file along, when
 * deployed), never straight from Hugging Face, so no account or token is ever needed, and it's checked by
 * SHA-256 before it's kept.
 */
@Serializable
data class ModelSpec(
    val id: String,
    val label: String,
    /** Path on the pod server, e.g. /models/files/gemma-4-E2B-it.litertlm. */
    val url: String,
    val bytes: Long,
    val sha256: String,
    /** Total RAM the phone needs, in GB, to run it without the system killing the app. */
    val minRamGb: Double,
) {
    val fileName get() = "$id.litertlm"
    /** Gemma only; anything else an older server lists (the retired Lite model) is never offered or loaded. */
    val onDevice get() = id.startsWith("gemma")
    val sizeLabel get() = if (bytes >= 1_000_000_000) "%.1f GB".format(bytes / 1e9) else "${bytes / 1_000_000} MB"
}

/** What this phone can take. Measured, not guessed from the model name. */
data class DeviceProbe(val ramGb: Double, val freeGb: Double) {
    /**
     * The smallest Gemma that fits, keeping 1 GB of storage spare (Gemma 4 E2B on most phones). Only Gemma runs on
     * the phone: the old Lite model (Qwen3 0.6B) wrote nonsense, so a phone too small for Gemma gets no offline
     * model and Chotu answers online. Null means offline Chotu isn't offered.
     */
    fun pick(models: List<ModelSpec>): ModelSpec? =
        models.filter { it.onDevice && ramGb >= it.minRamGb && freeGb >= it.bytes / 1e9 + 1.0 }.minByOrNull { it.bytes }

    companion object {
        fun of(context: Context): DeviceProbe {
            val am = context.getSystemService(ActivityManager::class.java)
            val mem = ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }
            return DeviceProbe(mem.totalMem / 1e9, context.filesDir.usableSpace / 1e9)
        }
    }
}

sealed interface ChotuState {
    /** Looking at the phone and the server's model list. Shown as "Checking…", never as numbers. */
    data object Checking : ChotuState
    /** Phone too small, or not enough storage. Everything else in the app still works. */
    data class Unsupported(val probe: DeviceProbe) : ChotuState
    /** No pod server set, server unreachable, or it has no model file yet. [why] is said to the person. */
    data class NoModel(val why: String) : ChotuState
    data class NotDownloaded(val model: ModelSpec, val probe: DeviceProbe) : ChotuState
    data class Downloading(val model: ModelSpec, val done: Long, val phase: DownloadPhase, val wifiOnly: Boolean) : ChotuState
    data class Loading(val model: ModelSpec) : ChotuState
    data class Ready(val model: ModelSpec) : ChotuState
    data class Failed(val model: ModelSpec, val why: String) : ChotuState
}

enum class DownloadPhase { WAITING_WIFI, WAITING_NETWORK, RUNNING, VERIFYING }

/** [cloud]: answered by the server (Groq) because the on-device model isn't ready. Shown with an "online" marker. */
data class ChotuTurn(
    val fromUser: Boolean,
    val text: String,
    val care: Boolean = false,
    val cloud: Boolean = false,
    /** Lets a reply be reported on its own (Play's AI-content rule). Never tied to the chat. */
    val id: String = java.util.UUID.randomUUID().toString(),
) {
    /** The app's own fallback line (offline, stuck, server trouble), not a model's answer: it carries no source label. */
    val fromApp get() = !fromUser && text in setOf(Chotu.OFFLINE_REPLY, Chotu.STUCK, Chotu.CLOUD_TROUBLE)
}

/**
 * Chotu runs on the phone once its model is downloaded; those chats are never sent anywhere and aren't
 * saved after the app closes. Until then, and only while online, chats go to the pod server's /chotu
 * (cloud Chotu) and are marked "online". Distress is always checked on the phone first and never sent.
 * One per process: the engine holds the model in memory.
 */
class Chotu private constructor(private val app: Context) {
    private val prefs = app.getSharedPreferences("chotu", Context.MODE_PRIVATE)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    @OptIn(ExperimentalCoroutinesApi::class)
    private val engineThread = Dispatchers.IO.limitedParallelism(1)
    private var engine: Engine? = null
    private var chat: Conversation? = null
    /** The chip [chat] was started under. */
    private var chatMode = ""
    private val json = Json { ignoreUnknownKeys = true }
    private val http = OkHttpClient.Builder().connectTimeout(8, TimeUnit.SECONDS).readTimeout(40, TimeUnit.SECONDS)
        .addInterceptor(AuthInterceptor).build()

    var state by mutableStateOf<ChotuState>(ChotuState.Checking); private set
    var turns by mutableStateOf(listOf<ChotuTurn>()); private set
    var thinking by mutableStateOf(false); private set
    val userTurns get() = turns.count { it.fromUser }

    /** Chotu v2 chips: "talk", "prep" or "plan". Sent to cloud Chotu so it answers in that mode. */
    var mode by mutableStateOf("talk")
    /** Notes the member approved, sent with cloud questions only when Smarter Chotu is on. Null otherwise. */
    var memoryNotes: () -> String? = { null }

    /** The same pod server the rest of the app uses (set in My Path). */
    private val server: String get() = ServerPolicy.resolve(app.getSharedPreferences("pod", Context.MODE_PRIVATE).getString("server", ""))

    /** Cloud Chotu can answer: no on-device model ready, a pod server is set, and the phone is online. */
    val cloudAvailable: Boolean get() = state !is ChotuState.Ready && server.isNotBlank() && online()

    /** The downloaded model, remembered with its spec so it loads offline. */
    private val chosen: ModelSpec?
        get() = prefs.getString("spec", null)
            ?.let { runCatching { json.decodeFromString(ModelSpec.serializer(), it) }.getOrNull() }
            ?.takeIf { modelFile(it).exists() }

    fun modelFile(m: ModelSpec) = File(app.filesDir, "models/${m.fileName}")

    init {
        refresh()
        scope.launch {
            WorkManager.getInstance(app).getWorkInfosForUniqueWorkFlow(WORK).collect { infos -> onWork(infos.firstOrNull()) }
        }
    }

    /** Work out the state from what's on disk, the server's model list and WorkManager. */
    fun refresh() {
        retireOldModel()
        val ready = chosen
        if (ready != null) { if (state !is ChotuState.Ready && state !is ChotuState.Loading) load(ready); return }
        if (state is ChotuState.Downloading) return
        scope.launch {
            val probe = withContext(Dispatchers.IO) { DeviceProbe.of(app) }
            val listed = withContext(Dispatchers.IO) { fetchModels() }
            if (state is ChotuState.Downloading || state is ChotuState.Ready || state is ChotuState.Loading) return@launch
            state = when {
                listed.isFailure -> ChotuState.NoModel(listed.exceptionOrNull()?.message ?: CANT_CHECK)
                listed.getOrThrow().isEmpty() -> ChotuState.NoModel("The pod server doesn't have ${Brand.MASCOT_SHORT}'s model file yet.")
                else -> probe.pick(listed.getOrThrow())?.let { ChotuState.NotDownloaded(it, probe) } ?: ChotuState.Unsupported(probe)
            }
        }
    }

    /**
     * A phone that downloaded the retired Lite model stops using it: the file goes (about 0.5 GB back) and
     * Chotu answers online until the person chooses to download Gemma, if the phone can take it.
     */
    private fun retireOldModel() {
        val spec = prefs.getString("spec", null) ?: prefs.getString("pending", null) ?: return
        val m = runCatching { json.decodeFromString(ModelSpec.serializer(), spec) }.getOrNull()
        if (m == null || m.onDevice) return
        if (prefs.getString("pending", null) != null) WorkManager.getInstance(app).cancelUniqueWork(WORK)
        File(app.filesDir, "models").listFiles { f -> f.name.startsWith(m.fileName) }?.forEach { it.delete() }
        prefs.edit().remove("spec").remove("pending").remove("loading").apply()
    }

    /** Called only after the person taps Download on the consent card. Wi-Fi only unless they choose mobile data. */
    fun download(m: ModelSpec, wifiOnly: Boolean = true) {
        val base = server
        if (base.isBlank()) { state = ChotuState.NoModel(NO_SERVER); return }
        // "Try again" after a failed start: the old file goes, and a fresh copy comes down.
        if (engine == null) modelFile(m).delete()
        prefs.edit().putString("pending", json.encodeToString(ModelSpec.serializer(), m)).remove("spec").remove("loading").apply()
        val req = OneTimeWorkRequestBuilder<ModelDownloadWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(if (wifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED)
                    .setRequiresStorageNotLow(true)
                    .build(),
            )
            .setInputData(workDataOf("spec" to json.encodeToString(ModelSpec.serializer(), m), "base" to base, "wifiOnly" to wifiOnly))
            // Android stops background work after about 10 minutes; it comes back quickly and resumes from the .part file.
            .setBackoffCriteria(BackoffPolicy.LINEAR, 15, TimeUnit.SECONDS)
            .build()
        // REPLACE, so switching Wi-Fi only <-> mobile data takes effect. The .part file stays, so it resumes.
        WorkManager.getInstance(app).enqueueUniqueWork(WORK, ExistingWorkPolicy.REPLACE, req)
        state = ChotuState.Downloading(m, partSize(m), if (wifiOnly) DownloadPhase.WAITING_WIFI else DownloadPhase.WAITING_NETWORK, wifiOnly)
    }

    fun cancelDownload() {
        WorkManager.getInstance(app).cancelUniqueWork(WORK)
        File(app.filesDir, "models").listFiles { f -> f.name.endsWith(".part") }?.forEach { it.delete() }
        prefs.edit().remove("pending").apply()
        state = ChotuState.NoModel("")
        refresh()
    }

    /** Frees the space. Chotu chat goes back to the download card (and cloud Chotu, when online). */
    fun deleteModel() {
        scope.launch {
            withContext(engineThread) { closeEngine() }
            File(app.filesDir, "models").listFiles()?.forEach { it.delete() }
            WorkManager.getInstance(app).pruneWork()
            prefs.edit().remove("spec").remove("pending").remove("loading").apply()
            turns = emptyList()
            state = ChotuState.Checking
            refresh()
        }
    }

    fun newChat() {
        turns = emptyList()
        scope.launch { withContext(engineThread) { chat?.close(); chat = null } }
    }

    /**
     * Sends one message. Distress is checked on the phone first, before any model sees anything:
     * a match shows the helplines instead of an AI answer, and nothing is sent to the server.
     * The on-device model can also flag it (see [CARE_TAG]).
     */
    fun ask(text: String) {
        val clean = text.trim()
        if (clean.isEmpty() || thinking) return
        turns = turns + ChotuTurn(true, clean)
        if (DistressMatcher.matches(clean)) {
            turns = turns + ChotuTurn(false, CARE_REPLY, care = true)
            return
        }
        val m = (state as? ChotuState.Ready)?.model
        if (m == null) {
            if (cloudAvailable) askCloud() else turns = turns + ChotuTurn(false, OFFLINE_REPLY)
            return
        }
        thinking = true
        turns = turns + ChotuTurn(false, "")
        // The model can't see the clock; late at night it's told, so it can point to rest.
        val hour = java.time.LocalTime.now().hour
        val sent = if (hour >= 23 || hour < 4) "(It's late at night where I am.) $clean" else clean
        stopped = false
        scope.launch {
            var failed = false
            // Two tries on the phone: the second in a fresh conversation, which clears a stuck or over-long one.
            for (attempt in 1..2) {
                // No first word in time: stop waiting on the phone and let online Chotu answer.
                var gotText = false
                var timedOut = false
                val watchdog = launch {
                    delay(FIRST_WORD_MS)
                    if (!gotText) { timedOut = true; withContext(Dispatchers.IO) { runCatching { chat?.cancelProcess() } } }
                }
                try {
                    stream(m, sent, explain = false).collect { sofar -> if (sofar.isNotBlank()) gotText = true; replaceLast(sofar) }
                    if (timedOut) throw java.io.IOException("no first word in ${FIRST_WORD_MS / 1000}s")
                    failed = false
                    break
                } catch (e: kotlinx.coroutines.CancellationException) {
                    throw e
                } catch (e: Exception) {
                    Log.w(TAG, "on-device reply failed (try $attempt, ${m.id})", e)
                    failed = true
                    withContext(engineThread) { runCatching { chat?.close() }; chat = null }
                    // A loop or a timeout goes straight online; only a plain error gets a second try on the phone.
                    // A loop on the GPU also moves this phone to the CPU for next time (some GPUs garble these models).
                    if (e is Looping) { scope.launch { fallBackToCpu(m) }; break }
                    if (stopped || timedOut) break
                    // The second try runs on the CPU when the GPU was the problem.
                    if (attempt == 1) fallBackToCpu(m)
                    replaceLast("")
                } finally {
                    watchdog.cancel()
                }
            }
            thinking = false
            when {
                !failed || stopped -> Unit
                // The phone's model couldn't answer: online Chotu takes this one when it can.
                server.isNotBlank() && online() -> { turns = turns.dropLast(1); askCloud() }
                else -> replaceLast(STUCK)
            }
        }
    }

    /** Set by Stop, so a stopped reply isn't retried or sent online. */
    @Volatile private var stopped = false

    /** "Explain simpler" on a Chai card. A fresh conversation each time; nothing is kept. */
    fun explain(card: String): Flow<String> {
        val m = (state as? ChotuState.Ready)?.model
        if (m != null) return stream(m, card, explain = true)
        if (!cloudAvailable) return flow { }
        // A public news card only; never anything the member wrote.
        return flow { emit(postChotu("prep", listOf(ChotuTurn(true, "Explain this card simply.")), notes = card).text) }
            .flowOn(Dispatchers.IO)
    }

    fun cancel() {
        stopped = true
        scope.launch(Dispatchers.IO) { runCatching { chat?.cancelProcess() } }
    }

    // --- cloud Chotu --------------------------------------------------------------

    private data class CloudReply(val text: String, val care: Boolean)
    /** An error sentence written by our server for people to read (rate limit, paused, and so on). */
    private class ServerSaid(message: String) : Exception(message)

    private fun askCloud() {
        thinking = true
        // Only this chat's own turns: never Close the Day, mood or journal text. Care turns aren't sent.
        val history = turns.filter { !it.care && it.text.isNotBlank() }.takeLast(8)
        turns = turns + ChotuTurn(false, "", cloud = true)
        scope.launch {
            val reply = runCatching { withContext(Dispatchers.IO) { postChotu(mode, history, notes = memoryNotes()) } }
            thinking = false
            turns = turns.dropLast(1) + reply.fold(
                { if (it.care) ChotuTurn(false, CARE_REPLY, care = true) else ChotuTurn(false, it.text, cloud = true) },
                // The server's own sentence when it sent one; a plain line for network trouble.
                { ChotuTurn(false, (it as? ServerSaid)?.message ?: CLOUD_TROUBLE, cloud = true) },
            )
        }
    }

    private fun postChotu(mode: String, history: List<ChotuTurn>, notes: String? = null): CloudReply {
        val body = buildJsonObject {
            put("mode", mode)
            putJsonArray("messages") {
                history.forEach { t -> addJsonObject { put("role", if (t.fromUser) "user" else "assistant"); put("content", t.text) } }
            }
            // Only the reading language. Name and stage stay on the phone (the onboarding promise).
            val persona = ProfileStore.load(app).persona
            putJsonObject("context") {
                put("language", when (persona?.language) {
                    ReadingLanguage.HINDI -> "Hindi"
                    ReadingLanguage.BOTH -> "Hinglish"
                    ReadingLanguage.ENGLISH -> "English"
                    null -> java.util.Locale.getDefault().getDisplayLanguage(java.util.Locale.ENGLISH)
                })
                if (notes != null) put("notes", notes)
            }
        }
        val req = Request.Builder().url("$server/chotu").post(body.toString().toRequestBody("application/json".toMediaType())).build()
        http.newCall(req).execute().use { r ->
            val o = runCatching { json.parseToJsonElement(r.body.string()).jsonObject }.getOrNull()
            if (o?.get("care")?.jsonPrimitive?.boolean == true) return CloudReply(CARE_REPLY, care = true)
            val text = o?.get("reply")?.jsonPrimitive?.content
            val shown = text?.let { clean(it) }
            if (r.isSuccessful && !shown.isNullOrBlank()) return CloudReply(shown, care = false)
            throw o?.get("error")?.jsonPrimitive?.content?.let { ServerSaid(it) } ?: java.io.IOException(OFFLINE_REPLY)
        }
    }

    /** Report one reply: its id, the reason and that reply's text go to the safety queue. No chat history. */
    suspend fun report(turn: ChotuTurn, reason: String): Boolean = withContext(Dispatchers.IO) {
        if (server.isBlank() || turn.fromUser) return@withContext false
        val body = buildJsonObject { put("messageId", turn.id); put("reason", reason.take(300)); put("text", turn.text.take(2000)) }
        runCatching {
            http.newCall(Request.Builder().url("$server/chotu/report").post(body.toString().toRequestBody("application/json".toMediaType())).build())
                .execute().use { it.isSuccessful }
        }.getOrDefault(false)
    }

    private fun online(): Boolean {
        val cm = app.getSystemService(ConnectivityManager::class.java) ?: return false
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /** The server's model list. Failure carries a sentence for the person. */
    private fun fetchModels(): kotlin.Result<List<ModelSpec>> {
        val base = server
        if (base.isBlank()) return kotlin.Result.failure(Exception(NO_SERVER))
        return runCatching {
            http.newCall(Request.Builder().url("$base/models").build()).execute().use { r ->
                if (!r.isSuccessful) throw Exception("The pod server answered ${r.code} for the model list.")
                val arr = json.parseToJsonElement(r.body.string()).jsonObject["models"] ?: throw Exception("The pod server sent no model list.")
                json.decodeFromJsonElement(kotlinx.serialization.builtins.ListSerializer(ModelSpec.serializer()), arr)
            }
        }.recoverCatching { throw Exception(CANT_CHECK) } // Never a raw network error on screen.
    }

    private fun partSize(m: ModelSpec) = File(app.filesDir, "models/${m.fileName}.part").length()

    // --- internals --------------------------------------------------------------

    private fun replaceLast(text: String) {
        // Small models sometimes drop the brackets and answer just "CARE".
        val care = text.contains(CARE_TAG) || text.trim().trimEnd('.') == "CARE"
        val shown = if (care) CARE_REPLY else text
        turns = turns.dropLast(1) + ChotuTurn(false, shown, care)
    }

    private fun onWork(info: WorkInfo?) {
        if (info == null || chosen != null) return
        val pending = prefs.getString("pending", null)?.let { runCatching { json.decodeFromString(ModelSpec.serializer(), it) }.getOrNull() }
        val m = pending ?: (state as? ChotuState.Downloading)?.model ?: (state as? ChotuState.NotDownloaded)?.model ?: return
        val wifiOnly = (state as? ChotuState.Downloading)?.wifiOnly ?: true
        val done = info.progress.getLong("done", partSize(m))
        when (info.state) {
            WorkInfo.State.ENQUEUED, WorkInfo.State.BLOCKED -> state = ChotuState.Downloading(
                m, partSize(m), if (wifiOnly) DownloadPhase.WAITING_WIFI else DownloadPhase.WAITING_NETWORK, wifiOnly,
            )
            WorkInfo.State.RUNNING -> state = ChotuState.Downloading(
                m, done, if (info.progress.getBoolean("verifying", false)) DownloadPhase.VERIFYING else DownloadPhase.RUNNING, wifiOnly,
            )
            WorkInfo.State.SUCCEEDED -> {
                if (!modelFile(m).exists()) return // an old finished job, from before the model was deleted
                prefs.edit().putString("spec", json.encodeToString(ModelSpec.serializer(), m)).remove("pending").apply()
                load(m)
            }
            WorkInfo.State.FAILED -> state = ChotuState.Failed(m, info.outputData.getString("why") ?: "The download didn't finish.")
            WorkInfo.State.CANCELLED -> Unit
        }
    }

    private fun load(m: ModelSpec) {
        // If the last start died inside the runtime (a damaged file can crash it natively), don't try again
        // on every app open: say so, and let the person remove and re-download it.
        if (engine == null && prefs.getString("loading", null) == m.id) {
            state = ChotuState.Failed(m, "${Brand.MASCOT_SHORT}'s model crashed while starting last time. Remove it and download it again.")
            return
        }
        state = ChotuState.Loading(m)
        scope.launch {
            val ok = withContext(engineThread) {
                if (engine != null) return@withContext true
                prefs.edit().putString("loading", m.id).commit()
                // GPU is much faster where it works; some phones refuse it, so fall back to CPU.
                startEngine(m).also { prefs.edit().remove("loading").commit() }
            }
            state = if (ok) ChotuState.Ready(m) else ChotuState.Failed(m, "This phone couldn't start the model.")
        }
    }

    /**
     * Starts the engine on the engine thread. GPU is much faster where it works, but some phones start on it and
     * then fail on the first answer (no OpenCL, for one), so after that this phone uses the CPU for good.
     */
    private fun startEngine(m: ModelSpec): Boolean {
        val backends = if (prefs.getBoolean("cpuOnly", false)) listOf(Backend.CPU()) else listOf(Backend.GPU(), Backend.CPU())
        engine = backends.firstNotNullOfOrNull { backend ->
            runCatching {
                Engine(EngineConfig(modelFile(m).absolutePath, backend, maxNumTokens = 2048, cacheDir = app.cacheDir.absolutePath))
                    .also { it.initialize() }
                    .also { onGpu = backend is Backend.GPU }
            }.onFailure { Log.w(TAG, "engine start failed on $backend (${m.id})", it) }.getOrNull()
        }
        return engine != null
    }

    /** Whether the running engine is on the GPU (see [startEngine]). */
    @Volatile private var onGpu = false

    /** After a failed answer on the GPU: restart on the CPU, and remember that for this phone. */
    private suspend fun fallBackToCpu(m: ModelSpec): Boolean = withContext(engineThread) {
        if (!onGpu) return@withContext false
        prefs.edit().putBoolean("cpuOnly", true).apply()
        closeEngine()
        startEngine(m)
    }

    private fun closeEngine() {
        runCatching { chat?.close() }
        runCatching { engine?.close() }
        chat = null
        engine = null
    }

    /**
     * The conversation to answer in. The rules go in as the system instruction and each message as its own user
     * turn, so the model's own chat template marks who is speaking. (Rules pasted into the first user message made
     * small models carry on or echo that text instead of answering it.)
     */
    private fun conversation(m: ModelSpec, explain: Boolean): Conversation {
        val e = engine ?: error("model not loaded")
        val config = ConversationConfig(
            systemInstruction = Contents.of(if (explain) EXPLAIN_RULES else CHAT_RULES),
            samplerConfig = SamplerConfig(topK = 40, topP = 0.95, temperature = 0.7),
            // No hidden thinking (it can run for minutes on a phone before a word shows), and short answers.
            thinkingConfig = ThinkingConfig(enableThinking = false),
            // Talk replies are a few lines at most; Prep and Plan get a little more room.
            maxOutputToken = if (explain) 300 else if (mode == "talk") TALK_TOKENS else 160,
        )
        if (explain) return e.createConversation(config)
        // A change of chip starts a fresh conversation, so its reply length applies.
        if (chat != null && chatMode != mode) { runCatching { chat?.close() }; chat = null }
        return chat ?: e.createConversation(config).also { chat = it; chatMode = mode }
    }

    /**
     * One reply, as it grows. Generation stops early when the text runs past the model's own turn or starts
     * repeating itself, and a finished reply that echoes the person or the rules is thrown away (see [badReply]).
     */
    private fun stream(m: ModelSpec, text: String, explain: Boolean): Flow<String> = flow {
        val convo = conversation(m, explain)
        val prompt = text
        if (BuildConfig.DEBUG) Log.d(TAG, "to ${m.id}: system=${if (explain) "EXPLAIN_RULES" else "CHAT_RULES"} user=$prompt")
        val out = StringBuilder()
        var ranOver = false
        var shown = ""
        try {
            // A mild penalty on repeats: small models on a phone can otherwise lock into one line forever.
            convo.sendMessageAsync(Message.user(prompt), emptyMap(), RepetitionPenaltyConfig(1.15f), NoRepeatNgramConfig(12)).collect { part ->
                if (ranOver) return@collect
                out.append(textOf(part))
                val raw = out.toString()
                val end = END_MARKERS.mapNotNull { mk -> raw.indexOf(mk).takeIf { it >= 0 } }.minOrNull()
                val body = if (end != null) raw.substring(0, end) else raw
                shown = clean(body)
                val why = if (looping(body)) "repeating" else (if (!explain) badReply(shown, null) else null) ?: offTask(shown, prompt)
                if (why != null) {
                    runCatching { convo.cancelProcess() }
                    throw Looping(m.id, why)
                }
                emit(shown)
                if (end != null) {
                    // The model wrote past its own turn: keep what came before and stop it here.
                    ranOver = true
                    runCatching { convo.cancelProcess() }
                }
            }
            // Only now can it be judged against the person's own words (a reply may start like them).
            if (!explain) badReply(shown, prompt)?.let { throw Looping(m.id, it) }
        } catch (e: Looping) {
            // Keep a bad turn out of the history the next message is answered from.
            runCatching { convo.close() }; if (chat === convo) chat = null
            throw e
        } finally {
            if (explain) runCatching { convo.close() }
            // A turn stopped from outside leaves the conversation in doubt; the next message starts a fresh one.
            else if (ranOver) { runCatching { convo.close() }; if (chat === convo) chat = null }
        }
    }.flowOn(engineThread)

    /** The phone's model fell into a loop or didn't answer; its text is thrown away and online Chotu answers instead. */
    private class Looping(model: String, why: String) : java.io.IOException("unusable reply ($model): $why")

    private fun textOf(m: Message) = m.contents.contents.filterIsInstance<Content.Text>().joinToString("") { it.text }

    companion object {
        /**
         * Text that only appears when a model writes past the end of its own turn (Gemma, Qwen and Llama-style
         * turn tokens, or a bare "User:" line). Everything from the first one on is dropped.
         */
        private val END_MARKERS = listOf(
            "<end_of_turn>", "<start_of_turn>", "<turn|>", "<|turn>", "<eos>", "</s>",
            "<|im_end|>", "<|im_start|>", "<|endoftext|>", "<|eot_id|>", "<|start_header_id|>",
            "\nUser:", "\nuser\n",
        )

        /** Thinking, in the forms these models write it: Qwen's <think>, Gemma's thought channel, a bare <thought>. */
        private val THINKING = listOf(
            Regex("(?s)<think>.*?(</think>|$)"),
            Regex("(?s)<\\|channel\\|?>\\s*thought.*?(<channel\\|>|<\\|channel\\|?>|$)"),
            Regex("(?s)<thought>.*?(</thought>|$)"),
        )

        /** Drops thinking (finished or not) and stray tags, trims, and folds runs of blank lines into one. */
        internal fun clean(s: String): String =
            THINKING.fold(s) { t, r -> t.replace(r, "") }
                .replace(Regex("<\\|?/?(channel|think|thought)\\|?>"), "")
                .replace(Regex("[ \t]+\n"), "\n")
                .replace(Regex("\n{3,}"), "\n\n")
                .trim()

        private fun words(s: String) = s.lowercase().split(Regex("[^\\p{L}\\p{N}]+")).filter { it.isNotBlank() }

        /** Sentences of the phone's rules, to catch a reply that just reads them back. */
        private val RULE_SENTENCES by lazy {
            (CHAT_RULES.lines() + EXPLAIN_RULES.lines())
                .flatMap { it.split(Regex("[.;:]")) }
                .map { words(it).joinToString(" ") }
                .filter { it.split(" ").size >= 5 }
        }

        /**
         * Why a reply is unusable, or null if it's fine: it reads back a rule, calls the student "Chotu", or (once
         * finished, [asked] given) mostly repeats their own message back to them. A short greeting reply is fine.
         */
        internal fun badReply(reply: String, asked: String?): String? {
            val r = words(reply)
            if (r.isEmpty()) return null
            val flat = r.joinToString(" ")
            if (RULE_SENTENCES.any { rule -> flat.contains(rule) || (rule.contains(flat) && r.size >= 5) }) return "reads back its rules"
            val name = Regex.escape(Brand.MASCOT_SHORT)
            if (Regex("(,\\s*$name\\b|\\b(hi|hey|hello|dear|you're|you are|ok|okay)\\s+$name\\b)", RegexOption.IGNORE_CASE).containsMatchIn(reply)) {
                return "calls the student ${Brand.MASCOT_SHORT}"
            }
            if (asked != null) {
                val a = words(asked)
                if (a.size >= 3) {
                    // Most of the reply is the student's own words, or it opens by repeating their whole message.
                    val theirs = r.count { it in a.toSet() }
                    if (flat.startsWith(a.joinToString(" ")) || (r.size <= a.size + 6 && theirs * 3 >= r.size * 2)) return "repeats the student"
                }
            }
            return null
        }

        /**
         * Why a reply has nothing to do with what was asked, or null: it switches to Chinese, Japanese or Korean
         * script the person didn't use, or it opens a maths-style "We are given…" walk-through. That's what a
         * garbled model writes, and it's thrown away like a loop.
         */
        internal fun offTask(reply: String, asked: String): String? {
            if (FOREIGN_SCRIPT.containsMatchIn(reply) && !FOREIGN_SCRIPT.containsMatchIn(asked)) return "switches script"
            if (WALKTHROUGH.containsMatchIn(reply) && !WALKTHROUGH.containsMatchIn(asked)) return "off-topic walk-through"
            return null
        }

        private val FOREIGN_SCRIPT = Regex("""[\p{IsHan}\p{IsHiragana}\p{IsKatakana}\p{IsHangul}]""")
        private val WALKTHROUGH = Regex("""(?i)\b(we are given|understanding the problem|we need to (analy[sz]e|determine|find))\b""")

        /**
         * A reply that's stuck: a line it already wrote (20+ characters) comes again, the same run of text
         * repeats, or it's mostly empty lines. Checked on the text before [clean] hides the blank lines.
         */
        internal fun looping(raw: String): Boolean {
            // Four or more empty lines in a row, or a longer reply that's mostly blank.
            if (Regex("\n([ \t]*\n){4,}").containsMatchIn(raw)) return true
            if (raw.length > 200 && raw.count { !it.isWhitespace() } < raw.length / 4) return true
            // A finished line (not the one still being written) that already appeared.
            val done = raw.lines().dropLast(1).map { it.trim() }.filter { it.length >= 20 }
            if (done.size != done.toSet().size) return true
            // The same 60 characters twice, for loops that never start a new line.
            val flat = raw.replace(Regex("\\s+"), " ")
            if (flat.length >= 160 && flat.dropLast(60).contains(flat.takeLast(60))) return true
            return false
        }

        const val WORK = "chotu-model"
        private const val TAG = "Chotu"
        /** How long the phone's model gets to start answering before online Chotu takes over. */
        private const val FIRST_WORD_MS = 45_000L
        /** About 150 tokens: a Talk reply is up to four short sentences, with room to finish the last one. */
        private const val TALK_TOKENS = 150
        const val STUCK = "Sorry, I got stuck. Try again, or start a new chat."
        const val CARE_TAG = "[CARE]"
        const val CARE_REPLY = "That sounds really heavy, and I'm only an AI. Please talk to a person now: Tele-MANAS is free and confidential, any time, on 14416."
        const val OFFLINE_REPLY = "I'm offline right now, so I can't answer yet. Ask again when you're connected, or make me work offline (the button above)."
        const val CLOUD_TROUBLE = "I couldn't reach the server just now. Try again in a minute."
        const val CANT_CHECK = "Couldn't check for offline ${Brand.MASCOT_SHORT} just now. Try again when you're online."
        const val NO_SERVER = "Set your pod server in My Path first; ${Brand.MASCOT_SHORT}'s model downloads from there."

        /**
         * The phone's rules, kept to a few lines for a small model, and written so that no line makes sense as a
         * reply on its own (small models sometimes repeat a rule back). The fuller rules live on the server.
         */
        private val CHAT_RULES = """
            You are ${Brand.MASCOT_SHORT}, the AI study buddy in an app for UPSC aspirants in India.
            The person writing to you is a student preparing for UPSC; you are ${Brand.MASCOT_SHORT}, and you never call them ${Brand.MASCOT_SHORT}.
            Answer their latest message directly in 1 to 4 short, warm sentences, in the same language and script they wrote in (Hinglish stays in Roman letters).
            Write plain sentences only, with no headings, lists, steps or markdown symbols.
            For study questions give the key fact simply; when you are unsure of a fact, tell them to check NCERT.
            Feeling tired, low or unmotivated is normal during preparation: be kind and give one small next step.
            Only if their message itself says they want to die, end their life or hurt themselves, your whole reply is $CARE_TAG.
        """.trimIndent()

        private val EXPLAIN_RULES = """
            You are ${Brand.MASCOT_SHORT}, the AI study buddy in an app for UPSC aspirants in India.
            The student sends you a news card; re-explain it in at most 5 short, simple sentences with one everyday example.
            Use only facts in the card, in the card's language, neutral on politics.
        """.trimIndent()

        @Volatile private var instance: Chotu? = null
        fun get(context: Context): Chotu = instance ?: synchronized(this) {
            instance ?: Chotu(context.applicationContext).also { instance = it }
        }
    }
}

/**
 * Downloads the model from our pod server, resuming where it stopped (HTTP Range), following redirects
 * (R2 or a CDN later), then checks the size and SHA-256 before keeping it. Ordinary background work, not a
 * foreground service (so no Play declaration): when Android stops it (about 10 minutes at a time), it retries and
 * picks up from the .part file. A plain progress notification shows when notifications are allowed. Short network blips are retried here; anything that
 * won't fix itself fails with a sentence the person can act on, so the screen never sits on
 * "waiting" forever.
 */
class ModelDownloadWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    private val http = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()
    private val json = Json { ignoreUnknownKeys = true }

    private class Fatal(val why: String) : Exception(why)

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val m = runCatching { json.decodeFromString(ModelSpec.serializer(), inputData.getString("spec")!!) }.getOrNull()
            ?: return@withContext Result.failure(workDataOf("why" to "The download request was incomplete. Try again."))
        val base = inputData.getString("base").orEmpty()
        val url = if (m.url.startsWith("http")) m.url else base.trimEnd('/') + m.url
        val wifiOnly = inputData.getBoolean("wifiOnly", true)
        val dir = File(applicationContext.filesDir, "models").apply { mkdirs() }
        val part = File(dir, "${m.fileName}.part")
        val dest = File(dir, m.fileName)
        if (dir.usableSpace < m.bytes - part.length() + 200_000_000) {
            return@withContext fail("Not enough free space: ${m.sizeLabel} is needed. Free some space and try again.")
        }
        note(m, part.length(), wifiOnly)

        // A few quick tries for blips, resuming each time; then hand back to WorkManager to wait for a network.
        var lastError = ""
        for (attempt in 0 until 4) {
            try {
                fetch(m, url, part, wifiOnly)
                if (isStopped) return@withContext Result.retry() // Android's time limit; resumes from the .part file
                break
            } catch (e: Fatal) {
                return@withContext fail(e.why)
            } catch (e: java.io.IOException) {
                lastError = e.message ?: e.javaClass.simpleName
                if (attempt == 3) {
                    return@withContext if (runAttemptCount < 40) Result.retry()
                    else fail("The download keeps dropping. Check the connection and tap Try again; it picks up where it stopped.")
                }
                delay(2000L shl attempt)
            }
        }

        if (part.length() != m.bytes) {
            if (part.length() > m.bytes) part.delete()
            return@withContext fail("The download ended at ${part.length() / 1_000_000} of ${m.bytes / 1_000_000} MB. Tap Try again to resume.")
        }
        setProgress(workDataOf("done" to m.bytes, "verifying" to true))
        if (sha256(part) != m.sha256) {
            part.delete()
            return@withContext fail("The file didn't match its checksum, so it was deleted. Tap Try again to download it fresh.")
        }
        if (!part.renameTo(dest)) return@withContext fail("Couldn't save the model. Free some space and try again.")
        clearNote()
        Result.success()
    }

    /** One request: from wherever the .part file ends to the end of the file. */
    private suspend fun fetch(m: ModelSpec, url: String, part: File, wifiOnly: Boolean) {
        val from = part.length()
        if (from == m.bytes) return
        val req = Request.Builder().url(url).header("Accept", "application/octet-stream").apply { if (from > 0) header("Range", "bytes=$from-") }.build()
        val call = http.newCall(req)
        call.execute().use { r ->
            when {
                r.code == 416 -> { part.delete(); throw java.io.IOException("server refused the resume point") }
                r.code == 404 -> throw Fatal("The pod server doesn't have this model file (404). It needs to be put on the server first.")
                r.code == 401 || r.code == 403 -> throw Fatal("The download link was refused (${r.code}).")
                r.code >= 500 -> throw java.io.IOException("server error ${r.code}")
                !r.isSuccessful -> throw Fatal("The download link answered ${r.code}.")
            }
            // A login or error page instead of the file.
            if (r.header("Content-Type").orEmpty().startsWith("text/")) throw Fatal("The download link sent a web page instead of the model file.")
            val append = r.code == 206 && from > 0
            if (!append) part.delete()
            var done = if (append) from else 0L
            var lastShown = 0L
            var lastAt = 0L
            var lastNote = done
            FileOutputStream(part, append).use { out ->
                val input = r.body.byteStream()
                val buf = ByteArray(256 * 1024)
                while (true) {
                    if (isStopped) { call.cancel(); return }
                    currentCoroutineContext().ensureActive()
                    val n = input.read(buf)
                    if (n < 0) break
                    out.write(buf, 0, n)
                    done += n
                    val now = System.currentTimeMillis()
                    if (done - lastShown > 2_000_000 && now - lastAt > 500) {
                        lastShown = done
                        lastAt = now
                        setProgress(workDataOf("done" to done))
                        if (done - lastNote > 50_000_000) { lastNote = done; note(m, done, wifiOnly) }
                    }
                }
            }
        }
    }

    private fun fail(why: String): Result { clearNote(); return Result.failure(workDataOf("why" to why)) }

    private fun sha256(f: File): String {
        val md = MessageDigest.getInstance("SHA-256")
        f.inputStream().use { s ->
            val buf = ByteArray(1 shl 20)
            while (true) { val n = s.read(buf); if (n < 0) break; md.update(buf, 0, n) }
        }
        return md.digest().joinToString("") { "%02x".format(it) }
    }

    /** A plain, silent progress notification; skipped when notifications aren't allowed. */
    private fun note(m: ModelSpec, done: Long, wifiOnly: Boolean) {
        val nm = NotificationManagerCompat.from(applicationContext)
        nm.createNotificationChannel(NotificationChannelCompat.Builder(CHANNEL, NotificationManagerCompat.IMPORTANCE_LOW).setName("${Brand.MASCOT_SHORT} download").build())
        val pct = (done * 100 / m.bytes).toInt()
        val n = NotificationCompat.Builder(applicationContext, CHANNEL)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("Downloading ${Brand.MASCOT_SHORT}")
            .setContentText("${m.sizeLabel} · ${if (wifiOnly) "Wi-Fi only" else "any network"} · $pct%")
            .setProgress(100, pct, false)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .build()
        try { nm.notify(NOTE_ID, n) } catch (_: SecurityException) { /* notifications not allowed: the Chotu screen still shows progress */ }
    }

    private fun clearNote() = NotificationManagerCompat.from(applicationContext).cancel(NOTE_ID)

    private companion object {
        const val CHANNEL = "chotu-download"
        const val NOTE_ID = 4416
    }
}
