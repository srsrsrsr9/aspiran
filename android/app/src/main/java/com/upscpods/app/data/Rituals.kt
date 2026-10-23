package com.upscpods.app.data

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.upscpods.app.MainActivity
import com.upscpods.app.data.db.AppDatabase
import java.time.DayOfWeek
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId

/**
 * Ritual nudges (sell-first plan W4): a few fixed weekly moments that become a habit, each anchored to something the
 * aspirant already does. The person picks them in Chotu's day-2 chat (never in onboarding) and changes them on My Path.
 *
 * Rules: at most 2 a day, none from 22:30 to 06:00, none while paused, in result-day mode or for a day after a
 * distress check. A ritual ignored 3 times in a row drops to weekly instead of being muted; a push that's followed
 * puts it back. Every push opens straight into the action, and every ritual ends with a small reward (Chotu's line,
 * and a stamp the first time). Local notifications only (WorkManager), so it works without push keys or a server.
 */
enum class Ritual(val key: String, val title: String, val titleHi: String, val slot: String, val slotHi: String, val stamp: String) {
    CHAI("chai", "Morning Chai", "सुबह की चाय", "Daily, at your chai time", "रोज़, आपकी चाय के समय", "chai_ritual"),
    MONDAY_GOAL("goal", "Monday goal", "सोमवार का लक्ष्य", "Mondays, 8 am", "सोमवार, सुबह 8 बजे", "goal_ritual"),
    ANSWER_HOUR("answer_hour", "Answer hour", "आंसर आवर", "Wed and Sat, 7 pm", "बुध और शनि, शाम 7 बजे", "answer_hour"),
    QUIZ_NIGHT("quiz", "Quiz night", "क्विज़ नाइट", "Fridays, 8 pm, in your pod", "शुक्रवार, रात 8 बजे, आपके पॉड में", "quiz_night"),
    SUNDAY_CA("ca", "Week in 7 scenes", "7 दृश्यों में हफ़्ता", "Sundays, 10 am", "रविवार, सुबह 10 बजे", "ca_ritual"),
    COMEBACK("comeback", "Comeback", "वापसी", "After 3 quiet days", "3 शांत दिनों के बाद", "came_back");

    fun title(hindi: Boolean) = if (hindi) titleHi else title
    fun slot(hindi: Boolean) = if (hindi) slotHi else slot

    /** The Sunday CA episode waits for W7 (cinematic current affairs): hidden until the episodes exist. */
    val available: Boolean get() = this != SUNDAY_CA

    companion object {
        fun of(key: String?): Ritual? = entries.firstOrNull { it.key == key }
        val PICKABLE get() = entries.filter { it.available }
    }
}

object Rituals {
    private const val PREFS = "rituals"
    private const val WORK = "rituals"
    private const val CHANNEL = "rituals"
    private const val OLD_WORK = "chai-nudge"
    const val EXTRA = "ritual"
    const val MAX_A_DAY = 2
    const val IGNORES_TO_WEEKLY = 3
    private val LATEST = LocalTime.of(22, 30)
    private val EARLIEST = LocalTime.of(6, 0)
    /** A push counts as followed if the app opens within this long. */
    private const val FOLLOW_MS = 3 * 3_600_000L
    private val ZONE: ZoneId = ZoneId.systemDefault()

    // --- What the person picked --------------------------------------------------------------------

    /** The rituals switched on. Before the day-2 chat, someone who picked a chai time in onboarding has Morning Chai. */
    fun on(context: Context): Set<Ritual> {
        val p = prefs(context)
        val saved = p.getStringSet("on", null)?.mapNotNull { Ritual.of(it) }?.toSet()
            ?: if (Nudge.time(context) != null) setOf(Ritual.CHAI) else emptySet()
        // Morning Chai needs a chai time.
        return saved.filter { it.available && (it != Ritual.CHAI || Nudge.time(context) != null) }.toSet()
    }

