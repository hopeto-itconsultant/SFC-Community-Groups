import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-solid";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-700 text-white shadow-sm hover:bg-brand-800",
  secondary: "bg-white text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50",
  ghost: "text-brand-700 hover:bg-brand-50",
  danger: "bg-white text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50",
  "danger-solid": "bg-red-700 text-white shadow-sm hover:bg-red-800",
};

const SIZES = {
  md: "min-h-12 px-4 text-base",
  lg: "min-h-14 px-5 text-base tracking-wide",
};

interface StyleProps {
  variant?: Variant;
  size?: keyof typeof SIZES;
  block?: boolean;
}

function buttonClass({ variant = "primary", size = "md", block }: StyleProps, extra?: string) {
  return [BASE, VARIANTS[variant], SIZES[size], block ? "w-full" : "", extra ?? ""].join(" ");
}

export function Button({
  variant,
  size,
  block,
  className,
  type = "button",
  ...props
}: StyleProps & ComponentProps<"button">) {
  return <button type={type} className={buttonClass({ variant, size, block }, className)} {...props} />;
}

export function LinkButton({
  variant,
  size,
  block,
  className,
  ...props
}: StyleProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClass({ variant, size, block }, className)} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 ${className}`}
      {...props}
    />
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between px-1">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "green" | "slate" | "amber";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Label/value row for read-only details. */
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-base text-slate-900">{children}</dd>
    </div>
  );
}

/** Inline "are you sure?" step for destructive actions such as closing a group or cancelling a plan. */
export function ConfirmCard({
  title,
  description,
  confirmLabel,
  onConfirm,
  onBack,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div role="alertdialog" aria-label={title} className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
      <p className="font-bold text-red-800">{title}</p>
      {description && <p className="mt-1 text-sm text-red-700">{description}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="danger-solid" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-6 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
