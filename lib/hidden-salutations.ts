import "server-only";

import { cache } from "react";
import {
  DEFAULT_HIDDEN_SALUTATIONS,
  formatHiddenSalutations,
  normalizeHiddenSalutations,
} from "@/lib/salutations";
import { createClient } from "@/lib/supabase/server";

const fallbackList = [...DEFAULT_HIDDEN_SALUTATIONS];
const fallbackText = formatHiddenSalutations(fallbackList);

/** The shared list of titles to hide, and the comma-separated text for the settings field. */
export const getHiddenSalutationsSetting = cache(async (): Promise<{ text: string; list: string[] }> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("hidden_salutations")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return { text: fallbackText, list: fallbackList };
    const parsed = normalizeHiddenSalutations(data.hidden_salutations);
    if (parsed.error) return { text: fallbackText, list: fallbackList };
    return { text: formatHiddenSalutations(parsed.list), list: parsed.list };
  } catch {
    return { text: fallbackText, list: fallbackList };
  }
});

/** Titles to hide on screens where the signed-in person has titles turned off. */
export async function getHiddenSalutations(): Promise<string[]> {
  return (await getHiddenSalutationsSetting()).list;
}
