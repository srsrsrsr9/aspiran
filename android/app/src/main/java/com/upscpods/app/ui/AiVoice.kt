package com.upscpods.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull

/**
 * A recorded reading in an AI voice, where the item has one: data.audio.<lang> = { url, seconds, voice, chapters: [{ t, title }] }.
 * Returns false when there's none, so the caller can offer the phone's own voice instead. Nothing plays until Play, leaving
 * the screen stops it, and the label always says AI. The text on the same screen is the transcript.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AiVoiceAudio(data: JsonObject, lang: String, url: (String) -> String): Boolean {
    val a = ((data["audio"] as? JsonObject)?.get(lang) as? JsonObject) ?: return false
    fun s(e: JsonElement?) = (e as? JsonPrimitive)?.contentOrNull
    val path = s(a["url"]) ?: return false
    val hi = lang == "hi"
    val context = LocalContext.current
    val player = remember(path) { ExoPlayer.Builder(context).build().apply { setMediaItem(MediaItem.fromUri(url(path))); prepare() } }
    var playing by remember { mutableStateOf(false) }
    var ended by remember { mutableStateOf(false) }
    var showParts by remember { mutableStateOf(false) }
    DisposableEffect(player) {
        val l = object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) { playing = isPlaying }
            override fun onPlaybackStateChanged(state: Int) { ended = state == Player.STATE_ENDED }
        }
        player.addListener(l)
        onDispose { player.removeListener(l); player.release() }
    }
    val secs = (a["seconds"] as? JsonPrimitive)?.doubleOrNull ?: 0.0
    val chapters = (a["chapters"] as? JsonArray).orEmpty().mapNotNull { c ->
        val o = c as? JsonObject ?: return@mapNotNull null
        val t = (o["t"] as? JsonPrimitive)?.doubleOrNull ?: return@mapNotNull null
        t to (s(o["title"]) ?: "")
    }
    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(if (hi) "सुनें" else "Listen", style = MaterialTheme.typography.titleSmall)
            Text(listOfNotNull("${maxOf(1, Math.round(secs / 60))} min").joinToString(" · "),
                style = MaterialTheme.typography.bodySmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                Button(onClick = { if (playing) player.pause() else { if (ended) { player.seekTo(0); ended = false }; player.play() } }) {
                    Text(if (playing) (if (hi) "रोकें" else "Pause") else (if (hi) "चलाएँ" else "Play"))
                }
                OutlinedButton(onClick = { player.seekBack() }) { Text(if (hi) "10 सेकंड पीछे" else "Back 10 s") }
                if (chapters.size > 1) TextButton(onClick = { showParts = !showParts }) { Text(if (hi) "हिस्से" else "Parts") }
            }
            if (showParts) chapters.forEach { (t, title) ->
                TextButton(onClick = { player.seekTo((t * 1000).toLong()); player.play() }) {
                    Text("${t.toInt() / 60}:${(t.toInt() % 60).toString().padStart(2, '0')} · $title")
                }
            }
            if (ended) Text(if (hi) "पूरा हुआ।" else "The end.", style = MaterialTheme.typography.bodySmall)
            Text(if (hi) "पूरा पाठ इसी स्क्रीन पर है।" else "The full text is on this screen.",
                style = MaterialTheme.typography.bodySmall)
        }
    }
    return true
}
