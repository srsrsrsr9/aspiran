package com.upscpods.app.ui

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Button
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import com.upscpods.app.data.Metrics
import com.upscpods.app.data.PAPER_CHOICES
import com.upscpods.app.data.RoadmapGoal
import com.upscpods.app.data.RoadmapPlan
import com.upscpods.app.data.RoadmapStore
import com.upscpods.app.data.RoadmapWeek
import kotlinx.coroutines.launch
import java.io.File
import java.time.LocalDate

/**
 * Prep → My Plan → Roadmap (and Chotu's Plan chip): the goal form, the one-page roadmap, this week's plan and a
 * share image. Free; the answers stay on this phone. Nothing here predicts a rank or a result.
 */
@Composable
fun RoadmapSection(store: RoadmapStore) {
    var plan by remember { mutableStateOf(store.plan) }
    var editing by remember { mutableStateOf(plan == null) }
    var ticks by remember { mutableIntStateOf(0) }
    if (editing || plan == null) {
        RoadmapForm(store, plan?.goal, onBuilt = { plan = store.plan; editing = false }, onCancel = if (plan != null) ({ editing = false }) else null)
        return
    }
    val p = plan!!
    androidx.compose.runtime.key(ticks) { RoadmapView(store, p, onEdit = { editing = true }, onTick = { ticks++ }) }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun RoadmapForm(store: RoadmapStore, start: RoadmapGoal?, onBuilt: () -> Unit, onCancel: (() -> Unit)?) {
    val thisYear = LocalDate.now().year
    val years = (0..3).map { thisYear + it }.filter { it > thisYear || LocalDate.now().monthValue < 4 }
    var year by remember { mutableIntStateOf(start?.examYear ?: (thisYear + 1)) }
    var attempt by remember { mutableIntStateOf(start?.attempt ?: 1) }
    var optional by remember { mutableStateOf(start?.optional ?: "") }
    var hours by remember { mutableStateOf((start?.hoursPerDay ?: 6.0).let { if (it % 1.0 == 0.0) it.toInt().toString() else it.toString() }) }
    var working by remember { mutableStateOf(start?.working ?: false) }
    var weak by remember { mutableStateOf(start?.weakPapers?.toSet() ?: emptySet()) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Your roadmap", style = MaterialTheme.typography.titleMedium)
            Text("Six quick answers. You get a one-page roadmap to Prelims and a weekly plan. Free, and your answers stay on this phone.", style = MaterialTheme.typography.bodySmall)
            Text("Prelims year", style = MaterialTheme.typography.labelLarge)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { years.forEach { y -> FilterChip(selected = year == y, onClick = { year = y }, label = { Text("$y") }) } }
            Text("Attempt", style = MaterialTheme.typography.labelLarge)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(1 to "First", 2 to "Second", 3 to "Third or later").forEach { (v, l) -> FilterChip(selected = attempt == v, onClick = { attempt = v }, label = { Text(l) }) }
            }
            OutlinedTextField(optional, { optional = it.take(40) }, Modifier.fillMaxWidth(), label = { Text("Optional subject (leave empty if not chosen)") }, singleLine = true)
            OutlinedTextField(hours, { hours = it.filter { c -> c.isDigit() || c == '.' }.take(4) }, Modifier.fillMaxWidth(), label = { Text("Hours a day you can really study") },
                singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
            Text("Right now I'm", style = MaterialTheme.typography.labelLarge)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = !working, onClick = { working = false }, label = { Text("Studying full-time") })
                FilterChip(selected = working, onClick = { working = true }, label = { Text("Working and studying") })
            }
            Text("Papers that feel weak (optional)", style = MaterialTheme.typography.labelLarge)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PAPER_CHOICES.forEach { p -> FilterChip(selected = p in weak, onClick = { weak = if (p in weak) weak - p else weak + p }, label = { Text(p) }) }
            }
            error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(enabled = !busy, onClick = {
                    val h = hours.toDoubleOrNull()
                    if (h == null || h < 1 || h > 14) { error = "Hours a day: between 1 and 14."; return@Button }
                    busy = true; error = null
                    scope.launch {
                        val goal = RoadmapGoal(year, attempt, optional.trim(), h, working, PAPER_CHOICES.filter { it in weak })
                        error = store.build(goal)
                        busy = false
                        if (error == null) { Metrics.rateAfter("roadmap"); onBuilt() }
                    }
                }) { Text(if (busy) "Building…" else if (start != null) "Rebuild my roadmap" else "Build my roadmap") }
                onCancel?.let { TextButton(onClick = it) { Text("Cancel") } }
            }
        }
    }
}

