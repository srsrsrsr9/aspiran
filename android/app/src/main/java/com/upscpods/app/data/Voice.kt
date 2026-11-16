package com.upscpods.app.data

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/**
 * One thing to hear: a scripted line by key ([line], with [lang] "en" or "hi"), or a reply the server signed for this
 * member ([text] exactly as the server sent it, with its [sig]). The server speaks nothing else (server voice.ts).
 */
data class VoiceAsk(val who: String, val line: String? = null, val lang: String = "en", val text: String? = null, val sig: String? = null) {
    val ok get() = line != null || (!text.isNullOrBlank() && !sig.isNullOrBlank())
    val key: String get() = MessageDigest.getInstance("SHA-256").digest("$who|$line|$lang|$text".toByteArray()).joinToString("") { "%02x".format(it) }.take(40)
}

/**
 * "Listen": Chotu's and Jeetu's AI voices (Fish Audio, through the server's POST /voice). Plays only when tapped,
 * never by itself; a second tap stops it; one voice at a time. A line heard once is kept in the app's cache folder,
 * so hearing it again needs no network. Off unless the server's /config says voices are on.
 */
object Voice {
    /** Set by the app on every composition: /config says voices are on, the flag is on, and it isn't result week. */
    var enabled by mutableStateOf(false)
    var server: () -> String = { "" }

    /** The line being fetched, and the line playing now (by [VoiceAsk.key]). */
    var loading by mutableStateOf<String?>(null); private set
    var playing by mutableStateOf<String?>(null); private set
    /** One plain sentence when a voice couldn't be had; shown under the button that asked. */
    var trouble by mutableStateOf<Pair<String, String>?>(null); private set

    private val http = OkHttpClient.Builder().connectTimeout(8, TimeUnit.SECONDS).readTimeout(60, TimeUnit.SECONDS).addInterceptor(AuthInterceptor).build()
    private val json = Json { ignoreUnknownKeys = true }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var player: MediaPlayer? = null

    fun stop() {
        player?.runCatching { stop(); release() }
        player = null; playing = null
    }

    /** Tap: play this line, or stop it if it is the one playing. */
    fun toggle(context: Context, ask: VoiceAsk) {
        if (!enabled || !ask.ok) return
        val key = ask.key
        if (playing == key) { stop(); return }
        if (loading != null) return
        stop(); trouble = null
        val file = File(File(context.cacheDir, "voice").apply { mkdirs() }, "$key.mp3")
        scope.launch {
            if (!file.exists() || file.length() < 200) {
                loading = key
                val why = withContext(Dispatchers.IO) { fetch(ask, file) }
                loading = null
                if (why != null) { trouble = key to why; return@launch }
            }
            runCatching {
                player = MediaPlayer().apply {
                    setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                    setDataSource(file.absolutePath)
                    setOnCompletionListener { if (playing == key) stop() }
                    prepare(); start()
                }
                playing = key
            }.onFailure { file.delete(); stop(); trouble = key to "The voice couldn't be played." }
        }
    }

    /** Null when the MP3 is in [file]; otherwise a sentence to show. */
    private fun fetch(ask: VoiceAsk, file: File): String? = runCatching {
        val body = buildJsonObject {
            put("who", ask.who)
            if (ask.line != null) { put("line", ask.line); put("lang", ask.lang) } else { put("text", ask.text); put("sig", ask.sig) }
        }
        http.newCall(Request.Builder().url("${server()}/voice").post(body.toString().toRequestBody("application/json".toMediaType())).build()).execute().use { r ->
            if (r.isSuccessful && r.header("content-type")?.startsWith("audio/") == true) {
                val tmp = File(file.parentFile, file.name + ".part")
                tmp.outputStream().use { out -> r.body.byteStream().copyTo(out) }
                if (tmp.length() < 200 || !tmp.renameTo(file)) { tmp.delete(); "The voice couldn't be made just now." } else null
            } else runCatching { json.parseToJsonElement(r.body.string()).jsonObject["error"]?.jsonPrimitive?.content }.getOrNull() ?: "The voice couldn't be made just now."
        }
    }.getOrElse { "The voice needs a connection." }
}
