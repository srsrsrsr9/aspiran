@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.upscpods.app.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.isImeVisible
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.upscpods.app.Brand
import com.upscpods.app.data.Chotu
import com.upscpods.app.data.ChotuState
import com.upscpods.app.data.ChotuTurn
import com.upscpods.app.data.DownloadPhase
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.material3.FilterChip
import androidx.compose.material3.RadioButton
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.foundation.clickable

/** Chotu v2: what each chip is for. Sent as the cloud mode; on the phone it frames the starters. */
private val MODES = listOf(
    Triple("talk", "Talk", "Tell me what you planned and how it went. I keep the count; you only ever race your own past."),
    Triple("prep", "Prep", "Ask me anything from the syllabus. I'll keep it simple."),
    Triple("plan", "Plan", "Tell me your hours and what's behind. We'll make the week smaller."),
)
private val STARTERS = mapOf(
    "talk" to listOf("How did my week go?", "I planned Polity today. Only half done", "Aaj ke liye chhota sa kaam batao"),
    "prep" to listOf("What does Article 200 say about the Governor?", "Repo rate ko aasaan bhasha mein samjhao", "Difference between CPI and WPI?"),
    "plan" to listOf("I have 2 hours a day. Plan my week", "I'm behind on Polity. What first?", "Help me plan around office hours"),
)
private val REPORT_REASONS = listOf("Wrong or misleading", "Harmful or unsafe", "Offensive", "Something else")

/** Quiet mode: about this many questions, then Chotu suggests a break. It never nags first. */
private const val QUIET_TURNS = 15

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MascotTab(
    chotu: Chotu,
    onOpenNeedToTalk: () -> Unit,
    modifier: Modifier = Modifier,
    /** Result-day mode: Chotu is quiet apart from this one line. */
    resultQuiet: String? = null,
    /** "Remember this" on a reply: saves an approved note (Me → Profile). Null hides it. */
    onRemember: ((String) -> Boolean)? = null,
    /** After 15 Talk turns: a gentle nudge towards real people. */
    onOpenPod: (() -> Unit)? = null,
    /** The Plan chip: opens the free roadmap builder (Prep → My Plan). */
    onOpenRoadmap: (() -> Unit)? = null,
    hindi: Boolean = false,
    /** "Your week" above an empty chat (Plus any day; everyone on Sundays). */
    showWeek: Boolean = false,
    /** Asks Jeetu from the chip or the card. Null when he isn't on offer here. */
    onJeetu: (() -> Unit)? = null,
) {
    LaunchedEffect(Unit) { chotu.refresh() }
    if (resultQuiet != null) {
        Column(modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ChotuBadge(KulhadTone.QUIET, 56.dp)
            Text(resultQuiet, style = MaterialTheme.typography.bodyLarge)
            OutlinedButton(onClick = onOpenNeedToTalk) { Text("Need to talk? · किसी से बात करनी है?") }
        }
        return
    }
    val s = chotu.state
    // Without internet is a Plus extra, offered in one line. Nobody is told where a reply comes from.
    val ready = chotu.onPhone != null
    val typing = WindowInsets.isImeVisible
    var about by rememberSaveable { mutableStateOf(false) }
    var showModel by rememberSaveable { mutableStateOf(false) }
    Column(modifier.fillMaxSize().imePadding()) {
        // A compact header that steps aside while typing, so the chat keeps its room.
        if (!typing) Column(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Kulhad(toneNow(care = chotu.turns.lastOrNull()?.care == true, thinking = chotu.thinking), 36.dp)
                MODES.forEach { (key, label, _) ->
                    FilterChip(selected = chotu.mode == key, onClick = { chotu.mode = key }, label = { Text(label) })
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Can be wrong", style = MaterialTheme.typography.labelMedium, modifier = Modifier.weight(1f))
                TextButton(onClick = { about = true }) { Text("ⓘ About") }
            }
            if (chotu.mode == "plan" && onOpenRoadmap != null) TextButton(onClick = onOpenRoadmap) { Text("Build your free roadmap to Prelims →") }
            if (!ready && chotu.plus) {
                if (showModel) Column(Modifier.heightIn(max = 320.dp).verticalScroll(rememberScrollState())) {
                    ModelCard(s, chotu)
                    TextButton(onClick = { showModel = false }) { Text("Hide") }
                } else TextButton(onClick = { showModel = true }) { Text(offlineLine(s)) }
            }
        }
        Chat(chotu, onOpenNeedToTalk, onRemember = onRemember, onOpenPod = onOpenPod, hindi = hindi, showWeek = showWeek, onJeetu = onJeetu)
    }
    if (about) AlertDialog(
        onDismissRequest = { about = false },
        title = { Text("About ${Brand.MASCOT_SHORT}") },
        text = {
            Text(
                "Chats here aren't saved after you close the app, and Close the Day, mood and journal never go to ${Brand.MASCOT_SHORT}. " +
                    "The numbers ${Brand.MASCOT_SHORT} mentions are counted by the app from your own practice. " +
                    "It can be wrong, it's not a counsellor, and it never predicts ranks or compares you with anyone. If something feels heavy, Need to talk is one tap away.",
            )
        },
        confirmButton = { TextButton(onClick = { about = false }) { Text("OK") } },
    )
}

