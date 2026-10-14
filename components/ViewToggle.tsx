"use client";

import { useCallback, useState, useSyncExternalStore, type ComponentType, type SVGProps } from "react";
import { CalendarIcon, GridIcon, ListIcon } from "./icons";

export type GroupView = "cards" | "list";
export type ReportLayout = "calendar" | "grid";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const VIEW_OPTIONS = [
  { value: "cards", label: "Cards view", icon: GridIcon },
  { value: "list", label: "List view", icon: ListIcon },
] as const;

const LAYOUT_OPTIONS = [
  { value: "calendar", label: "Calendar view", icon: CalendarIcon },
  { value: "grid", label: "Grid view", icon: GridIcon },
] as const;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function readStored<T extends string>(storageKey: string, allowed: readonly T[], fallback: T): T {
  const stored = window.localStorage.getItem(storageKey);
  return allowed.find((value) => value === stored) ?? fallback;
}

function useStoredChoice<T extends string>(
  storageKey: string,
  allowed: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const view = useSyncExternalStore(
    subscribe,
    () => readStored(storageKey, allowed, fallback),
    () => fallback,
  );

  const setView = useCallback(
    (next: T) => {
      window.localStorage.setItem(storageKey, next);
      notify();
    },
    [storageKey],
  );

  return [view, setView];
}

/** Cards/List preference persisted in localStorage under `storageKey`; defaults to cards. */
export function useStoredView(storageKey: string): [GroupView, (view: GroupView) => void] {
  const [view, setViewState] = useState<GroupView>(() =>
    window.localStorage.getItem(storageKey) === "list" ? "list" : "cards",
  );

  const setView = (next: GroupView) => {
    setViewState(next);
    window.localStorage.setItem(storageKey, next);
  };

  return [view, setView];
}

/** Calendar/Grid preference persisted in localStorage under `storageKey`; defaults to grid. */
export function useStoredReportLayout(storageKey: string): [ReportLayout, (view: ReportLayout) => void] {
  return useStoredChoice(storageKey, ["calendar", "grid"] as const, "grid");
}

function SegmentedIconToggle<T extends string>({
  view,
  onChange,
  options,
}: {
  view: T;
  onChange: (view: T) => void;
  options: readonly { value: T; label: string; icon: IconComponent }[];
}) {
  return (
    <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5">
      {options.map(({ value, label, icon: Icon }) => {
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

export function ViewToggle({ view, onChange }: { view: GroupView; onChange: (view: GroupView) => void }) {
  return <SegmentedIconToggle view={view} onChange={onChange} options={VIEW_OPTIONS} />;
}

export function ReportLayoutToggle({
  view,
  onChange,
}: {
  view: ReportLayout;
  onChange: (view: ReportLayout) => void;
}) {
  return <SegmentedIconToggle view={view} onChange={onChange} options={LAYOUT_OPTIONS} />;
}
