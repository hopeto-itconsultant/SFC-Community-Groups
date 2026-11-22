const WORD_LIMIT = 3;

/** Whole value, after trim and lowercasing, means the place is not confirmed. */
const UNCONFIRMED_VALUES = new Set([
  "yet to confirm",
  "to be confirmed",
  "tbc",
  "tbd",
  "not confirmed",
  "not decided",
  "unconfirmed",
  "to be decided",
  "will update",
  "later",
  "-",
  "na",
  "n/a",
]);

/**
 * Hide the line when one of these sits inside a longer note,
 * such as "Yet to confirm the location".
 */
const UNCONFIRMED_PHRASES = [
  "yet to confirm",
  "to be confirmed",
  "not confirmed",
  "not decided",
  "unconfirmed",
  "to be decided",
  "will update",
];

function normalized(location: string): string {
  return location.trim().toLowerCase().replace(/\s+/g, " ");
}

/** True when this is a real meeting place, not blank and not a "not confirmed" note. */
export function isConfirmedLocation(location: string | null | undefined): location is string {
  if (typeof location !== "string") return false;
  const place = normalized(location);
  if (!place || UNCONFIRMED_VALUES.has(place)) return false;
  return !UNCONFIRMED_PHRASES.some((phrase) => place.includes(phrase));
}

/** First three words, with an ellipsis when the place is longer. */
export function shortLocation(location: string): string {
  const words = location.trim().split(/\s+/);
  if (words.length <= WORD_LIMIT) return words.join(" ");
  return `${words.slice(0, WORD_LIMIT).join(" ")}…`;
}
