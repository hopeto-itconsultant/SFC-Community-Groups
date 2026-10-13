"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { PageHeader } from "./PageHeader";
import { GridIcon, ListIcon } from "./icons";
import { SectionTitle } from "./ui";

export type GroupView = "cards" | "list";

const VIEW_OPTIONS = [
  { value: "cards", label: "Cards view", icon: GridIcon },
  { value: "list", label: "List view", icon: ListIcon },
] as const;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Cards/List preference persisted in localStorage under `storageKey`; defaults to cards. */
export function useStoredView(storageKey: string): [GroupView, (view: GroupView) => void] {
  const view = useSyncExternalStore(
    subscribe,
    () => (window.localStorage.getItem(storageKey) === "list" ? "list" : "cards"),
    () => "cards" as const,
  );

  const setView = (next: GroupView) => {
    window.localStorage.setItem(storageKey, next);
    listeners.forEach((l) => l());
  };

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

/**
 * Shows either the `cards` or the `list` rendering (both prepared on the server)
 * with the toggle in a page header or a section title.
 */
export function ViewSwitch({
  storageKey,
  title,
  subtitle,
  placement,
  cards,
  list,
}: {
  storageKey: string;
  title: string;
  subtitle?: string;
  placement: "page" | "section";
  cards: ReactNode;
  list: ReactNode;
}) {
  const [view, setView] = useStoredView(storageKey);
  const toggle = <ViewToggle view={view} onChange={setView} />;

  return (
    <>
      {placement === "page" ? (
        <PageHeader title={title} subtitle={subtitle} action={toggle} />
      ) : (
        <SectionTitle action={toggle}>{title}</SectionTitle>
      )}
      {view === "cards" ? cards : list}
    </>
  );
}
