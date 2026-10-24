package com.upscpods.app.data

import android.content.Context
import android.net.Uri
import androidx.annotation.OptIn
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheWriter
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import com.upscpods.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.IsoFields
import java.time.temporal.TemporalAdjusters
import java.time.DayOfWeek

/**
 * Cinematic current affairs (W7): each week in a few short vertical scenes (upsc-pods/ca-week@1), from the server's
 * /ca and /ca/<week> (ca.ts). The motion workstream renders them; an editor approves each scene before it goes out.
 * Release builds only ever see approved scenes; debug builds ask a local server for drafts too and tag them DRAFT.
 *
 * Weeks and their manifests are kept on the phone so the shelf opens offline. Scene videos and captions go through one
 * media cache ([CaCache]): what was watched plays again offline, and "Save for offline" fills it ahead of time.
 *
 * Plus scenes are locked on the server too: their files open only with a signed query from /plus/ca-key, which lasts
 * 6 hours and is fetched ([unlock]) before one plays. The cache keys on the path without that query, so a scene kept
 * once still plays after its key runs out, offline included.
 */
class CurrentAffairs(private val context: Context, private val member: () -> String = { "" }, private val server: () -> String) {
    var weeks by mutableStateOf<List<CaWeekSummary>>(emptyList())
        private set

    private val http = OkHttpClient()
    private val authed = OkHttpClient.Builder().addInterceptor(AuthInterceptor).build()
    /** week -> (signed query, when it stops working in ms). In memory only. */
    private val keys = mutableMapOf<String, Pair<String, Long>>()
    private val dir = File(context.filesDir, "ca").apply { mkdirs() }
    private val posters = File(dir, "posters").apply { mkdirs() }
    private val prefs = context.getSharedPreferences("ca", Context.MODE_PRIVATE)
    private val lock = Mutex()
    private val loaded = mutableMapOf<String, CaWeek>()

    /** Watched scenes and quiz answers change what the shelf shows, so the screens read this to recompose. */
    var progress by mutableStateOf(0)
        private set

    private val q get() = if (BuildConfig.DEBUG) "?drafts=1" else ""

    suspend fun refresh() = withContext(Dispatchers.IO) {
        if (weeks.isEmpty()) runCatching { weeks = parseWeeks(File(dir, WEEKS).readText()) }
        val base = server()
        if (base.isBlank()) return@withContext
        runCatching {
            http.newCall(Request.Builder().url("$base/ca$q").build()).execute().use { r ->
                if (!r.isSuccessful) return@use
                val text = r.body.string()
                weeks = parseWeeks(text)
                File(dir, WEEKS).writeText(text)
            }
        }
    }

    /** One week, fresh from the server when it can be reached, else as last seen. Null if never seen and offline. */
    suspend fun week(id: String): CaWeek? = withContext(Dispatchers.IO) {
        val file = File(dir, "$id.json")
        val base = server()
        val fresh = if (base.isBlank()) null else runCatching {
            http.newCall(Request.Builder().url("$base/ca/$id$q").build()).execute().use { r ->
                if (!r.isSuccessful) null else r.body.string().also { file.writeText(it) }
            }
        }.getOrNull()
        val text = fresh ?: runCatching { file.readText() }.getOrNull() ?: return@withContext loaded[id]
        runCatching { visible(ContentLibrary.JSON.decodeFromString(CaWeek.serializer(), text)) }.getOrNull()?.also { loaded[id] = it }
    }

    /** Release builds never show a draft, whatever a server sends. */
    private fun visible(w: CaWeek) = if (BuildConfig.DEBUG) w else w.copy(episodes = w.episodes.filter { !it.draft })

    private fun parseWeeks(text: String) =
        ContentLibrary.JSON.decodeFromString(CaWeekList.serializer(), text).weeks.sortedByDescending { it.week }

    /** A file of the week (video, captions, poster), as a full URL on the server, signed when a Plus key is held. */
    fun url(w: CaWeek, path: String): String =
        server().trimEnd('/') + w.base + path + (keys[w.week]?.takeIf { it.second > System.currentTimeMillis() }?.let { "?" + it.first } ?: "")

