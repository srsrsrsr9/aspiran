package com.upscpods.app.data

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

/** The facts object sent to the server, Jeetu's plan, and what the morning check-in asks about. */
class JeetuPlanTest {
    private val today = LocalDate.of(2026, 11, 18)
    private fun d(back: Long) = today.minusDays(back).toString()

    @Test fun factsObjectUsesTheServerNames() {
        val f = Facts.build(today,
            minutes = mapOf(d(0) to listOf(30, 20), d(7) to listOf(30, 25)),
            days = mapOf(d(1) to DayLog(firstStep = "Read Laxmikanth ch 5", firstStepDone = false)),
            answers = mapOf(d(8) to mapOf("Polity" to listOf(2, 6)), d(1) to mapOf("Polity" to listOf(2, 5))),
            answersWritten = emptyList(), mocks = emptyList(), reviews = mapOf(d(0) to 3),
        )
        val o = f.json(checkin = "morning_after", planStatus = "half")
        assertEquals("morning_after", o["checkin"]!!.jsonPrimitive.content)
        assertEquals("half", o["plan_status"]!!.jsonPrimitive.content)
        assertEquals(20, o["week"]!!.jsonObject["minutes"]!!.jsonPrimitive.int)
        assertEquals(3, o["week"]!!.jsonObject["reviews"]!!.jsonPrimitive.int)
        assertEquals(25, o["last_week"]!!.jsonObject["minutes"]!!.jsonPrimitive.int)
        val stuck = o["stuck_topics"]!!.jsonArray.single().jsonObject
        assertEquals("Polity", stuck["topic"]!!.jsonPrimitive.content)
        assertEquals(40, stuck["accuracy"]!!.jsonPrimitive.int)
        // The student's own words never go online; the server's size limit is kept easily.
        assertFalse(o.toString().contains("Laxmikanth"))
        assertTrue(o.toString().length < 4000)
    }

    @Test fun planParsesAtMostThreeItems() {
        val o = Json.parseToJsonElement("""{"items":[{"what":"Federalism PYQs","when":"Mon evening","minutes":30},{"what":" "},
            {"what":"Revise Article 356","minutes":20},{"what":"One answer","minutes":15},{"what":"Extra","minutes":5}],"why":"Small and steady."}""").jsonObject
        val p = JeetuPlan.parse(o)!!
        assertEquals(3, p.items.size)
        assertEquals("Federalism PYQs · Mon evening · 30 min", p.items[0].line())
        assertEquals("Small and steady.", p.why)
        assertNull(JeetuPlan.parse(Json.parseToJsonElement("""{"items":[]}""").jsonObject))
        assertNull(JeetuPlan.parse(null))
    }

    @Test fun checkInAsksAboutTheOwnStepFirstThenThePlan() {
        val base = Facts.build(today, emptyMap(), mapOf(d(1) to DayLog(firstStep = "Rivers", firstStepDone = false)), emptyMap(), emptyList(), emptyList(), emptyMap())
        val withPlan = base.copy(planItem = "Federalism PYQs", planItems = listOf("Federalism PYQs · 30 min"))
        assertEquals("Rivers", withPlan.checkOn)
        val ownDone = withPlan.copy(yesterdayStepDone = true)
        assertEquals("Federalism PYQs", ownDone.checkOn)
        assertEquals("From the plan you chose with Jeetu: \"Federalism PYQs\". Done, half, or not yet?", CheckIns.opening(CheckIns.PLAN, ownDone, false))
        assertEquals("Your plan: Federalism PYQs. How did it go?", CheckIns.notification(CheckIns.PLAN, ownDone, false)?.second)
        assertEquals("Federalism PYQs · 30 min", ownDone.json()["today_plan"]!!.jsonArray.single().jsonPrimitive.content)
    }
}
