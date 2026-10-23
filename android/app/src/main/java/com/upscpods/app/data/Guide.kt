package com.upscpods.app.data

import kotlinx.serialization.Serializable
import java.time.LocalDate

/**
 * "Standing on their shoulders" (playbook A16), the reading shelf (A18), and the honest numbers
 * for My Path and Plan B (A10). All of it is plain text written for the app, not quotes.
 *
 * Portraits: the playbook asks for our own illustrated portraits. Until they're drawn, each entry
 * shows initials. Never photos from the web, and never an AI voice of a real person.
 */
data class Thinker(
    val key: String,
    val name: String,
    val idea: String,
    val shaped: String,
    /** Shelf entries that go deeper. */
    val books: List<String> = emptyList(),
) {
    val initials: String get() = name.split(" ", ",").filter { it.firstOrNull()?.isUpperCase() == true }.take(2).joinToString("") { it.take(1) }
}

data class Book(
    val id: String,
    val title: String,
    val author: String,
    val why: String,
    val startWith: String,
    val freeRoute: String,
    /** Only when we know one exists; the content team fills these in. */
    val hindi: String? = null,
)

object Guide {
    /** Which entry a "Why this works" link opens. */
    const val WHY_TODAY = "oakley"
    const val WHY_CLOSE = "roediger"
    const val WHY_EXAM = "kahneman"
    const val WHY_RECALL = "roediger"

    val thinkers = listOf(
        Thinker(
            "oakley", "Barbara Oakley",
            "Starting is the hard part; the discomfort fades a few minutes in. Work in time, not output.",
            "Today's tasks are shown as minutes, with a \"Just 5 minutes\" start. Focus and break blocks in the Pod.",
            listOf("mind-for-numbers"),
        ),
        Thinker(
            "roediger", "Henry Roediger, Jeffrey Karpicke, Robert Bjork",
            "Pulling something out of memory teaches more than reading it again. Spacing the practice makes it last.",
            "Close the Day's \"one thing I can say from memory\", the question from yesterday's Chai, Friday recall and \"Remember these?\".",
            listOf("make-it-stick"),
        ),
        Thinker(
            "kahneman", "Daniel Kahneman (with Amos Tversky)",
            "Fast thinking jumps at familiar words; plans come from the best case; one bad moment can feel like everything.",
            "Exam Corner names the trap. The weekly planning mirror. Late-night words from Chotu.",
            listOf("thinking-fast-slow"),
        ),
        Thinker(
            "fogg", "BJ Fogg",
            "Hang a tiny habit on one you already have, and notice when you do it.",
            "One nudge, at your morning chai time. A quiet acknowledgement when you tick a task.",
            listOf("tiny-habits"),
        ),
        Thinker(
            "gollwitzer", "Peter Gollwitzer and Gabriele Oettingen",
            "\"After X, I'll do Y\" plans get done far more often. Naming the obstacle beats only picturing the goal.",
            "Tomorrow's first step in Close the Day. Monday's wish, outcome, obstacle and plan.",
            listOf("rethinking-positive"),
        ),
        Thinker(
            "neff", "Kristin Neff",
            "Treating yourself kindly after a slip makes the next try more likely, not less.",
            "\"Slipped today. Most people do some days.\" No streaks to break.",
            listOf("self-compassion"),
        ),
        Thinker("milkman", "Katy Milkman", "Fresh starts like Mondays make new habits easier to begin.", "Monday's plan for the week, and a rhythm that resets every Monday."),
        Thinker("kross", "Ethan Kross", "Talking to yourself as you would to a friend takes the heat out of a spiral.", "Chotu at night asks what you'd tell a podmate."),
        Thinker(
            "gigerenzer", "Gerd Gigerenzer and Hans Rosling",
            "\"Of every 1,000 people\" is easier to understand than a percentage. Always ask \"compared to what?\".",
            "My Path's honest numbers and the two-sided Plan B.",
            listOf("factfulness"),
        ),
        Thinker("sierra", "Kathy Sierra", "Make the person good at the thing, and take away every needless decision and badge.", "One main button per screen."),
        Thinker("duke", "Annie Duke", "Judge a decision by what you knew when you made it, not only by how it turned out.", "Repeater stories without shame; Plan B that never recommends."),
        Thinker("heath", "Chip and Dan Heath", "Ideas stick when they're simple, concrete and told as a story.", "How Chai cards are written."),
        Thinker("cialdini", "Robert Cialdini", "People give back when they're given to first. Honest social proof only.", "Ask a favour and Offer help in the Pod, with nothing counted."),
        Thinker("sun-tzu", "Sun Tzu (artist's impression only)", "Know the ground and know yourself before you choose where to fight.", "\"Know the paper, know yourself\" on My Path.", listOf("art-of-war")),
        Thinker("kautilya", "Kautilya (artist's impression only)", "The ruler's good lies in the people's good.", "Governance and ethics cards.", listOf("arthashastra")),
    )

