package com.upscpods.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Centre helpers: invite codes, brand colours, doubt topic ids. */
class InstituteTest {
    @Test fun codeFromTypingOrLink() {
        assertEquals("KXR7M2PD", Institute.cleanCode("kxr7-m2pd"))
        assertEquals("KXR7M2PD", Institute.cleanCode(" https://app.aspiran.in/app/#inst/KXR7-M2PD "))
        assertEquals("KXR7M2PD", Institute.cleanCode("https://aspiran.in/join?code=KXR7M2PD"))
        assertEquals("KXR7-M2PD", Institute.showCode("KXR7M2PD"))
    }

    @Test fun brandColours() {
        assertEquals(0xFFFFFFFF, Institute.inkOn("#1a3a6b"))
        assertEquals(0xFF1A1410, Institute.inkOn("#f5e050"))
        assertNull(Institute.inkOn("red"))
        assertEquals(0xFF1A3A6B, Institute.colorOf("#1a3a6b"))
        assertNull(Institute.colorOf(null))
    }

    @Test fun topicIdsMatchServer() {
        val ids = Institute.topics().map { it.first }
        assertTrue(ids.contains("pre-1"))
        assertTrue(ids.contains("gs2-1"))
        assertTrue(ids.none { it.startsWith("prelims") })
    }
}
