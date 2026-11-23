/**
 * Allow-listed feeds. The pipeline reads only these; nothing from social media.
 * Feed URLs change without notice: check each one before launch and watch the
 * "fetched 0 items" line in the logs. Newspapers are left out on purpose: for them we
 * only ever show the headline, link and our own summary, written by the editor.
 */
export interface Source {
  name: string;
  url: string;
  /** Government, regulator and UN sources score higher for UPSC relevance. */
  official: boolean;
  /** Off until the URL is confirmed working. */
  enabled?: boolean;
  /** "rss" (the default) or "html": a press-release page with no feed, read as a list of links. */
  kind?: "rss" | "html";
  /** For "html" pages: which links are stories (tested against the href as written on the page). */
  links?: RegExp;
  /** How many items to take from this source per run (newest first). */
  max?: number;
  /** The paper and topic most of this source's stories belong to, used when the syllabus words don't decide. */
  gs?: "GS1" | "GS2" | "GS3";
  topic?: string;
  /** An Indian source: every story has an Indian angle (scored up, see pipeline.ts score). */
  indian?: boolean;
}

/**
 * Checked 14 Nov 2026 with our own honest user-agent, from India: each source below answered and gave stories.
 * The pipeline's log has a "fetched N items" line per source each morning; 0 or "failed" means a URL moved.
 * Not used, and why: PIB, the Supreme Court, MHA, Health (MoHFW) and Earth Sciences (MoES) answer 403 to any
 * automated reader (we don't disguise ours: PIB needs asking); MoEFCC and MEA build their press pages in the
 * browser, so there is nothing to read; IMD's only feed is weather warnings (disasters, never auto); Sansad's
 * e-Parliament library timed out. Newspapers and magazines stay out on purpose (see above).
 *
 * Indian GS1 sources, checked 22-23 Nov 2026 from a Worker on Cloudflare's network with the same honest user-agent.
 * None could be added: the Ministry of Culture (indiaculture.gov.in), the National Museum and the National Archives
 * time out; WCD, Survey of India, DD News and All India Radio fail on their certificates or time out; ASI, Sahitya
 * Akademi, Sangeet Natak Akademi and IMD (internal.imd.gov.in press releases) put their news in PDFs we can't read;
 * the Indian Culture portal, MoSPI and Social Justice build their pages in the browser; IGNCA and Lalit Kala have no
 * news list worth drafting from; IMD's blog stopped in 2023; UNESCO's New Delhi office page answered 1 time in 4 and
 * its articles never loaded; whc.unesco.org ignores its own India filter. PIB (403) is the real fix: it carries the
 * Culture, Tribal Affairs, Social Justice and Earth Sciences releases, and needs PIB to allow our reader.
 * Until then GS1 comes from NASA, UNESCO World Heritage and any story whose words are GS1 (SYLLABUS below), and the
 * pick (pipeline.ts nextPick) gives a GS1 card a place whenever one passes the checks.
 */
export const SOURCES: Source[] = [
  // GS3 Economy
  { name: "Reserve Bank of India", url: "https://www.rbi.org.in/pressreleases_rss.xml", official: true, max: 6, gs: "GS3", topic: "Economy", indian: true },
  // Off: SEBI's feed (works) is almost all recovery orders and appeals naming private people. Not study material.
  { name: "SEBI", url: "https://www.sebi.gov.in/sebirss.xml", official: true, enabled: false, gs: "GS3", topic: "Economy", indian: true },
  // GS2 Polity: PRS's bill tracker, newest bills and rules first. PRS is independent, not government; very reliable.
  { name: "PRS Legislative Research", url: "https://prsindia.org/billtrack", kind: "html", links: /^\/billtrack\/(?!category\/)[a-z0-9-]+$/, official: false, max: 4, gs: "GS2", topic: "Polity", indian: true },
  // GS2 International relations (UN News, Asia and the Pacific)
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/region/asia-pacific/feed/rss.xml", official: true, max: 4, gs: "GS2", topic: "International relations" },
  // GS3 Science and technology: ISRO's press page (no feed), newest first.
  { name: "ISRO", url: "https://www.isro.gov.in/Press.html", kind: "html", links: /^[A-Za-z0-9_%-]+\.html$/, official: true, max: 4, gs: "GS3", topic: "Science and technology", indian: true },
  // GS3 Environment (UN News, climate and environment)
  { name: "UN News (climate)", url: "https://news.un.org/feed/subscribe/en/news/topic/climate-change/feed/rss.xml", official: true, max: 3, gs: "GS3", topic: "Environment" },
  // GS1 Geography: NASA's Earth Observatory explains rivers, monsoons, glaciers, fires and storms from satellite images.
  { name: "NASA Earth Observatory", url: "https://earthobservatory.nasa.gov/feeds/earth-observatory.rss", official: true, max: 4, gs: "GS1", topic: "Geography" },
  // GS1 Art and culture: World Heritage sites and their state of conservation.
  { name: "UNESCO World Heritage", url: "https://whc.unesco.org/en/news/rss/", official: true, max: 3, gs: "GS1", topic: "Art and culture" },
  // Off: 403 to an honest bot (see above).
  { name: "PIB", url: "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", official: true, enabled: false, gs: "GS2", topic: "Governance", indian: true },
  { name: "Supreme Court of India", url: "https://www.sci.gov.in/", kind: "html", official: true, enabled: false, gs: "GS2", topic: "Polity", indian: true },
];

