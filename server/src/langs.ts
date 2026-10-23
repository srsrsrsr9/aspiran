import PT from "./vendor/pods-templates.cjs";
import { type Env } from "./shared";
import { ensureSchema, getSetting } from "./staff";

/**
 * The languages the apps can show, and which ones are switched on.
 *
 * English and Hindi are written inside every pack and are always live. Any other language arrives as a
 * translation file per item (the content team's upsc-pods/translation@1), made from the checked English.
 *
 *   off    nothing anywhere
 *   pilot  the desk can write and approve it; members don't see it yet
 *   live   members can pick it, and approved items show in it
 *
 * A language can only go live with (1) an active staff member, on their own key, who can approve it, and
 * (2) a distress-phrase list for it that someone has marked reviewed. Until then it stays a pilot.
 */

export type LangStatus = "off" | "pilot" | "live";
export const INPACK = ["en", "hi"];

/** Fonts per script: Noto first (bundled on Android, free to self-host), then what Windows and iOS ship. */
const FONTS: Record<string, string> = {
  Latin: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
  Devanagari: `"Noto Sans Devanagari", "Nirmala UI", "Kohinoor Devanagari", system-ui, sans-serif`,
  Telugu: `"Noto Sans Telugu", "Nirmala UI", "Kohinoor Telugu", system-ui, sans-serif`,
  Tamil: `"Noto Sans Tamil", "Nirmala UI", "Tamil Sangam MN", system-ui, sans-serif`,
  Bengali: `"Noto Sans Bengali", "Nirmala UI", "Kohinoor Bangla", system-ui, sans-serif`,
  Kannada: `"Noto Sans Kannada", "Nirmala UI", "Kannada Sangam MN", system-ui, sans-serif`,
  Malayalam: `"Noto Sans Malayalam", "Nirmala UI", "Malayalam Sangam MN", system-ui, sans-serif`,
  Gujarati: `"Noto Sans Gujarati", "Nirmala UI", "Gujarati Sangam MN", system-ui, sans-serif`,
  Odia: `"Noto Sans Oriya", "Nirmala UI", "Oriya Sangam MN", system-ui, sans-serif`,
};

export const LANG_CODES = Object.keys(PT.LANGS);
export const isLang = (x: unknown): x is string => typeof x === "string" && x in PT.LANGS;
export const langName = (code: string) => PT.LANGS[code]?.name ?? code;

const DEFAULT_STATUS: Record<string, LangStatus> = Object.fromEntries(
  LANG_CODES.map((c) => [c, INPACK.includes(c) ? "live" : c === "te" ? "pilot" : "off"]),
);

export interface DistressList { phrases: string[]; reviewedBy: string | null; reviewedOn: string | null; note?: string }

/** Starting lists, for a native speaker and a mental-health professional to review before the language goes live. */
export const DRAFT_DISTRESS: Record<string, DistressList> = {
  te: {
    phrases: ["చనిపోవాలని ఉంది", "చచ్చిపోవాలని ఉంది", "బతకాలని లేదు", "బతికి ప్రయోజనం లేదు", "ఆత్మహత్య", "నన్ను నేను చంపుకుంటా",
      "అన్నీ ముగించేస్తా", "chanipovalani undi", "bathakalani ledu", "atmahatya", "champukunta"],
    reviewedBy: null,
    reviewedOn: null,
    note: "Draft. Needs review by a Telugu speaker and a mental-health professional before Telugu goes live.",
  },
};

export const languageStatus = (env: Env) => getSetting<Record<string, LangStatus>>(env, "languages", DEFAULT_STATUS);
export const distressList = (env: Env, code: string) =>
  getSetting<DistressList>(env, `distress:${code}`, DRAFT_DISTRESS[code] ?? { phrases: [], reviewedBy: null, reviewedOn: null });

/** What stops a language going live. Empty means it can. */
export async function goLiveGaps(env: Env, code: string): Promise<string[]> {
  if (INPACK.includes(code)) return [];
  await ensureSchema(env);
  const gaps: string[] = [];
  const { results } = await env.DB.prepare("SELECT roles, langs FROM staff WHERE disabled_at IS NULL").all<{ roles: string; langs: string | null }>();
  const editors = results.filter((r) => {
    const roles: string[] = JSON.parse(r.roles);
    return roles.includes("language_editor") && (JSON.parse(r.langs ?? "[]") as string[]).includes(code);
  });
  if (!editors.length) gaps.push(`Add a ${langName(code)} editor in Staff (role: language editor, language: ${langName(code)})`);
  const d = await distressList(env, code);
  if (d.phrases.length < 5) gaps.push(`Add at least 5 ${langName(code)} distress phrases`);
  else if (!d.reviewedBy) gaps.push(`Have the ${langName(code)} distress phrases reviewed, then mark them reviewed`);
  return gaps;
}

/** Every language with its status, fonts and what it still needs. For /admin. */
export async function languageState(env: Env) {
  const status = await languageStatus(env);
  return Promise.all(LANG_CODES.map(async (code) => {
    const L = PT.LANGS[code];
    const d = await distressList(env, code);
    return {
      code, name: L.name, native: L.native, script: L.scriptName, fonts: FONTS[L.scriptName] ?? FONTS.Latin,
      status: INPACK.includes(code) ? "live" : status[code] ?? "off",
      inPack: INPACK.includes(code),
      distress: INPACK.includes(code) ? null : d,
      gaps: await goLiveGaps(env, code),
    };
  }));
}

/** Languages members can see. English and Hindi always; others once live. */
export async function liveLangs(env: Env): Promise<string[]> {
  const status = await languageStatus(env);
  return LANG_CODES.filter((c) => INPACK.includes(c) || status[c] === "live");
}

/** Languages the desk can write and approve: live and pilot. */
export async function deskLangs(env: Env): Promise<string[]> {
  const status = await languageStatus(env);
  return LANG_CODES.filter((c) => INPACK.includes(c) || status[c] === "live" || status[c] === "pilot");
}

/** For apps: the live languages with their names and fonts. */
export async function publicLangs(env: Env) {
  return (await liveLangs(env)).map((code) => {
    const L = PT.LANGS[code];
    return { code, name: L.name, native: L.native, fonts: FONTS[L.scriptName] ?? FONTS.Latin };
  });
}

let distressCache: { at: number; phrases: string[] } | null = null;
/** Extra distress phrases from every language list saved in settings (reviewed or not: for safety, a draft list still counts). */
export async function extraDistress(env: Env): Promise<string[]> {
  if (distressCache && Date.now() - distressCache.at < 60_000) return distressCache.phrases;
  const phrases: string[] = [];
  for (const code of LANG_CODES) if (!INPACK.includes(code)) phrases.push(...(await distressList(env, code)).phrases);
  distressCache = { at: Date.now(), phrases: phrases.map((p) => p.toLowerCase().trim()).filter(Boolean) };
  return distressCache.phrases;
}
export const clearDistressCache = () => { distressCache = null; };
