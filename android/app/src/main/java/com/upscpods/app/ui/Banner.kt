package com.upscpods.app.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Announcement

/**
 * One announcement from the admin console, under the top bar. Calm colours even when "important":
 * it's news, not an alarm. The member can close it, and it stays closed on this phone.
 */
@Composable
fun AnnouncementBanner(a: Announcement, onOpenLink: (String) -> Unit, onDismiss: () -> Unit) {
    val important = a.level == "important"
    Surface(
        color = if (important) MaterialTheme.colorScheme.tertiaryContainer else MaterialTheme.colorScheme.secondaryContainer,
        modifier = Modifier.fillMaxWidth().semantics { liveRegion = LiveRegionMode.Polite },
    ) {
        Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(a.title, style = MaterialTheme.typography.titleSmall)
                if (a.body.isNotBlank()) Text(a.body, style = MaterialTheme.typography.bodySmall)
                // Only web links open; anything else in the field is ignored.
                a.link?.takeIf { it.startsWith("https://") }?.let { link ->
                    TextButton(onClick = { onOpenLink(link) }, modifier = Modifier.padding(0.dp)) { Text("Read more") }
                }
            }
            TextButton(onClick = onDismiss) { Text("Close") }
        }
    }
}
