package com.upscpods.app

import java.time.LocalDate

/** Names and numbers that must be easy to change in one place. */
object Brand {
    /** Mascot name, pending the ~10-user name test (ux-guide.md, change 4). Always shown with "· AI". */
    const val MASCOT_SHORT = "Chotu"
    const val MASCOT = "$MASCOT_SHORT · AI"

    /** Opt-in in My Path only, shown as a date and never red. Placeholder until UPSC's 2027 calendar. */
    val PRELIMS_DATE: LocalDate = LocalDate.of(2027, 5, 23)
}

data class Helpline(val label: String, val dial: String)

/** Test-dial every number before shipping (ux-guide.md, "Before shipping"). */
object Helplines {
    val main = Helpline("Vandrevala Foundation 9999 666 555", "+919999666555")
    val all = listOf(
        main,
        Helpline("iCall 91529 87821 (Mon to Sat, 10 am to 8 pm)", "+919152987821"),
        Helpline("Emergency 112", "112"),
    )
}
