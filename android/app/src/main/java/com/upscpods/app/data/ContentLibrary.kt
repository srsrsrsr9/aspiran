package com.upscpods.app.data

import android.content.Context
import android.net.ConnectivityManager
import android.os.Build
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.security.MessageDigest

/**
 * Editor-approved content from the server's /library: explainers, timelines, games, quiz nights,
 * maps, numbers, myths, two sides, lamp off and soundscapes. Cached on the phone so it opens
 * offline; files (SVGs, sounds) are fetched once and kept. Hindi text is only present when a
 * Hindi editor approved it, so every reader falls back to English.
 */
class ContentLibrary(private val context: Context, private val server: () -> String) {
    var items by mutableStateOf<List<LibraryItem>>(emptyList())
        private set

    private val http = OkHttpClient()
    private val cache = File(context.filesDir, "library.json")
    private val mediaDir = File(context.filesDir, "media").apply { mkdirs() }
    private val lock = Mutex()

    suspend fun refresh() = withContext(Dispatchers.IO) {
        if (items.isEmpty()) runCatching { items = parse(cache.readText()) }
        val base = server()
        if (base.isBlank()) return@withContext
        runCatching {
            http.newCall(Request.Builder().url("$base/library").build()).execute().use { r ->
                if (!r.isSuccessful) return@use
                val text = r.body.string()
                items = parse(text)
                cache.writeText(text)
            }
        }
    }

    private fun parse(text: String): List<LibraryItem> =
        JSON.decodeFromString(LibraryResponse.serializer(), text).items

    fun <T> all(kind: String, serializer: KSerializer<T>): List<Pair<LibraryItem, T>> =
        items.filter { it.kind == kind }.mapNotNull { item ->
            runCatching { item to JSON.decodeFromJsonElement(serializer, item.data) }.getOrNull()
        }

    fun explainers() = all("explainer", Explainer.serializer())
    fun sounds() = all("sound", Sound.serializer()).map { it.second }
    fun lampOff() = all("winddown", Winddown.serializer()).firstOrNull()?.second

    /** The "Watch 1 min" explainer for a card, matched on its lens chips. */
    fun explainerFor(card: NewsItem): Explainer? {
        val chips = (card.chips + card.staticLink).map { it.trim().lowercase() }.toSet()
        return explainers().map { it.second }.firstOrNull { ex ->
            (ex.linkedFromChips + listOfNotNull(ex.staticLink)).any { it.trim().lowercase() in chips }
        }
    }

    /** A server file (path like /media/pack/x.svg), downloaded once. Null when offline and not cached. */
    suspend fun file(path: String): File? = withContext(Dispatchers.IO) {
        lock.withLock {
            val name = sha(path) + "." + path.substringAfterLast('.', "bin")
            val f = File(mediaDir, name)
            if (f.exists() && f.length() > 0) return@withLock f
            val base = server()
            if (base.isBlank() || !path.startsWith("/media/")) return@withLock null
            runCatching {
                http.newCall(Request.Builder().url(base + path).build()).execute().use { r ->
                    if (!r.isSuccessful) return@use null
                    val tmp = File(mediaDir, "$name.part")
                    tmp.outputStream().use { out -> r.body.byteStream().copyTo(out) }
                    tmp.renameTo(f)
                    f
                }
            }.getOrNull()
        }
    }

    /** Opus .ogg plays from Android 10; older phones get the AAC .m4a of the same sound. */
    suspend fun audio(path: String?): File? {
        if (path == null) return null
        val pick = if (Build.VERSION.SDK_INT < 29 && path.endsWith(".ogg")) path.removeSuffix(".ogg") + ".m4a" else path
        return file(pick)
    }

    /** In data saver, skip pictures and sound: the text is complete without them. */
    fun dataSaver(): Boolean {
        val cm = context.getSystemService(ConnectivityManager::class.java) ?: return false
        return cm.restrictBackgroundStatus == ConnectivityManager.RESTRICT_BACKGROUND_STATUS_ENABLED
    }

    fun forget() {
        items = emptyList()
        cache.delete()
        mediaDir.listFiles()?.forEach { it.delete() }
    }

