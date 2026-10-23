package com.upscpods.app.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

@Serializable
data class Announcement(
    val id: String,
    val title: String,
    val body: String = "",
    val link: String? = null,
    /** "info" or "important". */
    val level: String = "info",
)

/** A UPSC result day the admin set. Result-day mode runs for 72 hours from the start of it (IST). */
@Serializable
data class ResultDay(val day: String, val label: String = "")

/** /config's sign-in block: "dev" (local test server), "firebase", or "unconfigured"; and whether sign-in is required yet. */
@Serializable
/** [password]: the server offers username and password sign-in (the password_login flag), next to Google. */
data class AuthConfig(val mode: String = "unconfigured", val required: Boolean = true, val support: String? = null, val password: Boolean = false)

/** Open rooms until the sign-up threshold, then matched pods too (server rooms.ts). */
@Serializable
data class PodsMode(val mode: String = "open", val signups: Int = 0, val threshold: Int = 500)

@Serializable
private data class ConfigResponse(
    val flags: Map<String, Boolean> = emptyMap(),
    val announcements: List<Announcement> = emptyList(),
    val distress: List<String> = emptyList(),
    val results: List<ResultDay> = emptyList(),
    val auth: AuthConfig? = null,
    val pods: PodsMode? = null,
)

/**
 * What the admin console has switched on or off, read from the server's /config on every app open.
 * The last answer is kept on the phone, so a switch still holds offline. A flag the phone doesn't know
 * yet counts as on: the server enforces every switch anyway, this only keeps the screens honest.
 */
class AppConfig(context: Context, private val server: () -> String) {
    private val prefs = context.getSharedPreferences("config", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val http = OkHttpClient.Builder().callTimeout(8, TimeUnit.SECONDS).build()

    private var config by mutableStateOf(load())
    private var dismissed by mutableStateOf(prefs.getStringSet("dismissed", emptySet())!!.toSet())

    fun on(flag: String): Boolean = config.flags[flag] ?: true
    val podChat get() = on("pod_chat")
    val podJoin get() = on("pod_join")
    /** Below the sign-up threshold pods are open rooms only; a server that doesn't say is an older one, matched. */
    val podsOpen get() = config.pods?.mode == "open"
    /** Plus is the one flag that counts as off until the server says otherwise. */
    val plus get() = config.flags["plus"] == true

    /**
     * Result-day mode: the result the admin set, while its 72 hours run (worked out on the phone from the
     * cached list, so it holds offline). The member can switch it off for themselves in Me → Privacy.
     */
    val resultNow: ResultDay? get() {
        val ist = java.time.ZoneId.of("Asia/Kolkata")
        val now = java.time.ZonedDateTime.now(ist)
        return config.results.firstOrNull { r ->
            val start = runCatching { java.time.LocalDate.parse(r.day).atStartOfDay(ist) }.getOrNull() ?: return@firstOrNull false
            !now.isBefore(start) && now.isBefore(start.plusHours(72))
        }
    }

    /** The server's sign-in settings, or null before /config has ever loaded (e.g. first open offline). */
    val auth: AuthConfig? get() = config.auth

    /** Live banners the member hasn't closed, newest first. At most one shows at a time. */
    val banner: Announcement? get() = config.announcements.firstOrNull { it.id !in dismissed }

    fun dismiss(id: String) {
        // Only ids that are still live are kept, so the set never grows without end.
        dismissed = (dismissed + id).filter { d -> config.announcements.any { it.id == d } }.toSet()
        prefs.edit().putStringSet("dismissed", dismissed).apply()
    }

    suspend fun refresh() = withContext(Dispatchers.IO) {
        val base = server()
        if (base.isBlank()) return@withContext
        runCatching {
            http.newCall(Request.Builder().url("$base/config").build()).execute().use { r ->
                if (!r.isSuccessful) return@use
                val text = r.body.string()
                val parsed = json.decodeFromString(ConfigResponse.serializer(), text)
                prefs.edit().putString("last", text).apply()
                DistressMatcher.extra = parsed.distress
                withContext(Dispatchers.Main) { config = parsed }
            }
        }
    }

    private fun load(): ConfigResponse =
        runCatching { json.decodeFromString(ConfigResponse.serializer(), prefs.getString("last", null)!!) }
            .getOrDefault(ConfigResponse())
            .also { DistressMatcher.extra = it.distress }
}
