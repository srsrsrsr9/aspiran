package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** Who the member is, from onboarding. Stored only on the phone. Pod matching uses stage, attempt band and language. */
@Serializable
data class Persona(
    val name: String = "",
    val stage: Stage,
    val attempt: Attempt,
    val showAttempt: Boolean = false,
    val language: ReadingLanguage,
    val hours: StudyHours,
    val bestTime: String? = null,
    val shaky: List<String> = emptyList(),
    val story: String = "",
) {
    /** Part-time mode swaps task 3 for a 5-minute outline (ux-guide.md section 1). */
    val partTime: Boolean get() = stage == Stage.WORKING || hours == StudyHours.UNDER_2

    val title: String get() = when {
        attempt == Attempt.FOURTH_PLUS -> "The Seasoned Guide"
        stage == Stage.WORKING -> "The Night-Shift Scholar"
        stage == Stage.RESTARTING -> "The Comeback Brew"
        stage == Stage.WAITING -> "The Waiting-Room Hero"
        else -> "The Fresh Brew"
    }

    val podLine: String get() {
        val band = when (attempt) {
            Attempt.FIRST -> "first attempt"
            Attempt.SECOND, Attempt.THIRD -> "2nd–3rd attempt"
            Attempt.FOURTH_PLUS -> "4th attempt and beyond"
        }
        return "6–8 people · $band · ${stage.short} · ${language.label}"
    }
}

@Serializable
enum class Stage(val label: String, val short: String, val example: String) {
    STARTING("Just starting for 2027", "starting out", "“I've bought Laxmikanth. Now what?”"),
    RESTARTING("Restarting after Prelims", "restarting", "“Missed the cutoff. Going again, smarter.”"),
    WAITING("Waiting for my Mains result", "awaiting Mains", "“Refreshing the UPSC site every hour…”"),
    WORKING("Working and preparing", "working + prep", "“Office 9 to 6. Books 6 to 9.”"),
}

@Serializable
enum class Attempt(val label: String) { FIRST("1st"), SECOND("2nd"), THIRD("3rd"), FOURTH_PLUS("4th+") }

@Serializable
enum class ReadingLanguage(val label: String) { ENGLISH("English"), HINDI("हिंदी"), BOTH("Both") }

@Serializable
enum class StudyHours(val label: String) { UNDER_2("Under 2 hrs"), TWO_TO_4("2–4 hrs"), FOUR_TO_8("4–8 hrs"), EIGHT_PLUS("8+ hrs") }

/** Onboarding result and consent, kept in app-private storage on the phone. */
object ProfileStore {
    const val CONSENT_VERSION = 1
    private const val PREFS = "profile"
    private val json = Json { ignoreUnknownKeys = true }

    data class Profile(val onboarded: Boolean, val consented: Boolean, val persona: Persona?)

    fun load(context: Context): Profile {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val persona = p.getString("persona", null)?.let {
            runCatching { json.decodeFromString(Persona.serializer(), it) }.getOrNull()
        }
        return Profile(p.getBoolean("onboarded", false), p.getInt("consent", 0) >= CONSENT_VERSION, persona)
    }

    fun save(context: Context, consented: Boolean, persona: Persona?) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean("onboarded", true)
            .putInt("consent", if (consented) CONSENT_VERSION else 0)
            .putLong("consentAt", if (consented) System.currentTimeMillis() else 0L)
            .putString("persona", persona?.let { json.encodeToString(Persona.serializer(), it) })
            .apply()
    }

    /** "Delete my data": two taps from My Path. */
    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }
}