    private fun sha(s: String) = MessageDigest.getInstance("SHA-256").digest(s.toByteArray())
        .joinToString("") { "%02x".format(it) }.take(24)

    companion object {
        val JSON = Json { ignoreUnknownKeys = true; coerceInputValues = true }
    }
}

@Serializable
data class LibraryResponse(val items: List<LibraryItem>)

@Serializable
data class LibraryItem(val id: String, val kind: String, val updatedAt: String = "", val hindi: Boolean = false, val data: JsonObject)

/** One piece of text in English and, once a Hindi editor approved it, Hindi. */
@Serializable
data class Bi<T>(val en: T, val hi: T? = null) {
    fun pick(hindi: Boolean): T = if (hindi) hi ?: en else en
}

@Serializable
data class Check(val checkedBy: String? = null, val checkedOn: String? = null)

@Serializable
data class Review(val en: Check? = null, val hi: Check? = null) {
    fun line(hindi: Boolean): String {
        val c = if (hindi) hi ?: en else en
        return when {
            c?.checkedBy == null -> if (hindi) "अभी किसी संपादक ने नहीं जाँचा" else "Not yet checked by an editor"
            hindi && hi != null -> "${c.checkedBy} ने ${c.checkedOn} को जाँचा ✓"
            else -> "Checked by ${c.checkedBy}, ${c.checkedOn} ✓"
        }
    }
}

// --- Ek Minute explainer --------------------------------------------------------------------

@Serializable
data class Explainer(
    val id: String,
    val title: Bi<String>,
    val staticLink: String? = null,
    val linkedFromChips: List<String> = emptyList(),
    val tone: String = "NEUTRAL",
    val canvas: CanvasSize = CanvasSize(),
    val elements: JsonObject,
    val audio: ExplainerAudio = ExplainerAudio(),
    val scenes: List<Scene>,
    val review: Review = Review(),
) {
    val parts: Map<String, Part>
        get() = elements.filterKeys { it != "tiles" && it != "endCard" }
            .mapNotNull { (k, v) -> runCatching { k to ContentLibrary.JSON.decodeFromJsonElement<Part>(v) }.getOrNull() }.toMap()
    val tiles: List<Tile>
        get() = elements["tiles"]?.let { ContentLibrary.JSON.decodeFromJsonElement<List<Tile>>(it) } ?: emptyList()
    val endCard: EndCard?
        get() = elements["endCard"]?.let { runCatching { ContentLibrary.JSON.decodeFromJsonElement<EndCard>(it) }.getOrNull() }
}

@Serializable
data class CanvasSize(val width: Float = 360f, val height: Float = 400f)

@Serializable
data class ExplainerAudio(val bed: String? = null, val bedGain: Float = 0.7f, val motif: String? = null, val motifAtSeconds: Float? = null)

@Serializable
data class Part(val kind: String, val roof: String? = null, val x: Float, val y: Float, val w: Float, val h: Float? = null, val label: Bi<String>? = null)

@Serializable
data class Tile(val x: Float, val y: Float, val w: Float, val h: Float, val icon: String = "", val label: Bi<String>, val sub: Bi<String>? = null)

@Serializable
data class EndCard(val x: Float, val y: Float, val w: Float, val h: Float, val title: Bi<String>, val subtitle: Bi<String>? = null)

@Serializable
data class Scene(val index: Int = 0, val seconds: Float, val caption: Bi<String>, val frame: Frame)

/** Compiled on the server from the scene's state words; see server/src/content.ts compileScenes. */
@Serializable
data class Frame(
    val parts: Map<String, PartFrame> = emptyMap(),
    val tiles: List<Float> = emptyList(),
    val tileSub: Int = -1,
    val end: Float = 0f,
)

@Serializable
data class PartFrame(val opacity: Float = 1f, val dx: List<Float> = listOf(0f, 0f))

// --- Timeline story --------------------------------------------------------------------------

@Serializable
data class Timeline(val id: String, val title: Bi<String>, val illustration: String? = null, val events: List<TimelineEvent>, val review: Review = Review())

