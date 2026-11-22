package com.upscpods.app.data

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.addJsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.concurrent.TimeUnit
import kotlin.math.roundToInt

/**
 * Jeetu, the method coach from the trailer "Page 42" (artefacts/jeetu-2026-11-14.md). Chotu does the content;
 * Jeetu only the method. The same lines as the web app's jeetu.js.
 *
 * Rules: always shown under his own name; quiet from 23:30 to 07:00 IST and in result week; never feelings, ranks or
 * results (the server answers those itself); no streaks, timers or scores; still picture, no sound. The server's
 * `jeetu` flag switches him off.
 */
object Jeetu {
    /** Set by the app on every composition: the `jeetu` flag is on and it isn't result week. */
    var enabled by mutableStateOf(true)
    var hindi by mutableStateOf(false)

    private val IST: ZoneId = ZoneId.of("Asia/Kolkata")

    /** True from 23:30 to 07:00 in India, whatever the phone's own time zone. */
    fun quietNow(now: ZonedDateTime = ZonedDateTime.now(IST)): Boolean {
        val t = now.withZoneSameInstant(IST); val hm = t.hour * 60 + t.minute
        return hm >= 23 * 60 + 30 || hm < 7 * 60
    }
    val awake: Boolean get() = enabled && !quietNow()

    /** His lines, by moment: English, then Hindi. */
    val LINES: Map<String, Pair<String, String>> = mapOf(
        "intro" to ("Answer first. Then look. That's the whole method, beta." to "पहले जवाब। फिर देखना। बस यही तरीक़ा है, बेटा।"),
        "reviewStart" to ("You don't have a reading problem, beta. You have a forgetting problem. Ten minutes: pull each one out of your head before you check." to
            "पढ़ने में दिक़्क़त नहीं है, बेटा। भूलने में है। दस मिनट: हर एक को पहले अपने दिमाग़ से निकालो, फिर मिलाओ।"),
        "reviewEnd" to ("Bas. That's today. Each one comes back just when it's about to slip." to "बस। आज का हो गया। हर एक ठीक तब लौटेगा जब फिसलने वाला होगा।"),
        "selfMark" to ("Be your own examiner first, beta. Did you answer what the directive word asked?" to "पहले ख़ुद परीक्षक बनो, बेटा। जो निर्देश-शब्द ने माँगा, क्या वही लिखा?"),
        "second" to ("Now the second opinion. Where you two differ, look again: neither is always right." to "अब दूसरी राय। जहाँ तुम दोनों अलग हो, वहाँ फिर देखो: हमेशा कोई एक सही नहीं होता।"),
        "rewrite" to ("Rewrite only the weakest part. One fix, done well. बस, लिखो।" to "सिर्फ़ सबसे कमज़ोर हिस्सा दोबारा लिखो। एक सुधार, ठीक से। बस, लिखो।"),
        "rereadNote" to ("Answer first, beta. Then look. Say the points out loud before you open your note." to "पहले जवाब, बेटा। फिर देखना। नोट खोलने से पहले मुख्य बातें बोलकर कहो।"),
        "sure" to ("Prelims charges you for \"ish\". Say how sure you are before you look." to "प्रीलिम्स \"शायद\" के भी नंबर काटता है। देखने से पहले बताओ कितने पक्के हो।"),
    )
    fun line(key: String, hindi: Boolean = this.hindi): String = LINES[key]?.let { if (hindi) it.second else it.first } ?: ""

    /** How much came back this week against the three weeks before. rightDays: day → [right, total], this phone only. */
    fun weeklyText(rightDays: Map<String, List<Int>>, today: LocalDate = LocalDate.now(), hindi: Boolean = this.hindi): String {
        fun sum(from: Int, to: Int): Pair<Int, Int> = (from until to).fold(0 to 0) { (r, t), n ->
            val x = rightDays[today.minusDays(n.toLong()).toString()]
            if (x != null && x.size >= 2) (r + x[0]) to (t + x[1]) else (r to t)
        }
        val (r1, t1) = sum(0, 7); val (r0, t0) = sum(7, 28)
        if (t1 < 5 || t0 < 10) return if (hindi) "दो-तीन हफ़्ते के रिव्यू के बाद यहाँ बताऊँगा कि कितना याद आ रहा है। सिर्फ़ तुम्हारे अपने पिछले हफ़्तों से तुलना, किसी और से नहीं।"
            else "After two or three weeks of reviews, I'll tell you here how much is coming back. Only against your own past weeks, never anyone else."
        val a = r1.toDouble() / t1; val b = r0.toDouble() / t0
        val now = (a * 10).roundToInt(); val before = (b * 10).roundToInt()
        return when {
            a - b >= 0.05 -> if (hindi) "इस हफ़्ते पहले से ज़्यादा याद आया: दस में करीब $now, पिछले तीन हफ़्तों में $before। फ़ासले काम कर रहे हैं, बेटा।"
                else "More came back this week: about $now in 10, against $before in 10 in the three weeks before. The gaps are working, beta."
            b - a >= 0.05 -> if (hindi) "इस हफ़्ते थोड़ा कम याद आया: दस में करीब $now, पहले $before। नए टॉपिक आने पर ऐसा होता है। पहले जवाब देते रहो।"
                else "A little less came back this week: about $now in 10, against $before before. That's normal when new topics come in. Keep answering first."
            else -> if (hindi) "पहले जैसा ही: दस में करीब $now। स्थिर रहना अच्छा है, बेटा।" else "About the same as before: $now in 10 coming back. Steady is good, beta."
        }
    }

