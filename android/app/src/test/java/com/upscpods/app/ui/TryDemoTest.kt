package com.upscpods.app.ui

import org.junit.Assert.assertEquals
import org.junit.Test

/** The open demo hands over to sign-up when the web app leaves its open routes (ui/TryDemo.kt). */
class TryDemoTest {
    @Test fun routeFromTheFragment() {
        assertEquals("try", routeOf("https://app.aspiran.in/app/#try"))
        assertEquals("try", routeOf("https://app.aspiran.in/app/#try/federalism?lang=hi"))
        assertEquals("tour", routeOf("https://app.aspiran.in/app/#tour"))
        // Join sets the fragment to "#": that's the sign-up.
        assertEquals("", routeOf("https://app.aspiran.in/app/#"))
        assertEquals("", routeOf("https://app.aspiran.in/app/"))
        assertEquals("adda", routeOf("https://app.aspiran.in/app/#adda"))
    }
}