@Serializable
data class TimelineEvent(val date: String, val key: Boolean = false, val en: TitleBody, val hi: TitleBody? = null) {
    fun pick(hindi: Boolean) = if (hindi) hi ?: en else en
}

@Serializable
data class TitleBody(val title: String, val body: String = "")

// --- Match the Article -----------------------------------------------------------------------

@Serializable
data class MatchGame(val id: String, val roundSize: Int = 6, val pairs: List<MatchPair>, val review: Review = Review())

@Serializable
data class MatchPair(val article: String, val en: String, val hi: String? = null) {
    fun pick(hindi: Boolean) = if (hindi) hi ?: en else en
}

// --- Quiz night --------------------------------------------------------------------------------

@Serializable
data class QuizPack(val id: String, val questions: List<Bi<Mcq>>, val review: Review = Review())

// --- Map Chai ----------------------------------------------------------------------------------

@Serializable
data class MapCard(
    val id: String,
    val base: String,
    val canvas: CanvasSize = CanvasSize(320f, 220f),
    val lead: Bi<String>,
    val pins: List<MapPin>,
    val find: MapFind? = null,
    val review: Review = Review(),
)

@Serializable
data class MapPin(val id: String, val x: Float, val y: Float, val en: PinText, val hi: PinText? = null) {
    fun pick(hindi: Boolean) = if (hindi) hi ?: en else en
}

@Serializable
data class PinText(val label: String, val fact: String)

@Serializable
data class MapFind(val prompt: Bi<String>, val target: Ellipse, val hint: Bi<String>, val right: Bi<String>)

@Serializable
data class Ellipse(val cx: Float, val cy: Float, val rx: Float, val ry: Float)

// --- Number Sense ------------------------------------------------------------------------------

@Serializable
data class NumberCard(
    val id: String,
    val value: Double,
    val unit: Bi<String>,
    val lead: Bi<String>,
    val chart: BarChart,
    val whatItMeans: Bi<List<String>>,
    val sources: Bi<String>? = null,
    val review: Review = Review(),
)

@Serializable
data class BarChart(val axisStart: Float, val axisEnd: Float, val reference: Float? = null, val animateMs: Int = 400, val bars: List<Bar>)

@Serializable
data class Bar(val en: String, val hi: String? = null, val v: Float, val hero: Boolean = false) {
    fun pick(hindi: Boolean) = if (hindi) hi ?: en else en
}

// --- Myth vs Fact ------------------------------------------------------------------------------

@Serializable
data class MythCard(
    val id: String,
    val verdictLabels: Bi<Map<String, String>>,
    val claims: List<Claim>,
    val source: Bi<String>? = null,
    val review: Review = Review(),
)

@Serializable
data class Claim(val verdict: String, val en: ClaimText, val hi: ClaimText? = null) {
    fun pick(hindi: Boolean) = if (hindi) hi ?: en else en
}

@Serializable
data class ClaimText(val claim: String, val correction: String)

// --- Two Sides ---------------------------------------------------------------------------------

@Serializable
data class TwoSides(
    val id: String,
    val paper: String = "",
    val question: Bi<String>,
    @SerialName("for") val pro: Bi<List<String>>,
    val against: Bi<List<String>>,
    val outline: Bi<List<String>>,
    val sources: Bi<String>? = null,
    val review: Review = Review(),
)

// --- Lamp Off and soundscapes ------------------------------------------------------------------

@Serializable
data class Winddown(val id: String, val seconds: Int = 120, val audio: WinddownAudio = WinddownAudio(), val text: Bi<WinddownText>)

@Serializable
data class WinddownAudio(val file: String? = null, val gain: Float = 0.45f)

@Serializable
data class WinddownText(val start: String, val cue: String, val button: String, val end: String)

@Serializable
data class Sound(val id: String, val name: Bi<String>, val about: Bi<String>, val seconds: Int = 36, val files: SoundFiles)

@Serializable
data class SoundFiles(val ogg: String? = null, val m4a: String? = null) {
    val best: String? get() = if (Build.VERSION.SDK_INT >= 29) ogg ?: m4a else m4a ?: ogg
}

// --- Sound effects -----------------------------------------------------------------------------

