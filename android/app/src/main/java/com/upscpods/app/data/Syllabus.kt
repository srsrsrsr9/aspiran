package com.upscpods.app.data

// The UPSC Civil Services syllabus, paper by paper, in short headings taken from the official notification (public
// text on upsc.gov.in). Prep's Syllabus tab and the strip on Today are built from it (sell-first plan W2). Each topic
// names the library subjects it draws on (the Prep.SUBJECTS keys) and, where one subject spans several topics, the
// words that put a piece under this one.

data class SyllabusTopic(val name: String, val subjects: Set<String>, val words: Regex? = null) {
    fun matches(subject: String, text: String) = subject in subjects && (words == null || words.containsMatchIn(text))
}

data class SyllabusPaper(val id: String, val short: String, val name: String, val lead: String, val topics: List<SyllabusTopic>)

private fun t(name: String, vararg subjects: String, words: String? = null) =
    SyllabusTopic(name, subjects.toSet(), words?.let { Regex(it, RegexOption.IGNORE_CASE) })

val SYLLABUS: List<SyllabusPaper> = listOf(
    SyllabusPaper("prelims", "Prelims", "Prelims GS Paper I", "100 questions, 200 marks, −⅓ for a wrong answer. The gate to everything.", listOf(
        t("Current events of national and international importance", "ir", "eco", "env", "sci", "more"),
        t("History of India and the Indian National Movement", "his", "anc", "art"),
        t("Indian and world geography", "geo"),
        t("Indian polity and governance", "pol"),
        t("Economic and social development", "eco", "soc"),
        t("Environment, biodiversity and climate change", "env"),
        t("General science", "sci"),
    )),
    SyllabusPaper("csat", "CSAT", "Prelims Paper II (CSAT)", "Qualifying at 33%. Easy to ignore, painful to fail.", listOf(
        t("Comprehension", "csat", words = "comprehen|passage|read"),
        t("Logical reasoning and analytical ability", "csat", words = "logic|reason|syllog|puzzle|series"),
        t("Decision making and problem solving", "csat", words = "decision|problem"),
        t("General mental ability", "csat", words = "mental|pattern|direction|blood|calendar|clock"),
        t("Basic numeracy and data interpretation", "csat", words = "number|numer|data|percent|ratio|average|graph|table"),
        t("Interpersonal and communication skills", "csat", words = "communicat|interpersonal"),
    )),
    SyllabusPaper("gs1", "GS1", "Mains GS Paper I", "Heritage, history, society and geography. 250 marks.", listOf(
        t("Indian culture: art forms, literature and architecture", "art", "anc"),
        t("Modern Indian history, mid-18th century on", "his", words = "british|company|1857|colonial|reform|modern|plassey|governor"),
        t("The freedom struggle and its contributors", "his", words = "freedom|congress|gandhi|swadeshi|movement|quit|nehru|bose|satyagraha"),
        t("Post-independence consolidation", "his", words = "partition|integration|states reorgan|independence|1947|princely"),
        t("World history: revolutions, wars, colonisation", "his", words = "world|revolution|war|french|russian|industrial"),
        t("Indian society, diversity, women, population and urbanisation", "soc"),
        t("Physical geography of the world", "geo", words = "plate|ocean|current|atmos|climate|earth|wind|monsoon|nino"),
        t("Resources and location of industries", "geo", words = "resource|mineral|industr|agri|crop|energy"),
        t("Earthquakes, tsunamis, cyclones and other phenomena", "geo", words = "earthquake|tsunami|cyclone|volcan|flood|landslide"),
    )),
    SyllabusPaper("gs2", "GS2", "Mains GS Paper II", "Constitution, governance, social justice and world affairs. 250 marks.", listOf(
        t("Constitution: making, features, amendments, basic structure", "pol", words = "constitution|preamble|amendment|basic structure|right|article|duty|directive"),
        t("Federalism and Centre–State relations", "pol", words = "federal|state|governor|centre|finance commission|schedule"),
        t("Parliament and state legislatures", "pol", words = "parliament|lok sabha|rajya|bill|session|legislat|speaker|committee|defection"),
        t("Executive and judiciary", "pol", words = "president|prime minister|cabinet|court|judic|judge|pil|executive"),
        t("Elections and the Representation of the People Act", "pol", words = "election|vote|electoral|eci|representation"),
        t("Constitutional, statutory and regulatory bodies", "pol", words = "commission|cag|upsc|niti|lokpal|nhrc|cic|tribunal|body"),
        t("Governance, transparency, e-governance and civil services", "pol", "soc", words = "governance|rti|transparen|citizen|civil service|accountab"),
        t("Welfare schemes, health, education, poverty and hunger", "soc", "eco", words = "scheme|welfare|health|education|poverty|hunger|nutrition|shg|ngo"),
        t("India and its neighbourhood", "ir", words = "neighbour|pakistan|china|nepal|bangladesh|sri lanka|bhutan|myanmar|maldives|afghan"),
        t("Groupings, agreements and international institutions", "ir", words = "\\bun\\b|wto|imf|brics|quad|sco|g20|asean|saarc|agreement|treaty|summit"),
        t("Indian diaspora and other countries' policies", "ir", words = "diaspora|us |usa|russia|europe|gulf|policy"),
    )),
    SyllabusPaper("gs3", "GS3", "Mains GS Paper III", "Economy, agriculture, science, environment and security. 250 marks.", listOf(
        t("Economy: growth, planning, employment and inclusion", "eco", words = "growth|gdp|plan|employ|inclus|inflation|monetary|rbi|bank"),
        t("Government budgeting and taxation", "eco", words = "budget|tax|gst|fiscal|deficit"),
        t("Agriculture: crops, irrigation, MSP, PDS, food processing", "eco", "geo", words = "agri|crop|farm|irrigat|msp|pds|food|land reform"),
        t("Industry, liberalisation and infrastructure", "eco", words = "industr|liberal|infra|road|rail|port|invest|ppp"),
        t("Science and technology: space, IT, biotech, IPR", "sci"),
        t("Conservation, pollution and environmental impact", "env"),
        t("Disaster management", "env", "geo", words = "disaster|flood|cyclone|drought|earthquake|ndma"),
        t("Internal security: extremism, borders, cyber, money laundering", "ir", "sci", words = "security|terror|extrem|border|cyber|naxal|insurg|laundering"),
    )),
    SyllabusPaper("gs4", "GS4", "Mains GS Paper IV: Ethics", "Ethics, integrity and aptitude, with case studies. 250 marks.", listOf(
        t("Ethics and human interface", "eth", words = "ethic|moral|value|human"),
        t("Attitude, aptitude and foundational values", "eth", words = "attitude|aptitude|integrity|impartial|empathy|tolerance|compassion"),
        t("Emotional intelligence", "eth", words = "emotion"),
        t("Moral thinkers of India and the world", "eth", words = "thinker|gandhi|kant|aristotle|buddha|ambedkar|philosoph"),
        t("Public service values, probity and accountability", "eth", words = "probity|public service|accountab|corruption|code of conduct|governance"),
        t("Case studies", "eth", words = "case|dilemma"),
    )),
    SyllabusPaper("essay", "Essay", "Essay paper", "Two essays in three hours. 250 marks.", listOf(
        t("Essays on varied topics", "ess"),
        t("Answer structure and writing practice", "mains"),
    )),
)

