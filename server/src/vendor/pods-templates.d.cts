/** Types for the content team's template library (content/tools/lib/pods-templates.js, copied here as .cjs by scripts/sync-templates.mjs). */
export interface Checked { errors: string[]; warnings: string[] }
export interface LangInfo {
  name: string; native: string; script: RegExp | null; scriptName: string; wordFactor: number; status: string; inPack?: boolean;
  fixed?: { sources?: string; spineOpeners?: string[] };
}
export interface EnglishString { path: string; en: string; native: boolean; keep: boolean; register: "content" | "chat" }
export interface Translation {
  schema: "upsc-pods/translation@1"; lang: string; pack: { id: string; schema: string };
  strings: Record<string, { en: string; text: string }>; provenance: unknown;
  review: { status: "draft" | "approved"; checkedBy: string | null; checkedOn: string | null; note?: string };
}
declare const PodsTemplates: {
  fillSchema(schema: any, config: any): any;
  apiSchema(schema: any): any;
  assemble(type: string, fill: any, config: any): any;
  validate(pack: any, schema: any, opts?: { generated?: boolean; source?: string }): Checked;
  merge(base: any, over: any): any;
  buildPrompt(t: { system: string; brief: string; title: string }, job: { source: string; config?: any; notes?: string }): { system: string; user: string };
  words(s: string): number;
  LANGS: Record<string, LangInfo>;
  englishStrings(pack: any): EnglishString[];
  applyTranslation(pack: any, tr: Translation): any;
  validateTranslation(pack: any, tr: Translation, schema: any, opts?: { generated?: boolean }): Checked;
  buildTranslationPrompt(pack: any, lang: string, systemText: string, styleNote: string, schema: any): { system: string; user: string; schema: any };
  makeTranslation(pack: any, lang: string, reply: Record<string, string>, provenance?: unknown): Translation;
};
export default PodsTemplates;
