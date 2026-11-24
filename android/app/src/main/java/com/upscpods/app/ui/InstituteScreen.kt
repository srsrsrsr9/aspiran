package com.upscpods.app.ui

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.upscpods.app.data.InstContentRow
import com.upscpods.app.data.InstDoubt
import com.upscpods.app.data.InstError
import com.upscpods.app.data.InstHeld
import com.upscpods.app.data.InstMe
import com.upscpods.app.data.InstPiece
import com.upscpods.app.data.InstPlans
import com.upscpods.app.data.InstPost
import com.upscpods.app.data.InstProgress
import com.upscpods.app.data.InstReviewItem
import com.upscpods.app.data.Institute
import com.upscpods.app.data.InvitePreview
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.io.File
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

// Coaching centres, the student side (data/Institute.kt; the web copy is server/public/app/institute.js). Only while the
// server's `institutes` flag is on. Your own numbers only; nobody else's. No timers, streaks or scores to compare.

private val IST = ZoneId.of("Asia/Kolkata")
private fun whenText(iso: String?): String = runCatching {
    OffsetDateTime.parse(iso).atZoneSameInstant(IST).format(DateTimeFormatter.ofPattern("d MMM, h:mm a", Locale.ENGLISH))
}.getOrDefault("")
private fun dayText(d: String): String = runCatching { LocalDate.parse(d).format(DateTimeFormatter.ofPattern("EEE d MMM", Locale.ENGLISH)) }.getOrDefault(d)

/** The centre's colour, or the app's own primary when it set none. */
@Composable
private fun brandColor(hex: String?): Color = Institute.colorOf(hex)?.let { Color(it) } ?: MaterialTheme.colorScheme.primary
@Composable
private fun inkColor(hex: String?): Color = Institute.inkOn(hex)?.let { Color(it) } ?: MaterialTheme.colorScheme.onPrimary

/** A centre's logo (public by id), loaded once per screen. Null until it arrives, or when there is none. */
@Composable
private fun rememberLogo(inst: Institute, path: String?): ImageBitmap? {
    val img by produceState<ImageBitmap?>(null, path) {
        value = path?.let { p -> inst.bytes(p)?.let { b -> runCatching { BitmapFactory.decodeByteArray(b, 0, b.size)?.asImageBitmap() }.getOrNull() } }
    }
    return img
}

@Composable
private fun Logo(inst: Institute, path: String?, name: String, size: Int, onBrand: Boolean = false) {
    val img = rememberLogo(inst, path)
    Box(Modifier.size(size.dp).clip(RoundedCornerShape(10.dp)).background(if (img != null) Color.White else if (onBrand) Color.White.copy(alpha = .22f) else MaterialTheme.colorScheme.surfaceContainerHigh),
        contentAlignment = Alignment.Center) {
        if (img != null) Image(img, contentDescription = null, contentScale = ContentScale.Fit, modifier = Modifier.fillMaxSize().padding(3.dp))
        else Text(name.take(1).uppercase(), fontWeight = FontWeight.Bold, fontSize = (size / 2).sp)
    }
}

@Composable
private fun Small(text: String, modifier: Modifier = Modifier) = Text(text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = modifier)

@Composable
private fun Tag(text: String, color: Color = MaterialTheme.colorScheme.secondaryContainer) {
    Text(text, style = MaterialTheme.typography.labelSmall, modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(color).padding(horizontal = 6.dp, vertical = 2.dp))
}

@Composable
private fun Soft(text: String) = FlatCard { Text(text, Modifier.padding(16.dp)) }

/**
 * The Adda's card for a member of a centre: its logo, name and batch, in its colour. With an invite still waiting and
 * no centre yet, a nudge to finish joining. Nothing otherwise.
 */
