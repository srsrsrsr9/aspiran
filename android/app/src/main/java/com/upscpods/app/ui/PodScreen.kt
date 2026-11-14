@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.upscpods.app.ui

import kotlinx.coroutines.launch
import com.upscpods.app.data.ContentLibrary
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.material3.FilterChip
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.heightIn
import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.runtime.produceState
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import com.upscpods.app.data.Community
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import com.upscpods.app.data.DistressMatcher
import com.upscpods.app.data.PodClient
import com.upscpods.app.data.PodMessage
import com.upscpods.app.data.PodStatus
import com.upscpods.app.data.StudyRoom
import kotlinx.coroutines.delay
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault())

/** Pod chat and the shared study room. Presence, not performance: nobody's scores, ever. */
@Composable
fun PodTab(
    pod: PodClient,
    onOpenNeedToTalk: () -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier,
    library: ContentLibrary? = null,
    /** Pod v2 cards above the chat: the staged profile ask, the private stay-or-move choice. */
    top: @Composable () -> Unit = {},
    /** Result-day mode: the pod opens only if the member taps in. */
    resultDay: String? = null,
    /** Pods v2 (Answer hour, the helper, joining up): pods only, not open rooms. */
    v2: Boolean = true,
    hindi: Boolean = false,
) {
    var enteredOnResultDay by rememberSaveable { mutableStateOf(false) }
    if (resultDay != null && !enteredOnResultDay) {
        Column(modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(resultDay, style = MaterialTheme.typography.titleMedium)
            Text("Your pod is here when you want it. No one is waiting for your news, and you don't have to share anything.", style = MaterialTheme.typography.bodyMedium)
            OutlinedButton(onClick = { enteredOnResultDay = true }) { Text("Open my pod") }
            TextButton(onClick = onOpenNeedToTalk) { Text("Need to talk? · किसी से बात करनी है?") }
        }
        return
    }
    LaunchedEffect(Unit) { pod.unread = 0 }
    LaunchedEffect(pod.messages.size) { pod.unread = 0 }
    LaunchedEffect(pod.careRequested) {
        if (pod.careRequested) { pod.careRequested = false; onOpenNeedToTalk() }
    }
    var reporting by remember { mutableStateOf<PodMessage?>(null) }
    var favour by remember { mutableStateOf<String?>(null) }
    val community = remember(pod) { Community({ pod.serverUrl }, { pod.memberId }) }
    var askLead by rememberSaveable { mutableStateOf(false) }

    Column(modifier.fillMaxSize().imePadding()) {
        StatusLine(pod, onOpenSettings)
        if (pod.status == PodStatus.NO_SERVER) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Your pod lives on the pod server.", style = MaterialTheme.typography.titleMedium)
                Text(
                    "For testing, run the server on your PC (see server/README.md) and put its address in Me → My Path → Pod server.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                OutlinedButton(onClick = onOpenSettings) { Text("Open My Path") }
            }
            return@Column
        }
        PodHeader(pod)
        if (v2) {
            MergeCard(pod, community)
            HelperNote(pod)
        }
        top()
        var tools by rememberSaveable { mutableStateOf(false) }
        TextButton(onClick = { tools = !tools }, modifier = Modifier.padding(horizontal = 8.dp)) {
            Text(if (tools) "Hide study room and quiz" else if (v2) "Answer hour · study room · Quiz Night · goal" else "Study room · Quiz Night · goal")
        }
        if (tools) Column(Modifier.heightIn(max = 420.dp).verticalScroll(rememberScrollState())) {
            if (v2) {
                AnswerHourCard(pod, library, hindi, onOpenNeedToTalk)
                HelperCard(pod, library, hindi)
            }
            GoalCard(pod)
            QuizCard(pod)
            StudyRoomCard(pod, library)
        }
        val list = rememberLazyListState()
        val shown = pod.messages + pod.outbox
        LaunchedEffect(shown.size) { if (shown.isNotEmpty()) list.animateScrollToItem(shown.lastIndex) }
        LazyColumn(
            Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp),
            state = list,
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            if (shown.isEmpty()) item {
                Text("Quiet so far. Say hello, or send a chai ping.", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(vertical = 16.dp))
            }
            items(shown, key = { it.id }) { m ->
                Bubble(m, mine = m.memberId == pod.memberId, sending = m in pod.outbox, onLongPress = { if (m.kind in setOf("chat", "favour", "offer", "answer") && m.memberId != pod.memberId) reporting = m },
                    thanked = m.id in pod.thanked, loadPhoto = community::photo,
                    onThank = if (m.kind in setOf("chat", "favour", "offer") && m.memberId != pod.memberId && pod.status == PodStatus.ONLINE) ({ pod.thank(m.id) }) else null)
            }
        }
        pod.notice?.let {
            Text(it, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(horizontal = 16.dp))
            LaunchedEffect(it) { delay(4000); pod.notice = null }
        }
        FavoursStrip(pod, onAsk = { favour = "favour" }, onOffer = { favour = "offer" }, onAskLead = { askLead = true })
        Composer(pod, onOpenNeedToTalk)
    }

    favour?.let { kind -> FavourDialog(kind, onDismiss = { favour = null }) { text -> pod.say(text, kind); favour = null } }
    if (askLead) LeadNotesDialog(pod, onOpenNeedToTalk, onDismiss = { askLead = false })

    reporting?.let { m ->
        AlertDialog(
            onDismissRequest = { reporting = null },
            title = { Text("Report this message?") },
            text = { Text("A moderator will see it. ${m.name} won't be told who reported it.") },
            confirmButton = { TextButton(onClick = { pod.report(m.id, "member report"); reporting = null }) { Text("Report") } },
            dismissButton = { TextButton(onClick = { reporting = null }) { Text("Cancel") } },
        )
    }
}

