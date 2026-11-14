@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.upscpods.app.ui

import android.content.ClipData
import android.content.ClipboardManager
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.produceState
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Bi
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.EngineItem
import com.upscpods.app.data.Play
import com.upscpods.app.data.at
import kotlinx.coroutines.launch
import kotlin.random.Random

/** Names for the engine types on the Practice tab. Unknown future types get a tidied key. */
private val ENGINE_TYPE_NAMES: Map<String, Pair<String, String>> = mapOf(
    "trap-spotter" to ("Trap spotter" to "जाल पकड़िए"),
    "better-answer" to ("Better answer" to "बेहतर उत्तर"),
    "odd-one-out" to ("Odd one out" to "अलग कौन"),
    "two-truths" to ("Two truths and a lie" to "दो सच, एक झूठ"),
    "who-am-i" to ("Who am I?" to "मैं कौन हूँ?"),
    "assertion-reason" to ("Assertion and reason" to "कथन और कारण"),
    "how-many-correct" to ("How many are correct?" to "कितने सही?"),
    "bucket-sort" to ("Sort into buckets" to "छाँटिए"),
    "union-state-list" to ("Union, State or Concurrent" to "संघ, राज्य या समवर्ती"),
    "fact-or-opinion" to ("Fact or opinion" to "तथ्य या राय"),
    "rank-it" to ("Rank it" to "क्रम लगाइए"),
    "timeline-shuffle" to ("Timeline shuffle" to "समय का क्रम"),
    "pair-up" to ("Pair up" to "जोड़ी बनाइए"),
    "committee-match" to ("Committee match" to "समिति मिलाइए"),
    "flashcards" to ("Flashcards" to "फ़्लैशकार्ड"),
    "mnemonic" to ("Mnemonic" to "याद रखने की तरकीब"),
    "acronym-unpack" to ("Acronym unpacked" to "संक्षिप्त नाम खोलिए"),
    "landmark-case" to ("Landmark case" to "ऐतिहासिक मुक़दमा"),
    "scheme-snapshot" to ("Scheme snapshot" to "योजना एक नज़र में"),
    "index-card" to ("Index card" to "सूचकांक कार्ड"),
    "word-bank" to ("Word bank" to "शब्द भंडार"),
    "directive-word" to ("Directive words" to "निर्देशक शब्द"),
    "two-levels" to ("Two levels" to "दो स्तर"),
    "story-beats" to ("Story beats" to "कहानी के पड़ाव"),
    "ethics-dilemma" to ("Ethics dilemma" to "नैतिक दुविधा"),
    "answer-skeleton" to ("Answer skeleton" to "उत्तर का ढाँचा"),
    "versus" to ("Versus" to "आमने-सामने"),
    "before-after" to ("Before and after" to "पहले और बाद"),
    "link-web" to ("Link web" to "जुड़ाव का जाल"),
    "fill-the-gap" to ("Fill the gap" to "ख़ाली जगह भरिए"),
    "hidden-why" to ("The Hidden Why" to "छिपा हुआ क्यों"),
)

fun engineTypeName(kind: String, hindi: Boolean): String? = ENGINE_TYPE_NAMES[kind]?.let { if (hindi) it.second else it.first }
    ?: if ('-' in kind) kind.replace('-', ' ').replaceFirstChar { it.uppercase() } else null

private val Right = Color(0xFF2E7D32)
private val Soft = Color(0xFFB26A00)

@Composable
fun EnginePlayer(item: EngineItem, hindi: Boolean, library: ContentLibrary) {
    val sfx = rememberSfx(library, item.sounds, item.tone)
    val still = reducedMotion(LocalContext.current)
    Text(item.title.pick(hindi), style = MaterialTheme.typography.headlineSmall)
    SoundToggle(sfx, hindi)
    val p = item.play
    when (p.engine) {
        "choose" -> ChooseEngine(p, hindi, sfx)
        "sort" -> SortEngine(p, hindi, sfx)
        "order" -> OrderEngine(p, hindi, sfx, still)
        "match" -> MatchEngine(p, hindi, sfx, still)
        "reveal" -> RevealEngine(p, hindi, sfx, still)
        "steps" -> StepsEngine(p, hindi, sfx)
        "compare" -> CompareEngine(p, hindi)
        "hub" -> HubEngine(p, hindi, sfx)
        "cloze" -> ClozeEngine(p, hindi, sfx, still)
        "picture" -> HiddenWhyEngine(p, hindi, sfx, still, library)
        else -> Text(if (hindi) "यह आइटम खुल नहीं सका। ऐप अपडेट करके देखें।" else "This item couldn't be opened. A newer app may be needed.")
    }
    item.sourceLine(hindi)?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.labelSmall) }
}