@Composable
fun CentreAddaCard(inst: Institute, onOpen: () -> Unit) {
    val m = inst.me
    if (m?.institute != null && !m.paused && m.role == "student") {
        val c = brandColor(m.institute.color)
        FlatCard(Modifier.clickable(onClick = onOpen).border(2.dp, c, MaterialTheme.shapes.medium)) {
            Row(Modifier.padding(14.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Logo(inst, m.institute.logo, m.institute.name, 40)
                Column(Modifier.weight(1f)) {
                    Text(m.institute.name, style = MaterialTheme.typography.titleMedium)
                    Small(listOfNotNull(m.batch?.name, "Today's plan, chat, doubts and notes").joinToString(" · "))
                }
                Text("→")
            }
        }
    } else if (m == null && inst.pending != null) {
        FlatCard(Modifier.clickable(onClick = onOpen)) {
            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Finish joining your coaching centre", style = MaterialTheme.typography.titleMedium)
                    Small("Your invite is waiting. One tap and your batch is here.")
                }
                Text("→")
            }
        }
    }
}

/** The line under Me → Coaching centre. */
fun centreMeLine(inst: Institute): Pair<String, String> = inst.me?.institute?.let { it.name to "Announcements, your batch chat, doubts, the plan and your centre's notes" }
    ?: ("Coaching centre" to "Joined a coaching centre that uses Aspiran? Use its link or code here")

private enum class CentreTab(val label: String, val feature: String) { PLAN("Plan", "plans"), CHAT("Chat", "chat"), DOUBTS("Doubts", "doubts"), CONTENT("Notes and sets", "content"), YOU("Your progress", "") }

/**
 * The centre's space: join (with a code or a pasted invite link), or its plan, chat, doubts, notes and sets, and your
 * own progress. [onNeedToTalk] opens the helplines when the server held a message.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun InstituteScreen(inst: Institute, hindi: Boolean, myName: String?, onNeedToTalk: () -> Unit, onClose: () -> Unit) {
    BackHandler(onBack = onClose)
    LaunchedEffect(Unit) { inst.refresh() }
    val m = inst.me
    val color = brandColor(m?.institute?.color)
    val ink = inkColor(m?.institute?.color)
    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().background(if (m?.institute != null) color else MaterialTheme.colorScheme.surface).padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            TextButton(onClick = onClose) { Text("← Back", color = if (m?.institute != null) ink else MaterialTheme.colorScheme.primary) }
            if (m?.institute != null) {
                Logo(inst, m.institute.logo, m.institute.name, 36, onBrand = true)
                Column(Modifier.weight(1f)) {
                    Text(m.institute.name, color = ink, fontWeight = FontWeight.Bold, fontSize = 18.sp, maxLines = 1)
                    Text(listOfNotNull(m.batch?.name, "with Aspiran").joinToString(" · "), color = ink.copy(alpha = .8f), fontSize = 12.sp, maxLines = 1)
                }
            } else Text("Coaching centre", style = MaterialTheme.typography.titleLarge)
        }
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            when {
                m?.institute == null -> JoinView(inst, myName)
                m.paused -> Soft("${m.institute.name} has paused its Aspiran space for now. Everything of yours in Aspiran itself is untouched.")
                m.role != "student" -> {
                    val uri = LocalUriHandler.current
                    Soft("You're ${if (m.role == "teacher") "a teacher" else "an ${m.role}"} at ${m.institute.name}. Your tools are in the console, on the web.")
                    Button(onClick = { runCatching { uri.openUri("https://app.aspiran.in/institute") } }) { Text("Open the console") }
                    LeaveCard(inst, m)
                }
                else -> {
                    val tabs = CentreTab.entries.filter { it.feature.isEmpty() || m.on(it.feature) }
                    var tab by rememberSaveable { mutableStateOf(tabs.first().name) }
                    var openPiece by remember { mutableStateOf<String?>(null) }
                    val now = tabs.firstOrNull { it.name == tab } ?: tabs.first()
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        tabs.forEach { t ->
                            FilterChip(selected = now == t, onClick = { tab = t.name; openPiece = null }, label = { Text(t.label) },
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = color, selectedLabelColor = ink))
                        }
                    }
                    when (now) {
                        CentreTab.PLAN -> PlanView(inst, onOpen = if (m.on("content")) ({ id: String -> openPiece = id; tab = CentreTab.CONTENT.name }) else null)
                        CentreTab.CHAT -> ChatView(inst, m, onNeedToTalk)
                        CentreTab.DOUBTS -> DoubtsView(inst, m, onNeedToTalk)
                        CentreTab.CONTENT -> ContentView(inst, hindi, openPiece) { openPiece = it }
                        CentreTab.YOU -> YouView(inst, m)
                    }
                }
            }
        }
    }
}

/** What the server said when it held a message: the care line, and a way to people now. */
@Composable
private fun CareCard(message: String, onNeedToTalk: () -> Unit, onBack: () -> Unit) {
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(message)
            Button(onClick = onNeedToTalk) { Text("Talk to someone now") }
            TextButton(onClick = onBack) { Text("Back") }
        }
    }
}

