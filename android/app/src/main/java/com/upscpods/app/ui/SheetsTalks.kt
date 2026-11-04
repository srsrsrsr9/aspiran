package com.upscpods.app.ui

import android.content.Context
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Button
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.upscpods.app.data.ContentLibrary
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import java.time.LocalDate

// Printable sheets ("printable") and audio lectures ("audio-lecture"). The web copies are viewSheets and viewTalks in
// brief.js. A sheet is read on the phone and printed from the web app; a talk plays its recorded parts in order (only
// when the person presses play) and ends with three quick checks that are never scored.

private val SUBJECTS = linkedMapOf(
    "polity" to "Polity", "economy" to "Economy", "geography" to "Geography", "environment" to "Environment",
    "culture" to "Art and culture", "history" to "History", "ethics" to "Ethics", "csat" to "CSAT",
    "security" to "Internal security", "science" to "Science",
)
private fun subjectName(s: String?) = SUBJECTS[s] ?: (s ?: "More").replaceFirstChar { it.uppercase() }
private fun bySubject(items: List<JsonObject>): List<Pair<String?, List<JsonObject>>> {
    val order = SUBJECTS.keys.toList()
    return items.groupBy { it.str("subject") }.toList().sortedBy { (s, _) -> order.indexOf(s).let { if (it < 0) 99 else it } }
}

/** The English or Hindi side of an item, as the person reads it. */
private fun JsonObject.side(hindi: Boolean): JsonObject = ((if (hindi) this["hi"] else null) as? JsonObject) ?: (this["en"] as? JsonObject) ?: JsonObject(emptyMap())
private fun strings(e: Any?): List<String> = (e as? JsonArray)?.mapNotNull { (it as? JsonPrimitive)?.contentOrNull } ?: emptyList()

@Composable
private fun ListRow(title: String, detail: String, onClick: () -> Unit) = FlatCard(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
    Column(Modifier.padding(12.dp)) {
        Text(title, style = MaterialTheme.typography.titleSmall)
        if (detail.isNotBlank()) Text(detail, style = MaterialTheme.typography.bodySmall)
    }
}

// --- Printable sheets -----------------------------------------------------------------------------------------------