/** The one line that stands for "works without internet" until it's opened. Never says how or where it runs. */
private fun offlineLine(s: ChotuState): String = when (s) {
    is ChotuState.NotDownloaded -> "Let ${Brand.MASCOT_SHORT} work without internet · ${s.model.sizeLabel} · Wi-Fi only"
    is ChotuState.Downloading -> "Setting up ${Brand.MASCOT_SHORT} without internet: ${s.done * 100 / s.model.bytes}%"
    is ChotuState.Loading -> "Waking ${Brand.MASCOT_SHORT}…"
    is ChotuState.Failed -> "${Brand.MASCOT_SHORT} without internet needs attention"
    is ChotuState.Unsupported -> "${Brand.MASCOT_SHORT} without internet: this phone is short on space or memory"
    is ChotuState.NoModel -> "${Brand.MASCOT_SHORT} without internet: couldn't check"
    ChotuState.Checking, is ChotuState.Ready -> "Checking…"
}

/** Offline Chotu: the offer, progress, or why it isn't available. Plain sentences only. */
@Composable
private fun ModelCard(s: ChotuState, chotu: Chotu) {
    when (s) {
        ChotuState.Checking -> Info("Checking…", "Seeing whether this phone has room.")
        is ChotuState.Unsupported -> Info(
            "${Brand.MASCOT_SHORT} without internet needs a bit more phone.",
            "It needs about 5 GB of memory (RAM) and 3.6 GB of free space. This phone has %.1f GB and %.1f GB free. ${Brand.MASCOT_SHORT} still answers here whenever you're online.".format(s.probe.ramGb, s.probe.freeGb),
        )
        is ChotuState.NoModel -> Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(s.why.ifBlank { "Checking…" }, style = MaterialTheme.typography.bodyMedium)
            if (s.why.isNotBlank()) OutlinedButton(onClick = { chotu.refresh() }) { Text("Check again") }
        }
        is ChotuState.NotDownloaded -> Consent(s, chotu)
        is ChotuState.Downloading -> Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                when (s.phase) {
                    DownloadPhase.WAITING_WIFI -> "Waiting for Wi-Fi…"
                    DownloadPhase.WAITING_NETWORK -> "Waiting for a connection…"
                    DownloadPhase.RUNNING -> "Setting up ${Brand.MASCOT_SHORT} without internet…"
                    DownloadPhase.VERIFYING -> "Almost done: checking the file…"
                },
                style = MaterialTheme.typography.titleMedium,
            )
            LinearProgressIndicator(progress = { (s.done.toFloat() / s.model.bytes).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth())
            Text(
                "${s.done / 1_000_000} of ${s.model.bytes / 1_000_000} MB. You can close the app: it carries on in the background (see your notifications) and picks up again if the connection drops. ${Brand.MASCOT_SHORT} keeps answering online meanwhile.",
                style = MaterialTheme.typography.bodySmall,
            )
            if (s.phase == DownloadPhase.WAITING_WIFI) {
                Text("Wi-Fi from a phone hotspot counts as mobile data, so it waits here.", style = MaterialTheme.typography.bodySmall)
                OutlinedButton(onClick = { chotu.download(s.model, wifiOnly = false) }) { Text("Use mobile data instead (${s.model.sizeLabel})") }
            }
            TextButton(onClick = { chotu.cancelDownload() }) { Text("Cancel") }
        }
        is ChotuState.Loading -> Info("Waking ${Brand.MASCOT_SHORT} up…", "The first start takes a few seconds.")
        is ChotuState.Failed -> Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(s.why, style = MaterialTheme.typography.bodyMedium)
            OutlinedButton(onClick = { chotu.download(s.model) }) { Text("Try again") }
            TextButton(onClick = { chotu.deleteModel() }) { Text("Remove it") }
        }
        is ChotuState.Ready -> Unit
    }
}

