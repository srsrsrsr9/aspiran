package com.upscpods.app.ui

import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.annotation.OptIn
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.Player
import androidx.media3.common.text.CueGroup
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.upscpods.app.BuildConfig
import com.upscpods.app.data.CaCache
import com.upscpods.app.data.CaEpisode
import com.upscpods.app.data.CaWeek
import com.upscpods.app.data.CurrentAffairs
import com.upscpods.app.data.Honest
import com.upscpods.app.data.PlusGate
import com.upscpods.app.data.caNodes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

// Cinematic current affairs (W7): the week in short vertical scenes, each followed by its own question. Free scenes
// are open to everyone; the rest show blurred behind the Plus pill at the one price. Drafts appear in debug builds only.

private val CA_INK = Color(0xFF0E0A07)
private val CA_GOLD = Color(0xFFFFB547)
private val CA_CREAM = Color(0xFFFFF4E6)
private val CA_RIGHT = Color(0xFF3DDC97)
private val CA_WRONG = Color(0xFFFF6B6B)

/** Free scenes are open; the rest need Plus. Locked scenes can still be seen as titles. */
private fun caOpen(e: CaEpisode, gate: PlusGate) = e.free || gate.member

/** A poster from the server, kept on the phone; nothing until it's loaded. */
@Composable
private fun CaPoster(ca: CurrentAffairs, path: String?, modifier: Modifier = Modifier, blurred: Boolean = false) {
    val bmp by produceState<ImageBitmap?>(null, path) {
        value = path?.let { p ->
            ca.poster(p)?.let { f -> withContext(Dispatchers.Default) { decode(f) } }
        }
    }
    Box(modifier.background(Color(0xFF2A1C12))) {
        bmp?.let {
            Image(it, contentDescription = null, contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize().then(if (blurred) Modifier.blur(18.dp) else Modifier))
        }
        // Older phones don't blur: a scrim keeps a locked poster from reading as open.
        if (blurred) Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = .62f)))
    }
}

private fun decode(f: File): ImageBitmap? = runCatching {
    BitmapFactory.decodeFile(f.absolutePath, BitmapFactory.Options().apply { inSampleSize = 2 })?.asImageBitmap()
}.getOrNull()

@Composable
private fun DraftTag(modifier: Modifier = Modifier) {
    Text("DRAFT", modifier.clip(RoundedCornerShape(6.dp)).background(Color(0xFFD63A6B)).padding(horizontal = 6.dp, vertical = 2.dp),
        color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 10.sp, letterSpacing = 1.sp)
}

/**
 * Prep → Today: "This week in N scenes", the week's posters in a row (watched ones ticked, Plus ones blurred), a
 * Watch button for the next one to see, and the earlier weeks on a shelf under it.
 */
