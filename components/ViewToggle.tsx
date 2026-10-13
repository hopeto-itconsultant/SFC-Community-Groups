"use client";

import { useCallback, useSyncExternalStore } from "react";
import { GridIcon, ListIcon } from "./icons";

export type GroupView = "cards" | "list";

const VIEW_OPTIONS = [
  { value: "cards", label: "Cards view", icon: GridIcon },
  { value: "list", label: "List view", icon: ListIcon },
] as const;

function subscribeView(storageKey: string, listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) listener();
  };
  const name = `sfc-view:${storageKey}`;
  window.addEventListener("storage", onStorage);
  window.addEventListener(name, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(name, listener);
  };
}

/** Cards/List preference persisted in localStorage under `storageKey`; defaults to cards. */
export function useStoredView(storageKey: string): [GroupView, (view: GroupView) => void] {
  const view = useSyncExternalStore(
    (listener) => subscribeView(storageKey, listener),
    () => (window.localStorage.getItem(storageKey) === "list" ? "list" : "cards"),
    () => "cards" as const,
  );

  const setView = useCallback((next: GroupView) => {
    window.localStorage.setItem(storageKey, next);
    window.dispatchEvent(new Event(`sfc-view:${storageKey}`));
  }, [storageKey]);

  return [view, setView];
}

export function ViewToggle({ view, onChange }: { view: GroupView; onChange: (view: GroupView) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5">
      {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={`flex h-7 w-8 items-center justify-center rounded-md transition ${
              active ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"
            }`}
          >
            <Icon width={16} height={16} />
          </button>
        );
      })}
    </div>
  );
}
