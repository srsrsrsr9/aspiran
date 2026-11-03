package com.upscpods.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleResumeEffect
import com.upscpods.app.BuildConfig
import com.upscpods.app.data.Focus
import kotlinx.coroutines.delay

/**
 * Focus on the phone: start a block, pick the apps it closes, and set daily limits. The same idea as
 * the desktop extension, so it feels the same on both.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FocusScreen(onClose: () -> Unit) {
    val c = LocalContext.current
    var serviceOn by remember { mutableStateOf(Focus.serviceOn(c)) }
    LifecycleResumeEffect(Unit) { serviceOn = Focus.serviceOn(c); onPauseOrDispose {} }
    var until by remember { mutableLongStateOf(Focus.until(c)) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) { while (true) { delay(1000); now = System.currentTimeMillis(); if (until in 1..now) { Focus.stop(c); until = 0 } } }
    var blocked by remember { mutableStateOf(Focus.blocked(c)) }
    var limits by remember { mutableStateOf(Focus.limits(c)) }
    val apps = remember { Focus.launchableApps(c) }
    var explain by rememberSaveable { mutableStateOf(false) }
    var confirmStop by rememberSaveable { mutableStateOf(false) }
    var label by rememberSaveable { mutableStateOf("") }
    var limitFor by rememberSaveable { mutableStateOf<String?>(null) }

    Scaffold(topBar = { TopAppBar(title = { Text("Focus") }, navigationIcon = { TextButton(onClick = onClose) { Text("← Back") } }) }) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                FlatCard {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (until > now) {
                            val left = (until - now) / 1000
                            Text(Focus.label(c).ifBlank { "Focus block" }, style = MaterialTheme.typography.titleMedium)
                            Text("%d:%02d".format(left / 60, left % 60), style = MaterialTheme.typography.displayMedium)
                            Text("${blocked.size} apps closed until it ends.", style = MaterialTheme.typography.bodySmall)
                            OutlinedButton(onClick = { confirmStop = true }) { Text("Stop") }
                        } else {
                            Text("Start a focus block", style = MaterialTheme.typography.titleMedium)
                            OutlinedTextField(label, { label = it.take(60) }, placeholder = { Text("What are you working on? (optional)") }, singleLine = true)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                listOf(25, 50, 90).forEach { m ->
                                    Button(onClick = { Focus.start(c, m, label.ifBlank { "Focus" }); until = Focus.until(c) }) { Text("$m min") }
                                }
                            }
                            Text("When it ends: a real break. Stand up, drink water, look out of a window.", style = MaterialTheme.typography.bodySmall)
                        }
                        Text("${Focus.focusedMinutes(c)} focused minutes today. No targets, no streaks.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            if (!serviceOn && !BuildConfig.FOCUS_GUARD) item {
                FlatCard {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Focus can't close apps yet", style = MaterialTheme.typography.titleMedium)
                        Text("Closing apps needs a permission Google reviews separately; it comes in a later version. Focus blocks still work; the apps you pick below stay open.", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
            if (!serviceOn && BuildConfig.FOCUS_GUARD) item {
                FlatCard {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Let Focus close apps", style = MaterialTheme.typography.titleMedium)
                        Text("To close apps during a block, Aspiran needs to see which app is open. Turn it on once in Settings.", style = MaterialTheme.typography.bodyMedium)
                        Button(onClick = { explain = true }) { Text("Turn on") }
                    }
                }
            }
            item {
                Text("Apps to close during focus blocks", style = MaterialTheme.typography.titleMedium)
                Text("Daily limits work any time: once the minutes are used, the app closes until midnight.", style = MaterialTheme.typography.bodySmall)
            }
            items(apps, key = { it.pkg }) { app ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = app.pkg in blocked, onCheckedChange = { on ->
                        blocked = if (on) blocked + app.pkg else blocked - app.pkg
                        Focus.setBlocked(c, blocked)
                    })
                    Column(Modifier.weight(1f)) {
                        Text(app.label)
                        limits[app.pkg]?.let { m -> Text("Limit $m min a day · ${Focus.usedSeconds(c, app.pkg) / 60} used today", style = MaterialTheme.typography.bodySmall) }
                    }
                    TextButton(onClick = { limitFor = app.pkg }) { Text(if (app.pkg in limits) "Change limit" else "Daily limit") }
                }
            }
            item { Text("Desktop too: the focus extension closes sites during the same kind of block. See the web app's Focus page.", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(vertical = 16.dp)) }
        }
    }

    if (explain) AlertDialog(
        onDismissRequest = { explain = false },
        title = { Text("How Focus uses Accessibility") },
        text = {
            Text(
                "Aspiran uses Android's Accessibility service only to see which app is in front, so it can show the “closed for now” screen over apps you chose. " +
                    "It doesn't read what's on your screen, what you type, or anything inside other apps, and nothing leaves your phone. You can turn it off any time in Settings.",
            )
        },
        confirmButton = { Button(onClick = { explain = false; Focus.openSettings(c) }) { Text("Open Settings") } },
        dismissButton = { TextButton(onClick = { explain = false }) { Text("Not now") } },
    )

    if (confirmStop) {
        var wait by remember { mutableIntStateOf(Focus.pauseSeconds(c)) }
        LaunchedEffect(Unit) { while (wait > 0) { delay(1000); wait-- } }
        AlertDialog(
            onDismissRequest = { confirmStop = false },
            title = { Text("Stop the session?") },
            text = { Text("Take a breath first. If you still want to stop, that's fine.") },
            confirmButton = { Button(onClick = { confirmStop = false }) { Text("Keep going") } },
            dismissButton = { TextButton(enabled = wait == 0, onClick = { confirmStop = false; Focus.stop(c); until = 0 }) { Text(if (wait > 0) "Stop ($wait)" else "Stop") } },
        )
    }

    limitFor?.let { pkg ->
        var text by remember(pkg) { mutableStateOf(limits[pkg]?.toString() ?: "30") }
        AlertDialog(
            onDismissRequest = { limitFor = null },
            title = { Text("Daily limit: ${Focus.labelOf(c, pkg)}") },
            text = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(text, { text = it.filter(Char::isDigit).take(4) }, singleLine = true, modifier = Modifier.width(120.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                    Text("  minutes a day")
                }
            },
            confirmButton = { Button(onClick = { Focus.setLimit(c, pkg, text.toIntOrNull()); limits = Focus.limits(c); limitFor = null }) { Text("Save") } },
            dismissButton = { TextButton(onClick = { Focus.setLimit(c, pkg, null); limits = Focus.limits(c); limitFor = null }) { Text("No limit") } },
        )
    }
}