@Composable
private fun Info(title: String, body: String) {
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(body, style = MaterialTheme.typography.bodyMedium)
    }
}

/** Nothing downloads until the person taps the button here. */
@Composable
private fun Consent(s: ChotuState.NotDownloaded, chotu: Chotu) {
    val context = LocalContext.current
    // Android 13+: ask once so the download's progress notification can show. The download runs either way.
    val askNotify = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { chotu.download(s.model) }
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Let ${Brand.MASCOT_SHORT} work without internet?", style = MaterialTheme.typography.titleMedium)
        Text("• One download of ${s.model.sizeLabel}, on Wi-Fi only. It runs in the background; you'll see it in your notifications.", style = MaterialTheme.typography.bodyMedium)
        Text("• After that ${Brand.MASCOT_SHORT} answers even without internet.", style = MaterialTheme.typography.bodyMedium)
        Text("• Answers without internet are shorter and simpler.", style = MaterialTheme.typography.bodyMedium)
        Text("• Remove it any time in Me → Privacy.", style = MaterialTheme.typography.bodyMedium)
        Button(onClick = {
            val needAsk = Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            if (needAsk) askNotify.launch(Manifest.permission.POST_NOTIFICATIONS) else chotu.download(s.model)
        }, modifier = Modifier.fillMaxWidth()) { Text("Download (${s.model.sizeLabel})") }
    }
}

/** Me → Privacy: the space the without-internet download takes up, and the way to remove it. */
@Composable
fun OfflineChotuSettings(chotu: Chotu) {
    var confirm by remember { mutableStateOf(false) }
    val s = chotu.state
    val kept = remember(s) { chotu.downloadedSize() }
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("${Brand.MASCOT_SHORT} without internet", style = MaterialTheme.typography.titleMedium)
        if (kept != null) {
            Text("Downloaded ($kept).", style = MaterialTheme.typography.bodySmall)
            OutlinedButton(onClick = { confirm = true }) { Text("Remove the download") }
        } else Text("Not downloaded. ${Brand.MASCOT_SHORT} answers when you're online.", style = MaterialTheme.typography.bodySmall)
    }
    if (confirm) AlertDialog(
        onDismissRequest = { confirm = false },
        title = { Text("Remove the download?") },
        text = { Text("This frees the space. ${Brand.MASCOT_SHORT} keeps answering online, and you can set it up again later.") },
        confirmButton = { TextButton(onClick = { confirm = false; chotu.deleteModel() }) { Text("Remove") } },
        dismissButton = { TextButton(onClick = { confirm = false }) { Text("Keep it") } },
    )
}