@Composable
private fun SheetTable(head: List<String>, rows: List<List<String>>) {
    // Wide tables scroll sideways inside the card; the page itself never does.
    Column(Modifier.horizontalScroll(rememberScrollState())) {
        val cols = maxOf(head.size, rows.maxOfOrNull { it.size } ?: 0)
        val w = if (cols <= 2) 150.dp else 130.dp
        @Composable fun Line(cells: List<String>, bold: Boolean) = Row(Modifier.padding(vertical = 4.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            cells.forEach { Text(it, Modifier.width(w), style = MaterialTheme.typography.bodyMedium, fontWeight = if (bold) FontWeight.SemiBold else FontWeight.Normal) }
        }
        if (head.isNotEmpty()) { Line(head, true); HorizontalDivider() }
        rows.forEach { Line(it, false); HorizontalDivider() }
    }
}

@Composable
private fun SheetBlock(b: JsonObject) {
    val cap = b.str("caption")
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        if (cap != null) Text(cap, style = MaterialTheme.typography.titleSmall)
        when (b.str("type")) {
            "table" -> SheetTable(strings(b["head"]), (b["rows"] as? JsonArray)?.map { strings(it) } ?: emptyList())
            "timeline" -> SheetTable(emptyList(), b["items"].arr().map { listOf(it.str("when") ?: "", it.str("what") ?: "") })
            "list" -> strings(b["items"]).forEach { Text("•  $it") }
            "compare" -> listOfNotNull(b["left"] as? JsonObject, b["right"] as? JsonObject).forEach { s ->
                Text(s.str("title") ?: "", fontWeight = FontWeight.SemiBold)
                strings(s["points"]).forEach { Text("•  $it") }
            }
            "note" -> Text(b.str("text") ?: "", color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
fun SheetsScreen(library: ContentLibrary, hindi: Boolean, onClose: () -> Unit) {
    val all = remember(library.items) { library.items.filter { it.kind == "printable" }.map { it.data }.sortedBy { it.side(false).str("title") } }
    var open by rememberSaveable { mutableStateOf<String?>(null) }
    val d = all.firstOrNull { it.str("id") == open }
    Page(if (d != null) subjectName(d.str("subject")) else "Printable sheets", { if (open != null) open = null else onClose() }) {
        if (all.isEmpty()) { Text("One-page sheets appear here once an English and a Hindi editor approve them."); return@Page }
        if (d == null) {
            Text("${all.size} one-page sheets: tables, timelines and lists. Read them here; print them from the web app and pin them up.")
            bySubject(all).forEach { (sub, items) ->
                Text(subjectName(sub), style = MaterialTheme.typography.titleMedium)
                items.forEach { x -> ListRow(x.side(hindi).str("title") ?: "", x.side(hindi).str("subtitle") ?: "") { open = x.str("id") } }
            }
            return@Page
        }
        val s = d.side(hindi)
        Text(listOfNotNull(subjectName(d.str("subject")), d.str("paper")).joinToString(" · "), style = MaterialTheme.typography.bodySmall)
        Text(s.str("title") ?: "", style = MaterialTheme.typography.headlineSmall)
        s.str("subtitle")?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
        s["blocks"].arr().forEach { b -> FlatCard(Modifier.fillMaxWidth()) { Column(Modifier.padding(12.dp)) { SheetBlock(b) } } }
        val keep = strings(s["remember"])
        if (keep.isNotEmpty()) FlatCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Remember", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                keep.forEach { Text("•  $it") }
            }
        }
        Text("Cover it, say what you remember, then check.", style = MaterialTheme.typography.bodySmall)
        TextButton(onClick = { open = null }) { Text("All sheets") }
    }
}

// --- Audio lectures -------------------------------------------------------------------------------------------------

/** The recorded parts as one playlist. Nothing plays until Play; leaving the screen stops it. */
@Composable
private fun PartsPlayer(urls: List<String>) {
    val context = LocalContext.current
    val player = remember(urls) { ExoPlayer.Builder(context).build().apply { setMediaItems(urls.map { MediaItem.fromUri(it) }); prepare() } }
    var playing by remember { mutableStateOf(false) }
    var part by remember { mutableIntStateOf(0) }
    var ended by remember { mutableStateOf(false) }
    DisposableEffect(player) {
        val l = object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) { playing = isPlaying }
            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) { part = player.currentMediaItemIndex }
            override fun onPlaybackStateChanged(state: Int) { ended = state == Player.STATE_ENDED }
        }
        player.addListener(l)
        onDispose { player.removeListener(l); player.release() }
    }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Button(onClick = { if (playing) player.pause() else { if (ended) { player.seekTo(0, 0); ended = false }; player.play() } }) { Text(if (playing) "Pause" else "Play") }
        OutlinedButton(onClick = { player.seekBack() }) { Text("Back 10 s") }
        if (part + 1 < urls.size) OutlinedButton(onClick = { player.seekToNextMediaItem() }) { Text("Next part") }
    }
    Text(if (ended) "The end." else "Part ${part + 1} of ${urls.size}", style = MaterialTheme.typography.bodySmall)
}

