package com.upscpods.app.data

import com.upscpods.app.BuildConfig

/**
 * Which pod server the app talks to.
 * Debug builds use whatever is typed in Me → My Path (blank means no server).
 * Release builds start on [BuildConfig.DEFAULT_SERVER] (set in app/build.gradle.kts) and only accept https.
 */
object ServerPolicy {
    val default: String get() = BuildConfig.DEFAULT_SERVER.trim().trimEnd('/')

    /** The typed address, or the release default when nothing is typed. */
    fun resolve(typed: String?): String {
        val t = typed?.trim()?.trimEnd('/').orEmpty()
        if (t.isNotEmpty() && check(t) == null) return t
        return if (BuildConfig.DEBUG) t else default
    }

    /** Null when the address is fine for this build, else a sentence for the person. */
    fun check(url: String): String? {
        val u = url.trim()
        if (u.isEmpty()) return null
        if (!u.startsWith("https://") && !u.startsWith("http://")) return "The address should start with https://"
        if (!BuildConfig.DEBUG && u.startsWith("http://")) return "This version only connects over https://"
        return null
    }
}
