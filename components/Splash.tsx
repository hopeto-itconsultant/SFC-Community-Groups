import Image from "next/image";
import { LOGO_SRC } from "@/lib/brand";

export function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Image
        src={LOGO_SRC}
        alt=""
        width={64}
        height={64}
        priority
        unoptimized
        className="rounded-2xl"
      />
    </div>
  );
}
