package com.upscpods.app.ui

import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

// "How sure are you?" before the options open, on every practice question (trailer claim 2, 14 Nov 2026; the web
// app's mcqBlock does the same). Under Prelims' negative marking, knowing when you're guessing is a skill. Sure and
// not-sure answers are tallied on this phone only, for You vs. you. Never scored, never shared.

/** The two buttons. [onPick] gets true for Sure. */
@Composable
fun SureFirst(hindi: Boolean = false, onPick: (Boolean) -> Unit) {
    FlatCard {
        Column(androidx.compose.ui.Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(if (hindi) "देखने से पहले" else "Before you look", style = MaterialTheme.typography.labelMedium)
            Text(if (hindi) "कितने पक्के हैं?" else "How sure are you?", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { onPick(true) }) { Text(if (hindi) "पक्का" else "Sure") }
                OutlinedButton(onClick = { onPick(false) }) { Text(if (hindi) "पक्का नहीं" else "Not sure") }
            }
        }
    }
}

/** The line under a wrong answer you were sure of. */
fun sureWrongLine(hindi: Boolean = false) =
    if (hindi) "आप पक्के थे, फिर भी ग़लत: Prelims में यही सबसे महँगा पड़ता है (−⅓)। यह अब याद रहेगा।"
    else "You were sure, and it was wrong: in Prelims that's the costly kind (−⅓). It'll stick now."

/** Running totals on this phone: right and asked when sure, right and asked when not sure. */
object Calibration {
    data class Tally(val sureRight: Int, val sureTotal: Int, val unsureRight: Int, val unsureTotal: Int)

    private fun prefs(context: Context) = context.getSharedPreferences("calibration", Context.MODE_PRIVATE)

    fun log(context: Context, sure: Boolean, right: Boolean) {
        val p = prefs(context)
        val (r, t) = if (sure) "sureRight" to "sureTotal" else "unsureRight" to "unsureTotal"
        p.edit().putInt(r, p.getInt(r, 0) + if (right) 1 else 0).putInt(t, p.getInt(t, 0) + 1).apply()
    }

    fun tally(context: Context): Tally = prefs(context).let {
        Tally(it.getInt("sureRight", 0), it.getInt("sureTotal", 0), it.getInt("unsureRight", 0), it.getInt("unsureTotal", 0))
    }
}
