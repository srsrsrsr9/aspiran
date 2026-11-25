package com.upscpods.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** The open demo's kept cards, read from the web app's "reviews" store (data/DemoCards.kt). */
class DemoCardsTest {
    private val raw = """{
      "path-pol-federalism:k1": { "q": { "id": "path-pol-federalism:k1", "topic": "Federalism",
        "en": { "question": "Residuary powers lie with:", "options": ["Parliament", "States", "President", "Court"], "answerIndex": 0, "explanation": "Article 248." },
        "hi": null }, "f": { "s": 3.2, "d": 5.1, "last": "2026-11-26", "due": "2026-11-27", "reps": 1, "lapses": 1 } },
      "broken": { "q": { "en": { "question": "No options" } }, "f": { "due": "2026-11-27" } }
    }"""

    @Test fun keepsGoodCardsWithTheirSchedule() {
        val cards = DemoCards.parse(raw)
        assertEquals(1, cards.size)
        val c = cards[0]
        assertEquals("path-pol-federalism:k1", c.item.id)
        assertEquals("2026-11-27", c.dueOn)
        assertEquals(3.2, c.stability, 0.0)
        assertEquals(0, c.item.examCorner.mcq?.answerIndex)
        assertEquals("Federalism", c.item.topic)
        assertNull(c.item.hi)
        assertTrue(!c.item.shareable)
    }

    @Test fun nothingFromJunk() {
        assertEquals(0, DemoCards.parse("null").size)
        assertEquals(0, DemoCards.parse("not json").size)
    }
}