    fun thinker(key: String) = thinkers.firstOrNull { it.key == key }

    /** Free or low-cost routes first. No affiliate links. Chapters to start with are for the content team to check. */
    val shelf = listOf(
        Book(
            "mind-for-numbers", "A Mind for Numbers", "Barbara Oakley",
            "How to start when you're avoiding the work, and why recall beats rereading.",
            "The chapters on procrastination and habits",
            "Free: the \"Learning How to Learn\" course by Oakley and Terrence Sejnowski (free to audit on Coursera). Or your public library.",
        ),
        Book(
            "make-it-stick", "Make It Stick", "Peter Brown, Henry Roediger, Mark McDaniel",
            "The research behind testing yourself and spacing your revision, in plain words.",
            "Chapter 2, on retrieval",
            "Your public or college library.",
        ),
        Book(
            "thinking-fast-slow", "Thinking, Fast and Slow", "Daniel Kahneman",
            "Why plans slip, why one bad mock feels like everything, and how MCQ traps catch fast thinking.",
            "Part 1, on the two systems",
            "Your public library. Kahneman's recorded lectures are free to watch online.",
        ),
        Book(
            "tiny-habits", "Tiny Habits", "BJ Fogg",
            "How to hang a small study habit on something you already do every day.",
            "The chapters on anchor moments",
            "Your public library.",
        ),
        Book(
            "rethinking-positive", "Rethinking Positive Thinking", "Gabriele Oettingen",
            "Why picturing success alone can lower effort, and the WOOP method that fixes it.",
            "The chapters on mental contrasting and WOOP",
            "Free: the WOOP guide and exercises at woopmylife.org.",
        ),
        Book(
            "self-compassion", "Self-Compassion", "Kristin Neff",
            "For the 11 pm guilt spiral after a day that didn't go to plan.",
            "The opening chapters",
            "Free: guided exercises at self-compassion.org.",
        ),
        Book(
            "factfulness", "Factfulness", "Hans Rosling",
            "Numbers you can understand and repeat honestly, useful for essays as much as for yourself.",
            "Chapter 1",
            "Your public library. Free data tools at gapminder.org.",
        ),
        Book(
            "art-of-war", "The Art of War", "Sun Tzu, translated by Lionel Giles (1910)",
            "Short and old, and still the clearest case for knowing yourself before choosing where to spend your effort.",
            "Chapter 3, \"Attack by Stratagem\"",
            "Free: the Giles translation is public domain (Project Gutenberg).",
        ),
        Book(
            "arthashastra", "Arthashastra", "Kautilya, translated by R. Shamasastry (1915)",
            "Ancient Indian thinking on the state, useful for GS2 and the ethics paper.",
            "Book 1",
            "Free: the Shamasastry translation is public domain (archive.org).",
        ),
    )

    fun book(id: String) = shelf.firstOrNull { it.id == id }

    /**
     * Natural frequencies for My Path (A10). DRAFT: derived from the brief's numbers and not yet
     * checked against upsc.gov.in. While [NUMBERS_CHECKED] is false the screen says so.
     */
    const val NUMBERS_CHECKED = false
    const val NUMBERS_LINE = "Of every 1,000 people who sit Prelims, about 24 reach Mains and about 2 are finally selected."
}

/** A quote from the editor-approved quote bank (playbook A17, content C18). Approval is the check. */
@Serializable
data class Quote(
    val text: Bi<String>,
    val author: String,
    val source: String,
    val chapter: String = "",
    val edition: String = "",
    /** night, if-then, know-yourself, monday, finish, exam-trap */
    val useFor: String = "",
    /** A shelf book id for "Read more". */
    val readMore: String? = null,
) {
    val credit: String get() = listOf(author, source, chapter).filter { it.isNotBlank() }.joinToString(", ")
}

/** At most one quote per screen, and only on some days, so it stays special. */
fun ContentLibrary.quoteFor(moment: String, date: LocalDate = LocalDate.now()): Quote? {
    if (date.toEpochDay() % 3 != 0L) return null
    val list = all("quote", Quote.serializer()).map { it.second }.filter { it.useFor == moment }
    return list.getOrNull((date.toEpochDay() / 3 % maxOf(list.size, 1)).toInt())
}