// --- Joining ---------------------------------------------------------------------------------------------------------

@Composable
private fun InviteHero(inst: Institute, p: InvitePreview) {
    val c = brandColor(p.institute.color)
    val ink = inkColor(p.institute.color)
    val uri = LocalUriHandler.current
    FlatCard {
        Row(Modifier.fillMaxWidth().background(c).padding(16.dp), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Logo(inst, p.institute.logo, p.institute.name, 52, onBrand = true)
            Column {
                Text(p.institute.name, color = ink, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                p.institute.city?.let { Text(it, color = ink.copy(alpha = .85f), fontSize = 13.sp) }
            }
        }
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(if (p.role == "student") "Join ${p.batch?.name ?: "your batch"}" else "${p.institute.name} invites you", style = MaterialTheme.typography.titleLarge)
            Text(if (p.role == "student") "${p.institute.name} runs this batch on Aspiran. Your plan, notes and tests, your doubts and the batch chat are all here, free for you."
                else "This is a staff invite: it opens in the centre's console, on the web.")
            if (p.role != "student") Button(onClick = { runCatching { uri.openUri("https://app.aspiran.in/institute#join=" + Institute.cleanCode(p.code)) } }) { Text("Open the console") }
        }
    }
}

@Composable
private fun JoinView(inst: Institute, myName: String?) {
    val scope = rememberCoroutineScope()
    var code by rememberSaveable { mutableStateOf(inst.pending?.let { Institute.showCode(it) } ?: "") }
    var name by rememberSaveable { mutableStateOf(myName?.takeIf { it.isNotBlank() && it != "Aspirant" } ?: "") }
    var ok by rememberSaveable { mutableStateOf(false) }
    var showWhat by rememberSaveable { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val clean = Institute.cleanCode(code)
    var preview by remember { mutableStateOf<InvitePreview?>(null) }
    var dead by remember { mutableStateOf(false) }
    LaunchedEffect(clean) {
        preview = null; dead = false
        if (clean.length == 8) {
            inst.remember(clean)
            try { preview = inst.preview(clean) } catch (e: InstError) { dead = true }
        }
    }
    preview?.let { InviteHero(inst, it) }
    if (dead) Soft("This invite isn't working any more. It may have been used up or expired. Ask your centre for a new one; you can still use Aspiran on your own.")
    if (preview?.role?.let { it != "student" } == true) return
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (inst.pending == null && preview == null) Text("If your coaching centre uses Aspiran, it sends you a link or a code. Joining adds its plan, chat and notes to your Aspiran.")
            Small("Already use Aspiran? Nothing changes: your pod, Chotu, notes and progress stay as they are. Your centre is added alongside.")
            OutlinedTextField(code, { code = it.take(80) }, label = { Text("Code or invite link") }, placeholder = { Text("KXR7-M2PD") }, singleLine = true,
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters), modifier = Modifier.fillMaxWidth())
            OutlinedTextField(name, { name = it.take(40) }, label = { Text("Your name, as the centre will see it") }, placeholder = { Text("e.g. Priya Rao") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            TextButton(onClick = { showWhat = !showWhat }) { Text((if (showWhat) "▾ " else "▸ ") + "What your centre will and won't see") }
            if (showWhat) {
                Text("It sees your name, your batch, the days you used Aspiran and your focus minutes since joining, your answers to its question sets and tests, your doubts, and your messages in its chat.", style = MaterialTheme.typography.bodySmall)
                Text("It never sees your email or phone, your pod and Chotu chats, your journal, your own practice and mocks, or anything from before you joined. You can leave at any time.", style = MaterialTheme.typography.bodySmall)
            }
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { ok = !ok }) {
                Checkbox(ok, { ok = it })
                Text("I've read what my centre will see, and I'm happy to join.")
            }
            error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            Button(enabled = !busy && clean.length == 8, onClick = {
                busy = true; error = null
                scope.launch {
                    try { inst.join(clean, name, ok) } catch (e: Exception) { error = e.message }
                    busy = false
                }
            }) { Text(if (busy) "Joining…" else "Join") }
        }
    }
}

