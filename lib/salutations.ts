/** Titles the app already hides, until a superadmin saves a different list. */
export const DEFAULT_HIDDEN_SALUTATIONS = [
  "Bro.",
  "Sis.",
  "Dr.",
  "Mr.",
  "Mrs.",
  "Ms.",
  "Miss",
  "Pr.",
  "Ps.",
  "Rev.",
  "Pastor",
  "Elder",
] as const;

const MAX_TITLES = 40;
const MAX_TITLE_LENGTH = 40;

/** A title is letters, with spaces, periods, hyphens, or apostrophes. */
const TITLE_TOKEN = /^[\p{L}][\p{L}.'’\- ]{0,39}$/u;

export function formatHiddenSalutations(list: readonly string[]): string {
  return list.join(", ");
}

/**
 * Turns a comma-separated field into the titles to hide.
 * An empty field is valid and hides nothing. A bad title is an error.
 */
export function normalizeHiddenSalutations(input: string): { list: string[]; error?: string } {
  const parts = input
    .split(/[\n,]+/)
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  if (parts.length > MAX_TITLES) return { list: [], error: `Enter ${MAX_TITLES} titles or fewer.` };

  const seen = new Set<string>();
  const list: string[] = [];
  for (const token of parts) {
    if (token.length > MAX_TITLE_LENGTH || !TITLE_TOKEN.test(token)) {
      return { list: [], error: `"${token.slice(0, MAX_TITLE_LENGTH)}" is not a title.` };
    }
    const key = token.replace(/\.+$/u, "").toLowerCase();
    if (!key) return { list: [], error: "Enter titles separated by commas." };
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(token);
  }
  return { list };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Name as shown on screen; drops a leading title unless `show` is on. */
export function displayName(
  name: string,
  show: boolean,
  salutations: readonly string[] = DEFAULT_HIDDEN_SALUTATIONS,
): string {
  if (show) return name;
  const alts = salutations
    .map((item) => item.trim().replace(/\.+$/u, ""))
    .filter((item) => item.length > 0)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  if (!alts.length) return name;
  const pattern = new RegExp(`^(?:(?:${alts.join("|")})\\.?\\s+)+`, "iu");
  return name.replace(pattern, "") || name;
}
