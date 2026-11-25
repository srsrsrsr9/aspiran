@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.upscpods.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import com.upscpods.app.data.Journey
import com.upscpods.app.data.Memory
import com.upscpods.app.data.NextUp
import com.upscpods.app.data.Nudge
import com.upscpods.app.data.Starter
import kotlinx.coroutines.delay

/**
 * The top of the Adda: one thing to do next, said plainly, with one filled button. In the first week it walks the
 * [Starter] steps; after that it's the daily loop (cards that came back, the Chai, practice). [dayLabel] is "Day 3 of
 * your first week", or null after it.
 */
@Composable
fun NextUpCard(next: NextUp, dayLabel: String?, hindi: Boolean, onGo: () -> Unit, onSkip: (() -> Unit)?, onNeedToTalk: (() -> Unit)? = null) {
    val c = MaterialTheme.colorScheme
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = c.primaryContainer,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Box(Modifier.background(Brush.verticalGradient(listOf(c.primaryContainer, c.surfaceContainerLow)))) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            (dayLabel ?: if (hindi) "आगे क्या" else "Next up").uppercase(),
                            style = MaterialTheme.typography.labelMedium, color = c.primary, fontWeight = FontWeight.Bold,
                        )
                        Text(next.title, style = MaterialTheme.typography.headlineSmall, color = c.onPrimaryContainer)
                    }
                    Kulhad(if (next.cta == null) ChotuMood.SLEEPY else ChotuMood.HAPPY, 56.dp)
                }
                Text(next.line, style = ReadingText, color = c.onPrimaryContainer)
                next.cta?.let { cta ->
                    Button(onClick = onGo, modifier = Modifier.fillMaxWidth().height(MainActionHeight)) {
                        Text(cta + (next.step?.let { "  ·  ${it.minutes} ${if (hindi) "मिनट" else "min"}" } ?: ""), fontWeight = FontWeight.Bold)
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    onSkip?.let { TextButton(onClick = it) { Text(if (hindi) "इसे छोड़ें" else "Skip this one") } }
                    Spacer(Modifier.weight(1f))
                    onNeedToTalk?.let { TextButton(onClick = it) { Text(if (hindi) "किसी से बात करनी है?" else "Need to talk?") } }
                }
            }
        }
    }
}