/** "Forming · 2 of 8 · opens Monday 19 Oct". Real numbers only, never a promise of how many will come. */
@Composable
private fun PodHeader(pod: PodClient) {
    val s = pod.summary
    Column(Modifier.padding(horizontal = 16.dp)) {
        pod.movedNote?.let { note ->
            Text(note, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
            LaunchedEffect(note) { delay(8000); pod.movedNote = null }
        }
        if (s != null) {
            val opens = s.opensOn?.let { d ->
                runCatching { java.time.LocalDate.parse(d).format(DateTimeFormatter.ofPattern("EEEE d MMM")) }.getOrNull()
            }
            Text(listOfNotNull(s.header, opens?.let { "opens $it" }, if (s.state == "quiet") "quiet lately" else null).joinToString(" · "),
                style = MaterialTheme.typography.labelLarge)
            if (s.closest) Text("Nobody shares your exact stage, attempts and study time yet, so you're in the closest pod: same stage and language. " +
                "If a pod for your exact group forms, you'll be asked privately whether to move. Nobody moves unless they choose to.", style = MaterialTheme.typography.bodySmall)
            if (s.sizeState == "forming") Text("Chotu keeps the pod company until more people join on Monday. It's labelled AI, always.", style = MaterialTheme.typography.bodySmall)
        }
        pod.goal?.let { g ->
            val pct = if (g.target > 0) (g.done.toFloat() / g.target).coerceIn(0f, 1f) else 0f
            Text("This week: ${g.text} · ${g.done} of ${g.target} ${g.unit}".trim(), style = MaterialTheme.typography.bodySmall)
            LinearProgressIndicator(progress = { pct }, modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp))
        }
    }
}

