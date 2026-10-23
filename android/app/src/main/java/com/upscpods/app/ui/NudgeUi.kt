package com.upscpods.app.ui

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Nudge

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
