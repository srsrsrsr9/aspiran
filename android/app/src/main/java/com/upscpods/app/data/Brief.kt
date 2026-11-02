package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** One day's Chai pack, as the server will publish it (bundled sample for now). */
@Serializable
data class Brief(
    val date: String,
    val sample: Boolean = false,
    val items: List<NewsItem>,
) {
    /** Chotu jokes: LIGHT cards only, and at most 1 in 5 cards. */
    fun jokeCardIds(): Set<String> {
        val budget = maxOf(1, items.size / 5)
        return items.filter { it.tone == Tone.LIGHT && it.chotu != null }
            .take(budget)
            .map { it.id }
            .toSet()
    }
}

/** A Chai Card. Zones are rendered in a fixed order; see ChaiScreen.kt. */
@Serializable
data class NewsItem(
    val id: String,
    val tone: Tone,
    // Zone 1: lens chips
    val gsPaper: String,
    val topic: String,
    val examType: ExamType,
    val staticLink: String,
    // Zone 2 and 3
    val headline: String,
    val summary: String,
    val glossary: List<String> = emptyList(),
    // Zone 4
    val whyForUpsc: List<String>,
    // Zone 5
    val examCorner: ExamCorner,
    // Zone 6: trust footer
    val sources: List<Source>,
    val checkedBy: String? = null,
    val checkedOn: String? = null,
    val chotu: String? = null,
    /** Lens chips as the editor wrote them (content packs). Older cards build them from the fields above. */
    val chips: List<String> = emptyList(),
    /** One line for the share card. */
    val takeaway: String? = null,
    /** Server path of the card's drawing (/media/...). Skipped in data saver. */
    val illustration: String? = null,
    val shareable: Boolean = true,
    /** Set when editors wrote the card themselves rather than editing an AI draft. */
    val writtenBy: String? = null,
    /** An editor marked it high value for Mains (about 1 in 5): the card adds one quiet line suggesting you keep it. */
    val highValue: Boolean = false,
    /** Hindi version, written natively (not machine-translated) and checked by a Hindi editor. */
    val hi: CardText? = null,
) {
    /** The card's text in one language. Never mixes the two in one summary. */
    fun text(hindi: Boolean): CardView {
        val h = hi
        return if (hindi && h != null) {
            CardView(
                h.headline, h.summary, h.glossary, h.whyForUpsc, h.mcq, h.mainsPrompt, h.keyFacts,
                h.chotu ?: chotu, h.checkedBy, h.checkedOn, CardLabels.HI,
                h.chips.ifEmpty { lensChips() }, h.takeaway ?: takeaway,
            )
        } else {
            CardView(
                headline, summary, glossary, whyForUpsc, examCorner.mcq, examCorner.mainsPrompt, examCorner.keyFacts,
                chotu, checkedBy, checkedOn, CardLabels.EN,
                lensChips(), takeaway,
            )
        }
    }
}

/** Zone 1, at most 4 chips. */
fun NewsItem.lensChips(): List<String> =
    chips.ifEmpty { listOf(gsPaper, topic, examType.label, staticLink).filter { it.isNotBlank() } }.take(4)

@Serializable
data class CardText(
    val headline: String,
    val summary: String,
    val glossary: List<String> = emptyList(),
    val whyForUpsc: List<String>,
    val mcq: Mcq? = null,
    val mainsPrompt: String? = null,
    val keyFacts: List<String>,
    /** Hinglish is fine here; only Chotu's lines and pod chat use it. */
    val chotu: String? = null,
    val checkedBy: String? = null,
    val checkedOn: String? = null,
    val chips: List<String> = emptyList(),
    val takeaway: String? = null,
)

data class CardView(
    val headline: String,
    val summary: String,
    val glossary: List<String>,
    val whyForUpsc: List<String>,
    val mcq: Mcq?,
    val mainsPrompt: String?,
    val keyFacts: List<String>,
    val chotu: String?,
    val checkedBy: String?,
    val checkedOn: String?,
    val labels: CardLabels,
    val chips: List<String> = emptyList(),
    val takeaway: String? = null,
)

