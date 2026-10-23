package com.upscpods.app.ui

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Nudge
import com.upscpods.app.data.Ritual

/**
 * Chai-time chips plus "No nudge". Picking a time asks for notification permission right then,
 * in context (Android 13+). Saying no to the permission just means no nudge; nothing else changes.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ChaiTimePicker(selected: String?, onPick: (String?) -> Unit) {
    val context = LocalContext.current
    val ask = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Nudge.TIMES.forEach { t ->
            FilterChip(
                selected = selected == t,
                onClick = {
                    onPick(t)
                    if (Build.VERSION.SDK_INT >= 33 && !Nudge.canNotify(context)) ask.launch(Manifest.permission.POST_NOTIFICATIONS)
                },
                label = { Text(Nudge.label(t)) },
            )
        }
        FilterChip(selected = selected == null, onClick = { onPick(null) }, label = { Text("No nudge") })
    }
}

/**
 * The ritual picker (W4): Chotu's day-2 chat and My Path. Each ritual with its slot, chai time under Morning Chai,
 * and the rules in one line. Quiz night needs a pod, since that's where it runs.
 */
@Composable
fun RitualPicker(picks: Set<Ritual>, chaiTime: String?, hindi: Boolean, inPod: Boolean, onChange: (Set<Ritual>, String?) -> Unit) {
    val context = LocalContext.current
    val ask = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }
    val askOnce = { if (Build.VERSION.SDK_INT >= 33 && !Nudge.canNotify(context)) ask.launch(Manifest.permission.POST_NOTIFICATIONS) }
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Ritual.PICKABLE.forEach { r ->
            val enabled = r != Ritual.QUIZ_NIGHT || inPod
            val on = r in picks && enabled
            Row(
                Modifier.fillMaxWidth().heightIn(min = 48.dp)
                    .toggleable(value = on, enabled = enabled, role = Role.Checkbox) { v ->
                        if (v) askOnce()
                        onChange(if (v) picks + r else picks - r, if (r == Ritual.CHAI && v) chaiTime ?: Nudge.TIMES[1] else chaiTime)
                    },
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Checkbox(checked = on, onCheckedChange = null, enabled = enabled)
                Column(Modifier.padding(start = 8.dp).weight(1f)) {
                    Text(r.title(hindi), style = MaterialTheme.typography.titleSmall)
                    Text(if (enabled) r.slot(hindi) else if (hindi) "पॉड में चलता है: पॉड मिलने पर" else "Runs in pods: once you have one",
                        style = MaterialTheme.typography.bodySmall)
                }
            }
            if (r == Ritual.CHAI && on) Box(Modifier.padding(start = 48.dp)) {
                ChaiTimePicker(chaiTime) { t -> onChange(if (t == null) picks - Ritual.CHAI else picks, t) }
            }
        }
        Text(
            if (hindi) "दिन में ज़्यादा से ज़्यादा 2, रात 10:30 के बाद कभी नहीं। कोई 3 बार छूट जाए तो वह हफ़्ते में एक बार हो जाता है।"
            else "Two a day at most, never after 10:30 pm. Skip one three times and it drops to once a week.",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}
