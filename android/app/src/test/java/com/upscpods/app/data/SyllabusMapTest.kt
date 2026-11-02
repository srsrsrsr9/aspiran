package com.upscpods.app.data

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.LocalDate

/** The same walk-through as the web copy (server/public/app/map.js), with the dates it gives. */
class SyllabusMapTest {
    @Test fun metToRecallToUseAndBack() {
        var n = MapNode.met("notes", LocalDate.parse("2026-11-01"))
        assertEquals(MapState.MET, n.state(LocalDate.parse("2026-11-01")))
        assertEquals("2026-11-04", n.due)
        // The first check is only 3 days on: too soon to count.
        n = n.check(Fsrs.GOOD, LocalDate.parse(n.due))
        assertEquals(MapState.MET, n.state(LocalDate.parse(n.last)))
        assertEquals("2026-11-15", n.due)
        // 11 days on, it counts.
        n = n.check(Fsrs.GOOD, LocalDate.parse(n.due))
        assertEquals(MapState.RECALL, n.state(LocalDate.parse(n.last)))
        assertEquals("2026-12-20", n.due)
        n = n.copy(usedOn = n.last, usedHow = "answer")
        assertEquals(MapState.USE, n.state(LocalDate.parse(n.last)))
        // Unchecked for long enough, it fades back to Met.
        assertEquals(MapState.MET, n.state(LocalDate.parse(n.last).plusDays(200)))
        // A missed check takes it back to Met.
        n = n.check(Fsrs.AGAIN, LocalDate.parse(n.due))
        assertEquals(MapState.MET, n.state(LocalDate.parse(n.last)))
        assertEquals("2026-12-24", n.due)
    }
}