/** One shared goal bar. The lead sets it (anyone can, when there's no lead); everyone adds to it. */
@Composable
private fun GoalCard(pod: PodClient) {
    var editing by rememberSaveable { mutableStateOf(false) }
    val g = pod.goal
    val canSet = pod.isLead || pod.lead == null
    FlatCard(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp)) {
            Text("This week's pod goal", style = MaterialTheme.typography.titleSmall)
            if (g == null) Text(if (canSet) "No goal yet. Set one small thing the pod does together." else "Your lead hasn't set one yet.", style = MaterialTheme.typography.bodySmall)
            else Text("${g.text}: ${g.done} of ${g.target} ${g.unit}. Who added what isn't kept.", style = MaterialTheme.typography.bodySmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                if (g != null) TextButton(onClick = { pod.addToGoal(1) }, enabled = pod.status == PodStatus.ONLINE) { Text("I did one") }
                if (canSet) TextButton(onClick = { editing = true }, enabled = pod.status == PodStatus.ONLINE) { Text(if (g == null) "Set a goal" else "Change") }
            }
        }
    }
    if (editing) {
        var text by rememberSaveable { mutableStateOf(g?.text ?: "Prelims questions together") }
        var target by rememberSaveable { mutableStateOf((g?.target ?: 200).toString()) }
        AlertDialog(
            onDismissRequest = { editing = false },
            title = { Text("This week's pod goal") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = text, onValueChange = { text = it.take(120) }, label = { Text("What") }, singleLine = true)
                    OutlinedTextField(value = target, onValueChange = { target = it.filter(Char::isDigit).take(4) }, label = { Text("How many, together") }, singleLine = true)
                }
            },
            confirmButton = { TextButton(onClick = { pod.setGoal(text, target.toIntOrNull() ?: 1, ""); editing = false }, enabled = text.isNotBlank()) { Text("Set") } },
            dismissButton = { TextButton(onClick = { editing = false }) { Text("Cancel") } },
        )
    }
}

/** Pod Quiz Night: one shared pod score. Your own picks show only to you. */
@Composable
private fun QuizCard(pod: PodClient) {
    val q = pod.quiz ?: return
    FlatCard(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Pod Quiz Night", style = MaterialTheme.typography.titleSmall)
            Text(
                listOfNotNull(
                    q.score.pct?.let { "The pod so far: $it% right" } ?: "Nobody has answered yet",
                    q.lastWeekPct?.let { "last week $it%" },
                ).joinToString(" · "),
                style = MaterialTheme.typography.bodySmall,
            )
            q.questions.forEachIndexed { i, question ->
                Text("${i + 1}. ${question.question}", style = MaterialTheme.typography.bodyMedium)
                val mine = pod.quizMine[i]
                val result = pod.quizResults[i]
                question.options.forEachIndexed { o, opt ->
                    val mark = when {
                        result != null && o == result.answerIndex -> "✓ "
                        mine == o -> "• "
                        else -> ""
                    }
                    TextButton(onClick = { pod.answerQuiz(i, o) }, enabled = mine == null && pod.status == PodStatus.ONLINE) { Text(mark + opt) }
                }
                result?.let { r ->
                    Text((if (r.right) "Right. " else "Not this time. ") + r.explanation, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun StatusLine(pod: PodClient, onOpenSettings: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        pod.online.take(6).forEach { Initial(it) }
        Spacer(Modifier.size(8.dp))
        Text(
            when (pod.status) {
                PodStatus.ONLINE -> if (pod.online.size <= 1) "Only you here right now" else "${pod.online.size} here now"
                PodStatus.CONNECTING -> "Connecting…"
                PodStatus.OFFLINE -> "Offline · messages send when you're back"
                PodStatus.NO_SERVER -> "No pod server set"
                PodStatus.PAUSED -> pod.pausedNote ?: "Pod chat is paused for now"
            },
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f),
        )
        // The server address is a testing setting, so only debug builds offer it.
        if (pod.status == PodStatus.OFFLINE && com.upscpods.app.BuildConfig.DEBUG) TextButton(onClick = onOpenSettings) { Text("Server") }
    }
}

@Composable
private fun Initial(name: String) {
    Box(
        Modifier.padding(end = 4.dp).size(28.dp).background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(name.take(1).uppercase(), color = MaterialTheme.colorScheme.onPrimaryContainer, style = MaterialTheme.typography.labelMedium)
    }
}

@Composable
private fun StudyRoomCard(pod: PodClient, library: ContentLibrary?) {
    val room: StudyRoom? = pod.room
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(room) {
        while (room != null) { now = System.currentTimeMillis(); delay(1000) }
    }
    val live = room != null && now < room.endsAt
    FlatCard(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp)) {
            if (live && room != null) {
                val left = ((room.endsAt - now) / 60_000).toInt() + 1
                Text("Study room · $left min left", style = MaterialTheme.typography.titleSmall)
                Text(
                    if (room.studying.isEmpty()) "Nobody studying yet" else "Studying now: ${room.studying.joinToString(", ")}",
                    style = MaterialTheme.typography.bodySmall,
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = { pod.joinRoom() }) { Text("Join") }
                    TextButton(onClick = { pod.leaveRoom() }) { Text("Leave") }
                }
            } else {
                Text("Study room", style = MaterialTheme.typography.titleSmall)
                Text("Start a quiet session; your pod sees who's in. No camera, no mic.", style = MaterialTheme.typography.bodySmall)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = { pod.startRoom(25) }, enabled = pod.status == PodStatus.ONLINE) { Text("25 min") }
                    TextButton(onClick = { pod.startRoom(50) }, enabled = pod.status == PodStatus.ONLINE) { Text("50 min") }
                }
            }
            Soundscapes(library)
            FocusBlock()
        }
    }
}