@Composable
private fun RoadmapView(store: RoadmapStore, p: RoadmapPlan, onEdit: () -> Unit, onTick: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var week by remember { mutableStateOf<RoadmapWeek?>(store.week) }
    var loadingWeek by remember { mutableStateOf(true) }
    LaunchedEffect(p) { week = store.refreshWeek(); loadingWeek = false }
    val units = store.unitsDone
    val subjects = store.subjectsDone
    var polityOpen by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Prelims ${p.goal.examYear}", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                    Text("${p.weeksLeft} weeks", style = MaterialTheme.typography.labelLarge)
                }
                Text("About ${p.hoursPerWeek} hours a week, ${p.studyDays} days, one day off. ${if (p.goal.working) "Working and studying." else "Full-time."}", style = MaterialTheme.typography.bodyMedium)
                Text("A week: GS ${p.split.gs}%${if (p.split.optional > 0) ", optional ${p.split.optional}%" else ""}, answers ${p.split.answers}%, current affairs ${p.split.current}%, tests ${p.split.tests}%.", style = MaterialTheme.typography.bodySmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { shareRoadmap(context, p) }) { Text("Share as image") }
                    TextButton(onClick = onEdit) { Text("Change my goal") }
                }
            }
        }
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("This week", style = MaterialTheme.typography.titleMedium)
                val w = week
                if (w == null) Text(if (loadingWeek) "Getting this week's plan…" else "This week's plan needs a connection. It'll appear when you're online.", style = MaterialTheme.typography.bodySmall)
                else {
                    Text(w.phase, style = MaterialTheme.typography.labelMedium)
                    Text(w.line, style = MaterialTheme.typography.bodyMedium)
                    w.days.forEach { d ->
                        Text(d.day, style = MaterialTheme.typography.labelLarge)
                        d.blocks.forEach { b -> Text((if (b.minutes > 0) "${b.minutes} min · " else "") + b.what, style = MaterialTheme.typography.bodySmall) }
                    }
                    TextButton(onClick = { scope.launch { week = store.refreshWeek(force = true) } }) { Text("Rebuild this week") }
                }
            }
        }
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Phases", style = MaterialTheme.typography.titleMedium)
                p.phases.forEach { ph ->
                    Text("${ph.name} · ${ph.weeks} weeks, ${ph.from} to ${ph.to}", style = MaterialTheme.typography.labelLarge)
                    Text(ph.focus, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text("Subject order", style = MaterialTheme.typography.titleMedium)
                Text("One subject at a time. Tick one when you've read it once; the weekly plan moves on.", style = MaterialTheme.typography.bodySmall)
                p.order.forEachIndexed { i, s ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = s.id in subjects, onCheckedChange = { store.toggleSubject(s.id); onTick() })
                        Text("${i + 1}. ${s.name} (${s.paper}, about ${s.hours} h, ${s.weeks} wk)", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Polity, unit by unit", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                    TextButton(onClick = { polityOpen = !polityOpen }) { Text(if (polityOpen) "Hide" else "Show") }
                }
                if (polityOpen) p.polity.forEach { u ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = u.name in units, onCheckedChange = { store.toggleUnit(u.name); onTick() })
                        Text("${u.name} · ${u.hours} h", style = MaterialTheme.typography.labelLarge)
                    }
                    Text(u.sources, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(start = 48.dp))
                    Text("Check: ${u.check}", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(start = 48.dp, bottom = 6.dp))
                }
            }
        }
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Three checks along the way", style = MaterialTheme.typography.titleMedium)
                p.milestones.forEach { m ->
                    Text("${m.title} · by ${m.by}", style = MaterialTheme.typography.labelLarge)
                    Text(m.check, style = MaterialTheme.typography.bodySmall)
                }
                Text("These are checks you do yourself. Nothing here predicts a rank or a result.", style = MaterialTheme.typography.bodySmall)
            }
        }
        FlatCard {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                p.notes.forEach { Text(it, style = MaterialTheme.typography.bodySmall) }
            }
        }
    }
}