@Composable
private fun Done(hindi: Boolean, onAgain: () -> Unit) {
    Text(if (hindi) "पूरा हुआ ✓" else "That's the set ✓", style = MaterialTheme.typography.titleMedium)
    TextButton(onClick = onAgain) { Text(if (hindi) "फिर से" else "Again") }
}

@Composable
private fun Why(text: Bi<String>?, hindi: Boolean) {
    text?.pick(hindi)?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
}

@Composable
private fun Chip(text: String, fill: Color, modifier: Modifier = Modifier) {
    Text(text, modifier = modifier.background(fill, RoundedCornerShape(8.dp)).padding(horizontal = 10.dp, vertical = 6.dp))
}

/** A stable shuffle for an item, never the right order itself. */
private fun shuffled(n: Int, seed: String): List<Int> {
    val order = (0 until n).toList()
    return order.shuffled(Random(seed.hashCode())).let { if (it == order && n > 1) it.reversed() else it }
}

// --- Choose: trap spotter, odd one out, two truths, who am I, assertion and reason... ----------

@Composable
private fun ChooseEngine(p: Play, hindi: Boolean, sfx: Sfx) {
    var round by rememberSaveable { mutableIntStateOf(0) }
    var picked by rememberSaveable(round) { mutableIntStateOf(-1) }
    var clues by rememberSaveable(round) { mutableIntStateOf(1) }
    if (round >= p.rounds.size) return Done(hindi) { round = 0 }
    val r = p.rounds[round]
    Text("${round + 1} / ${p.rounds.size}", style = MaterialTheme.typography.labelMedium)
    Text(r.prompt.pick(hindi), style = MaterialTheme.typography.titleMedium)
    r.clues?.let { c ->
        val shown = if (picked >= 0) c.en.size else clues
        for (i in 0 until shown.coerceAtMost(c.en.size)) Text("${i + 1}. ${c.at(i, hindi)}")
        if (picked < 0 && clues < c.en.size) TextButton(onClick = { clues++; sfx.playAny("clue", "pick") }) {
            Text(if (hindi) "एक और सुराग" else "Another clue")
        }
    }
    r.options.en.indices.forEach { i ->
        val answered = picked >= 0
        val color = when {
            !answered -> Color.Unspecified
            i == r.answer -> Right
            i == picked -> Soft
            else -> MaterialTheme.colorScheme.outline
        }
        OutlinedButton(
            modifier = Modifier.fillMaxWidth(),
            border = BorderStroke(if (answered && (i == r.answer || i == picked)) 2.dp else 1.dp, if (color == Color.Unspecified) MaterialTheme.colorScheme.outline else color),
            onClick = {
                if (answered) return@OutlinedButton
                picked = i
                sfx.playAny(if (i == r.answer) "right" else "wrong")
            },
        ) {
            Column(Modifier.fillMaxWidth()) {
                Text(r.options.at(i, hindi), color = if (color == Color.Unspecified) Color.Unspecified else color, textAlign = TextAlign.Start)
                if (answered) r.tags.getOrNull(i)?.let { Text(it.pick(hindi), style = MaterialTheme.typography.labelSmall, color = color) }
            }
        }
    }
    if (picked >= 0) {
        // A wrong pick gets a soft word and the reason, never a buzzer.
        Text(if (picked == r.answer) (if (hindi) "सही ✓" else "Right ✓") else (if (hindi) "लगभग। सही उत्तर हरे रंग में है।" else "Not quite. The right one is in green."),
            fontWeight = FontWeight.Bold, color = if (picked == r.answer) Right else Soft)
        Why(r.why, hindi)
        Button(onClick = { round++ }) { Text(if (round + 1 < p.rounds.size) (if (hindi) "अगला" else "Next") else (if (hindi) "पूरा करें" else "Finish")) }
    }
}

// --- Sort into buckets ---------------------------------------------------------------------------