@Composable
private fun ColumnScope.Chat(
    chotu: Chotu,
    onOpenNeedToTalk: () -> Unit,
    onRemember: ((String) -> Boolean)? = null,
    onOpenPod: (() -> Unit)? = null,
    hindi: Boolean = false,
    showWeek: Boolean = false,
    onJeetu: (() -> Unit)? = null,
) {
    val scope = rememberCoroutineScope()
    var reporting by remember { mutableStateOf<ChotuTurn?>(null) }
    var reported by remember { mutableStateOf(setOf<String>()) }
    var remembered by remember { mutableStateOf(setOf<String>()) }
    // "Remember this": the note is shown to edit first, and kept only on this phone.
    var noting by remember { mutableStateOf<Pair<String, String>?>(null) }
    var text by rememberSaveable { mutableStateOf("") }
    val list = rememberLazyListState()
    val turns = chotu.turns
    // Keep the person's own last message in view: scroll to it when a turn is added, so the reply grows below it
    // instead of pushing it off the top.
    LaunchedEffect(turns.size) {
        val asked = turns.indexOfLast { it.fromUser }
        if (turns.isNotEmpty()) list.scrollToItem(if (asked >= 0) asked else turns.lastIndex)
    }

    Row(Modifier.padding(horizontal = 8.dp)) {
        TextButton(onClick = { chotu.newChat() }, enabled = turns.isNotEmpty() && !chotu.thinking) { Text("New chat") }
    }
    LazyColumn(
        Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp),
        state = list,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        if (turns.isEmpty() && showWeek) item {
            val facts = remember { chotu.facts() }
            if (facts != null) YourWeekCard(facts, hindi, onJeetu = if (facts.jeetuPattern) onJeetu else null)
        }
        if (turns.isEmpty()) item {
            Column(Modifier.padding(vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(MODES.first { it.first == chotu.mode }.third + " For example:", style = MaterialTheme.typography.bodyMedium)
                STARTERS.getValue(chotu.mode).forEach { ex ->
                    TextButton(onClick = { chotu.ask(ex) }) { Text(ex) }
                }
            }
        }
        itemsIndexed(turns) { i, t ->
            Turn(t, onOpenNeedToTalk)
            // Report and Remember sit under each finished reply (not care replies, not while streaming).
            if (!t.fromUser && !t.care && t.text.isNotBlank() && !(chotu.thinking && i == turns.lastIndex)) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                    if (!t.fromApp) ListenButton(com.upscpods.app.data.VoiceAsk(if (t.jeetu) "jeetu" else "chotu", text = t.voiceText, sig = t.voiceSig))
                    if (t.id in reported) Text("Reported. Thank you.", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(12.dp))
                    else TextButton(onClick = { reporting = t }) { Text("Report") }
                    if (onRemember != null) {
                        if (t.id in remembered) Text("Saved to your notes", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(12.dp))
                        else turns.getOrNull(i - 1)?.takeIf { it.fromUser }?.let { q ->
                            TextButton(onClick = { noting = t.id to q.text.take(140) }) { Text("Remember this") }
                        }
                    }
                }
            }
        }
        // The plan check-in: three quick answers. Any is fine.
        if (chotu.checkInMoment == com.upscpods.app.data.CheckIns.PLAN && chotu.userTurns == 0) item {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                com.upscpods.app.data.CheckIns.planAnswers(hindi).forEach { a -> OutlinedButton(onClick = { chotu.ask(a) }) { Text(a) } }
            }
        }
        // Jeetu only on a tap: for a plan or a fix, or when the numbers show a pattern.
        if (onJeetu != null && chotu.jeetuOffer && !chotu.thinking) item {
            OutlinedButton(onClick = onJeetu) { JeetuPortrait(20.dp); Text("  " + if (hindi) "Jeetu की राय चाहिए?" else "Want Jeetu's take?") }
        }
        if (chotu.userTurns >= QUIET_TURNS) item {
            Text(
                "That's a good stretch. Maybe a short break, or try today's Prelims set?",
                style = MaterialTheme.typography.labelMedium,
                modifier = Modifier.padding(vertical = 8.dp),
            )
            if (chotu.mode == "talk" && onOpenPod != null) TextButton(onClick = onOpenPod) { Text("Your pod is around too. Say hello there?") }
        }
    }
    Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        OutlinedTextField(
            value = text,
            onValueChange = { text = it.take(1000) },
            placeholder = { Text("Ask ${Brand.MASCOT_SHORT}") },
            modifier = Modifier.weight(1f),
            maxLines = 4,
        )
        Spacer(Modifier.size(8.dp))
        if (chotu.thinking) {
            OutlinedButton(onClick = { chotu.cancel() }) { Text("Stop") }
        } else {
            Button(onClick = { chotu.ask(text); text = "" }, enabled = text.isNotBlank()) { Text("Ask") }
        }
    }

    noting?.let { (id, start) ->
        var note by remember(id) { mutableStateOf(start) }
        var full by remember(id) { mutableStateOf(false) }
        AlertDialog(
            onDismissRequest = { noting = null },
            title = { Text("Keep a note for ${Brand.MASCOT_SHORT}?") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Kept on this phone. ${Brand.MASCOT_SHORT} uses notes only if Smarter ${Brand.MASCOT_SHORT} is on (Me → Privacy). Edit it first if you like.", style = MaterialTheme.typography.bodySmall)
                    OutlinedTextField(value = note, onValueChange = { note = it.take(160) }, maxLines = 3)
                    if (full) Text("${Brand.MASCOT_SHORT} already keeps 10 notes. Delete one in Me → Profile first.", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    if (onRemember?.invoke(note) == true) { remembered = remembered + id; noting = null } else full = true
                }, enabled = note.isNotBlank()) { Text("Save note") }
            },
            dismissButton = { TextButton(onClick = { noting = null }) { Text("Cancel") } },
        )
    }

    reporting?.let { t ->
        var reason by remember(t.id) { mutableStateOf(REPORT_REASONS[0]) }
        var failed by remember(t.id) { mutableStateOf(false) }
        AlertDialog(
            onDismissRequest = { reporting = null },
            title = { Text("Report this reply") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Only this reply and your reason go to our safety team. Not the rest of the chat.", style = MaterialTheme.typography.bodySmall)
                    REPORT_REASONS.forEach { r ->
                        Row(Modifier.fillMaxWidth().clickable { reason = r }, verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = reason == r, onClick = { reason = r })
                            Text(r)
                        }
                    }
                    if (failed) Text("Couldn't send it. Check the connection and try again.", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    scope.launch {
                        if (chotu.report(t, reason)) { reported = reported + t.id; reporting = null } else failed = true
                    }
                }) { Text("Send report") }
            },
            dismissButton = { TextButton(onClick = { reporting = null }) { Text("Cancel") } },
        )
    }

}

