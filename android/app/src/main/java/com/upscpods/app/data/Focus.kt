package com.upscpods.app.data

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import com.upscpods.app.BlockedActivity
import java.time.LocalDate

/**
 * Focus (Regain-style): during a focus block the apps on the list are closed, and daily limits close
 * an app for the rest of the day once its minutes are used. A short pause comes before "Open for 5
 * minutes", so opening one is a choice. Everything stays on this phone; nothing is counted for anyone else.
 *
 * Detection uses an accessibility service that only reads which app is in front (package names).
 * It never reads screen content. The person turns it on in Settings after a plain explanation.
 */
object Focus {
    private const val PREFS = "focus"
    const val ALLOW_MINUTES = 5

    data class App(val pkg: String, val label: String)

    private fun prefs(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    // --- Settings -------------------------------------------------------------------------------

    fun blocked(c: Context): Set<String> = prefs(c).getStringSet("blocked", emptySet())!!.toSet()
    fun setBlocked(c: Context, pkgs: Set<String>) = prefs(c).edit().putStringSet("blocked", pkgs).apply()

    /** Package to minutes per day. */
    fun limits(c: Context): Map<String, Int> =
        prefs(c).getStringSet("limits", emptySet())!!.mapNotNull { e -> e.split("=").takeIf { it.size == 2 }?.let { it[0] to (it[1].toIntOrNull() ?: 0) } }
            .filter { it.second > 0 }.toMap()
    fun setLimit(c: Context, pkg: String, minutes: Int?) {
        val next = limits(c).toMutableMap().apply { if (minutes == null || minutes <= 0) remove(pkg) else put(pkg, minutes) }
        prefs(c).edit().putStringSet("limits", next.map { "${it.key}=${it.value}" }.toSet()).apply()
    }

    fun pauseSeconds(c: Context) = prefs(c).getInt("pause", 10)
    fun setPauseSeconds(c: Context, s: Int) = prefs(c).edit().putInt("pause", s.coerceIn(0, 60)).apply()

    // --- Focus blocks ---------------------------------------------------------------------------

    fun until(c: Context): Long = prefs(c).getLong("until", 0)
    fun label(c: Context): String = prefs(c).getString("label", "") ?: ""
    fun active(c: Context) = until(c) > System.currentTimeMillis()

    fun start(c: Context, minutes: Int, label: String) {
        val now = System.currentTimeMillis()
        prefs(c).edit().putLong("until", now + minutes * 60_000L).putLong("startedAt", now).putString("label", label).apply()
    }

    /** Ends the block and logs the minutes it ran. */
    fun stop(c: Context) {
        val p = prefs(c)
        val started = p.getLong("startedAt", 0)
        val end = minOf(System.currentTimeMillis(), until(c))
        val minutes = ((end - started) / 60_000).toInt()
        if (started > 0 && minutes > 0) {
            logMinutes(c, minutes)
            Metrics.prepMinutes(minutes)
            if (end >= until(c)) Metrics.ritualOnce("focus")
        }
        p.edit().putLong("until", 0).putLong("startedAt", 0).apply()
    }

    private fun logMinutes(c: Context, minutes: Int) {
        val key = "focused:${LocalDate.now()}"
        prefs(c).edit().putInt(key, prefs(c).getInt(key, 0) + minutes).apply()
    }

    fun focusedMinutes(c: Context, date: LocalDate = LocalDate.now()) = prefs(c).getInt("focused:$date", 0)

    // --- Usage and allowances -------------------------------------------------------------------

    private fun usageKey(pkg: String) = "used:${LocalDate.now()}:$pkg"
    fun usedSeconds(c: Context, pkg: String) = prefs(c).getLong(usageKey(pkg), 0)
    internal fun addUsage(c: Context, pkg: String, seconds: Long) {
        if (seconds <= 0) return
        prefs(c).edit().putLong(usageKey(pkg), usedSeconds(c, pkg) + seconds).apply()
    }

    fun allow(c: Context, pkg: String) =
        prefs(c).edit().putLong("allow:$pkg", System.currentTimeMillis() + ALLOW_MINUTES * 60_000L).apply()
    private fun allowed(c: Context, pkg: String) = prefs(c).getLong("allow:$pkg", 0) > System.currentTimeMillis()

    enum class Why { FOCUS, LIMIT }

    /** Why this app is closed right now, or null if it's open. */
    fun closedReason(c: Context, pkg: String): Why? {
        if (allowed(c, pkg)) return null
        if (active(c) && pkg in blocked(c)) return Why.FOCUS
        val limit = limits(c)[pkg] ?: return null
        return if (usedSeconds(c, pkg) >= limit * 60L) Why.LIMIT else null
    }

    // --- Setup ----------------------------------------------------------------------------------

    fun serviceOn(c: Context): Boolean {
        val want = ComponentName(c, FocusGuard::class.java).flattenToString()
        val on = Settings.Secure.getString(c.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return false
        return on.split(':').any { it.equals(want, ignoreCase = true) }
    }

    fun openSettings(c: Context) = c.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))

