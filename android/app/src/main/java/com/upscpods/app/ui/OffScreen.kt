@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.upscpods.app.ui

import android.content.Context
import android.print.PrintAttributes
import android.print.PrintManager
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.MockPaper
import com.upscpods.app.data.NewsItem
import com.upscpods.app.data.SyllabusMap
import com.upscpods.app.data.Tone
import com.upscpods.app.data.syllabusNode
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import java.time.LocalDate
import java.util.Locale

// --- Library JSON: English and Hindi side by side, as bi() in app.js ---------------------------------------------

/** A plain string, or {en, hi}: the Hindi one when asked for and present. */
internal fun JsonElement?.biText(hindi: Boolean): String? = when (this) {
    is JsonPrimitive -> contentOrNull?.takeIf { it.isNotBlank() }
    is JsonObject -> ((if (hindi) this["hi"].biText(false) else null) ?: this["en"].biText(false))
    else -> null
}

/** A list of strings, or {en: [...], hi: [...]}. */
internal fun JsonElement?.biList(hindi: Boolean): List<String> = when (this) {
    is JsonArray -> mapNotNull { it.biText(hindi) }
    is JsonObject -> ((if (hindi) this["hi"] as? JsonArray else null)?.takeIf { it.isNotEmpty() } ?: this["en"] as? JsonArray)?.mapNotNull { it.biText(hindi) } ?: emptyList()
    else -> emptyList()
}

internal fun JsonElement?.arr(): List<JsonObject> = (this as? JsonArray)?.mapNotNull { it as? JsonObject } ?: emptyList()
internal fun JsonObject.str(k: String) = (this[k] as? JsonPrimitive)?.contentOrNull

// --- Pause lines (content kind "pause-lines"): one quiet line at a first moment ----------------------------------

private val pauseNow = mutableSetOf<String>()

/** Where screens without the library at hand find it: set once by AppRoot. */
object PauseSource { var library: ContentLibrary? = null; var hindi = false }

@Composable
fun PauseLine(key: String) = PauseLine(key, PauseSource.library, PauseSource.hindi)