/** The roadmap on one image, handed to the share sheet (cacheDir/share, the existing FileProvider). */
private fun shareRoadmap(context: Context, p: RoadmapPlan) {
    val w = 1080
    val bold = Typeface.create(Typeface.SERIF, Typeface.BOLD)
    val regular = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
    data class Line(val text: String, val size: Float, val face: Typeface, val color: Int, val gap: Float)
    val brown = 0xFF9A4E0E.toInt(); val ink = 0xFF201B17.toInt(); val muted = 0xFF6B5E54.toInt()
    val lines = buildList {
        add(Line("My UPSC roadmap · Prelims ${p.goal.examYear}", 54f, bold, brown, 12f))
        add(Line("${p.weeksLeft} weeks · about ${p.hoursPerWeek} hours a week · ${if (p.goal.working) "working and studying" else "full-time"}", 32f, regular, muted, 40f))
        add(Line("Phases", 38f, bold, ink, 8f))
        p.phases.forEach { add(Line("${it.name}: ${it.weeks} weeks (${it.from} to ${it.to})", 30f, regular, ink, 6f)) }
        add(Line("Subject order", 38f, bold, ink, 8f))
        p.order.take(10).forEachIndexed { i, s -> add(Line("${i + 1}. ${s.name} · about ${s.hours} h", 30f, regular, ink, 4f)) }
        add(Line("Three checks", 38f, bold, ink, 8f))
        p.milestones.forEach { add(Line("${it.title} (by ${it.by})", 30f, bold, ink, 2f)); add(Line(it.check, 26f, regular, muted, 14f)) }
        add(Line("Made free with Aspiran ☕ No rank predictions, just a plan.", 28f, regular, brown, 0f))
    }
    val layouts = lines.map { l ->
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = l.size; color = l.color; typeface = l.face }
        StaticLayout.Builder.obtain(l.text, 0, l.text.length, paint, w - 160).setAlignment(Layout.Alignment.ALIGN_NORMAL).setLineSpacing(0f, 1.1f).build() to l
    }
    // A little space before each heading.
    val h = 160 + layouts.sumOf { (lay, l) -> lay.height + l.gap.toInt() + (if (l.size >= 38f && l.face == bold) 24 else 0) }
    val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val c = Canvas(bmp)
    c.drawColor(0xFFFBF3E8.toInt())
    var y = 80f
    layouts.forEach { (lay, l) ->
        if (l.size >= 38f && l.face == bold && y > 80f) y += 24f
        c.save(); c.translate(80f, y); lay.draw(c); c.restore()
        y += lay.height + l.gap
    }
    val dir = File(context.cacheDir, "share").apply { mkdirs() }
    val file = File(dir, "roadmap.png").also { f -> f.outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) } }
    val uri = FileProvider.getUriForFile(context, context.packageName + ".share", file)
    val send = Intent(Intent.ACTION_SEND).setType("image/png").putExtra(Intent.EXTRA_STREAM, uri)
        .putExtra(Intent.EXTRA_TEXT, "My UPSC roadmap for Prelims ${p.goal.examYear}")
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    context.startActivity(Intent.createChooser(send, "Share my roadmap"))
}
