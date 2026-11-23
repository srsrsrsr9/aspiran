package com.upscpods.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

/** The numbers Chotu and Jeetu are given. Run: ./gradlew :app:testDebugUnitTest */
class FactsTest {
    // A Wednesday. The week starts Monday 16 Nov; the month on 1 Nov.
    private val today = LocalDate.of(2026, 11, 18)
    private fun d(back: Long) = today.minusDays(back).toString()

    private fun build(
        minutes: Map<String, List<Int>> = emptyMap(),
        days: Map<String, DayLog> = emptyMap(),
        answers: Map<String, Map<String, List<Int>>> = emptyMap(),
        written: List<LocalDate> = emptyList(),
        mocks: List<MockRecord> = emptyList(),
        reviews: Map<String, Int> = emptyMap(),
    ) = Facts.build(today, minutes, days, answers, written, mocks, reviews)

    private fun mock(day: String, topics: Map<String, TopicTally>) = MockRecord("m$day", "Mock", day, Marking(), 0.0, 0.0, 0, 0, 0, 0, 0, 0, topics, 0)

    @Test fun nothingRecorded() {
        val f = build()
        assertFalse(f.hasAnything)
        assertNull(f.win)
        assertNull(f.quietDays)
        assertNull(f.debrief(false))
        assertFalse(f.jeetuPattern)
    }

    @Test fun weekAndMonthTotals() {
        val f = build(
            // Monday, Tuesday, today; last Sunday is last week but this month; 31 Oct is neither.
            minutes = mapOf(d(2) to listOf(32, 20), d(1) to listOf(32, 32), d(0) to listOf(32, 5), d(3) to listOf(32, 12), "2026-10-31" to listOf(32, 30)),
            answers = mapOf(d(0) to mapOf("Polity" to listOf(3, 5)), d(3) to mapOf("Economy" to listOf(1, 4)), "2026-10-31" to mapOf("Polity" to listOf(9, 9))),
            written = listOf(today, today.minusDays(5), LocalDate.of(2026, 10, 30)),
            mocks = listOf(mock(d(1), mapOf("Geography" to TopicTally(right = 6, wrong = 2, skipped = 3)))),
            reviews = mapOf(d(0) to 4, d(10) to 6, "2026-10-20" to 7),
        )
        assertEquals(96, f.weekPlannedMin)
        assertEquals(57, f.weekDoneMin)
        assertEquals(69, f.monthMinutes)
        // Skipped mock questions don't count as answered.
        assertEquals(5 + 8, f.weekQuestions)
        assertEquals(5 + 4 + 8, f.monthQuestions)
        assertEquals(1, f.weekAnswers)
        assertEquals(2, f.monthAnswers)
        assertEquals(4, f.weekReviews)
        assertEquals(10, f.monthReviews)
        assertEquals(1, f.monthMocks)
        assertEquals(1, f.quietDays)
    }

    @Test fun trendNeedsTwoWeeks() {
        // Only this week: no trend, however good.
        assertTrue(build(answers = mapOf(d(0) to mapOf("Polity" to listOf(9, 10)))).trends.isEmpty())
        // Three weeks: the oldest week with enough questions is the start.
        val f = build(answers = mapOf(
            d(16) to mapOf("Polity" to listOf(7, 12)),   // 58%, two weeks back
            d(9) to mapOf("Polity" to listOf(3, 4)),     // too few to count on its own
            d(1) to mapOf("Polity" to listOf(4, 6)),
            d(0) to mapOf("polity" to listOf(4, 6)),     // same subject, any case: 8 of 12, 67%
        ))
        assertEquals(listOf(Trend("Polity", 58, 67, 3)), f.trends)
        assertEquals("Polity accuracy 58% → 67% over 3 weeks.", StudyFacts.trendLine(f.shownTrend!!, false))
    }

    @Test fun aFallIsKeptButNotShownOnTheCard() {
        val f = build(answers = mapOf(d(8) to mapOf("Economy" to listOf(8, 10)), d(2) to mapOf("Economy" to listOf(5, 10))))
        assertEquals(-30, f.trends.single().change)
        assertNull(f.shownTrend)
    }

