package com.upscpods.app.data

import android.content.Context
import android.util.Base64
import com.upscpods.app.data.db.AppDatabase
import com.upscpods.app.data.db.CachedBrief
import com.upscpods.app.data.db.DayRecord
import com.upscpods.app.data.db.Draft
import com.upscpods.app.data.db.JournalEntry
import com.upscpods.app.data.db.ReviewItem
import com.upscpods.app.data.db.SavedCard
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters

/** A Close the Day entry. Only ever stored encrypted. */
@Serializable
data class JournalData(
    val date: String,
    val done: List<String>,
    val inTheWay: List<String>,
    val tomorrow: String,
    val slot: String? = null,
    val mood: String? = null,
    /** "One thing I can say from memory": retrieval practice, kept private like the rest. */
    val memory: String = "",
    /** The cue in "After ____, I'll ____ for 5 minutes". */
    val after: String? = null,
)

class AppRepository(context: Context) {
    private val dao = AppDatabase.get(context).dao()
    private val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    // --- Brief -------------------------------------------------------------

    /** Latest cached pack, else the bundled sample. Never waits on the network. */
    suspend fun latestBrief(fallback: () -> Brief): Brief = withContext(Dispatchers.IO) {
        dao.latestBrief()?.let { runCatching { json.decodeFromString(Brief.serializer(), it.json) }.getOrNull() }
            ?: fallback()
    }

    suspend fun cacheBrief(raw: String) = withContext(Dispatchers.IO) {
        val brief = json.decodeFromString(Brief.serializer(), raw)
        dao.putBrief(CachedBrief(brief.date, raw))
        brief
    }

    /** Keep the pack being shown in the archive, so revision can bring its cards back later. */
    suspend fun ensureCached(brief: Brief) = withContext(Dispatchers.IO) {
        if (dao.allBriefs().none { it.date == brief.date }) {
            dao.putBrief(CachedBrief(brief.date, json.encodeToString(Brief.serializer(), brief)))
        }
    }

    /** The Chai archive (lives in Practice). */
    suspend fun archive(): List<Brief> = withContext(Dispatchers.IO) {
        dao.allBriefs().mapNotNull { runCatching { json.decodeFromString(Brief.serializer(), it.json) }.getOrNull() }
    }

    // --- Day state -----------------------------------------------------------

    suspend fun loadInto(day: DayState) = withContext(Dispatchers.IO) {
        val today = LocalDate.now()
        dao.day(today.toString())?.let { r ->
            day.done = r.done.toTasks()
            day.movedToTomorrow = r.moved.toTasks()
            day.chaiPingSent = r.chaiPing
            day.dayClosed = r.closed
        }
        val monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        day.showUpDays = dao.days(monday.toString(), today.toString())
            .filter { it.showedUp }
            .map { LocalDate.parse(it.date).dayOfWeek }
            .toSet()
        day.savedCards = dao.savedCards().map { it.cardId }.toSet()
        day.weeklyTarget = prefs.getInt("weeklyTarget", 5)
        day.lowMoodContact = runCatching { LowMoodContact.valueOf(prefs.getString("lowMood", "")!!) }.getOrDefault(LowMoodContact.NOBODY)
        day.showPrelimsDate = prefs.getBoolean("prelimsDate", false)
        day.pausedUntil = prefs.getString("pausedUntil", null)?.let(LocalDate::parse)
        day.plan = prefs.getString("plan", null)?.let { enc ->
            runCatching {
                json.decodeFromString(PlanData.serializer(), Crypto.decrypt(Base64.decode(enc, Base64.NO_WRAP)))
            }.getOrNull()?.let { DayState.Plan(it.text, it.slot, LocalDate.parse(it.madeOn), it.after) }
        }
        day.started = prefs.getString("started", null).todayTasks(today)
        day.firstStepDone = prefs.getString("firstStepDone", null) == today.toString()
    }

    suspend fun persist(s: DaySnapshot, brief: Brief) = withContext(Dispatchers.IO) {
        dao.putDay(
            DayRecord(
                date = LocalDate.now().toString(),
                done = s.done.joinToString(",") { it.name },
                moved = s.moved.joinToString(",") { it.name },
                chaiPing = s.chaiPing,
                closed = s.closed,
                showedUp = s.showedUpToday,
            ),
        )
        prefs.edit()
            .putInt("weeklyTarget", s.weeklyTarget)
            .putString("lowMood", s.lowMoodContact.name)
            .putBoolean("prelimsDate", s.showPrelimsDate)
            .putString("pausedUntil", s.pausedUntil?.toString())
            .putString(
                "plan",
                s.plan?.let {
                    val raw = json.encodeToString(PlanData.serializer(), PlanData(it.text, it.slot, it.madeOn.toString(), it.after))
                    Base64.encodeToString(Crypto.encrypt(raw), Base64.NO_WRAP)
                },
            )
            .putString("started", LocalDate.now().toString() + ":" + s.started.joinToString(",") { it.name })
            .putString("firstStepDone", if (s.firstStepDone) LocalDate.now().toString() else null)
            .apply()

        // Saved cards: add new ones (with a revision schedule), remove unsaved ones.
        val stored = dao.savedCards().map { it.cardId }.toSet()
        (s.savedCards - stored).forEach { id ->
            val card = brief.items.firstOrNull { it.id == id } ?: return@forEach
            dao.putSaved(SavedCard(id, LocalDate.now().toString(), json.encodeToString(NewsItem.serializer(), card)))
            scheduleReview(id)
        }
        (stored - s.savedCards).forEach { dao.deleteSaved(it) }
    }