// --- Plan ------------------------------------------------------------------------------------------------------------

@Composable
private fun PlanView(inst: Institute, onOpen: ((String) -> Unit)?) {
    val scope = rememberCoroutineScope()
    var data by remember { mutableStateOf<InstPlans?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) { try { data = inst.plan() } catch (e: Exception) { error = e.message } }
    error?.let { Soft(it); return }
    val d = data ?: return Small("Loading…")
    if (d.plans.isEmpty()) return Soft("No plan from your centre yet.")
    val ticks = remember(d) { androidx.compose.runtime.mutableStateMapOf<String, Boolean>().apply { d.plans.flatMap { it.items }.forEach { put(it.id, it.done) } } }
    var showEarlier by rememberSaveable { mutableStateOf(false) }
    d.plans.forEach { p ->
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(p.title, style = MaterialTheme.typography.titleMedium)
            if (p.forYou) Tag("just for you")
        }
        val days = p.items.map { it.day }.distinct()
        val upcoming = days.filter { it >= d.today }.take(7)
        val past = days.filter { it < d.today }.reversed()
        @Composable
        fun DayCard(day: String) = FlatCard {
            Column(Modifier.padding(12.dp)) {
                Text(if (day == d.today) "Today" else dayText(day), fontWeight = FontWeight.Bold)
                p.items.filter { it.day == day }.forEach { i ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(ticks[i.id] == true, { v ->
                            ticks[i.id] = v
                            scope.launch { runCatching { inst.tick(i.id, v) }.onFailure { ticks[i.id] = !v } }
                        }, modifier = Modifier.semantics { contentDescription = "Done: ${i.title}" })
                        Column(Modifier.weight(1f)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                if (i.kind.isNotBlank()) Tag(i.kind)
                                Text(i.title)
                            }
                            listOfNotNull(i.topic?.takeIf { it != i.title }, i.note).forEach { Small(it) }
                        }
                        if (i.contentId != null && onOpen != null) TextButton(onClick = { onOpen(i.contentId) }) { Text("Open") }
                    }
                }
            }
        }
        upcoming.forEach { DayCard(it) }
        if (past.isNotEmpty()) {
            TextButton(onClick = { showEarlier = !showEarlier }) { Text((if (showEarlier) "▾ " else "▸ ") + "Earlier days") }
            if (showEarlier) past.forEach { DayCard(it) }
        }
    }
    Small("Tick what you've done. Nobody else sees your ticks; your teachers see how much of the plan you've done.")
}

// --- Chat ------------------------------------------------------------------------------------------------------------

