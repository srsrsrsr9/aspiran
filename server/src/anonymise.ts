// No imports, so the tests can load it directly.
/** Swaps each name for Member A, B... in order of first match (longest names first, so "Ravi K" wins over "Ravi"). */
export function anonymise(text: string, names: string[]): string {
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const labels = new Map<string, string>();
  let out = text;
  for (const name of names.filter((n) => n && n.trim().length > 1).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${esc(name.trim())}(?=$|[^\\p{L}\\p{N}])`, "giu");
    out = out.replace(re, (_m, pre: string) => {
      const key = name.trim().toLowerCase();
      if (!labels.has(key)) labels.set(key, `Member ${String.fromCharCode(65 + (labels.size % 26))}`);
      return pre + labels.get(key);
    });
  }
  return out;
}
