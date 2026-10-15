"use client";

import { type ComponentType, type ReactNode, type SVGProps, useSyncExternalStore } from "react";
import { PageHeader } from "./PageHeader";
import { CalendarIcon, GridIcon, ListIcon } from "./icons";
import { SectionTitle } from "./ui";

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

const REPORTS_LAYOUT_KEY = "sfc.reportsLayout";

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

/** Calendar/Grid preference persisted in localStorage under `storageKey`; defaults to grid. */
export function useStoredReportLayout(storageKey: string): [ReportLayout, (view: ReportLayout) => void] {
  const view = useSyncExternalStore(
    subscribe,
    () => (window.localStorage.getItem(storageKey) === "calendar" ? "calendar" : "grid"),
    () => "grid" as const,
  );

  const setView = (next: ReportLayout) => {
    window.localStorage.setItem(storageKey, next);
    listeners.forEach((l) => l());
  };

  return [view, setView];
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

/** Count line, period chip, and calendar/grid toggle, then the chosen report list. */
export function ReportLayoutSwitch({
  summary,
  periodChip,
  grid,
  calendar,
}: {
  summary: ReactNode;
  periodChip?: ReactNode;
  grid: ReactNode;
  calendar: ReactNode;
}) {
  const [layout, setLayout] = useStoredReportLayout(REPORTS_LAYOUT_KEY);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">{summary}</div>
        <div className="flex shrink-0 items-center gap-2">
          {periodChip}
          <ReportLayoutToggle view={layout} onChange={setLayout} />
        </div>
      </div>
      {layout === "calendar" ? calendar : grid}
    </>
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
  sectionClassName,
  cards,
  list,
}: {
  storageKey: string;
  title: string;
  subtitle?: string;
  placement: "page" | "section";
  sectionClassName?: string;
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
        <SectionTitle action={toggle} className={sectionClassName}>
          {title}
        </SectionTitle>
      )}
      {view === "cards" ? cards : list}
    </>
  );
}
