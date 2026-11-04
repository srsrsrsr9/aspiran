package com.upscpods.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * How Aspiran teaches: the method in six lines, shown with the syllabus garden wherever the garden leads
 * (owner, 4 Nov 2026). The same lines as the web app's pitchCard and the website's rooms.
 */
val PITCH = listOf(
    "Recall, not re-reading" to "Close the book and pull it out of your head. That's what makes it stay.",
    "Review just before you'd forget" to "Short reviews, with gaps that grow from a day to a week to months.",
    "Write, mark, rewrite" to "Mains answers on paper, marked, then rewritten. Essays in three snaps: skeleton, outline, essay.",
    "News tied to the syllabus" to "Every Chai card is pinned to the syllabus lines it belongs to.",
    "Know how sure you are" to "Say how sure you were before you see the answer. Only ever against your own past.",
    "One step at a time" to "Today shows the next thing to do, never the whole mountain at once.",
)

/** The six ideas. With [startOpen] false only the heading shows until tapped (for people past their first week). */
@Composable
fun PedagogyCard(modifier: Modifier = Modifier, startOpen: Boolean = true) {
    var open by rememberSaveable { mutableStateOf(startOpen) }
    FlatCard(modifier) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("How Aspiran teaches", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Text("The way memory actually works, built into every day.", style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (open) PITCH.forEachIndexed { i, (title, line) ->
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(Modifier.size(24.dp).background(MaterialTheme.colorScheme.primary.copy(alpha = 0.18f), CircleShape), contentAlignment = Alignment.Center) {
                        Text("${i + 1}", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                    Column {
                        Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        Text(line, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            } else TextButton(onClick = { open = true }) { Text("The six ideas") }
        }
    }
}