@Composable
private fun SortEngine(p: Play, hindi: Boolean, sfx: Sfx) {
    val buckets = p.buckets ?: return
    val order = remember(p) { shuffled(p.items.size, p.items.joinToString { it.text?.en ?: "" }) }
    var at by rememberSaveable { mutableIntStateOf(0) }
    var tried by rememberSaveable(at) { mutableIntStateOf(-1) }
    if (at >= order.size) {
        buckets.en.indices.forEach { b ->
            Text(buckets.at(b, hindi), style = MaterialTheme.typography.titleMedium)
            p.items.filter { it.bucket == b }.forEach { Text("• " + (it.text?.pick(hindi) ?: "")) }
        }
        return Done(hindi) { at = 0 }
    }
    val item = p.items[order[at]]
    Text("${at + 1} / ${order.size}", style = MaterialTheme.typography.labelMedium)
    Box(Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.secondaryContainer, RoundedCornerShape(12.dp)).padding(16.dp)) {
        Text(item.text?.pick(hindi) ?: "", style = MaterialTheme.typography.titleMedium)
    }
    Text(if (hindi) "यह किसमें जाएगा?" else "Where does it go?", style = MaterialTheme.typography.labelLarge)
    buckets.en.indices.forEach { b ->
        val color = when {
            tried < 0 -> Color.Unspecified
            b == item.bucket -> Right
            b == tried -> Soft
            else -> MaterialTheme.colorScheme.outline
        }
        OutlinedButton(modifier = Modifier.fillMaxWidth(), onClick = {
            if (tried >= 0) return@OutlinedButton
            tried = b
            sfx.playAny(if (b == item.bucket) "land" else "wrong")
        }) { Text(buckets.at(b, hindi), color = color) }
    }
    if (tried >= 0) {
        if (tried != item.bucket) Text((if (hindi) "यह जाता है: " else "It goes in: ") + buckets.at(item.bucket, hindi), color = Soft, fontWeight = FontWeight.Bold)
        Why(item.why, hindi)
        Button(onClick = { at++ }) { Text(if (hindi) "अगला" else "Next") }
    }
}

