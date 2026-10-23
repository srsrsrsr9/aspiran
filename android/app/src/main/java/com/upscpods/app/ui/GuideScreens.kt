package com.upscpods.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Book
import com.upscpods.app.data.Guide
import com.upscpods.app.data.Quote
import com.upscpods.app.data.Thinker
import com.upscpods.app.data.Week

/** A small "Why this works" link that opens the thinker behind a feature (playbook A16). */
@Composable
fun WhyLink(onClick: () -> Unit, modifier: Modifier = Modifier) {
    TextButton(onClick = onClick, modifier = modifier) { Text("Why this works", style = MaterialTheme.typography.labelMedium) }
}

/** One quote, with author and source and a way to the book. Never on TRAGIC cards or in a distress flow. */
@Composable
fun QuoteLine(quote: Quote, hindi: Boolean, onReadMore: ((String) -> Unit)?, modifier: Modifier = Modifier) {
    Column(modifier.padding(vertical = 8.dp)) {
        Text("“${quote.text.pick(hindi)}”", style = MaterialTheme.typography.bodyLarge, fontStyle = FontStyle.Italic)
        Text(quote.credit + if (hindi && quote.text.hi != null) " · translated by our Hindi editor" else "", style = MaterialTheme.typography.labelSmall)
        val book = quote.readMore
        if (book != null && onReadMore != null) TextButton(onClick = { onReadMore(book) }) { Text("Read more") }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShouldersScreen(anchor: String?, onOpenBook: (String) -> Unit, onOpenShelf: () -> Unit, onClose: () -> Unit) {
    val start = Guide.thinkers.indexOfFirst { it.key == anchor }.coerceAtLeast(0)
    val list = rememberLazyListState(initialFirstVisibleItemIndex = if (anchor != null) start + 1 else 0)
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Standing on their shoulders") },
                navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } },
            )
        },
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp), state = list, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Column {
                    Text(
                        "The ideas behind the app, and the people they came from. They don't endorse us; we just learned from them.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    TextButton(onClick = onOpenShelf) { Text("Open the reading shelf") }
                }
            }
            items(Guide.thinkers, key = { it.key }) { t -> ThinkerEntry(t, highlighted = t.key == anchor, onOpenBook) }
        }
    }
}

@Composable
private fun ThinkerEntry(t: Thinker, highlighted: Boolean, onOpenBook: (String) -> Unit) {
    FlatCard {
        Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            // Initials until our own illustrated portraits are drawn. Never web photos.
            Box(
                Modifier.size(44.dp).background(
                    if (highlighted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.primaryContainer,
                    CircleShape,
                ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    t.initials,
                    color = if (highlighted) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onPrimaryContainer,
                    style = MaterialTheme.typography.labelLarge,
                )
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(t.name, style = MaterialTheme.typography.titleMedium)
                Text(t.idea, style = MaterialTheme.typography.bodyMedium)
                Text("In the app: ${t.shaped}", style = MaterialTheme.typography.bodySmall)
                t.books.mapNotNull { Guide.book(it) }.forEach { b ->
                    TextButton(onClick = { onOpenBook(b.id) }) { Text("Read: ${b.title}") }
                }
            }
        }
    }
}

/** The reading shelf (playbook A18). Free routes first; no affiliate links. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShelfScreen(focus: String?, onClose: () -> Unit) {
    val start = Guide.shelf.indexOfFirst { it.id == focus }.coerceAtLeast(0)
    val list = rememberLazyListState(initialFirstVisibleItemIndex = if (focus != null) start + 1 else 0)
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Reading shelf") },
                navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } },
            )
        },
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp), state = list, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Text(
                    "Books that shaped this app. None of them is a shortcut to selection. Free routes first, and we earn nothing from any link.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            items(Guide.shelf, key = { it.id }) { b -> BookEntry(b, b.id == focus) }
        }
    }
}

@Composable
private fun BookEntry(b: Book, highlighted: Boolean) {
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(b.title, style = MaterialTheme.typography.titleMedium, fontWeight = if (highlighted) FontWeight.Bold else null)
            Text(b.author, style = MaterialTheme.typography.labelMedium)
            Text(b.why, style = MaterialTheme.typography.bodyMedium)
            Text("Start with: ${b.startWith}", style = MaterialTheme.typography.bodySmall)
            Text(b.freeRoute, style = MaterialTheme.typography.bodySmall)
            b.hindi?.let { Text("Hindi: $it", style = MaterialTheme.typography.bodySmall) }
        }
    }
}

/**
 * Monday WOOP (playbook A4): wish, best outcome, main obstacle, if-then plan. Private.
 * Only the wish can be shared with the pod, and only if they tick it. Skipping is silent.
 */
@Composable
fun WoopCard(quote: Quote?, hindi: Boolean, canShare: Boolean, onSave: (Week.Woop, Boolean) -> Unit, onSkip: () -> Unit, onReadMore: (String) -> Unit) {
    var wish by rememberSaveable { mutableStateOf("") }
    var outcome by rememberSaveable { mutableStateOf("") }
    var obstacle by rememberSaveable { mutableStateOf("") }
    var plan by rememberSaveable { mutableStateOf("") }
    var share by rememberSaveable { mutableStateOf(false) }
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("A fresh week", style = MaterialTheme.typography.titleLarge)
            Text("Four short lines, just for you. About a minute.", style = MaterialTheme.typography.bodySmall)
            WoopField("Wish for this week", wish, "Finish the Polity revision") { wish = it }
            WoopField("Best outcome", outcome, "Walking into the weekend calm about Polity") { outcome = it }
            WoopField("Main obstacle", obstacle, "My phone after 10 pm") { obstacle = it }
            WoopField("If that happens, I'll…", plan, "put the phone in the other room") { plan = it }
            if (canShare) Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = share, onCheckedChange = { share = it })
                Text("Share only my wish with my pod", style = MaterialTheme.typography.bodyMedium)
            }
            quote?.let { QuoteLine(it, hindi, onReadMore) }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedButton(
                    onClick = { onSave(Week.Woop(wish.trim(), outcome.trim(), obstacle.trim(), plan.trim()), share && wish.isNotBlank()) },
                    enabled = wish.isNotBlank(),
                ) { Text("Save my week") }
                TextButton(onClick = onSkip) { Text("Not this week") }
            }
        }
    }
}

