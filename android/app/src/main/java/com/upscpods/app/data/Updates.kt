package com.upscpods.app.data

import android.content.Context
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.IntentSenderRequest
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.appupdate.testing.FakeAppUpdateManager
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import com.upscpods.app.BuildConfig
import java.time.LocalDate

/**
 * "A new version is ready" (26 Nov 2026, owner: most apps show a small pop-over when there's an update).
 * Google Play's in-app updates, the flexible kind: a small card offers it, Play downloads it in the background while the
 * app keeps working, then one tap restarts into the new version. "Later" waits three days before asking again.
 * Only an app installed from Play (internal testing included) ever sees an update; a build run from Android Studio
 * doesn't. Debug builds can fake one with the "fakeUpdate" switch in the "debug" prefs, to see the card.
 */
class Updates(private val context: Context) {
    enum class State { NONE, OFFER, DOWNLOADING, READY }

    var state by mutableStateOf(State.NONE)
        private set
    /** Download progress, 0 to 100, while [State.DOWNLOADING]. */
    var percent by mutableIntStateOf(0)
        private set

    private val prefs = context.getSharedPreferences("updates", Context.MODE_PRIVATE)
    private val fake = BuildConfig.DEBUG && context.getSharedPreferences("debug", Context.MODE_PRIVATE).getBoolean("fakeUpdate", false)
    private val manager: AppUpdateManager = if (fake) FakeAppUpdateManager(context).apply { setUpdateAvailable(BuildConfig.VERSION_CODE + 1) }
        else AppUpdateManagerFactory.create(context)
    private var info: AppUpdateInfo? = null

    private val listener = InstallStateUpdatedListener { s ->
        when (s.installStatus()) {
            InstallStatus.DOWNLOADING -> {
                state = State.DOWNLOADING
                val total = s.totalBytesToDownload()
                percent = if (total > 0) (s.bytesDownloaded() * 100 / total).toInt() else 0
            }
            InstallStatus.DOWNLOADED -> state = State.READY
            InstallStatus.FAILED, InstallStatus.CANCELED -> state = State.NONE
            else -> {}
        }
    }

    init { manager.registerListener(listener) }

    fun release() = manager.unregisterListener(listener)

    /** On every open: a finished download asks for the restart; a new version is offered unless "Later" was recent. */
    fun check(today: LocalDate = LocalDate.now()) {
        manager.appUpdateInfo.addOnSuccessListener { i ->
            info = i
            when {
                i.installStatus() == InstallStatus.DOWNLOADED -> state = State.READY
                i.installStatus() == InstallStatus.DOWNLOADING -> state = State.DOWNLOADING
                i.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE && i.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE) &&
                    !snoozed(today) -> state = State.OFFER
            }
        }
    }

    private fun snoozed(today: LocalDate): Boolean =
        prefs.getString("later", null)?.let { runCatching { LocalDate.parse(it) }.getOrNull() }?.let { today.isBefore(it.plusDays(3)) } ?: false

    /** "Update": Play's own confirm sheet, then the download runs in the background. */
    fun start(launcher: ActivityResultLauncher<IntentSenderRequest>) {
        val i = info ?: return
        state = State.DOWNLOADING
        percent = 0
        runCatching { manager.startUpdateFlowForResult(i, launcher, AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build()) }
            .onFailure { state = State.NONE }
        // Debug only: play the whole download through, so the "Restart" card can be seen.
        if (fake) runCatching { (manager as FakeAppUpdateManager).run { userAcceptsUpdate(); downloadStarts(); downloadCompletes() } }
    }

    /** Play's sheet came back: declined means "Later". */
    fun result(accepted: Boolean) { if (!accepted) later() }

    fun later(today: LocalDate = LocalDate.now()) {
        prefs.edit().putString("later", today.toString()).apply()
        state = State.NONE
    }

    /** "Restart": Play installs and reopens the app. */
    fun restart() {
        if (fake) { state = State.NONE; return }
        manager.completeUpdate()
    }
}
