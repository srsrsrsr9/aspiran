package com.upscpods.app.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.Persona
import com.upscpods.app.data.PodClient
import com.upscpods.app.data.RoomBoard
import com.upscpods.app.data.RoomInfo
import com.upscpods.app.data.Rooms
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val GROUPS = listOf("language" to "Language", "attempt" to "Where you are", "goal" to "Goal", "optional" to "Optionals", "region" to "Region")
private val whenFmt = DateTimeFormatter.ofPattern("d MMM, HH:mm").withZone(ZoneId.systemDefault())
private val timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault())

/**
 * The Pod tab while pods are open rooms (and a second view once matched pods are on): every room with its real
 * member count, who's here now, the latest line, a one-tap Join, and an unread badge on the rooms you're in.
 * Opening a room is the pod chat itself, with Chotu's rituals and the AI study friends (labelled AI).
 */
@Composable
fun RoomsScreen(
    rooms: Rooms,
    persona: Persona?,
    onOpenNeedToTalk: () -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier,
    library: ContentLibrary? = null,
    /** Set when the member also has a matched pod: a way back to it. */
    onBackToPod: (() -> Unit)? = null,
    resultDay: String? = null,
) {
    var open by rememberSaveable { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    open?.let { id ->
        val info = rooms.list?.rooms?.firstOrNull { it.id == id }
        val client = remember(id) { rooms.client(id) }
        DisposableEffect(id) {
            rooms.open(id, persona)
            onDispose { rooms.close(id) }
        }
        LaunchedEffect(client.messages.size) { rooms.markSeen(id) }
        BackHandler { open = null }
        var leaving by remember { mutableStateOf(false) }
        PodTab(
            client, onOpenNeedToTalk, onOpenSettings, modifier, library, v2 = false,
            top = {
                Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = { open = null }) { Text("← Rooms") }
                    Column(Modifier.weight(1f)) {
                        Text(info?.name ?: "Room", style = MaterialTheme.typography.titleMedium)
                        info?.let { Text(membersLine(it), style = MaterialTheme.typography.bodySmall) }
                    }
                    TextButton(onClick = { leaving = true }) { Text("Leave") }
                }
                PinnedCard(client)
            },
            resultDay = resultDay,
        )
        if (leaving) AlertDialog(
            onDismissRequest = { leaving = false },
            title = { Text("Leave ${info?.name ?: "this room"}?") },
            text = { Text("You can join again any time. Your other rooms stay as they are.") },
            confirmButton = { TextButton(onClick = { leaving = false; scope.launch { if (rooms.leave(id)) open = null } }) { Text("Leave") } },
            dismissButton = { TextButton(onClick = { leaving = false }) { Text("Stay") } },
        )
        return
    }

    // Fresh counts and activity while the list is on screen.
    LaunchedEffect(Unit) { while (true) { rooms.refresh(); delay(30_000) } }
    val list = rooms.list
    var joining by remember { mutableStateOf<String?>(null) }
    var board by remember { mutableStateOf<RoomBoard?>(null) }
    LaunchedEffect(Unit) { while (true) { rooms.board()?.let { board = it }; delay(5 * 60_000) } }
    LazyColumn(modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                onBackToPod?.let { TextButton(onClick = it) { Text("← My pod") } }
                Text("Open rooms", style = MaterialTheme.typography.titleLarge)
                Text("Join as many as help: your language, where you are, your goal, your optional, your region. " +
                    "Chotu and the study friends here are AI and always labelled AI.", style = MaterialTheme.typography.bodyMedium)
                if (rooms.started.isNotEmpty()) Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        val names = rooms.started.let { if (it.size < 2) it.joinToString() else it.dropLast(1).joinToString(", ") + " and " + it.last() }
                        Text("So you don't start alone, you're in $names. Leave any that don't fit, and join others below.", style = MaterialTheme.typography.bodyMedium)
                        TextButton(onClick = { rooms.clearStarted() }) { Text("Got it") }
                    }
                }
                if (list?.mode == "open") Text(
                    "Matched pods of 6 to 8 start once ${list.threshold} aspirants have joined. ${list.signups} so far.",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
        if (list == null) item {
            if (rooms.loading) Text("Loading rooms…", style = MaterialTheme.typography.bodyMedium)
            else Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Rooms live on the pod server. Check your connection, or set the server in Me → My Path.", style = MaterialTheme.typography.bodyMedium)
                OutlinedButton(onClick = { scope.launch { rooms.refresh() } }) { Text("Try again") }
                TextButton(onClick = onOpenSettings) { Text("Open My Path") }
            }
        }
        val all = list?.rooms ?: emptyList()
        val mine = all.filter { it.joined }
        board?.let { b -> item { BoardCard(b, mine.map { it.id }.toSet()) } }
        if (mine.isNotEmpty()) {
            item { Text("Your rooms", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp)) }
            items(mine, key = { "mine-" + it.id }) { r -> RoomRow(r, busy = false, onOpen = { open = r.id }, onJoin = {}) }
        }
        GROUPS.forEach { (g, title) ->
            val inGroup = all.filter { it.group == g && !it.joined }
            if (inGroup.isEmpty()) return@forEach
            item { Text(title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp)) }
            items(inGroup, key = { it.id }) { r ->
                RoomRow(r, busy = joining == r.id, onOpen = { open = r.id }, onJoin = {
                    joining = r.id
                    scope.launch { if (rooms.join(r.id)) open = r.id; joining = null }
                })
            }
        }
        item { Text(" ", modifier = Modifier.padding(bottom = 16.dp)) }
    }
}