    const val CARE_REPLY = "That sounds really heavy, and I'm only a program, not a person. Please talk to someone you trust today. In an emergency, call 112."
    const val QUIET_REPLY = "It's late, beta. Close the day and sleep. I'm back at seven."
}

/** One turn of Ask Jeetu. Kept in memory only; never saved. */
data class JeetuTurn(val fromUser: Boolean, val text: String, val id: String = java.util.UUID.randomUUID().toString(), val care: Boolean = false,
    /** The server's sig for hearing this reply (data/Voice.kt), when it may be spoken. */
    val voiceSig: String? = null)

/** Ask Jeetu: method questions to the server's POST /jeetu. The chat is never stored, here or there. */
class JeetuClient(private val server: () -> String) {
    private val http = OkHttpClient.Builder().connectTimeout(8, TimeUnit.SECONDS).readTimeout(40, TimeUnit.SECONDS).addInterceptor(AuthInterceptor).build()
    private val json = Json { ignoreUnknownKeys = true }

    var turns by mutableStateOf(listOf<JeetuTurn>()); private set
    var busy by mutableStateOf(false); private set
    var trouble by mutableStateOf<String?>(null); private set

    suspend fun ask(text: String, hindi: Boolean) {
        val t = text.trim(); if (t.isEmpty() || busy) return
        trouble = null
        // The on-phone distress check first: a matching message never leaves the phone.
        if (DistressMatcher.matches(t)) { turns = turns + JeetuTurn(true, t, care = true) + JeetuTurn(false, Jeetu.CARE_REPLY, care = true); return }
        turns = turns + JeetuTurn(true, t)
        busy = true
        val reply = post(turns.filter { !it.care }.takeLast(8), null, hindi)
        busy = false
        if (reply != null) turns = turns + reply
    }

    /**
     * One question asked from Chotu's "Want Jeetu's take?" chip, with the app's numbers as [facts] (no plan text, nothing
     * from Close the Day). Not added to this screen's turns: the reply shows in Chotu's thread. Null on trouble.
     */
    suspend fun once(question: String, facts: String?, hindi: Boolean): JeetuTurn? {
        trouble = null
        if (DistressMatcher.matches(question)) return JeetuTurn(false, Jeetu.CARE_REPLY, care = true)
        return post(listOf(JeetuTurn(true, question)), facts, hindi)
    }

    private suspend fun post(history: List<JeetuTurn>, facts: String?, hindi: Boolean): JeetuTurn? = withContext(Dispatchers.IO) {
        runCatching {
            val body = buildJsonObject {
                putJsonArray("messages") { history.forEach { x -> addJsonObject { put("role", if (x.fromUser) "user" else "assistant"); put("content", x.text) } } }
                putJsonObject("context") {
                    put("language", if (hindi) "Hindi" else "English")
                    if (facts != null) { put("facts", facts); put("from", "chotu") }
                }
            }
            http.newCall(Request.Builder().url("${server()}/jeetu").post(body.toString().toRequestBody("application/json".toMediaType())).build()).execute().use { r ->
                val o = runCatching { json.parseToJsonElement(r.body.string()).jsonObject }.getOrNull()
                when {
                    o?.get("care")?.jsonPrimitive?.boolean == true -> JeetuTurn(false, Jeetu.CARE_REPLY, care = true)
                    r.isSuccessful && !o?.get("reply")?.jsonPrimitive?.content.isNullOrBlank() -> JeetuTurn(false, o!!["reply"]!!.jsonPrimitive.content, voiceSig = o["voice"]?.jsonPrimitive?.content)
                    else -> { trouble = o?.get("error")?.jsonPrimitive?.content ?: "Jeetu couldn't answer just now. Try again in a minute."; null }
                }
            }
        }.getOrElse { trouble = "Couldn't reach the server. Try again when you're online."; null }
    }

    /** Report one reply: its id, the reason and that reply's text go to the safety queue. No chat history. */
    suspend fun report(turn: JeetuTurn, reason: String): Boolean = withContext(Dispatchers.IO) {
        if (turn.fromUser) return@withContext false
        val body = buildJsonObject { put("messageId", turn.id); put("reason", reason.take(300)); put("text", turn.text.take(2000)) }
        runCatching {
            http.newCall(Request.Builder().url("${server()}/jeetu/report").post(body.toString().toRequestBody("application/json".toMediaType())).build()).execute().use { it.isSuccessful }
        }.getOrDefault(false)
    }
}
