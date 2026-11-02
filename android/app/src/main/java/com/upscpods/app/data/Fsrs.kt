package com.upscpods.app.data

import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt

/**
 * FSRS-5, the open spaced-repetition scheduler (github.com/open-spaced-repetition), with its published default
 * weights. Each card has a stability (days until recall drops to 90%) and a difficulty (1 to 10), both updated from
 * how the review went. Replaces the old fixed 3/10/30-day ladder (teaching plan, build step 1).
 * The web copy is server/public/app/fsrs.js, checked against ts-fsrs; keep the two in step.
 */
object Fsrs {
    private val W = doubleArrayOf(
        0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
        1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
    )
    private const val DECAY = -0.5
    private const val FACTOR = 19.0 / 81.0
    const val RETENTION = 0.9
    const val MAX_DAYS = 365

    /** How the review went. */
    const val AGAIN = 1
    const val HARD = 2
    const val GOOD = 3
    const val EASY = 4

    data class State(val stability: Double, val difficulty: Double, val last: LocalDate, val due: LocalDate)

    private fun clampD(d: Double) = min(10.0, max(1.0, d))
    private fun initS(g: Int) = max(W[g - 1], 0.1)
    private fun initD(g: Int) = clampD(W[4] - exp(W[5] * (g - 1)) + 1)

    fun retrievability(days: Long, s: Double) = (1 + FACTOR * days / s).pow(DECAY)

    fun intervalDays(s: Double): Int =
        min(MAX_DAYS, max(1, (s / FACTOR * (RETENTION.pow(1 / DECAY) - 1)).roundToInt()))

    private fun nextD(d: Double, g: Int): Double {
        val moved = d + -W[6] * (g - 3) * (10 - d) / 9
        return clampD(W[7] * initD(EASY) + (1 - W[7]) * moved)
    }

    private fun recallS(d: Double, s: Double, r: Double, g: Int): Double {
        val hard = if (g == HARD) W[15] else 1.0
        val easy = if (g == EASY) W[16] else 1.0
        return s * (1 + exp(W[8]) * (11 - d) * s.pow(-W[9]) * (exp((1 - r) * W[10]) - 1) * hard * easy)
    }

    private fun forgetS(d: Double, s: Double, r: Double) =
        min(s, W[11] * d.pow(-W[12]) * ((s + 1).pow(W[13]) - 1) * exp((1 - r) * W[14]))

    private fun shortS(s: Double, g: Int) = s * exp(W[17] * (g - 3 + W[18]))

    private fun stabilityAfter(card: State?, g: Int, day: LocalDate): Double {
        if (card == null) return initS(g)
        val days = max(0L, ChronoUnit.DAYS.between(card.last, day))
        if (days == 0L) return shortS(card.stability, g)
        val r = retrievability(days, card.stability)
        return if (g == AGAIN) forgetS(card.difficulty, card.stability, r) else recallS(card.difficulty, card.stability, r, g)
    }

    /** One review. [card] is null for a card seen for the first time. A harder grade never gets a longer gap. */
    fun review(card: State?, grade: Int, day: LocalDate = LocalDate.now()): State {
        val s = (AGAIN..EASY).map { max(0.1, stabilityAfter(card, it, day)) }
        val ivl = s.map { intervalDays(it) }.toMutableList()
        if (card == null) ivl[0] = min(ivl[0], ivl[1]) else ivl[1] = min(ivl[1], ivl[2])
        ivl[1] = max(ivl[1], ivl[0] + 1)
        ivl[2] = max(ivl[2], ivl[1] + 1)
        ivl[3] = max(ivl[3], ivl[2] + 1)
        val d = if (card == null) initD(grade) else nextD(card.difficulty, grade)
        return State(s[grade - 1], d, day, day.plusDays(min(MAX_DAYS, ivl[grade - 1]).toLong()))
    }
}