    /** Save the picks (and the chai time) and schedule the next nudge. */
    fun set(context: Context, picks: Set<Ritual>, chaiTime: String?) {
        Nudge.storeTime(context, if (Ritual.CHAI in picks) chaiTime else null)
        val keep = picks.filter { it.available && (it != Ritual.CHAI || chaiTime != null) }
        prefs(context).edit().putStringSet("on", keep.map { it.key }.toSet()).apply()
        schedule(context)
    }

    /** Ignored 3 times in a row: this ritual is down to once a week until a push is followed. */
    fun weekly(context: Context, r: Ritual) = prefs(context).getInt("ignored:${r.key}", 0) >= IGNORES_TO_WEEKLY

    fun inPod(context: Context) = context.getSharedPreferences("pod", Context.MODE_PRIVATE).getString("podId", null) != null

    // --- When ------------------------------------------------------------------------------------

    /** The weekly slots of a ritual: (day, time), day null for every day. Weekly mode keeps one. */
    fun slots(r: Ritual, chai: LocalTime?, weekly: Boolean): List<Pair<DayOfWeek?, LocalTime>> = when (r) {
        Ritual.CHAI -> chai?.let { listOf((if (weekly) DayOfWeek.SUNDAY else null) to it) } ?: emptyList()
        Ritual.MONDAY_GOAL -> listOf(DayOfWeek.MONDAY to LocalTime.of(8, 0))
        // 15 minutes ahead of the 7 pm hour, so there's time to find a pen.
        Ritual.ANSWER_HOUR -> (if (weekly) listOf(DayOfWeek.SATURDAY) else listOf(DayOfWeek.WEDNESDAY, DayOfWeek.SATURDAY)).map { it to LocalTime.of(18, 45) }
        Ritual.QUIZ_NIGHT -> listOf(DayOfWeek.FRIDAY to LocalTime.of(19, 45))
        Ritual.SUNDAY_CA -> listOf(DayOfWeek.SUNDAY to LocalTime.of(10, 0))
        // Checked once a day; it only sends after 3 days without opening the app.
        Ritual.COMEBACK -> listOf(null to LocalTime.of(18, 0))
    }

    /** The next moment one of [r]'s slots comes round after [from]. */
    fun next(r: Ritual, chai: LocalTime?, weekly: Boolean, from: LocalDateTime): LocalDateTime? =
        slots(r, chai, weekly).mapNotNull { (day, at) ->
            (0..7L).map { from.toLocalDate().plusDays(it).atTime(at) }
                .firstOrNull { it.isAfter(from) && (day == null || it.dayOfWeek == day) }
        }.minOrNull()

    /** The slot of [r] that is due at [now] (within its grace), if any. */
    fun dueSlot(r: Ritual, chai: LocalTime?, weekly: Boolean, now: LocalDateTime): LocalDateTime? {
        // A nudge that's very late is no longer true ("in 15 min"), so it's dropped. Chai and comeback can wait longer.
        val grace = if (r == Ritual.CHAI || r == Ritual.COMEBACK) 120L else 45L
        return slots(r, chai, weekly).mapNotNull { (day, at) ->
            listOf(now.toLocalDate(), now.toLocalDate().minusDays(1)).map { it.atTime(at) }
                .firstOrNull { (day == null || it.dayOfWeek == day) && !it.isAfter(now.plusMinutes(1)) && it.isAfter(now.minusMinutes(grace)) }
        }.maxOrNull()
    }

    fun schedule(context: Context, policy: ExistingWorkPolicy = ExistingWorkPolicy.REPLACE) {
        val wm = WorkManager.getInstance(context)
        // The single chai nudge before rituals: its chain stops here.
        wm.cancelUniqueWork(OLD_WORK)
        val chai = Nudge.time(context)?.let(LocalTime::parse)
        val now = LocalDateTime.now()
        // A minute on, so a slot that just ran isn't picked again.
        val at = on(context).mapNotNull { next(it, chai, weekly(context, it), now.plusMinutes(1)) }.minOrNull()
        if (at == null) { wm.cancelUniqueWork(WORK); return }
        val request = OneTimeWorkRequestBuilder<RitualWorker>().setInitialDelay(Duration.between(now, at)).build()
        wm.enqueueUniqueWork(WORK, policy, request)
    }