/** Fixed UI words on a card, per reading language. Needs a Hindi-medium review before launch. */
data class CardLabels(
    val hindi: Boolean,
    val why: String,
    val openExam: String,
    val hideExam: String,
    val mains: String,
    val keyFacts: String,
    val noPyq: String,
    val right: String,
    val wrong: String,
    val save: String,
    val saved: String,
    val source: String,
    val drafted: String,
    val written: String,
    val share: String,
    val watch: String,
    val notChecked: String,
    val checked: (String, String) -> String,
    val report: String,
    val reported: String,
    val heavy: String,
    val switchTo: String,
) {
    companion object {
        val EN = CardLabels(
            hindi = false,
            why = "Why this matters for UPSC",
            openExam = "Open Exam Corner",
            hideExam = "Hide Exam Corner",
            mains = "Mains",
            keyFacts = "Key facts",
            noPyq = "No direct PYQ",
            right = "✓ Right. ",
            wrong = "○ Not quite. ",
            save = "Save for revision",
            saved = "✓ Saved for revision",
            source = "Source",
            drafted = "Summary drafted by AI from these sources",
            written = "Written by our editors",
            share = "Share this card",
            watch = "▶ Watch: 1 minute",
            notChecked = "Not yet checked by an editor",
            checked = { who, date -> "Checked by $who, $date ✓" },
            report = "Spot a mistake? Tell us",
            reported = "Thanks, an editor will look at it",
            heavy = "This one is heavy. It's okay to skip it.",
            switchTo = "हिंदी में पढ़ें",
        )
        val HI = CardLabels(
            hindi = true,
            why = "UPSC के लिए यह क्यों ज़रूरी है",
            openExam = "परीक्षा कोना खोलें",
            hideExam = "परीक्षा कोना बंद करें",
            mains = "मेन्स",
            keyFacts = "मुख्य तथ्य",
            noPyq = "इस पर सीधा PYQ नहीं",
            right = "✓ सही। ",
            wrong = "○ पूरा सही नहीं। ",
            save = "दोहराने के लिए सेव करें",
            saved = "✓ दोहराने के लिए सेव है",
            source = "स्रोत",
            drafted = "सार AI ने इन्हीं स्रोतों से तैयार किया",
            written = "हमारे संपादकों ने लिखा",
            share = "यह कार्ड शेयर करें",
            watch = "▶ देखें: 1 मिनट",
            notChecked = "अभी किसी संपादक ने नहीं जाँचा",
            checked = { who, date -> "$who ने $date को जाँचा ✓" },
            report = "कोई ग़लती दिखी? बताइए",
            reported = "धन्यवाद, संपादक इसे देखेंगे",
            heavy = "यह ख़बर भारी है। चाहें तो छोड़ सकते हैं।",
            switchTo = "Read in English",
        )
    }
}

@Serializable
data class ExamCorner(
    val mcq: Mcq? = null,
    val mainsPrompt: String? = null,
    val keyFacts: List<String>,
    /** Only from the verified PYQ database; null shows "No direct PYQ". */
    val pyq: String? = null,
)

@Serializable
data class Mcq(
    val question: String,
    val options: List<String>,
    val answerIndex: Int,
    val explanation: String,
)

@Serializable
data class Source(val name: String, val url: String)

@Serializable
enum class ExamType(val label: String) {
    @SerialName("prelims") PRELIMS("Prelims"),
    @SerialName("mains") MAINS("Mains"),
    @SerialName("both") BOTH("Prelims + Mains"),
}

@Serializable
enum class Tone(val label: String) {
    @SerialName("light") LIGHT("Light"),
    @SerialName("neutral") NEUTRAL("Neutral"),
    @SerialName("serious") SERIOUS("Serious"),
    @SerialName("tragic") TRAGIC("Tragic"),
}

object BriefRepository {
    private val json = Json { ignoreUnknownKeys = true }

    fun loadBundled(context: Context): Brief =
        context.assets.open("brief.json").bufferedReader().use {
            json.decodeFromString(Brief.serializer(), it.readText())
        }
}