@Composable
private fun ChatView(inst: Institute, m: InstMe, onNeedToTalk: () -> Unit) {
    val scope = rememberCoroutineScope()
    val messages = remember { mutableStateListOf<InstPost>() }
    var announcements by remember { mutableStateOf<List<InstPost>>(emptyList()) }
    var noBatch by remember { mutableStateOf(false) }
    var loaded by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var held by remember { mutableStateOf<String?>(null) }
    var input by rememberSaveable { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var reporting by remember { mutableStateOf<InstPost?>(null) }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    suspend fun load() {
        val d = inst.feed(messages.lastOrNull()?.at)
        if (d.batch == null) { noBatch = true; return }
        if (!loaded) announcements = d.announcements
        d.messages.filter { x -> messages.none { it.id == x.id } }.forEach { messages.add(it) }
        while (messages.size > 200) messages.removeAt(0)
        loaded = true
    }
    // New messages every 10 seconds while the chat is on screen and the app is in front.
    LaunchedEffect(Unit) {
        try { load() } catch (e: Exception) { error = e.message }
        while (true) {
            delay(10_000)
            if (lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) runCatching { load() }
        }
    }
    held?.let { CareCard(it, onNeedToTalk) { held = null }; return }
    error?.let { if (!loaded) { Soft(it); return } }
    if (noBatch) return Soft("You're not in a batch yet. Ask your centre.")
    if (!loaded) return Small("Loading…")
    announcements.forEach { a ->
        FlatCard(Modifier.border(1.dp, brandColor(m.institute?.color), MaterialTheme.shapes.medium)) {
            Column(Modifier.padding(12.dp)) {
                Row { Text("📌 " + a.name, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f)); Small(whenText(a.at)) }
                Text(a.text)
            }
        }
    }
    Text(m.batch?.name ?: "Your batch", style = MaterialTheme.typography.titleMedium)
    FlatCard {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            if (messages.isEmpty()) Small("No messages yet. Say hello.")
            messages.forEach { x ->
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(if (x.mine) "You" else x.name, fontWeight = FontWeight.Bold)
                        if (x.role == "teacher") Tag("teacher")
                        Spacer(Modifier.weight(1f))
                        Small(whenText(x.at))
                    }
                    Text(x.text)
                    if (!x.mine) TextButton(onClick = { reporting = x }, modifier = Modifier.heightIn(min = 48.dp)) { Text("Report", fontSize = 12.sp) }
                }
            }
        }
    }
    OutlinedTextField(input, { input = it.take(1000) }, label = { Text("Write to your batch") }, minLines = 2, modifier = Modifier.fillMaxWidth())
    error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    Button(enabled = !sending && input.isNotBlank(), onClick = {
        sending = true; error = null
        scope.launch {
            try { inst.send(input); input = ""; load() } catch (e: InstHeld) { held = e.message; input = "" } catch (e: Exception) { error = e.message }
            sending = false
        }
    }) { Text("Send") }
    Small("Your batch and your teachers see this chat. Be kind; teachers can hide messages.")
    reporting?.let { x ->
        var why by remember { mutableStateOf("") }
        AlertDialog(onDismissRequest = { reporting = null }, title = { Text("Report this message") },
            text = { Column { Text("What's wrong with it? Your teachers will see this."); OutlinedTextField(why, { why = it.take(300) }, modifier = Modifier.fillMaxWidth()) } },
            confirmButton = { Button(onClick = { reporting = null; scope.launch { runCatching { inst.report(x.id, why.ifBlank { "Reported" }) } } }) { Text("Report") } },
            dismissButton = { TextButton(onClick = { reporting = null }) { Text("Cancel") } })
    }
}

// --- Doubts ----------------------------------------------------------------------------------------------------------

/** A photo made small enough to send: about 1600 px on its long side, JPEG, under 1.5 MB. Null when it can't be read. */
private fun shrinkJpeg(context: android.content.Context, uri: Uri): ByteArray? = runCatching {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
    var sample = 1
    while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 1600) sample *= 2
    val bmp = context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) } ?: return null
    val scale = 1600f / maxOf(bmp.width, bmp.height)
    val out = if (scale < 1f) Bitmap.createScaledBitmap(bmp, (bmp.width * scale).toInt(), (bmp.height * scale).toInt(), true) else bmp
    listOf(82, 70, 55).firstNotNullOfOrNull { q -> ByteArrayOutputStream().use { s -> out.compress(Bitmap.CompressFormat.JPEG, q, s); s.toByteArray() }.takeIf { it.size < 1_450_000 } }
}.getOrNull()

private val STATUS = mapOf("open" to "waiting", "answered" to "answered", "resolved" to "resolved")

