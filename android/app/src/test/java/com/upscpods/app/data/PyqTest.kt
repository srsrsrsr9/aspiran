package com.upscpods.app.data

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PyqTest {
    private val json = Json { ignoreUnknownKeys = true }

    private val csat = """
        {"id":"csp-2016-csat","exam":"prelims","year":2016,"paper":"csat","answerKey":{"status":"official"},
         "passages":[{"id":"p1","en":{"text":"Accountability is a major factor."}}],
         "questions":[
           {"n":"1","nodes":["csat-1"],"en":{"q":"What does the passage imply?","options":["a","b","c","d"]},"answer":2,"passage":"p1"},
           {"n":"2","nodes":["csat-5"],"en":{"q":"What is 2 + 2?","options":["3","4","5","6"]},"answer":1},
           {"n":"3","nodes":["csat-1"],"en":{"q":"A question whose passage is missing","options":["a","b","c","d"]},"answer":0,"passage":"p9"}
         ]}
    """.trimIndent()

    @Test
    fun csatQuestionsCarryTheirPassage() {
        val paper = json.decodeFromString<PyqPaper>(csat)
        assertEquals("Accountability is a major factor.", paper.passageOf(paper.questions[0]))
        assertNull(paper.passageOf(paper.questions[1]))
    }

    @Test
    fun aQuestionWithoutItsPassageNeverShows() {
        val paper = json.decodeFromString<PyqPaper>(csat)
        assertEquals(listOf("1", "2"), Pyqs.all(listOf(paper)).map { it.q.n })
    }

    @Test
    fun papersWithoutPassagesStillDecode() {
        val paper = json.decodeFromString<PyqPaper>("""{"id":"csp-2025-gs1","exam":"prelims","year":2025,"paper":"prelims","questions":[{"n":"1","en":{"q":"Q","options":["a","b","c","d"]},"answer":0}]}""")
        assertEquals(1, Pyqs.all(listOf(paper)).size)
    }
}
