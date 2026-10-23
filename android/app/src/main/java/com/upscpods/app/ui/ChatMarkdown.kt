package com.upscpods.app.ui

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle

/**
 * The little markdown Chotu's models write (online and on the phone), shown as styled text instead of raw
 * symbols: **bold** and __bold__, *italic* and _italic_, `code` without its backticks, headings as a bold
 * line, "-", "*" and "+" bullets as "•", and --- rules dropped. A marker with no partner (often mid-stream)
 * is left out rather than shown.
 */
fun chatMarkdown(text: String): AnnotatedString = buildAnnotatedString {
    val lines = text.lines()
        .filterNot { RULE.matches(it) }
        .map { it.trimEnd() }
    // Dropping a rule can leave blank lines stacked up.
    val kept = lines.filterIndexed { i, l -> l.isNotBlank() || (i > 0 && lines[i - 1].isNotBlank()) }.dropLastWhile { it.isBlank() }
    kept.forEachIndexed { i, raw ->
        if (i > 0) append('\n')
        val heading = HEADING.matchEntire(raw)
        when {
            heading != null -> withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { inline(heading.groupValues[1]) }
            BULLET.matches(raw) -> {
                val m = BULLET.matchEntire(raw)!!
                append(m.groupValues[1]); append("• "); inline(m.groupValues[2])
            }
            else -> inline(raw)
        }
    }
}

/** Bold, italic and code inside one line. */
private fun AnnotatedString.Builder.inline(s: String) {
    var i = 0
    val plain = StringBuilder()
    fun flush() { if (plain.isNotEmpty()) { append(plain.toString()); plain.clear() } }
    while (i < s.length) {
        val c = s[i]
        val double = (c == '*' || c == '_') && s.startsWith("$c$c", i)
        when {
            double -> {
                val end = s.indexOf("$c$c", i + 2)
                if (end > i + 2) {
                    flush()
                    withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { inline(s.substring(i + 2, end)) }
                    i = end + 2
                } else i += 2 // unmatched: drop the marker
            }
            c == '`' -> {
                val end = s.indexOf('`', i + 1)
                if (end > i + 1) { plain.append(s, i + 1, end); i = end + 1 } else i++
            }
            (c == '*' || c == '_') && opensEmphasis(s, i) -> {
                val end = closingEmphasis(s, i)
                if (end > 0) {
                    flush()
                    withStyle(SpanStyle(fontStyle = FontStyle.Italic)) { inline(s.substring(i + 1, end)) }
                    i = end + 1
                } else if (c == '*') i++ else { plain.append(c); i++ }
            }
            else -> { plain.append(c); i++ }
        }
    }
    flush()
}

/** A single * or _ opens emphasis only before a non-space, and _ only at a word's start (snake_case stays). */
private fun opensEmphasis(s: String, i: Int): Boolean {
    val next = s.getOrNull(i + 1) ?: return false
    if (next.isWhitespace()) return false
    return s[i] == '*' || i == 0 || !s[i - 1].isLetterOrDigit()
}

private fun closingEmphasis(s: String, i: Int): Int {
    val c = s[i]
    var j = i + 1
    while (true) {
        j = s.indexOf(c, j + 1)
        if (j < 0) return -1
        // Not a double marker, follows a non-space, and an _ must end the word.
        if (s.getOrNull(j + 1) == c) { j++; continue }
        if (s[j - 1].isWhitespace()) continue
        if (c == '_' && s.getOrNull(j + 1)?.isLetterOrDigit() == true) continue
        return j
    }
}

private val RULE = Regex("^\\s*([-*_])(\\s*\\1){2,}\\s*$")
private val HEADING = Regex("^\\s{0,3}#{1,6}\\s+(.*?)\\s*#*\\s*$")
private val BULLET = Regex("^(\\s*)[-*+]\\s+(.*)$")