/** Shown once ever (and for the rest of this visit) at the moment [key] names. Same rule as pauseLine in app.js. */
@Composable
fun PauseLine(key: String, library: ContentLibrary?, hindi: Boolean) {
    val context = LocalContext.current
    val text = remember(key, library?.items) {
        library?.items?.filter { it.kind == "pause-lines" }?.flatMap { it.data["lines"].arr() }?.firstOrNull { it.str("key") == key }
            ?.let { (if (hindi) it["hi"].biText(false) else null) ?: it["en"].biText(false) }
    } ?: return
    val show = remember(key) {
        val prefs = context.getSharedPreferences("pause", Context.MODE_PRIVATE)
        when {
            key in pauseNow -> true
            prefs.contains(key) -> false
            else -> { prefs.edit().putString(key, LocalDate.now().toString()).apply(); pauseNow += key; true }
        }
    }
    if (show) Text(text, style = MaterialTheme.typography.bodyMedium, fontStyle = FontStyle.Italic, color = MaterialTheme.colorScheme.primary)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun Page(title: String, onClose: () -> Unit, content: @Composable () -> Unit) {
    BackHandler(onBack = onClose)
    Scaffold(topBar = { TopAppBar(title = { Text(title) }, navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { content() }
    }
}

// --- Walk mode ------------------------------------------------------------------------------------------------------

private data class WalkStep(val title: String, val kind: String, val say: String)

/**
 * Walk mode: earphones in, the phone's voice names a due topic or reads a Chai card, then waits while you say three
 * points aloud. Starts on Play, moves on only on Next, records nothing. The web copy is viewWalk in app.js.
 */
@Composable
fun WalkScreen(topics: List<Pair<String, String>>, cards: List<NewsItem>, hindi: Boolean, library: ContentLibrary?, onClose: () -> Unit) {
    val context = LocalContext.current
    val steps = remember(topics, cards) {
        topics.take(5).map { (_, name) ->
            WalkStep(name, "Topic", if (hindi) "विषय: $name। इसके बारे में जो तीन बातें याद हैं, बोलकर कहिए।" else "Topic: $name. Say three things you remember about it.")
        } + cards.filter { it.tone != Tone.TRAGIC }.take(5).map { c ->
            val t = c.text(hindi)
            WalkStep(t.headline, "Chai", listOf(t.headline, t.summary).filter { it.isNotBlank() }.joinToString(". ") +
                if (hindi) "। अब इसकी तीन बातें बोलकर कहिए।" else ". Now say three points from that, aloud.")
        }
    }.take(8)
    var i by rememberSaveable { mutableIntStateOf(0) }
    var phase by rememberSaveable { mutableStateOf("ready") }
    var script by rememberSaveable { mutableStateOf<String?>(null) }
    var tts by remember { mutableStateOf<TextToSpeech?>(null) }
    var noVoice by remember { mutableStateOf(false) }
    DisposableEffect(Unit) { onDispose { tts?.stop(); tts?.shutdown() } }

    fun say(engine: TextToSpeech, text: String) {
        val hi = text.any { it in 'ऀ'..'ॿ' }
        if (engine.setLanguage(Locale.forLanguageTag(if (hi) "hi-IN" else "en-IN")) < 0 && engine.setLanguage(Locale.UK) < 0) { noVoice = true; phase = "say"; return }
        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onDone(id: String?) { if (phase == "speaking") phase = "say" }
            @Deprecated("Deprecated in Java") override fun onError(id: String?) { phase = "say" }
        })
        phase = "speaking"
        engine.speak(text.take(TextToSpeech.getMaxSpeechInputLength() - 1), TextToSpeech.QUEUE_FLUSH, null, "walk")
    }
    fun play() {
        val s = steps.getOrNull(i) ?: return
        val engine = tts
        if (engine != null) return say(engine, s.say)
        var made: TextToSpeech? = null
        made = TextToSpeech(context.applicationContext) { status -> if (status == TextToSpeech.SUCCESS) made?.let { say(it, s.say) } else { noVoice = true; phase = "say" } }
        tts = made
    }

    script?.let { id -> return Page("Guided walk", { script = null }) { WalkScriptPage(library, hindi, id) } }
    Page("Walk mode", onClose) {
        PauseLine("walk-mode", library, hindi)
        Text("Put in earphones and walk. The phone's voice reads a card or names a topic, then waits while you say three points out loud. It starts when you tap Play, and moves on only when you tap Next. Nothing is recorded.")
        if (steps.isEmpty()) { Text("Nothing of yours to walk through yet: no topics due and no Chai cards today."); WalkScripts(library, hindi) { script = it }; return@Page }
        if (i >= steps.size) {
            Text("That's the walk.", style = MaterialTheme.typography.titleLarge)
            Text("Saying it aloud is recall. The topics still come back in your review when they're due.")
            Button(onClick = onClose) { Text("Done") }
            WalkScripts(library, hindi) { script = it }
            return@Page
        }
        val s = steps[i]
        Text("${i + 1} of ${steps.size} · ${s.kind}", style = MaterialTheme.typography.labelMedium)
        FlatCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(s.title, style = MaterialTheme.typography.titleMedium)
                when (phase) {
                    "ready" -> Button(onClick = { play() }) { Text("▶ Play") }
                    "speaking" -> Text("Reading aloud…", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    else -> {
                        if (noVoice) Text(s.say, style = MaterialTheme.typography.bodyMedium)
                        Text("Your turn. Say three points aloud. No need to be right; it's the trying that helps.")
                    }
                }
                if (phase != "ready") FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                    OutlinedButton(onClick = { tts?.stop(); play() }) { Text("Again") }
                    Button(onClick = { tts?.stop(); i++; phase = "ready"; if (i < steps.size) play() }) { Text("Next") }
                }
            }
        }
        if (noVoice) Text("This phone has no voice for this language, so the text is shown instead. Add one in Settings → Text-to-speech.", style = MaterialTheme.typography.bodySmall)
        WalkScripts(library, hindi) { script = it }
    }
}

// --- The weekly print set -------------------------------------------------------------------------------------------

private fun esc(v: String) = v.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")

// Held until the print dialog has its document; a WebView that is collected before that prints nothing.
private var printing: WebView? = null

/** Hands [html] to Android's print dialog (print, or save as PDF). */
private fun printHtml(context: Context, title: String, html: String) {
    val web = WebView(context)
    web.webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView, url: String?) {
            (context.getSystemService(Context.PRINT_SERVICE) as PrintManager).print(title, view.createPrintDocumentAdapter(title), PrintAttributes.Builder().build())
            printing = null
        }
    }
    web.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
    printing = web
}

