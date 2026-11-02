/**
 * Pod friends: four named AI study friends of Chotu who keep a new, small pod from feeling empty.
 *
 * Rules (enforced here and in PodRoom.friendsTick / friendReact):
 * - Always labelled: every name ends in "· AI" and their member ids start with "friend:". The apps show them with
 *   their own kulhad colour and an AI tag.
 * - Never members: they never join, never appear in presence, the study room, pod size, goals, the quiz score,
 *   thanks or stamps, and they are never counted anywhere a person is.
 * - Never private: they only post in the pod; no DMs, no private notes, no lead notes.
 * - Never ranks or results: no marks, ranks, cut-offs or "I cleared"; their wins are about studying, not outcomes.
 * - Never about one person's mood: they react only to study wins, in general words, and never to a message with
 *   feelings in it (low, tired, anxious...) or one that tripped the distress check.
 * - Quiet hours 23:30–07:00 IST, nothing in a result week, and the `pod_friends` flag switches them all off.
 * - Activity follows the number of real people: full with 0–2, light with 3–5, rituals only beyond that.
 * - No invented lives: no attempts, jobs or wins of their own. They suggest, explain and ask (owner, 2 Nov 2026).
 * Posts are written here from fixed templates (no AI model), so they are cheap, predictable and checkable.
 */

export interface Friend { id: string; name: string; color: string; bio: string }

export const FRIENDS: Friend[] = [
  { id: "friend:meera", name: "Meera · AI", color: "#b5543c", bio: "AI study friend. Hosts the answer-writing hours and shares Mains writing tips." },
  { id: "friend:arjun", name: "Arjun · AI", color: "#3f51b5", bio: "AI study friend. Suggests a small morning block and a short close to the day." },
  { id: "friend:ira", name: "Ira · AI", color: "#2e7d32", bio: "AI study friend. Posts one GS1 note a day: history, art and culture, geography, society." },
  { id: "friend:kabir", name: "Kabir · AI", color: "#c98a12", bio: "AI study friend. Drops a quick question most days and the answer later." },
];
const F = Object.fromEntries(FRIENDS.map((f) => [f.id.slice(7), f])) as Record<"meera" | "arjun" | "ira" | "kabir", Friend>;

export type FriendLevel = "full" | "light" | "rituals";
/** 0–2 real people: full; 3–5: light; more: rituals only. */
export const friendLevel = (humans: number): FriendLevel => (humans <= 2 ? "full" : humans <= 5 ? "light" : "rituals");

export const inQuietHours = (hm: string) => hm >= "23:30" || hm < "07:00";

/** IST weekdays of answer hour (Wed and Sat, as the app's ritual nudges). Chotu's host schedule uses them too. */
export const ANSWER_DAYS = [3, 6];

export interface QuizQ { topic: string; question: string; options: string[]; answerIndex: number; explanation?: string }
export interface FriendPost { friend: Friend; text: string; kind: "friend" | "friend_quiz" }

// --- What they say -------------------------------------------------------------------------------------------
// They are AI and say so: no invented lives, attempts, jobs or wins of their own. They suggest, explain and ask.

const pick = <T>(list: T[], seed: number) => list[Math.abs(seed) % list.length];

const ARJUN_MORNING = [
  "Morning, pod. A 45-minute block before work or college counts. One idea for today: the Parliament chapter in Polity.",
  "Short on time today? One editorial and two Chai cards is a real start.",
  "Morning block idea: one hour of Economy, inflation basics. Small and steady beats long and rare.",
  "On a commute? 20 Prelims questions on the phone, then 30 minutes of notes later. Both count.",
  "Morning block idea: 40 minutes of Geography maps. Draw them; don't just look.",
];
const ARJUN_NIGHT = [
  "Closing the day: name one thing you revised and one first step for tomorrow. One idea for tomorrow: 15 Polity questions.",
  "Short evening? 20 minutes of revision is enough to call it a day.",
  "Tired tonight? Flashcards only still counts. Tomorrow's idea: Economy, the budget chapter.",
];
const IRA_NOTES = [
  "GS1 note for today: the Harappan cities had grid streets and covered drains, and Lothal had a dockyard. Try a one-page chart of the sites.",
  "Art and culture: Nagara temples have curved shikharas, Dravida temples have vimanas and gopurams, and Vesara mixes both.",
  "Geography: the Western Ghats get orographic rain, and the rain-shadow side is much drier. Drawing the map twice helps it stick.",
  "Modern history: the causes of the 1857 revolt fit in four boxes (political, economic, military, social). A timeline helps revision.",
  "Bhakti and Sufi movements: Kabir, Mirabai and Nizamuddin Auliya fit on one page. Reading it in Hindi first works well for many.",
  "Indian society for GS1: urbanisation and its effects. Write two examples for each point so a Mains answer has something solid.",
];
const MEERA_ANSWER_HOUR = [
  "Answer-writing hour starts now. One question, 150 words, then reread it once. If you write, share your intro here if you like.",
  "Answer-writing hour from now. Today's idea: a GS2 question on federalism.",
  "Writing one Mains answer now? Intro, three points, a way forward. Post your first line here if you like.",
];
const MEERA_TIPS = [
  "A Mains tip: write the conclusion line first, then build the answer back to it.",
  "A revision tip: fewer sources, more rounds. Reread your own notes before opening a new book.",
  "A mock tip: keep a one-page list of your mistakes, and before each test read only that page.",
];
const PAIRS: [keyof typeof F, string, keyof typeof F, string][] = [
  ["kabir", "Meera, how can someone fit Mains writing into a Prelims month?", "meera", "Two answers a week, Wednesday and Saturday. Small, but it keeps the hand moving."],
  ["arjun", "Ira, any trick for remembering temple styles?", "ira", "Draw the shapes, even badly. Shikhara curves, vimana steps. A drawing sticks better than the words."],
  ["ira", "Kabir, is it worth revising quiz mistakes?", "kabir", "Yes. Keep the wrong ones in a list and redo only those each Sunday."],
  ["meera", "Arjun, what works on busy days?", "arjun", "One short block, morning if possible. Evenings for light revision."],
  ["kabir", "Arjun, newspaper or Chai cards first?", "arjun", "Chai first on busy days, it's quicker. The full paper on Sundays."],
];
const WEEK_ASK = [
  ["ira", "Sunday check: what was one study win this week? One line is enough."],
  ["arjun", "End of the week. What's one thing you got done? Small counts."],
  ["meera", "Sunday: did you write any answers this week? Even one is worth noting."],
  ["kabir", "Week's end. Which topic finally made sense this week?"],
] as const;
const REACTIONS = [
  ["meera", "Good going 👏 That's real work done."],
  ["arjun", "Nice. That's how the week gets built, one block at a time."],
  ["ira", "Well done 👏 Keep that rhythm going."],
  ["kabir", "Solid 👏 That's a question bank's worth of progress."],
] as const;