@Composable
private fun WoopField(label: String, value: String, hint: String, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = { onChange(it.take(120)) },
        label = { Text(label) },
        placeholder = { Text(hint) },
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
    )
}

/** This week's WOOP, shown back quietly on Today. */
@Composable
fun WoopLine(w: Week.Woop) {
    val ifThen = if (w.obstacle.isNotBlank() && w.plan.isNotBlank()) " If ${w.obstacle.lowercase()}, ${w.plan}." else ""
    Text("This week: ${w.wish}.$ifThen", style = MaterialTheme.typography.bodyMedium)
}

/**
 * The planning mirror (playbook A3): calibration, never a grade. No red, nobody else sees it.
 * One tap to size the week to what usually happens, or to leave it.
 */
@Composable
fun PlanningMirror(tenths: Int, target: Int, onSize: (Int) -> Unit, onLeave: () -> Unit) {
    val sized = Week.sized(target, tenths)
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            "You usually finish about $tenths of every 10 planned minutes. Most plans start from the best day, not the usual one.",
            style = MaterialTheme.typography.bodyMedium,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (sized < target) OutlinedButton(onClick = { onSize(sized) }) { Text("Aim for $sized days") }
            TextButton(onClick = onLeave) { Text(if (sized < target) "Keep $target" else "Got it") }
        }
    }
}

/** Natural frequencies (playbook A10). Marked as a draft until checked against upsc.gov.in. */
@Composable
fun HonestNumbers() {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Honest numbers", style = MaterialTheme.typography.titleMedium)
        Text(Guide.NUMBERS_LINE, style = MaterialTheme.typography.bodyMedium)
        Text("That's about the exam, not about your worth.", style = MaterialTheme.typography.bodySmall)
        if (!Guide.NUMBERS_CHECKED) Text("Draft figure: still being checked against upsc.gov.in.", style = MaterialTheme.typography.labelSmall)
    }
}

/**
 * Another attempt or a Plan B, shown both ways with the same weight (playbook A10).
 * It never recommends either. The sunk-cost line is there because past years pull hard.
 */
@Composable
fun PlanBBothWays() {
    var open by rememberSaveable { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Thinking about another attempt?", style = MaterialTheme.typography.titleMedium)
        if (!open) {
            TextButton(onClick = { open = true }) { Text("See both sides") }
            return@Column
        }
        Text("The years you've already put in count either way. This choice is only about the next one.", style = MaterialTheme.typography.bodyMedium)
        Side(
            "Another year",
            gives = listOf("Another real shot, with a year of practice behind you", "Your notes, pod and habits carry over"),
            costs = listOf("A year of time, money and sometimes family patience", "Another year of waiting for results"),
        )
        Side(
            "A Plan B",
            gives = listOf("Income and a fresh start sooner", "The skills from prep (writing, current affairs, ethics) travel with you"),
            costs = listOf("Letting go of this exam, for now or for good", "Starting somewhere new, which is hard in its own way"),
        )
        Text("Some people do both: a job and a lighter attempt. There's no right answer here, only yours.", style = MaterialTheme.typography.bodySmall)
        TextButton(onClick = { open = false }) { Text("Close") }
    }
}

@Composable
private fun Side(title: String, gives: List<String>, costs: List<String>) {
    FlatCard {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text("What it gives", style = MaterialTheme.typography.labelMedium)
            gives.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
            Text("What it costs", style = MaterialTheme.typography.labelMedium)
            costs.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
        }
    }
}

/**
 * "Know the paper, know yourself" (playbook A14). Topics missed lately, as a suggestion for
 * where an hour pays most. Private; it suggests, it never assigns.
 */
@Composable
fun KnowThePaper(weak: List<Pair<String, Int>>, quote: Quote?, hindi: Boolean, onReadMore: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Know the paper, know yourself", style = MaterialTheme.typography.titleMedium)
        if (weak.isEmpty()) {
            Text("Answer a few Prelims questions and Exam Corners, and this shows where an hour pays most.", style = MaterialTheme.typography.bodySmall)
        } else {
            Text("Where an hour might pay most this week:", style = MaterialTheme.typography.bodyMedium)
            weak.forEach { (topic, n) -> Text("• $topic · missed $n lately", style = MaterialTheme.typography.bodyMedium) }
            Text("Only a suggestion, from your own answers on this phone.", style = MaterialTheme.typography.labelSmall)
        }
        quote?.let { QuoteLine(it, hindi, onReadMore) }
    }
}

/** My Path's Honest Guide: the shelf and the people behind the app. */
@Composable
fun HonestGuideLinks(onOpenShelf: () -> Unit, onOpenShoulders: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Honest Guide", style = MaterialTheme.typography.titleMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onOpenShelf) { Text("Reading shelf") }
            OutlinedButton(onClick = onOpenShoulders) { Text("Why this works") }
        }
    }
}
