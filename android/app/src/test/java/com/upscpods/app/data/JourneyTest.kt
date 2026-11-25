package com.upscpods.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate
import java.time.LocalDateTime

/** The first-week path and the "Next up" card (data/Journey.kt). */
class JourneyTest {
    // A Monday, so Wednesday's and Saturday's answer hour doesn't step in.
    private val wed = LocalDateTime.of(2026, 11, 23, 9, 0)
    private fun next(done: Set<Starter> = emptySet(), skipped: Set<Starter> = emptySet(), mem: Memory = Memory(), day: Int = 1, doneToday: Int = 0,
                     prev: LocalDate? = null, now: LocalDateTime = wed) =
        Journey.next(done, skipped, mem, day, doneToday, prev, false, now)

    @Test fun dayOneStartsWithTheChaiThenTheNudgeThenThePod() {
        assertEquals(Starter.CHAI, next().step)
        assertEquals(Go.CHAI, next().go)
        assertEquals(Starter.NUDGE, next(done = setOf(Starter.CHAI), mem = Memory(inReview = 3), doneToday = 1).step)
        assertTrue(next(done = setOf(Starter.CHAI), mem = Memory(inReview = 3), doneToday = 1).line.startsWith("3 cards you answered"))
        // Nudge already set before the step: it's skipped, not asked again.
        assertEquals(Starter.POD, next(done = setOf(Starter.CHAI), mem = Memory(nudgeSet = true), doneToday = 1).step)
    }

    @Test fun atMostThreeStepsADayThenRest() {
        val n = next(done = setOf(Starter.CHAI, Starter.NUDGE, Starter.POD), mem = Memory(chaiDone = true, practiceDone = false), doneToday = 3)
        // Today's practice is the daily loop, not a fourth first-week step.
        assertEquals(Go.PRACTICE, n.go)
        assertNull(n.step)
        val rest = next(done = setOf(Starter.CHAI, Starter.NUDGE, Starter.POD), mem = Memory(chaiDone = true, practiceDone = true), doneToday = 3)
        assertEquals("That's a good day.", rest.title)
        assertEquals(Starter.QUESTIONS, rest.step)
    }

    @Test fun reviewOnlyWhenCardsAreDueAndWeekFromDayFive() {
        val early = setOf(Starter.CHAI, Starter.NUDGE, Starter.POD, Starter.QUESTIONS)
        assertEquals(Starter.ANSWER, next(done = early, day = 2).step)
        assertEquals(Starter.REVIEW, next(done = early, mem = Memory(dueToday = 4), day = 2).step)
        val most = early + Starter.ANSWER + Starter.MOCK
        assertFalse(Journey.open(most, emptySet(), Memory(), 2).contains(Starter.WEEK))
        assertTrue(Journey.open(most, emptySet(), Memory(), 3).contains(Starter.WEEK))
        assertEquals(Starter.WEEK, next(done = early + Starter.ANSWER, day = 5, mem = Memory()).let { Journey.open(early + Starter.ANSWER, setOf(Starter.MOCK), Memory(), 5).first() })
    }

    @Test fun quietHoursAndWelcomeBack() {
        val late = next(now = LocalDateTime.of(2026, 11, 23, 23, 45))
        assertNull(late.cta)
        assertEquals(Go.NONE, late.go)
        assertTrue(next(prev = LocalDate.of(2026, 11, 19)).title.startsWith("Welcome back. "))
        assertFalse(next(prev = LocalDate.of(2026, 11, 22)).title.startsWith("Welcome back"))
    }

    @Test fun afterTheFirstWeekTheDailyLoop() {
        val all = Starter.entries.toSet()
        assertEquals(Go.REVIEW, next(done = all, mem = Memory(dueToday = 6), day = 20).go)
        assertEquals(Go.CHAI, next(done = all, mem = Memory(reviewedToday = true, dueToday = 6), day = 20).go)
        assertEquals(Go.PREP, next(done = all, mem = Memory(chaiDone = true, practiceDone = true), day = 20).go)
        // Answer hour days, with no answer written yet.
        assertEquals(Go.ANSWER, next(done = all, mem = Memory(chaiDone = true, practiceDone = true), day = 20, now = LocalDateTime.of(2026, 11, 25, 18, 0)).go)
    }
}
