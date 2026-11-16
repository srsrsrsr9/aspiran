declare module "*.html" {
  const text: string;
  export default text;
}
declare module "*.txt" {
  const text: string;
  export default text;
}
declare module "*/public/app/syllabus.js" {
  export const PAPERS: { id: string; short: string; name: string; lead: string; topics: string[]; forOptional?: string }[];
  export const NODES: { id: string; name: string; paper: { id: string; short: string; name: string; lead: string } }[];
}
declare module "*/public/app/syllabus-lines.js" {
  export const LINES: Record<string, string[]>;
}
declare module "*/public/app/jeetu-lines.js" {
  export const LINES: Record<string, { en: string; hi: string }>;
  export const ACT: Record<string, { who: "chotu" | "jeetu"; en: string; hi: string }>;
}