@Composable
private fun DoubtsView(inst: Institute, m: InstMe, onNeedToTalk: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var list by remember { mutableStateOf<List<InstDoubt>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var held by remember { mutableStateOf<String?>(null) }
    var text by rememberSaveable { mutableStateOf("") }
    var topic by rememberSaveable { mutableStateOf<String?>(null) }
    var topicMenu by remember { mutableStateOf(false) }
    var photo by remember { mutableStateOf<ByteArray?>(null) }
    var busy by remember { mutableStateOf(false) }
    var note by remember { mutableStateOf<String?>(null) }
    var reload by remember { mutableIntStateOf(0) }
    LaunchedEffect(reload) { try { list = inst.doubts() } catch (e: Exception) { error = e.message } }
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) { photo = shrinkJpeg(context, uri); if (photo == null) note = "That photo couldn't be read. Try another." }
    }
    val shotFile = remember { File(context.cacheDir, "doubt").apply { mkdirs() }.let { File(it, "doubt.jpg") } }
    androidx.compose.runtime.DisposableEffect(Unit) { onDispose { shotFile.delete() } }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        if (ok && shotFile.length() > 0) photo = shrinkJpeg(context, Uri.fromFile(shotFile))
        shotFile.delete()
    }
    val topics = remember { Institute.topics() }
    held?.let { CareCard(it, onNeedToTalk) { held = null }; return }
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Ask a doubt", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(text, { text = it.take(2000) }, placeholder = { Text("What's the doubt? A sentence or two is enough.") }, minLines = 3, modifier = Modifier.fillMaxWidth())
            Box {
                OutlinedButton(onClick = { topicMenu = true }) { Text(topics.firstOrNull { it.first == topic }?.second ?: "Topic (optional)", maxLines = 1) }
                DropdownMenu(topicMenu, { topicMenu = false }) {
                    DropdownMenuItem(text = { Text("No topic") }, onClick = { topic = null; topicMenu = false })
                    topics.forEach { (id, label) -> DropdownMenuItem(text = { Text(label) }, onClick = { topic = id; topicMenu = false }) }
                }
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { pick.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }) { Text(if (photo == null) "Add a photo" else "Change photo") }
                OutlinedButton(onClick = {
                    runCatching { camera.launch(FileProvider.getUriForFile(context, "${context.packageName}.share", shotFile)) }.onFailure { note = "No camera app found. You can pick a photo instead." }
                }) { Text("Take a photo") }
                if (photo != null) TextButton(onClick = { photo = null }) { Text("Remove photo") }
            }
            photo?.let { b ->
                val img = remember(b) { runCatching { BitmapFactory.decodeByteArray(b, 0, b.size)?.asImageBitmap() }.getOrNull() }
                img?.let { Image(it, contentDescription = "Your photo", modifier = Modifier.fillMaxWidth().heightIn(max = 220.dp).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Fit) }
            }
            (note ?: error)?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            Button(enabled = !busy && text.trim().length >= 5, onClick = {
                busy = true; note = null; error = null
                scope.launch {
                    try {
                        val first = inst.ask(text, topic, photo)
                        text = ""; photo = null; topic = null
                        note = null
                        android.widget.Toast.makeText(context, if (first) "Sent. Aspiran left a first answer; your teacher will follow." else "Sent to your teachers.", android.widget.Toast.LENGTH_LONG).show()
                        reload++
                    } catch (e: InstHeld) { held = e.message; text = ""; photo = null } catch (e: Exception) { note = e.message }
                    busy = false
                }
            }) { Text(if (busy) "Sending…" else "Send to my teachers") }
        }
    }
    val l = list ?: return Small("Loading…")
    if (l.isEmpty()) Small("Your doubts show here. Only you and your teachers see them.")
    l.forEach { d -> DoubtCard(inst, d, onHeld = { held = it }) }
}

