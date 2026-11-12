package com.upscpods.app.ui

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.material3.Checkbox
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import com.upscpods.app.data.AnswerFeedback
import com.upscpods.app.data.AnswerLog
import com.upscpods.app.data.Community
import com.upscpods.app.data.Focus
import com.upscpods.app.data.MainsTask
import com.upscpods.app.data.Persona
import com.upscpods.app.data.PodClient
import com.upscpods.app.data.Practice
import com.upscpods.app.data.Rooms
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File

private enum class StudioStep { PICK, WRITE, SUBMIT, SELF, FEEDBACK, REWRITE }

private val BANDS = listOf("below" to "Below", "at" to "At", "above" to "Above")
private fun bandName(b: String?) = BANDS.firstOrNull { it.first == b }?.second ?: "–"

/** 7 minutes for a 150-word answer, 11 for 250: the exam's pace. */
private fun minutesFor(words: Int) = if (words == 250) 11 else 7

private val AREA_NAMES = listOf(
    "directive" to "Directive word", "structure" to "Structure", "content" to "Content coverage",
    "examples" to "Examples and data", "conclusion" to "Conclusion",
)

/**
 * Answer Studio (sell-first plan, W5): pick a Mains question, write against a visible countdown (optionally in Focus
 * mode, with the Focus app blocker), then photograph the handwritten sheet or type it, and get rubric feedback. The
 * attempt log stays on the phone and Chotu's line comes from it. "Send to pod" asks a room for peer review.
 * The photo is a cache file, deleted once it's been graded or the screen closes.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnswerStudioScreen(
    questions: List<MainsTask>,
    community: Community,
    log: AnswerLog,
    rooms: Rooms,
    pod: PodClient,
    persona: Persona?,
    hindi: Boolean,
    onOpenNeedToTalk: () -> Unit,
    onClose: () -> Unit,
    /** Opened from the answer-hour or comeback nudge: a line on top, and question 1 (the room's question) picked. */
    banner: String? = null,
    /** An answer was finished (the ritual's action). */
    onAnswered: () -> Unit = {},
    /** The rubric area you said you trust least (Chotu's day-2 chat): the review shows it first. */
    focusArea: String? = null,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var step by rememberSaveable { mutableStateOf(StudioStep.PICK) }
    var qIndex by rememberSaveable { mutableStateOf(0) }
    var words by rememberSaveable { mutableStateOf(150) }
    var focus by rememberSaveable { mutableStateOf(false) }
    var attemptId by rememberSaveable { mutableStateOf<String?>(null) }
    var startedAt by rememberSaveable { mutableLongStateOf(0L) }
    var typing by rememberSaveable { mutableStateOf(false) }
    var text by rememberSaveable { mutableStateOf("") }
    var over by rememberSaveable { mutableStateOf(false) }
    var photoPath by rememberSaveable { mutableStateOf<String?>(null) }
    var feedback by remember { mutableStateOf<AnswerFeedback?>(null) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var sending by remember { mutableStateOf(false) }
    // The reviewed sheet, in memory only (the file is deleted after the review), so "Send to pod" can attach it.
    var reviewedJpeg by remember { mutableStateOf<ByteArray?>(null) }
    var leaving by remember { mutableStateOf(false) }
    // Teaching plan, writing: mark it yourself first, then the AI's second opinion next to your marks, then one rewrite.
    val selfMarks = remember { androidx.compose.runtime.mutableStateMapOf<String, String>() }
    var myFix by rememberSaveable { mutableStateOf("") }
    var doneNote by remember { mutableStateOf<String?>(null) }
    val question = questions.getOrNull(qIndex) ?: questions.first()
    val prompt = question.prompt.replace(Regex("\\s*\\((150|250) (words|शब्द)\\)\\s*$"), "")

    val photoFile = remember { File(context.cacheDir, "answer").apply { mkdirs() }.let { File(it, "sheet.jpg") } }
    val deletePhoto = { photoFile.delete(); photoPath = null }
    DisposableEffect(Unit) { onDispose { photoFile.delete() } }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        photoPath = if (ok && photoFile.length() > 0) photoFile.path else null
    }
    val takePhoto = {
        val uri: Uri = FileProvider.getUriForFile(context, "${context.packageName}.share", photoFile)
        runCatching { camera.launch(uri) }.onFailure { error = "No camera app found. You can type the answer instead." }
    }

    fun stopFocus() { if (focus && Focus.active(context)) Focus.stop(context) }
    fun finish() {
        attemptId?.let { log.finish(it, over) }
        stopFocus()
        step = StudioStep.SUBMIT
        onAnswered()
    }
    fun abandon() {
        attemptId?.let { log.abandon(it) }
        stopFocus()
        deletePhoto(); text = ""; typing = false; over = false; feedback = null
        step = StudioStep.PICK
    }
    val close = {
        if (step == StudioStep.WRITE) abandon()
        onClose()
    }
    BackHandler { if (step == StudioStep.WRITE) leaving = true else close() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Answer Studio") },
                navigationIcon = { TextButton(onClick = { if (step == StudioStep.WRITE) leaving = true else close() }) { Text("← Back") } },
            )
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            when (step) {
                StudioStep.PICK -> {
                    doneNote?.let { Text(it, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary) }
                    ChotuSays(banner ?: log.chotuLine(hindi), ChotuMood.CALM)
                    Text("Pick a question", style = MaterialTheme.typography.titleMedium)
                    questions.forEachIndexed { i, q ->
                        FilterChip(
                            selected = i == qIndex, onClick = { qIndex = i },
                            label = { Text("${q.topic}: ${q.prompt.replace(Regex("\\s*\\((150|250) (words|शब्द)\\)\\s*$"), "")}", modifier = Modifier.padding(vertical = 6.dp)) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                    Text("How long", style = MaterialTheme.typography.titleMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(150, 250).forEach { w ->
                            FilterChip(selected = words == w, onClick = { words = w }, label = { Text("$w words · ${minutesFor(w)} min") })
                        }
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text("Focus mode", style = MaterialTheme.typography.titleSmall)
                            Text("Blocks the apps you picked in Focus for the timer.", style = MaterialTheme.typography.bodySmall)
                        }
                        Switch(checked = focus, onCheckedChange = { focus = it })
                    }
                    Button(
                        onClick = {
                            val a = log.start(prompt, words)
                            attemptId = a.id; startedAt = a.startedAt; over = false; text = ""; feedback = null; error = null
                            selfMarks.clear(); myFix = ""; doneNote = null
                            deletePhoto()
                            if (focus) Focus.start(context, minutesFor(words), "Answer Studio")
                            step = StudioStep.WRITE
                        },
                        modifier = Modifier.fillMaxWidth().height(MainActionHeight),
                    ) { Text("Start the ${minutesFor(words)}-minute timer") }
                    WeekLine(log)
                }

                StudioStep.WRITE -> {
                    val total = minutesFor(words) * 60_000L
                    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
                    LaunchedEffect(startedAt) { while (true) { now = System.currentTimeMillis(); delay(500) } }
                    val left = (startedAt + total - now).coerceAtLeast(0)
                    LaunchedEffect(left == 0L) { if (left == 0L) { over = true; stopFocus() } }
                    Text(question.topic, style = MaterialTheme.typography.labelMedium)
                    Text(prompt, style = MaterialTheme.typography.titleMedium)
                    Text(
                        "%d:%02d".format(left / 60_000, (left / 1000) % 60),
                        fontSize = 56.sp, fontWeight = FontWeight.SemiBold,
                        color = if (left == 0L) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
                        modifier = Modifier.align(Alignment.CenterHorizontally),
                    )
                    Text(
                        if (left == 0L) "Time. Finish the line you're on and write a one-line conclusion. Done beats perfect."
                        else "Write on paper, about $words words. Intro, body, conclusion. When you're done, photograph the sheet.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    if (typing) {
                        OutlinedTextField(value = text, onValueChange = { text = it }, modifier = Modifier.fillMaxWidth().heightIn(min = 220.dp),
                            textStyle = if (hindi) ReadingHindi else ReadingText)
                        Text("${Practice.wordCount(text)} / $words words", style = MaterialTheme.typography.labelMedium)
                    } else TextButton(onClick = { typing = true }) { Text("No paper handy? Type it here") }
                    Button(onClick = { finish() }, modifier = Modifier.fillMaxWidth().height(MainActionHeight)) { Text("I'm done") }
                    TextButton(onClick = { leaving = true }) { Text("Leave this one") }
                }

                StudioStep.SUBMIT -> {
                    Text(if (over) "Finished, a little over time. That still counts." else "Finished inside the time. Well done.", style = MaterialTheme.typography.titleMedium)
                    Text(prompt, style = MaterialTheme.typography.bodyMedium)
                    val bmp = remember(photoPath) { photoPath?.let { p -> runCatching { BitmapFactory.decodeFile(p, BitmapFactory.Options().apply { inSampleSize = 4 }) }.getOrNull() } }
                    bmp?.let { Image(it.asImageBitmap(), "Your answer sheet", Modifier.fillMaxWidth().heightIn(max = 320.dp), contentScale = ContentScale.Fit) }
                    if (!typing || photoPath != null) {
                        OutlinedButton(onClick = { takePhoto() }, modifier = Modifier.fillMaxWidth()) { Text(if (photoPath == null) "Photograph the sheet" else "Take it again") }
                    }
                    if (photoPath == null) {
                        if (typing) {
                            OutlinedTextField(value = text, onValueChange = { text = it }, modifier = Modifier.fillMaxWidth().heightIn(min = 200.dp),
                                textStyle = if (hindi) ReadingHindi else ReadingText)
                            Text("${Practice.wordCount(text)} words", style = MaterialTheme.typography.labelMedium)
                        } else TextButton(onClick = { typing = true }) { Text("Type it instead") }
                    }
                    error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium) }
                    Button(onClick = { step = StudioStep.SELF }, modifier = Modifier.fillMaxWidth().height(MainActionHeight)) { Text("Mark it yourself →") }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { sending = true }) { Text("Send to pod") }
                        TextButton(onClick = { deletePhoto(); text = ""; typing = false; step = StudioStep.PICK }) { Text("Another question") }
                    }
                }

                StudioStep.SELF -> {
                    Text("Mark it yourself first", style = MaterialTheme.typography.titleMedium)
                    Text("For each part: below, at or above a typical scoring answer. Your own eye is the skill that matters on the day.", style = MaterialTheme.typography.bodyMedium)
                    AREA_NAMES.forEach { (key, name) ->
                        Text(name, style = MaterialTheme.typography.titleSmall)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            BANDS.forEach { (b, label) -> FilterChip(selected = selfMarks[key] == b, onClick = { selfMarks[key] = b }, label = { Text(label) }) }
                        }
                    }
                    OutlinedTextField(value = myFix, onValueChange = { myFix = it.take(200) }, label = { Text("The one thing I'd change first") }, modifier = Modifier.fillMaxWidth())
                    val allMarked = AREA_NAMES.all { selfMarks[it.first] != null }
                    error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium) }
                    Button(
                        onClick = {
                            attemptId?.let { log.marked(it, selfMarks.toMap()) }
                            busy = true; error = null
                            scope.launch {
                                val jpeg = photoPath?.let { p -> withContext(Dispatchers.IO) { shrink(p) } }
                                val fb = community.evaluate(prompt, words, if (jpeg == null) text else null, jpeg, hindi)
                                busy = false
                                when {
                                    fb.care -> onOpenNeedToTalk()
                                    fb.error != null -> error = fb.error
                                    else -> {
                                        feedback = fb; reviewedJpeg = jpeg
                                        attemptId?.let { log.reviewed(it); log.secondOpinion(it, fb.areas.mapValues { e -> e.value.band }) }
                                        deletePhoto(); step = StudioStep.FEEDBACK
                                    }
                                }
                            }
                        },
                        enabled = allMarked && !busy && (photoPath != null || Practice.wordCount(text) > 0),
                        modifier = Modifier.fillMaxWidth().height(MainActionHeight),
                    ) { Text(if (busy) "Reading your answer…" else "Get a second opinion (AI) →") }
                    OutlinedButton(onClick = { attemptId?.let { log.marked(it, selfMarks.toMap()) }; step = StudioStep.REWRITE }, enabled = allMarked, modifier = Modifier.fillMaxWidth()) { Text("Skip it and rewrite") }
                    if (!allMarked) Text("Mark all five parts to go on.", style = MaterialTheme.typography.bodySmall)
                    Text("3 free second opinions a week; unlimited with Plus. The photo is read once and not kept.", style = MaterialTheme.typography.bodySmall)
                }

                StudioStep.FEEDBACK -> feedback?.let { fb ->
                    FeedbackView(fb, words, focusArea, selfMarks)
                    Button(onClick = { step = StudioStep.REWRITE }, modifier = Modifier.fillMaxWidth().height(MainActionHeight)) { Text("Rewrite it with one fix →") }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { sending = true }) { Text("Send to pod") }
                        TextButton(onClick = { text = ""; typing = false; feedback = null; reviewedJpeg = null; step = StudioStep.PICK }) { Text("Another question") }
                    }
                } ?: run { step = StudioStep.PICK }

                StudioStep.REWRITE -> {
                    // Your own fix first; otherwise the second opinion's fix for the part it rated lowest.
                    val rank = mapOf("below" to 0, "at" to 1, "above" to 2)
                    val aiFix = feedback?.areas?.values?.filter { it.fix.isNotBlank() }?.minByOrNull { rank[it.band] ?: 1 }?.fix
                    val fix = myFix.ifBlank { aiFix ?: "Make the conclusion answer the question's directive word." }
                    Text("Rewrite with one fix", style = MaterialTheme.typography.titleMedium)
                    FlatCard(Modifier.fillMaxWidth()) { Text("Your one fix: $fix", Modifier.padding(12.dp), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold) }
                    Text("Write the answer again with just that change, on paper or here. One fix, done well, sticks better than five half-done.", style = MaterialTheme.typography.bodyMedium)
                    OutlinedTextField(value = text, onValueChange = { text = it }, modifier = Modifier.fillMaxWidth().heightIn(min = 200.dp),
                        textStyle = if (hindi) ReadingHindi else ReadingText, placeholder = { Text("Optional: type the rewrite") })
                    Button(
                        onClick = {
                            attemptId?.let { log.rewrote(it) }
                            text = ""; typing = false; feedback = null; reviewedJpeg = null
                            doneNote = "Written, marked and rewritten. Well done."
                            step = StudioStep.PICK
                        },
                        modifier = Modifier.fillMaxWidth().height(MainActionHeight),
                    ) { Text("The rewrite is done") }
                }
            }
        }
    }

    if (leaving) AlertDialog(
        onDismissRequest = { leaving = false },
        title = { Text("Leave this answer?") },
        text = { Text("It goes in your log as left, not failed. Next time, even a rough finish counts.") },
        confirmButton = { TextButton(onClick = { leaving = false; abandon() }) { Text("Leave it") } },
        dismissButton = { TextButton(onClick = { leaving = false }) { Text("Keep writing") } },
    )

    if (sending) SendToPodDialog(rooms, pod, hasPhoto = reviewedJpeg != null || photoPath != null, onDismiss = { sending = false }) { target, withPhoto ->
        sending = false
        error = null
        scope.launch {
            // The photo goes only if the member ticked it: kept 7 days, seen only by that room or pod.
            val ref = if (!withPhoto) null else {
                val bytes = reviewedJpeg ?: photoPath?.let { p -> withContext(Dispatchers.IO) { shrink(p) } }
                bytes?.let { community.sendPhoto(target ?: pod.podId.orEmpty(), it) }.also { if (it == null) error = "Couldn't send the photo just now, so only the text went." }
            }
            val body = buildString {
                append("📝 Answer Studio · $words words\nQ: $prompt\n\n")
                if (text.isNotBlank() && photoPath == null) append(text.trim().take(1800)).append("\n\n")
                else if (ref != null) append("(Written by hand. The photo is below, kept for 7 days.)\n\n")
                else append("(Written by hand, ${feedback?.wordCount?.takeIf { it > 0 }?.let { "about $it words" } ?: "on paper"}. I can share the photo.)\n\n")
                val weakest = feedback?.areas?.entries?.firstOrNull { it.value.band == "below" }
                append(if (weakest != null) "Chotu's review said my ${AREA_NAMES.firstOrNull { it.first == weakest.key }?.second?.lowercase() ?: weakest.key} needs work. " else "")
                append("Could someone review it? I'll review one back.")
                ref?.let { append("\n").append(it) }
            }
            if (target == null) pod.say(body) else rooms.post(target, body, persona)
        }
    }
}

