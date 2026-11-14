@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.upscpods.app.ui

import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.material3.AlertDialog
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import com.upscpods.app.data.Brief
import com.upscpods.app.data.DayState
import com.upscpods.app.data.Persona
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import java.time.format.DateTimeFormatter
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import com.upscpods.app.data.Nudge
import com.upscpods.app.data.Ritual
import com.upscpods.app.data.Rituals
import com.upscpods.app.BuildConfig
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun MyPathTab(
    day: DayState,
    persona: Persona?,
    onOpenNeedToTalk: () -> Unit,
    onRedoOnboarding: () -> Unit,
    onDeleteData: () -> Unit,
    onExportJournal: () -> Unit,
    onDeleteJournal: () -> Unit,
    serverUrl: String,
    onServerUrl: (String) -> Unit,
    modifier: Modifier = Modifier,
    onOpenFocus: () -> Unit = {},
    /** The planning mirror, Know the paper, honest numbers, Plan B and the Honest Guide. */
    guide: @Composable () -> Unit = {},
) {
    var server by rememberSaveable(serverUrl) { mutableStateOf(serverUrl) }
    var confirmDelete by rememberSaveable { mutableStateOf(false) }
    var confirmJournal by rememberSaveable { mutableStateOf(false) }
    Column(
        modifier.verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // What the app knows lives in Me → Profile, one answer at a time; nothing is guessed here.
        Text("Your answers, and where each one is kept, are in Me → Profile.", style = MaterialTheme.typography.bodySmall)
        var confirmRedo by rememberSaveable { mutableStateOf(false) }
        TextButton(onClick = { confirmRedo = true }) { Text("Redo the first-run steps") }
        if (confirmRedo) AlertDialog(
            onDismissRequest = { confirmRedo = false },
            title = { Text("Redo the first-run steps?") },
            text = { Text("You'll see the welcome, language, consent and name screens again, then ${Brand.MASCOT_SHORT}'s tour. Nothing is deleted.") },
            confirmButton = { TextButton(onClick = { confirmRedo = false; onRedoOnboarding() }) { Text("Redo them") } },
            dismissButton = { TextButton(onClick = { confirmRedo = false }) { Text("Cancel") } },
        )

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("This week", style = MaterialTheme.typography.titleMedium)
            WeeklyRhythm(day)
            Text("Days a week I'm aiming for", style = MaterialTheme.typography.bodyMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                (3..7).forEach { n ->
                    FilterChip(selected = day.weeklyTarget == n, onClick = { day.weeklyTarget = n }, label = { Text("$n") })
                }
            }
        }

        guide()

        // Countdown is opt-in, shown as a date, never red.
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Show Prelims date", style = MaterialTheme.typography.titleMedium)
                if (day.showPrelimsDate) {
                    Text("Prelims ${Brand.PRELIMS_DATE.year}: ${Brand.PRELIMS_DATE.format(DateTimeFormatter.ofPattern("d MMMM"))}")
                }
            }
            Switch(checked = day.showPrelimsDate, onCheckedChange = { day.showPrelimsDate = it })
        }

        // Focus: close distracting apps during a block, and daily limits (like the desktop extension).
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Focus", style = MaterialTheme.typography.titleMedium)
                Text("Close distracting apps while you study, and set daily limits.", style = MaterialTheme.typography.bodySmall)
            }
            OutlinedButton(onClick = onOpenFocus) { Text("Open") }
        }

        // Ritual nudges (W4): Morning Chai and the week's fixed moments. Each one off in one tap.
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            val context = LocalContext.current
            var picks by remember { mutableStateOf(Rituals.on(context)) }
            var chai by remember { mutableStateOf(Nudge.time(context)) }
            Text("Ritual nudges", style = MaterialTheme.typography.titleMedium)
            Text(if (picks.isEmpty()) "Off. No notifications." else "Each one opens straight into the thing itself.", style = MaterialTheme.typography.bodySmall)
            RitualPicker(picks, chai, hindi = false, inPod = Rituals.inPod(context)) { p, t -> picks = p; chai = t; Rituals.set(context, p, t) }
            if (BuildConfig.DEBUG) {
                // Debug builds: see each push now, to try where it opens.
                val scope = rememberCoroutineScope()
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Ritual.PICKABLE.forEach { r -> OutlinedButton(onClick = { scope.launch { Rituals.preview(context, r) } }) { Text("Try: ${r.title}") } }
                }
            }
        }

        // Pause mode: up to 14 days, no reason asked.
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Pause", style = MaterialTheme.typography.titleMedium)
                Text(
                    if (day.paused) "Paused until ${day.pausedUntil}. Come back whenever you're ready."
                    else "Take up to 14 days off. No reason needed.",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Switch(
                checked = day.paused,
                onCheckedChange = { on -> day.pausedUntil = if (on) java.time.LocalDate.now().plusDays(14) else null },
            )
        }

        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("My journal", style = MaterialTheme.typography.titleMedium)
            Text("Close the Day entries are encrypted on this phone. Only you can see them.", style = MaterialTheme.typography.bodySmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                OutlinedButton(onClick = onExportJournal) { Text("Export") }
                if (!confirmJournal) {
                    OutlinedButton(onClick = { confirmJournal = true }) { Text("Delete journal") }
                } else {
                    OutlinedButton(onClick = { confirmJournal = false; onDeleteJournal() }) { Text("Yes, delete") }
                }
            }
        }

        // A testing setting: release builds always use the default server, so they don't show it.
        if (com.upscpods.app.BuildConfig.DEBUG) Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("Pod server", style = MaterialTheme.typography.titleMedium)
            Text(
                if (com.upscpods.app.BuildConfig.DEBUG) "For testing on your Wi-Fi: http://<your PC's IP>:8787. On the emulator: http://10.0.2.2:8787."
                else "Leave blank to use ${com.upscpods.app.data.ServerPolicy.default}. Other servers need https://.",
                style = MaterialTheme.typography.bodySmall,
            )
            OutlinedTextField(
                value = server,
                onValueChange = { server = it },
                singleLine = true,
                placeholder = { Text("http://192.168.1.10:8787") },
                modifier = Modifier.fillMaxWidth(),
            )
            val problem = com.upscpods.app.data.ServerPolicy.check(server)
            problem?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error) }
            OutlinedButton(onClick = { onServerUrl(server) }, enabled = server.trim() != serverUrl && problem == null) { Text("Save and connect") }
        }

        TextButton(onClick = onOpenNeedToTalk) { Text("Need to talk? · किसी से बात करनी है?") }

        // Delete in two taps: tap, then confirm.
        if (!confirmDelete) {
            TextButton(onClick = { confirmDelete = true }) { Text("Delete my account and data") }
        } else {
            Text("This deletes your account: your sign-in, pod membership, messages and consent record on our server, and your profile, answers and journal on this phone. It can't be undone.", style = MaterialTheme.typography.bodySmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                OutlinedButton(onClick = { confirmDelete = false }) { Text("Keep it") }
                OutlinedButton(onClick = onDeleteData) { Text("Delete my account") }
            }
        }
    }
}