    // --- The app opened ---------------------------------------------------------------------------

    /** The app came to the foreground: a push from the last 3 hours was followed, and comeback's clock restarts. */
    fun opened(context: Context) {
        val p = prefs(context)
        val now = System.currentTimeMillis()
        val e = p.edit().putString("lastOpen", LocalDate.now().toString())
        Ritual.entries.forEach { r ->
            if (now - p.getLong("sentAt:${r.key}", 0L) < FOLLOW_MS) e.putInt("ignored:${r.key}", 0).putLong("followedAt:${r.key}", now)
            NotificationManagerCompat.from(context).cancel(noteId(r))
        }
        e.apply()
    }

    /** Monday's honest count: the biggest open room this person is in (or their pod), as last seen on screen. */
    fun noteCount(context: Context, place: String, people: Int) {
        if (people > 1) prefs(context).edit().putString("countPlace", place).putInt("count", people).putString("countOn", LocalDate.now().toString()).apply()
    }

    // --- Sending ----------------------------------------------------------------------------------

    /** Why nothing may be sent right now, or null. */
    fun quiet(context: Context, now: LocalDateTime = LocalDateTime.now()): String? {
        val t = now.toLocalTime()
        if (!t.isBefore(LATEST) || t.isBefore(EARLIEST)) return "late"
        val settings = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
        if (settings.getString("pausedUntil", null)?.let { !LocalDate.now().isAfter(LocalDate.parse(it)) } == true) return "paused"
        if (context.getSharedPreferences("staged", Context.MODE_PRIVATE).getLong("resultModeUntil", 0L) > System.currentTimeMillis()) return "result"
        if (AppConfig(context) { "" }.resultNow != null) return "result"
        if (System.currentTimeMillis() - context.getSharedPreferences("prep", Context.MODE_PRIVATE).getLong("careAt", 0L) < 86_400_000L) return "care"
        if (!Nudge.canNotify(context)) return "no permission"
        return null
    }

    /** Runs at a slot: sends what's due, within the rules. */
    internal suspend fun run(context: Context, now: LocalDateTime = LocalDateTime.now()) {
        val p = prefs(context)
        val chai = Nudge.time(context)?.let(LocalTime::parse)
        val ran = p.getLong("ranAt", 0L)
        p.edit().putLong("ranAt", System.currentTimeMillis()).apply()
        if (quiet(context, now) != null) return
        // Comeback goes last: a real ritual on the same day is the better nudge.
        val due = on(context).sortedBy { it == Ritual.COMEBACK }.filter { r ->
            val slot = dueSlot(r, chai, weekly(context, r), now) ?: return@filter false
            slot.atZone(ZONE).toInstant().toEpochMilli() > ran - 60_000
        }
        for (r in due) {
            if (sentToday(context) >= MAX_A_DAY) return
            val n = content(context, r) ?: continue
            send(context, r, n.first, n.second)
        }
    }

    private fun sentToday(context: Context): Int {
        val p = prefs(context)
        return if (p.getString("sentDay", null) == LocalDate.now().toString()) p.getInt("sentCount", 0) else 0
    }

