package com.upscpods.app.ui

import android.content.Context
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Bi
import com.upscpods.app.data.Community
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.Practice
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromJsonElement
import java.time.LocalDate

/** A board member (aspiran/interview-personas@1). */
@Serializable
data class BoardPersona(val key: String, val name: Bi<String>, val style: Bi<String>, val onIDontKnow: Bi<String>? = null)

/** One question in the bank (aspiran/interview-bank@1); `{district}` and the like are filled from the DAF. */
@Serializable
data class BoardQuestion(val id: String, val group: String = "", val persona: String = "chair", val depth: String = "follow-up", val idkOk: Boolean = false, val q: Bi<String>)

@Serializable private data class Personas(val personas: List<BoardPersona> = emptyList())
@Serializable private data class Bank(val questions: List<BoardQuestion> = emptyList())
@Serializable private data class BoardNow(val ids: List<String>, val i: Int = 0, val day: String, val answered: Int = 0, val idk: Int = 0, val followUps: Int = 0)
@Serializable private data class BoardNote(val day: String, val asked: Int, val note: String)

private val DAF = listOf("district" to "Home district", "state" to "Home state", "graduation_subject" to "Graduation subject",
    "previous_job" to "Work before this (leave empty if none)", "hobby" to "A hobby you listed", "optional" to "Optional subject",
    "service_preference" to "First service preference")
private val ORDER = listOf("sceptic", "hobby-prober", "ca-hawk", "quiet-one", "chair")
private val SLOT = Regex("\\{(\\w+)\\}")
private val J = Json { ignoreUnknownKeys = true }

fun boardQuestions(library: ContentLibrary): List<BoardQuestion> = library.items.filter { it.kind == "interview-bank" }
    .flatMap { runCatching { ContentLibrary.JSON.decodeFromJsonElement<Bank>(it.data).questions }.getOrDefault(emptyList()) }

private fun boardPersonas(library: ContentLibrary): List<BoardPersona> = library.items.firstOrNull { it.kind == "interview-personas" }
    ?.let { runCatching { ContentLibrary.JSON.decodeFromJsonElement<Personas>(it.data).personas }.getOrNull() }.orEmpty()

/** The Chair opens; then each member in turn, one question per member and theme, ten in all. Same as ivPlan in app.js. */
private fun plan(qs: List<BoardQuestion>, daf: Map<String, String>, seed: Long): List<String> {
    val usable = qs.filter { q -> SLOT.findAll(q.q.en).all { !daf[it.groupValues[1]].isNullOrBlank() } }.shuffled(kotlin.random.Random(seed))
    val out = mutableListOf<BoardQuestion>()
    val seen = mutableSetOf<String>()
    (usable.firstOrNull { it.depth == "opener" && it.persona == "chair" } ?: usable.firstOrNull { it.depth == "opener" })?.let { out += it }
    var i = 0
    while (out.size < 10 && i < 50) {
        val p = ORDER[i++ % ORDER.size]
        usable.firstOrNull { it.persona == p && it.depth != "opener" && it !in out && "$p${it.group}" !in seen }?.let { out += it; seen += "$p${it.group}" }
    }
    return out.map { it.id }
}

