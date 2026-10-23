package com.upscpods.app.data

import java.text.NumberFormat
import java.time.LocalDate
import java.time.Period
import java.util.Locale
import kotlin.math.roundToInt

/**
 * The Free Shelf's honest tools, the same as the web app's honest.js. Free, no card needed, no account.
 * Numbers are rules from the UPSC notification or rough starting points you change; each says which.
 * Nothing here predicts results or tells anyone to quit or continue.
 */
object Honest {
    // --- Attempt Compass ------------------------------------------------------------------------
    // Age is counted on 1 August of the exam year: 21 or older, and not yet the upper limit.
    // An attempt counts once you sit any Prelims paper. The year's notification on upsc.gov.in is what counts.

    data class Category(val key: String, val label: String, val upper: Int, val attempts: Int?)
    val CATEGORIES = listOf(
        Category("general", "General", 32, 6), Category("ews", "EWS", 32, 6), Category("obc", "OBC", 35, 9),
        Category("sc", "SC", 37, null), Category("st", "ST", 37, null),
    )
    const val PWBD_EXTRA_YEARS = 10
    // PwBD: upper age 42 for General and EWS (and at least 42 for everyone). Secondary sources disagree for OBC-PwBD
    // (45 or 42) and SC/ST-PwBD (47 or 42), so years past 42 for them are shown as "check the UPSC notification",
    // not as fact, until checked against the 2026 notice (founder-approved corrections, 12 Oct 2026).
    const val PWBD_SURE_UPPER = 42
    const val RULES_SOURCE = "UPSC CSE 2026 notification (4 Feb 2026), upsc.gov.in · as of 12 Oct 2026"

    /** Prelims is usually late May or June, so after June it's next year's exam. */
    fun nextExamYear(now: LocalDate = LocalDate.now()) = now.year + if (now.monthValue >= 7) 1 else 0

    /** [check]: only open if the disputed higher PwBD age limit holds. */
    data class OpenYear(val year: Int, val age: Int, val check: Boolean = false)
    data class CompassResult(val upper: Int, val upperCheck: Int?, val attemptsLeft: Int?, val years: List<OpenYear>, val ageLimitFirst: Boolean)

    fun compass(dob: LocalDate, category: String, used: Int, pwbd: Boolean, fromYear: Int = nextExamYear()): CompassResult {
        val c = CATEGORIES.firstOrNull { it.key == category } ?: CATEGORIES[0]
        val claimed = c.upper + if (pwbd) PWBD_EXTRA_YEARS else 0
        val upper = if (pwbd) minOf(claimed, PWBD_SURE_UPPER) else claimed
        val upperCheck = claimed.takeIf { it > upper }
        val limit = upperCheck ?: upper
        val cap = if (pwbd && c.attempts != null) 9 else c.attempts
        val left = cap?.let { maxOf(0, it - maxOf(0, used)) }
        val years = mutableListOf<OpenYear>()
        for (y in fromYear until fromYear + 30) {
            if (years.size >= (left ?: 30)) break
            val age = Period.between(dob, LocalDate.of(y, 8, 1)).years
            if (age >= limit) break
            if (age >= 21) years += OpenYear(y, age, age >= upper)
        }
        return CompassResult(upper, upperCheck, left, years, left == null || years.size < left)
    }

    val COMPASS_QUESTIONS = listOf(
        "What would a good year look like, apart from the result?",
        "What did the last attempt teach you that a book couldn't?",
        "Who would you want to talk this through with? Your pod lead, a senior, someone at home?",
        "If you set a point to look at this again, when would it be? (Only you see this.)",
    )

    // --- Cost of a Year -------------------------------------------------------------------------
    // Rough starting numbers, not facts: change every one to what you actually pay.

    data class CostItem(val key: String, val label: String, val monthly: Boolean)
    val COST_ITEMS = listOf(
        CostItem("rent", "Rent or PG", true), CostItem("food", "Food", true), CostItem("library", "Library seat", true),
        CostItem("misc", "Phone, travel in the city, the rest", true), CostItem("coaching", "Coaching", false),
        CostItem("tests", "Test series", false), CostItem("books", "Books and printouts", false), CostItem("home", "Trips home", false),
    )
    val CITY_PRESETS: List<Pair<String, Map<String, Int>>> = listOf(
        "Delhi" to mapOf("rent" to 14000, "food" to 6000, "library" to 2500, "misc" to 3000, "coaching" to 150000, "tests" to 15000, "books" to 12000, "home" to 8000),
        "Prayagraj" to mapOf("rent" to 5000, "food" to 4000, "library" to 1000, "misc" to 1500, "coaching" to 60000, "tests" to 10000, "books" to 8000, "home" to 4000),
        "Hyderabad" to mapOf("rent" to 8000, "food" to 5000, "library" to 1500, "misc" to 2500, "coaching" to 120000, "tests" to 12000, "books" to 10000, "home" to 6000),
        "Pune" to mapOf("rent" to 9000, "food" to 5000, "library" to 1500, "misc" to 2500, "coaching" to 100000, "tests" to 12000, "books" to 10000, "home" to 6000),
        "From home" to mapOf("rent" to 0, "food" to 0, "library" to 800, "misc" to 1000, "coaching" to 0, "tests" to 8000, "books" to 8000, "home" to 0),
    )

    data class Cost(val year: Int, val month: Int, val forgone: Int) { val withForgone get() = year + forgone }
    fun costOfYear(v: Map<String, Int>, salary: Int): Cost {
        val year = COST_ITEMS.sumOf { (v[it.key] ?: 0) * if (it.monthly) 12 else 1 }
        return Cost(year, (year / 12.0).roundToInt(), salary * 12)
    }
    fun inr(n: Int): String = "₹" + NumberFormat.getIntegerInstance(Locale("en", "IN")).format(n)

