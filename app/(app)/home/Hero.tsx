import Image from "next/image";
import type { CurrentUser } from "@/data/types";
import { getNameDisplay } from "@/lib/auth";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import { ROLE_LABELS } from "@/lib/format";

export async function Hero({ user, subtitle }: { user: CurrentUser; subtitle?: string }) {
  const welcomeName = (await getNameDisplay())(user.name);
  return (
    <div className="bg-brand-700 px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand-100">
          <Image
            src={LOGO_SRC}
            alt=""
            width={24}
            height={24}
            unoptimized
            className="shrink-0 rounded-md ring-1 ring-white/30"
          />
          <span className="truncate">{APP_NAME}</span>
        </div>
        <h1 className="shrink-0 text-xs text-brand-100">
          Welcome <span className="italic">{welcomeName}</span>
        </h1>
      </div>
      {subtitle && (
        <div className="mt-1 flex items-center gap-2">
          <span className="truncate font-semibold">{subtitle}</span>
          <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      )}
    </div>
  );
}
