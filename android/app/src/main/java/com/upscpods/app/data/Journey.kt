package com.upscpods.app.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import java.time.temporal.ChronoUnit

/**
 * The first week, one step at a time (owner, 25 Nov 2026: "a conversion engine"). Each step is something the app is
 * for, done once: read the Chai, pick when cards come back, meet the pod, practise, revise, write, try a mock, then see
 * the week in your own numbers (and, there, what Plus would add). Never a streak: a step done stays done, a missed day
 * costs nothing, and at most [PER_DAY] steps are offered a day so the first days stay short.
 */
enum class Starter(val key: String, val en: String, val hi: String, val minutes: Int) {
    CHAI("chai", "Read today's Chai", "आज की चाय पढ़ें", 3),
    NUDGE("nudge", "Pick when your cards come back", "तय करें कि कार्ड कब लौटें", 1),
    POD("pod", "Meet your pod", "अपने पॉड से मिलें", 2),
    QUESTIONS("questions", "Do today's practice set", "आज का अभ्यास सेट", 5),
    REVIEW("review", "Bring back your first cards", "अपने पहले कार्ड दोहराएँ", 3),
    ANSWER("answer", "Write one 7-minute answer", "एक 7 मिनट का उत्तर लिखें", 7),
    MOCK("mock", "Try the quick mock", "क्विक मॉक आज़माएँ", 10),
    WEEK("week", "See your first week", "अपना पहला हफ़्ता देखें", 1);

    fun label(hindi: Boolean) = if (hindi) hi else en
    companion object { fun of(key: String?) = entries.firstOrNull { it.key == key } }
}

/** Where the "Next up" button goes. */
enum class Go { CHAI, NUDGE, POD, PRACTICE, REVIEW, ANSWER, MOCK, WEEK, PREP, NONE }

/** What the app remembers you did, all from this phone. Private: "you against you", never shown to anyone else. */
data class Memory(
    val questions: Int = 0,
    val right: Int = 0,
    val inReview: Int = 0,
    val dueToday: Int = 0,
    val topicsMet: Int = 0,
    val answers: Int = 0,
    val mocks: Int = 0,
    val daysActive: Int = 0,
    val misses: Int = 0,
    val chaiDone: Boolean = false,
    val practiceDone: Boolean = false,
    val reviewedToday: Boolean = false,
    val nudgeSet: Boolean = false,
    val inPod: Boolean = false,
)

/** The one card at the top of the Adda. [step] is set while it's a first-week step. */
data class NextUp(val go: Go, val title: String, val line: String, val cta: String?, val step: Starter? = null)

class Journey(context: Context) {
    private val app = context.applicationContext
    private val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** Bumped on every change, so Compose redraws what reads it. */
    var tick by mutableIntStateOf(0); private set
    /** The step just finished, for the "done, next" bar; cleared when the bar goes. */
    var justDone by mutableStateOf<Starter?>(null)

    /** The date of last open before today's: a gap of 3 days or more gets "welcome back" first. */
    val previousOpen: LocalDate? get() = prefs.getString("prevOpen", null)?.let { runCatching { LocalDate.parse(it) }.getOrNull() }

    /** Day 1 is the day this phone started (the same date StagedProfile keeps). */
    fun dayNumber(today: LocalDate = LocalDate.now()): Int = (ChronoUnit.DAYS.between(startedOn(), today) + 1).toInt().coerceAtLeast(1)

    fun done(): Set<Starter> = Starter.entries.filter { prefs.contains("did:${it.key}") }.toSet()
    fun doneToday(today: LocalDate = LocalDate.now()): Int = Starter.entries.count { prefs.getString("did:${it.key}", null) == today.toString() }
    fun skipped(): Set<Starter> = Starter.entries.filter { prefs.getBoolean("skip:${it.key}", false) }.toSet()

