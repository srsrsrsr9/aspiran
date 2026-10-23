package com.upscpods.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.upscpods.app.data.FAST_SECS
import com.upscpods.app.data.Honest
import com.upscpods.app.data.Marking
import com.upscpods.app.data.MockIntel
import com.upscpods.app.data.MockIntelligence
import com.upscpods.app.data.MockMcq
import com.upscpods.app.data.MockRecord
import com.upscpods.app.data.PlusGate
import com.upscpods.app.data.PrepQ
import com.upscpods.app.data.TopicTally
import kotlin.math.roundToInt

// Mock Intelligence (sell-first plan W6): the top of Mock insights. Members see all five readings. Everyone else sees
// one, marks lost to negative marking, in full, and the other four locked behind a Plus pill at the one price.

private val AMBER = Color(0xFFFFB547)
private val CORAL = Color(0xFFFF6B5E)
private val MINT = Color(0xFF3DDC97)
private val SKY = Color(0xFF6FB7FF)
private val LILAC = Color(0xFFB794FF)

/** Sample papers ids start with "sample": the built-in ones below, or ones seeded for a demo. Both are labelled. */
fun isSampleHistory(hist: List<MockRecord>) = hist.isNotEmpty() && hist.all { it.id.startsWith("sample") }

@Composable
fun MockIntelligenceSection(
    hist: List<MockRecord>, misses: List<PrepQ>, gate: PlusGate, quiet: Boolean,
    onOpenNode: (paper: String, topic: String) -> Unit, onSeePlus: () -> Unit,
) {
    val builtIn = hist.isEmpty()
    val h = if (builtIn) SAMPLE_INTEL_HIST else hist
    val m = if (builtIn) SAMPLE_INTEL_MISSES else misses
    val intel = remember(h, m) { MockIntelligence.of(h, m) }
    val sample = builtIn || isSampleHistory(hist)
    IntelHeader(intel, sample)
    val open = gate.open
    // 3. Negative marking is the free reading: shown in full to everyone.
    if (open) {
        LuckyCard(intel); StuckCard(intel); NegativeCard(intel); RevisionCard(intel, onOpenNode); BandCard(intel)
    } else {
        NegativeCard(intel)
        Locked("Where you're getting lucky", "Right answers that were guesses or quick second tries, by topic", AMBER, quiet, onSeePlus)
        Locked("Where you're stuck", "Topics flat or falling across your last papers", CORAL, quiet, onSeePlus)
        Locked("Your surgical revision list", "The 10 syllabus topics that would move your score most this week", MINT, quiet, onSeePlus)
        Locked("Your progress band", "The score band you're in now, across every paper", SKY, quiet, onSeePlus)
    }
}

@Composable
private fun IntelHeader(intel: MockIntel, sample: Boolean) {
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF120D1F), Color(0xFF2A1640), Color(0xFF4A1F2E)))).padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("MOCK INTELLIGENCE", color = AMBER, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 2.sp)
            if (sample) Text("SAMPLE DATA", Modifier.clip(RoundedCornerShape(999.dp)).background(Color.White).padding(horizontal = 8.dp, vertical = 2.dp),
                color = Color(0xFF2A1300), fontWeight = FontWeight.ExtraBold, fontSize = 10.sp, letterSpacing = 1.sp)
        }
        Text("What your mocks are really saying", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 27.sp)
        Text(
            if (sample) "Sample: made-up papers to show how it reads. Your own papers replace it."
            else "From your ${if (intel.papers == 1) "paper" else "${intel.papers} papers"} on this phone. Worked out here; nothing leaves it.",
            color = Color.White.copy(alpha = .75f), fontSize = 14.sp, lineHeight = 20.sp,
        )
    }
}

/** One reading: a coloured edge, a number, a title. */
@Composable
private fun IntelCard(n: Int, title: String, accent: Color, modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    FlatCard(modifier) {
        Row(Modifier.height(IntrinsicSize.Min)) {
            Box(Modifier.width(5.dp).fillMaxHeight().background(accent))
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("0$n", color = accent, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 1.sp)
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                content()
            }
        }
    }
}