@Composable
private fun DoubtCard(inst: Institute, d: InstDoubt, onHeld: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var open by remember { mutableStateOf(false) }
    var replies by remember { mutableStateOf<List<InstPost>?>(null) }
    var img by remember { mutableStateOf<ImageBitmap?>(null) }
    var status by remember { mutableStateOf(d.status) }
    var reply by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    suspend fun load() {
        replies = inst.replies(d.id)
        if (d.photo && img == null) img = inst.photo(d.id)?.let { b -> runCatching { BitmapFactory.decodeByteArray(b, 0, b.size)?.asImageBitmap() }.getOrNull() }
    }
    FlatCard {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Tag(STATUS[status] ?: status)
                d.topic?.let { Small(it, Modifier.weight(1f)) } ?: Spacer(Modifier.weight(1f))
                Small(whenText(d.updatedAt))
            }
            Text(d.text)
            if (!open) TextButton(onClick = { open = true; scope.launch { try { load() } catch (e: Exception) { error = e.message } } }) { Text("Open") }
            else {
                img?.let { Image(it, contentDescription = "Your photo", modifier = Modifier.fillMaxWidth().heightIn(max = 320.dp).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Fit) }
                replies?.forEach { r ->
                    Column(Modifier.padding(top = 4.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(if (r.role == "student") "You" else r.name, fontWeight = FontWeight.Bold)
                            // The centre's quick first answer: never called "AI" (owner, 17 Nov 2026).
                            if (r.role == "ai") Tag("first answer", MaterialTheme.colorScheme.tertiaryContainer)
                            if (r.role == "teacher") Tag("teacher")
                            Small(whenText(r.at))
                        }
                        Text(r.text)
                        if (r.role == "ai") Small("A quick first answer from Aspiran. Your teacher checks doubts too.")
                    }
                } ?: Small("Loading…")
                OutlinedTextField(reply, { reply = it.take(3000) }, placeholder = { Text("Still unclear? Ask again here.") }, minLines = 2, modifier = Modifier.fillMaxWidth())
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(enabled = reply.isNotBlank(), onClick = {
                        scope.launch {
                            try { inst.reply(d.id, reply); reply = ""; status = "open"; load() } catch (e: InstHeld) { onHeld(e.message ?: "") } catch (e: Exception) { error = e.message }
                        }
                    }) { Text("Send") }
                    if (status != "resolved") TextButton(onClick = { scope.launch { runCatching { inst.resolve(d.id); status = "resolved" }.onFailure { error = it.message } } }) { Text("This is cleared up") }
                }
            }
        }
    }
}

// --- Notes and question sets -----------------------------------------------------------------------------------------

@Composable
private fun ContentView(inst: Institute, hindi: Boolean, openId: String?, onOpen: (String?) -> Unit) {
    if (openId != null) return PieceView(inst, hindi, openId) { onOpen(null) }
    var items by remember { mutableStateOf<List<InstContentRow>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) { try { items = inst.content() } catch (e: Exception) { error = e.message } }
    error?.let { Soft(it); return }
    val l = items ?: return Small("Loading…")
    if (l.isEmpty()) return Soft("Your centre hasn't shared notes or question sets yet.")
    l.forEach { c ->
        FlatCard(Modifier.clickable { onOpen(c.id) }) {
            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(c.title, style = MaterialTheme.typography.titleMedium)
                    Small(listOfNotNull(when (c.kind) { "note" -> "Note"; "test" -> "Test (one go)"; else -> "Practice set" }, c.topic,
                        c.questions?.let { "$it questions" }, if (c.attempts > 0) "done" else null).joinToString(" · "))
                }
                Text("→")
            }
        }
    }
}

@Composable
private fun PieceView(inst: Institute, hindi: Boolean, id: String, onBack: () -> Unit) {
    val scope = rememberCoroutineScope()
    var c by remember(id) { mutableStateOf<InstPiece?>(null) }
    var error by remember(id) { mutableStateOf<String?>(null) }
    var result by remember(id) { mutableStateOf<Pair<Int, List<InstReviewItem>>?>(null) }
    var total by remember(id) { mutableIntStateOf(0) }
    val chosen = remember(id) { mutableStateListOf<Int?>() }
    var busy by remember { mutableStateOf(false) }
    LaunchedEffect(id) {
        try {
            val p = inst.piece(id); c = p
            chosen.clear(); repeat(p.questions(false).size) { chosen.add(null) }
            p.taken?.let { result = it.right to it.review; total = it.total }
        } catch (e: Exception) { error = e.message }
    }
    TextButton(onClick = onBack) { Text("← All notes and sets") }
    error?.let { Soft(it); return }
    val p = c ?: return Small("Loading…")
    Text(p.title, style = MaterialTheme.typography.headlineSmall)
    p.topic?.let { Small(it) }
    if (p.kind == "note") {
        FlatCard { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { p.body(hindi).split(Regex("\n{2,}")).forEach { Text(it, style = ReadingText) } } }
        return
    }
    val qs = p.questions(hindi)
    result?.let { (right, review) ->
        Text("You got $right of $total." + if (p.taken != null) " Here's each one again." else "")
        review.forEachIndexed { i, r ->
            val q = qs.getOrNull(i) ?: return@forEachIndexed
            FlatCard {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("${i + 1}. ${q.question}", fontWeight = FontWeight.Bold)
                    Text(when { r.chosen == null -> "Skipped."; r.right -> "✓ Right."; else -> "✗ You chose ${q.options.getOrNull(r.chosen) ?: "—"}." })
                    Text("Answer: ${q.options.getOrNull(r.answerIndex) ?: ""}")
                    ((if (hindi) r.hiExplanation else null) ?: r.explanation)?.let { Small(it) }
                }
            }
        }
        return
    }
    Small(if (p.kind == "test") "A test: one go, marked when you finish. Your teachers see your answers; nobody else does."
        else "Practice: answer, then see each explanation. Your teachers see how you did; nobody else does.")
    qs.forEachIndexed { i, q ->
        FlatCard {
            Column(Modifier.padding(14.dp)) {
                Text("${i + 1}. ${q.question}", fontWeight = FontWeight.Bold)
                q.options.forEachIndexed { j, o ->
                    Row(Modifier.fillMaxWidth().clickable { chosen[i] = j }.padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(chosen.getOrNull(i) == j, { chosen[i] = j })
                        Text(o)
                    }
                }
            }
        }
    }
    error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    Button(enabled = !busy && chosen.any { it != null }, onClick = {
        busy = true
        scope.launch {
            try { val r = inst.attempt(p.id, chosen.toList()); total = r.total; result = r.right to r.review } catch (e: Exception) { error = e.message }
            busy = false
        }
    }) { Text("Finish and see answers") }
}

