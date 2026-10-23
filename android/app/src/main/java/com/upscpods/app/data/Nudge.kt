package com.upscpods.app.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.WorkerParameters
import java.time.LocalTime

/**
 * The morning chai time (playbook A11), which onboarding and My Path set. The nudge itself is now one of the ritual
 * nudges (data/Rituals.kt): "Chai's ready." with today's card count, never loss copy or streaks.
 */
object Nudge {
    private const val PREFS = "nudge"
    const val EXTRA_FROM_NUDGE = "fromNudge"

    /** Choices shown in onboarding and on My Path. */
    val TIMES = listOf("06:00", "07:00", "08:00", "09:00", "10:00")

    fun label(time: String): String {
        val t = LocalTime.parse(time)
        val h = if (t.hour % 12 == 0) 12 else t.hour % 12
        return if (t.minute == 0) "$h ${if (t.hour < 12) "am" else "pm"}" else "%d:%02d %s".format(h, t.minute, if (t.hour < 12) "am" else "pm")
    }

    fun time(context: Context): String? = prefs(context).getString("time", null)

    internal fun storeTime(context: Context, time: String?) = prefs(context).edit().putString("time", time).apply()

    /** Set or clear the chai time (onboarding): Morning Chai goes on or off with it, and the rituals reschedule. */
    fun set(context: Context, time: String?) {
        val others = Rituals.on(context) - Ritual.CHAI
        Rituals.set(context, if (time != null) others + Ritual.CHAI else others, time)
    }

    /** The app came to the foreground. */
    fun opened(context: Context) = Rituals.opened(context)

    fun schedule(context: Context) = Rituals.schedule(context)

    fun canNotify(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}

/** The old chai-only worker, kept so work queued by an earlier version still runs: it hands over to the rituals. */
class NudgeWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        Rituals.schedule(applicationContext, ExistingWorkPolicy.KEEP)
        return Result.success()
    }
}
