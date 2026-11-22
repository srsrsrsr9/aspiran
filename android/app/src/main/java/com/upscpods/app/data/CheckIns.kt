package com.upscpods.app.data

/**
 * Chotu's check-ins (artefacts/chotu-jeetu-behaviour-rules-2026-11-22.md §4): fixed, reviewed templates filled with the
 * app's own numbers, in English and Hindi. No model ever writes these. Rules: no guilt, no gap counting, no streaks,
 * no other students, no prices.
 *
 * Moments: "plan" (the morning after a planned first step), "back" (after 3 or more quiet days; the gap is never named)
 * and "week" (Sunday's "Your week").
 */
object CheckIns {
    const val PLAN = "plan"
    const val BACK = "back"
    const val WEEK = "week"

    private fun short(s: String) = s.trim().replace(Regex("\\s+"), " ").let { if (it.length > 60) it.take(57).trimEnd() + "…" else it }

    /** The notification: title and line. Null when there's nothing true to say. */
    fun notification(moment: String, f: StudyFacts, hindi: Boolean): Pair<String, String>? = when (moment) {
        PLAN -> f.yesterdayStep?.takeIf { !f.yesterdayStepDone }?.let { step ->
            if (hindi) "Chotu चेक-इन" to "कल का प्लान: ${short(step)}। कैसा रहा?" else "Chotu check-in" to "Yesterday's plan: ${short(step)}. How did it go?"
        }
        BACK -> if (hindi) "चाय तैयार है" to "आज एक छोटा काम: 5 प्रीलिम्स प्रश्न?" else "Chai's on" to "One small thing today: 5 Prelims questions?"
        WEEK -> if (!f.hasAnything) null
            else if (hindi) "आपका हफ़्ता" to "${f.weekDoneMin} मिनट, ${f.weekQuestions} प्रश्न, ${f.weekAnswers} उत्तर। एक जीत भी है।"
            else "Your week" to "${f.weekDoneMin} min, ${f.weekQuestions} questions, ${f.weekAnswers} answers written. One win inside."
        else -> null
    }

    /** Chotu's first line when the check-in is opened. The student's answer is what the model replies to. */
    fun opening(moment: String, f: StudyFacts, hindi: Boolean): String? = when (moment) {
        PLAN -> f.yesterdayStep?.let { step ->
            if (hindi) "कल आपने तय किया था: \"${short(step)}\"। हो गया, आधा, या अभी नहीं?" else "Yesterday you planned: \"${short(step)}\". Done, half, or not yet?"
        }
        BACK -> if (hindi) "आपको देखकर अच्छा लगा। छोटी शुरुआत करें? पाँच प्रीलिम्स प्रश्न, या एक चाय कार्ड।"
            else "Good to see you. Want a small start? Five Prelims questions, or one Chai card."
        WEEK -> weekLines(f, hindi)?.joinToString("\n")
        else -> null
    }

    /** "Your week": effort totals first, then one win and one trend when the numbers have them. */
    fun weekLines(f: StudyFacts, hindi: Boolean): List<String>? {
        if (!f.hasAnything) return null
        val effort = if (hindi) "इस हफ़्ते: ${f.weekDoneMin} मिनट (तय ${f.weekPlannedMin}), ${f.weekQuestions} प्रश्न, ${f.weekAnswers} उत्तर, ${f.weekReviews} रिव्यू।"
            else "This week: ${f.weekDoneMin} of ${f.weekPlannedMin} planned minutes, ${f.weekQuestions} questions, ${f.weekAnswers} answers written, ${f.weekReviews} reviews."
        val win = f.win?.let { if (hindi) it.second else it.first }
        val trend = f.shownTrend?.let { StudyFacts.trendLine(it, hindi) }
        return listOfNotNull(effort, win, trend)
    }

    /** Quick answers under the "plan" check-in. Sent as the student's own reply. */
    fun planAnswers(hindi: Boolean) = if (hindi) listOf("हो गया", "आधा", "अभी नहीं") else listOf("Done", "Half", "Not yet")
}