/** A sound effect the server resolved for an item ("stamp", "bed", ...). Tragic items carry none. */
@Serializable
data class SoundRef(val ogg: String? = null, val m4a: String? = null, val gain: Float = 0.5f, val loop: Boolean = false) {
    val best: String? get() = if (Build.VERSION.SDK_INT >= 29) ogg ?: m4a else m4a ?: ogg
}

// --- Scratch and reveal ------------------------------------------------------------------------

@Serializable
data class ScratchCard(val id: String, val tone: String = "NEUTRAL", val title: Bi<String>, val cards: List<Bi<ScratchText>>,
    val sounds: Map<String, SoundRef> = emptyMap(), val sources: Bi<String>? = null, val review: Review = Review())

@Serializable
data class ScratchText(val tease: String, val answer: String, val detail: String = "")

// --- Stamp trail -------------------------------------------------------------------------------

@Serializable
data class StampTrail(val id: String, val tone: String = "NEUTRAL", val title: Bi<String>, val item: Bi<String>, val stations: List<Bi<Station>>,
    val takeaway: Bi<String>? = null, val sounds: Map<String, SoundRef> = emptyMap(), val sources: Bi<String>? = null, val review: Review = Review())

@Serializable
data class Station(val name: String, val stamp: String, val rule: String = "")

// --- Chai stall radio --------------------------------------------------------------------------

@Serializable
data class Radio(val id: String, val tone: String = "NEUTRAL", val title: Bi<String>, val desk: Bi<String>, val stations: List<RadioStation>,
    val signoff: Bi<String>? = null, val sounds: Map<String, SoundRef> = emptyMap(), val sources: Bi<String>? = null, val review: Review = Review())

@Serializable
data class RadioStation(val freq: Float, val en: Bulletin, val hi: Bulletin? = null) {
    fun pick(hindi: Boolean) = if (hindi) hi ?: en else en
}

@Serializable
data class Bulletin(val callsign: String, val lines: List<String>)

// --- Snap together -----------------------------------------------------------------------------

@Serializable
data class Assemble(val id: String, val tone: String = "NEUTRAL", val title: Bi<String>, val prompt: Bi<String>, val pieces: List<Bi<Piece>>,
    val explain: Bi<String>? = null, val sounds: Map<String, SoundRef> = emptyMap(), val sources: Bi<String>? = null, val review: Review = Review())

@Serializable
data class Piece(val text: String, val note: String = "")

// --- Domino effect -----------------------------------------------------------------------------

@Serializable
data class Chain(val id: String, val tone: String = "NEUTRAL", val title: Bi<String>, val links: List<Bi<String>>, val breakIt: Bi<QA>? = null,
    val sounds: Map<String, SoundRef> = emptyMap(), val sources: Bi<String>? = null, val review: Review = Review())

@Serializable
data class QA(val question: String, val answer: String)

// --- Then and now ------------------------------------------------------------------------------

@Serializable
data class ThenNow(val id: String, val tone: String = "NEUTRAL", val title: Bi<String>, val from: Year, val to: Year, val metrics: List<Metric>,
    val takeaway: Bi<String>? = null, val note: Bi<String>? = null, val sounds: Map<String, SoundRef> = emptyMap(),
    val sources: Bi<String>? = null, val review: Review = Review())

@Serializable
data class Year(val year: Int)

@Serializable
data class Metric(val en: LabelUnit, val hi: LabelUnit? = null, val from: Double, val to: Double, val max: Double = 100.0) {
    fun pick(hindi: Boolean) = if (hindi) hi ?: en else en
}

@Serializable
data class LabelUnit(val label: String, val unit: String = "")

// --- Postcards ---------------------------------------------------------------------------------

@Serializable
data class Postcard(val id: String, val tone: String = "NEUTRAL", val place: Bi<String>, val greeting: Bi<String>, val stamp: Bi<String>,
    val scape: String? = null, val facts: Bi<List<String>>, val sounds: Map<String, SoundRef> = emptyMap(),
    val sources: Bi<String>? = null, val review: Review = Review())

// --- Engine types ------------------------------------------------------------------------------