/** The week so far, under the start button: counts only, from this phone's log. */
@Composable
private fun WeekLine(log: AnswerLog) {
    val w = log.week()
    if (w.started == 0) return
    Text(
        listOfNotNull("This week: ${w.started} started", "${w.finished} finished", if (w.abandoned > 0) "${w.abandoned} left" else null).joinToString(" · "),
        style = MaterialTheme.typography.labelMedium,
    )
}

@Composable
private fun FeedbackView(fb: AnswerFeedback, words: Int, focusArea: String? = null, self: Map<String, String> = emptyMap()) {
    Text("A second opinion (AI)", style = MaterialTheme.typography.titleLarge)
    if (self.isNotEmpty()) {
        val agree = AREA_NAMES.count { (k, _) -> fb.areas[k]?.band == self[k] }
        Text(if (agree == 5) "You and the second opinion agree on all five parts." else "You and the second opinion agree on $agree of 5. Where you differ, look again: neither is always right.",
            style = MaterialTheme.typography.bodyMedium)
    }
    if (fb.summary.isNotBlank()) Text(fb.summary, style = MaterialTheme.typography.bodyLarge)
    Text(
        listOfNotNull(
            if (fb.wordCount > 0) "${fb.wordCount} words of $words" else null,
            if (fb.overLimit) "a little long: trim to the limit" else null,
            fb.left?.let { if (it == 1) "1 free review left this week" else "$it free reviews left this week" },
        ).joinToString(" · "),
        style = MaterialTheme.typography.labelMedium,
    )
    if (!fb.readable) Text("Parts of the handwriting were hard to read, so some notes may be off. A brighter, flatter photo helps.", style = MaterialTheme.typography.bodySmall)
    AREA_NAMES.sortedBy { it.first != focusArea }.forEach { (key, name) ->
        val a = fb.areas[key] ?: return@forEach
        FlatCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(name, style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
                    Text(
                        when (a.band) { "above" -> "Above a typical scoring answer"; "below" -> "Below a typical scoring answer"; else -> "At a typical scoring answer" },
                        style = MaterialTheme.typography.labelMedium,
                        color = when (a.band) { "above" -> MaterialTheme.colorScheme.primary; "below" -> MaterialTheme.colorScheme.error; else -> MaterialTheme.colorScheme.onSurfaceVariant },
                    )
                }
                if (self.isNotEmpty()) Text("You: ${bandName(self[key])} · Second opinion: ${bandName(a.band)}", style = MaterialTheme.typography.labelMedium)
                if (key == focusArea) Text("The part you said you'd watch", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                if (a.note.isNotBlank()) Text(a.note, style = MaterialTheme.typography.bodyMedium)
                if (a.fix.isNotBlank()) Text("One fix: ${a.fix}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            }
        }
    }
    val sk = fb.skeleton
    if (sk.intro.isNotBlank() || sk.body.isNotEmpty()) {
        Text("A model answer's skeleton", style = MaterialTheme.typography.titleMedium)
        if (sk.intro.isNotBlank()) Text("Intro: ${sk.intro}", style = MaterialTheme.typography.bodyMedium)
        sk.body.forEach { Text("• $it", style = MaterialTheme.typography.bodyMedium) }
        if (sk.conclusion.isNotBlank()) Text("Conclusion: ${sk.conclusion}", style = MaterialTheme.typography.bodyMedium)
    }
    Text("A second opinion by AI, next to your own marks. It can be wrong; your pod and your own judgement come first.", style = MaterialTheme.typography.bodySmall)
}

/** Where "Send to pod" posts: one of your open rooms (Mains answer writing first), or your matched pod. */
@Composable
private fun SendToPodDialog(rooms: Rooms, pod: PodClient, hasPhoto: Boolean, onDismiss: () -> Unit, onSend: (String?, Boolean) -> Unit) {
    val joined = rooms.joined.sortedBy { if (it.id == "room-mains-writing") 0 else 1 }
    var withPhoto by remember { mutableStateOf(false) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Ask for a review") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                if (joined.isEmpty() && pod.podId == null) Text("Join a room first, like Mains answer writing, in the Pod tab.")
                if (hasPhoto) Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = withPhoto, onCheckedChange = { withPhoto = it })
                    Text("Include the photo. Kept 7 days, seen only by that room.", style = MaterialTheme.typography.bodySmall)
                }
                if (pod.podId != null) TextButton(onClick = { onSend(null, withPhoto) }) { Text("My pod") }
                joined.forEach { r -> TextButton(onClick = { onSend(r.id, withPhoto) }) { Text(r.name) } }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

/** The photo, made small enough to send: about 1600 px on its long side, JPEG. The original file is left to the caller. */
private fun shrink(path: String): ByteArray? = runCatching {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(path, bounds)
    var sample = 1
    while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 1600) sample *= 2
    val bmp = BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inSampleSize = sample }) ?: return null
    val scale = 1600f / maxOf(bmp.width, bmp.height)
    val out = if (scale < 1f) Bitmap.createScaledBitmap(bmp, (bmp.width * scale).toInt(), (bmp.height * scale).toInt(), true) else bmp
    ByteArrayOutputStream().use { s -> out.compress(Bitmap.CompressFormat.JPEG, 82, s); s.toByteArray() }
}.getOrNull()