// --- Put in order: rank it, timeline shuffle -----------------------------------------------------

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun OrderEngine(p: Play, hindi: Boolean, sfx: Sfx, still: Boolean) {
    val scope = rememberCoroutineScope()
    val tray = remember(p) { shuffled(p.items.size, p.items.joinToString { it.label?.en ?: "" }) }
    var placed by rememberSaveable { mutableIntStateOf(0) }
    var wrong by remember { mutableIntStateOf(-1) }
    val wobble = remember { Animatable(0f) }
    p.prompt?.let { Text(it.pick(hindi)) }
    p.items.forEachIndexed { i, it ->
        if (i < placed) Row(verticalAlignment = Alignment.CenterVertically) {
            Text("${i + 1}. ", fontWeight = FontWeight.Bold)
            Text(it.label?.pick(hindi) ?: "", modifier = Modifier.weight(1f))
            Text(it.value?.pick(hindi) ?: "", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
        }
    }
    if (placed < p.items.size) {
        Text(if (hindi) "अगला कौन-सा है?" else "Which comes next?", style = MaterialTheme.typography.labelLarge)
        tray.filter { it >= placed }.forEach { idx ->
            OutlinedButton(
                modifier = Modifier.fillMaxWidth().graphicsLayer { if (idx == wrong) translationX = wobble.value },
                onClick = {
                    if (idx == placed) {
                        wrong = -1
                        placed++
                        sfx.playAny(if (placed == p.items.size) "done" else "snap")
                    } else {
                        wrong = idx
                        sfx.playAny("wrong")
                        if (!still) scope.launch { for (x in listOf(12f, -10f, 7f, -4f, 0f)) wobble.animateTo(x, tween(45)) }
                    }
                },
            ) { Text(p.items[idx].label?.pick(hindi) ?: "", textAlign = TextAlign.Start, modifier = Modifier.fillMaxWidth()) }
        }
    } else {
        p.takeaway?.let { Text(it.pick(hindi), style = MaterialTheme.typography.bodyLarge) }
        Done(hindi) { placed = 0 }
    }
}

// --- Match pairs ---------------------------------------------------------------------------------

@Composable
private fun MatchEngine(p: Play, hindi: Boolean, sfx: Sfx, still: Boolean) {
    val scope = rememberCoroutineScope()
    val rightOrder = remember(p) { shuffled(p.pairs.size, p.pairs.joinToString { it.right.en }) }
    val matched = remember(p) { mutableStateListOf<Int>() }
    var sel by remember { mutableIntStateOf(-1) }
    var miss by remember { mutableIntStateOf(-1) }
    val wobble = remember { Animatable(0f) }
    Row(Modifier.fillMaxWidth()) {
        Text(p.left?.pick(hindi) ?: "", style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
        Text(p.right?.pick(hindi) ?: "", style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
    }
    Text(if (hindi) "बाईं ओर से एक चुनिए, फिर उसका जोड़ा।" else "Tap one on the left, then its partner.", style = MaterialTheme.typography.bodySmall)
    p.pairs.indices.forEach { row ->
        val r = rightOrder[row]
        Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val l = row
            val lDone = l in matched
            Box(Modifier.weight(1f).fillMaxHeight()
                .background(if (lDone) Right.copy(alpha = 0.15f) else if (sel == l) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                .clickable(enabled = !lDone) { sel = l; sfx.playAny("pick") }.padding(10.dp)) {
                Text(p.pairs[l].left.pick(hindi))
            }
            val rDone = r in matched
            Box(Modifier.weight(1f).fillMaxHeight()
                .graphicsLayer { if (miss == r) translationX = wobble.value }
                .background(if (rDone) Right.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                .clickable(enabled = !rDone && sel >= 0) {
                    if (sel == r) {
                        matched.add(r)
                        sel = -1
                        sfx.playAny("match", "snap")
                    } else {
                        miss = r
                        sfx.playAny("miss", "wrong")
                        if (!still) scope.launch { for (x in listOf(10f, -8f, 5f, 0f)) wobble.animateTo(x, tween(45)) }
                    }
                }.padding(10.dp)) {
                Text(p.pairs[r].right.pick(hindi))
            }
        }
    }
    if (matched.size == p.pairs.size) Done(hindi) { matched.clear() }
}

// --- Flip and reveal: flashcards, mnemonic, acronym, landmark case, scheme, index card... -------

@Composable
private fun RevealEngine(p: Play, hindi: Boolean, sfx: Sfx, still: Boolean) {
    var at by rememberSaveable { mutableIntStateOf(0) }
    var flipped by rememberSaveable(at) { mutableStateOf(false) }
    p.intro?.pick(hindi)?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.titleMedium) }
    if (at >= p.cards.size) {
        p.cards.forEach { c -> Text(c.front.pick(hindi) + " — " + c.back.pick(hindi), style = MaterialTheme.typography.bodySmall) }
        p.outro?.let { Why(it, hindi) }
        return Done(hindi) { at = 0 }
    }
    val c = p.cards[at]
    val rot by animateFloatAsState(if (flipped) 180f else 0f, tween(if (still) 0 else 300), label = "card")
    Text("${at + 1} / ${p.cards.size}", style = MaterialTheme.typography.labelMedium)
    Box(
        Modifier.fillMaxWidth().heightIn(min = 160.dp)
            .graphicsLayer { rotationY = rot; cameraDistance = 14f * density }
            .background(MaterialTheme.colorScheme.secondaryContainer, RoundedCornerShape(14.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
            .clickable { if (!flipped) { flipped = true; sfx.playAny("flip", "letter") } else flipped = false }
            .padding(20.dp),
        contentAlignment = Alignment.Center,
    ) {
        if (rot <= 90f) Text(c.front.pick(hindi), style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
        else Text(c.back.pick(hindi), style = MaterialTheme.typography.bodyLarge, modifier = Modifier.graphicsLayer { rotationY = 180f })
    }
    Text(if (flipped) "" else (if (hindi) "पलटने के लिए टैप करें" else "Tap to turn over"), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.outline)
    if (flipped) Button(onClick = {
        at++
        if (at >= p.cards.size) sfx.playAny("done")
    }) { Text(if (at + 1 < p.cards.size) (if (hindi) "अगला कार्ड" else "Next card") else (if (hindi) "पूरा करें" else "Finish")) }
}

// --- Step through: story beats, answer skeleton, ethics dilemma ----------------------------------

@Composable
private fun StepsEngine(p: Play, hindi: Boolean, sfx: Sfx) {
    var shown by rememberSaveable { mutableIntStateOf(if (p.beats.isEmpty()) 0 else 1) }
    var chose by rememberSaveable { mutableIntStateOf(-1) }
    p.intro?.pick(hindi)?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.bodyLarge) }
    p.beats.take(shown).forEachIndexed { i, b ->
        Column(Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(10.dp)).padding(12.dp)) {
            Text(b.head.pick(hindi), fontWeight = FontWeight.Bold)
            Text(b.text.pick(hindi))
        }
    }
    if (shown < p.beats.size) {
        Button(onClick = { shown++; sfx.playAny("next") }) { Text(if (hindi) "आगे" else "Next") }
        return
    }
    if (p.choices.isNotEmpty()) {
        // The dilemma has no right answer: every choice shows its outcome and values, no right or wrong sound.
        p.question?.let { Text(it.pick(hindi), style = MaterialTheme.typography.titleMedium) }
        p.choices.forEachIndexed { i, c ->
            OutlinedButton(modifier = Modifier.fillMaxWidth(), onClick = { chose = i; sfx.playAny("next") },
                border = BorderStroke(if (chose == i) 2.dp else 1.dp, if (chose == i) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline)) {
                Text(c.label.pick(hindi), textAlign = TextAlign.Start, modifier = Modifier.fillMaxWidth())
            }
            if (chose == i) {
                Text(c.outcome.pick(hindi))
                Text((if (hindi) "मूल्य: " else "Values: ") + c.values.pick(hindi), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
            }
        }
        if (chose < 0) return
        Text(if (hindi) "यहाँ कोई एक सही उत्तर नहीं है। दूसरे विकल्प भी देखिए।" else "There's no single right answer here. Try the other choices too.",
            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
    }
    LaunchedEffect(Unit) { sfx.playAny("done") }
    p.outro?.let { Why(it, hindi) }
    TextButton(onClick = { shown = if (p.beats.isEmpty()) 0 else 1; chose = -1 }) { Text(if (hindi) "शुरू से" else "From the start") }
}

// --- Side by side: versus, before and after ------------------------------------------------------

@Composable
private fun CompareEngine(p: Play, hindi: Boolean) {
    p.heading?.pick(hindi)?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.titleMedium) }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Chip(p.a?.pick(hindi) ?: "", MaterialTheme.colorScheme.primaryContainer, Modifier.weight(1f))
        Chip(p.b?.pick(hindi) ?: "", MaterialTheme.colorScheme.tertiaryContainer, Modifier.weight(1f))
    }
    p.rows.forEach { r ->
        r.label.pick(hindi).takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold) }
        Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(r.a.pick(hindi), Modifier.weight(1f).fillMaxHeight().background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp)).padding(8.dp))
            Text(r.b.pick(hindi), Modifier.weight(1f).fillMaxHeight().background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp)).padding(8.dp))
        }
    }
    p.takeaway?.let { Text(it.pick(hindi), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium) }
}