    /** The first week is over: every step done or skipped, or two weeks gone by. */
    fun finished(today: LocalDate = LocalDate.now()): Boolean = dayNumber(today) > 14 || Starter.entries.all { it in done() || it in skipped() }

    /** A step happened (from wherever it happened in the app). Only the first time counts. */
    fun did(step: Starter, today: LocalDate = LocalDate.now()) {
        if (prefs.contains("did:${step.key}")) return
        prefs.edit().putString("did:${step.key}", today.toString()).apply()
        Metrics.track("journey_step", buildJsonObject { put("step", step.key); put("day", dayNumber(today)) })
        if (!finished(today) || step == Starter.WEEK) justDone = step
        tick++
    }

    fun skip(step: Starter) { prefs.edit().putBoolean("skip:${step.key}", true).apply(); tick++ }

    /** Opening the app: keeps the last open before today, for "welcome back". */
    fun opened(today: LocalDate = LocalDate.now()) {
        val last = prefs.getString("lastOpen", null)
        if (last != today.toString()) prefs.edit().putString("prevOpen", last).putString("lastOpen", today.toString()).apply()
        startedOn()
    }

    /** The week card (with what Plus adds) was seen; it doesn't come back for 7 days. */
    fun weekSeen(today: LocalDate = LocalDate.now()) { prefs.edit().putString("weekSeen", today.toString()).apply(); did(Starter.WEEK, today); tick++ }

    fun forget() { prefs.edit().clear().apply(); justDone = null; tick++ }

    /** Steps still open for the first-week path, in order, with the ones that can't happen yet left out. */
    fun open(mem: Memory, today: LocalDate = LocalDate.now()): List<Starter> = Companion.open(done(), skipped(), mem, dayNumber(today))

    fun next(mem: Memory, hindi: Boolean, now: java.time.LocalDateTime = java.time.LocalDateTime.now()): NextUp =
        Companion.next(done(), skipped(), mem, dayNumber(now.toLocalDate()), doneToday(now.toLocalDate()), previousOpen, hindi, now)

    private fun startedOn(): LocalDate {
        val staged = app.getSharedPreferences("staged", Context.MODE_PRIVATE)
        return staged.getString("startedOn", null)?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
            ?: LocalDate.now().also { staged.edit().putString("startedOn", it.toString()).apply() }
    }

