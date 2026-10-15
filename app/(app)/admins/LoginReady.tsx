"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/ui";
import { APP_NAME } from "@/lib/brand";
import { copyText } from "@/lib/copy-text";
import { splitMobile } from "@/lib/countries";
import { useDisplayName } from "@/lib/session";

/** Shows a new login once, so the Admin can copy it before it disappears. */
export function LoginReady({
  name,
  username,
  mobile,
  password,
  doneHref = "/admins",
  onDone,
}: {
  name: string;
  username?: string;
  mobile?: string;
  password: string;
  doneHref?: string;
  onDone?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const shownMobile = mobile ? splitMobile(mobile).national : "";
  const lines = [
    username ? `Username: ${username}` : null,
    shownMobile ? `Mobile: ${shownMobile}` : null,
    `Password: ${password}`,
  ].filter((line): line is string => Boolean(line));
  const shown = useDisplayName();
  const shownName = shown(name);
  const message = `${APP_NAME} login\n${window.location.origin}\n${shownName}\n${lines.join("\n")}`;

  return (
    <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
      <p className="font-bold">Login ready for {shownName}</p>
      <p className="mt-1">
        {username && (
          <>
            Username: <span className="font-semibold">{username}</span>
            <br />
          </>
        )}
        {shownMobile && (
          <>
            Mobile: <span className="font-semibold">{shownMobile}</span>
            <br />
          </>
        )}
        Password: <span className="font-semibold">{password}</span>
      </p>
      <p className="mt-1 text-xs text-emerald-700">The password isn&apos;t shown again, so send it now.</p>
      {copyFailed && <p className="mt-1 text-xs font-medium text-red-700">Could not copy. Select the details above.</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            void copyText(message).then((ok) => {
              setCopied(ok);
              setCopyFailed(!ok);
            });
          }}
        >
          {copied ? "Copied" : "Copy details"}
        </Button>
        {onDone ? <Button onClick={onDone}>Done</Button> : <LinkButton href={doneHref}>Done</LinkButton>}
      </div>
    </div>
  );
}
