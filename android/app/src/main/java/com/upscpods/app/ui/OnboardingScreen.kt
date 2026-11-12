package com.upscpods.app.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import androidx.compose.ui.platform.LocalContext
import com.upscpods.app.data.Attempt
import com.upscpods.app.data.Community
import com.upscpods.app.data.LanguageRequests
import com.upscpods.app.data.Nudge
import com.upscpods.app.data.Persona
import com.upscpods.app.data.ReadingLanguage
import com.upscpods.app.data.Stage
import com.upscpods.app.data.StudyHours
import com.upscpods.app.data.syllabusFor

private enum class Step { WELCOME, LANGUAGE, SIGN_IN, CONSENT, NAME, MEET }

/**
 * First run, community-first: a welcome in eleven languages, then language (with "Request your language"), then sign in
 * (phone or Google; [signIn] is null when the server doesn't require it yet), then 18+ and consent, then a nickname,
 * then the whole syllabus as a creeper garden (so the breadth is seen on day one), then Meet Chotu, then the Adda.
 * Everything else about you is asked later, one small question at a time, when it helps (Me → Profile).
 * Consent and the 18+ check come before any question about you. "Not now" on consent still opens the app.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnboardingScreen(
    requests: LanguageRequests,
    community: Community,
    signIn: (@Composable (onDone: () -> Unit) -> Unit)? = null,
    onFinish: (consented: Boolean, persona: Persona?) -> Unit,
) {
    var step by rememberSaveable { mutableStateOf(Step.WELCOME) }
    var adult by rememberSaveable { mutableStateOf(false) }
    var name by rememberSaveable { mutableStateOf("") }
    // English is picked from the start, so Next never waits on a tap (or on the network).
    var language by rememberSaveable { mutableStateOf(ReadingLanguage.ENGLISH) }
    val context = LocalContext.current
    var chaiTime by rememberSaveable { mutableStateOf(Nudge.time(context)) }

    // Four screens at most (12 Nov 2026; it was six, and 44% of people left before the end): a question and the language,
    // sign in, the consent, then name and Chotu together. The garden and the six ideas open Today for everyone anyway.
    val steps = Step.entries.filter { it != Step.LANGUAGE && it != Step.NAME && (it != Step.SIGN_IN || signIn != null) }
    var pick by rememberSaveable { mutableStateOf(-1) }
    fun next() { step = steps[steps.indexOf(step) + 1] }
    fun back() { if (steps.indexOf(step) > 0) step = steps[steps.indexOf(step) - 1] }
    // Stage, attempts and hours start neutral; the staged questions fill in the real answers later.
    fun persona() = Persona(
        name = name.trim(),
        stage = Stage.STARTING,
        attempt = Attempt.FIRST,
        language = language,
        hours = StudyHours.TWO_TO_4,
    )

    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.surface) {
        Column(Modifier.fillMaxSize().safeDrawingPadding().padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                if (step == Step.SIGN_IN || step == Step.MEET) TextButton(onClick = { back() }) { Text("← Back") }
                Spacer(Modifier.weight(1f))
            }
            if (step != Step.WELCOME) StepDots(total = steps.size - 1, current = steps.indexOf(step) - 1)

            AnimatedContent(
                targetState = step,
                transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(150)) },
                modifier = Modifier.weight(1f),
                label = "onboarding",
            ) { s ->
                Column(
                    Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(top = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    when (s) {
                        Step.WELCOME -> {
                            // One question to answer before anything is asked of you: the method, felt in ten seconds.
                            Text("Remember what you read.", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold)
                            Text("UPSC prep that sticks, and never alone. One question first:", style = ReadingText)
                            FlatCard {
                                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text("How many times has the Preamble to the Constitution been amended?", fontWeight = FontWeight.Bold)
                                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        listOf("Never", "Once", "Twice", "No idea").forEachIndexed { i, label ->
                                            FilterChip(selected = pick == i || (pick >= 0 && i == 1), enabled = pick < 0 || pick == i || i == 1, onClick = { if (pick < 0) pick = i }, label = { Text(label) })
                                        }
                                    }
                                    if (pick >= 0) {
                                        Text((if (pick == 1) "Right. " else "") + "Once, in 1976: the 42nd Amendment added socialist, secular and integrity.")
                                        Text("You answered first, then looked. That's how Aspiran works, and this one comes back in a week, just before you'd forget it.",
                                            style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                            }
                            Label("Which language do you read in? · आप किस भाषा में पढ़ते हैं?")
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                ReadingLanguage.entries.forEach { l ->
                                    FilterChip(selected = language == l, onClick = { language = l }, label = { Text(l.label) })
                                }
                            }
                            Text("Your pod, the daily Chai, practice and ${Brand.MASCOT_SHORT}. Free, no card needed.", style = MaterialTheme.typography.bodySmall)
                        }
                        // From here Chotu hosts each step in a speech bubble.
                        Step.LANGUAGE -> {
                            ChotuSays("First, which language do you read in? English is already picked. Tap another if you like.")
                            Label("Which language do you read in? · आप किस भाषा में पढ़ते हैं?")
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                ReadingLanguage.entries.forEach { l ->
                                    FilterChip(selected = language == l, onClick = { language = l }, label = { Text(l.label) })
                                }
                            }
                            Text("This also picks your pod's language. Change it any time in Me.", style = MaterialTheme.typography.bodySmall)
                            // Asking for another language is a vote for later; it doesn't change the choice above.
                            RequestLanguageCard(requests, community)
                        }
                        Step.SIGN_IN -> {
                            ChotuSays("Now sign in, so your pod, stamps and settings stay yours, and the Adda stays safe. Your number or email is only for signing in: your pod never sees it, and it never goes to me.")
                            if (com.upscpods.app.data.Auth.signedIn) Text("You're signed in.", style = MaterialTheme.typography.bodyLarge)
                            else signIn?.invoke { next() }
                        }
                        Step.CONSENT -> {
                            ChotuSays("Before I ask anything about you, here's the deal, in plain words.", ChotuMood.CALM)
                            Consent(adult) { adult = it }
                        }
                        Step.NAME -> {
                            ChotuSays("What should I call you? A first name or a nickname is perfect. Your pod sees this.")
                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it.take(24) },
                                placeholder = { Text("e.g. Priya, or ChaiAndPolity") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                        }
                        Step.MEET -> {
                            Label("What should we call you in your pod?")
                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it.take(24) },
                                placeholder = { Text("A first name or a nickname. You can leave it empty.") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            ChotuSays(
                                "I'm ${Brand.MASCOT_SHORT}, the app's AI. I keep your pod company, explain the news simply, and stay quiet unless you ask. " +
                                    "I can be wrong, I'm not a counsellor, and I never predict ranks.",
                                ChotuMood.PROUD,
                            )
                            Label("A morning chai nudge?")
                            Text("One nudge, “Chai's ready.” Nothing else. Switch it off any time in Me.", style = MaterialTheme.typography.bodySmall)
                            ChaiTimePicker(chaiTime) { chaiTime = it }
                        }
                    }
                }
            }

            when (step) {
                Step.CONSENT -> Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Equal visual weight for both choices (dark-pattern guidelines).
                    OutlinedButton(
                        onClick = { onFinish(false, null) },
                        modifier = Modifier.weight(1f).height(MainActionHeight),
                    ) { Text("Not now") }
                    OutlinedButton(
                        onClick = { next() },
                        enabled = adult,
                        modifier = Modifier.weight(1f).height(MainActionHeight),
                    ) { Text("I agree") }
                }
                Step.MEET -> PrimaryButton("Open the Adda") { Nudge.set(context, chaiTime); onFinish(true, persona()) }
                Step.WELCOME -> PrimaryButton("Come in", onClick = { next() })
                // The sign-in card has its own buttons; Next shows once signed in (e.g. after stepping back).
                Step.SIGN_IN -> if (com.upscpods.app.data.Auth.signedIn) PrimaryButton("Next", onClick = { next() })
                else -> PrimaryButton("Next", onClick = { next() })
            }
        }
    }
}

@Composable
private fun Consent(adult: Boolean, onAdult: (Boolean) -> Unit) {
    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Bullet("What you tell the app stays on this phone. It asks one small question at a time, only when it helps.")
            Bullet("Your sign-in (phone number or Google email) is kept only to sign you in. Your pod never sees it.")
            Bullet("To match your pod, only four answers go to our server: stage, attempts, language and study time. You'll see each one in Me → Profile, and can delete it.")
            Bullet("Your mood and Close the Day entries never leave this phone.")
            Bullet("We never sell or share your data, and there are no ads.")
            Bullet("Delete everything any time from Me, in two taps.")
        }
    }
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { onAdult(!adult) }) {
        Checkbox(checked = adult, onCheckedChange = onAdult)
        Text("I'm 18 or older", style = MaterialTheme.typography.bodyLarge)
    }
    Text(
        "Choosing “Not now” is fine. You can still read Today's Chai and use the Free Shelf, and we'll ask again only when you open your pod.",
        style = MaterialTheme.typography.bodySmall,
    )
}

@Composable
private fun Title(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(subtitle, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun Label(text: String) {
    Text(text, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
}

@Composable
private fun Bullet(text: String) {
    Text("• $text", style = MaterialTheme.typography.bodyMedium)
}

@Composable
private fun StepDots(total: Int, current: Int) {
    Row(Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        repeat(total) { i ->
            Box(
                Modifier.weight(1f).height(4.dp).background(
                    if (i <= current) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                    RoundedCornerShape(2.dp),
                ),
            )
        }
    }
}

@Composable
private fun PrimaryButton(label: String, enabled: Boolean = true, onClick: () -> Unit) {
    Button(onClick = onClick, enabled = enabled, modifier = Modifier.fillMaxWidth().height(MainActionHeight)) { Text(label) }
}
