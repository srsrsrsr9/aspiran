// The Free Shelf's honest tools. Free, no card needed, and they work without an account.
// Numbers here are rules from the UPSC notification or rough starting points you change to your own;
// each says which. Nothing here predicts results or tells anyone to quit or continue.

// --- Attempt Compass ------------------------------------------------------------------------------------------
// Civil Services Examination rules as in recent notifications. Age is counted on 1 August of the exam year:
// you must have turned 21 and must not yet have turned the upper limit. An attempt counts once you sit any
// Prelims paper. Rules can change; the year's notification on upsc.gov.in is what counts.

export const CATEGORIES = {
  general: { label: "General", upper: 32, attempts: 6 },
  ews: { label: "EWS", upper: 32, attempts: 6 },
  obc: { label: "OBC", upper: 35, attempts: 9 },
  sc: { label: "SC", upper: 37, attempts: Infinity },
  st: { label: "ST", upper: 37, attempts: Infinity },
};
export const PWBD_EXTRA_YEARS = 10;
// PwBD: upper age 42 for General and EWS (and at least 42 for everyone). Secondary sources disagree for OBC-PwBD
// (45 or 42) and SC/ST-PwBD (47 or 42), so years past 42 for them are shown as "check the UPSC notification",
// not as fact, until checked against the 2026 notice (founder-approved corrections, 12 Oct 2026).
export const PWBD_SURE_UPPER = 42;
export const RULES_SOURCE = "UPSC CSE 2026 notification (4 Feb 2026), upsc.gov.in · as of 12 Oct 2026";

const ageOn = (dob, day) => {
  const b = new Date(dob + "T00:00:00"), d = new Date(day + "T00:00:00");
  let a = d.getFullYear() - b.getFullYear();
  if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) a--;
  return a;
};

/** dob YYYY-MM-DD, category key, used (attempts already counted), pwbd. Returns the exam years still open. */
/** The next exam you could still sit: Prelims is usually late May or June, so after June it's next year's. */
export const nextExamYear = (now = new Date()) => now.getFullYear() + (now.getMonth() >= 6 ? 1 : 0);

export function compass({ dob, category = "general", used = 0, pwbd = false, fromYear = nextExamYear() }) {
  const c = CATEGORIES[category] ?? CATEGORIES.general;
  const claimed = c.upper + (pwbd ? PWBD_EXTRA_YEARS : 0);
  const upper = pwbd ? Math.min(claimed, PWBD_SURE_UPPER) : claimed;
  const upperCheck = claimed > upper ? claimed : null; // disputed: shown as "check the UPSC notification"
  const cap = pwbd && c.attempts !== Infinity ? 9 : c.attempts;
  const left = cap === Infinity ? Infinity : Math.max(0, cap - Math.max(0, Math.round(used)));
  const years = [];
  for (let y = fromYear; y < fromYear + 30 && years.length < (left === Infinity ? 30 : left); y++) {
    const age = ageOn(dob, `${y}-08-01`);
    if (age >= 21 && age < (upperCheck ?? upper)) years.push({ year: y, age, check: age >= upper });
    if (age >= (upperCheck ?? upper)) break;
  }
  return { upper, upperCheck, cap, attemptsLeft: left === Infinity ? null : left, years, lastYear: years.at(-1)?.year ?? null, ageLimitFirst: left === Infinity || years.length < left };
}

export const COMPASS_QUESTIONS = [
  "What would a good year look like, apart from the result?",
  "What did the last attempt teach you that a book couldn't?",
  "Who would you want to talk this through with? Your pod lead, a senior, someone at home?",
  "If you set a point to look at this again, when would it be? (Only you see this.)",
];

export const PLAN_B = [
  ["State PSC exams", "Much of the same syllabus. Many people prepare for both at once."],
  ["RBI Grade B, SEBI, NABARD", "Economy and current affairs overlap a lot."],
  ["UGC NET / JRF", "If your optional subject is something you love, it can become a career."],
  ["SSC CGL and other central exams", "A stable job that some people sit while still preparing."],
  ["Policy, research and journalism jobs", "Think tanks, NGOs and newsrooms value what you've read."],
];

