package com.upscpods.app.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

/**
 * The open rooms (server rooms.ts), joined like channels: the list with real member counts, recent activity and
 * unread badges, and one [PodClient] per room while it's open. The last time this phone opened each room is kept
 * here, so unread counts are worked out by the server from it. The last list is cached for offline.
 */
class Rooms(private val context: Context, private val community: Community, private val pod: PodClient) {
    private val prefs = context.getSharedPreferences("rooms", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val clients = mutableMapOf<String, PodClient>()
    private val stops = mutableMapOf<String, Job>()

    var list by mutableStateOf(runCatching { json.decodeFromString(RoomsList.serializer(), prefs.getString("last", null)!!) }.getOrNull()); private set
    var loading by mutableStateOf(false); private set
    /** The room on screen, if any: its messages are read as they come. */
    var viewing by mutableStateOf<String?>(null)

    val joined: List<RoomInfo> get() = list?.rooms?.filter { it.joined } ?: emptyList()
    /** For the Pod tab's badge: new messages from others in the rooms you're in. */
    val unreadTotal: Int get() = joined.filter { it.id != viewing }.sumOf { it.unread }

    private fun seen(): Map<String, Long> = prefs.all.filterKeys { it.startsWith("seen:") }
        .mapNotNull { (k, v) -> (v as? Long)?.let { k.removePrefix("seen:") to it } }.toMap()

    fun markSeen(id: String) {
        prefs.edit().putLong("seen:$id", System.currentTimeMillis()).apply()
        list = list?.let { l -> l.copy(rooms = l.rooms.map { if (it.id == id) it.copy(unread = 0) else it }) }
    }

    suspend fun refresh() {
        if (pod.serverUrl.isBlank() || !pod.mayConnect()) return
        loading = true
        community.rooms(seen())?.let { l ->
            list = l.copy(rooms = l.rooms.map { if (it.id == viewing) it.copy(unread = 0) else it })
            prefs.edit().putString("last", json.encodeToString(RoomsList.serializer(), l)).apply()
        }
        loading = false
    }

    suspend fun join(id: String): Boolean = community.joinRoom(id).also { if (it) { markSeen(id); refresh() } }
    suspend fun leave(id: String): Boolean = community.leaveRoom(id).also { if (it) { client(id).forget(); refresh() } }

    /** The room's chat client, shared by its screen and "Send to pod". */
    fun client(id: String): PodClient = clients.getOrPut(id) {
        PodClient(context, id).also { c -> c.mayConnect = { pod.mayConnect() } }
    }

    fun open(id: String, persona: Persona?) {
        stops.remove(id)?.cancel()
        viewing = id
        client(id).start(persona)
        markSeen(id)
    }

    fun close(id: String) {
        markSeen(id)
        if (viewing == id) viewing = null
        clients[id]?.stop()
    }

    /** Posts one message to a room without opening it: connects, sends (the outbox waits for the socket), lets go. */
    fun post(id: String, text: String, persona: Persona?) {
        val c = client(id)
        c.start(persona)
        c.say(text)
        if (viewing == id) return
        stops.remove(id)?.cancel()
        stops[id] = scope.launch { delay(20_000); if (viewing != id) c.stop() }
    }

    fun stopAll() { clients.values.forEach { it.stop() }; viewing = null }

    fun forget() {
        stopAll()
        clients.values.forEach { it.forget() }
        prefs.edit().clear().apply()
        list = null
    }
}
