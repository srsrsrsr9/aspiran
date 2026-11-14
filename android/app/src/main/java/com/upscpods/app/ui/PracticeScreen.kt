package com.upscpods.app.ui

import com.upscpods.app.data.ReadingLanguage
import com.upscpods.app.data.ContentLibrary
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import com.upscpods.app.data.Brief
import com.upscpods.app.data.DayState
import com.upscpods.app.data.MainsTask
import com.upscpods.app.data.NewsItem
import com.upscpods.app.data.Persona
import com.upscpods.app.data.Practice
import com.upscpods.app.data.PracticeQuestion
import com.upscpods.app.data.TaskId
import kotlinx.coroutines.delay

/** Practice hub: today's questions and answer, saved cards, and the Chai archive. */
@Composable
fun PracticeTab(
    day: DayState,
    persona: Persona?,
    mains: MainsTask,
    saved: List<NewsItem>,
    archive: List<Brief>,
    onOpenPrelims: () -> Unit,
    onOpenMains: () -> Unit,
    onOpenCards: (Brief) -> Unit,
    modifier: Modifier = Modifier,
    library: ContentLibrary? = null,
    onOpenItem: (String) -> Unit = {},
    /** Questions and topics due in the review today. */
    reviewDue: Int = 0,
    onOpenReview: () -> Unit = {},
    prepEntries: (@Composable () -> Unit)? = null,
    /** Answer Studio: a timed answer with rubric feedback. */
    onOpenStudio: (() -> Unit)? = null,
    /** Past UPSC questions (PYQ mode): how many are approved, and opening them. */
    pyqCount: Int = 0,
    onOpenPyq: () -> Unit = {},
    /** Essays in three snaps: how many approved topics, and opening them. */
    essayCount: Int = 0,
    onOpenEssays: () -> Unit = {},
    /** Mock interview: whether the question bank is approved yet, and opening the board. */
    interviewReady: Boolean = false,
    onOpenInterview: () -> Unit = {},
    /** Chai v2 and progress: the case file and You vs. you. */
    caseCount: Int = 0,
    onOpenCaseFile: () -> Unit = {},
    onOpenProgress: () -> Unit = {},
    /** Away from the screen, optional subjects and terms. */
    onOpenWalk: () -> Unit = {},
    onOpenPrint: () -> Unit = {},
    onOpenOptional: () -> Unit = {},
    onOpenTerms: () -> Unit = {},
    /** The owner's batches: answer skeletons, GS4 cases and weekly CSAT sets (BriefScreens.kt). */
    skeletonCount: Int = 0,
    onOpenSkeletons: () -> Unit = {},
    caseStudyCount: Int = 0,
    onOpenEthics: () -> Unit = {},
    csatWeeks: Int = 0,
    onOpenCsat: () -> Unit = {},
    /** Printable sheets and audio lectures (SheetsTalks.kt). */
    talkCount: Int = 0,
    onOpenTalks: () -> Unit = {},
    sheetCount: Int = 0,
    onOpenSheets: () -> Unit = {},
) {
    val partTime = persona?.partTime == true
    // One filled button per screen: the first of today's two practice tasks not yet done.
    val next = listOf(TaskId.PRELIMS, TaskId.MAINS).firstOrNull { it !in day.done }
    Column(
        modifier.verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        PracticeCard(
            title = "${Practice.DAILY} Prelims questions",
            detail = "Today's new questions from the Chai cards, and a few static ones · about 5 min",
            done = TaskId.PRELIMS in day.done,
            filled = next == TaskId.PRELIMS,
            onStart = onOpenPrelims,
        )
        PracticeCard(
            title = if (partTime) "1 Mains outline" else "1 Mains answer",
            detail = mains.prompt,
            done = TaskId.MAINS in day.done,
            filled = next == TaskId.MAINS,
            onStart = onOpenMains,
        )
        onOpenStudio?.let {
            PracticeCard(
                title = "Answer Studio",
                detail = "A timed answer, 7 or 11 minutes, on paper. Mark it yourself, get a second opinion from AI, then rewrite it with one fix.",
                done = false,
                filled = false,
                onStart = it,
            )
        }

        PracticeCard(
            title = "Answer skeletons",
            detail = if (skeletonCount > 0) "$skeletonCount real Mains questions, each with a way in. Outline first, then compare." else "Opens once the skeletons are approved.",
            done = false,
            filled = false,
            onStart = onOpenSkeletons,
        )
        PracticeCard(
            title = "Ethics (GS4)",
            detail = if (caseStudyCount > 0) "$caseStudyCount case studies, plus thinkers and terms in English and Hindi." else "Opens once the cases are approved.",
            done = false,
            filled = false,
            onStart = onOpenEthics,
        )
        PracticeCard(
            title = "CSAT, one set a week",
            detail = if (csatWeeks > 0) "$csatWeeks weekly sets: numbers, reasoning, a table and a passage. Worked answers." else "Opens once the CSAT sets are approved.",
            done = false,
            filled = false,
            onStart = onOpenCsat,
        )

        PracticeCard(
            title = "Essays in three snaps",
            detail = "Skeleton, outline, essay, each compared with a guide. $essayCount topic${if (essayCount == 1) "" else "s"}.",
            done = false,
            filled = false,
            onStart = onOpenEssays,
        )

        PracticeCard(
            title = "Your case file",
            detail = "$caseCount example${if (caseCount == 1) "" else "s"} kept from Chai for Mains.",
            done = false,
            filled = false,
            onStart = onOpenCaseFile,
        )

        PracticeCard(
            title = "You vs. you",
            detail = "Your writing, your sense of sure, your markers. Only against your own past.",
            done = false,
            filled = false,
            onStart = onOpenProgress,
        )

        PracticeCard(
            title = "Mock interview",
            detail = if (interviewReady) "A board of five, questions from your own DAF. Answer aloud or type; an AI member can ask a follow-up." else "Opens once the interview questions are approved.",
            done = false,
            filled = false,
            onStart = onOpenInterview,
        )

        if (pyqCount > 0) {
            PracticeCard(
                title = "PYQ: past UPSC questions",
                detail = "$pyqCount questions from UPSC's own papers, by paper and by syllabus topic. Write a Mains one in Answer Studio.",
                done = false,
                filled = false,
                onStart = onOpenPyq,
            )
        }

        Text("Away from the screen", style = MaterialTheme.typography.titleMedium)
        PracticeCard(
            title = "Walk mode",
            detail = "Earphones in: the phone reads a card or names a topic, then you say three points aloud. Nothing is recorded.",
            done = false,
            filled = false,
            onStart = onOpenWalk,
        )
        PracticeCard(
            title = "Print this week's set",
            detail = "Ten things to recall, a mixed CSAT set and your one-pagers, on paper.",
            done = false,
            filled = false,
            onStart = onOpenPrint,
        )
        if (talkCount > 0) PracticeCard(
            title = "Audio lectures",
            detail = "$talkCount talks of 10 to 15 minutes, each with three quick checks.",
            done = false,
            filled = false,
            onStart = onOpenTalks,
        )
        if (sheetCount > 0) PracticeCard(
            title = "Printable sheets",
            detail = "$sheetCount one-page tables, timelines and lists to read, print and pin up.",
            done = false,
            filled = false,
            onStart = onOpenSheets,
        )
        Text("Optional and terms", style = MaterialTheme.typography.titleMedium)
        PracticeCard(
            title = "Optional subject",
            detail = "Topic by topic: why it matters, the note, questions to write, things to recall.",
            done = false,
            filled = false,
            onStart = onOpenOptional,
        )
        PracticeCard(
            title = "English–Hindi terms",
            detail = "The words examiners expect, in both languages, with a one-line meaning.",
            done = false,
            filled = false,
            onStart = onOpenTerms,
        )

        // The one review queue (FSRS): every Chai question answered and every topic met comes back here.
        if (reviewDue > 0) {
            PracticeCard(
                title = "Review: $reviewDue due",
                detail = "Questions and topics that are about to slip. Each comes back just before you'd forget it. Stays on this phone.",
                done = false,
                filled = false,
                onStart = onOpenReview,
            )
        }

        prepEntries?.invoke()
        library?.let { LearnAndPlay(it, persona?.language == ReadingLanguage.HINDI, onOpenItem) }

        Text("Saved for revision", style = MaterialTheme.typography.titleLarge)
        if (saved.isEmpty()) {
            Text(
                "Cards you save come back here, and in your Prelims questions, just before you'd forget them.",
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        saved.forEach { card ->
            Text(
                "• ${card.headline}",
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.fillMaxWidth().clickable {
                    onOpenCards(Brief(date = "Saved", items = listOf(card)))
                }.padding(vertical = 6.dp),
            )
        }

        Text("Chai archive", style = MaterialTheme.typography.titleLarge)
        if (archive.isEmpty()) Text("Past packs collect here.", style = MaterialTheme.typography.bodyMedium)
        archive.forEach { b ->
            FlatCard(Modifier.clickable { onOpenCards(b) }) {
                Column(Modifier.padding(16.dp)) {
                    Text(b.date + if (b.sample) " · sample" else "", style = MaterialTheme.typography.titleMedium)
                    Text(
                        b.items.joinToString(" · ") { it.topic },
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }
    }
}

@Composable
internal fun PracticeCard(title: String, detail: String, done: Boolean, filled: Boolean, onStart: () -> Unit) {
    FlatCard {
        Column(Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(detail, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(vertical = 4.dp))
            val label = if (done) "Do it again" else "Start"
            if (filled) {
                Button(onClick = onStart, modifier = Modifier.height(MainActionHeight)) { Text(label) }
            } else {
                OutlinedButton(onClick = onStart) { Text(if (done) "✓ Done · open" else label) }
            }
        }
    }
}

/** One question per screen. Answers feed spaced revision; no timer, no score shaming. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrelimsScreen(
    questions: List<PracticeQuestion>,
    onAnswer: (PracticeQuestion, Boolean) -> Unit,
    onFinished: () -> Unit,
    onClose: () -> Unit,
    title: String = "Prelims",
) {
    var index by rememberSaveable { mutableIntStateOf(0) }
    var rightCount by rememberSaveable { mutableIntStateOf(0) }
    // Peak-end (playbook A7): the finished screen names one specific thing they got right.
    var firstRight by rememberSaveable { mutableStateOf<String?>(null) }
    var picked by rememberSaveable(index) { mutableStateOf<Int?>(null) }
    var sure by rememberSaveable(index) { mutableStateOf<Boolean?>(null) }
    val context = androidx.compose.ui.platform.LocalContext.current
    val finished = index >= questions.size

    LaunchedEffect(finished) { if (finished) onFinished() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (finished) title else "Question ${index + 1} of ${questions.size}") },
                navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } },
            )
        },
        bottomBar = {
            if (!finished) {
                Button(
                    onClick = { index++ },
                    enabled = picked != null,
                    modifier = Modifier.fillMaxWidth().padding(16.dp).height(MainActionHeight),
                ) { Text(if (index == questions.lastIndex) "Finish" else "Next question →") }
            }
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (questions.isEmpty()) {
                Text("No questions today. Save a few Chai Cards and they'll come back here.")
                return@Column
            }
            if (finished) {
                Text("$rightCount of ${questions.size} right", style = MaterialTheme.typography.headlineSmall)
                Text(
                    if (rightCount < questions.size) {
                        "The ones you missed come back just before you'd forget them. That's how they stick."
                    } else {
                        "All of them. Go have your chai."
                    },
                    style = MaterialTheme.typography.bodyLarge,
                )
                firstRight?.let {
                    Text("You got the $it question right. That one's yours now.", style = MaterialTheme.typography.bodyLarge)
                }
                Spacer(Modifier.height(16.dp))
                OutlinedButton(onClick = onClose) { Text("Back") }
                return@Column
            }
            val q = questions[index]
            if (index == 0) Text("In the real Prelims a wrong answer costs a third of its marks (−⅓ for a wrong answer, 0 if you leave it), so say how sure you are before you look. Here nothing is scored.",
                style = MaterialTheme.typography.bodySmall)
            Text(
                q.topic + if (q.isReview) " · revision" else "",
                style = MaterialTheme.typography.labelMedium,
            )
            Text(q.mcq.question, style = MaterialTheme.typography.titleMedium)
            if (sure == null) SureFirst { sure = it } else q.mcq.options.forEachIndexed { i, opt ->
                FilterChip(
                    selected = picked == i,
                    onClick = {
                        if (picked == null) {
                            picked = i
                            val right = i == q.mcq.answerIndex
                            if (right) { rightCount++; if (firstRight == null) firstRight = q.topic }
                            Calibration.log(context, sure == true, right)
                            onAnswer(q, right)
                        }
                    },
                    label = { Text(opt, modifier = Modifier.padding(vertical = 8.dp)) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            picked?.let {
                val right = it == q.mcq.answerIndex
                Text(
                    (if (right) "✓ Right. " else "○ Not quite. The answer is ${q.mcq.options[q.mcq.answerIndex]}. ") +
                        q.mcq.explanation,
                    style = MaterialTheme.typography.bodyLarge,
                )
                if (!right && sure == true) Text(sureWrongLine(), style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

/**
 * Mains answer editor. Autosaves every 5 seconds; the word counter guides, it never turns red.
 * Part-time mode starts as a 5-minute outline.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainsScreen(
    task: MainsTask,
    partTime: Boolean,
    hindi: Boolean,
    load: suspend () -> String,
    save: (String) -> Unit,
    onDone: () -> Unit,
    onClose: () -> Unit,
) {
    var text by rememberSaveable { mutableStateOf("") }
    var loaded by remember { mutableStateOf(false) }
    var outline by rememberSaveable { mutableStateOf(partTime) }
    var submitted by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(task.id) {
        if (text.isEmpty()) text = load().ifEmpty { if (partTime) Practice.outlineTemplate(hindi) else "" }
        loaded = true
    }
    LaunchedEffect(loaded) {
        if (!loaded) return@LaunchedEffect
        var last = text
        while (true) {
            delay(5_000)
            if (text != last) { save(text); last = text }
        }
    }
    val close = { if (loaded) save(text); onClose() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (outline) "Mains outline" else "Mains answer") },
                navigationIcon = { TextButton(onClick = close) { Text("← Back") } },
            )
        },
        bottomBar = {
            if (!submitted) {
                Button(
                    onClick = { save(text); submitted = true; onDone() },
                    enabled = loaded && Practice.wordCount(text) > 0,
                    modifier = Modifier.fillMaxWidth().padding(16.dp).height(MainActionHeight),
                ) { Text("I'm done") }
            }
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            PauseLine("first-mains")
            Text(task.topic, style = MaterialTheme.typography.labelMedium)
            Text(task.prompt, style = MaterialTheme.typography.titleMedium)
            if (outline) {
                Text(
                    "Five minutes: one line of intro, three points, one way forward. Full sentences can wait.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            if (submitted) {
                SelfCheck(outline)
                return@Column
            }
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                enabled = loaded,
                textStyle = if (hindi) ReadingHindi else ReadingText,
                modifier = Modifier.fillMaxWidth().heightIn(min = 280.dp),
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                val n = Practice.wordCount(text)
                Text(
                    when {
                        outline -> "$n words"
                        n > 180 -> "$n / 150 words · try trimming a little"
                        else -> "$n / 150 words"
                    },
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.weight(1f),
                )
                Text("Saved on this phone", style = MaterialTheme.typography.labelSmall)
            }
            if (partTime) {
                TextButton(onClick = { outline = !outline }) {
                    Text(if (outline) "Write the full answer instead" else "Back to a 5-minute outline")
                }
            }
        }
    }
}

@Composable
private fun SelfCheck(outline: Boolean) {
    val checks = listOf(
        "The intro answers the question in 1–2 lines",
        "2–3 points, each with an example or a fact",
        "Linked to something static: an Article, Act, committee or case",
        "A way forward or conclusion",
    )
    var ticked by rememberSaveable { mutableStateOf(setOf<Int>()) }
    Text("Done ✓ Quick self-check", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
    checks.forEachIndexed { i, c ->
        FilterChip(
            selected = i in ticked,
            onClick = { ticked = if (i in ticked) ticked - i else ticked + i },
            label = { Text(c) },
            modifier = Modifier.fillMaxWidth(),
        )
    }
    Text(Brand.MASCOT, style = MaterialTheme.typography.labelSmall)
    Text(
        if (outline) "“An outline a day beats a perfect answer once a month.”"
        else "“Written is better than perfect. Your pod can see it once the pod server is on.”",
        fontStyle = FontStyle.Italic,
        style = MaterialTheme.typography.bodyLarge,
    )
}

/** Editor-approved explainers, timelines and the playful formats. Engine pieces live in the Learn hub, long reads in Long reads. */
@Composable
private fun LearnAndPlay(library: ContentLibrary, hindi: Boolean, onOpen: (String) -> Unit) {
    // Mock papers have their own place in Prep → Mocks.
    val items = library.items.filter { it.kind !in setOf("sound", "winddown", "mock", "read", "quote", "pyq") && it.data["play"] == null }
    if (items.isEmpty()) return
    Text(if (hindi) "संपादकों की ओर से और" else "More from the editors", style = MaterialTheme.typography.titleLarge)
    items.forEach { item ->
        val h = hindi && item.hindi
        FlatCard(Modifier.clickable { onOpen(item.id) }) {
            Column(Modifier.padding(16.dp)) {
                Text(kindName(item.kind, h), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                Text(itemTitle(item, h), style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}
