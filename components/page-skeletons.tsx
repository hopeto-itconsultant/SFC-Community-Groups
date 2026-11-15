function Bone({ className }: { className: string }) {
  return <div className={`rounded-lg bg-slate-200 ${className}`} />;
}

function CardBone({ className = "h-20" }: { className?: string }) {
  return <div className={`${className} rounded-2xl bg-white ring-1 ring-slate-200/70`} />;
}

/** Shared placeholder so the bottom nav stays put while a screen loads. */
export function PageSkeleton({ children, label = "Loading" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="px-4 pt-4" data-app-loading="">
      <p className="sr-only">{label}</p>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <PageSkeleton>
      <Bone className="h-7 w-40" />
      <div className="mt-4 space-y-2">
        <CardBone />
        <CardBone />
        <CardBone />
      </div>
    </PageSkeleton>
  );
}

export function HomeSkeleton() {
  return (
    <PageSkeleton label="Loading home">
      <div className="-mx-4 -mt-4 h-24 bg-brand-700" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <CardBone className="h-16" />
        <CardBone className="h-16" />
        <CardBone className="h-16" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <CardBone className="h-24" />
        <CardBone className="h-24" />
        <CardBone className="h-24" />
        <CardBone className="h-24" />
      </div>
    </PageSkeleton>
  );
}

export function ReportsSkeleton() {
  return (
    <PageSkeleton label="Loading reports">
      <Bone className="h-7 w-32" />
      <div className="mt-4 space-y-2">
        <CardBone className="h-28" />
        <CardBone className="h-28" />
        <CardBone className="h-28" />
      </div>
    </PageSkeleton>
  );
}

export function DetailSkeleton() {
  return (
    <PageSkeleton>
      <Bone className="h-7 w-48" />
      <CardBone className="mt-4 h-40" />
      <CardBone className="mt-3 h-24" />
    </PageSkeleton>
  );
}

export function SettingsSkeleton() {
  return (
    <PageSkeleton label="Loading settings">
      <Bone className="h-7 w-28" />
      <div className="mt-4 space-y-2">
        <CardBone className="h-16" />
        <CardBone className="h-16" />
        <CardBone className="h-28" />
      </div>
    </PageSkeleton>
  );
}

export function FormSkeleton() {
  return (
    <PageSkeleton label="Loading form">
      <Bone className="h-7 w-44" />
      <CardBone className="mt-4 h-12" />
      <CardBone className="mt-3 h-12" />
      <CardBone className="mt-3 h-28" />
    </PageSkeleton>
  );
}

export function NavSkeleton() {
  return (
    <nav aria-hidden="true" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex min-h-16 flex-col items-center justify-center gap-1">
            <span className="h-8 w-14 rounded-full bg-slate-100" />
            <span className="h-2 w-10 rounded bg-slate-200" />
          </li>
        ))}
      </ul>
    </nav>
  );
}