/**
 * A personal focus block, started by the member for themselves: 25 on, 5 off (playbook A6).
 * The break is a real one: stand, water, a window. It never points at the feed.
 */
@Composable
private fun FocusBlock() {
    var startedAt by rememberSaveable { mutableStateOf<Long?>(null) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(startedAt) {
        while (startedAt != null) { now = System.currentTimeMillis(); delay(1000) }
    }
    val start = startedAt
    if (start == null) {
        TextButton(onClick = { startedAt = System.currentTimeMillis() }) { Text("Just me: focus 25, break 5") }
        return
    }
    val sec = ((now - start) / 1000).toInt()
    when {
        sec < 25 * 60 -> {
            val left = 25 * 60 - sec
            Text("Focus · %d:%02d left".format(left / 60, left % 60), style = MaterialTheme.typography.bodyMedium)
        }
        sec < 30 * 60 -> {
            val left = 30 * 60 - sec
            Text("Break · %d:%02d".format(left / 60, left % 60), style = MaterialTheme.typography.bodyMedium)
            Text("Stand up, drink some water, look out of a window. Ideas often arrive now.", style = MaterialTheme.typography.bodySmall)
        }
        else -> Text("Block done. Another one, or call it here.", style = MaterialTheme.typography.bodyMedium)
    }
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
        if (sec >= 30 * 60) TextButton(onClick = { startedAt = System.currentTimeMillis() }) { Text("Another block") }
        TextButton(onClick = { startedAt = null }) { Text(if (sec >= 30 * 60) "Done" else "Stop") }
    }
}

/** Ask a favour or offer help. Nothing is counted or ranked. */
@Composable
private fun FavoursStrip(pod: PodClient, onAsk: () -> Unit, onOffer: () -> Unit, onAskLead: () -> Unit) {
    if (pod.status != PodStatus.ONLINE) return
    Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        TextButton(onClick = onAsk) { Text("Ask a favour") }
        TextButton(onClick = onOffer) { Text("Offer help") }
        TextButton(onClick = onAskLead) { Text(if (pod.isLead) "Private notes" else "Ask the lead privately") }
    }
}

