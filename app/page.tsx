"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Splash } from "@/components/Splash";
import { useSession } from "@/lib/session";

export default function RootPage() {
  const { ready, user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready) router.replace(user ? "/home" : "/login");
  }, [ready, user, router]);

  return <Splash />;
}