/**
 * Print this week's set: ten things to recall, a mixed CSAT set with the answers on their own page, and your own
 * one-pagers. Opens Android's print dialog. The web copy is viewPrint in app.js.
 */
@Composable
fun PrintScreen(syllabusMap: SyllabusMap, missed: List<String>, papers: List<MockPaper>, hindi: Boolean, library: ContentLibrary?, onClose: () -> Unit) {
    val context = LocalContext.current
    val csat = remember(papers) { papers.filter { it.paper.contains("csat", true) || it.title.contains("csat", true) }.flatMap { p -> p.questions.map { it.en } }.filter { it.options.isNotEmpty() } }
    var recall by rememberSaveable { mutableStateOf(true) }
    var withCsat by rememberSaveable { mutableStateOf(csat.isNotEmpty()) }
    var pagers by rememberSaveable { mutableStateOf(false) }
    Page("Print this week's set", onClose) {
        PauseLine("print-set", library, hindi)
        Text("Some of the best revision happens on paper, on a bus. Pick what goes in, then print or save it as a PDF. A small Aspiran line sits in the footer, so it's fine to share.")
        @Composable fun Pick(on: Boolean, enabled: Boolean, title: String, note: String, set: (Boolean) -> Unit) =
            FlatCard(Modifier.fillMaxWidth().clickable(enabled = enabled) { set(!on) }) {
                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
                    Checkbox(checked = on, onCheckedChange = set, enabled = enabled)
                    Column { Text(title, style = MaterialTheme.typography.titleSmall); Text(note, style = MaterialTheme.typography.bodySmall) }
                }
            }
        Pick(recall, true, "10 things to recall", "Topics coming back this week and questions you missed, one line each, with room to write.") { recall = it }
        Pick(withCsat, csat.isNotEmpty(), "CSAT set, mixed", if (csat.isNotEmpty()) "Ten questions of mixed types, with the answers on a separate last page." else "Opens once checked CSAT questions are in the library.") { withCsat = it }
        Pick(pagers, true, "Your one-pagers", "The notes you wrote when you met each topic, one per page: your own booklet for the last weeks.") { pagers = it }
        Button(onClick = {
            val week = LocalDate.now()
            val nodes = syllabusMap.nodes()
            val names = nodes.filter { (id, n) -> syllabusNode(id)?.second != null && n.due <= week.plusDays(7).toString() }.entries.sortedBy { it.value.due }
                .take(10).mapNotNull { syllabusNode(it.key)?.second?.name }
            val foot = "<footer>Aspiran · aspiran.in · free to print and share · $week</footer>"
            val pages = mutableListOf<String>()
            if (recall) pages += "<section><h1>10 things to recall this week</h1><p class=\"m\">Cover the page below each line and say or write what you remember. Then check in your notes.</p><ol>" +
                ((names + missed.take(10 - names.size)).joinToString("") { "<li>${esc(it)}<div class=\"blank\"></div></li>" }
                    .ifEmpty { "<li>Nothing due yet. Mark topics as met on your syllabus map and they appear here.</li>" }) + "</ol>$foot</section>"
            if (withCsat && csat.isNotEmpty()) {
                val set = csat.shuffled().take(10)
                pages += "<section><h1>CSAT set, mixed</h1><p class=\"m\">Mixed types on purpose: it feels harder, and that's part of why it works. Answers are on the last page.</p><ol>" +
                    set.joinToString("") { q -> "<li><p>${esc(q.question)}</p><ol type=\"a\">${q.options.joinToString("") { "<li>${esc(it)}</li>" }}</ol></li>" } + "</ol>$foot</section>"
                pages += "<section><h1>Answers</h1><ol>" + set.joinToString("") { q -> "<li><b>${"abcd".getOrNull(q.answerIndex) ?: ""}</b> ${esc(q.explanation)}</li>" } + "</ol>$foot</section>"
            }
            if (pagers) {
                val mine = nodes.filter { (id, n) -> n.note.isNotBlank() && syllabusNode(id)?.second != null }
                    .map { (id, n) -> val (p, t) = syllabusNode(id)!!; Triple(t!!.name, p.short, n.note) }
                    .ifEmpty { listOf(Triple("Your one-pagers", "", "When you meet a topic on your syllabus map and write your note, it can be printed here as your own booklet.")) }
                pages += mine.map { (name, paper, note) -> "<section><h1>${esc(name)}</h1><p class=\"m\">${esc(paper)} · your own words</p><div class=\"note\">${esc(note)}</div>$foot</section>" }
            }
            printHtml(context, "Aspiran print set $week", """<!doctype html><html><head><meta charset="utf-8"><style>
                body{font:12pt/1.5 Georgia,"Noto Serif","Noto Serif Devanagari",serif;color:#000;margin:0 auto;max-width:720px;padding:16px}
                h1{font-size:18pt;margin:0 0 4px}.m{color:#444;font-style:italic}section{page-break-after:always}
                .blank{border-bottom:1px dotted #999;height:28px}.note{white-space:pre-wrap}li{margin:6px 0}
                footer{margin-top:24px;font:9pt sans-serif;color:#555}</style></head><body>${pages.joinToString("")}</body></html>""")
        }, enabled = recall || withCsat || pagers) { Text("Print or save as PDF") }
    }
}

