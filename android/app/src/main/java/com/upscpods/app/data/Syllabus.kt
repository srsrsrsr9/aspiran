package com.upscpods.app.data

// The UPSC Civil Services syllabus, paper by paper, in short headings taken from the official notification (public
// text on upsc.gov.in). Prep's Syllabus tab and the strip on Today are built from it (sell-first plan W2). Each topic
// names the library subjects it draws on (the Prep.SUBJECTS keys) and, where one subject spans several topics, the
// words that put a piece under this one.

data class SyllabusTopic(val name: String, val subjects: Set<String>, val words: Regex? = null) {
    fun matches(subject: String, text: String) = subject in subjects && (words == null || words.containsMatchIn(text))
}

// forOptional: the optional subject that shows this paper, matched against the member's answer to "Your Mains
// optional?". Null for the papers every member sits.
data class SyllabusPaper(val id: String, val short: String, val name: String, val lead: String, val topics: List<SyllabusTopic>, val forOptional: Regex? = null)

private fun optional(words: String) = Regex(words, RegexOption.IGNORE_CASE)

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
    // The two qualifying language papers. Marks don't count in the ranking, but failing either voids the rest.
    SyllabusPaper("lang", "Indian language", "Paper A: Indian language", "Qualifying, 300 marks, 25% to pass. One of the Eighth Schedule languages.", listOf(
        t("Comprehension of given passages"),
        t("Précis writing"),
        t("Usage and vocabulary"),
        t("Short essays"),
        t("Translation from English into the Indian language"),
        t("Translation from the Indian language into English"),
    )),
    SyllabusPaper("english", "English", "Paper B: English", "Qualifying, 300 marks, 25% to pass.", listOf(
        t("Comprehension of given passages"),
        t("Précis writing"),
        t("Usage and vocabulary"),
        t("Short essays"),
    )),
    // The optional papers the open rooms name, two papers of 250 marks each. Topics carry no library subjects yet,
    // so they never pull pieces away from the GS topics above.
    SyllabusPaper("psir1", "PSIR I", "Optional: Political Science and IR, Paper I", "Political theory and Indian government and politics. 250 marks.", listOf(
        t("Political theory: meaning and approaches"),
        t("Theories of the State"),
        t("Justice"),
        t("Equality"),
        t("Rights"),
        t("Democracy"),
        t("Concept of power, hegemony, ideology and legitimacy"),
        t("Political ideologies"),
        t("Indian political thought"),
        t("Western political thought"),
        t("Indian nationalism"),
        t("Making of the Indian Constitution"),
        t("Salient features of the Indian Constitution"),
        t("Principal organs of the Union and State governments"),
        t("Grassroots democracy"),
        t("Statutory institutions and commissions"),
        t("Federalism"),
        t("Planning and economic development"),
        t("Caste, religion and ethnicity in Indian politics"),
        t("Party system"),
        t("Social movements"),
    ), forOptional = optional("psir|political science|international relations|\\bpol\\b")),
    SyllabusPaper("psir2", "PSIR II", "Optional: Political Science and IR, Paper II", "Comparative politics, international relations, and India and the world. 250 marks.", listOf(
        t("Comparative politics: nature and major approaches"),
        t("The State in comparative perspective"),
        t("Politics of representation and participation"),
        t("Globalisation"),
        t("Approaches to the study of international relations"),
        t("Key concepts in international relations"),
        t("Changing international political order"),
        t("Evolution of the international economic system"),
        t("The United Nations"),
        t("Regionalisation of world politics"),
        t("Contemporary global concerns"),
        t("Indian foreign policy"),
        t("India's contribution to the Non-Alignment Movement"),
        t("India and South Asia"),
        t("India and the Global South"),
        t("India and the global centres of power"),
        t("India and the UN system"),
        t("India and the nuclear question"),
        t("Recent developments in Indian foreign policy"),
    ), forOptional = optional("psir|political science|international relations|\\bpol\\b")),
    SyllabusPaper("socio1", "Sociology I", "Optional: Sociology, Paper I", "Fundamentals of sociology. 250 marks.", listOf(
        t("Sociology: the discipline"),
        t("Sociology as science"),
        t("Research methods and analysis"),
        t("Sociological thinkers"),
        t("Stratification and mobility"),
        t("Works and economic life"),
        t("Politics and society"),
        t("Religion and society"),
        t("Systems of kinship"),
        t("Social change in modern society"),
    ), forOptional = optional("socio")),
    SyllabusPaper("socio2", "Sociology II", "Optional: Sociology, Paper II", "Indian society: structure and change. 250 marks.", listOf(
        t("Perspectives on the study of Indian society"),
        t("Impact of colonial rule on Indian society"),
        t("Rural and agrarian social structure"),
        t("Caste system"),
        t("Tribal communities in India"),
        t("Social classes in India"),
        t("Systems of kinship in India"),
        t("Religion and society in India"),
        t("Visions of social change in India"),
        t("Rural and agrarian transformation"),
        t("Industrialisation and urbanisation"),
        t("Politics and society in India"),
        t("Social movements in modern India"),
        t("Population dynamics"),
        t("Challenges of social transformation"),
    ), forOptional = optional("socio")),
    SyllabusPaper("geog1", "Geography I", "Optional: Geography, Paper I", "Principles of geography: physical and human. 250 marks.", listOf(
        t("Geomorphology"),
        t("Climatology"),
        t("Oceanography"),
        t("Biogeography"),
        t("Environmental geography"),
        t("Perspectives in human geography"),
        t("Economic geography"),
        t("Population and settlement geography"),
        t("Regional planning"),
        t("Models, theories and laws in human geography"),
    ), forOptional = optional("geog")),
    SyllabusPaper("geog2", "Geography II", "Optional: Geography, Paper II", "Geography of India. 250 marks.", listOf(
        t("Physical setting"),
        t("Resources"),
        t("Agriculture"),
        t("Industry"),
        t("Transport, communication and trade"),
        t("Cultural setting"),
        t("Settlements"),
        t("Regional development and planning"),
        t("Political aspects"),
        t("Contemporary issues"),
    ), forOptional = optional("geog")),
    SyllabusPaper("anthro1", "Anthropology I", "Optional: Anthropology, Paper I", "Physical, social and cultural anthropology. 250 marks.", listOf(
        t("Meaning, scope and branches of anthropology"),
        t("Human evolution and the emergence of man; primates"),
        t("Fossil evidence and the biological basis of life"),
        t("Principles of prehistoric archaeology"),
        t("The nature of culture and society"),
        t("Marriage, family and kinship"),
        t("Economic organisation"),
        t("Political organisation and social control"),
        t("Religion"),
        t("Anthropological theories"),
        t("Culture, language and communication"),
        t("Research methods in anthropology"),
        t("Human genetics"),
        t("Race and racism; biological variation"),
        t("Human growth, demography and applied anthropology"),
    ), forOptional = optional("anthro")),
    SyllabusPaper("anthro2", "Anthropology II", "Optional: Anthropology, Paper II", "Indian society and tribal India. 250 marks.", listOf(
        t("Evolution of Indian culture and civilisation"),
        t("Palaeo-anthropological evidence from India"),
        t("Ethno-archaeology in India"),
        t("Demographic profile of India"),
        t("The traditional Indian social system"),
        t("Caste system in India"),
        t("Sacred complex and nature-man-spirit complex"),
        t("Impact of Buddhism, Jainism, Islam and Christianity on Indian society"),
        t("Emergence and growth of anthropology in India"),
        t("Indian village"),
        t("Linguistic and religious minorities"),
        t("Indigenous and exogenous processes of socio-cultural change"),
        t("Tribal situation in India and its problems"),
        t("Development projects and tribal displacement"),
        t("Scheduled Castes, Scheduled Tribes and Other Backward Classes; constitutional safeguards"),
        t("Ethnicity, tribal movements and the nation-state"),
        t("Tribal administration, plans and policies, including PESA"),
        t("Role of anthropology in tribal and rural development"),
    ), forOptional = optional("anthro")),
    SyllabusPaper("hist1", "History I", "Optional: History, Paper I", "Ancient and medieval India. 250 marks.", listOf(
        t("Sources"),
        t("Pre-history and proto-history"),
        t("Indus Valley Civilisation"),
        t("Megalithic cultures"),
        t("Aryans and the Vedic period"),
        t("Period of Mahajanapadas"),
        t("Mauryan Empire"),
        t("Post-Mauryan period"),
        t("Early state and society in eastern India, the Deccan and South India"),
        t("Guptas, Vakatakas and Vardhanas"),
        t("Regional states during the Gupta era"),
        t("Themes in early Indian cultural history"),
        t("Early medieval India, 750-1200"),
        t("Cultural traditions in India, 750-1200"),
        t("The thirteenth century"),
        t("The fourteenth century"),
        t("Society, culture and economy in the thirteenth and fourteenth centuries"),
        t("Fifteenth and early sixteenth century: political developments and economy"),
        t("Fifteenth and early sixteenth century: society and culture"),
        t("Akbar"),
        t("Mughal Empire in the seventeenth century"),
        t("Economy and society in the sixteenth and seventeenth centuries"),
        t("Culture in the Mughal Empire"),
        t("The eighteenth century"),
    ), forOptional = optional("hist")),
    SyllabusPaper("hist2", "History II", "Optional: History, Paper II", "Modern India and world history. 250 marks.", listOf(
        t("European penetration into India"),
        t("British expansion in India"),
        t("Early structure of the British Raj"),
        t("Economic impact of British colonial rule"),
        t("Social and cultural developments"),
        t("Social and religious reform movements"),
        t("Indian response to British rule"),
        t("Factors leading to the birth of Indian nationalism"),
        t("Rise of Gandhi and the character of Gandhian nationalism"),
        t("Constitutional developments, 1858-1935"),
        t("Other strands in the national movement"),
        t("Politics of separatism"),
        t("Consolidation as a nation"),
        t("Caste and ethnicity after 1947"),
        t("Economic development and political change"),
        t("Enlightenment and modern ideas"),
        t("Origins of modern politics"),
        t("Industrialisation"),
        t("Nation-state system"),
        t("Imperialism and colonialism"),
        t("Revolution and counter-revolution"),
        t("World Wars"),
        t("The world after World War II"),
        t("Liberation from colonial rule"),
        t("Decolonisation and underdevelopment"),
        t("Unification of Europe"),
        t("Disintegration of the Soviet Union and the rise of the unipolar world"),
    ), forOptional = optional("hist")),
)

/** The papers a member sees: every common paper, plus the optional papers that match their answer about the optional. */
fun syllabusFor(optional: String?): List<SyllabusPaper> =
    SYLLABUS.filter { p -> p.forOptional == null || (optional != null && p.forOptional.containsMatchIn(optional)) }

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
    "lang", "papera", "indian" -> "lang"
    "english", "paperb" -> "english"
    "psir1", "psir2", "socio1", "socio2", "geog1", "geog2", "anthro1", "anthro2", "hist1", "hist2" -> key.lowercase()
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