    // --- 5-source maps --------------------------------------------------------------------------
    // A map, not a shopping list. The syllabus and past papers are free and come first.

    val MAPS: List<Pair<String, List<Pair<String, String>>>> = listOf(
        "Polity" to listOf(
            "UPSC syllabus and past Prelims papers (Polity)" to "Free on upsc.gov.in. Shows what gets asked before you read anything.",
            "NCERT Class 11: Indian Constitution at Work" to "The ideas behind the articles, in plain language.",
            "M. Laxmikanth, Indian Polity" to "The standard reference. Read chapter by chapter, not cover to cover in one go.",
            "The Constitution of India (bare text)" to "Free on legislative.gov.in. Check articles yourself.",
            "Chai cards tagged Polity" to "Today's news, tied back to the articles above.",
        ),
        "Modern History" to listOf(
            "UPSC syllabus and past Prelims papers (History)" to "Free. Modern India and the freedom struggle come up every year.",
            "NCERT Class 8 Our Pasts III and Class 12 Themes in Indian History III" to "The base story.",
            "Rajiv Ahir, A Brief History of Modern India (Spectrum)" to "The standard Prelims book for modern India.",
            "Bipan Chandra and others, India's Struggle for Independence" to "Depth for Mains, one movement at a time.",
            "Chai cards and thinker cards" to "Anniversaries and people, linked back to the period.",
        ),
        "Geography" to listOf(
            "UPSC syllabus and past papers (Geography)" to "Free. Maps and places get asked a lot.",
            "NCERT Class 11 and 12 Geography (four books)" to "Physical and human geography, India and the world.",
            "G. C. Leong, Certificate Physical and Human Geography" to "Climate and landforms, clearly explained.",
            "A school atlas" to "Use it with every chapter and every news story.",
            "Chai cards with a map" to "Places in the news, on the map.",
        ),
        "Economy" to listOf(
            "UPSC syllabus and past papers (Economy)" to "Free. Shows which concepts repeat.",
            "NCERT Class 11 Indian Economic Development and Class 12 Introductory Macroeconomics" to "Concepts first.",
            "Ramesh Singh, Indian Economy" to "A standard reference for Prelims and Mains.",
            "The latest Economic Survey" to "Free on indiabudget.gov.in. Read the summary chapter first.",
            "The Union Budget highlights" to "Free. The year's numbers, in one place.",
        ),
        "Environment" to listOf(
            "UPSC syllabus and past papers (Environment)" to "Free. A large share of recent Prelims.",
            "NCERT Class 12 Biology, the Ecology unit" to "The science behind the terms.",
            "Shankar IAS, Environment" to "A standard Prelims book.",
            "India State of Forest Report and Ministry of Environment releases" to "Free. Official numbers to quote.",
            "Chai cards tagged Environment" to "Treaties, species and reports in the news.",
        ),
        "Art and Culture" to listOf(
            "UPSC syllabus and past papers (Art and Culture)" to "Free. Asked mostly as Prelims facts.",
            "NCERT Class 11 An Introduction to Indian Art" to "Architecture, painting and sculpture, from the start.",
            "Nitin Singhania, Indian Art and Culture" to "A standard reference.",
            "CCRT website" to "Free. Dance, music and crafts by region.",
            "Chai cards and thinker cards" to "Festivals, sites and people in the news.",
        ),
        "Ethics (GS4)" to listOf(
            "UPSC syllabus and past GS4 papers" to "Free. The case studies show what examiners want.",
            "2nd ARC 4th report, Ethics in Governance" to "Free on darpg.gov.in. The source many answers quote.",
            "One standard GS4 textbook of your choice" to "Pick one and finish it, rather than starting three.",
            "Thinker cards in this app" to "Indian and world thinkers, with a line you can use in an answer.",
            "Your own case-study notebook" to "Write one case a week. Your pod can review it in answer hour.",
        ),
    )

    // --- Thinker of the week --------------------------------------------------------------------
    // In our own words, never a made-up quote.

    data class Thinker(val name: String, val from: String, val idea: String, val use: String)
    val THINKERS = listOf(
        Thinker("Thiruvalluvar", "Tirukkural, couplet 391 (Learning)", "Learn thoroughly what is worth learning, and then live by what you learnt.", "Essay and GS4 answers on education, integrity and character."),
        Thinker("Kautilya", "Arthashastra", "A ruler's own good lies in the good of the people. Governance is judged by their welfare, not the ruler's comfort.", "Intros and conclusions on governance and public service."),
        Thinker("B. R. Ambedkar", "Constituent Assembly, 4 November 1948", "Constitutional morality isn't natural; a country has to cultivate it.", "Polity and GS4 answers on institutions and the spirit of the Constitution."),
        Thinker("M. K. Gandhi", "The talisman, a note from 1948", "When in doubt, think of the poorest person you have seen and ask whether your next step will help them.", "Policy conclusions and GS4 case studies."),
        Thinker("Amartya Sen", "Development as Freedom (1999)", "Development means widening what people are actually able to do and be, not only raising income.", "GS3 economy, social justice and Essay."),
        Thinker("Roediger and Karpicke", "Psychological Science (2006)", "Testing yourself makes learning stick far better than reading the same pages again.", "Why Close the Day asks for one thing from memory, and why Practice brings back what you missed."),
    )
    fun thinkerOfWeek(now: LocalDate = LocalDate.now()): Thinker {
        val week = Math.floorDiv(now.toEpochDay() + 3, 7)
        return THINKERS[Math.floorMod(week, THINKERS.size.toLong()).toInt()]
    }
}