private val favourIdeas = listOf("Review my intro", "Explain this topic", "Share notes", "Quiz me for 10 min")

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FavourDialog(kind: String, onDismiss: () -> Unit, onSend: (String) -> Unit) {
    var text by rememberSaveable { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (kind == "favour") "Ask a favour" else "Offer help") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    favourIdeas.forEach { idea -> FilterChip(selected = text.startsWith(idea), onClick = { text = "$idea: " }, label = { Text(idea) }) }
                }
                OutlinedTextField(
                    value = text,
                    onValueChange = { text = it.take(300) },
                    placeholder = { Text(if (kind == "favour") "Review my intro on federalism?" else "Happy to explain the Budget cycle") },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = { TextButton(onClick = { onSend(text) }, enabled = text.isNotBlank()) { Text("Post to pod") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

/**
 * "Ask the lead privately": calm advice without posting in the group. Only the member and the
 * lead see these notes. Distress still reaches a trained moderator, like everything else.
 */
@Composable
private fun LeadNotesDialog(pod: PodClient, onOpenNeedToTalk: () -> Unit, onDismiss: () -> Unit) {
    var text by rememberSaveable { mutableStateOf("") }
    var replyTo by rememberSaveable { mutableStateOf<String?>(null) }
    val notes = pod.privateNotes.filterNot { it.memberId == "compare" || (it.name.endsWith("(pod helper)") && it.memberId != pod.memberId) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (pod.isLead) "Private notes from your pod" else "Ask ${pod.lead ?: "your pod lead"} privately") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    if (pod.isLead) "Only you and the member see these. Calm, kind, and point to Need to talk if it's heavy."
                    else "Only you and the lead see this. Nothing goes to the group.",
                    style = MaterialTheme.typography.bodySmall,
                )
                notes.takeLast(8).forEach { n ->
                    val mine = n.memberId == pod.memberId
                    Text(
                        (if (mine) "You" else n.name) + ": " + n.text,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = if (pod.isLead && !mine) Modifier.clickable { replyTo = n.memberId } else Modifier,
                    )
                }
                if (pod.isLead && notes.isEmpty()) Text("No notes yet.", style = MaterialTheme.typography.bodyMedium)
                if (!pod.isLead || replyTo != null) {
                    OutlinedTextField(
                        value = text,
                        onValueChange = { text = it.take(1000) },
                        placeholder = { Text(if (pod.isLead) "Reply" else "What's on your mind?") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                } else if (notes.isNotEmpty()) {
                    Text("Tap a note to reply to that member.", style = MaterialTheme.typography.labelSmall)
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (DistressMatcher.matches(text)) onOpenNeedToTalk()
                    val sent = replyTo?.let { pod.replyPrivately(it, text) } ?: (!pod.isLead && pod.askLead(text))
                    if (sent) text = ""
                },
                enabled = text.isNotBlank(),
            ) { Text("Send") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Close") } },
    )
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun Bubble(
    m: PodMessage, mine: Boolean, sending: Boolean, onLongPress: () -> Unit, thanked: Boolean = false, onThank: (() -> Unit)? = null,
    loadPhoto: (suspend (String) -> ByteArray?)? = null,
) {
    val time = timeFmt.format(Instant.ofEpochMilli(m.ts))
    when (m.kind) {
        "ritual", "chotu", "quiz" -> Column(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Text("${Brand.MASCOT} · $time", style = MaterialTheme.typography.labelSmall)
            Text(m.text, style = MaterialTheme.typography.bodyLarge, fontStyle = FontStyle.Italic)
        }
        "friend", "friend_quiz" -> FriendBubble(m, time)
        "ping", "system" -> Text(
            "${m.text} · $time",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        )
        else -> Row(Modifier.fillMaxWidth(), horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start) {
            Column(
                Modifier.widthIn(max = 300.dp)
                    .background(
                        if (mine) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainerHigh,
                        RoundedCornerShape(12.dp),
                    )
                    .combinedClickable(onClick = {}, onLongClick = onLongPress)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
            ) {
                val tag = when (m.kind) { "favour" -> " · asks a favour"; "offer" -> " · offers help"; "answer" -> " · Answer hour"; else -> "" }
                if (!mine || tag.isNotEmpty()) Text((if (mine) "You" else m.name) + tag, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                val photos = PHOTO_REF.findAll(m.text).map { it.groupValues[1] }.toList()
                Text(if (photos.isEmpty()) m.text else m.text.replace(PHOTO_REF, "").trim(), style = MaterialTheme.typography.bodyLarge)
                if (loadPhoto != null) photos.forEach { PhotoInBubble(it, loadPhoto) }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(if (sending) "sending…" else time, style = MaterialTheme.typography.labelSmall)
                    // 🙏 says thanks. Nobody sees a count or who thanked whom.
                    if (thanked) Text("  🙏", style = MaterialTheme.typography.labelSmall)
                    else if (onThank != null) Text("  🙏 Thanks", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.heightIn(min = 48.dp).clickable(onClickLabel = "Thank ${m.name}") { onThank() }.padding(horizontal = 8.dp, vertical = 14.dp))
                }
            }
        }
    }
}

/** "Send to pod" with a photo (server rooms.ts): the message carries "photo:<id>"; the photo is kept 7 days, members only. */
private val PHOTO_REF = Regex("""\bphoto:([0-9a-f]{32})\b""")

@Composable
private fun PhotoInBubble(id: String, load: suspend (String) -> ByteArray?) {
    val state by produceState<Any?>(initialValue = null, id) {
        value = load(id)?.let { b -> runCatching { BitmapFactory.decodeByteArray(b, 0, b.size)?.asImageBitmap() }.getOrNull() } ?: false
    }
    when (val s = state) {
        null -> Text("Loading the photo…", style = MaterialTheme.typography.labelSmall)
        is ImageBitmap -> Image(s, "Photo of a handwritten answer", Modifier.fillMaxWidth().heightIn(max = 360.dp).padding(vertical = 4.dp), contentScale = ContentScale.Fit)
        else -> Text("📷 Photo no longer here (photos are kept 7 days)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

/** Chotu's AI study friends (server/src/friends.ts): their own cup colour and an AI tag. Never members, never counted. */
private val FRIENDS = mapOf(
    "friend:meera" to (Color(0xFFB5543C) to "AI study friend. Hosts the answer-writing hours and shares Mains writing tips."),
    "friend:arjun" to (Color(0xFF3F51B5) to "AI study friend. Suggests a small morning block and a short close to the day."),
    "friend:ira" to (Color(0xFF2E7D32) to "AI study friend. Posts one GS1 note a day: history, art and culture, geography, society."),
    "friend:kabir" to (Color(0xFFC98A12) to "AI study friend. Drops a quick question most days and the answer later."),
    // Older pod messages from before the rename (2 Nov 2026).
    "friend:pooja" to (Color(0xFF2E7D32) to "AI study friend."),
)

@Composable
private fun FriendBubble(m: PodMessage, time: String) {
    var about by remember { mutableStateOf(false) }
    val (color, bio) = FRIENDS[m.memberId] ?: (Color.Gray to "An AI study friend of Chotu's.")
    Column(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable(onClickLabel = "About ${m.name}") { about = !about }) {
            Kulhad(ChotuMood.HAPPY, 22.dp, cupColor = color)
            Spacer(Modifier.size(6.dp))
            Text("${m.name} · $time", style = MaterialTheme.typography.labelSmall)
        }
        if (about) Text("$bio An AI study friend: not a member, never counted, never messages anyone privately.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(m.text, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun Composer(pod: PodClient, onOpenNeedToTalk: () -> Unit) {
    var text by rememberSaveable { mutableStateOf("") }
    var support by rememberSaveable { mutableStateOf(false) }
    if (support) {
        // Private to the writer. The message still sends; nothing is shown to the pod.
        Column(Modifier.padding(horizontal = 16.dp)) {
            Text("That sounds heavy. You don't have to carry it alone.", style = MaterialTheme.typography.bodyMedium)
            TextButton(onClick = { support = false; onOpenNeedToTalk() }) { Text("Talk to someone now") }
        }
    }
    Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        OutlinedButton(onClick = { pod.chaiPing() }, enabled = pod.status == PodStatus.ONLINE) { Text("☕") }
        Spacer(Modifier.size(8.dp))
        OutlinedTextField(
            value = text,
            onValueChange = { text = it.take(1000) },
            placeholder = { Text("Message your pod (@Chotu to ask the AI)") },
            modifier = Modifier.weight(1f),
            maxLines = 4,
        )
        Spacer(Modifier.size(8.dp))
        Button(onClick = {
            if (DistressMatcher.matches(text)) support = true
            pod.say(text)
            text = ""
        }, enabled = text.isNotBlank()) { Text("Send") }
    }
}

/** Editor-approved soundscapes for studying. Off until the person picks one; stops when they leave the tab. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Soundscapes(library: ContentLibrary?) {
    val sounds = library?.sounds().orEmpty()
    if (library == null || sounds.isEmpty() || library.dataSaver()) return
    val player = rememberLoopPlayer()
    val scope = rememberCoroutineScope()
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FilterChip(selected = player.playingPath == null, onClick = { player.stop() }, label = { Text("Sound off") })
        sounds.forEach { snd ->
            val path = snd.files.best ?: return@forEach
            FilterChip(
                selected = player.playingPath == path,
                onClick = { scope.launch { library.file(path)?.let { player.play(it, path, gain = 0.6f) } } },
                label = { Text(snd.name.en) },
            )
        }
    }
}

// --- Pods v2: Answer hour, the monthly helper, joining two quiet pods ------------------------------------------------

/** An approved join-up with another quiet pod, and the private "Keep me here". The web copy is in podHeader in app.js. */
@Composable
private fun MergeCard(pod: PodClient, community: Community) {
    val s = pod.summary ?: return
    val m = s.merge ?: return
    val scope = rememberCoroutineScope()
    val on = m.on?.let { runCatching { java.time.LocalDate.parse(it).format(DateTimeFormatter.ofPattern("EEEE d MMM")) }.getOrNull() } ?: "soon"
    FlatCard(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Your pod and another pod with the same stage and language have both been quiet, so on $on they become one pod with more people around. Your old messages stay here.", style = MaterialTheme.typography.bodyMedium)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (m.stay) "You chose to stay in this pod." else "Only you see your choice.", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                TextButton(onClick = {
                    scope.launch { if (community.mergeStay(m.id, !m.stay)) pod.updateSummary(s.copy(merge = m.copy(stay = !m.stay))) }
                }) { Text(if (m.stay) "Join after all" else "Keep me here") }
            }
        }
    }
}

/** A kind note from this month's helper, if you've been away. Shown until OK. */
@Composable
private fun HelperNote(pod: PodClient) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val prefs = remember { context.getSharedPreferences("pod_v2", android.content.Context.MODE_PRIVATE) }
    val last = pod.privateNotes.lastOrNull { it.name.endsWith("(pod helper)") && it.memberId != pod.memberId } ?: return
    var seen by remember(last.id) { mutableStateOf(prefs.getString("helperNoteSeen", null) == last.id) }
    if (seen) return
    FlatCard(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp)) {
            Text("${last.name}: ${last.text}", style = MaterialTheme.typography.bodyMedium)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Only you got this.", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                TextButton(onClick = { prefs.edit().putString("helperNoteSeen", last.id).apply(); seen = true }) { Text("OK") }
            }
        }
    }
}

