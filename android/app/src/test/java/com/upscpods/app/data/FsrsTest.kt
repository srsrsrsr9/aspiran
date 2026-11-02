package com.upscpods.app.data

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * The Kotlin FSRS must schedule exactly like the web copy (server/public/app/fsrs.js), which is checked against
 * ts-fsrs. Expected values are "days:stability:difficulty" per review, produced by fsrs.js. Run: ./gradlew test
 */
class FsrsTest {
    private val cases = mapOf(
        "33333" to "3:3.1730:5.2824 11:10.7389:5.2730 35:34.5776:5.2635 101:100.7483:5.2542 269:269.2838:5.2448",
        "13313" to "1:0.4026:7.1949 3:2.2650:7.1766 7:7.3380:7.1585 2:1.6969:8.0583 4:4.4286:8.0361",
        "4233" to "16:15.6911:3.2245 26:26.1125:4.3189 85:85.4098:4.3138 254:253.8639:4.3088",
        "22143" to "2:1.1839:6.4883 2:2.1482:7.0405 1:0.7831:7.9790 5:5.3379:7.6307 12:12.3283:7.6104",
        "311344" to "3:3.1730:5.2824 1:1.0556:6.7969 1:0.4639:7.8152 3:2.0404:7.7941 15:14.7390:7.4168 73:73.3344:6.9803",
        "23132413" to "2:1.1839:6.4883 5:5.3496:6.4733 1:1.4252:7.5976 3:3.1182:7.5775 4:4.1671:7.9488 20:19.7255:7.5957 3:2.8375:8.3523 6:6.3484:8.3287",
    )

    @Test fun matchesTheWebScheduler() {
        for ((grades, expected) in cases) {
            var card: Fsrs.State? = null
            var day = LocalDate.parse("2026-01-01")
            val got = grades.map { g ->
                val next = Fsrs.review(card, g.digitToInt(), day)
                val line = "${ChronoUnit.DAYS.between(day, next.due)}:${"%.4f".format(java.util.Locale.ROOT, next.stability)}:${"%.4f".format(java.util.Locale.ROOT, next.difficulty)}"
                card = next; day = next.due
                line
            }.joinToString(" ")
            assertEquals("grades $grades", expected, got)
        }
    }
}