    @Test fun stuckBelowHalfTwoWeeksRunning() {
        val f = build(answers = mapOf(
            d(8) to mapOf("Geography" to listOf(2, 6), "Polity" to listOf(2, 6)),
            d(1) to mapOf("Geography" to listOf(2, 5), "Polity" to listOf(4, 6)),
        ))
        assertEquals(listOf("Geography"), f.stuck)
        assertTrue(f.jeetuPattern)
    }

    @Test fun missedOnlyCountsWhatTheStudentChose() {
        val days = mapOf(
            d(1) to DayLog(moved = setOf("MAINS"), firstStep = "Federalism", firstStepDone = false),
            d(3) to DayLog(moved = setOf("MAINS"), firstStep = "Federalism", firstStepDone = false),
            d(6) to DayLog(moved = setOf("MAINS"), done = emptySet(), firstStep = "Rivers", firstStepDone = true),
            d(9) to DayLog(moved = setOf("MAINS"), done = setOf("MAINS"), firstStep = "Rivers", firstStepDone = false),
            // Older than 14 days: not counted.
            d(20) to DayLog(moved = setOf("PRELIMS")),
            d(21) to DayLog(moved = setOf("PRELIMS")),
            d(22) to DayLog(moved = setOf("PRELIMS")),
        )
        val f = build(days = days)
        assertEquals(listOf("1 Mains answer", "Their own first step"), f.missed)
        assertEquals("Federalism", f.yesterdayStep)
        assertFalse(f.yesterdayStepDone)
        // A plain day where nothing was done doesn't count as missing Today's 3.
        assertTrue(build(days = mapOf(d(1) to DayLog(), d(2) to DayLog(), d(3) to DayLog())).missed.isEmpty())
    }

    @Test fun winIsABestWeekNeverAStreak() {
        val answers = mapOf(
            d(16) to mapOf("Polity" to listOf(5, 10)),
            d(9) to mapOf("Polity" to listOf(5, 12)),
            d(1) to mapOf("Polity" to listOf(5, 13)),
        )
        assertEquals("Your most questions in a week so far: 13.", build(answers = answers).win?.first)
        // Not more than before: no "best" claim; falls back to answers written this month.
        val f = build(answers = answers.mapValues { (k, v) -> if (k == d(1)) mapOf("Polity" to listOf(5, 12)) else v }, written = listOf(today))
        assertEquals("Answers written this month: 1.", f.win?.first)
        // No line anywhere mentions days in a row.
        listOf(build(answers = answers), f).forEach { assertFalse(it.block(true).contains("in a row")) }
    }

    @Test fun quietDaysCountsFromTheLastWorkBeforeToday() {
        val f = build(minutes = mapOf(d(5) to listOf(32, 10), d(2) to listOf(32, 0)), days = mapOf(d(4) to DayLog()))
        assertEquals(5, f.quietDays)
    }

    @Test fun privateTextStaysOffTheOnlineBlock() {
        val f = build(days = mapOf(d(1) to DayLog(firstStep = "Read Laxmikanth ch 5", firstStepDone = true)), minutes = mapOf(d(0) to listOf(32, 10)))
        assertTrue(f.block(private = true).contains("Laxmikanth"))
        assertFalse(f.block(private = false).contains("Laxmikanth"))
    }

    @Test fun subjectsFold() {
        assertEquals("Polity", Facts.subjectOf("polity"))
        assertEquals("Modern history", Facts.subjectOf("Modern History"))
        assertEquals("Economy", Facts.subjectOf("eco"))
        assertEquals("Other", Facts.subjectOf(" "))
    }

    @Test fun debriefIsTwoLines() {
        val f = build(answers = mapOf(d(8) to mapOf("Polity" to listOf(3, 6)), d(0) to mapOf("Polity" to listOf(5, 6))))
        assertEquals("That's 6 questions this week and 12 this month.\nPolity accuracy 50% → 83% over 2 weeks.", f.debrief(false))
    }
}
