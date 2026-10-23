package com.upscpods.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Metrics
import kotlinx.coroutines.delay

/**
 * The one-tap rating after a key moment (Metrics.rateAfter): three faces and "not now". It goes away by itself after
 * 25 seconds. Only the moment and 1-3 are sent.
 */
@Composable
fun RatingSheet(modifier: Modifier = Modifier) {
    val moment = Metrics.pendingRating ?: return
    var thanked by remember(moment) { mutableStateOf(false) }
    LaunchedEffect(moment) { delay(25_000); if (Metrics.pendingRating == moment) Metrics.dismissRating() }
    LaunchedEffect(thanked) { if (thanked) { delay(1_500); Metrics.dismissRating() } }
    Card(modifier.fillMaxWidth().padding(horizontal = 16.dp), elevation = CardDefaults.cardElevation(6.dp)) {
        if (thanked) {
            Text("Thanks. That helps us make it better.", Modifier.padding(16.dp), style = MaterialTheme.typography.bodyMedium)
            return@Card
        }
        Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(Metrics.RATING_QUESTIONS[moment] ?: "", Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
            listOf(Triple("👎", "Not really", 1), Triple("😐", "Okay", 2), Triple("👍", "Yes", 3)).forEach { (face, label, r) ->
                TextButton(onClick = { Metrics.sendRating(moment, r); thanked = true }, modifier = Modifier.semantics { contentDescription = label }) { Text(face) }
            }
            TextButton(onClick = { Metrics.dismissRating() }, modifier = Modifier.semantics { contentDescription = "Not now" }) { Text("×") }
        }
    }
}

/** Day 7: two questions with fixed choices, two taps. Shown on the Adda until answered or put away. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CheckinCard() {
    var shown by remember { mutableStateOf(Metrics.checkinDue()) }
    var q1 by remember { mutableStateOf<Int?>(null) }
    var done by remember { mutableStateOf(false) }
    if (!shown) return
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (done) { Text("Thank you. We read every answer.", style = MaterialTheme.typography.bodyMedium); return@Column }
            val (question, choices) = if (q1 == null) Metrics.CHECKIN_Q1 else Metrics.CHECKIN_Q2
            if (q1 == null) Text("A week in. Two quick taps?", style = MaterialTheme.typography.labelMedium)
            Text(question, style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                choices.forEachIndexed { i, c ->
                    OutlinedButton(onClick = {
                        val first = q1
                        if (first == null) q1 = i else { Metrics.sendCheckin(first, i); done = true }
                    }) { Text(c) }
                }
            }
            if (q1 == null) TextButton(onClick = { Metrics.dismissCheckin(); shown = false }) { Text("Not now") }
        }
    }
}
