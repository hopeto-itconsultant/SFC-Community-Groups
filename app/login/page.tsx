"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { getGroupById, getGroups, getUserById, getUsers } from "@/lib/data-access";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import { ROLE_LABELS } from "@/lib/format";
import { useSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [userId, setUserId] = useState("u-admin");

  const users = getUsers();
  const admins = users.filter((u) => u.role === "admin");
  const groupsWithUsers = getGroups()
    .map((g) => ({ group: g, members: users.filter((u) => u.groupId === g.id) }))
    .filter((g) => g.members.length > 0);

  // Role-only labels (no personal names); numbered when a group has several of the same role.
  const roleLabels = new Map<string, string>();
  for (const { members } of groupsWithUsers) {
    for (const u of members) {
      const sameRole = members.filter((m) => m.role === u.role);
      const n = sameRole.length > 1 ? ` ${sameRole.indexOf(u) + 1}` : "";
      roleLabels.set(u.id, `${ROLE_LABELS[u.role]}${n}`);
    }
  }

  const selected = getUserById(userId);
  const selectedGroup = getGroupById(selected?.groupId);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    login(userId);
    router.push("/home");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src={LOGO_SRC} alt="" width={80} height={80} priority className="rounded-2xl shadow-sm" />
        <h1 className="mt-4 text-2xl font-bold">{APP_NAME}</h1>
        <p className="mt-1 text-slate-500">Management &amp; Reporting</p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleContinue} className="space-y-5">
          <div>
            <h2 className="text-lg font-bold">Login</h2>
            <p className="text-sm text-slate-500">Prototype: choose a demo user to continue.</p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Select demo user</span>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="block min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {admins.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
              {groupsWithUsers.map(({ group, members }) => (
                <optgroup key={group.id} label={group.name}>
                  {members.map((u) => (
                    <option key={u.id} value={u.id}>
                      {group.name} – {roleLabels.get(u.id)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          {selected && (
            <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
              <p className="font-semibold">{selectedGroup ? selectedGroup.name : "All groups"}</p>
              <p>{roleLabels.get(selected.id) ?? ROLE_LABELS[selected.role]}</p>
            </div>
          )}

          <Button type="submit" size="lg" block>
            Continue
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-400">
        Prototype only. No real accounts and no data is saved.
      </p>
    </div>
  );
}