// --- Your own progress -----------------------------------------------------------------------------------------------

@Composable
private fun YouView(inst: Institute, m: InstMe) {
    var s by remember { mutableStateOf<InstProgress?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) { try { s = inst.progress() } catch (e: Exception) { error = e.message } }
    error?.let { Soft(it) }
    s?.let { p ->
        Small("Only you and your teachers at ${m.institute?.name} see this. Since you joined.")
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                @Composable fun Line(a: String, b: String) = Row { Text(a, Modifier.weight(1f)); Text(b, fontWeight = FontWeight.Bold) }
                Line("Days you used Aspiran (last 14)", "${p.daysActive14}")
                Line("Focus minutes", "${p.focusMinutes}")
                Line("Questions answered in your centre's sets", "${p.answered}")
                p.accuracy?.let { Line("Right first time", "$it%") }
                Line("Plan items done", "${p.planDone} of ${p.planDue} so far")
                Line("Doubts cleared", "${p.doubtsResolved} of ${p.doubtsRaised}")
            }
        }
        if (p.weakTopics.isNotEmpty()) FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Worth another look", style = MaterialTheme.typography.titleMedium)
                Small("Topics where under 60% of your answers were right (at least 5 answers).")
                p.weakTopics.forEach { w -> Row { Text(w.topic, Modifier.weight(1f)); Small("${w.pct}% of ${w.answered}") } }
            }
        }
    } ?: if (error == null) Small("Loading…") else Unit
    LeaveCard(inst, m)
}

@Composable
private fun LeaveCard(inst: Institute, m: InstMe) {
    val scope = rememberCoroutineScope()
    var show by rememberSaveable { mutableStateOf(false) }
    var ask by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val name = m.institute?.name ?: "your centre"
    FlatCard {
        Column(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
            TextButton(onClick = { show = !show }) { Text((if (show) "▾ " else "▸ ") + "Leave $name") }
            if (show) {
                Text("Leaving removes you from its chat, plan and analytics. Your answers to its sets are deleted; your doubts and messages stay without your name. Your Aspiran account, pod and practice are untouched.",
                    style = MaterialTheme.typography.bodySmall)
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                OutlinedButton(onClick = { ask = true }, modifier = Modifier.padding(vertical = 8.dp)) { Text("Leave") }
            }
        }
    }
    if (ask) AlertDialog(onDismissRequest = { ask = false }, title = { Text("Leave $name?") },
        confirmButton = { Button(onClick = { ask = false; scope.launch { runCatching { inst.leave() }.onFailure { error = it.message } } },
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) { Text("Leave") } },
        dismissButton = { TextButton(onClick = { ask = false }) { Text("Stay") } })
}