@Composable
private fun Note(text: String) = Text(text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

@Composable
private fun LuckyCard(intel: MockIntel) = IntelCard(1, "Where you're getting lucky", AMBER) {
    if (intel.lucky.isEmpty()) Note("No lucky streaks: your right answers look solid. Keep ticking \"Not sure\" when you guess, so this stays true.")
    else {
        intel.lucky.forEach { l ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(l.topic, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                    Note("${l.luckyRight} right answers were \"Not sure\" or picked within ${FAST_SECS} s of coming back (${l.shaky} shaky in all)")
                }
                Text("${l.luckyRight}", color = AMBER, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
            }
        }
        Note("These marks may not be there on the day. Firm them up before they slip.")
    }
}

@Composable
private fun StuckCard(intel: MockIntel) = IntelCard(2, "Where you're stuck", CORAL) {
    if (intel.stuck.isEmpty()) Note(if (intel.papers < 3) "Shows after 3 papers with the same topic." else "Nothing stuck: every topic you've seen 3 or more times is moving up.")
    else {
        intel.stuck.forEach { s ->
            val d = s.pcts.last() - s.pcts.first()
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(s.topic, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                    Note(s.pcts.joinToString(" → ") { "$it%" } + " over ${s.pcts.size} papers")
                }
                Text(if (d < 0) "$d" else if (d == 0) "flat" else "+$d", color = CORAL, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
            }
        }
        Note("More of the same reading won't move these. Change how you study them: a new source, or questions first.")
    }
}

@Composable
private fun NegativeCard(intel: MockIntel) = IntelCard(3, "Marks lost to negative marking", LILAC) {
    val n = intel.negative ?: return@IntelCard Note("Shows after your first paper.")
    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("−${fmt(n.lost)}", color = LILAC, fontWeight = FontWeight.ExtraBold, fontSize = 34.sp)
        Text("marks", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 6.dp))
    }
    Note("From ${n.wrong} wrong answers in your last ${if (n.papers == 1) "paper" else "${n.papers} papers"}.")
    val be = (n.breakEven * 100).roundToInt()
    Text("Break-even: a guess pays only if you're right more than $be% of the time (about 1 in ${(1 / n.breakEven).roundToInt()}).",
        style = MaterialTheme.typography.bodyMedium)
    val rate = n.guessRate
    if (rate == null || n.guessTotal < 5) Note("Tick \"Not sure\" when you guess, and after 5 guesses this shows whether your guessing pays.")
    else {
        val pct = (rate * 100).roundToInt()
        val pays = rate > n.breakEven
        Text("Your guesses: ${n.guessRight} of ${n.guessTotal} right ($pct%).", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
        Text(
            if (pays) "That's above break-even, so your guesses are earning marks. Guess when you can rule out one option."
            else "That's below break-even, so guessing is costing you marks. Leave these blank unless you can rule out two options.",
            style = MaterialTheme.typography.bodyMedium, color = if (pays) MINT else CORAL,
        )
    }
}

