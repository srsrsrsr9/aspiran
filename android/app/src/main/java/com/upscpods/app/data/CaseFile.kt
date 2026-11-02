package com.upscpods.app.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import java.time.LocalDate

/** One example kept from a Chai card: the line in your words, its paper and, if you chose one, its syllabus topic. */
@Serializable
data class CaseEntry(val id: String, val cardId: String, val paper: String, val node: String? = null, val example: String, val from: String, val day: String)

val CASE_PAPERS = listOf("GS1", "GS2", "GS3", "GS4", "Essay")

/**
 * Case files (teaching plan, Chai v2: Keep for Mains). You pick what goes in; the app suggests the paper and line once.
 * Kept on this phone. The web copy is caseFile in app.js.
 */
class CaseFile(context: Context) {
    private val prefs = context.getSharedPreferences("casefile", Context.MODE_PRIVATE)
    private val ser = ListSerializer(CaseEntry.serializer())
    private val json = Json { ignoreUnknownKeys = true }

    var entries by mutableStateOf(runCatching { json.decodeFromString(ser, prefs.getString("entries", "[]")!!) }.getOrDefault(emptyList())); private set

    fun has(cardId: String) = entries.any { it.cardId == cardId }
    fun keep(cardId: String, paper: String, node: String?, example: String, from: String) {
        entries = (entries + CaseEntry(System.currentTimeMillis().toString(36), cardId, paper, node, example.take(600), from, LocalDate.now().toString())).takeLast(2000)
        save()
    }
    fun remove(id: String) { entries = entries.filterNot { it.id == id }; save() }
    private fun save() = prefs.edit().putString("entries", json.encodeToString(ser, entries)).apply()

    /** The syllabus topics of a paper, as (node id, name). */
    fun topicsOf(paper: String): List<Pair<String, String>> = SYLLABUS_NODES.filter { it.first.substringBefore('-') == paper.lowercase() }
}