// --- Optional subjects (content kind "optional-node") and English–Hindi terms ("terms") -----------------------------

private val OPTIONAL_NAMES = mapOf("geography" to "Geography", "sociology" to "Sociology", "anthropology" to "Anthropology",
    "psir" to "Political Science and IR", "history" to "History", "public-administration" to "Public Administration")
private fun optName(k: String) = OPTIONAL_NAMES[k] ?: k.replace('-', ' ').replaceFirstChar { it.uppercase() }

/** Optional subject: subjects, then each paper's topics, then a topic page. The web copy is viewOptional in app.js. */
@Composable
fun OptionalScreen(library: ContentLibrary, hindi: Boolean, onClose: () -> Unit) {
    val all = remember(library.items) { library.items.filter { it.kind == "optional-node" }.map { it.data }.filter { it.str("optional") != null } }
    var subject by rememberSaveable { mutableStateOf<String?>(null) }
    var nodeId by rememberSaveable { mutableStateOf<String?>(null) }
    val back = { if (nodeId != null) nodeId = null else if (subject != null) subject = null else onClose() }
    fun titleOf(d: JsonObject) = d["title"].biText(hindi) ?: d["onePagerPrompts"].biList(hindi).firstOrNull()?.removeSuffix(".") ?: d.str("id") ?: ""
    val sub = subject
    val d = nodeId?.let { id -> all.firstOrNull { it.str("id") == id } }
    Page(if (d != null) titleOf(d) else sub?.let(::optName) ?: "Optional subject", back) {
        when {
            sub == null -> {
                Text("Topic by topic: why it matters, a note to read, questions to write, and things to recall. The same order as the GS topics.")
                val subjects = all.mapNotNull { it.str("optional") }.distinct().sorted()
                if (subjects.isEmpty()) Text("Optional topics appear here once an editor approves them.")
                subjects.forEach { k ->
                    FlatCard(Modifier.fillMaxWidth().clickable { subject = k }) {
                        Column(Modifier.padding(12.dp)) {
                            Text(optName(k), style = MaterialTheme.typography.titleSmall)
                            Text("${all.count { it.str("optional") == k }} topics so far", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
            d == null -> {
                val mine = all.filter { it.str("optional") == sub }.sortedWith(compareBy({ (it["paper"] as? JsonPrimitive)?.intOrNull ?: 0 }, { it.str("id") }))
                OptionalOrder(library, hindi, sub, mine.mapNotNull { it.str("id") }.toSet()) { nodeId = it }
                listOf(1, 2).forEach { p ->
                    val ofPaper = mine.filter { (it["paper"] as? JsonPrimitive)?.intOrNull == p }
                    if (ofPaper.isNotEmpty()) Text("Paper $p", style = MaterialTheme.typography.titleMedium)
                    ofPaper.forEach { n ->
                        FlatCard(Modifier.fillMaxWidth().clickable { nodeId = n.str("id") }) {
                            Column(Modifier.padding(12.dp)) {
                                Text(titleOf(n), style = MaterialTheme.typography.titleSmall)
                                Text("${n["practiceQuestions"].arr().size} questions · ${n["recall"].arr().size} to recall", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
            else -> OptionalTopic(d, sub, hindi, library)
        }
    }
}

@Composable
private fun OptionalTopic(d: JsonObject, subject: String, hindi: Boolean, library: ContentLibrary) {
    @Composable fun Block(title: String, content: @Composable () -> Unit) = FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) { Text(title, style = MaterialTheme.typography.titleSmall); content() }
    }
    Text("${optName(subject)} · Paper ${d.str("paper") ?: ""}", style = MaterialTheme.typography.labelMedium)
    PauseLine("pyq-first", library, hindi)
    val qs = d["practiceQuestions"].arr()
    if (qs.isNotEmpty()) Block("What they ask") {
        qs.forEach { q ->
            val pyq = (q["isPYQ"] as? JsonPrimitive)?.contentOrNull == "true"
            Text(q["q"].biText(hindi) ?: "", style = MaterialTheme.typography.bodyMedium)
            Text("${q.str("marks") ?: "?"} marks, ${q.str("words") ?: "?"} words${if (pyq) " · past paper" else ""}", style = MaterialTheme.typography.labelSmall)
        }
        Text("Write one on paper, then mark it yourself in Answer Studio.", style = MaterialTheme.typography.bodySmall)
    }
    d["why"].biText(hindi)?.let { Block("Why it matters") { Text(it) } }
    d["note"].biText(hindi)?.let { note -> Block("The note") { Text(note, style = if (hindi) ReadingHindi else ReadingText); ReadAloudButton(note) } }
    d["diagram"].biText(hindi)?.let { Block("Draw this") { Text(it) } }
    d["thinkers"].arr().takeIf { it.isNotEmpty() }?.let { ts -> Block("Thinkers") { ts.forEach { t -> Text("${t.str("name") ?: ""}: ${t["idea"].biText(hindi) ?: ""}") } } }
    d["examples"].arr().takeIf { it.isNotEmpty() }?.let { xs -> Block("Examples to use") { xs.forEach { x -> Text((x.biText(hindi) ?: "") + (x.str("source")?.let { " ($it)" } ?: "")) } } }
    d["recall"].arr().takeIf { it.isNotEmpty() }?.let { rs ->
        Block("Recall: say it, then check") {
            rs.forEach { r ->
                var open by remember { mutableStateOf(false) }
                Text(r["q"].biText(hindi) ?: "", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.clickable { open = !open })
                if (open) Text(r["a"].biText(hindi) ?: "", style = MaterialTheme.typography.bodySmall) else Text("Tap to check", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, modifier = Modifier.clickable { open = true })
            }
        }
    }
    d["onePagerPrompts"].biList(hindi).takeIf { it.isNotEmpty() }?.let { ps ->
        Block("Your one-pager, from memory") {
            PauseLine("one-pager-memory", library, hindi)
            ps.forEachIndexed { i, p -> Text("${i + 1}. $p") }
        }
    }
}

/** English–Hindi terms with a one-line meaning, searchable in either language. The web copy is viewTerms in app.js. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TermsScreen(library: ContentLibrary, hindi: Boolean, onClose: () -> Unit) {
    val lists = remember(library.items) { library.items.filter { it.kind == "terms" }.map { it.data }.filter { it["terms"].arr().isNotEmpty() } }
    var subject by rememberSaveable { mutableStateOf("") }
    var q by rememberSaveable { mutableStateOf("") }
    Page("English–Hindi terms", onClose) {
        PauseLine("hindi-medium", library, hindi)
        Text("The words examiners expect, in both languages, with a one-line meaning. Useful whichever medium you write in.")
        if (lists.size > 1) FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = subject.isEmpty(), onClick = { subject = "" }, label = { Text("All") })
            lists.mapNotNull { it.str("subject") }.forEach { s -> FilterChip(selected = subject == s, onClick = { subject = s }, label = { Text(s.replace('-', ' ')) }) }
        }
        OutlinedTextField(value = q, onValueChange = { q = it }, placeholder = { Text("Search in English or Hindi") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        val needle = q.trim().lowercase()
        val rows = lists.filter { subject.isEmpty() || it.str("subject") == subject }.flatMap { it["terms"].arr() }.filter { t ->
            needle.isEmpty() || listOf(t.str("en"), t.str("hi"), t.str("hiAlt"), t["meaning"].biText(false), t["meaning"].biText(true)).any { it?.lowercase()?.contains(needle) == true }
        }
        if (rows.isEmpty()) Text(if (lists.isEmpty()) "Term lists appear here once an editor approves them." else "No term matches.")
        rows.take(300).forEach { t ->
            FlatCard(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp)) {
                    Row { Text(t.str("en") ?: "", style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f)); Text((t.str("hi") ?: "") + (t.str("hiAlt")?.let { " / $it" } ?: ""), style = MaterialTheme.typography.titleSmall) }
                    t["meaning"].biText(hindi)?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                }
            }
        }
    }
}
