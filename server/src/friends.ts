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
 * Posts are written here from fixed templates (no AI model), so they are cheap, predictable and checkable.
 */

export interface Friend { id: string; name: string; color: string; bio: string }

export const FRIENDS: Friend[] = [
  { id: "friend:meera", name: "Meera · AI", color: "#b5543c", bio: "On her third attempt. Steady, Mains-minded, starts the answer-writing hours." },
  { id: "friend:arjun", name: "Arjun · AI", color: "#3f51b5", bio: "Works in a bank. Studies 6 to 8 every morning before the office." },
  { id: "friend:pooja", name: "Pooja · AI", color: "#2e7d32", bio: "Hindi-medium, deep into GS1: history, art and culture, geography." },
  { id: "friend:kabir", name: "Kabir · AI", color: "#c98a12", bio: "The quizzer. Drops a quick question most days and the answer later." },
];
const F = Object.fromEntries(FRIENDS.map((f) => [f.id.slice(7), f])) as Record<"meera" | "arjun" | "pooja" | "kabir", Friend>;

export type FriendLevel = "full" | "light" | "rituals";
/** 0–2 real people: full; 3–5: light; more: rituals only. */
export const friendLevel = (humans: number): FriendLevel => (humans <= 2 ? "full" : humans <= 5 ? "light" : "rituals");

export const inQuietHours = (hm: string) => hm >= "23:30" || hm < "07:00";

/** IST weekdays of answer hour (Wed and Sat, as the app's ritual nudges). Chotu's host schedule uses them too. */
export const ANSWER_DAYS = [3, 6];

export interface QuizQ { topic: string; question: string; options: string[]; answerIndex: number; explanation?: string }
export interface FriendPost { friend: Friend; text: string; kind: "friend" | "friend_quiz" }

// --- What they say -------------------------------------------------------------------------------------------

const pick = <T>(list: T[], seed: number) => list[Math.abs(seed) % list.length];

const ARJUN_MORNING = [
  "Morning block done before the office: 45 minutes of Polity, the Parliament chapter. Back tonight for revision.",
  "6 to 7 today was the editorial and two Chai cards. Short, but it's in the bag.",
  "Up early, one hour of Economy (inflation basics). Coffee, then the commute.",
  "Did 20 Prelims questions on the train yesterday and 30 minutes of notes this morning. Small and steady.",
  "Today's morning slot: Geography maps for 40 minutes. Office now. Someone keep the pod warm for me.",
];
const ARJUN_NIGHT = [
  "Closing my day: read one Chai card, revised my morning notes. Tomorrow's first step is 15 questions on Polity.",
  "Short evening. 20 minutes of revision and I'm calling it. Tomorrow at 6 again.",
  "Tired from work, so tonight was only flashcards. Still counts. Tomorrow: Economy, the budget chapter.",
];
const POOJA_NOTES = [
  "GS1 note for today: the Harappan cities had grid streets and covered drains. Lothal had a dockyard. Making a one-page chart of the sites.",
  "Art and culture today: Nagara temples have curvilinear shikharas, Dravida temples have vimanas and gopurams. Vesara mixes both.",
  "Geography: the Western Ghats get orographic rain; the rain-shadow side is much drier. Drew the map twice to remember it.",
  "Modern history: the 1857 revolt, causes in four boxes (political, economic, military, social). Revising it with a timeline.",
  "Bhakti and Sufi movements today. Kabir, Mirabai, Nizamuddin Auliya on one page. Reading in Hindi first, then English.",
  "Indian society for GS1: urbanisation and its effects. Writing two examples for each point so Mains answers have something solid.",
];
const MEERA_ANSWER_HOUR = [
  "Starting an answer-writing hour now. One question, 150 words, 10 minutes, then I'll reread it once. Anyone joining, share your intro if you like.",
  "Answer-writing hour from now. Today I'm doing a GS2 question on federalism. Timer is on.",
  "I'm writing one Mains answer now: intro, three points, a way forward. If you write too, post your first line here.",
];
const MEERA_TIPS = [
  "Something that helped me this attempt: I write the conclusion line first, then build the answer back to it.",
  "Revision tip from my last two attempts: fewer sources, more rounds. I reread my own notes, not new books.",
  "I keep a one-page error log from mocks. Before every test I read only that page.",
];
const PAIRS: [keyof typeof F, string, keyof typeof F, string][] = [
  ["kabir", "Meera, how do you fit Mains writing into a Prelims month?", "meera", "Two answers a week, Wednesday and Saturday. Small, but it keeps the hand moving."],
  ["arjun", "Pooja, any trick for remembering temple styles?", "pooja", "I draw the shapes, badly. Shikhara curves, vimana steps. The drawing sticks better than the words."],
  ["pooja", "Kabir, do you revise from your quiz mistakes?", "kabir", "Every Sunday. I keep the wrong ones in a list and redo only those."],
  ["meera", "Arjun, how do you study on office days?", "arjun", "Mornings only, 6 to 8. Evenings are for light revision if I'm not too tired."],
  ["kabir", "Arjun, newspaper or Chai cards first?", "arjun", "Chai first on busy days, it's quicker. The full paper on Sundays."],
];
const WINS = [
  ["pooja", "My study win this week: finished the whole ancient history unit and made one chart for it."],
  ["arjun", "Win of the week: five mornings out of six at the desk by 6. Very happy with that."],
  ["meera", "My win: wrote six Mains answers this week. The last one felt much clearer than the first."],
  ["kabir", "This week's win: cleared my error list of 30 questions. Only 4 still trick me."],
] as const;
const REACTIONS = [
  ["meera", "Good going 👏 That's real work done."],
  ["arjun", "Nice. That's how the week gets built, one block at a time."],
  ["pooja", "Well done 👏 Keep that rhythm going."],
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
  if (weekday === 5 && hm === "20:00") say("kabir", "Quiz night! I'm in. Five questions, one pod score. Good luck everyone.");
  if (weekday === 0 && hm === "18:00") { const [f, t] = pick([...WINS], seed); say(f, t); }
  if (level === "rituals") return out;
  // Light: a morning line, the daily question and its answer.
  if (hm === "07:00") say("arjun", pick(ARJUN_MORNING, seed));
  if (quiz && hm === "13:00") say("kabir", quizText(quiz), "friend_quiz");
  if (quiz && hm === "18:00" && weekday !== 0) say("kabir", answerText(quiz));
  if (level === "light") return out;
  // Full: GS1 notes, a tip, the friends talking to each other, an evening answer hour on other days, a night close.
  if (hm === "10:30") say("pooja", pick(POOJA_NOTES, seed));
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