/** Room Quiz Night's board: the top rooms by their one shared score this week. No person is on it. */
@Composable
private fun BoardCard(b: RoomBoard, mine: Set<String>) {
    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("Room board 🎯", style = MaterialTheme.typography.titleSmall)
            Text("Friday's Room Quiz Night: the same 5 questions in every room, one shared score per room. People are never ranked.",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (b.rooms.isEmpty()) Text("No room has ${b.minAnswers} answers yet this week. Friday, 20:00.", style = MaterialTheme.typography.bodyMedium)
            b.rooms.take(5).forEach { r ->
                Text("${r.rank}. ${r.name} · ${r.pct}% · ${r.answered} answers", style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (r.id in mine) FontWeight.Bold else FontWeight.Normal)
            }
            b.rooms.firstOrNull { it.id in mine && it.rank > 5 }?.let { r ->
                Text("${r.rank}. ${r.name} · ${r.pct}%", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
            }
        }
    }
}

/** The room's pinned question of the day: answer once, see the room's tally. Mains prompts go to Answer Studio. */
@Composable
private fun PinnedCard(client: PodClient) {
    val p = client.pinned ?: return
    var shown by rememberSaveable(p.day) { mutableStateOf(true) }
    FlatCard(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("📌 Today's question" + (p.topic.takeIf { it.isNotBlank() }?.let { " · $it" } ?: ""), style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
                TextButton(onClick = { shown = !shown }) { Text(if (shown) "Hide" else "Show") }
            }
            if (!shown) return@Column
            Text(p.question, style = MaterialTheme.typography.bodyMedium)
            if (p.kind == "mcq") {
                p.options.forEachIndexed { k, opt ->
                    FilterChip(selected = p.mine == k, onClick = { client.answerPinned(k) }, enabled = p.mine == null || p.mine == k,
                        label = { Text("(${'a' + k}) $opt", modifier = Modifier.padding(vertical = 6.dp)) }, modifier = Modifier.fillMaxWidth())
                }
                val a = p.answerIndex
                if (p.mine != null && a != null) Text(
                    (if (p.mine == a) "✓ Right." else "○ The answer is (${'a' + a}).") + (p.explanation.takeIf { it.isNotBlank() }?.let { " $it" } ?: ""),
                    style = MaterialTheme.typography.bodyMedium,
                )
                if (p.tally.answered > 0) Text("${p.tally.answered} answered in this room · ${p.tally.right} right", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            } else Text("Write it in Prep → Answer Studio, then share your intro here.", style = MaterialTheme.typography.bodySmall)
        }
    }
}

private fun membersLine(r: RoomInfo): String = listOfNotNull(
    if (r.members == 1) "1 member" else "${r.members} members",
    if (r.online > 0) "${r.online} here now" else null,
).joinToString(" · ")

@Composable
private fun RoomRow(r: RoomInfo, busy: Boolean, onOpen: () -> Unit, onJoin: () -> Unit) {
    FlatCard(Modifier.fillMaxWidth().clickable(enabled = r.joined, onClick = onOpen)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(r.name, style = MaterialTheme.typography.titleSmall, fontWeight = if (r.unread > 0) FontWeight.Bold else FontWeight.Normal)
                Text(membersLine(r), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                val last = r.lastText
                if (last != null && r.lastTs != null) {
                    val at = Instant.ofEpochMilli(r.lastTs)
                    val stamp = if (System.currentTimeMillis() - r.lastTs < 20 * 3600_000L) timeFmt.format(at) else whenFmt.format(at)
                    Text("${r.lastName ?: "Someone"}: $last · $stamp", style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                } else Text(r.note, style = MaterialTheme.typography.bodySmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
            if (r.joined) {
                if (r.unread > 0) UnreadBadge(r.unread)
                OutlinedButton(onClick = onOpen) { Text("Open") }
            } else Button(onClick = onJoin, enabled = !busy) { Text(if (busy) "Joining…" else "Join") }
        }
    }
}

/** The number of new messages from others since you last looked. */
@Composable
fun UnreadBadge(n: Int, modifier: Modifier = Modifier) {
    Box(modifier.widthIn(min = 22.dp).background(MaterialTheme.colorScheme.primary, CircleShape).padding(horizontal = 6.dp, vertical = 2.dp), contentAlignment = Alignment.Center) {
        Text(if (n > 99) "99+" else n.toString(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onPrimary)
    }
}
