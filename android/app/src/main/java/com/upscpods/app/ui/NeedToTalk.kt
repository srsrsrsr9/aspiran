package com.upscpods.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.upscpods.app.Helplines

/** "Need to talk?" Reachable in 2 taps from anywhere (overflow menu, My Path). Never a red SOS button. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NeedToTalkSheet(onDial: (String) -> Unit, onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("Need to talk? · किसी से बात करनी है?", style = MaterialTheme.typography.titleLarge)
            Text("Free, confidential, any time.", style = MaterialTheme.typography.bodyMedium)
            Helplines.all.forEach { h ->
                OutlinedButton(onClick = { onDial(h.dial) }, modifier = Modifier.fillMaxWidth()) { Text("Call ${h.label}") }
            }
            // Buddy and pod lead need the pod server; shown so people know they're coming.
            OutlinedButton(onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth()) { Text("Message my buddy") }
            OutlinedButton(onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth()) { Text("Message my pod lead") }
        }
    }
}