// --- Cost of a Year -------------------------------------------------------------------------------------------
// Rough starting numbers, not facts: change every one of them to what you actually pay.

export const COST_ITEMS = [
  ["rent", "Rent or PG", "month"], ["food", "Food", "month"], ["library", "Library seat", "month"],
  ["misc", "Phone, travel in the city, the rest", "month"], ["coaching", "Coaching", "year"],
  ["tests", "Test series", "year"], ["books", "Books and printouts", "year"], ["home", "Trips home", "year"],
];
export const CITY_PRESETS = {
  delhi: { label: "Delhi (Old Rajinder Nagar, Mukherjee Nagar)", rent: 14000, food: 6000, library: 2500, misc: 3000, coaching: 150000, tests: 15000, books: 12000, home: 8000 },
  prayagraj: { label: "Prayagraj", rent: 5000, food: 4000, library: 1000, misc: 1500, coaching: 60000, tests: 10000, books: 8000, home: 4000 },
  hyderabad: { label: "Hyderabad (Ashok Nagar)", rent: 8000, food: 5000, library: 1500, misc: 2500, coaching: 120000, tests: 12000, books: 10000, home: 6000 },
  pune: { label: "Pune", rent: 9000, food: 5000, library: 1500, misc: 2500, coaching: 100000, tests: 12000, books: 10000, home: 6000 },
  home: { label: "Studying from home", rent: 0, food: 0, library: 800, misc: 1000, coaching: 0, tests: 8000, books: 8000, home: 0 },
};
export function costOfYear(v) {
  let year = 0;
  for (const [k, , per] of COST_ITEMS) year += (Number(v[k]) || 0) * (per === "month" ? 12 : 1);
  const forgone = (Number(v.salary) || 0) * 12;
  return { year, month: Math.round(year / 12), forgone, withForgone: year + forgone };
}
export const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

// --- 5-source maps --------------------------------------------------------------------------------------------
// A map, not a shopping list: five sources per subject, in the order to use them. The syllabus and past
// papers are free and come first.

