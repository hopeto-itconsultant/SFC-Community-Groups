/** Titles the app already hides, until a superadmin saves a different list. */
export const DEFAULT_HIDDEN_SALUTATIONS = [
  "Bro.",
  "Sis.",
  "Dr.",
  "Mr.",
  "Mrs.",
  "Mr. & Mrs.",
  "Ms.",
  "Miss",
  "Pr.",
  "Ps.",
  "Rev.",
  "Pastor",
  "Elder",
] as const;

const MAX_TITLES = 40;
const MAX_TITLE_LENGTH = 80;
const MAX_LIST_LENGTH = 1000;

export function formatHiddenSalutations(list: readonly string[]): string {
  return list.join(", ");
}

/** Same title, ignoring case, periods, and extra spaces. */
function titleKey(token: string): string {
  return token.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

/**
 * Turns a comma-separated field into the titles to hide.
 * Any wording is allowed, including "Mr. & Mrs." An empty field hides nothing.
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
    if (token.length > MAX_TITLE_LENGTH) {
      return { list: [], error: `"${token.slice(0, 40)}…" is too long.` };
    }
    const key = titleKey(token);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(token);
  }
  if (formatHiddenSalutations(list).length > MAX_LIST_LENGTH) {
    return { list: [], error: "That list is too long." };
  }
  return { list };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Periods in a title are optional, and the spaces between its words can vary. */
function titleToPattern(title: string): string {
  const core = title.trim().replace(/\.+$/u, "");
  return core
    .split(/\s+/)
    .filter(Boolean)
    .map((piece) => escapeRegExp(piece).replace(/\\\./g, "\\.?"))
    .join("\\s*");
}

/** Name as shown on screen; drops a leading title unless `show` is on. */
export function displayName(
  name: string,
  show: boolean,
  salutations: readonly string[] = DEFAULT_HIDDEN_SALUTATIONS,
): string {
  if (show) return name;
  const alts = salutations
    .map((item) => item.trim())
    .filter((item) => titleKey(item).length > 0)
    .sort((a, b) => b.length - a.length)
    .map(titleToPattern);
  if (!alts.length) return name;
  const pattern = new RegExp(`^(?:(?:${alts.join("|")})\\.?\\s+)+`, "iu");
  return name.replace(pattern, "") || name;
}
