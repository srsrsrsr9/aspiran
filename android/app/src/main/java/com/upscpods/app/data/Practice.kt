package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.time.LocalDate

/** A static GS question, used to fill the daily 5. See assets/prelims_bank.json. */
@Serializable
data class BankQuestion(val id: String, val topic: String, val en: Mcq, val hi: Mcq? = null)

@Serializable
private data class QuestionBank(val questions: List<BankQuestion>)

/**
 * One question in today's set. [cardId] is set when it comes from a Chai Card, so the answer
 * feeds spaced revision; [isReview] marks cards that came back because they were due.
 */
data class PracticeQuestion(
    val id: String,
    val topic: String,
    val mcq: Mcq,
    val cardId: String?,
    val isReview: Boolean,
)

data class MainsTask(val id: String, val prompt: String, val topic: String)

object Practice {
    const val DAILY = 5
    private val json = Json { ignoreUnknownKeys = true }

    fun loadBank(context: Context): List<BankQuestion> = runCatching {
        context.assets.open("prelims_bank.json").bufferedReader().use {
            json.decodeFromString(QuestionBank.serializer(), it.readText()).questions
        }
    }.getOrDefault(emptyList())

    /**
     * Due revisions first (that's the point of spacing), then today's cards, then the static bank,
     * rotated by date so the filler changes daily. Same input gives the same set all day.
     */
    fun prelimsSet(
        today: Brief,
        due: List<NewsItem>,
        bank: List<BankQuestion>,
        hindi: Boolean,
        date: LocalDate = LocalDate.now(),
        misses: List<NewsItem> = emptyList(),
    ): List<PracticeQuestion> {
        val out = mutableListOf<PracticeQuestion>()
        fun fromCard(item: NewsItem, review: Boolean) {
            val mcq = item.text(hindi).mcq ?: return
            if (out.none { it.cardId == item.id }) out += PracticeQuestion("card-${item.id}", item.topic, mcq, item.id, review)
        }
        // Fridays: this week's misses and skips come first (see Recall.fridayMisses).
        misses.forEach { fromCard(it, review = true) }
        due.forEach { fromCard(it, review = true) }
        today.items.forEach { fromCard(it, review = false) }
        if (bank.isNotEmpty()) {
            val start = (date.toEpochDay() % bank.size).toInt()
            for (i in bank.indices) {
                if (out.size >= DAILY) break
                val q = bank[(start + i) % bank.size]
                out += PracticeQuestion(q.id, q.topic, if (hindi) q.hi ?: q.en else q.en, null, false)
            }
        }
        return out.take(DAILY)
    }

    /** Today's Mains question: the first card with a Mains prompt, else a rotating static one. */
    fun mainsTask(today: Brief, hindi: Boolean, date: LocalDate = LocalDate.now()): MainsTask {
        today.items.firstOrNull { it.text(hindi).mainsPrompt != null }?.let {
            return MainsTask("mains-$date", it.text(hindi).mainsPrompt!!, it.topic)
        }
        val list = if (hindi) fallbackHi else fallbackEn
        val pick = list[(date.toEpochDay() % list.size).toInt()]
        return MainsTask("mains-$date", pick.second, pick.first)
    }

    /** Answer Studio's questions: today's Mains question first, then the sample ones. */
    fun studioQuestions(today: Brief, hindi: Boolean, date: LocalDate = LocalDate.now()): List<MainsTask> {
        val todays = mainsTask(today, hindi, date)
        val samples = (if (hindi) fallbackHi else fallbackEn).mapIndexed { i, (topic, prompt) -> MainsTask("sample-$i", prompt, topic) }
        return listOf(todays) + samples.filter { it.prompt != todays.prompt }
    }

    private val fallbackEn = listOf(
        "Federalism" to "Discuss the role of the Inter-State Council in strengthening cooperative federalism. (150 words)",
        "Governance" to "How has the Right to Information Act improved accountability in public administration? (150 words)",
        "Environment" to "Explain the significance of wetlands for flood control and livelihoods in India. (150 words)",
        "Ethics" to "What do you understand by 'probity in public life'? Illustrate with an example. (150 words)",
    )
    private val fallbackHi = listOf(
        "Federalism" to "सहकारी संघवाद को मज़बूत करने में अंतर-राज्य परिषद की भूमिका पर चर्चा कीजिए। (150 शब्द)",
        "Governance" to "सूचना का अधिकार अधिनियम ने लोक प्रशासन में जवाबदेही को कैसे बढ़ाया है? (150 शब्द)",
        "Environment" to "भारत में बाढ़ नियंत्रण और आजीविका के लिए आर्द्रभूमियों का महत्व समझाइए। (150 शब्द)",
        "Ethics" to "'सार्वजनिक जीवन में ईमानदारी' से आप क्या समझते हैं? एक उदाहरण से स्पष्ट कीजिए। (150 शब्द)",
    )

    /** Part-time mode writes an outline, not a full answer. */
    fun outlineTemplate(hindi: Boolean) = if (hindi) {
        "भूमिका:\n\nमुख्य बिंदु:\n• \n• \n• \n\nआगे की राह:\n"
    } else {
        "Intro:\n\nPoints:\n• \n• \n• \n\nWay forward:\n"
    }

    fun wordCount(text: String): Int = text.split(Regex("\\s+")).count { w -> w.any { it.isLetterOrDigit() } }
}