@Composable
fun CaWeekCard(ca: CurrentAffairs, gate: PlusGate, quiet: Boolean, hindi: Boolean, onOpen: (week: String, scene: Int) -> Unit) {
    val latest = ca.weeks.firstOrNull() ?: return
    val week by produceState<CaWeek?>(null, latest.week, latest.generatedAt) { value = ca.week(latest.week) }
    val w = week ?: return
    if (w.episodes.isEmpty()) return
    @Suppress("UNUSED_VARIABLE") val tick = ca.progress
    val next = w.episodes.indexOfFirst { caOpen(it, gate) && !ca.watched(w.week, it.id) }
    val mins = Math.round(w.episodes.sumOf { it.durationSec } / 60).coerceAtLeast(1)
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(Brush.verticalGradient(listOf(Color(0xFF1A120C), CA_INK))).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(if (hindi) "${w.episodes.size} दृश्यों में यह हफ़्ता" else "THIS WEEK IN ${w.episodes.size} SCENES",
            color = CA_GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 1.6.sp)
        Text(if (hindi) "करंट अफ़ेयर्स, ${CurrentAffairs.dates(w.week)}" else "Current affairs, ${CurrentAffairs.dates(w.week)}",
            color = CA_CREAM, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
        Text(
            buildString {
                append(if (hindi) "लगभग $mins मिनट। हर दृश्य के बाद एक सवाल।" else "About $mins min. One question after each scene.")
                if (!gate.member && w.episodes.any { it.free }) append(if (hindi) " पहला दृश्य सबके लिए खुला।" else " The first is open to everyone.")
            },
            color = CA_CREAM.copy(alpha = .8f), style = MaterialTheme.typography.bodyMedium,
        )
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            w.episodes.forEachIndexed { i, e ->
                val locked = !caOpen(e, gate)
                Box(Modifier.width(96.dp).height(170.dp).clip(RoundedCornerShape(14.dp)).clickable { onOpen(w.week, i) }
                    .semantics { contentDescription = "Scene ${e.n}: ${e.title}${if (locked) ", in Plus" else ""}" }) {
                    CaPoster(ca, w.base + (e.poster ?: ""), Modifier.fillMaxSize(), blurred = locked)
                    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .75f)))))
                    Text("${e.n}", Modifier.align(Alignment.TopStart).padding(8.dp), color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                    if (BuildConfig.DEBUG && e.draft) DraftTag(Modifier.align(Alignment.TopEnd).padding(6.dp))
                    Text(e.title, Modifier.align(Alignment.BottomStart).padding(8.dp), color = Color.White, fontSize = 11.sp, lineHeight = 13.sp,
                        maxLines = 3, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold)
                    when {
                        locked -> Text(if (quiet) "🔒" else "🔒 Plus", Modifier.align(Alignment.Center).clip(RoundedCornerShape(999.dp))
                            .background(Color(0xE6141C34)).padding(horizontal = 10.dp, vertical = 4.dp), color = CA_GOLD, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        ca.watched(w.week, e.id) -> Text("✓", Modifier.align(Alignment.Center).clip(RoundedCornerShape(999.dp)).background(CA_RIGHT)
                            .padding(horizontal = 10.dp, vertical = 2.dp), color = CA_INK, fontWeight = FontWeight.ExtraBold)
                    }
                }
            }
        }
        Button(
            onClick = { onOpen(w.week, if (next >= 0) next else 0) },
            colors = ButtonDefaults.buttonColors(containerColor = CA_GOLD, contentColor = Color(0xFF2A1300)),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                when {
                    next < 0 -> if (hindi) "फिर से देखें" else "Watch again"
                    next == 0 && w.episodes.none { ca.watched(w.week, it.id) } -> if (hindi) "▶ देखना शुरू करें" else "▶ Start watching"
                    else -> if (hindi) "▶ दृश्य ${w.episodes[next].n} देखें" else "▶ Watch scene ${w.episodes[next].n}"
                },
                fontWeight = FontWeight.ExtraBold,
            )
        }
        if (ca.weeks.size > 1) {
            Text(if (hindi) "पिछले हफ़्ते" else "EARLIER WEEKS", color = CA_GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 1.6.sp)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ca.weeks.drop(1).forEach { old ->
                    Row(Modifier.clip(RoundedCornerShape(12.dp)).background(Color.White.copy(alpha = .08f)).clickable { onOpen(old.week, 0) }.padding(6.dp),
                        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CaPoster(ca, old.poster, Modifier.width(36.dp).height(64.dp).clip(RoundedCornerShape(8.dp)))
                        Column(Modifier.padding(end = 6.dp)) {
                            Text(CurrentAffairs.dates(old.week), color = CA_CREAM, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(if (hindi) "${old.scenes} दृश्य" else "${old.scenes} scenes", color = CA_CREAM.copy(alpha = .7f), fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

/**
 * The week, one scene per screen: swipe up for the next. Each open scene plays with its captions (CC toggles them),
 * then its question comes up over the scene's "Your turn" card, with the why after the answer. Chips under the title
 * open the scene's place in the syllabus. Scenes outside Plus show blurred, with the Plus pill and the free-trial line.
 */
@kotlin.OptIn(ExperimentalFoundationApi::class, ExperimentalLayoutApi::class)
@OptIn(UnstableApi::class)
@Composable
fun CaPlayerScreen(
    ca: CurrentAffairs, weekId: String?, start: Int, gate: PlusGate, quiet: Boolean, hindi: Boolean,
    onNode: (paper: String, topic: String?) -> Unit, onSeePlus: () -> Unit, onWeekDone: () -> Unit, onClose: () -> Unit,
) {
    BackHandler(onBack = onClose)
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val id = weekId ?: ca.weeks.firstOrNull()?.week
    var loading by remember { mutableStateOf(true) }
    val week by produceState<CaWeek?>(null, id) {
        if (id == null) ca.refresh()
        value = (id ?: ca.weeks.firstOrNull()?.week)?.let { ca.week(it) }
        loading = false
    }
    Box(Modifier.fillMaxSize().background(Color.Black)) {
        val w = week
        if (w == null || w.episodes.isEmpty()) {
            Column(Modifier.align(Alignment.Center).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    if (loading) (if (hindi) "हफ़्ता खुल रहा है…" else "Opening the week…")
                    else (if (hindi) "इस हफ़्ते के दृश्य अभी नहीं आए। रविवार को फिर देखें।" else "This week's scenes aren't in yet. Look again on Sunday."),
                    color = CA_CREAM,
                )
                TextButton(onClick = onClose) { Text(if (hindi) "वापस" else "Back", color = CA_GOLD) }
            }
            return@Box
        }
        val scenes = w.episodes
        val pager = rememberPagerState(initialPage = start.coerceIn(0, scenes.lastIndex)) { scenes.size }
        val player = remember {
            ExoPlayer.Builder(context).setMediaSourceFactory(DefaultMediaSourceFactory(CaCache.dataSource(context))).build()
        }
        var captions by rememberSaveable { mutableStateOf(true) }
        var firstFrame by remember { mutableStateOf(false) }
        var playing by remember { mutableStateOf(false) }
        // The caption on screen now (2–5 words a cue), drawn by us just above the title and chips.
        var cue by remember { mutableStateOf("") }
        // Scenes played to the end: their question shows. Watching again hides it until the end.
        var ended by remember { mutableStateOf(scenes.indices.filter { ca.watched(w.week, scenes[it].id) }.toSet()) }
        var current by remember { mutableIntStateOf(pager.settledPage) }
        val checkWeekDone = {
            val openScenes = scenes.filter { caOpen(it, gate) }
            if (openScenes.isNotEmpty() && openScenes.all { e -> ca.watched(w.week, e.id) && e.quiz.all { ca.answer(it.id) != null } }) onWeekDone()
        }
        DisposableEffect(player) {
            val l = object : Player.Listener {
                override fun onRenderedFirstFrame() { firstFrame = true }
                override fun onIsPlayingChanged(isPlaying: Boolean) { playing = isPlaying }
                override fun onCues(cueGroup: CueGroup) { cue = cueGroup.cues.mapNotNull { it.text?.toString() }.joinToString(" ").trim() }
                override fun onPlaybackStateChanged(state: Int) {
                    if (state == Player.STATE_ENDED) {
                        val e = scenes[current]
                        ended = ended + current
                        ca.markWatched(w.week, e.id)
                        checkWeekDone()
                    }
                }
            }
            player.addListener(l)
            onDispose { player.removeListener(l); player.release() }
        }
        LaunchedEffect(captions, w.lang) {
            player.trackSelectionParameters = player.trackSelectionParameters.buildUpon()
                .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, !captions)
                .setPreferredTextLanguage(w.lang)
                .build()
        }
        // The settled scene plays from the start; a locked one stops the player.
        LaunchedEffect(pager.settledPage) {
            current = pager.settledPage
            firstFrame = false
            val e = scenes[current]
            if (!caOpen(e, gate)) { player.stop(); player.clearMediaItems(); return@LaunchedEffect }
            if (!e.free) ca.unlock(w.week)
            val item = MediaItem.Builder().setUri(ca.url(w, e.mp4)).setMediaId(e.id).apply {
                e.vtt?.let { vtt ->
                    setSubtitleConfigurations(listOf(
                        MediaItem.SubtitleConfiguration.Builder(Uri.parse(ca.url(w, vtt))).setMimeType(MimeTypes.TEXT_VTT)
                            .setLanguage(w.lang).setSelectionFlags(C.SELECTION_FLAG_DEFAULT).build(),
                    ))
                }
            }.build()
            player.setMediaItem(item)
            player.prepare()
            // Watched before: wait on the question (or a tap on Watch again) instead of replaying.
            player.playWhenReady = current !in ended
        }

        VerticalPager(pager, Modifier.fillMaxSize(), beyondViewportPageCount = 0) { page ->
            val e = scenes[page]
            Box(Modifier.fillMaxSize()) {
                if (!caOpen(e, gate)) {
                    LockedScene(ca, w, e, quiet, hindi, onSeePlus)
                    return@Box
                }
                if (page == current) {
                    AndroidView(
                        factory = { ctx ->
                            PlayerView(ctx).apply {
                                useController = false
                                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                                setShutterBackgroundColor(android.graphics.Color.BLACK)
                                // Captions come through onCues and sit in the footer, clear of the title.
                                subtitleView?.visibility = android.view.View.GONE
                            }
                        },
                        update = { it.player = player },
                        onRelease = { it.player = null },
                        modifier = Modifier.fillMaxSize(),
                    )
                    // Taps pause and play from a Compose layer over the video: the PlayerView itself would take the
                    // swipe away from the pager.
                    Box(Modifier.fillMaxSize().pointerInput(page in ended) {
                        if (page !in ended) detectTapGestures { if (player.isPlaying) player.pause() else player.play() }
                    })
                }
                // The poster until the first frame (and for the scenes either side while swiping).
                if (page != current || !firstFrame) CaPoster(ca, w.base + (e.poster ?: ""), Modifier.fillMaxSize())
                if (page == current && firstFrame && !playing && page !in ended) {
                    Text("▶", Modifier.align(Alignment.Center).clip(RoundedCornerShape(999.dp)).background(Color.Black.copy(alpha = .5f))
                        .padding(horizontal = 26.dp, vertical = 14.dp), color = Color.White, fontSize = 34.sp)
                }
                if (page in ended) {
                    QuizPanel(ca, e, hindi, last = page == scenes.lastIndex, modifier = Modifier.align(Alignment.BottomCenter),
                        onAnswered = { checkWeekDone() },
                        onAgain = { ended = ended - page; player.seekTo(0); player.play() },
                        onNext = { scope.launch { if (page < scenes.lastIndex) pager.animateScrollToPage(page + 1) else onClose() } })
                } else {
                    SceneFooter(e, hindi, cue.takeIf { captions && page == current && it.isNotEmpty() }, Modifier.align(Alignment.BottomCenter), onNode)
                }
            }
        }

        // The top bar: back, where you are, captions and offline.
        Row(Modifier.fillMaxWidth().statusBarsPadding().background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = .6f), Color.Transparent)))
            .padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            TextButton(onClick = onClose) { Text("←", color = Color.White, fontSize = 22.sp) }
            Column(Modifier.weight(1f)) {
                Text(if (hindi) "दृश्य ${scenes[pager.currentPage].n} / ${scenes.size}" else "Scene ${scenes[pager.currentPage].n} of ${scenes.size}",
                    color = Color.White, fontWeight = FontWeight.Bold)
                Text(CurrentAffairs.dates(w.week), color = Color.White.copy(alpha = .7f), fontSize = 12.sp)
            }
            if (BuildConfig.DEBUG && scenes[pager.currentPage].draft) DraftTag()
            if (caOpen(scenes[pager.currentPage], gate) && scenes[pager.currentPage].vtt != null) {
                Text("CC", Modifier.clip(RoundedCornerShape(6.dp)).then(
                    if (captions) Modifier.background(Color.White) else Modifier.border(1.dp, Color.White, RoundedCornerShape(6.dp)),
                ).clickable { captions = !captions }.padding(horizontal = 8.dp, vertical = 3.dp)
                    .semantics { contentDescription = if (captions) "Captions on. Tap to turn off." else "Captions off. Tap to turn on." },
                    color = if (captions) Color.Black else Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
            }
            SaveOffline(ca, w, gate, hindi)
        }
    }
}

/** "Save for offline": the scenes this member can watch, with captions and posters, into the media cache. */
@Composable
private fun SaveOffline(ca: CurrentAffairs, w: CaWeek, gate: PlusGate, hindi: Boolean) {
    val scope = rememberCoroutineScope()
    @Suppress("UNUSED_VARIABLE") val tick = ca.progress
    var saving by remember { mutableStateOf<Float?>(null) }
    val label = when {
        saving != null -> "${((saving ?: 0f) * 100).toInt()}%"
        ca.savedOffline(w.week) -> if (hindi) "✓ ऑफ़लाइन" else "✓ Offline"
        else -> if (hindi) "⤓ सेव" else "⤓ Save"
    }
    Text(label, Modifier.clip(RoundedCornerShape(6.dp)).clickable(enabled = saving == null && !ca.savedOffline(w.week)) {
        saving = 0f
        scope.launch { ca.saveOffline(w, { caOpen(it, gate) }) { saving = it }; saving = null }
    }.padding(horizontal = 8.dp, vertical = 4.dp).semantics { contentDescription = "Save this week's scenes for offline" },
        color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
}

/** Under the playing scene: its title, the syllabus chips and the sources. */
@kotlin.OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SceneFooter(e: CaEpisode, hindi: Boolean, caption: String?, modifier: Modifier, onNode: (String, String?) -> Unit) {
    var sources by remember(e.id) { mutableStateOf(false) }
    Column(
        modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .85f))))
            .navigationBarsPadding().padding(start = 16.dp, end = 16.dp, top = 28.dp, bottom = 12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (caption != null) {
            Text(caption, Modifier.align(Alignment.CenterHorizontally).padding(bottom = 10.dp).clip(RoundedCornerShape(8.dp))
                .background(Color.Black.copy(alpha = .7f)).padding(horizontal = 10.dp, vertical = 4.dp),
                color = Color.White, fontSize = 20.sp, lineHeight = 26.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
        }
        Text(e.title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, lineHeight = 22.sp)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            caNodes(e).forEach { n ->
                Text(n.label, Modifier.clip(RoundedCornerShape(999.dp)).background(Color.White.copy(alpha = .16f)).clickable { onNode(n.paper, n.topic) }
                    .padding(horizontal = 10.dp, vertical = 5.dp).semantics { contentDescription = "Open ${n.label} in the syllabus" },
                    color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
            if (e.sourceList().isNotEmpty()) {
                Text(if (sources) (if (hindi) "स्रोत ▴" else "Sources ▴") else (if (hindi) "स्रोत ▾" else "Sources ▾"),
                    Modifier.clip(RoundedCornerShape(999.dp)).border(1.dp, Color.White.copy(alpha = .4f), RoundedCornerShape(999.dp))
                        .clickable { sources = !sources }.padding(horizontal = 10.dp, vertical = 5.dp),
                    color = Color.White, fontSize = 12.sp)
            }
        }
        if (sources) Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            e.sourceList().forEach { (name, url) -> Text("· $name" + (url?.let { "  ($it)" } ?: ""), color = Color.White.copy(alpha = .85f), fontSize = 12.sp) }
        }
    }
}