@Composable
private fun RevisionCard(intel: MockIntel, onOpenNode: (String, String) -> Unit) = IntelCard(4, "Your surgical revision list", MINT) {
    if (intel.revision.isEmpty()) Note("Shows once you've missed or skipped a question in a paper.")
    else {
        Note("The ${if (intel.revision.size == 10) "10 " else ""}syllabus topics that would move your score most this week. Tap one to study it.")
        intel.revision.forEachIndexed { i, r ->
            Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable { onOpenNode(r.paper.id, r.topic.name) }.padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("${i + 1}", Modifier.width(22.dp), color = MINT, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                Column(Modifier.weight(1f)) {
                    Text(r.topic.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                    Note(listOfNotNull(r.paper.short, r.missed.takeIf { it > 0 }?.let { "$it missed" }, r.skipped.takeIf { it > 0 }?.let { "$it left blank" },
                        r.shaky.takeIf { it > 0 }?.let { "$it lucky" }).joinToString(" · "))
                }
                Text("+${fmt(r.marks)}", color = MINT, fontWeight = FontWeight.ExtraBold)
                Text("›", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Note("+ marks in play: a missed question turned right wins back its mark and the penalty.")
    }
}

@Composable
private fun BandCard(intel: MockIntel) = IntelCard(5, "Your progress band", SKY) {
    val b = intel.band ?: return@IntelCard Note("Shows after your first paper.")
    if (b.pcts.size < 2) { Note("Your band forms after your second paper. This one: ${b.pcts.first()}%."); return@IntelCard }
    Text("You're scoring ${b.low}–${b.high}% (average ${b.mean}%) over your last ${minOf(5, b.pcts.size)} papers.", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
    val line = SKY
    val bandColor = SKY.copy(alpha = .18f)
    Canvas(Modifier.fillMaxWidth().height(120.dp).semantics { contentDescription = "Scores: " + b.pcts.joinToString(", ") { "$it%" } + ". Band ${b.low} to ${b.high}%." }) {
        val pad = 10.dp.toPx()
        val lo = (b.pcts.min() - 10).coerceAtLeast(0); val hi = (b.pcts.max() + 10).coerceAtMost(100)
        val y = { p: Int -> size.height - pad - (p - lo).toFloat() / (hi - lo).coerceAtLeast(1) * (size.height - 2 * pad) }
        val x = { k: Int -> pad + k * (size.width - 2 * pad) / (b.pcts.size - 1) }
        drawRect(bandColor, Offset(0f, y(b.high)), Size(size.width, y(b.low) - y(b.high)))
        drawLine(line.copy(alpha = .6f), Offset(0f, y(b.mean)), Offset(size.width, y(b.mean)), 1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 8f)))
        val pts = b.pcts.mapIndexed { k, p -> Offset(x(k), y(p)) }
        drawPath(Path().apply { moveTo(pts[0].x, pts[0].y); pts.drop(1).forEach { lineTo(it.x, it.y) } }, line, style = Stroke(2.5.dp.toPx()))
        pts.forEachIndexed { k, p -> drawCircle(if (k == pts.lastIndex) AMBER else line, if (k == pts.lastIndex) 5.dp.toPx() else 3.5.dp.toPx(), p) }
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Note(b.days.first()); Note("Latest: ${b.pcts.last()}%") }
    Note(when {
        b.pcts.last() > b.high - (b.high - b.low) / 4 -> "Your latest paper is at the top of your band. Hold it there for two more and the band moves up."
        b.pcts.last() < b.low + (b.high - b.low) / 4 -> "Your latest paper is at the bottom of your band. One paper isn't a trend; check the stuck topics above."
        else -> "Inside your band. To lift it, work the revision list, not more full papers."
    })
}

/** A locked reading: its title and what it tells you, over a blurred shape (never real numbers), and the Plus pill. */
@Composable
private fun Locked(title: String, what: String, accent: Color, quiet: Boolean, onSeePlus: () -> Unit) {
    FlatCard(Modifier.clickable(enabled = !quiet, onClick = onSeePlus)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(what, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Box(Modifier.fillMaxWidth()) {
                Column(Modifier.fillMaxWidth().blur(6.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(.9f, .7f, .8f).forEach { w ->
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(Modifier.size(10.dp).clip(RoundedCornerShape(999.dp)).background(accent))
                            Box(Modifier.fillMaxWidth(w).height(12.dp).clip(RoundedCornerShape(6.dp)).background(MaterialTheme.colorScheme.surfaceVariant))
                        }
                    }
                }
                Row(Modifier.align(Alignment.Center).clip(RoundedCornerShape(999.dp)).background(Color(0xE6141C34)).padding(horizontal = 14.dp, vertical = 7.dp)) {
                    Text(if (quiet) "🔒 Plus" else "🔒 Unlock with Plus · ${Honest.inr(PLUS_YEARLY_INR)} a year", color = AMBER, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }
}

private fun fmt(d: Double) = if (d == d.toLong().toDouble()) d.toLong().toString() else "%.1f".format(d)

// --- Sample papers: made-up, labelled "SAMPLE DATA" wherever they show -----------------------------------------

private fun t(r: Int, w: Int, s: Int = 0) = TopicTally(r, w, s)
private fun sampleRec(n: Int, day: String, pct: Int, wrong: Int, ur: Int, ut: Int, topics: Map<String, TopicTally>, shaky: Map<String, TopicTally>) =
    MockRecord("sample-$n", "Sample paper $n", day, Marking(), 0.0, 200.0, pct, 0, 0, wrong, ur, ut, topics, 0, shaky)

val SAMPLE_INTEL_HIST: List<MockRecord> = listOf(
    sampleRec(1, "Sample week 1", 41, 26, 3, 12,
        mapOf("Polity" to t(9, 5, 1), "Economy" to t(6, 6, 3), "Modern history" to t(7, 4, 2), "Environment" to t(5, 4, 1), "Geography" to t(5, 3, 5), "Science and tech" to t(4, 4, 2)),
        mapOf("Modern history" to t(2, 1), "Economy" to t(1, 3), "Polity" to t(0, 2))),
    sampleRec(2, "Sample week 2", 46, 24, 2, 11,
        mapOf("Polity" to t(10, 4, 1), "Economy" to t(6, 7, 2), "Modern history" to t(8, 3, 1), "Environment" to t(5, 4, 2), "Geography" to t(6, 3, 4), "Science and tech" to t(5, 4, 1)),
        mapOf("Modern history" to t(2, 0), "Economy" to t(1, 2), "Science and tech" to t(1, 2))),
    sampleRec(3, "Sample week 3", 44, 25, 3, 13,
        mapOf("Polity" to t(11, 3, 1), "Economy" to t(5, 7, 3), "Modern history" to t(8, 4, 1), "Environment" to t(5, 5, 1), "Geography" to t(6, 2, 5), "Science and tech" to t(5, 4, 1)),
        mapOf("Modern history" to t(3, 1), "Environment" to t(1, 2), "Economy" to t(0, 3))),
    sampleRec(4, "Sample week 4", 49, 22, 2, 10,
        mapOf("Polity" to t(12, 3, 0), "Economy" to t(5, 7, 2), "Modern history" to t(9, 3, 1), "Environment" to t(5, 5, 1), "Geography" to t(7, 2, 4), "Science and tech" to t(6, 3, 1)),
        mapOf("Modern history" to t(2, 1), "Geography" to t(1, 1), "Economy" to t(0, 2))),
    sampleRec(5, "Sample week 5", 52, 21, 3, 11,
        mapOf("Polity" to t(13, 2, 0), "Economy" to t(5, 8, 2), "Modern history" to t(9, 4, 0), "Environment" to t(5, 5, 2), "Geography" to t(7, 3, 4), "Science and tech" to t(6, 3, 1)),
        mapOf("Modern history" to t(3, 0), "Science and tech" to t(1, 1), "Economy" to t(0, 3))),
)

private fun sq(id: String, topic: String, q: String) = PrepQ("sample-$id", topic, MockMcq(q, listOf("A", "B", "C", "D"), 0, ""))

val SAMPLE_INTEL_MISSES: List<PrepQ> = listOf(
    sq("e1", "Economy", "Which body sets the policy repo rate in India?"),
    sq("e2", "Economy", "What does the GDP deflator measure?"),
    sq("e3", "Economy", "Which of these is a direct tax?"),
    sq("p1", "Polity", "Under which Article can President's Rule be imposed in a state?"),
    sq("h1", "Modern history", "Who introduced the Permanent Settlement in Bengal?"),
    sq("h2", "Modern history", "Which session of the Congress passed the Purna Swaraj resolution?"),
    sq("n1", "Environment", "Which of these wetlands is a Ramsar site?"),
    sq("n2", "Environment", "What does the IUCN Red List classify?"),
    sq("g1", "Geography", "What causes the retreating monsoon rains in Tamil Nadu?"),
    sq("s1", "Science and tech", "What does CRISPR-Cas9 do?"),
    sq("i1", "World and India", "Which countries make up the Quad?"),
)
