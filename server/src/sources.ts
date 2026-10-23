/**
 * Allow-listed feeds. The pipeline reads only these; nothing from social media.
 * Feed URLs change without notice: check each one before launch and watch the
 * "fetched 0 items" line in the logs. Newspapers are left out on purpose: for them we
 * only ever show the headline, link and our own summary, written by the editor.
 */
export interface Source {
  name: string;
  url: string;
  /** Government and regulator sources score higher for UPSC relevance. */
  official: boolean;
  /** Off until the URL is confirmed working. */
  enabled?: boolean;
}

export const SOURCES: Source[] = [
  // Tested 2026-10-10: RBI works. PIB answers 403 to an honest bot user-agent (we don't disguise
  // ours), so it needs PIB's permission or a ministry-page fallback. PRS's feed URL was a 404.
  { name: "Reserve Bank of India", url: "https://www.rbi.org.in/pressreleases_rss.xml", official: true },
  { name: "PIB", url: "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", official: true, enabled: false },
  { name: "PRS Legislative Research", url: "https://prsindia.org/", official: false, enabled: false },
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
  { words: ["heritage", "unesco", "archaeolog", "festival", "temple", "freedom fighter", "jayanti"], weight: 1, gs: "GS1", topic: "Art and culture" },
  { words: ["women", "children", "tribal", "education", "health", "nutrition", "poverty"], weight: 2, gs: "GS2", topic: "Social justice" },
];

/** Words that suggest a story is SERIOUS: no humour, and the editor sees it flagged. */
export const SERIOUS_WORDS = [
  "death", "died", "killed", "dead", "disaster", "cyclone", "flood", "earthquake", "attack", "violence",
  "riot", "terror", "murder", "rape", "suicide", "accident", "war", "epidemic", "outbreak", "communal", "caste",
];

/** Loaded words a neutral political summary should not contain. */
export const LOADED_WORDS = [
  "slammed", "blasted", "shocking", "disastrous", "historic blunder", "brilliant", "masterstroke",
  "corrupt", "anti-national", "appeasement", "dictator", "puppet", "u-turn", "humiliating",
];