@Composable
fun TalksScreen(library: ContentLibrary, hindi: Boolean, onClose: () -> Unit) {
    val context = LocalContext.current
    val prefs = context.getSharedPreferences("talks", Context.MODE_PRIVATE)
    val all = remember(library.items) { library.items.filter { it.kind == "audio-lecture" }.map { it.data }.sortedBy { it.side(false).str("title") } }
    var open by rememberSaveable { mutableStateOf<String?>(null) }
    val d = all.firstOrNull { it.str("id") == open }
    fun recording(x: JsonObject, lang: String) = ((x["recording"] as? JsonObject)?.get(lang) as? JsonArray)?.mapNotNull { (it as? JsonPrimitive)?.contentOrNull } ?: emptyList()
    Page(if (d != null) subjectName(d.str("subject")) else "Audio lectures", { if (open != null) open = null else onClose() }) {
        if (all.isEmpty()) { Text("Audio lectures appear here once an English and a Hindi editor approve them."); return@Page }
        if (d == null) {
            Text("${all.size} talks of 10 to 15 minutes, in chapters, each ending with three quick checks. For a walk, the bus or the kitchen.")
            bySubject(all).forEach { (sub, items) ->
                Text(subjectName(sub), style = MaterialTheme.typography.titleMedium)
                items.forEach { x ->
                    val id = x.str("id") ?: ""
                    val detail = listOfNotNull(x.str("minutes")?.let { "$it min" }, if (recording(x, if (hindi) "hi" else "en").isNotEmpty()) "recorded" else "phone voice",
                        prefs.getString(id, null)?.let { "heard" }).joinToString(" · ")
                    ListRow(x.side(hindi).str("title") ?: "", detail) { open = id }
                }
            }
            return@Page
        }
        val lang = if (hindi && d["hi"] is JsonObject) "hi" else "en"
        val s = d.side(lang == "hi")
        val chapters = s["chapters"].arr()
        Text(listOfNotNull(subjectName(d.str("subject")), d.str("paper"), d.str("minutes")?.let { "about $it min" }).joinToString(" · "), style = MaterialTheme.typography.bodySmall)
        Text(s.str("title") ?: "", style = MaterialTheme.typography.headlineSmall)
        s.str("summary")?.let { Text(it) }
        val rec = recording(d, lang).map { library.url(it) }
        FlatCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Listen", style = MaterialTheme.typography.titleSmall)
                if (rec.isNotEmpty()) {
                    Text("Recorded voice. Earphones in, or play it on a walk.", style = MaterialTheme.typography.bodySmall)
                    PartsPlayer(rec)
                } else {
                    Text("Not recorded yet, so the phone's voice reads it.", style = MaterialTheme.typography.bodySmall)
                    ReadAloudButton(chapters.joinToString("\n") { (it.str("title") ?: "") + ".\n" + (it.str("script") ?: "") })
                }
            }
        }
        var readAlong by rememberSaveable(open) { mutableStateOf(false) }
        TextButton(onClick = { readAlong = !readAlong }) { Text(if (readAlong) "Hide the text" else "Read along · ${chapters.size} chapters") }
        if (readAlong) chapters.forEach { c ->
            Text(c.str("title") ?: "", style = MaterialTheme.typography.titleMedium)
            Text(c.str("script") ?: "", style = if (lang == "hi") ReadingHindi else ReadingText)
        }
        val checks = s["check"].arr()
        if (checks.isNotEmpty()) {
            Text("Three quick checks", style = MaterialTheme.typography.titleMedium)
            Text("After you've listened. Nothing is scored.", style = MaterialTheme.typography.bodySmall)
            val picked = remember(open) { mutableStateMapOf<Int, Int>() }
            checks.forEachIndexed { qi, q ->
                val ans = q.str("answerIndex")?.toIntOrNull()
                val p = picked[qi]
                FlatCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("${qi + 1}. ${q.str("q") ?: ""}", fontWeight = FontWeight.SemiBold)
                        strings(q["options"]).forEachIndexed { i, o ->
                            val mark = when { p == null -> ""; i == ans -> "✓ "; i == p -> "○ "; else -> "" }
                            OutlinedButton(onClick = { if (p == null) picked[qi] = i }, modifier = Modifier.fillMaxWidth(),
                                border = BorderStroke(1.dp, if (p != null && i == ans) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant)) {
                                Text(mark + o, modifier = Modifier.fillMaxWidth())
                            }
                        }
                        if (p != null) Text((if (p == ans) "✓ Right. " else "○ Not quite. ") + (q.str("why") ?: ""))
                    }
                }
            }
            if (picked.size == checks.size) {
                remember(open) { prefs.edit().putString(d.str("id"), LocalDate.now().toString()).apply(); true }
                FlatCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text("That's the talk.", style = MaterialTheme.typography.titleSmall)
                        Text("Say the three ideas you'd keep, aloud, once. Then stop here for today or pick another.")
                    }
                }
                TextButton(onClick = { open = null }) { Text("All talks") }
            }
        }
    }
}