    companion object {
        const val PREFS = "journey"
        /** First-week steps offered in one day, at most. Day one stays short. */
        const val PER_DAY = 3
        /** Chotu and the pod friends are quiet from 23:30 to 07:00 (standing rule); so is the push to do more. */
        private val QUIET_FROM: LocalTime = LocalTime.of(23, 30)
        private val QUIET_TO: LocalTime = LocalTime.of(7, 0)

        fun goOf(s: Starter): Go = when (s) {
            Starter.CHAI -> Go.CHAI; Starter.NUDGE -> Go.NUDGE; Starter.POD -> Go.POD; Starter.QUESTIONS -> Go.PRACTICE
            Starter.REVIEW -> Go.REVIEW; Starter.ANSWER -> Go.ANSWER; Starter.MOCK -> Go.MOCK; Starter.WEEK -> Go.WEEK
        }

        fun quietHours(t: LocalTime) = !t.isBefore(QUIET_FROM) || t.isBefore(QUIET_TO)

        internal fun open(done: Set<Starter>, skipped: Set<Starter>, mem: Memory, day: Int): List<Starter> =
            Starter.entries.filter { it !in done && it !in skipped }.filter { s ->
                when (s) {
                    Starter.NUDGE -> !mem.nudgeSet
                    Starter.REVIEW -> mem.dueToday > 0
                    // The week card from day 5, or sooner once everything else is done (never on day 1 or 2).
                    Starter.WEEK -> day >= 5 || (day >= 3 && Starter.entries.all { it == Starter.WEEK || it == Starter.REVIEW || it in done || it in skipped })
                    else -> true
                }
            }

        internal fun next(
            done: Set<Starter>, skipped: Set<Starter>, mem: Memory, day: Int, doneToday: Int,
            prevOpen: LocalDate?, hindi: Boolean, now: java.time.LocalDateTime,
        ): NextUp {
            val today = now.toLocalDate()
            fun t(en: String, hi: String) = if (hindi) hi else en
            if (quietHours(now.toLocalTime())) return NextUp(Go.NONE,
                t("It's late.", "रात हो गई है।"),
                t("Whatever's left can wait for tomorrow. Sleep is part of the prep.", "जो बचा है, कल हो जाएगा। नींद भी तैयारी का हिस्सा है।"), null)
            val back = prevOpen != null && !prevOpen.isAfter(today.minusDays(3))
            val hello = if (back) t("Welcome back. ", "वापसी पर स्वागत है। ") else ""
            val cards = { n: Int -> if (hindi) "$n कार्ड" else if (n == 1) "1 card" else "$n cards" }

            val firstWeek = day <= 14 && !Starter.entries.all { it in done || it in skipped }
            val open = open(done, skipped, mem, day)
            if (firstWeek && open.isNotEmpty() && (doneToday < PER_DAY || back)) {
                val s = open.first()
                val (line, cta) = when (s) {
                    Starter.CHAI -> t("Three short cards on today's news, about three minutes. Each ends with one question.", "आज की खबरों पर तीन छोटे कार्ड, करीब तीन मिनट। हर कार्ड के आख़िर में एक सवाल।") to
                        t("Read today's Chai", "आज की चाय पढ़ें")
                    Starter.NUDGE -> (if (mem.inReview > 0) t("${cards(mem.inReview)} you answered are set to come back, just before you'd forget them. Want a nudge when they do?",
                        "आपके ${cards(mem.inReview)} लौटने के लिए तय हैं, ठीक भूलने से पहले। तब एक याद दिलाना चाहेंगे?")
                        else t("Your answers come back just before you'd forget them. Pick a time for one quiet nudge.", "आपके जवाब ठीक भूलने से पहले लौटते हैं। एक शांत याद दिलाने का समय चुनें।")) to
                        t("Pick a time", "समय चुनें")
                    Starter.POD -> t("A small group preparing for the same exam. Say hello, or just read for now.", "एक ही परीक्षा की तैयारी करता छोटा समूह। नमस्ते कहें, या अभी बस पढ़ें।") to
                        t("Open my pod", "मेरा पॉड खोलें")
                    Starter.QUESTIONS -> t("Prelims-style questions from today's cards and the question bank. Misses come back tomorrow.", "आज के कार्ड और प्रश्न बैंक से प्रीलिम्स जैसे सवाल। ग़लत वाले कल लौटेंगे।") to
                        t("Start practice", "अभ्यास शुरू करें")
                    Starter.REVIEW -> t("${cards(mem.dueToday)} from earlier came back today. This is the part that makes it stick.", "पहले के ${cards(mem.dueToday)} आज लौटे हैं। यही हिस्सा याद पक्का करता है।") to
                        t("Bring them back", "दोहराएँ")
                    Starter.ANSWER -> t("Mains is written. One question, seven minutes, on paper or typed. Then see how it reads.", "मेन्स लिखा जाता है। एक प्रश्न, सात मिनट, काग़ज़ पर या टाइप करके।") to
                        t("Write one answer", "एक उत्तर लिखें")
                    Starter.MOCK -> t("A short paper made from what you've already read. See where you stand, privately.", "जो आप पढ़ चुके हैं उससे बना छोटा पेपर। अपनी जगह देखें, सिर्फ़ अपने लिए।") to
                        t("Try the quick mock", "क्विक मॉक शुरू करें")
                    Starter.WEEK -> t("Your first week in your own numbers, and what comes next.", "आपका पहला हफ़्ता, आपके अपने आँकड़ों में, और आगे क्या।") to
                        t("See my week", "मेरा हफ़्ता देखें")
                }
                return NextUp(goOf(s), hello + s.label(hindi), line, cta, s)
            }
            // The daily loop, once the first week's steps are done (or today's share of them is).
            return when {
                mem.dueToday > 0 && !mem.reviewedToday -> NextUp(Go.REVIEW, hello + t("${cards(mem.dueToday)} came back today", "आज ${cards(mem.dueToday)} लौटे हैं"),
                    t("Answer them now, just before you'd forget. About ${(mem.dueToday / 2).coerceIn(1, 10)} minutes.", "अभी जवाब दें, ठीक भूलने से पहले। करीब ${(mem.dueToday / 2).coerceIn(1, 10)} मिनट।"), t("Bring them back", "दोहराएँ"))
                !mem.chaiDone -> NextUp(Go.CHAI, hello + t("Today's Chai is ready", "आज की चाय तैयार है"),
                    t("Three cards, about three minutes.", "तीन कार्ड, करीब तीन मिनट।"), t("Read today's Chai", "आज की चाय पढ़ें"))
                !mem.practiceDone -> NextUp(Go.PRACTICE, t("Today's practice set", "आज का अभ्यास सेट"),
                    t("A few Prelims-style questions. Misses come back tomorrow.", "कुछ प्रीलिम्स जैसे सवाल। ग़लत वाले कल लौटेंगे।"), t("Start practice", "अभ्यास शुरू करें"))
                now.dayOfWeek in setOf(DayOfWeek.WEDNESDAY, DayOfWeek.SATURDAY) && mem.answers == 0 -> NextUp(Go.ANSWER, t("Answer hour", "आंसर आवर"),
                    t("One Mains question, seven minutes.", "मेन्स का एक प्रश्न, सात मिनट।"), t("Write one answer", "एक उत्तर लिखें"))
                firstWeek && open.isNotEmpty() -> NextUp(goOf(open.first()), t("That's a good day.", "आज के लिए इतना काफ़ी है।"),
                    t("Next on your first week: ${open.first().label(false).lowercase()}. It'll be here tomorrow.", "पहले हफ़्ते में आगे: ${open.first().label(true)}। यह कल यहीं मिलेगा।"), t("Do it now anyway", "फिर भी अभी करें"), open.first())
                else -> NextUp(Go.PREP, t("You're done for today", "आज का काम पूरा"),
                    t("Really. The rest of the day is yours. If you want more, Prep has the whole syllabus.", "सच में। बाकी दिन आपका है। और चाहिए तो Prep में पूरा सिलेबस है।"), t("Open Prep", "Prep खोलें"))
            }
        }

        /** A line for the morning push in the first two weeks: what's waiting, in the app's own memory. Null for nothing true to say. */
        fun pushLine(context: Context, due: Int, hindi: Boolean, today: LocalDate = LocalDate.now()): String? {
            val j = Journey(context)
            if (j.dayNumber(today) > 14) return if (due > 0) (if (hindi) "पहले के $due कार्ड भी लौटे हैं।" else "And $due ${if (due == 1) "card" else "cards"} from earlier came back.") else null
            if (due > 0) return if (hindi) "और पहले के $due कार्ड भी लौटे हैं, ठीक भूलने से पहले।" else "And $due ${if (due == 1) "card" else "cards"} from earlier came back, just before you'd forget."
            val next = Starter.entries.firstOrNull { it !in j.done() && it !in j.skipped() && it != Starter.CHAI && it != Starter.NUDGE && it != Starter.REVIEW && it != Starter.WEEK } ?: return null
            return if (hindi) "दिन ${j.dayNumber(today)}: फिर, ${next.hi}।" else "Day ${j.dayNumber(today)}. Then: ${next.en.replaceFirstChar { it.lowercase() }}."
        }
    }
}