/**
 * Answer hour: write alone first, post the answer, then compare two answers from the pod (which is stronger, and one
 * reason). The writers hear the reason privately, never who sent it. Nobody is scored. The web copy is answerHourCard.
 */
@Composable
private fun AnswerHourCard(pod: PodClient, library: ContentLibrary?, hindi: Boolean, onOpenNeedToTalk: () -> Unit) {
    val weekAgo = System.currentTimeMillis() - 7 * 86_400_000L
    val answers = pod.messages.count { it.kind == "answer" && it.ts > weekAgo }
    var text by rememberSaveable { mutableStateOf("") }
    var reason by rememberSaveable { mutableStateOf("") }
    var pick by rememberSaveable { mutableStateOf<String?>(null) }
    var problem by remember { mutableStateOf<String?>(null) }
    val online = pod.status == PodStatus.ONLINE
    FlatCard(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Answer hour · $answers answer${if (answers == 1) "" else "s"} this week", style = MaterialTheme.typography.titleMedium)
            PauseLine("pod-alone-first", library, hindi)
            Text("Write alone first, then post it. After that, compare two answers from your pod: which is stronger, and one reason. The writers hear your reason privately, never who sent it. Nobody is scored.", style = MaterialTheme.typography.bodySmall)
            OutlinedTextField(value = text, onValueChange = { text = it.take(2500) }, placeholder = { Text("Your answer, about 150 words. Write it alone first.") }, modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Posted answers are seen by your pod.", style = MaterialTheme.typography.labelSmall, modifier = Modifier.weight(1f))
                OutlinedButton(enabled = online && text.isNotBlank(), onClick = {
                    if (text.trim().split(Regex("\\s+")).size < 20) { problem = "Write a little more first (at least a few lines)."; return@OutlinedButton }
                    if (DistressMatcher.matches(text)) onOpenNeedToTalk()
                    pod.say(text, "answer"); text = ""; problem = null
                }) { Text("Post my answer") }
            }
            val p = pod.pair
            if (p == null) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(when { pod.compared -> "Thanks. Your reason went to both writers."; pod.noPair -> "No new pair to compare yet. Once two others have posted this week, there will be."; else -> "Ready to compare two answers?" },
                        style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                    OutlinedButton(enabled = online, onClick = { pick = null; reason = ""; pod.askPair() }) { Text("Compare two") }
                }
            } else {
                PauseLine("pod-compare", library, hindi)
                listOf("a" to p.aText, "b" to p.bText).forEachIndexed { i, (k, t) ->
                    Column(
                        Modifier.fillMaxWidth().background(
                            if (pick == k) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainerHigh, RoundedCornerShape(8.dp),
                        ).clickable { pick = k }.padding(10.dp),
                    ) {
                        Text("Answer ${i + 1}${if (pick == k) " · stronger" else ""}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                        Text(t, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                OutlinedTextField(value = reason, onValueChange = { reason = it.take(300) }, placeholder = { Text("One reason (about the answers, not the people)") }, modifier = Modifier.fillMaxWidth())
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = { pod.pair = null }) { Text("Not now") }
                    Button(enabled = online && pick != null && reason.trim().length >= 3, onClick = {
                        if (DistressMatcher.matches(reason)) onOpenNeedToTalk()
                        pod.compare(p.aId, p.bId, pick!!, reason)
                    }) { Text("Send my reason") }
                }
            }
            problem?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error) }
            val notes = pod.privateNotes.filter { it.memberId == "compare" }
            if (notes.isNotEmpty()) {
                Text("What others said about your answers", style = MaterialTheme.typography.titleSmall)
                notes.takeLast(5).forEach { Text(it.text, style = MaterialTheme.typography.bodySmall) }
            }
        }
    }
}