export const MAPS = {
  polity: { label: "Polity", sources: [
    ["UPSC syllabus and past Prelims papers (Polity)", "Free on upsc.gov.in. Shows what gets asked before you read anything."],
    ["NCERT Class 11: Indian Constitution at Work", "The ideas behind the articles, in plain language."],
    ["M. Laxmikanth, Indian Polity", "The standard reference. Read chapter by chapter, not cover to cover in one go."],
    ["The Constitution of India (bare text)", "Free on legislative.gov.in. Check articles yourself."],
    ["Chai cards tagged Polity", "Today's news, tied back to the articles above."],
  ] },
  history: { label: "Modern History", sources: [
    ["UPSC syllabus and past Prelims papers (History)", "Free. Modern India and the freedom struggle come up every year."],
    ["NCERT Class 8 Our Pasts III and Class 12 Themes in Indian History III", "The base story."],
    ["Rajiv Ahir, A Brief History of Modern India (Spectrum)", "The standard Prelims book for modern India."],
    ["Bipan Chandra and others, India's Struggle for Independence", "Depth for Mains, one movement at a time."],
    ["Chai cards and thinker cards", "Anniversaries and people, linked back to the period."],
  ] },
  geography: { label: "Geography", sources: [
    ["UPSC syllabus and past papers (Geography)", "Free. Maps and places get asked a lot."],
    ["NCERT Class 11 and 12 Geography (four books)", "Physical and human geography, India and the world."],
    ["G. C. Leong, Certificate Physical and Human Geography", "Climate and landforms, clearly explained."],
    ["A school atlas", "Use it with every chapter and every news story."],
    ["Chai cards with a map", "Places in the news, on the map."],
  ] },
  economy: { label: "Economy", sources: [
    ["UPSC syllabus and past papers (Economy)", "Free. Shows which concepts repeat."],
    ["NCERT Class 11 Indian Economic Development and Class 12 Introductory Macroeconomics", "Concepts first."],
    ["Ramesh Singh, Indian Economy", "A standard reference for Prelims and Mains."],
    ["The latest Economic Survey", "Free on indiabudget.gov.in. Read the summary chapter first."],
    ["The Union Budget highlights", "Free. The year's numbers, in one place."],
  ] },
  environment: { label: "Environment", sources: [
    ["UPSC syllabus and past papers (Environment)", "Free. A large share of recent Prelims."],
    ["NCERT Class 12 Biology, the Ecology unit", "The science behind the terms."],
    ["Shankar IAS, Environment", "A standard Prelims book."],
    ["India State of Forest Report and Ministry of Environment releases", "Free. Official numbers to quote."],
    ["Chai cards tagged Environment", "Treaties, species and reports in the news."],
  ] },
  culture: { label: "Art and Culture", sources: [
    ["UPSC syllabus and past papers (Art and Culture)", "Free. Asked mostly as Prelims facts."],
    ["NCERT Class 11 An Introduction to Indian Art", "Architecture, painting and sculpture, from the start."],
    ["Nitin Singhania, Indian Art and Culture", "A standard reference."],
    ["CCRT website", "Free. Dance, music and crafts by region."],
    ["Chai cards and thinker cards", "Festivals, sites and people in the news."],
  ] },
  ethics: { label: "Ethics (GS4)", sources: [
    ["UPSC syllabus and past GS4 papers", "Free. The case studies show what examiners want."],
    ["2nd ARC 4th report, Ethics in Governance", "Free on darpg.gov.in. The source many answers quote."],
    ["One standard GS4 textbook of your choice", "Pick one and finish it, rather than starting three."],
    ["Thinker cards in this app", "Indian and world thinkers, with a line you can use in an answer."],
    ["Your own case-study notebook", "Write one case a week. Your pod can review it in answer hour."],
  ] },
};
/** Which map fits a practice topic, so the shelf can show your weakest subject's map. */
export function mapFor(topic = "") {
  const t = topic.toLowerCase();
  if (/polity|constitution|governance|parliament/.test(t)) return "polity";
  if (/history|freedom|modern/.test(t)) return "history";
  if (/geograph|climate|map/.test(t)) return "geography";
  if (/econom|budget|bank|finance/.test(t)) return "economy";
  if (/environment|ecolog|species|biodivers/.test(t)) return "environment";
  if (/art|culture|heritage/.test(t)) return "culture";
  if (/ethic|gs4|integrity/.test(t)) return "ethics";
  return null;
}

// --- Thinker of the week --------------------------------------------------------------------------------------
// In our own words, never a made-up quote. Each says where the idea comes from and how to use it in an answer.

export const THINKERS = [
  { name: "Thiruvalluvar", from: "Tirukkural, couplet 391 (Learning)", idea: "Learn thoroughly what is worth learning, and then live by what you learnt.", use: "Essay and GS4 answers on education, integrity and character." },
  { name: "Kautilya", from: "Arthashastra", idea: "A ruler's own good lies in the good of the people. Governance is judged by their welfare, not the ruler's comfort.", use: "Intros and conclusions on governance and public service." },
  { name: "B. R. Ambedkar", from: "Constituent Assembly, 4 November 1948", idea: "Constitutional morality isn't natural; a country has to cultivate it.", use: "Polity and GS4 answers on institutions and the spirit of the Constitution." },
  { name: "M. K. Gandhi", from: "The talisman, a note from 1948", idea: "When in doubt, think of the poorest person you have seen and ask whether your next step will help them.", use: "Policy conclusions and GS4 case studies." },
  { name: "Amartya Sen", from: "Development as Freedom (1999)", idea: "Development means widening what people are actually able to do and be, not only raising income.", use: "GS3 economy, social justice and Essay." },
  { name: "Roediger and Karpicke", from: "Psychological Science (2006)", idea: "Testing yourself makes learning stick far better than reading the same pages again.", use: "Why Close the Day asks for one thing from memory, and why Practice brings back what you missed." },
];
export function thinkerOfWeek(now = new Date()) {
  const week = Math.floor((now.getTime() / 86400000 + 3) / 7);
  return THINKERS[week % THINKERS.length];
}
