import { CheckIcon } from "./icons";

/** Green confirmation banner shown after something was saved. */
export function SavedBanner({ title }: { title: string }) {
  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-200"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
        <CheckIcon />
      </span>
      <p className="font-bold">{title}</p>
    </div>
  );
}
