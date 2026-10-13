export default function Loading() {
  return (
    <div className="px-4 pt-4" aria-hidden="true">
      <div className="h-7 w-40 rounded-lg bg-slate-200" />
      <div className="mt-4 space-y-2">
        <div className="h-20 rounded-2xl bg-white ring-1 ring-slate-200/70" />
        <div className="h-20 rounded-2xl bg-white ring-1 ring-slate-200/70" />
        <div className="h-20 rounded-2xl bg-white ring-1 ring-slate-200/70" />
      </div>
    </div>
  );
}