    /** Gets (or keeps) the signed key for a week's Plus scenes. False without Plus or offline; cached scenes still play. */
    suspend fun unlock(week: String): Boolean = withContext(Dispatchers.IO) {
        keys[week]?.let { if (it.second > System.currentTimeMillis() + 10 * 60_000) return@withContext true }
        val base = server()
        if (base.isBlank()) return@withContext false
        runCatching {
            authed.newCall(Request.Builder().url("$base/plus/ca-key?member=${Uri.encode(member())}&week=$week").build()).execute().use { r ->
                if (!r.isSuccessful) return@use false
                val o = ContentLibrary.JSON.parseToJsonElement(r.body.string()) as JsonObject
                val query = o["query"]?.jsonPrimitive?.contentOrNull ?: return@use false
                val until = o["expiresAt"]?.jsonPrimitive?.contentOrNull?.let { Instant.parse(it).toEpochMilli() } ?: return@use false
                keys[week] = query to until
                true
            }
        }.getOrDefault(false)
    }

    /** A poster, downloaded once and kept. */
    suspend fun poster(w: CaWeek, path: String?): File? = path?.let { poster(w.base + it) }

    suspend fun poster(path: String): File? = withContext(Dispatchers.IO) {
        lock.withLock {
            val f = File(posters, path.trim('/').replace('/', '_'))
            if (f.exists() && f.length() > 0) return@withLock f
            val base = server()
            if (base.isBlank()) return@withLock null
            runCatching {
                http.newCall(Request.Builder().url(base.trimEnd('/') + path).build()).execute().use { r ->
                    if (!r.isSuccessful) return@use null
                    val tmp = File(posters, f.name + ".part")
                    tmp.outputStream().use { out -> r.body.byteStream().copyTo(out) }
                    tmp.renameTo(f)
                    f
                }
            }.getOrNull()
        }
    }

    fun watched(week: String, id: String) = prefs.getBoolean("w:$week/$id", false)
    fun markWatched(week: String, id: String) { prefs.edit().putBoolean("w:$week/$id", true).apply(); progress++ }

    /** The option picked for a quiz question, or null. */
    fun answer(quizId: String): Int? = prefs.getInt("q:$quizId", -1).takeIf { it >= 0 }
    fun saveAnswer(quizId: String, option: Int) { prefs.edit().putInt("q:$quizId", option).apply(); progress++ }

    fun savedOffline(week: String) = prefs.getBoolean("saved:$week", false)

    /**
     * Fills the media cache with the scenes this member can watch (video and captions) and their posters, so the week
     * plays on a train with no signal. [onProgress] gets 0..1.
     */
    @OptIn(UnstableApi::class)
    suspend fun saveOffline(w: CaWeek, open: (CaEpisode) -> Boolean, onProgress: (Float) -> Unit): Boolean = withContext(Dispatchers.IO) {
        val scenes = w.episodes.filter(open)
        if (scenes.any { !it.free }) unlock(w.week)
        val files = scenes.flatMap { listOfNotNull(it.mp4, it.vtt) }
        var ok = true
        files.forEachIndexed { i, path ->
            ok = ok && runCatching {
                CacheWriter(CaCache.dataSource(context).createDataSource(), DataSpec(Uri.parse(url(w, path))), null) { _, _, _ -> }.cache()
            }.isSuccess
            onProgress((i + 1f) / files.size)
        }
        scenes.forEach { poster(w, it.poster) }
        if (ok) prefs.edit().putBoolean("saved:${w.week}", true).apply()
        progress++
        ok
    }

    companion object {
        private const val WEEKS = "weeks.json"

        /** The weeks as last fetched, for the Sunday ritual nudge (no network from a worker that only needs a count). */
        fun cachedWeeks(context: Context): List<CaWeekSummary> = runCatching {
            ContentLibrary.JSON.decodeFromString(CaWeekList.serializer(), File(File(context.filesDir, "ca"), WEEKS).readText()).weeks
                .sortedByDescending { it.week }
        }.getOrDefault(emptyList())

        /** "13–19 Oct" for an ISO week like 2026-41. */
        fun dates(week: String): String = runCatching {
            val (y, w) = week.split('-').map { it.toInt() }
            val mon = LocalDate.of(y, 6, 1).with(IsoFields.WEEK_OF_WEEK_BASED_YEAR, w.toLong()).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
            val sun = mon.plusDays(6)
            val m = DateTimeFormatter.ofPattern("d MMM")
            if (mon.month == sun.month) "${mon.dayOfMonth}–${sun.format(m)}" else "${mon.format(m)} – ${sun.format(m)}"
        }.getOrDefault(week)
    }
}

/** One media cache for every scene: what plays is kept, LRU, up to 600 MB, in app storage the system doesn't clear. */
@OptIn(UnstableApi::class)
object CaCache {
    private var cache: SimpleCache? = null

