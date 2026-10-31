package com.upscpods.app.ui

import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.padding
import java.util.Locale

/**
 * "Read aloud · device voice": the phone's own text-to-speech reads [text]. Nothing is sent anywhere and no AI voice
 * is involved. Only on a tap, never autoplays; stops when the screen or card goes away. The language follows the
 * text (Devanagari reads in Hindi), so a Hindi screen that falls back to English text still reads in English.
 */
@Composable
fun ReadAloudButton(text: String, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val hindi = remember(text) { text.any { it in 'ऀ'..'ॿ' } }
    var tts by remember { mutableStateOf<TextToSpeech?>(null) }
    var speaking by remember { mutableStateOf(false) }
    var problem by remember { mutableStateOf<String?>(null) }

    DisposableEffect(text) {
        onDispose { tts?.stop(); tts?.shutdown(); tts = null; speaking = false }
    }

    fun speak(engine: TextToSpeech) {
        val locale = if (hindi) Locale.forLanguageTag("hi-IN") else Locale.forLanguageTag("en-IN")
        val ok = engine.setLanguage(locale)
        if (ok == TextToSpeech.LANG_MISSING_DATA || ok == TextToSpeech.LANG_NOT_SUPPORTED) {
            if (hindi || engine.setLanguage(Locale.UK) < 0) {
                problem = if (hindi) "इस फ़ोन में हिंदी आवाज़ नहीं है। Settings → Text-to-speech में जोड़ें।"
                else "This phone has no English voice. Add one in Settings → Text-to-speech."
                return
            }
        }
        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onDone(id: String?) { if (id == "last") speaking = false }
            @Deprecated("Deprecated in Java") override fun onError(id: String?) { speaking = false }
        })
        val max = TextToSpeech.getMaxSpeechInputLength() - 1
        val parts = text.split(Regex("\n+")).map { it.trim() }.filter { it.isNotEmpty() }.flatMap { it.chunked(max) }
        parts.forEachIndexed { i, p ->
            engine.speak(p, if (i == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD, null, if (i == parts.lastIndex) "last" else "p$i")
        }
        speaking = parts.isNotEmpty()
    }

    OutlinedButton(onClick = {
        problem = null
        val engine = tts
        when {
            speaking -> { engine?.stop(); speaking = false }
            engine != null -> speak(engine)
            else -> {
                var made: TextToSpeech? = null
                made = TextToSpeech(context.applicationContext) { status ->
                    if (status == TextToSpeech.SUCCESS) made?.let { speak(it) }
                    else problem = if (hindi) "फ़ोन की आवाज़ शुरू नहीं हो सकी।" else "The phone's voice couldn't start."
                }
                tts = made
            }
        }
    }, modifier = modifier.padding(top = 8.dp)) {
        Text(
            when {
                speaking -> if (hindi) "■ रोकें" else "■ Stop"
                hindi -> "🔈 सुनें · फ़ोन की आवाज़"
                else -> "🔈 Read aloud · device voice"
            },
        )
    }
    problem?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error) }
}
