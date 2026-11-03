package com.upscpods.app.ui

import android.content.Context
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.ContentLibrary
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import java.time.LocalDate
import java.time.temporal.ChronoUnit

// Prep screens for the owner's content batches: Mains answer skeletons ("mains-skeleton"), GS4 cases with thinkers and
// terms ("gs4-case", "gs4-glossary"), weekly CSAT sets ("csat-week"), walk scripts ("walk-script"), welcome-back days
// ("restart-day") and the order to study an optional in ("optional-priority"). The web copies are in brief.js.
// No clock and no score kept anywhere but this phone; every piece ends.

private fun ContentLibrary.data(kind: String): List<JsonObject> = items.filter { it.kind == kind }.map { it.data }

@Composable
private fun Block(title: String, soft: Boolean = false, content: @Composable () -> Unit) = FlatCard(Modifier.fillMaxWidth()) {
    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(title, style = MaterialTheme.typography.titleSmall, color = if (soft) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface)
        content()
    }
}

@Composable
private fun Row2(title: String, detail: String, onClick: () -> Unit) = FlatCard(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
    Column(Modifier.padding(12.dp)) {
        Text(title, style = MaterialTheme.typography.titleSmall)
        if (detail.isNotBlank()) Text(detail, style = MaterialTheme.typography.bodySmall)
    }
}

// --- Mains answer skeletons ----------------------------------------------------------------------------------------

private data class Skel(val d: JsonObject, val paper: String, val n: String, val year: String, val code: String, val text: String)

private fun skeletons(library: ContentLibrary, hindi: Boolean): List<Skel> {
    val papers = library.data("pyq").associateBy { it.str("id") }
    return library.data("mains-skeleton").mapNotNull { d ->
        val m = Regex("^(.+)-q0*(\\d+)$").find(d.str("pyqId") ?: "") ?: return@mapNotNull null
        val (paper, n) = m.destructured
        val p = papers[paper]
        val q = p?.get("questions").arr().firstOrNull { it.str("n") == n }
        Skel(d, paper, n, p?.str("year") ?: Regex("\\d{4}").find(paper)?.value ?: "", paper.substringAfterLast('-').uppercase(),
            q?.let { (if (hindi) it["hi"] else null).arr0()?.str("q") ?: (it["en"] as? JsonObject)?.str("q") } ?: "")
    }.sortedWith(compareBy({ it.paper }, { it.n.toIntOrNull() ?: 0 }))
}
private fun kotlinx.serialization.json.JsonElement?.arr0(): JsonObject? = this as? JsonObject

/** Real Mains questions, each with a way in. Outline first, then compare. The web copy is viewSkeletons. */
@Composable
fun SkeletonsScreen(library: ContentLibrary, hindi: Boolean, onClose: () -> Unit) {
    val all = remember(library.items, hindi) { skeletons(library, hindi) }
    var open by rememberSaveable { mutableStateOf<String?>(null) }
    val k = all.indexOfFirst { it.d.str("id") == open }
    val s = all.getOrNull(k)
    Page(if (s != null) "${s.code} · Q${s.n}" else "Answer skeletons", { if (open != null) open = null else onClose() }) {
        if (all.isEmpty()) { Text("Answer skeletons appear here once an English and a Hindi editor approve them."); return@Page }
        if (s == null) {
            Text("${all.size} real Mains questions, each with a way in: what the question word asks, an opening, headings, a close and the slip most people make. Try your own outline first.")
            all.groupBy { it.code }.forEach { (code, list) ->
                Text(code, style = MaterialTheme.typography.titleMedium)
                list.forEach { x ->
                    Row2(x.text.ifBlank { "Question ${x.n}" }.let { if (it.length > 120) it.take(118) + "…" else it },
                        "Mains ${x.year} · ${x.d.str("marks") ?: "?"} marks · ${x.d.str("words") ?: "?"} words") { open = x.d.str("id") }
                }
            }
            return@Page
        }
        var shown by rememberSaveable(open) { mutableStateOf(false) }
        Text("Mains ${s.year} · ${s.code} · Q${s.n} · ${s.d.str("marks") ?: "?"} marks · ${s.d.str("words") ?: "?"} words", style = MaterialTheme.typography.labelMedium)
        Text(s.text.ifBlank { "Past Mains question" }, style = MaterialTheme.typography.titleMedium)
        PauseLine("pyq-first", library, hindi)
        Block("Before you look", soft = true) { Text("Spend two minutes on paper: what does the question word ask, and which three or four headings would you use? Then compare.") }
        if (!shown) Button(onClick = { shown = true }) { Text("Show the skeleton") } else {
            s.d["directive"].biText(hindi)?.let { Block("What the word asks", soft = true) { Text(it) } }
            s.d["intro"].biText(hindi)?.let { Block("Open with") { Text(it) } }
            Block("Headings for the body") { s.d["headings"].jsonList().forEachIndexed { i, h -> Text("${i + 1}. ${h.biText(hindi) ?: ""}") } }
            s.d["wayForward"].biText(hindi)?.let { Block("Close with") { Text(it) } }
            s.d["commonMistake"].biText(hindi)?.let { Block("The common slip", soft = true) { Text(it) } }
            Text("A skeleton, not a model answer: your examples and your words make it yours.", style = MaterialTheme.typography.bodySmall)
            all.getOrNull(k + 1)?.let { next -> Button(onClick = { open = next.d.str("id") }) { Text("Next question") } }
        }
    }
}
private fun kotlinx.serialization.json.JsonElement?.jsonList() = (this as? JsonArray)?.toList() ?: emptyList()