/**
 * Mock interview (teaching plan, interview): a board of five personas asks from the approved bank, filled with your
 * own DAF details (kept on this phone). An AI member can ask one follow-up per answer. No clock and no score: the
 * last step is one note to yourself. The web copy is viewInterview in app.js.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun InterviewScreen(library: ContentLibrary, community: Community, hindi: Boolean, onOpenNeedToTalk: () -> Unit, onClose: () -> Unit) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("interview", Context.MODE_PRIVATE) }
    val scope = rememberCoroutineScope()
    val qs = remember { boardQuestions(library) }
    val personas = remember { boardPersonas(library) }
    val dafSer = MapSerializer(String.serializer(), String.serializer())
    var daf by remember { mutableStateOf(runCatching { J.decodeFromString(dafSer, prefs.getString("daf", "{}")!!) }.getOrDefault(emptyMap())) }
    var now by remember { mutableStateOf(prefs.getString("now", null)?.let { runCatching { J.decodeFromString<BoardNow>(it) }.getOrNull() }) }
    val notes = remember { mutableStateOf(runCatching { J.decodeFromString(ListSerializer(BoardNote.serializer()), prefs.getString("log", "[]")!!) }.getOrDefault(emptyList())) }
    var editingDaf by remember { mutableStateOf(daf.values.none { it.isNotBlank() }) }
    fun saveNow(n: BoardNow?) { now = n; prefs.edit().apply { if (n == null) remove("now") else putString("now", J.encodeToString(BoardNow.serializer(), n)) }.apply() }

    BackHandler { if (editingDaf && daf.values.any { it.isNotBlank() }) editingDaf = false else onClose() }
    Scaffold(topBar = { TopAppBar(title = { Text("Mock interview") }, navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (qs.isEmpty()) { Text("The board's questions appear here once an English and a Hindi editor approve them."); return@Column }
            if (editingDaf) {
                Text("Your DAF, in short", style = MaterialTheme.typography.headlineSmall)
                Text("The board asks from your Detailed Application Form. Fill what you can; questions that need an empty field are skipped. This stays on this phone.")
                DAF.forEach { (k, label) ->
                    OutlinedTextField(value = daf[k] ?: "", onValueChange = { v -> daf = daf + (k to v) }, label = { Text(label) }, singleLine = true, modifier = Modifier.fillMaxWidth())
                }
                Button(onClick = { prefs.edit().putString("daf", J.encodeToString(dafSer, daf)).apply(); editingDaf = false }) { Text("Save and meet the board") }
                return@Column
            }
            val n = now
            if (n == null) {
                Text("A board of five. The Chair opens, then each member asks in their own way. Answer aloud as you would in the room, or type. No clock and no score: at the end you write one note to yourself.", style = MaterialTheme.typography.bodyLarge)
                if (personas.isNotEmpty()) FlatCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        personas.forEach { Text("${it.name.pick(hindi)} · ${it.style.pick(hindi)}", style = MaterialTheme.typography.bodySmall) }
                    }
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = {
                        val ids = plan(qs, daf, System.currentTimeMillis())
                        if (ids.isEmpty()) editingDaf = true else saveNow(BoardNow(ids, 0, LocalDate.now().toString()))
                    }) { Text("Start a board") }
                    OutlinedButton(onClick = { editingDaf = true }) { Text("Edit your DAF") }
                }
                if (notes.value.isNotEmpty()) {
                    Text("Your notes", style = MaterialTheme.typography.titleMedium)
                    notes.value.reversed().take(8).forEach { r ->
                        FlatCard(Modifier.fillMaxWidth()) { Column(Modifier.padding(12.dp)) { Text("${r.day} · ${r.asked} questions", style = MaterialTheme.typography.labelMedium); if (r.note.isNotBlank()) Text(r.note) } }
                    }
                }
                return@Column
            }
            if (n.i >= n.ids.size) {
                var note by remember { mutableStateOf("") }
                Text("The board thanks you", style = MaterialTheme.typography.headlineSmall)
                Text("One note to yourself before you go. That's the only mark this gets.")
                OutlinedTextField(value = note, onValueChange = { note = it }, placeholder = { Text("Which answer would you give differently, and how?") }, modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp))
                Button(onClick = {
                    notes.value = (notes.value + BoardNote(n.day, n.answered + n.idk, note.trim().take(600))).takeLast(50)
                    prefs.edit().putString("log", J.encodeToString(ListSerializer(BoardNote.serializer()), notes.value)).apply()
                    saveNow(null)
                }) { Text("Save the note") }
                return@Column
            }
            val q = qs.firstOrNull { it.id == n.ids[n.i] }
            if (q == null) { saveNow(n.copy(i = n.i + 1)); return@Column }
            val p = personas.firstOrNull { it.key == q.persona }
            val asked = SLOT.replace(q.q.pick(hindi)) { daf[it.groupValues[1]].orEmpty() }
            var text by remember(q.id) { mutableStateOf("") }
            var idk by remember(q.id) { mutableStateOf(false) }
            var followUp by remember(q.id) { mutableStateOf<String?>(null) }
            var followAnswer by remember(q.id) { mutableStateOf("") }
            var fuNote by remember(q.id) { mutableStateOf<String?>(null) }
            var asking by remember(q.id) { mutableStateOf(false) }

            Text("Question ${n.i + 1} of ${n.ids.size}", style = MaterialTheme.typography.labelMedium)
            FlatCard(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(p?.name?.pick(hindi) ?: "Board member", style = MaterialTheme.typography.titleSmall)
                    p?.style?.let { Text(it.pick(hindi), style = MaterialTheme.typography.bodySmall) }
                    Text(asked, style = MaterialTheme.typography.titleLarge)
                }
            }
            OutlinedTextField(value = text, onValueChange = { text = it }, placeholder = { Text("Type your answer, or answer aloud and jot the key points") },
                modifier = Modifier.fillMaxWidth().heightIn(min = 140.dp), textStyle = if (hindi) ReadingHindi else ReadingText)
            if (idk) FlatCard(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    p?.onIDontKnow?.let { Text(it.pick(hindi)) }
                    Text(if (q.idkOk) "On a fact you don't know, saying so plainly is the right answer." else "Here the board wanted your view. Next time, try a line or two, even a tentative one.", style = MaterialTheme.typography.bodySmall)
                }
            }
            followUp?.let { fu ->
                FlatCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("${p?.name?.pick(hindi) ?: "Board member"} · AI", style = MaterialTheme.typography.labelMedium)
                        Text(fu)
                    }
                }
                OutlinedTextField(value = followAnswer, onValueChange = { followAnswer = it }, placeholder = { Text("Your answer to the follow-up") }, modifier = Modifier.fillMaxWidth().heightIn(min = 100.dp))
            }
            fuNote?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (followUp == null && !idk) OutlinedButton(enabled = !asking, onClick = {
                    if (Practice.wordCount(text) < 8) { fuNote = "Type at least a sentence or two so the member has something to follow up on."; return@OutlinedButton }
                    asking = true; fuNote = "${p?.name?.pick(hindi) ?: "The member"} is thinking…"
                    scope.launch {
                        val r = community.interviewFollow(p?.name?.pick(hindi) ?: "Board member", p?.style?.pick(hindi).orEmpty(), asked, text, hindi)
                        asking = false; fuNote = r.note
                        if (r.care) { fuNote = null; onOpenNeedToTalk() }
                        r.followUp?.let { followUp = it; saveNow(n.copy(followUps = n.followUps + 1)) }
                    }
                }) { Text("Ask me a follow-up (AI)") }
                if (!idk) OutlinedButton(onClick = { idk = true }) { Text("I don't know") }
                Button(onClick = {
                    val cur = now ?: n
                    saveNow(cur.copy(i = cur.i + 1, answered = cur.answered + if (idk) 0 else 1, idk = cur.idk + if (idk) 1 else 0))
                }) { Text(if (text.isNotBlank() || idk) "Next question" else "I answered aloud: next") }
            }
            TextButton(onClick = { saveNow((now ?: n).copy(i = n.ids.size)) }) { Text("End the board here") }
        }
    }
}
