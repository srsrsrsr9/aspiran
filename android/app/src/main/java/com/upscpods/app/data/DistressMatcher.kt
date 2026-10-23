package com.upscpods.app.data

/**
 * On-device check for distress phrases in English, Hindi and Hinglish.
 * A match shows the writer a private support line; the bot never replies.
 * Starter list only: it needs review by a mental-health professional and Hindi-medium testers,
 * and the human-moderator alert arrives with the server slice.
 * Reviewed phrases for other languages come from the server's /config (see AppConfig) and are added here.
 */
object DistressMatcher {
    private val phrases = listOf(
        "kill myself", "end my life", "want to die", "end it all", "no reason to live", "suicide",
        "मरना चाहता", "मरना चाहती", "जीना नहीं चाहता", "जीना नहीं चाहती", "खुदकुशी", "आत्महत्या",
        "marna chahta", "marna chahti", "jeena nahi chahta", "jeena nahi chahti", "khudkushi", "sab khatam kar",
    )

    /** Extra phrases from /config, kept from the last answer so they work offline too. */
    @Volatile var extra: List<String> = emptyList()

    /** Told about every match, so offers stay away for a day afterwards (set by the app). */
    @Volatile var onMatch: (() -> Unit)? = null

    fun matches(text: String): Boolean {
        val t = text.lowercase()
        return (phrases.any { it in t } || extra.any { it.isNotBlank() && it.lowercase() in t }).also { if (it) onMatch?.invoke() }
    }
}