// --- Link web --------------------------------------------------------------------------------------

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun HubEngine(p: Play, hindi: Boolean, sfx: Sfx) {
    val seen = remember(p) { mutableStateListOf<Int>() }
    var open by remember { mutableIntStateOf(-1) }
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Chip(p.center?.pick(hindi) ?: "", MaterialTheme.colorScheme.primaryContainer)
    }
    Text(if (hindi) "हर कड़ी टैप करके देखिए कि यह कहाँ जुड़ता है।" else "Tap each link to see where it connects.", style = MaterialTheme.typography.bodySmall)
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        p.spokes.forEachIndexed { i, s ->
            OutlinedButton(onClick = { open = i; if (i !in seen) seen.add(i); sfx.playAny("pick", "flip") }) {
                Text((if (i in seen) "● " else "○ ") + s.label.pick(hindi))
            }
        }
    }
    p.spokes.getOrNull(open)?.let { Text(it.link.pick(hindi), modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp)).padding(10.dp)) }
    if (seen.size == p.spokes.size) p.question?.let {
        Text(if (hindi) "अभ्यास का सवाल" else "Practice question", style = MaterialTheme.typography.labelLarge)
        Text(it.pick(hindi), style = MaterialTheme.typography.titleMedium)
    }
}

// --- Fill the gap --------------------------------------------------------------------------------

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ClozeEngine(p: Play, hindi: Boolean, sfx: Sfx, still: Boolean) {
    val text = p.text?.pick(hindi) ?: return
    val bank = p.bank ?: return
    val scope = rememberCoroutineScope()
    var filled by rememberSaveable { mutableIntStateOf(0) }
    var wrong by remember { mutableIntStateOf(-1) }
    val wobble = remember { Animatable(0f) }
    val parts = remember(text) { text.split(Regex("""\[\[(\d+)]]""")) }
    Text(buildAnnotatedString {
        parts.forEachIndexed { i, s ->
            append(s)
            if (i < parts.size - 1) {
                val word = p.answers.getOrNull(i)?.let { bank.at(it, hindi) }
                when {
                    i < filled -> withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = Right)) { append(word ?: "") }
                    i == filled -> withStyle(SpanStyle(fontWeight = FontWeight.Bold, background = Color(0x33FFC870))) { append("  ${i + 1}  ") }
                    else -> append(" ____ ")
                }
            }
        }
    }, style = MaterialTheme.typography.bodyLarge)
    if (filled < p.answers.size) {
        Text((if (hindi) "ख़ाली जगह ${filled + 1} के लिए शब्द चुनिए:" else "Pick the word for gap ${filled + 1}:"), style = MaterialTheme.typography.labelLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            bank.en.indices.forEach { w ->
                OutlinedButton(
                    modifier = Modifier.graphicsLayer { if (w == wrong) translationX = wobble.value },
                    onClick = {
                        if (w == p.answers[filled]) {
                            wrong = -1
                            filled++
                            sfx.playAny(if (filled == p.answers.size) "done" else "snap", "right")
                        } else {
                            wrong = w
                            sfx.playAny("wrong")
                            if (!still) scope.launch { for (x in listOf(10f, -8f, 5f, 0f)) wobble.animateTo(x, tween(45)) }
                        }
                    },
                ) { Text(bank.at(w, hindi)) }
            }
        }
    } else {
        Why(p.why, hindi)
        Done(hindi) { filled = 0 }
    }
}