/**
 * The 30 template types (trap spotter, flashcards, bucket sort...) run on nine engines. The server
 * turns each into its engine's shape under `play`, so one player per engine covers them all.
 */
@Serializable
data class EngineItem(val id: String, val tone: String = "NEUTRAL", val title: Bi<String>, val play: Play,
    val sounds: Map<String, SoundRef> = emptyMap(), val sources: JsonElement? = null) {
    /** The sources line: most types write { en, hi }; The Hidden Why keeps a list, shown by its own player. */
    fun sourceLine(hindi: Boolean): String? = (sources as? JsonObject)?.let {
        runCatching { ContentLibrary.JSON.decodeFromJsonElement<Bi<String>>(it).pick(hindi) }.getOrNull()
    }
}

/** One shape for all nine engines; each engine reads only its own fields. */
@Serializable
data class Play(
    val engine: String,
    val rounds: List<ChooseRound> = emptyList(),
    val buckets: Bi<List<String>>? = null,
    val items: List<PlayItem> = emptyList(),
    val prompt: Bi<String>? = null,
    val takeaway: Bi<String>? = null,
    val left: Bi<String>? = null,
    val right: Bi<String>? = null,
    val pairs: List<PlayPair> = emptyList(),
    val cards: List<PlayCard> = emptyList(),
    val intro: Bi<String>? = null,
    val outro: Bi<String>? = null,
    val beats: List<PlayBeat> = emptyList(),
    val question: Bi<String>? = null,
    val choices: List<PlayChoice> = emptyList(),
    val a: Bi<String>? = null,
    val b: Bi<String>? = null,
    val heading: Bi<String>? = null,
    val rows: List<PlayRow> = emptyList(),
    val center: Bi<String>? = null,
    val spokes: List<PlaySpoke> = emptyList(),
    val text: Bi<String>? = null,
    val bank: Bi<List<String>>? = null,
    val answers: List<Int> = emptyList(),
    val why: Bi<String>? = null,
    // Picture story (The Hidden Why)
    val image: String? = null,
    val frames: List<PlayFrame> = emptyList(),
    val named: Bi<String>? = null,
    val sayItSmart: Bi<String>? = null,
    val careful: Bi<String>? = null,
    val followUp: PlayFollowUp? = null,
    val useItIn: List<PlayUse> = emptyList(),
    val sources: List<PlaySource> = emptyList(),
)

/** One caption over the tall drawing; focus is [x, y, zoom] on its 360×640 canvas. */
@Serializable
data class PlayFrame(val text: Bi<String>, val focus: List<Float> = listOf(180f, 320f, 1f))

@Serializable
data class PlayFollowUp(val q: Bi<String>, val hint: Bi<String>)

@Serializable
data class PlayUse(val paper: Bi<String>, val text: Bi<String>)

@Serializable
data class PlaySource(val label: String, val verify: Boolean = false)

@Serializable
data class ChooseRound(val prompt: Bi<String>, val clues: Bi<List<String>>? = null, val options: Bi<List<String>>, val answer: Int,
    val why: Bi<String>? = null, val tags: List<Bi<String>> = emptyList())

@Serializable
data class PlayItem(val text: Bi<String>? = null, val bucket: Int = -1, val why: Bi<String>? = null, val label: Bi<String>? = null, val value: Bi<String>? = null)

@Serializable
data class PlayPair(val left: Bi<String>, val right: Bi<String>)

@Serializable
data class PlayCard(val front: Bi<String>, val back: Bi<String>)

@Serializable
data class PlayBeat(val head: Bi<String>, val text: Bi<String>)

@Serializable
data class PlayChoice(val label: Bi<String>, val outcome: Bi<String>, val values: Bi<String>)

@Serializable
data class PlayRow(val label: Bi<String>, val a: Bi<String>, val b: Bi<String>)

@Serializable
data class PlaySpoke(val label: Bi<String>, val link: Bi<String>)

/** Item i of a two-language list, falling back to English when the Hindi list is short. */
fun Bi<List<String>>.at(i: Int, hindi: Boolean): String = (if (hindi) hi?.getOrNull(i) else null) ?: en.getOrNull(i) ?: ""