/** One volunteer a month opens Answer hour and checks on people who've gone quiet. The web copy is helperCard. */
@Composable
private fun HelperCard(pod: PodClient, library: ContentLibrary?, hindi: Boolean) {
    val h = pod.helper
    val mine = h?.memberId == pod.memberId
    var question by rememberSaveable { mutableStateOf("") }
    var note by rememberSaveable { mutableStateOf("We missed you at the pod this week. No catching up needed; come to Answer hour when you can.") }
    var leaving by remember { mutableStateOf(false) }
    val online = pod.status == PodStatus.ONLINE
    FlatCard(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(when { h == null -> "Pod helper: open this month"; mine -> "You're the pod helper this month"; else -> "${h.name} is the pod helper this month" }, style = MaterialTheme.typography.titleMedium)
            PauseLine("pod-helper", library, hindi)
            when {
                h == null -> {
                    Text("One member a month opens Answer hour and sends a kind note to anyone who's gone quiet. It's a volunteer role and changes hands each month.", style = MaterialTheme.typography.bodySmall)
                    OutlinedButton(enabled = online, onClick = { pod.takeHelper() }) { Text("I'll be the helper this month") }
                }
                !mine -> Text("They open Answer hour and check on anyone who's gone quiet. Next month anyone can take it.", style = MaterialTheme.typography.bodySmall)
                else -> {
                    Text("Open Answer hour", style = MaterialTheme.typography.titleSmall)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(value = question, onValueChange = { question = it.take(600) }, placeholder = { Text("Today's question (optional)") }, singleLine = true, modifier = Modifier.weight(1f))
                        TextButton(enabled = online, onClick = { pod.openAnswerHour(question); question = "" }) { Text("Open it") }
                    }
                    Text("Check on quiet members", style = MaterialTheme.typography.titleSmall)
                    Text("Goes privately to anyone who hasn't posted for a week, once a week at most. The pod doesn't see who.", style = MaterialTheme.typography.bodySmall)
                    OutlinedTextField(value = note, onValueChange = { note = it.take(300) }, modifier = Modifier.fillMaxWidth())
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(pod.missSent?.let { n -> if (n == 0) "Everyone has posted this week; nobody to send to." else "Sent to $n ${if (n == 1) "person" else "people"}." } ?: "",
                            style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                        TextButton(enabled = online && note.isNotBlank(), onClick = { pod.missYou(note) }) { Text("Send") }
                    }
                    TextButton(onClick = { leaving = true }) { Text("Hand it back") }
                }
            }
        }
    }
    if (leaving) AlertDialog(
        onDismissRequest = { leaving = false },
        title = { Text("Hand back the helper role?") },
        text = { Text("Anyone in the pod can take it for the rest of the month.") },
        confirmButton = { TextButton(onClick = { pod.leaveHelper(); leaving = false }) { Text("Hand it back") } },
        dismissButton = { TextButton(onClick = { leaving = false }) { Text("Keep it") } },
    )
}