// --- Picture story: The Hidden Why -----------------------------------------------------------------

private val PaperBg = Color(0xFFF6EBDD)
private val PillInk = Color(0xFF2B1B10)
private val ChaiPill = Color(0xFFB07A45)

/**
 * Captions over one tall 360×640 drawing. Each frame pans and zooms to its focus point (x and y kept
 * far enough in that no edge of the drawing shows); with motion off the view simply jumps. Tap the
 * right side to go on, the left to go back. After the last frame come three cards, and then it ends.
 */
@Composable
private fun HiddenWhyEngine(p: Play, hindi: Boolean, sfx: Sfx, still: Boolean, library: ContentLibrary) {
    val frames = p.frames
    var at by rememberSaveable { mutableIntStateOf(0) }
    val total = frames.size + 1
    val go = { to: Int ->
        val next = to.coerceIn(0, total - 1)
        if (next > at) {
            if (next == frames.size - 1) sfx.playAny("reveal", "chime", "done") else sfx.playAny("next", "page")
        }
        at = next
        Unit
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        repeat(total) { i ->
            Box(Modifier.weight(1f).height(4.dp).background(
                if (i <= at) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(2.dp)))
        }
    }
    if (at < frames.size) {
        PictureFrames(p, at, hindi, still, library, onBack = { go(at - 1) }, onNext = { go(at + 1) })
    } else {
        HiddenWhyCards(p, hindi)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = { go(frames.size - 1) }) { Text(if (hindi) "← पीछे" else "← Back") }
            TextButton(onClick = { at = 0 }) { Text(if (hindi) "शुरू से" else "From the start") }
        }
    }
}

