@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.upscpods.app.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import com.upscpods.app.data.Chotu
import com.upscpods.app.data.Metrics
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.Brief
import com.upscpods.app.data.DayState
import com.upscpods.app.data.CardView
import com.upscpods.app.data.NewsItem
import com.upscpods.app.data.PracticeQuestion
import com.upscpods.app.data.Guide
import com.upscpods.app.data.TaskId
import com.upscpods.app.data.Tone
import kotlinx.coroutines.launch

/**
 * Today's Chai: one card per screen, "Next card →" button and tappable dots.
 * Swipe is only a shortcut. No auto-advance, no "load more".
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChaiScreen(brief: Brief, day: DayState, preferHindi: Boolean, onClose: () -> Unit, archive: Boolean = false, chotu: Chotu? = null,
    library: ContentLibrary? = null, onOpenItem: ((String) -> Unit)? = null,
    yesterday: PracticeQuestion? = null, onYesterday: ((PracticeQuestion, Boolean) -> Unit)? = null,
    onExamAnswer: ((String, Boolean) -> Unit)? = null, onWhy: ((String) -> Unit)? = null, caseFile: com.upscpods.app.data.CaseFile? = null) {
    val cards = brief.items
    // Day-1 recall: kept for this visit even after it's answered, gone on the next card.
    val recall = remember { yesterday }
    var recallPicked by rememberSaveable { mutableStateOf<Int?>(null) }
    var recallGone by rememberSaveable { mutableStateOf(false) }
    val pager = rememberPagerState(pageCount = { cards.size + 1 }) // last page is the end card
    val scope = rememberCoroutineScope()
    val jokeIds = remember(brief) { brief.jokeCardIds() }
    var overview by rememberSaveable { mutableStateOf(false) }
    val onEndPage = pager.currentPage == cards.size

    LaunchedEffect(pager.currentPage) {
        if (pager.currentPage > 0 && recallPicked != null) recallGone = true
        if (!archive) {
            day.showUp()
            if (onEndPage) {
                if (TaskId.CHAI !in day.done) { Metrics.chaiRead(cards.size); Metrics.rateAfter("chai") }
                day.markDone(TaskId.CHAI)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (archive) "Chai · ${brief.date}" else "Today's Chai") },
                navigationIcon = { TextButton(onClick = onClose) { Text(if (archive) "← Back" else "← Today") } },
                actions = {
                    TextButton(onClick = { overview = !overview }) {
                        Text(if (overview) "Back to card" else "See all ${cards.size}")
                    }
                },
            )
        },
        bottomBar = {
            if (!overview && !onEndPage) {
                Column(Modifier.padding(16.dp)) {
                    ProgressDots(count = cards.size, current = pager.currentPage) { i ->
                        scope.launch { pager.animateScrollToPage(i) }
                    }
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = { scope.launch { pager.animateScrollToPage(pager.currentPage + 1) } },
                        modifier = Modifier.fillMaxWidth().height(MainActionHeight),
                    ) { Text("Next card →") }
                }
            }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            if (overview) {
                LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    itemsIndexed(cards) { i, item ->
                        FlatCard(Modifier.clickable {
                            overview = false
                            scope.launch { pager.scrollToPage(i) }
                        }) {
                            Column(Modifier.padding(16.dp)) {
                                Text("${item.gsPaper} · ${item.topic}", style = MaterialTheme.typography.labelMedium)
                                Text(item.headline, style = MaterialTheme.typography.titleMedium)
                            }
                        }
                    }
                }
            } else Column(Modifier.fillMaxSize()) {
                if (recall != null && !recallGone && pager.currentPage == 0) {
                    RecallCard(recall, recallPicked, onWhy = onWhy?.let { { it(Guide.WHY_RECALL) } }) { i ->
                        if (recallPicked == null) {
                            recallPicked = i
                            onYesterday?.invoke(recall, i == recall.mcq.answerIndex)
                        }
                    }
                }
                HorizontalPager(state = pager, modifier = Modifier.weight(1f)) { page ->
                    if (page < cards.size) {
                        val item = cards[page]
                        ChaiCardPage(
                            item = item,
                            preferHindi = preferHindi,
                            showJoke = item.id in jokeIds,
                            chotu = chotu,
                            saved = item.id in day.savedCards,
                            date = brief.date,
                            library = library,
                            onOpenItem = onOpenItem,
                            onExamAnswer = onExamAnswer,
                            onWhy = onWhy?.let { { it(Guide.WHY_EXAM) } },
                            onToggleSave = {
                                day.savedCards = if (item.id in day.savedCards) day.savedCards - item.id else day.savedCards + item.id
                            },
                            caseFile = caseFile,
                        )
                    } else {
                        EndCard(archive, onClose)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ChaiCardPage(item: NewsItem, preferHindi: Boolean, showJoke: Boolean, chotu: Chotu?, saved: Boolean,
    date: String, library: ContentLibrary?, onOpenItem: ((String) -> Unit)?, onExamAnswer: ((String, Boolean) -> Unit)?, onWhy: (() -> Unit)?, onToggleSave: () -> Unit,
    caseFile: com.upscpods.app.data.CaseFile? = null) {
    var hindi by rememberSaveable(item.id) { mutableStateOf(preferHindi && item.hi != null) }
    val v = item.text(hindi)
    val l = v.labels
    var examOpen by rememberSaveable(item.id) { mutableStateOf(false) }
    var reported by rememberSaveable(item.id) { mutableStateOf(false) }
    var keeping by rememberSaveable(item.id) { mutableStateOf(false) }
    val uri = LocalUriHandler.current
    val tragic = item.tone == Tone.TRAGIC
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
            // Zone 1: lens chips (max 4) + tone tag
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                v.chips.forEach {
                    SuggestionChip(onClick = {}, label = { Text(it) })
                }
            }
            Text("Tone: ${item.tone.label}", style = MaterialTheme.typography.labelSmall)
            if (tragic) {
                Text(
                    l.heavy,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }

            // Zone 2: headline
            Text(
                v.headline,
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(top = 8.dp),
            )

            SvgImage(library, item.illustration, Modifier.padding(top = 8.dp))
            // "Watch: 1 minute" when an approved explainer covers this card's chips.
            val explainer = remember(item, library?.items) { library?.explainerFor(item) }
            if (explainer != null && onOpenItem != null) {
                OutlinedButton(onClick = { onOpenItem("explainer:" + explainer.id) }, modifier = Modifier.padding(top = 8.dp)) { Text(l.watch) }
            }

            // Zone 3: summary, glossary terms underlined. One language per card.
            Text(
                glossaryText(v.summary, v.glossary),
                style = if (l.hindi) ReadingHindi else ReadingText,
                modifier = Modifier.padding(top = 8.dp),
            )
            if (item.hi != null) {
                AssistChip(onClick = { hindi = !hindi }, label = { Text(l.switchTo) })
            }
            // The phone's own voice, on a tap. Tragic cards get no sound.
            if (!tragic) ReadAloudButton(listOf(v.headline, v.summary, l.why, v.whyForUpsc.joinToString("\n")).joinToString("\n"))
            // On-device only, and only when the model is downloaded. Tragic cards keep the editor's words.
            if (!tragic) ExplainSimpler(chotu, "${v.headline}. ${v.summary}", hindi = l.hindi)

            // Zone 4: why this matters
            Text(
                l.why,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 12.dp),
            )
            v.whyForUpsc.forEach { Text("• $it", style = MaterialTheme.typography.bodyLarge) }

            // Zone 5: exam corner, collapsed by default
            TextButton(onClick = { examOpen = !examOpen }) {
                Text(if (examOpen) l.hideExam else l.openExam)
            }
            AnimatedVisibility(visible = examOpen) { ExamCornerView(item.id, v, item.examCorner.pyq, onExamAnswer, onWhy) }

            // Chotu: LIGHT cards only, at most 1 in 5, decided by Brief.jokeCardIds()
            val joke = v.chotu
            if (showJoke && joke != null && item.tone == Tone.LIGHT) {
                HorizontalDivider(Modifier.padding(vertical = 8.dp))
                Text(Brand.MASCOT, style = MaterialTheme.typography.labelSmall)
                Text("“$joke”", fontStyle = FontStyle.Italic, style = MaterialTheme.typography.bodyLarge)
            }

            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onToggleSave) {
                    Text(if (saved) l.saved else l.save)
                }
                // Never for tragic cards or cards the editor marked not shareable.
                if (item.shareable && !tragic) {
                    TextButton(onClick = { scope.launch { shareCard(context, library, item, hindi, date) } }) { Text(l.share) }
                }
                if (caseFile != null && !tragic) {
                    TextButton(onClick = { keeping = !keeping }, enabled = !caseFile.has(item.id)) { Text(if (caseFile.has(item.id)) "✓ In your case file" else "Keep for Mains") }
                }
            }
            if (caseFile != null && !tragic && keeping && !caseFile.has(item.id)) KeepForm(item, v.headline, v.keyFacts.firstOrNull(), caseFile) { keeping = false }
            if (caseFile != null && item.highValue && !tragic && !caseFile.has(item.id)) {
                Text("This one is worth keeping for ${item.gsPaper.takeIf { Regex("GS[1-4]").matches(it) } ?: "Mains"}.", style = MaterialTheme.typography.bodySmall)
            }
        }

        // Zone 6: trust footer, always visible
        HorizontalDivider()
        Column(Modifier.padding(vertical = 8.dp)) {
            item.sources.forEach { s ->
                val linked = s.url.isNotBlank()
                Text(
                    "${l.source}: ${s.name}",
                    style = MaterialTheme.typography.labelMedium,
                    color = if (linked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = (if (linked) Modifier.clickable { uri.openUri(s.url) } else Modifier).padding(vertical = 4.dp),
                )
            }
            // English and Hindi have separate editors, so each language shows its own check.
            val checked = v.checkedBy?.let { l.checked(it, v.checkedOn ?: "") } ?: l.notChecked
            Text("${if (item.writtenBy != null) l.written else l.drafted} · $checked", style = MaterialTheme.typography.labelSmall)
            TextButton(onClick = { reported = true }, enabled = !reported) {
                Text(if (reported) l.reported else l.report)
            }
        }
    }
}

@Composable
private fun ExamCornerView(id: String, v: CardView, pyq: String?, onAnswer: ((String, Boolean) -> Unit)?, onWhy: (() -> Unit)?) {
    val l = v.labels
    var picked by rememberSaveable(id + "mcq" + l.hindi) { mutableStateOf<Int?>(null) }
    var sure by rememberSaveable(id + "sure") { mutableStateOf<Boolean?>(null) }
    val context = androidx.compose.ui.platform.LocalContext.current
    Column(Modifier.padding(bottom = 8.dp)) {
        v.mcq?.let { mcq ->
            Text(mcq.question, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
            if (sure == null) SureFirst(l.hindi) { sure = it } else mcq.options.forEachIndexed { i, opt ->
                FilterChip(
                    selected = picked == i,
                    onClick = {
                        // The first pick is the one that counts for recall.
                        if (picked == null) { Calibration.log(context, sure == true, i == mcq.answerIndex); onAnswer?.invoke(id, i == mcq.answerIndex) }
                        picked = i
                    },
                    label = { Text(opt) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            picked?.let {
                val right = it == mcq.answerIndex
                Text(
                    (if (right) l.right else l.wrong) + mcq.explanation,
                    style = MaterialTheme.typography.bodyMedium,
                )
                if (!right && sure == true) Text(sureWrongLine(l.hindi), style = MaterialTheme.typography.bodySmall)
            }
        }
        v.mainsPrompt?.let {
            Text("${l.mains}: $it", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
        }
        Text(l.keyFacts, style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(top = 8.dp))
        v.keyFacts.forEach { Text("• $it", style = MaterialTheme.typography.bodyMedium) }
        Text(
            pyq ?: l.noPyq,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(top = 8.dp),
        )
        if (!l.hindi) onWhy?.let { WhyLink(it) }
    }
}

/** One question from yesterday's pack. One tap answers it; it doesn't come back today. */
@Composable
private fun RecallCard(q: PracticeQuestion, picked: Int?, onWhy: (() -> Unit)?, onPick: (Int) -> Unit) {
    FlatCard(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Column(Modifier.padding(12.dp)) {
            Text("From yesterday · ${q.topic}", style = MaterialTheme.typography.labelMedium)
            Text(q.mcq.question, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
            if (picked == null) {
                q.mcq.options.forEachIndexed { i, opt ->
                    FilterChip(selected = false, onClick = { onPick(i) }, label = { Text(opt) }, modifier = Modifier.fillMaxWidth())
                }
            } else {
                val right = picked == q.mcq.answerIndex
                Text(
                    (if (right) "Yes. " else "It's ${q.mcq.options.getOrNull(q.mcq.answerIndex) ?: ""}. ") + q.mcq.explanation,
                    style = MaterialTheme.typography.bodyMedium,
                )
                onWhy?.let { WhyLink(it) }
            }
        }
    }
}

@Composable
private fun EndCard(archive: Boolean, onClose: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(if (archive) "That's the pack ☕" else "That's today's Chai ☕", style = MaterialTheme.typography.headlineSmall)
        if (!archive) { Spacer(Modifier.height(8.dp)); PauseLine("news-enough") }
        Spacer(Modifier.height(16.dp))
        OutlinedButton(onClick = onClose) { Text(if (archive) "Back" else "Back to Today") }
    }
}

