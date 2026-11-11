"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { LogOutIcon } from "@/components/icons";
import { Button } from "@/components/ui";

/** Submit control for the sign-out form. Disabled for the whole server action. */
export function SignOutButton() {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!pending) document.querySelector("[data-sign-out]")?.removeAttribute("data-locked");
  }, [pending]);

  return (
    <Button
      type="submit"
      variant="secondary"
      size="lg"
      block
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={(event) => {
        const form = event.currentTarget.closest("form");
        if (pending || form?.hasAttribute("data-locked")) {
          event.preventDefault();
          return;
        }
        form?.setAttribute("data-locked", "");
      }}
    >
      <LogOutIcon width={20} height={20} />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
