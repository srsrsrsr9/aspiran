package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Cards kept in the open demo (the web app's "reviews" store, inside the demo's WebView) carried into the app's own
 * Review when the visitor joins (ui/TryDemo.kt). The demo tells them "Join free, keep your 3 cards": this keeps it true.
 * Each becomes a saved card with its question, plus a review row with the demo's own schedule (both are FSRS).
 */
object DemoCards {
    /** One demo card, ready for the app's tables. */
    data class Card(val item: NewsItem, val dueOn: String, val stage: Int, val stability: Double, val difficulty: Double, val lastOn: String)

    private const val PREFS = "demo"
    private const val KEY = "reviews"

    /** Held between the demo and the end of sign-up (the database opens after). */
    fun hold(context: Context, raw: String?) {
        if (raw.isNullOrBlank() || raw == "null") return
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, raw.take(200_000)).apply()
    }

    /** What's held, once: read and forget. */
    fun take(context: Context): String? {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return p.getString(KEY, null)?.also { p.edit().remove(KEY).apply() }
    }

    /** The web store's JSON ({ id: { q: { id, topic, en: mcq, hi: mcq|null }, f: { s, d, last, due, reps } } }) as cards. */
    fun parse(raw: String): List<Card> {
        val root = runCatching { Json.parseToJsonElement(raw).jsonObject }.getOrNull() ?: return emptyList()
        return root.mapNotNull { (id, v) -> runCatching { card(id, v.jsonObject) }.getOrNull() }.take(100)
    }

    private fun mcq(o: JsonObject?): Mcq? {
        o ?: return null
        val q = o["question"]?.jsonPrimitive?.contentOrNull ?: return null
        val options = o["options"]?.jsonArray?.mapNotNull { it.jsonPrimitive.contentOrNull } ?: return null
        val answer = o["answerIndex"]?.jsonPrimitive?.intOrNull ?: return null
        if (answer !in options.indices) return null
        return Mcq(q, options, answer, o["explanation"]?.jsonPrimitive?.contentOrNull.orEmpty())
    }

    private fun card(id: String, v: JsonObject): Card? {
        val q = v["q"]?.jsonObject ?: return null
        val f = v["f"]?.jsonObject ?: return null
        val en = mcq(q["en"] as? JsonObject) ?: return null
        val hi = mcq(q["hi"] as? JsonObject)
        val topic = q["topic"]?.jsonPrimitive?.contentOrNull ?: "Polity"
        val item = NewsItem(
            id = id, tone = Tone.NEUTRAL, gsPaper = "GS2", topic = topic, examType = ExamType.PRELIMS, staticLink = "",
            headline = en.question, summary = en.explanation, whyForUpsc = emptyList(),
            examCorner = ExamCorner(mcq = en, keyFacts = emptyList()), sources = emptyList(), shareable = false,
            hi = hi?.let { CardText(it.question, it.explanation, whyForUpsc = emptyList(), mcq = it, keyFacts = emptyList()) },
        )
        val due = f["due"]?.jsonPrimitive?.contentOrNull ?: return null
        return Card(
            item, due, f["reps"]?.jsonPrimitive?.intOrNull ?: 1,
            f["s"]?.jsonPrimitive?.doubleOrNull ?: 0.0, f["d"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
            f["last"]?.jsonPrimitive?.contentOrNull.orEmpty(),
        )
    }
}