@Composable
private fun ProgressDots(count: Int, current: Int, onTap: (Int) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
        repeat(count) { i ->
            // 48 dp touch target around a small dot
            Box(
                Modifier.size(48.dp).clickable { onTap(i) }.semantics { contentDescription = "Card ${i + 1} of $count" },
                contentAlignment = Alignment.Center,
            ) {
                Box(
                    Modifier.size(if (i == current) 12.dp else 8.dp).background(
                        if (i <= current) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                        CircleShape,
                    ),
                )
            }
        }
    }
}

/** Underlines glossary terms. TODO: dotted underline and a tap-to-define popup. */
private fun glossaryText(text: String, terms: List<String>): AnnotatedString = buildAnnotatedString {
    append(text)
    terms.forEach { term ->
        var start = text.indexOf(term, ignoreCase = true)
        while (start >= 0) {
            addStyle(SpanStyle(textDecoration = TextDecoration.Underline), start, start + term.length)
            start = text.indexOf(term, start + term.length, ignoreCase = true)
        }
    }
}

/** Keep for Mains: one example line in your words, under a paper and (if you like) a topic. The app suggests once. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun KeepForm(item: NewsItem, headline: String, fact: String?, caseFile: com.upscpods.app.data.CaseFile, onDone: () -> Unit) {
    var paper by rememberSaveable(item.id) { mutableStateOf(item.gsPaper.takeIf { it in com.upscpods.app.data.CASE_PAPERS } ?: "GS2") }
    var node by rememberSaveable(item.id) { mutableStateOf<String?>(null) }
    var line by rememberSaveable(item.id) { mutableStateOf(fact?.let { "$headline: $it" } ?: headline) }
    FlatCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Keep for Mains", style = MaterialTheme.typography.titleSmall)
            Text("One example line, in your words. You can change what's suggested.", style = MaterialTheme.typography.bodySmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                com.upscpods.app.data.CASE_PAPERS.forEach { p -> FilterChip(selected = p == paper, onClick = { paper = p; node = null }, label = { Text(p) }) }
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                caseFile.topicsOf(paper).forEach { (id, name) -> FilterChip(selected = node == id, onClick = { node = if (node == id) null else id }, label = { Text(name, maxLines = 1) }) }
            }
            OutlinedTextField(value = line, onValueChange = { line = it }, modifier = Modifier.fillMaxWidth())
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = { if (line.isNotBlank()) { caseFile.keep(item.id, paper, node, line.trim(), headline); onDone() } }) { Text("Keep it") }
                TextButton(onClick = onDone) { Text("Cancel") }
            }
        }
    }
}
