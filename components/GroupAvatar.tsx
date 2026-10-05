import Image from "next/image";
import type { CommunityGroup } from "@/data/types";

const PALETTE = [
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
  "bg-lime-100 text-lime-700",
  "bg-slate-200 text-slate-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function initials(name: string): string {
  const words = name
    .replace(/'s\b/g, "")
    .split(/\s+/)
    .filter((w) => !["the", "cg"].includes(w.toLowerCase()));
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function colorFor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const SIZES = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
};

export function GroupAvatar({
  group,
  size = "md",
}: {
  group: CommunityGroup;
  size?: keyof typeof SIZES;
}) {
  if (group.photo) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-xl ${SIZES[size]}`}>
        <Image src={group.photo} alt={group.name} fill sizes="64px" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold ${SIZES[size]} ${colorFor(group.id)}`}
    >
      {initials(group.name)}
    </div>
  );
}
