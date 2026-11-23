package com.upscpods.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

/** Check-in templates and Chotu's hidden Jeetu tag. */
class CheckInsTest {
    private val today = LocalDate.of(2026, 11, 22)
    private fun facts(step: String? = null, done: Boolean = false, questions: Int = 0) = Facts.build(
        today,
        minutes = mapOf(today.minusDays(1).toString() to listOf(32, 20)),
        days = mapOf(today.minusDays(1).toString() to DayLog(firstStep = step, firstStepDone = done)),
        answers = if (questions > 0) mapOf(today.toString() to mapOf("Polity" to listOf(questions / 2, questions))) else emptyMap(),
        answersWritten = emptyList(), mocks = emptyList(), reviews = emptyMap(),
    )

    @Test fun planCheckInUsesTheStudentsOwnWordsAndNoGuilt() {
        val (title, text) = CheckIns.notification(CheckIns.PLAN, facts("Federalism"), false)!!
        assertEquals("Chotu check-in", title)
        assertEquals("Yesterday's plan: Federalism. How did it go?", text)
        assertEquals("Yesterday you planned: \"Federalism\". Done, half, or not yet?", CheckIns.opening(CheckIns.PLAN, facts("Federalism"), false))
        // Already ticked: nothing to ask.
        assertNull(CheckIns.notification(CheckIns.PLAN, facts("Federalism", done = true), false))
        assertNull(CheckIns.notification(CheckIns.PLAN, facts(), false))
    }

    @Test fun returnNeverNamesTheGap() {
        listOf(false, true).forEach { hi ->
            val words = CheckIns.notification(CheckIns.BACK, facts(), hi)!!.toList().joinToString(" ") + CheckIns.opening(CheckIns.BACK, facts(), hi)
            assertFalse(Regex("days|दिन|missed|gap").containsMatchIn(words))
        }
    }

    @Test fun weekNeedsRealNumbers() {
        val empty = Facts.build(today, emptyMap(), emptyMap(), emptyMap(), emptyList(), emptyList(), emptyMap())
        assertNull(CheckIns.notification(CheckIns.WEEK, empty, false))
        val lines = CheckIns.weekLines(facts(questions = 10), false)!!
        assertEquals("This week: 20 of 32 planned minutes, 10 questions, 0 answers written, 0 reviews.", lines.first())
    }

    @Test fun jeetuTagIsHiddenAndAsksAreSpotted() {
        assertEquals("Try 20 minutes of Polity tonight.", Chotu.untag("Try 20 minutes of Polity tonight. [JEETU]"))
        assertEquals("Start small.", Chotu.untag("Start small. [JEE"))
        assertTrue(Chotu.PLAN_ASK.containsMatchIn("How do I revise Polity?"))
        assertTrue(Chotu.PLAN_ASK.containsMatchIn("mujhe plan bana ke do"))
        assertTrue(Chotu.PLAN_ASK.containsMatchIn("मेरा प्लान बताओ"))
        assertFalse(Chotu.PLAN_ASK.containsMatchIn("What does Article 200 say?"))
    }
}
