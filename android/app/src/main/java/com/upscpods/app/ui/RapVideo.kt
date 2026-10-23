package com.upscpods.app.ui

import android.content.Context
import android.net.ConnectivityManager
import android.net.Uri
import android.widget.MediaController
import android.widget.VideoView
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.upscpods.app.data.LanguageRequests
import com.upscpods.app.data.ReadingLanguage

/**
 * "Akela Nahi" ("not alone"): a 45-second rap, one video per language, streamed from the pod server's
 * /videos/ (static files, about 1.1 MB each, 720x1280). The lyrics are burned into each video in its own script, with an
 * English line under them. Nothing autoplays and nothing is fetched until the person presses Play, so it never
 * uses mobile data on its own.
 *
 * NEEDS NATIVE-SPEAKER CHECK: the lyrics in every non-English video were written and voiced without a native
 * speaker. Same list as the web app's videos.js; change both together.
 */
object RapVideos {
    data class Video(val code: String, val name: String, val file: String, val checked: String? = null)

    val ALL = listOf(
        Video("en", "English", "akela-nahi-english-elevenlabs.mp4", "n/a"),
        Video("hi", "Hindi", "akela-nahi-hindi-elevenlabs.mp4"),
        Video("hinglish", "Hinglish", "akela-nahi-hinglish-elevenlabs.mp4"),
        Video("ta", "Tamil", "akela-nahi-tamil-elevenlabs.mp4"),
        Video("bn", "Bengali", "akela-nahi-bengali-elevenlabs.mp4"),
        Video("mr", "Marathi", "akela-nahi-marathi-elevenlabs.mp4"),
        Video("kn", "Kannada", "akela-nahi-kannada-elevenlabs.mp4"),
        Video("ml", "Malayalam", "akela-nahi-malayalam-elevenlabs.mp4"),
        Video("gu", "Gujarati", "akela-nahi-gujarati-elevenlabs.mp4"),
        Video("or", "Odia", "akela-nahi-odia-elevenlabs.mp4"),
        Video("te", "Telugu", "akela-nahi-telugu-elevenlabs.mp4"),
    )

    /** The member's language: Hindi readers get Hindi, else the first language they asked for, else English. */
    fun pick(reading: ReadingLanguage?, asked: Set<String>): Pair<String, String> {
        val want = listOfNotNull("hi".takeIf { reading == ReadingLanguage.HINDI }) +
            LanguageRequests.REQUESTABLE.map { it.code }.filter { it in asked }
        val have = want.firstOrNull { c -> ALL.any { it.code == c } } ?: "en"
        return (want.firstOrNull() ?: "en") to have
    }

    fun metered(context: Context): Boolean =
        (context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager)?.isActiveNetworkMetered ?: true
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RapVideoCard(server: String, reading: ReadingLanguage?) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("rap_video", Context.MODE_PRIVATE) }
    val (want, have) = remember { RapVideos.pick(reading, LanguageRequests(context).asked) }
    var code by remember { mutableStateOf(prefs.getString("lang", null) ?: have) }
    var playing by remember { mutableStateOf(false) }
    val v = RapVideos.ALL.firstOrNull { it.code == code } ?: RapVideos.ALL[0]
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Watch in your language", style = MaterialTheme.typography.titleMedium)
            Text("Akela Nahi: nobody preps alone here.", style = MaterialTheme.typography.bodyMedium)
            if (server.isBlank()) {
                Text("Needs the pod server. Once the app is connected, it plays from here.", style = MaterialTheme.typography.bodySmall)
            } else if (playing) {
                AndroidView(
                    factory = { ctx ->
                        VideoView(ctx).apply {
                            setMediaController(MediaController(ctx).also { it.setAnchorView(this) })
                            setVideoURI(Uri.parse("$server/videos/${v.file}"))
                            start()
                        }
                    },
                    onRelease = { it.stopPlayback() },
                    modifier = Modifier.align(Alignment.CenterHorizontally).widthIn(max = 280.dp).fillMaxWidth().aspectRatio(9f / 16f)
                        .semantics { contentDescription = "Akela Nahi, a short rap in ${v.name}. The words are on screen." },
                )
            } else {
                Button(onClick = { playing = true }) { Text("Play (45 seconds)") }
                if (RapVideos.metered(context)) Text("You're on mobile data: about 1 MB when you press Play, nothing before.", style = MaterialTheme.typography.bodySmall)
            }
            Text("The words are on screen in ${v.name}" + (if (v.code == "en") "." else ", with an English line."), style = MaterialTheme.typography.bodySmall)
            if (prefs.getString("lang", null) == null && want != have) {
                LanguageRequests.REQUESTABLE.firstOrNull { it.code == want }?.let {
                    Text("${it.name} isn't ready yet, so this is in ${v.name}.", style = MaterialTheme.typography.bodySmall)
                }
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                RapVideos.ALL.forEach { x ->
                    FilterChip(selected = x.code == v.code, onClick = {
                        code = x.code; playing = false
                        prefs.edit().putString("lang", x.code).apply()
                    }, label = { Text(x.name) })
                }
            }
        }
    }
}