/** The scene's question(s), right after it, with the why once answered. Answers are kept. */
@Composable
private fun QuizPanel(ca: CurrentAffairs, e: CaEpisode, hindi: Boolean, last: Boolean, modifier: Modifier, onAnswered: () -> Unit, onAgain: () -> Unit, onNext: () -> Unit) {
    @Suppress("UNUSED_VARIABLE") val tick = ca.progress
    // The whole frame, so the video's own "Your turn" card doesn't show through as a second copy of the question.
    Box(modifier.fillMaxSize().background(CA_INK).statusBarsPadding().navigationBarsPadding().padding(top = 56.dp), contentAlignment = Alignment.BottomCenter) {
    Column(
        Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(if (hindi) "आपकी बारी" else "YOUR TURN", color = CA_GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 1.6.sp)
        e.quiz.forEach { q ->
            val picked = ca.answer(q.id)
            Text(q.q, color = CA_CREAM, fontWeight = FontWeight.Bold, fontSize = 17.sp, lineHeight = 22.sp)
            q.options.forEachIndexed { i, opt ->
                val shade = when {
                    picked == null -> Color.White.copy(alpha = .1f)
                    i == q.answerIndex -> CA_RIGHT.copy(alpha = .3f)
                    i == picked -> CA_WRONG.copy(alpha = .3f)
                    else -> Color.White.copy(alpha = .05f)
                }
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(shade)
                    .clickable(enabled = picked == null) { ca.saveAnswer(q.id, i); onAnswered() }.padding(horizontal = 14.dp, vertical = 11.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Text("${'A' + i}", color = CA_GOLD, fontWeight = FontWeight.ExtraBold, modifier = Modifier.width(24.dp))
                    Text(opt, color = CA_CREAM, modifier = Modifier.weight(1f))
                    if (picked != null && i == q.answerIndex) Text("✓", color = CA_RIGHT, fontWeight = FontWeight.ExtraBold)
                    if (picked == i && i != q.answerIndex) Text("✗", color = CA_WRONG, fontWeight = FontWeight.ExtraBold)
                }
            }
            if (picked != null) {
                val right = picked == q.answerIndex
                // The why is written for a right answer ("Right. ..."); after a miss, lead with the answer instead.
                val why = q.why.removePrefix("Right.").trim()
                Text(
                    if (right) q.why.ifBlank { if (hindi) "सही।" else "Right." }
                    else (if (hindi) "सही उत्तर: ${q.options[q.answerIndex]}। " else "The answer is ${q.options[q.answerIndex]}. ") + why,
                    color = if (right) CA_RIGHT else CA_CREAM, fontSize = 14.sp, lineHeight = 19.sp,
                )
            }
        }
        val done = e.quiz.all { ca.answer(it.id) != null }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onAgain) { Text(if (hindi) "फिर से देखें" else "Watch again", color = CA_CREAM) }
            if (done || e.quiz.isEmpty()) Button(onClick = onNext, colors = ButtonDefaults.buttonColors(containerColor = CA_GOLD, contentColor = Color(0xFF2A1300))) {
                Text(if (last) (if (hindi) "हो गया" else "Done") else (if (hindi) "अगला दृश्य ↓" else "Next scene ↓"), fontWeight = FontWeight.ExtraBold)
            }
        }
    }
    }
}