/** The first week's steps as a short path: a tick for each one done. Not a streak: nothing is lost on a missed day. */
@Composable
fun FirstWeekPath(done: Set<Starter>, skipped: Set<Starter>, current: Starter?, hindi: Boolean, onOpen: (Starter) -> Unit) {
    val n = done.size
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (hindi) "आपका पहला हफ़्ता" else "Your first week", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                Text(if (hindi) "${Starter.entries.size} में से $n" else "$n of ${Starter.entries.size}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            // A bar of eight short segments, one per step.
            Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Starter.entries.forEach { s ->
                    Box(Modifier.weight(1f).height(6.dp).background(
                        when (s) {
                            in done -> MaterialTheme.colorScheme.primary
                            current -> MaterialTheme.colorScheme.primary.copy(alpha = 0.35f)
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        }, RoundedCornerShape(3.dp)))
                }
            }
            Starter.entries.forEach { s ->
                val isDone = s in done
                val isSkipped = s in skipped && !isDone
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 44.dp).clickable(enabled = !isDone, onClickLabel = s.label(hindi)) { onOpen(s) },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Box(
                        Modifier.size(24.dp).background(if (isDone) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(if (isDone) "✓" else "${s.ordinal + 1}", style = MaterialTheme.typography.labelMedium,
                            color = if (isDone) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text(
                        s.label(hindi), Modifier.weight(1f),
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = if (s == current) FontWeight.Bold else FontWeight.Normal,
                        color = if (isDone || isSkipped) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
                    )
                    Text(if (isDone) "" else "${s.minutes} ${if (hindi) "मि." else "min"}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

/** What the app remembers you've built, in four tiles. Only yours, never compared with anyone. */
@Composable
fun MemoryTiles(mem: Memory, hindi: Boolean) {
    if (mem.questions == 0 && mem.inReview == 0 && mem.topicsMet == 0 && mem.answers == 0) return
    val tiles = listOf(
        mem.questions to (if (hindi) "सवाल हल किए" else "questions answered"),
        mem.inReview to (if (hindi) "कार्ड याद में" else "cards on repeat"),
        mem.topicsMet to (if (hindi) "टॉपिक शुरू" else "topics met"),
        mem.answers to (if (hindi) "उत्तर लिखे" else "answers written"),
    )
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(if (hindi) "अब तक आपने बनाया" else "What you've built so far", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            tiles.forEach { (n, label) ->
                Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.surfaceContainerLow, modifier = Modifier.weight(1f)
                    .semantics { contentDescription = "$n $label" }) {
                    Column(Modifier.padding(horizontal = 8.dp, vertical = 12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("$n", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary)
                        Text(label, style = MaterialTheme.typography.labelSmall, textAlign = TextAlign.Center, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        if (mem.dueToday > 0 && !mem.reviewedToday) Text(
            if (hindi) "${mem.dueToday} कार्ड आज लौटे हैं।" else "${mem.dueToday} of them came back today.",
            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

/**
 * The moment a first-week step is done: a tick, and the next step one tap away. It goes by itself after a few seconds
 * and never covers the screen. Nothing moves; it just appears (reduced motion is the default here).
 */
@Composable
fun StepDoneBar(journey: Journey, next: NextUp?, hindi: Boolean, onGo: () -> Unit, modifier: Modifier = Modifier) {
    val step = journey.justDone ?: return
    LaunchedEffect(step) { delay(7_000); journey.justDone = null }
    val n = journey.done().size
    Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.inverseSurface, modifier = modifier.padding(horizontal = 16.dp).fillMaxWidth()) {
        Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("✓ " + step.label(hindi), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.inverseOnSurface)
                Text(
                    (if (hindi) "पहले हफ़्ते के ${Starter.entries.size} में से $n" else "$n of ${Starter.entries.size} for your first week") +
                        (next?.step?.takeIf { it != step && next.cta != null }?.let { if (hindi) " · आगे: ${it.hi}" else " · Next: ${it.en.lowercase()}" } ?: ""),
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.inverseOnSurface,
                )
            }
            if (next?.step != null && next.step != step && next.cta != null) TextButton(onClick = { journey.justDone = null; onGo() }) {
                Text(if (hindi) "चलें" else "Go", color = MaterialTheme.colorScheme.inversePrimary, fontWeight = FontWeight.Bold)
            }
        }
    }
}

/** The nudge step: one time for the morning nudge, asked when there's something real to bring back. */
@Composable
fun NudgeStepSheet(inReview: Int, hindi: Boolean, onDone: (String?) -> Unit) {
    val context = LocalContext.current
    var time by rememberSaveable { mutableStateOf(Nudge.time(context) ?: Nudge.TIMES[1]) }
    androidx.compose.material3.AlertDialog(
        onDismissRequest = { onDone(Nudge.time(context)) },
        title = { Text(if (hindi) "कार्ड कब लौटें?" else "When should your cards come back?") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    if (hindi) "सुबह एक बार, बस “चाय तैयार है” और उस दिन लौटे कार्ड। रात 10:30 के बाद कभी नहीं। Me में कभी भी बंद करें।"
                    else "Once in the morning: “Chai's ready”, and the cards due that day${if (inReview > 0) " (you have $inReview on repeat)" else ""}. Never after 10:30 pm. Switch it off any time in Me.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                ChaiTimePicker(time) { time = it ?: "" }
            }
        },
        confirmButton = { Button(onClick = { onDone(time.ifBlank { null }) }) { Text(if (hindi) "ठीक है" else "Done") } },
    )
}

/**
 * Right after the welcome, once: not a tour of the tabs, but the product itself. One button opens today's Chai; the
 * Adda then carries on with the next step. "Look around first" is always fine.
 */
@Composable
fun FirstFiveMinutes(name: String?, hindi: Boolean, cards: Int, onStart: () -> Unit, onLater: () -> Unit) {
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            Modifier.fillMaxSize().safeDrawingPadding().verticalScroll(rememberScrollState()).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(24.dp))
            Kulhad(ChotuMood.HAPPY, 120.dp)
            Text(
                (name?.takeIf { it.isNotBlank() }?.let { if (hindi) "$it, आपका स्वागत है।" else "Welcome, $it." } ?: if (hindi) "आपका स्वागत है।" else "Welcome in."),
                style = MaterialTheme.typography.headlineMedium, textAlign = TextAlign.Center,
            )
            Text(
                if (hindi) "चलिए पहले पाँच मिनट साथ करें। आज की ${cards.coerceAtLeast(1)} छोटी खबरें, हर एक के बाद एक सवाल। जो आप जवाब देंगे, वह ठीक भूलने से पहले लौटेगा।"
                else "Let's do your first five minutes together. Today's ${cards.coerceAtLeast(1)} short news cards, one question after each. Whatever you answer comes back just before you'd forget it.",
                style = ReadingText, textAlign = TextAlign.Center,
            )
            FlatCard {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf(
                        (if (hindi) "आज की चाय" else "Today's Chai") to (if (hindi) "3 मिनट" else "3 min"),
                        (if (hindi) "कार्ड कब लौटें, यह चुनें" else "Pick when cards come back") to (if (hindi) "1 मिनट" else "1 min"),
                        (if (hindi) "अपने पॉड से मिलें" else "Meet your pod") to (if (hindi) "1 मिनट" else "1 min"),
                    ).forEachIndexed { i, (what, mins) ->
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Box(Modifier.size(28.dp).background(MaterialTheme.colorScheme.primaryContainer, CircleShape), contentAlignment = Alignment.Center) {
                                Text("${i + 1}", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                            }
                            Text(what, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                            Text(mins, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
            Button(onClick = onStart, modifier = Modifier.fillMaxWidth().height(MainActionHeight)) {
                Text(if (hindi) "आज की चाय से शुरू करें" else "Start with today's Chai", fontWeight = FontWeight.Bold)
            }
            TextButton(onClick = onLater) { Text(if (hindi) "पहले थोड़ा घूम लूँ" else "Let me look around first") }
            Text(
                if (hindi) "मुफ़्त, और हमेशा मुफ़्त रहेगा। कोई टाइमर नहीं, कोई स्ट्रीक नहीं।" else "Free, and it stays free. No timers, no streaks.",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * The first week, in the person's own numbers, and then (only for free members, never in quiet times) what Plus
 * would add to a week like this one. The close: their work first, one plain button, and "Keep going free" with the
 * same weight. No price here; the Plus page shows it.
 */
@Composable
fun FirstWeekScreen(mem: Memory, chaiDays: Int, hindi: Boolean, showPlus: Boolean, onSeePlus: () -> Unit, onClose: () -> Unit) {
    fun t(en: String, hi: String) = if (hindi) hi else en
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            Modifier.fillMaxSize().safeDrawingPadding().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(t("Your first week", "आपका पहला हफ़्ता"), style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
                TextButton(onClick = onClose) { Text(t("Close", "बंद करें")) }
            }
            ChotuSays(
                if (mem.questions + mem.answers + chaiDays == 0) t("A quiet week, and that's allowed. Next week starts fresh, from wherever you are.", "एक शांत हफ़्ता, और इसमें कोई बुराई नहीं। अगला हफ़्ता नए सिरे से, जहाँ आप हैं वहीं से।")
                else t("Here's what you built. All of it is still here, timed to come back.", "यह रहा जो आपने बनाया। सब कुछ यहीं है, सही समय पर लौटने के लिए।"),
                ChotuMood.PROUD,
            )
            val rows = buildList {
                if (chaiDays > 0) add(t("Days you read the Chai", "जिन दिनों चाय पढ़ी") to "$chaiDays")
                if (mem.questions > 0) add(t("Questions answered", "सवाल हल किए") to (if (mem.questions > 0) "${mem.questions} (${mem.right} ${t("right", "सही")})" else "0"))
                if (mem.inReview > 0) add(t("Cards on repeat, coming back on time", "दोहराव में कार्ड, सही समय पर लौटते") to "${mem.inReview}")
                if (mem.topicsMet > 0) add(t("Syllabus topics met", "सिलेबस के टॉपिक शुरू") to "${mem.topicsMet}")
                if (mem.answers > 0) add(t("Mains answers written", "मेन्स उत्तर लिखे") to "${mem.answers}")
                if (mem.mocks > 0) add(t("Mock papers tried", "मॉक पेपर दिए") to "${mem.mocks}")
                if (mem.misses > 0) add(t("Misses saved to revise", "दोहराने के लिए सहेजी गलतियाँ") to "${mem.misses}")
            }
            if (rows.isNotEmpty()) FlatCard {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    rows.forEach { (k, v) ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(k, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                            Text(v, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
            Text(t("Only you see this. It's you against last week's you, nobody else.", "यह सिर्फ़ आप देखते हैं। मुकाबला पिछले हफ़्ते के आपसे है, किसी और से नहीं।"),
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (showPlus) {
                // What Plus adds, said in terms of this person's own week.
                val adds = buildList {
                    if (mem.misses > 0) add(t("Your ${mem.misses} misses turned into a revision set, and a weekly test from your own Chai", "आपकी ${mem.misses} गलतियाँ एक दोहराव सेट में, और आपकी अपनी चाय से साप्ताहिक टेस्ट"))
                    else add(t("A weekly test made from the Chai you read, and a revision set of everything you miss", "आपकी पढ़ी चाय से बना साप्ताहिक टेस्ट, और हर गलती का दोहराव सेट"))
                    add(if (mem.mocks > 0) t("Every full mock paper, not one a month, with a report on your weak topics", "हर पूरा मॉक पेपर, महीने में एक नहीं, कमज़ोर टॉपिक की रिपोर्ट के साथ")
                        else t("Every full mock paper, with a report on your weak topics", "हर पूरा मॉक पेपर, कमज़ोर टॉपिक की रिपोर्ट के साथ"))
                    add(t("${Brand.MASCOT_SHORT} on your phone any day, and a plan for your week from Jeetu", "हर दिन फ़ोन पर ${Brand.MASCOT_SHORT}, और Jeetu से आपके हफ़्ते का प्लान"))
                }
                Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(t("A week like yours, with Plus", "आपके जैसा हफ़्ता, Plus के साथ"), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onPrimaryContainer)
                        adds.forEach { Text("•  $it", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimaryContainer) }
                        Text(t("Everything free stays free. Always.", "जो मुफ़्त है, वह हमेशा मुफ़्त रहेगा।"), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onClose, modifier = Modifier.weight(1f).height(MainActionHeight)) { Text(t("Keep going free", "मुफ़्त में जारी रखें")) }
                    Button(onClick = onSeePlus, modifier = Modifier.weight(1f).height(MainActionHeight)) { Text(t("See Plus", "Plus देखें")) }
                }
            } else Button(onClick = onClose, modifier = Modifier.fillMaxWidth().height(MainActionHeight)) { Text(t("On to week two", "दूसरे हफ़्ते की ओर")) }
        }
    }
}