/**
 * Syllabus keywords with a weight and a GS paper. A rough first-pass relevance score;
 * the editor makes the final pick.
 */
export const SYLLABUS: { words: string[]; weight: number; gs: string; topic: string }[] = [
  { words: ["constitution", "article", "amendment", "governor", "parliament", "lok sabha", "rajya sabha", "supreme court", "high court", "bill", "ordinance", "election commission"], weight: 3, gs: "GS2", topic: "Polity" },
  { words: ["scheme", "yojana", "ministry", "policy", "regulation", "cabinet approves", "niti aayog"], weight: 2, gs: "GS2", topic: "Governance" },
  { words: ["bilateral", "summit", "treaty", "g20", "brics", "quad", "united nations", "visit to"], weight: 2, gs: "GS2", topic: "International relations" },
  { words: ["repo", "inflation", "gdp", "fiscal", "monetary", "rbi", "budget", "tax", "gst", "export", "import", "msme"], weight: 3, gs: "GS3", topic: "Economy" },
  { words: ["isro", "satellite", "mission", "launch", "research", "quantum", "semiconductor", "vaccine"], weight: 2, gs: "GS3", topic: "Science and technology" },
  { words: ["climate", "forest", "wildlife", "tiger", "wetland", "ramsar", "pollution", "emission", "biodiversity"], weight: 2, gs: "GS3", topic: "Environment" },
  { words: ["cyclone", "flood", "earthquake", "disaster", "ndma", "ndrf"], weight: 2, gs: "GS3", topic: "Disaster management" },
  { words: ["border", "defence", "army", "navy", "air force", "cyber"], weight: 2, gs: "GS3", topic: "Security" },
  { words: ["monsoon", "glacier", "river", "delta", "volcano", "ocean current", "el nino", "la nina", "himalaya", "plateau", "desert", "coral", "landslide", "snowfall", "rainfall", "aquifer"], weight: 2, gs: "GS1", topic: "Geography" },
  // GS1 words are listed whole where a short one would match inside another word ("dance" in "abundance", "craft" in
  // "aircraft", "fort" in "effort"); matching is a plain substring test.
  { words: ["heritage", "unesco", "archaeolog", "festival", "temple", "freedom fighter", "jayanti", "classical dance", "folk dance", "classical music", "folk music", "painting", "sculpture", "manuscript", "inscription", "monument", "stupa", "dynasty", "literature", "akademi", "handloom", "handicraft", "museum", "intangible", "excavation", "rock art", "harappa", "mughal", "chola", "maurya", "vijayanagara"], weight: 2, gs: "GS1", topic: "Art and culture" },
  { words: ["population", "census", "urbanisation", "urbanization", "migration", "migrant", "diaspora", "demograph", "mother tongue", "dialect", "self-help group"], weight: 2, gs: "GS1", topic: "Society" },
  { words: ["women", "children", "tribal", "education", "health", "nutrition", "poverty"], weight: 2, gs: "GS2", topic: "Social justice" },
];

/**
 * Words that suggest a story is SERIOUS: no humour, never sent automatically, and the editor sees it flagged.
 * Matched as whole words (pipeline.ts guessTone), so each form is listed: "war" used to match "warm", which sent a
 * NASA fog picture ("cold air is denser than warm air") to wait for a person on 15 Nov 2026.
 */
export const SERIOUS_WORDS = [
  "death", "deaths", "died", "dies", "dying", "killed", "killing", "killings", "kills", "dead",
  "disaster", "disasters", "cyclone", "cyclones", "flood", "floods", "flooded", "flooding",
  "earthquake", "earthquakes", "attack", "attacks", "attacked", "violence", "violent",
  "riot", "riots", "rioting", "terror", "terrorism", "terrorist", "terrorists", "murder", "murders", "murdered",
  "rape", "raped", "suicide", "suicides", "accident", "accidents", "war", "wars", "warfare",
  "epidemic", "epidemics", "outbreak", "outbreaks", "communal", "caste", "castes", "casualties",
];

/** An Indian angle in a story from a world source (UN, NASA, UNESCO). */
export const INDIA_WORDS = /\b(india|indian|indians|bharat|himalaya|himalayan|ganga|ganges|brahmaputra|indus|deccan|kerala|assam|ladakh|kashmir|delhi|mumbai|bay of bengal|arabian sea)\b/i;

/** Routine releases worth little to an aspirant: weekly data tables, auction results, penalty notices. */
export const ROUTINE_TITLES = /statement of position|weekly statistical supplement|money market operations|auction results?|results? of .{0,60}auction|treasury bills|government securities|reserve money|lending facility|monetary penalty|imposes penalty|cancels? (the )?certificate|directions under section/i;

/** Loaded words a neutral political summary should not contain. */
export const LOADED_WORDS = [
  "slammed", "blasted", "shocking", "disastrous", "historic blunder", "brilliant", "masterstroke",
  "corrupt", "anti-national", "appeasement", "dictator", "puppet", "u-turn", "humiliating",
];
