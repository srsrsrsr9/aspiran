package com.upscpods.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Focus
import com.upscpods.app.ui.PodsTheme
import kotlinx.coroutines.delay

/** The calm screen shown over a closed app. "Back to studying" is the main button; opening anyway waits a few seconds. */
class BlockedActivity : AppCompatActivity() {
    companion object {
        const val PKG = "pkg"
        const val WHY = "why"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pkg = intent.getStringExtra(PKG) ?: return finish()
        val why = runCatching { Focus.Why.valueOf(intent.getStringExtra(WHY) ?: "") }.getOrDefault(Focus.Why.FOCUS)
        val name = Focus.labelOf(this, pkg)
        setContent {
            PodsTheme {
                Surface(Modifier.fillMaxSize()) {
                    BackHandler { backToStudying() }
                    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
                    var wait by remember { mutableIntStateOf(Focus.pauseSeconds(this)) }
                    LaunchedEffect(Unit) {
                        while (true) {
                            delay(1000)
                            now = System.currentTimeMillis()
                            if (wait > 0) wait--
                            if (why == Focus.Why.FOCUS && !Focus.active(this@BlockedActivity)) { finish(); break }
                        }
                    }
                    Column(
                        Modifier.fillMaxSize().padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        if (why == Focus.Why.FOCUS) {
                            val label = Focus.label(this@BlockedActivity)
                            Text(if (label.isNotBlank()) "You're in a focus block: $label" else "You're in a focus block", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
                            Text("$name is closed until it ends.", textAlign = TextAlign.Center)
                            val left = ((Focus.until(this@BlockedActivity) - now) / 1000).coerceAtLeast(0)
                            Text("%d:%02d".format(left / 60, left % 60), style = MaterialTheme.typography.displayMedium)
                        } else {
                            val minutes = Focus.limits(this@BlockedActivity)[pkg] ?: 0
                            Text("That's your $minutes minutes of $name for today", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
                            Text("It opens again tomorrow.", textAlign = TextAlign.Center)
                        }
                        Text("Take a breath. What were you about to study?", textAlign = TextAlign.Center)
                        Button(onClick = { backToStudying() }) { Text("Back to studying") }
                        OutlinedButton(enabled = wait == 0, onClick = {
                            Focus.allow(this@BlockedActivity, pkg)
                            packageManager.getLaunchIntentForPackage(pkg)?.let { startActivity(it) }
                            finish()
                        }) { Text(if (wait > 0) "Open for ${Focus.ALLOW_MINUTES} minutes ($wait)" else "Open for ${Focus.ALLOW_MINUTES} minutes") }
                    }
                }
            }
        }
    }

    private fun backToStudying() {
        startActivity(Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP))
        finish()
    }
}
