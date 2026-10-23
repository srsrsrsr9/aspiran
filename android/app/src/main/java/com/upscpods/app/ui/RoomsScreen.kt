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
            client, onOpenNeedToTalk, onOpenSettings, modifier, library,
            top = {
                Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = { open = null }) { Text("← Rooms") }
                    Column(Modifier.weight(1f)) {
                        Text(info?.name ?: "Room", style = MaterialTheme.typography.titleMedium)
                        info?.let { Text(membersLine(it), style = MaterialTheme.typography.bodySmall) }
                    }
                    TextButton(onClick = { leaving = true }) { Text("Leave") }
                }
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
    LazyColumn(modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                onBackToPod?.let { TextButton(onClick = it) { Text("← My pod") } }
                Text("Open rooms", style = MaterialTheme.typography.titleLarge)
                Text("Join as many as help: your language, where you are, your goal, your optional, your region. " +
                    "Chotu and the study friends here are AI and always labelled AI.", style = MaterialTheme.typography.bodyMedium)
                if (list?.mode == "open") Text(
                    "Matched pods of 8 start once ${list.threshold} aspirants have joined. ${list.signups} so far.",
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
