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
