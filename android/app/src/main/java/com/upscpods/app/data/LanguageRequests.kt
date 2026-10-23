package com.upscpods.app.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.util.UUID

/**
 * "Request your language", kept on the phone: which languages this phone asked for, whether they'd help translate,
 * and a random id made only for this (not the member id) so the server can count one request per phone.
 * The server stores a hash of that id, the language and the "I'd help" tick. Nothing else.
 */
class LanguageRequests(context: Context) {
    data class Lang(val code: String, val name: String, val native: String)

    companion object {
        /** Same list as the server's REQUESTABLE. English and Hindi are already in the app. Native names need a native-speaker check. */
        val REQUESTABLE = listOf(
            Lang("hinglish", "Hinglish", "Hinglish"),
            Lang("te", "Telugu", "తెలుగు"), Lang("ta", "Tamil", "தமிழ்"), Lang("bn", "Bengali", "বাংলা"),
            Lang("mr", "Marathi", "मराठी"), Lang("kn", "Kannada", "ಕನ್ನಡ"), Lang("ml", "Malayalam", "മലയാളം"),
            Lang("gu", "Gujarati", "ગુજરાતી"), Lang("or", "Odia", "ଓଡ଼ିଆ"),
        )
    }

    private val prefs = context.getSharedPreferences("lang_requests", Context.MODE_PRIVATE)
    val device: String = prefs.getString("device", null) ?: UUID.randomUUID().toString().replace("-", "").also {
        prefs.edit().putString("device", it).apply()
    }
    var asked by mutableStateOf(prefs.getStringSet("asked", emptySet())!!.toSet())
        private set
    var helper by mutableStateOf(prefs.getBoolean("helper", false))
        private set

    /** Changes not yet on the server (no server set yet, or offline). Sent by [sync]. */
    private var dirty: Set<String> = prefs.getStringSet("dirty", emptySet())!!.toSet()
    private fun save() { prefs.edit().putStringSet("asked", asked).putStringSet("dirty", dirty).putBoolean("helper", helper).apply() }

    /** One tap: ask for a language, or take the request back. Returns what to tell the person. */
    suspend fun toggle(community: Community, l: Lang): String {
        val on = l.code !in asked
        asked = if (on) asked + l.code else asked - l.code
        dirty = dirty + l.code
        save()
        val sent = sync(community)
        return when {
            !sent -> "Saved on this phone. It goes to the team next time you're online."
            on -> "Counted: ${l.name}. Thank you."
            else -> "Taken back: ${l.name}."
        }
    }

    suspend fun updateHelper(community: Community, on: Boolean) {
        helper = on
        dirty = dirty + asked
        save()
        sync(community)
    }

    /** Sends whatever changed since the last time. True when nothing is left to send. */
    suspend fun sync(community: Community): Boolean {
        for (code in dirty) {
            if (!community.requestLanguage(device, code, code in asked, helper)) return false
            dirty = dirty - code
            save()
        }
        return true
    }
    /** Delete my data: forget the requests and the id on this phone (the server's counts hold no link back to it). */
    fun clear() { prefs.edit().clear().apply(); asked = emptySet(); dirty = emptySet(); helper = false }
}
