package com.upscpods.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.LocalDate

/** One step of a Jeetu plan, as the server sends it: what, when, and how many minutes. */
@Serializable
data class PlanItem(val what: String, val `when`: String = "", val minutes: Int = 0) {
    fun line() = listOf(what, `when`.takeIf { it.isNotBlank() }, minutes.takeIf { it > 0 }?.let { "$it min" }).filterNotNull().joinToString(" · ")
}

/** A plan from Jeetu (POST /jeetu `plan`): 1 to 3 items and why. Once the student taps "Use this plan", Chotu checks on it. */
@Serializable
data class JeetuPlan(val items: List<PlanItem>, val why: String = "", val acceptedOn: String? = null, val done: Set<Int> = emptySet()) {
    /** The first item not yet marked done. */
    val next: Int? get() = items.indices.firstOrNull { it !in done }

    companion object {
        /** Reads the server's `plan` object; null when it's missing or empty. At most 3 items are kept. */
        fun parse(o: JsonObject?): JeetuPlan? = runCatching {
            val items = o!!["items"]!!.jsonArray.mapNotNull { e ->
                val x = e.jsonObject
                val what = x["what"]?.jsonPrimitive?.content?.trim().orEmpty()
                if (what.isEmpty()) null else PlanItem(what.take(120), x["when"]?.jsonPrimitive?.content?.trim().orEmpty().take(40), x["minutes"]?.jsonPrimitive?.intOrNull ?: 0)
            }.take(3)
            if (items.isEmpty()) null else JeetuPlan(items, o["why"]?.jsonPrimitive?.content?.trim().orEmpty())
        }.getOrNull()
    }
}

/**
 * The plan the student accepted. Kept on this phone for 7 days; Chotu's morning check-in asks about its next item
 * when the student set no first step of their own.
 */
object JeetuPlans {
    const val KEEP_DAYS = 7L
    private val json = Json { ignoreUnknownKeys = true }
    private fun prefs(c: Context) = c.getSharedPreferences("jeetuPlan", Context.MODE_PRIVATE)

    fun current(c: Context, today: LocalDate = LocalDate.now()): JeetuPlan? =
        prefs(c).getString("plan", null)?.let { runCatching { json.decodeFromString<JeetuPlan>(it) }.getOrNull() }
            ?.takeIf { p -> p.acceptedOn?.let { runCatching { !LocalDate.parse(it).isBefore(today.minusDays(KEEP_DAYS)) }.getOrNull() } == true }

    fun accept(c: Context, plan: JeetuPlan, today: LocalDate = LocalDate.now()) =
        prefs(c).edit().putString("plan", json.encodeToString(JeetuPlan.serializer(), plan.copy(acceptedOn = today.toString(), done = emptySet()))).apply()

    /** The student answered the check-in about the next item (done, half or not yet): each item is asked about once. */
    fun markNextAnswered(c: Context) {
        val p = current(c) ?: return
        val i = p.next ?: return
        prefs(c).edit().putString("plan", json.encodeToString(JeetuPlan.serializer(), p.copy(done = p.done + i))).apply()
    }

    fun forget(c: Context) = prefs(c).edit().clear().apply()
}