    /** Title and line for a ritual's push now, or null when there's nothing true to say. */
    private suspend fun content(context: Context, r: Ritual): Pair<String, String?>? {
        val hindi = ProfileStore.load(context).persona?.language == ReadingLanguage.HINDI
        val p = prefs(context)
        return when (r) {
            Ritual.CHAI -> {
                // Chai already read today: nothing to say.
                val today = AppDatabase.get(context).dao().day(LocalDate.now().toString())
                if (today?.done?.split(",")?.contains(TaskId.CHAI.name) == true) return null
                val cards = runCatching { AppRepository(context).latestBrief { BriefRepository.loadBundled(context) }.items.size }.getOrDefault(0)
                (if (hindi) "चाय तैयार है।" else "Chai's ready.") to cards.takeIf { it > 0 }?.let { if (hindi) "आज $it कार्ड।" else "$it cards today." }
            }
            Ritual.MONDAY_GOAL -> {
                // Honest social proof: a real member count, seen in the last 8 days, or no number at all.
                val fresh = p.getString("countOn", null)?.let { !LocalDate.parse(it).isBefore(LocalDate.now().minusDays(8)) } == true
                val n = p.getInt("count", 0); val place = p.getString("countPlace", "") ?: ""
                (if (hindi) "नया हफ़्ता।" else "Fresh week.") to
                    if (fresh && n > 1 && place.isNotBlank()) (if (hindi) "$place के $n लोग भी आज से शुरू कर रहे हैं। हफ़्ते का एक लक्ष्य तय करें।" else "$n people in $place are starting it too. Set one goal for the week.")
                    else (if (hindi) "हफ़्ते का एक लक्ष्य तय करें। दो मिनट।" else "Set one goal for the week. Two minutes.")
            }
            Ritual.ANSWER_HOUR -> {
                // The room's question: today's Mains question, the one Chotu posts in the pods at 7.
                val topic = runCatching { Practice.mainsTask(AppRepository(context).latestBrief { BriefRepository.loadBundled(context) }, hindi).topic }.getOrNull()
                (if (hindi) "15 मिनट में आंसर आवर" else "Answer hour in 15 min") to
                    if (!topic.isNullOrBlank()) (if (hindi) "आज का प्रश्न $topic पर है। कलम-कागज़ तैयार?" else "Today's question is on $topic. Pen and paper ready?")
                    else (if (hindi) "एक प्रश्न, 7 मिनट। कलम-कागज़ तैयार?" else "One question, 7 minutes. Pen and paper ready?")
            }
            Ritual.QUIZ_NIGHT -> {
                // Pod Quiz Night lives in pods; without one there's no lobby to open.
                if (!inPod(context)) return null
                (if (hindi) "रात 8 बजे क्विज़ नाइट" else "Quiz night at 8") to
                    (if (hindi) "पाँच प्रश्न, पूरे पॉड का एक स्कोर, पिछले हफ़्ते के अपने पॉड से मुकाबला।" else "Five questions, one pod score, up against your pod's own last week.")
            }
            Ritual.SUNDAY_CA -> null
            Ritual.COMEBACK -> {
                val last = p.getString("lastOpen", null)?.let(LocalDate::parse) ?: return null
                if (last.isAfter(LocalDate.now().minusDays(3)) || p.getString("comebackFor", null) == last.toString()) return null
                p.edit().putString("comebackFor", last.toString()).apply()
                (if (hindi) "आपका रूम यहीं है।" else "Your room's still here.") to
                    (if (hindi) "बस एक 7 मिनट का उत्तर, और आप वापस।" else "One 7-minute answer and you're back.")
            }
        }
    }