const optionLetters = "ABCD";
function quizText(q: QuizQ) {
  const opts = q.options.slice(0, 4).map((o, i) => `${optionLetters[i]}) ${o}`).join("  ");
  return `Quick one from this week's Chai (${q.topic}): ${q.question}  ${opts}  I'll post the answer at 6.`;
}
function answerText(q: QuizQ) {
  return `Answer to this afternoon's question: ${optionLetters[q.answerIndex] ?? "?"}) ${q.options[q.answerIndex] ?? ""}.${q.explanation ? " " + q.explanation : ""}`;
}

/**
 * What the friends post at one half-hourly tick. [weekday] is IST (0 = Sunday), [hm] the IST time, [seed] a day
 * number so posts rotate. [quiz] is today's question (kept by the pod so the answer matches).
 */
export function friendPosts(hm: string, weekday: number, level: FriendLevel, seed: number, quiz: QuizQ | null): FriendPost[] {
  if (inQuietHours(hm)) return [];
  const out: FriendPost[] = [];
  const say = (f: keyof typeof F, text: string, kind: FriendPost["kind"] = "friend") => out.push({ friend: F[f], text, kind });
  const answerDay = ANSWER_DAYS.includes(weekday);
  // Rituals: every level.
  if (answerDay && hm === "19:00") say("meera", pick(MEERA_ANSWER_HOUR, seed));
  if (weekday === 5 && hm === "20:00") say("kabir", "Quiz night! Five questions, one pod score. Good luck, everyone.");
  if (weekday === 0 && hm === "18:00") { const [f, t] = pick([...WEEK_ASK], seed); say(f, t); }
  if (level === "rituals") return out;
  // Light: a morning line, the daily question and its answer.
  if (hm === "07:00") say("arjun", pick(ARJUN_MORNING, seed));
  if (quiz && hm === "13:00") say("kabir", quizText(quiz), "friend_quiz");
  if (quiz && hm === "18:00" && weekday !== 0) say("kabir", answerText(quiz));
  if (level === "light") return out;
  // Full: GS1 notes, a tip, the friends talking to each other, an evening answer hour on other days, a night close.
  if (hm === "10:30") say("ira", pick(IRA_NOTES, seed));
  if (hm === "15:00" && seed % 2 === 0) say("meera", pick(MEERA_TIPS, seed >> 1));
  if (hm === "16:30") { const [a, q, b, r] = pick(PAIRS, seed); say(a, q); say(b, r); }
  if (!answerDay && weekday !== 5 && weekday !== 0 && hm === "19:00") say("meera", pick(MEERA_ANSWER_HOUR, seed + 1));
  if (hm === "21:30") say("arjun", pick(ARJUN_NIGHT, seed));
  return out;
}

// --- Reacting to a study win ---------------------------------------------------------------------------------

const WIN = /\b(done|finished|completed|complete|wrote|written|solved|revised|cleared my|covered|read|\d+ (questions|qs|mcqs|answers|pages|cards|chapters|hours|minutes|mins))\b/i;
/** Any feelings, struggle or exam-result talk: the friends stay out of it. */
const FEELINGS = /\b(sad|low|tired|exhausted|anxious|anxiety|stress|stressed|panic|scared|afraid|cry|crying|depress\w*|lonely|alone|hopeless|worthless|give up|giving up|quit|failed|failure|fail|lost|hate|angry|upset|worried|worry|overwhelmed|can't|cannot|nervous|burnt out|burnout|rank|result|cut ?off|marks)\b/i;

/** Whether a person's pod message is a plain study win the friends may cheer (in general words, never naming them). */
export const isStudyWin = (text: string) => WIN.test(text) && !FEELINGS.test(text) && text.length <= 400;

export function reaction(seed: number): FriendPost {
  const [f, t] = pick([...REACTIONS], seed);
  return { friend: F[f], text: t, kind: "friend" };
}

export const isFriendId = (id: string) => id.startsWith("friend:");
