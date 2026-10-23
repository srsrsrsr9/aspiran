package com.upscpods.app.data

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.upscpods.app.MainActivity
import com.upscpods.app.data.db.AppDatabase
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

/**
 * One nudge a day, anchored to the member's morning chai (playbook A11).
 *
 * "Chai's ready." and nothing else: no loss copy, no streaks, no counts. It is off unless the
 * member picks a chai time, switches off in one tap on My Path, and goes silent after two
 * nudges in a row that weren't followed by opening the app. Opening the app resets that.
 */
object Nudge {
    private const val PREFS = "nudge"
    private const val WORK = "chai-nudge"
    private const val CHANNEL = "chai-nudge"
    private const val NOTE_ID = 7
    const val EXTRA_FROM_NUDGE = "fromNudge"

    /** Choices shown in onboarding and on My Path. */
    val TIMES = listOf("06:00", "07:00", "08:00", "09:00", "10:00")

    fun label(time: String): String {
        val t = LocalTime.parse(time)
        val h = if (t.hour % 12 == 0) 12 else t.hour % 12
        return if (t.minute == 0) "$h ${if (t.hour < 12) "am" else "pm"}" else "%d:%02d %s".format(h, t.minute, if (t.hour < 12) "am" else "pm")
    }

    fun time(context: Context): String? = prefs(context).getString("time", null)

    /** Set or clear the chai time, and (re)schedule. */
    fun set(context: Context, time: String?) {
        prefs(context).edit().putString("time", time).putInt("ignored", 0).apply()
        if (time == null) WorkManager.getInstance(context).cancelUniqueWork(WORK) else schedule(context)
    }

    /** The app came to the foreground: the last nudge wasn't ignored. */
    fun opened(context: Context) {
        prefs(context).edit().putInt("ignored", 0).apply()
        NotificationManagerCompat.from(context).cancel(NOTE_ID)
    }

    fun schedule(context: Context, policy: ExistingWorkPolicy = ExistingWorkPolicy.REPLACE) {
        val time = time(context)?.let(LocalTime::parse) ?: return
        val now = LocalDateTime.now()
        var at = now.toLocalDate().atTime(time)
        if (!at.isAfter(now)) at = at.plusDays(1)
        val request = OneTimeWorkRequestBuilder<NudgeWorker>().setInitialDelay(Duration.between(now, at)).build()
        WorkManager.getInstance(context).enqueueUniqueWork(WORK, policy, request)
    }

    fun canNotify(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    internal suspend fun maybeNotify(context: Context) {
        val p = prefs(context)
        if (time(context) == null || !canNotify(context)) return
        val ignored = p.getInt("ignored", 0)
        if (ignored >= 2) return
        // Pause mode means quiet.
        val settings = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
        val paused = settings.getString("pausedUntil", null)?.let { !LocalDate.now().isAfter(LocalDate.parse(it)) } ?: false
        if (paused) return
        // Chai already read today: nothing to say.
        val today = AppDatabase.get(context).dao().day(LocalDate.now().toString())
        if (today?.done?.split(",")?.contains(TaskId.CHAI.name) == true) return

        val nm = NotificationManagerCompat.from(context)
        nm.createNotificationChannel(
            NotificationChannelCompat.Builder(CHANNEL, NotificationManagerCompat.IMPORTANCE_DEFAULT).setName("Morning chai").build(),
        )
        val open = PendingIntent.getActivity(
            context, 0,
            Intent(context, MainActivity::class.java).putExtra(EXTRA_FROM_NUDGE, true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val n = NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle("Chai's ready.")
            .setContentIntent(open)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .build()
        runCatching { nm.notify(NOTE_ID, n) }.onSuccess { p.edit().putInt("ignored", ignored + 1).apply() }
    }

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}

class NudgeWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        Nudge.maybeNotify(applicationContext)
        // Tomorrow's, whatever happened today.
        // Appended, so it doesn't cancel this run.
        Nudge.schedule(applicationContext, ExistingWorkPolicy.APPEND_OR_REPLACE)
        return Result.success()
    }
}
