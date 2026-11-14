package com.upscpods.app.data

import kotlinx.serialization.Serializable

/**
 * "Try it yourself": a short hands-on piece that goes with one Syllabus in a minute video (content kind "interactive",
 * schema aspiran/syllabus-interactive@1). Six kinds share this one shape; each kind reads only its own fields:
 * decide (rounds), order (items in the right order), sort (buckets, items), match (pairs), statements, dial.
 */
@Serializable
data class Interactive(
    val id: String,
    val type: String,
    val typeName: Bi<String>? = null,
    val week: String = "",
    val episode: String = "",
    val episodeN: Int = 0,
    val episodeTitle: String = "",
    val node: String = "",
    val paper: Bi<String>? = null,
    val free: Boolean = false,
    val title: Bi<String>,
    val prompt: Bi<String>,
    val takeaway: Bi<String>,
    val sources: List<String> = emptyList(),
    val rounds: List<TryRound> = emptyList(),
    val items: List<TryItem> = emptyList(),
    val ends: Bi<String>? = null,
    val ends2: Bi<String>? = null,
    val buckets: List<Bi<String>> = emptyList(),
    val pairs: List<TryPair> = emptyList(),
    val left: Bi<String>? = null,
    val right: Bi<String>? = null,
    val statements: List<TryStatement> = emptyList(),
    val unit: Bi<String>? = null,
    val min: Double = 0.0,
    val max: Double = 100.0,
    val step: Double = 1.0,
    val start: Double? = null,
    val answer: Double = 0.0,
    val near: Double = 0.0,
    val explain: Bi<String>? = null,
) {
    companion object {
        val TYPES = setOf("decide", "order", "sort", "match", "statements", "dial")
    }
}

@Serializable
data class TryRound(val situation: Bi<String>, val options: List<TryOption> = emptyList())

@Serializable
data class TryOption(val text: Bi<String>, val best: Boolean = false, val why: Bi<String>? = null)

@Serializable
data class TryItem(val text: Bi<String>, val bucket: Int = 0, val why: Bi<String>? = null, val note: Bi<String>? = null)

@Serializable
data class TryPair(val a: Bi<String>, val b: Bi<String>)

@Serializable
data class TryStatement(val text: Bi<String>, val answer: Boolean = false, val why: Bi<String>? = null)

/** Every approved piece this version of the app can play. */
fun ContentLibrary.interactives(): List<Interactive> =
    all("interactive", Interactive.serializer()).map { it.second }.filter { it.type in Interactive.TYPES }
