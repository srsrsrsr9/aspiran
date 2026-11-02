package com.upscpods.app.ui

import android.content.Context
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Bi
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.LibraryItem
import com.upscpods.app.data.Practice
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.decodeFromJsonElement
import java.time.LocalDate

/** An approved essay topic (aspiran/essay-topic@1): the topic and the guide for each of the three snaps. */
@Serializable
data class EssayTopic(
    val topic: Bi<String>,
    val kind: String = "abstract",
    val snap1Skeleton: Bi<String>? = null,
    val snap2Outline: Bi<String>? = null,
    val snap3Watch: Bi<String>? = null,
    val angles: List<Bi<String>> = emptyList(),
    val openers: List<Bi<String>> = emptyList(),
)

fun essays(library: ContentLibrary): List<Pair<String, EssayTopic>> = library.items.filter { it.kind == "essay" }.mapNotNull { item: LibraryItem ->
    runCatching { item.id to ContentLibrary.JSON.decodeFromJsonElement<EssayTopic>(item.data) }.getOrNull()
}

private data class Snap(val n: Int, val name: String, val ask: String, val min: Int)
private val SNAPS = listOf(
    Snap(1, "Skeleton", "Your stand in one line, and three or four angles you'd cover. About 10 minutes.", 15),
    Snap(2, "Outline", "Intro idea, one line per paragraph, and the conclusion. About 25 minutes.", 40),
    Snap(3, "Essay", "The full essay, 1,000 to 1,200 words. Paper is best; type it here or just mark it written.", 0),
)

/**
 * Essays in three snaps (teaching plan, writing): skeleton, outline, essay. Each snap is written first, then compared
 * with the guide. What you write stays on this phone. The web copy is viewEssay in app.js.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EssayScreen(library: ContentLibrary, hindi: Boolean, onClose: () -> Unit) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("essays", Context.MODE_PRIVATE) }
    val list = remember { essays(library) }
    var open by rememberSaveable { mutableStateOf<String?>(null) }
    var tick by remember { mutableIntStateOf(0) }
    BackHandler { if (open != null) open = null else onClose() }
    Scaffold(topBar = {
        TopAppBar(title = { Text("Essays in three snaps") }, navigationIcon = { TextButton(onClick = { if (open != null) open = null else onClose() }) { Text("← Back") } })
    }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            val current = list.firstOrNull { it.first == open }
            if (current == null) {
                Text("Each essay goes in three sittings: a skeleton, then an outline, then the essay. You write each snap first, then compare it with the guide.", style = MaterialTheme.typography.bodyLarge)
                if (list.isEmpty()) Text("Essay topics appear here once an English and a Hindi editor approve them.", style = MaterialTheme.typography.bodyMedium)
                list.forEach { (id, e) ->
                    val done = SNAPS.count { prefs.getString("$id:s${it.n}done", null) != null }
                    PracticeCard(title = e.topic.pick(hindi), detail = if (done > 0) "$done of 3 snaps done" else if (e.kind == "abstract") "Abstract" else "Topical",
                        done = done == 3, filled = false, onStart = { open = id })
                }
                return@Column
            }
            val (id, e) = current
            Text(e.topic.pick(hindi), style = MaterialTheme.typography.headlineSmall)
            tick.let { _ ->
                SNAPS.forEach { s ->
                    val ready = s.n == 1 || prefs.getString("$id:s${s.n - 1}done", null) != null
                    Text("Snap ${s.n}: ${s.name}", style = MaterialTheme.typography.titleMedium)
                    if (!ready) { Text("Opens after the snap before it.", style = MaterialTheme.typography.bodySmall); return@forEach }
                    Text(s.ask, style = MaterialTheme.typography.bodyMedium)
                    var text by remember(id, s.n) { mutableStateOf(prefs.getString("$id:s${s.n}", "") ?: "") }
                    OutlinedTextField(value = text, onValueChange = { text = it; prefs.edit().putString("$id:s${s.n}", it).apply() },
                        modifier = Modifier.fillMaxWidth().heightIn(min = if (s.n == 3) 240.dp else 120.dp), textStyle = if (hindi) ReadingHindi else ReadingText)
                    Text("${Practice.wordCount(text)} words", style = MaterialTheme.typography.labelMedium)
                    val done = prefs.getString("$id:s${s.n}done", null) != null
                    if (!done) {
                        Button(onClick = { prefs.edit().putString("$id:s${s.n}done", LocalDate.now().toString()).apply(); tick++ },
                            enabled = s.n == 3 || Practice.wordCount(text) >= s.min / 3) {
                            Text(if (s.n == 3) "I've written it: show the watch-outs" else "Done: compare with the guide")
                        }
                    } else {
                        val guide = when (s.n) { 1 -> e.snap1Skeleton; 2 -> e.snap2Outline; else -> e.snap3Watch }?.pick(hindi).orEmpty()
                        FlatCard(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(if (s.n == 3) "Watch-outs: check your essay against these" else "The guide's ${s.name.lowercase()}", style = MaterialTheme.typography.titleSmall)
                                Text(guide, style = MaterialTheme.typography.bodyMedium)
                                val more = if (s.n == 1) e.angles else if (s.n == 2) e.openers else emptyList()
                                if (more.isNotEmpty()) {
                                    Text(if (s.n == 1) "More angles" else "Ways to open", style = MaterialTheme.typography.labelLarge)
                                    more.forEach { Text("• ${it.pick(hindi)}", style = MaterialTheme.typography.bodySmall) }
                                }
                            }
                        }
                        Text("What did you have that the guide didn't, and what did it have that you missed? The second one is your next fix.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}