    // --- Revision ------------------------------------------------------------

    private val reviewGaps = listOf(3L, 10L, 30L)

    suspend fun scheduleReview(cardId: String) = withContext(Dispatchers.IO) {
        if (dao.review(cardId) == null) {
            dao.putReview(ReviewItem(cardId, LocalDate.now().plusDays(reviewGaps[0]).toString(), 0))
        }
    }

    /** Right answers move to the next gap (3 → 10 → 30, then done); wrong ones restart at 3 days. */
    suspend fun recordReview(cardId: String, right: Boolean) = withContext(Dispatchers.IO) {
        val current = dao.review(cardId)?.stage ?: -1
        val next = if (right) current + 1 else 0
        if (next >= reviewGaps.size) {
            dao.deleteReview(cardId)
        } else {
            dao.putReview(ReviewItem(cardId, LocalDate.now().plusDays(reviewGaps[next]).toString(), next))
        }
    }

    /**
     * A Prelims answer. Due cards move along the 3/10/30 ladder; a miss on a fresh card
     * brings it back in 3 days. Static bank questions don't feed revision.
     */
    suspend fun recordAnswer(q: PracticeQuestion, right: Boolean) {
        val id = q.cardId ?: return
        if (q.isReview || !right) recordReview(id, right)
    }

    /** Cards due for revision today, from saved cards and earlier packs. */
    suspend fun dueCards(): List<NewsItem> = withContext(Dispatchers.IO) {
        val due = dao.dueReviews(LocalDate.now().toString()).map { it.cardId }.toSet()
        if (due.isEmpty()) return@withContext emptyList()
        val fromSaved = dao.savedCards().filter { it.cardId in due }
            .mapNotNull { runCatching { json.decodeFromString(NewsItem.serializer(), it.cardJson) }.getOrNull() }
        val fromArchive = archive().flatMap { it.items }.filter { it.id in due }
        (fromSaved + fromArchive).distinctBy { it.id }
    }

    suspend fun savedCards(): List<NewsItem> = withContext(Dispatchers.IO) {
        dao.savedCards().mapNotNull { runCatching { json.decodeFromString(NewsItem.serializer(), it.cardJson) }.getOrNull() }
    }

    // --- Journal (Close the Day) ---------------------------------------------

    suspend fun saveJournal(entry: JournalData) = withContext(Dispatchers.IO) {
        dao.putJournal(JournalEntry(entry.date, Crypto.encrypt(json.encodeToString(JournalData.serializer(), entry))))
    }

    suspend fun journal(): List<JournalData> = withContext(Dispatchers.IO) {
        dao.journal().mapNotNull {
            runCatching { json.decodeFromString(JournalData.serializer(), Crypto.decrypt(it.cipher)) }.getOrNull()
        }
    }

    /** Plain-text export for the share sheet. */
    suspend fun exportJournal(): String = journal().joinToString("\n\n") { e ->
        buildString {
            append(e.date)
            e.mood?.let { append(" · mood: ").append(it) }
            if (e.done.isNotEmpty()) append("\nDone: ").append(e.done.joinToString(", "))
            if (e.inTheWay.isNotEmpty()) append("\nIn the way: ").append(e.inTheWay.joinToString(", "))
            if (e.memory.isNotBlank()) append("\nFrom memory: ").append(e.memory)
            if (e.tomorrow.isNotBlank()) {
                append("\nTomorrow's first step: ")
                append(if (!e.after.isNullOrBlank()) "After ${e.after}, I'll ${e.tomorrow} for 5 minutes" else e.tomorrow)
                e.slot?.let { append(" ($it)") }
            }
        }
    }

    suspend fun deleteJournal() = withContext(Dispatchers.IO) {
        dao.clearJournal()
        prefs.edit().remove("plan").apply()
        Crypto.destroyKey()
    }

    // --- Drafts ---------------------------------------------------------------

    suspend fun closedDays(): List<LocalDate> = withContext(Dispatchers.IO) {
        dao.closedDates().mapNotNull { runCatching { LocalDate.parse(it) }.getOrNull() }
    }

    suspend fun draft(id: String): String = withContext(Dispatchers.IO) { dao.draft(id)?.text ?: "" }

    suspend fun saveDraft(id: String, text: String) = withContext(Dispatchers.IO) {
        dao.putDraft(Draft(id, text, System.currentTimeMillis()))
    }

    private fun String.toTasks(): Set<TaskId> =
        split(",").filter { it.isNotBlank() }.mapNotNull { runCatching { TaskId.valueOf(it) }.getOrNull() }.toSet()

    @Serializable
    private data class PlanData(val text: String, val slot: String?, val madeOn: String, val after: String? = null)

    /** "2026-10-11:CHAI,MAINS" gives the tasks, only if the date is today. */
    private fun String?.todayTasks(today: LocalDate): Set<TaskId> {
        val parts = this?.split(":", limit = 2)?.takeIf { it.size == 2 } ?: return emptySet()
        return if (parts[0] == today.toString()) parts[1].toTasks() else emptySet()
    }
}