@Composable
private fun PictureFrames(p: Play, at: Int, hindi: Boolean, still: Boolean, library: ContentLibrary, onBack: () -> Unit, onNext: () -> Unit) {
    val frames = p.frames
    val f = frames.getOrNull(at) ?: return
    val z = (f.focus.getOrNull(2) ?: 1f).coerceIn(1f, 2.5f)
    val x = (f.focus.getOrNull(0) ?: 180f).coerceIn(180f / z, 360f - 180f / z)
    val y = (f.focus.getOrNull(1) ?: 320f).coerceIn(320f / z, 640f - 320f / z)
    val spec = if (still) tween<Float>(0) else tween<Float>(1300, easing = FastOutSlowInEasing)
    val zoom by animateFloatAsState(z, spec, label = "zoom")
    val fx by animateFloatAsState(x, spec, label = "x")
    val fy by animateFloatAsState(y, spec, label = "y")
    val last = at == frames.size - 1
    BoxWithConstraints(Modifier.fillMaxWidth().aspectRatio(360f / 640f).clip(RoundedCornerShape(16.dp)).background(PaperBg)) {
        val wPx = with(LocalDensity.current) { maxWidth.toPx() }
        val hPx = with(LocalDensity.current) { maxHeight.toPx() }
        val bmp by produceState<ImageBitmap?>(null, p.image, wPx) {
            value = p.image?.takeIf { !library.dataSaver() }?.let { renderSvg(library, it, wPx.toInt().coerceIn(64, 1440))?.asImageBitmap() }
        }
        bmp?.let {
            Image(it, contentDescription = null, contentScale = ContentScale.FillBounds,
                modifier = Modifier.fillMaxSize().graphicsLayer {
                    transformOrigin = TransformOrigin.Center
                    scaleX = zoom
                    scaleY = zoom
                    // CSS scale(z) translate(...): the shift is in the drawing's own, scaled units.
                    translationX = zoom * (180f - fx) / 360f * wPx
                    translationY = zoom * (320f - fy) / 640f * hPx
                })
        }
        val caption = f.text.pick(hindi)
        Text(
            if (hindi) caption else caption.uppercase(),
            color = if (last) Color.White else PillInk,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.align(Alignment.BottomCenter).padding(start = 16.dp, end = 16.dp, bottom = maxHeight * 0.14f)
                .background(if (last) ChaiPill else Color.White, RoundedCornerShape(24.dp))
                .padding(horizontal = 18.dp, vertical = 12.dp),
        )
        Row(Modifier.fillMaxSize()) {
            Box(Modifier.weight(1f).fillMaxHeight().clickable(enabled = at > 0, onClickLabel = if (hindi) "पीछे" else "Back") { onBack() })
            Box(Modifier.weight(2f).fillMaxHeight().clickable(onClickLabel = if (hindi) "आगे" else "Next") { onNext() })
        }
    }
    Text(if (hindi) "आगे के लिए दाईं ओर, पीछे के लिए बाईं ओर टैप करें" else "Tap right to go on, left to go back",
        style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.outline)
}

@Composable
private fun HiddenWhyCards(p: Play, hindi: Boolean) {
    val context = LocalContext.current
    var copied by remember { mutableStateOf(false) }
    val card = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceContainer, RoundedCornerShape(14.dp)).padding(14.dp)
    Column(card, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(if (hindi) "समझदारी से कहिए" else "Say it smart", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
        p.named?.pick(hindi)?.takeIf { it.isNotBlank() }?.let { Chip(it, MaterialTheme.colorScheme.primaryContainer) }
        val quote = p.sayItSmart?.pick(hindi).orEmpty()
        Text("“$quote”", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
        OutlinedButton(onClick = {
            context.getSystemService(ClipboardManager::class.java)?.setPrimaryClip(ClipData.newPlainText("Say it smart", quote))
            copied = true
        }) { Text(if (copied) (if (hindi) "कॉपी हो गया ✓" else "Copied ✓") else (if (hindi) "कॉपी करें" else "Copy")) }
    }
    Column(card, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(if (hindi) "सावधानी" else "Careful", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
        Why(p.careful, hindi)
        p.followUp?.let { fu ->
            Text(if (hindi) "अगर वे आगे पूछें" else "If they ask next", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 6.dp))
            Text(fu.q.pick(hindi), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
            Text(fu.hint.pick(hindi), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
    Column(card, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(if (hindi) "कहाँ काम आए" else "Use it in", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
        p.useItIn.forEach { u ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
                Chip(u.paper.pick(hindi), PaperBg)
                Text(u.text.pick(hindi), modifier = Modifier.weight(1f).padding(top = 6.dp))
            }
        }
        if (p.sources.isNotEmpty()) {
            Text(if (hindi) "स्रोत" else "Sources", style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(top = 6.dp))
            p.sources.forEach { s ->
                Text(s.label + if (s.verify) (if (hindi) " · जाँचें" else " · check") else "", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}