/** The id a node map uses for a paper: Syllabus ids, except Prelims GS Paper I is "pre". */
fun SyllabusPaper.nodePrefix() = if (id == "prelims") "pre" else id

/** A topic's node id: "gs2-1" is GS2's first topic, "pre-3" the third Prelims one. */
fun SyllabusPaper.nodeId(topic: SyllabusTopic) = "${nodePrefix()}-${topics.indexOf(topic) + 1}"

/** The paper a node id's first part names ("pre", "prelims-gs", "mains-gs3", "ethics" …), or null. */
fun syllabusPaperOf(key: String): SyllabusPaper? = when (key.lowercase()) {
    "pre", "prelims", "prelims-gs", "gs", "pre-gs" -> "prelims"
    "csat", "prelims-csat", "pre-csat" -> "csat"
    "gs1", "mains-gs1" -> "gs1"
    "gs2", "mains-gs2" -> "gs2"
    "gs3", "mains-gs3" -> "gs3"
    "gs4", "mains-gs4", "ethics" -> "gs4"
    "essay", "mains-essay" -> "essay"
    else -> null
}?.let { p -> SYLLABUS.firstOrNull { it.id == p } }

/**
 * Where a node id sits: "gs2-1" is GS2's first topic; "pre-pol" is the Prelims topic that draws on the polity subject
 * (or whose name has the word); "gs3" alone is the paper with no topic. Null for ids we can't place.
 */
fun syllabusNode(id: String): Pair<SyllabusPaper, SyllabusTopic?>? {
    val paper = syllabusPaperOf(id.substringBefore('-')) ?: return null
    val rest = id.substringAfter('-', "")
    val topic = rest.toIntOrNull()?.let { paper.topics.getOrNull(it - 1) }
        ?: rest.takeIf { it.isNotBlank() }?.let { word ->
            val w = word.replace('-', ' ').lowercase()
            paper.topics.firstOrNull { it.name.lowercase().contains(w) } ?: paper.topics.firstOrNull { t -> t.subjects.any { w.startsWith(it) } }
        }
    return paper to topic
}