    /** Posts the push. [preview] (debug builds only) skips the counting. */
    fun send(context: Context, r: Ritual, title: String, text: String?, preview: Boolean = false) {
        val nm = NotificationManagerCompat.from(context)
        nm.createNotificationChannel(NotificationChannelCompat.Builder(CHANNEL, NotificationManagerCompat.IMPORTANCE_DEFAULT).setName("Ritual nudges").build())
        val intent = Intent(context, MainActivity::class.java).putExtra(EXTRA, r.key)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        if (r == Ritual.CHAI) intent.putExtra(Nudge.EXTRA_FROM_NUDGE, true)
        val open = PendingIntent.getActivity(context, noteId(r), intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(title)
            .apply { text?.let { setContentText(it).setStyle(NotificationCompat.BigTextStyle().bigText(it)) } }
            .setContentIntent(open)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .build()
        runCatching { nm.notify(noteId(r), n) }.onSuccess {
            if (preview) return@onSuccess
            val p = prefs(context)
            p.edit()
                .putInt("ignored:${r.key}", p.getInt("ignored:${r.key}", 0) + 1)
                .putLong("sentAt:${r.key}", System.currentTimeMillis())
                .putString("sentDay", LocalDate.now().toString())
                .putInt("sentCount", sentToday(context) + 1)
                .apply()
        }
    }

    /** Debug builds: each ritual's push as it would read now, without the rules, to try the deep links. */
    suspend fun preview(context: Context, r: Ritual) {
        val (title, text) = content(context, r) ?: ((if (r == Ritual.COMEBACK) "Your room's still here." else r.title) to "Preview")
        send(context, r, title, text, preview = true)
    }

    // --- The reward at the end --------------------------------------------------------------------

    /**
     * The ritual's action is done. True (once a day) when it's a ritual this person picked and today is its day,
     * so the screen shows the reward; comeback counts once, after its push.
     */
    fun finished(context: Context, r: Ritual, now: LocalDateTime = LocalDateTime.now()): Boolean {
        val p = prefs(context)
        if (r !in on(context) || p.getString("rewarded:${r.key}", null) == now.toLocalDate().toString()) return false
        val chai = Nudge.time(context)?.let(LocalTime::parse)
        val today = when (r) {
            Ritual.COMEBACK -> System.currentTimeMillis() - p.getLong("sentAt:${r.key}", 0L) < 48 * 3_600_000L &&
                p.getLong("rewardedAt:${r.key}", 0L) < p.getLong("sentAt:${r.key}", 0L)
            Ritual.CHAI -> chai != null && !now.toLocalTime().isBefore(chai.minusHours(1))
            else -> slots(r, chai, false).any { (day, _) -> day == null || day == now.dayOfWeek }
        }
        if (!today) return false
        p.edit().putString("rewarded:${r.key}", now.toLocalDate().toString()).putLong("rewardedAt:${r.key}", System.currentTimeMillis()).apply()
        return true
    }

    /** Chotu's reaction when a ritual is done. */
    fun rewardLine(r: Ritual, hindi: Boolean): String = when (r) {
        Ritual.CHAI -> if (hindi) "चाय हो गई। दिन की शुरुआत सही रही।" else "Chai done. That's the day started right."
        Ritual.MONDAY_GOAL -> if (hindi) "लक्ष्य तय। सोमवार वाले आप ने शुक्रवार वाले आप का काम आसान कर दिया।" else "Goal set. Monday-you just did Friday-you a favour."
        Ritual.ANSWER_HOUR -> if (hindi) "एक उत्तर लिख लिया। मेन्स ऐसे ही आसान होता है: एक-एक करके।" else "One answer written. That's how Mains gets easier: one at a time."
        Ritual.QUIZ_NIGHT -> if (hindi) "क्विज़ खेल लिया। पॉड के स्कोर में आपका हिस्सा जुड़ गया।" else "Quiz played. Your share is in the pod's score."
        Ritual.SUNDAY_CA -> if (hindi) "हफ़्ता पूरा देख लिया।" else "Week watched."
        Ritual.COMEBACK -> if (hindi) "आप वापस आ गए। सबसे मुश्किल हिस्सा यही था।" else "You're back. That was the hard part, done."
    }

    private fun noteId(r: Ritual) = 70 + r.ordinal
    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}

class RitualWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        Rituals.run(applicationContext)
        // The next slot, whatever happened at this one. Appended, so it doesn't cancel this run.
        Rituals.schedule(applicationContext, ExistingWorkPolicy.APPEND_OR_REPLACE)
        return Result.success()
    }
}