    @Synchronized
    fun get(context: Context): SimpleCache = cache ?: SimpleCache(
        File(context.applicationContext.filesDir, "ca-media"),
        LeastRecentlyUsedCacheEvictor(600L * 1024 * 1024),
        StandaloneDatabaseProvider(context.applicationContext),
    ).also { cache = it }

    fun dataSource(context: Context): CacheDataSource.Factory = CacheDataSource.Factory()
        .setCache(get(context))
        .setUpstreamDataSourceFactory(DefaultHttpDataSource.Factory().setAllowCrossProtocolRedirects(false))
        .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
        // A Plus file's signed query changes every few hours; the file doesn't.
        .setCacheKeyFactory { spec -> spec.uri.buildUpon().clearQuery().build().toString() }
}

@Serializable
data class CaWeekList(val weeks: List<CaWeekSummary> = emptyList())

@Serializable
data class CaWeekSummary(
    val week: String,
    val lang: String = "en",
    val generatedAt: String = "",
    val scenes: Int = 0,
    val free: Int = 0,
    val seconds: Double = 0.0,
    val poster: String? = null,
)

@Serializable
data class CaWeek(
    val week: String,
    val lang: String = "en",
    val generatedAt: String = "",
    val weekMp4: String? = null,
    /** The folder the paths below sit in, e.g. /media/ca/2026-41/. */
    val base: String,
    val episodes: List<CaEpisode> = emptyList(),
)

@Serializable
data class CaEpisode(
    val n: Int,
    val id: String,
    val title: String,
    val durationSec: Double = 0.0,
    val mp4: String,
    val vtt: String? = null,
    val poster: String? = null,
    val syllabusNodes: List<String> = emptyList(),
    /** One paper id or a list of them ("prelims-gs", "mains-gs3"). */
    val gsPaper: JsonElement? = null,
    /** Plain names, or { name, url }. */
    val sources: List<JsonElement> = emptyList(),
    val quiz: List<CaQuiz> = emptyList(),
    val free: Boolean = false,
    val review: CaReview = CaReview(),
    /** LIGHT, NEUTRAL or SERIOUS: SERIOUS scenes get no celebration after the quiz. */
    val tone: String = "NEUTRAL",
) {
    val draft get() = review.status != "approved"

    fun papers(): List<String> = when (val p = gsPaper) {
        is JsonArray -> p.mapNotNull { (it as? JsonPrimitive)?.contentOrNull }
        is JsonPrimitive -> listOfNotNull(p.contentOrNull)
        else -> emptyList()
    }

    /** Each source as (name, url or null). */
    fun sourceList(): List<Pair<String, String?>> = sources.mapNotNull { s ->
        when (s) {
            is JsonPrimitive -> s.contentOrNull?.let { it to null }
            is JsonObject -> (s["name"] ?: s["title"])?.jsonPrimitive?.contentOrNull?.let { it to s["url"]?.jsonPrimitive?.contentOrNull }
            else -> null
        }
    }
}

@Serializable
data class CaQuiz(val id: String, val q: String, val options: List<String>, val answerIndex: Int, val why: String = "")

@Serializable
data class CaReview(val status: String = "draft", val note: String? = null)

/** A syllabus place a chip opens: the paper, and the topic when the id names one. */
data class CaNode(val label: String, val paper: String, val topic: String?)

/**
 * The chips under a scene: its syllabus nodes ("gs2-1" is GS2's first topic, "pre-polity" the Prelims polity topic) and
 * its papers ("prelims-gs", "mains-gs3"). Each opens that place in Prep → Syllabus; ids we can't place are left out.
 */
fun caNodes(e: CaEpisode): List<CaNode> {
    val nodes = e.syllabusNodes.mapNotNull { id ->
        val (paper, topic) = syllabusNode(id) ?: return@mapNotNull null
        topic?.let { CaNode(it.name.substringBefore(':').substringBefore(',').trim(), paper.id, it.name) } ?: CaNode(paper.short, paper.id, null)
    }
    val papers = e.papers().mapNotNull { id -> syllabusPaperOf(id)?.let { p ->
        CaNode(if (id.startsWith("prelims") && p.id == "prelims") "Prelims GS" else if (id.startsWith("mains")) "Mains ${p.short}" else p.short, p.id, null)
    } }
    return (nodes + papers).distinctBy { it.paper to it.topic }
}