// --- GS4: cases, thinkers and terms -------------------------------------------------------------------------------

/** Case studies, thinkers and terms for GS4. Write your answer first, then compare. The web copy is viewCases. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun EthicsScreen(library: ContentLibrary, hindi: Boolean, onClose: () -> Unit) {
    val context = LocalContext.current
    val cases = remember(library.items) { library.data("gs4-case").sortedBy { it.str("id") } }
    val gl = remember(library.items) { library.data("gs4-glossary") }
    val thinkers = gl.flatMap { it["thinkers"].arr() }
    val terms = gl.flatMap { it["terms"].arr() }
    var tab by rememberSaveable { mutableStateOf("cases") }
    var open by rememberSaveable { mutableStateOf<String?>(null) }
    val c = cases.firstOrNull { it.str("id") == open }
    Page("Ethics (GS4)", { if (open != null) open = null else onClose() }) {
        if (cases.isEmpty() && gl.isEmpty()) { Text("GS4 cases, thinkers and terms appear here once an English and a Hindi editor approve them."); return@Page }
        if (c == null) FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = tab == "cases", onClick = { tab = "cases" }, label = { Text("Cases (${cases.size})") })
            FilterChip(selected = tab == "thinkers", onClick = { tab = "thinkers" }, label = { Text("Thinkers (${thinkers.size})") })
            FilterChip(selected = tab == "terms", onClick = { tab = "terms" }, label = { Text("Terms (${terms.size})") })
        }
        when {
            c != null -> {
                val prefs = context.getSharedPreferences("cases", Context.MODE_PRIVATE)
                val id = c.str("id") ?: ""
                var mine by rememberSaveable(id) { mutableStateOf(prefs.getString(id, "") ?: "") }
                var shown by rememberSaveable(id) { mutableStateOf(false) }
                val k = cases.indexOf(c)
                Text("Case ${k + 1} of ${cases.size}" + (c["tension"].biText(hindi)?.let { " · $it" } ?: ""), style = MaterialTheme.typography.labelMedium)
                FlatCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(c["case"].biText(hindi) ?: "", style = if (hindi) ReadingHindi else ReadingText)
                        Text(c["question"].biText(hindi) ?: "", fontWeight = FontWeight.SemiBold)
                    }
                }
                OutlinedTextField(value = mine, onValueChange = { mine = it; prefs.edit().putString(id, it).apply() }, minLines = 5, modifier = Modifier.fillMaxWidth(),
                    label = { Text("Your answer first") }, placeholder = { Text("Your options and your choice, in a few lines. Stays on this phone.") })
                if (!shown) Button(onClick = { shown = true }) { Text("Compare with the guide") } else {
                    val ci = c["circle"] as? JsonObject
                    ci?.get("stakeholders").arr().takeIf { it.isNotEmpty() }?.let { st -> Block("Who has a stake") { st.forEach { Text("• ${it["who"].biText(hindi) ?: ""}: ${it["stake"].biText(hindi) ?: ""}") } } }
                    ci?.get("inTension").biText(hindi)?.let { Block("What pulls against what", soft = true) { Text(it) } }
                    ci?.get("options").jsonList().takeIf { it.isNotEmpty() }?.let { os -> Block("The options") { os.forEachIndexed { i, o -> Text("${i + 1}. ${o.biText(hindi) ?: ""}") } } }
                    ci?.get("choice").biText(hindi)?.let { Block("One sound choice") { Text(it) } }
                    c["seasoning"].jsonList().takeIf { it.isNotEmpty() }?.let { ss -> Block("Words and ideas that fit", soft = true) { ss.forEach { Text("• ${it.biText(hindi) ?: ""}") } } }
                    Text("Other choices can be just as sound if you weigh the same people and say why.", style = MaterialTheme.typography.bodySmall)
                    cases.getOrNull(k + 1)?.let { next -> Button(onClick = { open = next.str("id") }) { Text("Next case") } }
                }
            }
            tab == "thinkers" -> {
                Text("Who said what, and when an idea helps in an answer.")
                thinkers.forEach { t ->
                    var more by remember { mutableStateOf(false) }
                    FlatCard(Modifier.fillMaxWidth().clickable { more = !more }) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(t["name"].biText(hindi) ?: "", style = MaterialTheme.typography.titleSmall)
                            Text(t["idea"].biText(hindi) ?: "", style = MaterialTheme.typography.bodySmall)
                            if (more) {
                                t["quote"].biText(hindi)?.let { Text(it, fontStyle = FontStyle.Italic) }
                                t["useWhen"].biText(hindi)?.let { Text("Use it when: $it") }
                                t["misuse"].biText(hindi)?.let { Text("Don't: $it", style = MaterialTheme.typography.bodySmall) }
                            }
                        }
                    }
                }
            }
            tab == "terms" -> {
                Text("The GS4 words in English and Hindi, each with an example and the word it's often confused with.")
                terms.forEach { t ->
                    var more by remember { mutableStateOf(false) }
                    val term = t["term"] as? JsonObject
                    FlatCard(Modifier.fillMaxWidth().clickable { more = !more }) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row { Text(term?.str("en") ?: "", style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f)); Text(term?.str("hi") ?: "", style = MaterialTheme.typography.titleSmall) }
                            Text(t["meaning"].biText(hindi) ?: "", style = MaterialTheme.typography.bodySmall)
                            if (more) {
                                t["example"].biText(hindi)?.let { Text("Example: $it") }
                                t["confusedWith"].biText(hindi)?.let { Text("Not the same as: $it", style = MaterialTheme.typography.bodySmall) }
                            }
                        }
                    }
                }
            }
            else -> {
                Text("Case studies in the GS4 style. Read the case, write your options and your choice, then compare with a guide that maps who has a stake and why.")
                val prefs = context.getSharedPreferences("cases", Context.MODE_PRIVATE)
                cases.forEachIndexed { i, x ->
                    Row2(x["tension"].biText(hindi) ?: "Case ${i + 1}", listOfNotNull("Case ${i + 1}", x.str("setting"), if (prefs.getString(x.str("id"), "").isNullOrBlank()) null else "written").joinToString(" · ")) { open = x.str("id") }
                }
            }
        }
    }
}

// --- CSAT: one set a week -------------------------------------------------------------------------------------------

/** Ten mixed questions and a passage with three, each with a worked why. Nothing timed. The web copy is viewCsat. */
@Composable
fun CsatScreen(library: ContentLibrary, hindi: Boolean, onClose: () -> Unit) {
    val context = LocalContext.current
    val prefs = context.getSharedPreferences("csat", Context.MODE_PRIVATE)
    val weeks = remember(library.items) { library.data("csat-week").sortedBy { it.str("id") } }
    var open by rememberSaveable { mutableStateOf<String?>(null) }
    val w = weeks.firstOrNull { it.str("id") == open }
    Page(if (w != null) "CSAT · week ${weeks.indexOf(w) + 1}" else "CSAT, one set a week", { if (open != null) open = null else onClose() }) {
        if (weeks.isEmpty()) { Text("CSAT sets appear here once an English and a Hindi editor approve them."); return@Page }
        if (w == null) {
            Text("Ten mixed questions (numbers, reasoning, a table) and one passage with three questions. About 30 minutes. Every answer has a worked why.")
            weeks.forEachIndexed { i, x ->
                val n = x["page1"].arr().size + ((x["page2"] as? JsonObject)?.get("questions").arr().size)
                Row2("Week ${i + 1}", prefs.getString(x.str("id"), null)?.let { "Done · $it right" } ?: "$n questions") { open = x.str("id") }
            }
            return@Page
        }
        val key = w["key"].arr().associateBy { it.str("n") }
        val page2 = w["page2"] as? JsonObject
        val qs = w["page1"].arr() + page2?.get("questions").arr()
        val picked = remember(open) { mutableStateMapOf<String, Int>() }
        @Composable fun Q(q: JsonObject) {
            val n = q.str("n") ?: ""
            val k = key[n]
            val ans = (k?.get("answer") as? JsonPrimitive)?.intOrNull
            val opts = (q["options"] as? JsonObject)?.let { o -> ((if (hindi) o["hi"] else null) as? JsonArray ?: o["en"] as? JsonArray)?.mapNotNull { it.biText(false) } } ?: emptyList()
            FlatCard(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    (q["table"] as? JsonArray)?.let { rows ->
                        rows.forEachIndexed { r, row ->
                            Text((row as? JsonArray)?.joinToString("   ") { cell -> (cell.biText(false) ?: "").split(" / ").let { p -> if (hindi && p.size > 1) p[1] else p[0] } } ?: "",
                                style = MaterialTheme.typography.bodySmall, fontWeight = if (r == 0) FontWeight.SemiBold else FontWeight.Normal)
                        }
                    }
                    Text("$n. ${q["q"].biText(hindi) ?: ""}", fontWeight = FontWeight.SemiBold)
                    val p = picked[n]
                    opts.forEachIndexed { i, o ->
                        val mark = when { p == null -> ""; i == ans -> "✓ "; i == p -> "○ "; else -> "" }
                        OutlinedButton(onClick = { if (p == null) picked[n] = i }, modifier = Modifier.fillMaxWidth(),
                            border = BorderStroke(1.dp, if (p != null && i == ans) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant)) {
                            Text(mark + o, modifier = Modifier.fillMaxWidth())
                        }
                    }
                    if (p != null) Text((if (p == ans) "✓ Right. " else "○ Not quite. ") + (k?.get("why").biText(hindi) ?: ""), style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        Text("Work each one on paper first. Wrong answers show the working; nothing is timed.")
        Text("Part 1. Ten questions", style = MaterialTheme.typography.titleMedium)
        w["page1"].arr().forEach { Q(it) }
        if (page2 != null) {
            Text("Part 2. A passage", style = MaterialTheme.typography.titleMedium)
            FlatCard(Modifier.fillMaxWidth()) { Text(page2["passage"].biText(hindi) ?: "", style = if (hindi) ReadingHindi else ReadingText, modifier = Modifier.padding(12.dp)) }
            page2["questions"].arr().forEach { Q(it) }
        }
        if (picked.size == qs.size && qs.isNotEmpty()) {
            val right = qs.count { q -> picked[q.str("n")] == (key[q.str("n")]?.get("answer") as? JsonPrimitive)?.intOrNull }
            remember(open) { prefs.edit().putString(w.str("id"), "$right of ${qs.size}").apply(); true }
            Block("Set done.") { Text("$right of ${qs.size} right. CSAT needs 66 of 200 to qualify; this is practice for the habit, not a mark.") }
            TextButton(onClick = { open = null }) { Text("All weeks") }
        }
    }
}

// --- Walk scripts ---------------------------------------------------------------------------------------------------

/** The guided walks under Walk mode: one topic, one question, read by the phone's voice. */
@Composable
fun WalkScripts(library: ContentLibrary?, hindi: Boolean, onOpen: (String) -> Unit) {
    val all = remember(library?.items, hindi) { library?.data("walk-script").orEmpty().sortedBy { it["topic"].biText(hindi) } }
    if (all.isEmpty()) return
    Text("Guided walks", style = MaterialTheme.typography.titleMedium)
    Text("One topic, one question, about six minutes. The phone reads it; you answer aloud.", style = MaterialTheme.typography.bodySmall)
    all.forEach { d -> Row2(d["topic"].biText(hindi) ?: "", "${d.str("minutes") ?: "6"} min") { onOpen(d.str("id") ?: "") } }
}

@Composable
fun WalkScriptPage(library: ContentLibrary?, hindi: Boolean, id: String) {
    val d = library?.data("walk-script")?.firstOrNull { it.str("id") == id } ?: return Text("That walk isn't here.")
    val text = d["script"].biText(hindi) ?: ""
    Text(d["topic"].biText(hindi) ?: "", style = MaterialTheme.typography.titleLarge)
    Text("About ${d.str("minutes") ?: "6"} minutes · earphones in", style = MaterialTheme.typography.labelMedium)
    ReadAloudButton(text)
    FlatCard(Modifier.fillMaxWidth()) { Text(text, style = if (hindi) ReadingHindi else ReadingText, modifier = Modifier.padding(12.dp)) }
    d["pronounce"].arr().takeIf { it.isNotEmpty() }?.let { ps -> Block("Say it right", soft = true) { ps.forEach { Text("${it.str("term")} · ${it.str("say")}") } } }
    Text("When it ends, say your answer aloud once, then walk on. Nothing is recorded.", style = MaterialTheme.typography.bodySmall)
}

// --- Welcome back ---------------------------------------------------------------------------------------------------

/** Days since this phone last opened the app, read once per launch. Kept apart from the stamps' and metrics' lastOpen. */
object OpenGap {
    private var gap: Long? = null
    fun days(context: Context): Long = gap ?: run {
        val p = context.getSharedPreferences("welcome", Context.MODE_PRIVATE)
        val today = LocalDate.now()
        val g = p.getString("lastSeen", null)?.let { runCatching { ChronoUnit.DAYS.between(LocalDate.parse(it), today) }.getOrNull() } ?: 0L
        p.edit().putString("lastSeen", today.toString()).apply()
        gap = g; g
    }
}

private fun restartFor(library: ContentLibrary?, whenKey: String): JsonObject? {
    val all = library?.data("restart-day").orEmpty().filter { it.str("when") == whenKey }
    if (all.isEmpty()) return null
    return all[(LocalDate.now().toEpochDay() % all.size).toInt()]
}

/** On Today after three days or more away: one line, one first step. × hides it for the day. */
@Composable
fun WelcomeBackCard(library: ContentLibrary?, hindi: Boolean) {
    val context = LocalContext.current
    val gap = remember { OpenGap.days(context) }
    val prefs = context.getSharedPreferences("welcome", Context.MODE_PRIVATE)
    var hidden by remember { mutableStateOf(prefs.getString("seen", null) == LocalDate.now().toString()) }
    if (gap < 3 || hidden) return
    val d = remember(library?.items) { restartFor(library, if (gap >= 25) "about-1-month" else if (gap >= 10) "about-2-weeks" else "about-3-days") } ?: return
    RestartCard(d, hindi) { prefs.edit().putString("seen", LocalDate.now().toString()).apply(); hidden = true }
}

/** On the mock result after a hard paper (under 40% of the marks), never in result week. */
@Composable
fun AfterHardMock(library: ContentLibrary?, hindi: Boolean, score: Double, max: Double) {
    if (max <= 0 || score / max >= 0.4) return
    val d = remember(library?.items) { restartFor(library, "bad-mock-or-result") } ?: return
    RestartCard(d, hindi, null)
}

@Composable
private fun RestartCard(d: JsonObject, hindi: Boolean, onHide: (() -> Unit)?) = FlatCard(Modifier.fillMaxWidth()) {
    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(d["headline"].biText(hindi) ?: "", style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
            if (onHide != null) TextButton(onClick = onHide) { Text("×") }
        }
        d["body"].biText(hindi)?.let { Text(it) }
        d["firstStep"].biText(hindi)?.let { Text("First step: $it", fontWeight = FontWeight.Medium) }
    }
}

// --- Optional: the order to study in --------------------------------------------------------------------------------

/** The approved priority list for an optional, on its subject page. Topics in the app open on tap. */
@Composable
fun OptionalOrder(library: ContentLibrary, hindi: Boolean, subject: String, have: Set<String>, onOpen: (String) -> Unit) {
    val p = remember(library.items, subject) { library.data("optional-priority").firstOrNull { it.str("optional") == subject } } ?: return
    val rows = p["nodes"].arr().sortedBy { (it["rank"] as? JsonPrimitive)?.intOrNull ?: 99 }
    if (rows.isEmpty()) return
    var open by rememberSaveable(subject) { mutableStateOf(false) }
    FlatCard(Modifier.fillMaxWidth().clickable { open = !open }) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Where to start: ${rows.size} topics in order", style = MaterialTheme.typography.titleSmall)
            Text(if (open) "The topics asked most often, and why each matters." else "Tap to see the order.", style = MaterialTheme.typography.bodySmall)
            if (open) rows.forEachIndexed { i, n ->
                val id = n.str("id") ?: ""
                Column(Modifier.fillMaxWidth().then(if (id in have) Modifier.clickable { onOpen(id) } else Modifier)) {
                    Text("${i + 1}. ${n["title"].biText(hindi) ?: ""} · Paper ${n.str("paper") ?: ""}",
                        color = if (id in have) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Medium)
                    n["why"].biText(hindi)?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                }
            }
        }
    }
}