    /** Apps with a launcher icon, except this one. */
    fun launchableApps(c: Context): List<App> {
        val pm = c.packageManager
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        return pm.queryIntentActivities(intent, PackageManager.MATCH_ALL)
            .map { App(it.activityInfo.packageName, it.loadLabel(pm).toString()) }
            .filter { it.pkg != c.packageName }
            .distinctBy { it.pkg }
            .sortedBy { it.label.lowercase() }
    }

    fun labelOf(c: Context, pkg: String): String = runCatching {
        c.packageManager.getApplicationLabel(c.packageManager.getApplicationInfo(pkg, 0)).toString()
    }.getOrDefault(pkg)

    fun forget(c: Context) = prefs(c).edit().clear().apply()
}

/**
 * Watches which app comes to the front. If it's closed (focus block or used-up limit), our calm screen
 * opens on top. Counts foreground time only for apps that have a daily limit.
 */
class FocusGuard : AccessibilityService() {
    private var current: String? = null
    private var since = 0L
    private val handler = Handler(Looper.getMainLooper())
    private val recheck = object : Runnable {
        override fun run() {
            flush()
            current?.let { check(it) }
            handler.postDelayed(this, 30_000)
        }
    }
    private val screen = object : BroadcastReceiver() {
        override fun onReceive(c: Context, i: Intent) {
            if (i.action == Intent.ACTION_SCREEN_OFF) { flush(); current = null }
        }
    }

    override fun onServiceConnected() {
        registerReceiver(screen, IntentFilter(Intent.ACTION_SCREEN_OFF))
        handler.postDelayed(recheck, 30_000)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        // Keyboards, system UI and our own screens don't count as switching apps.
        if (pkg == packageName || pkg == "com.android.systemui" || pkg.contains("inputmethod") || pkg.contains("keyboard")) {
            if (pkg == packageName) { flush(); current = null }
            return
        }
        if (pkg == current) return
        flush()
        current = pkg
        since = System.currentTimeMillis()
        check(pkg)
    }

    private fun flush() {
        val pkg = current ?: return
        val now = System.currentTimeMillis()
        if (pkg in Focus.limits(this)) Focus.addUsage(this, pkg, (now - since) / 1000)
        since = now
    }

    private fun check(pkg: String) {
        val why = Focus.closedReason(this, pkg) ?: return
        flush()
        current = null
        startActivity(
            Intent(this, BlockedActivity::class.java)
                .putExtra(BlockedActivity.PKG, pkg)
                .putExtra(BlockedActivity.WHY, why.name)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION),
        )
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        flush()
        handler.removeCallbacks(recheck)
        runCatching { unregisterReceiver(screen) }
        super.onDestroy()
    }
}