/** A Plus scene for a member without Plus: the title over a blurred poster, the Plus pill and the free-trial line. */
@Composable
private fun LockedScene(ca: CurrentAffairs, w: CaWeek, e: CaEpisode, quiet: Boolean, hindi: Boolean, onSeePlus: () -> Unit) {
    Box(Modifier.fillMaxSize()) {
        CaPoster(ca, w.base + (e.poster ?: ""), Modifier.fillMaxSize(), blurred = true)
        Column(Modifier.align(Alignment.Center).fillMaxWidth().padding(24.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(if (hindi) "दृश्य ${e.n} · PLUS" else "SCENE ${e.n} · PLUS", color = CA_GOLD, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 1.6.sp)
            Text(e.title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 24.sp, lineHeight = 29.sp)
            Text(if (quiet) "🔒 Plus" else "🔒 Unlock with Plus · ${Honest.inr(PLUS_YEARLY_INR)} a year",
                Modifier.clip(RoundedCornerShape(999.dp)).background(Color(0xE6141C34)).clickable(enabled = !quiet, onClick = onSeePlus)
                    .padding(horizontal = 14.dp, vertical = 8.dp), color = CA_GOLD, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            if (!quiet) {
                Text(if (hindi) "Plus में हर हफ़्ते के सारे दृश्य, हर एक के सवाल के साथ।" else "Plus opens every scene of every week, each with its question.",
                    color = CA_CREAM.copy(alpha = .85f), fontSize = 14.sp)
                PlusOffer(hindi)
                TextButton(onClick = onSeePlus) { Text(if (hindi) "Plus में क्या है, देखें →" else "See what Plus adds →", color = CA_GOLD) }
            }
            Text(if (hindi) "अगले दृश्य के लिए ऊपर स्वाइप करें" else "Swipe up for the next scene", color = Color.White.copy(alpha = .6f), fontSize = 12.sp)
        }
    }
}