@Composable
private fun Turn(t: ChotuTurn, onOpenNeedToTalk: () -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (t.fromUser) Arrangement.End else Arrangement.Start) {
        Column(
            Modifier.widthIn(max = 320.dp)
                .background(
                    if (t.fromUser) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainerHigh,
                    RoundedCornerShape(12.dp),
                )
                .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            if (t.jeetu) Row(verticalAlignment = Alignment.CenterVertically) { JeetuPortrait(20.dp); Text("  Jeetu", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary) }
            else if (!t.fromUser) Text(Brand.MASCOT, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            // Replies can carry markdown (bold, headings, lists); shown styled, never as raw symbols.
            Text(if (t.fromUser || t.text.isEmpty()) AnnotatedString(t.text.ifEmpty { "…" }) else chatMarkdown(t.text), style = MaterialTheme.typography.bodyLarge)
            if (t.care) TextButton(onClick = onOpenNeedToTalk) { Text("Talk to someone now") }
        }
    }
}

/**
 * "Explain simpler" under a Chai card. Shown only when Chotu's model is ready; the card itself never
 * depends on it.
 */
@Composable
fun ExplainSimpler(chotu: Chotu?, card: String, hindi: Boolean) {
    // On-phone model, or cloud Chotu while online. The card itself never depends on it.
    if (chotu == null || (chotu.onPhone == null && !chotu.cloudAvailable)) return
    var open by rememberSaveable(card) { mutableStateOf(false) }
    var answer by remember(card) { mutableStateOf("") }
    TextButton(onClick = { open = !open }) { Text(if (hindi) "आसान भाषा में समझाओ" else "Explain simpler") }
    if (open) {
        LaunchedEffect(card) {
            if (answer.isEmpty()) chotu.explain(card)
                .catch { answer = "Couldn't explain this one right now." }
                .collect { answer = it }
        }
        Column(Modifier.padding(bottom = 8.dp)) {
            Text(Brand.MASCOT, style = MaterialTheme.typography.labelSmall)
            Text(if (answer.isEmpty()) AnnotatedString("…") else chatMarkdown(answer), style = MaterialTheme.typography.bodyLarge)
        }
    }
}

/**
 * "Your week": effort totals first, then one win and one trend, all counted by the app (data/CheckIns.kt). Only ever
 * against the student's own past. Jeetu is offered when the numbers show a pattern.
 */
@Composable
fun YourWeekCard(facts: com.upscpods.app.data.StudyFacts, hindi: Boolean, onJeetu: (() -> Unit)?) {
    val lines = com.upscpods.app.data.CheckIns.weekLines(facts, hindi) ?: return
    Column(
        Modifier.fillMaxWidth().padding(vertical = 8.dp)
            .background(MaterialTheme.colorScheme.surfaceContainerHigh, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(if (hindi) "आपका हफ़्ता" else "Your week", style = MaterialTheme.typography.titleSmall)
        lines.forEach { Text(it, style = MaterialTheme.typography.bodyMedium) }
        if (onJeetu != null) OutlinedButton(onClick = onJeetu) { JeetuPortrait(20.dp); Text("  " + if (hindi) "Jeetu की राय चाहिए?" else "Want Jeetu's take?") }
    }
}
