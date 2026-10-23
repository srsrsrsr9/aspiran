package com.upscpods.app.data.db

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase

/** One row per calendar day (ISO date). Task sets are stored as comma-separated TaskId names. */
@Entity
data class DayRecord(
    @PrimaryKey val date: String,
    val done: String = "",
    val moved: String = "",
    val chaiPing: Boolean = false,
    val closed: Boolean = false,
    val showedUp: Boolean = false,
)

/** A Chai Card saved for revision; the card JSON is kept so the archive works offline. */
@Entity
data class SavedCard(
    @PrimaryKey val cardId: String,
    val savedOn: String,
    val cardJson: String,
)

/** Spaced revision: saved cards and wrong MCQs come back at about day 3, 10 and 30. */
@Entity
data class ReviewItem(
    @PrimaryKey val cardId: String,
    val dueOn: String,
    val stage: Int,
)

/** Close the Day entry, AES-GCM encrypted with a key held in the Android Keystore. */
@Entity
data class JournalEntry(
    @PrimaryKey val date: String,
    val cipher: ByteArray,
)

/** Last brief pack fetched from the server, so Today never waits on the network. */
@Entity
data class CachedBrief(
    @PrimaryKey val date: String,
    val json: String,
)

/** Mains answers and outlines, autosaved every few seconds. */
@Entity
data class Draft(
    @PrimaryKey val id: String,
    val text: String,
    val updatedAt: Long,
)

@Dao
interface AppDao {
    @Query("SELECT * FROM DayRecord WHERE date = :date")
    suspend fun day(date: String): DayRecord?

    @Query("SELECT * FROM DayRecord WHERE date >= :from AND date <= :to")
    suspend fun days(from: String, to: String): List<DayRecord>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putDay(day: DayRecord)

    /** Days closed with Close the Day, for the rhythm dots and stamps. */
    @Query("SELECT date FROM DayRecord WHERE closed = 1 ORDER BY date")
    suspend fun closedDates(): List<String>

    @Query("SELECT * FROM SavedCard ORDER BY savedOn DESC")
    suspend fun savedCards(): List<SavedCard>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putSaved(card: SavedCard)

    @Query("DELETE FROM SavedCard WHERE cardId = :id")
    suspend fun deleteSaved(id: String)

    @Query("SELECT * FROM ReviewItem WHERE dueOn <= :today")
    suspend fun dueReviews(today: String): List<ReviewItem>

    @Query("SELECT * FROM ReviewItem WHERE cardId = :id")
    suspend fun review(id: String): ReviewItem?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putReview(item: ReviewItem)

    @Query("DELETE FROM ReviewItem WHERE cardId = :id")
    suspend fun deleteReview(id: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putJournal(entry: JournalEntry)

    @Query("SELECT * FROM JournalEntry ORDER BY date DESC")
    suspend fun journal(): List<JournalEntry>

    @Query("DELETE FROM JournalEntry")
    suspend fun clearJournal()

    @Query("SELECT * FROM CachedBrief ORDER BY date DESC LIMIT 1")
    suspend fun latestBrief(): CachedBrief?

    @Query("SELECT * FROM CachedBrief ORDER BY date DESC")
    suspend fun allBriefs(): List<CachedBrief>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putBrief(brief: CachedBrief)

    @Query("SELECT * FROM Draft WHERE id = :id")
    suspend fun draft(id: String): Draft?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putDraft(draft: Draft)
}

@Database(
    entities = [DayRecord::class, SavedCard::class, ReviewItem::class, JournalEntry::class, CachedBrief::class, Draft::class],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dao(): AppDao

    companion object {
        @Volatile private var instance: AppDatabase? = null

        fun get(context: Context): AppDatabase = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(context.applicationContext, AppDatabase::class.java, "pods.db")
                .build()
                .also { instance = it }
        }
    }
}
