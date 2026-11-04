package com.upscpods.app.ui

import android.content.Context
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.ui.Alignment
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

// Light and dark. Dark is the default (owner, 4 Nov 2026); "Match my phone" follows the system. The ☀ / ☾ button in the
// top bar flips between the two on every tab; Me → Appearance has all three. Same choices as the web app.
object ThemeChoice {
    enum class Mode(val key: String, val label: String) { DARK("dark", "Dark (the default)"), LIGHT("light", "Light"), SYSTEM("system", "Match my phone") }

    var mode by mutableStateOf(Mode.DARK)
        private set

    private fun prefs(context: Context) = context.getSharedPreferences("ui", Context.MODE_PRIVATE)

    fun init(context: Context) {
        val key = prefs(context).getString("theme", Mode.DARK.key)
        mode = Mode.entries.firstOrNull { it.key == key } ?: Mode.DARK
    }

    fun set(context: Context, m: Mode) {
        mode = m
        prefs(context).edit().putString("theme", m.key).apply()
    }
}

/** Whether the app is dark right now. */
@Composable
fun isDark(): Boolean = when (ThemeChoice.mode) {
    ThemeChoice.Mode.DARK -> true
    ThemeChoice.Mode.LIGHT -> false
    ThemeChoice.Mode.SYSTEM -> isSystemInDarkTheme()
}

/** The top-bar switch: shows where a tap takes you. */
@Composable
fun ThemeToggle(context: Context, modifier: Modifier = Modifier) {
    val dark = isDark()
    TextButton(
        onClick = { ThemeChoice.set(context, if (dark) ThemeChoice.Mode.LIGHT else ThemeChoice.Mode.DARK) },
        modifier = modifier.semantics { contentDescription = if (dark) "Switch to light mode" else "Switch to dark mode" },
    ) { Text(if (dark) "☀ Light" else "☾ Dark") }
}

/** Me → Appearance: the three choices, the current one ticked. */
@Composable
fun AppearanceCard(context: Context) {
    FlatCard {
        androidx.compose.foundation.layout.Column(androidx.compose.ui.Modifier.padding(16.dp)) {
            Text("Appearance", style = MaterialTheme.typography.titleMedium)
            Text(if (isDark()) "Dark mode is on" else "Light mode is on", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            ThemeChoice.Mode.entries.forEach { m ->
                Row(Modifier.fillMaxWidth().height(48.dp).selectable(selected = ThemeChoice.mode == m, role = Role.RadioButton) { ThemeChoice.set(context, m) },
                    verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = ThemeChoice.mode == m, onClick = null)
                    Text(m.label, Modifier.padding(start = 8.dp), style = MaterialTheme.typography.bodyLarge)
                }
            }
            Text("The ☀ / ☾ button at the top of every screen switches too.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
